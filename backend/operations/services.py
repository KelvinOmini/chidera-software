from django.db import transaction
from django.db.models import F
from django.core.exceptions import ValidationError
from .models import StockTransaction
from inventory.models import Item
import logging

logger = logging.getLogger(__name__)


class StockOperationService:
    """Service for handling stock operations with proper concurrency control."""
    
    @staticmethod
    @transaction.atomic
    def stock_in(item, quantity, user, notes=''):
        """
        Add stock to inventory.
        
        Uses select_for_update() to prevent race conditions and F() expressions
        for atomic database-level updates.
        
        Args:
            item: Item instance
            quantity: Quantity to add
            user: User performing the operation
            notes: Optional notes
            
        Returns:
            StockTransaction instance
        """
        if quantity <= 0:
            raise ValidationError('Quantity must be greater than 0')
        
        # Lock the row to prevent concurrent modifications
        locked_item = Item.objects.select_for_update().get(pk=item.pk)
        previous_quantity = locked_item.quantity
        
        # Use F() expression for atomic update at database level
        Item.objects.filter(pk=item.pk).update(quantity=F('quantity') + quantity)
        locked_item.refresh_from_db()
        
        transaction_obj = StockTransaction.objects.create(
            item=locked_item,
            transaction_type='IN',
            quantity_changed=quantity,
            previous_quantity=previous_quantity,
            new_quantity=locked_item.quantity,
            user=user,
            notes=notes
        )
        
        logger.info(
            f"Stock IN: {quantity} units added to {locked_item.name} "
            f"(SKU: {locked_item.sku}) by {user.username}. "
            f"Quantity: {previous_quantity} → {locked_item.quantity}"
        )
        
        return transaction_obj
    
    @staticmethod
    @transaction.atomic
    def stock_out(item, quantity, user, notes=''):
        """
        Remove stock from inventory.
        
        Uses select_for_update() to prevent race conditions.
        
        Args:
            item: Item instance
            quantity: Quantity to remove
            user: User performing the operation
            notes: Optional notes
            
        Returns:
            StockTransaction instance
            
        Raises:
            ValidationError: If quantity is invalid or insufficient stock
        """
        if quantity <= 0:
            raise ValidationError('Quantity must be greater than 0')
        
        # Lock the row to prevent concurrent modifications
        locked_item = Item.objects.select_for_update().get(pk=item.pk)
        
        if locked_item.quantity < quantity:
            raise ValidationError(
                f'Insufficient stock. Available: {locked_item.quantity}, Requested: {quantity}'
            )
        
        previous_quantity = locked_item.quantity
        
        # Use F() expression for atomic update
        Item.objects.filter(pk=item.pk).update(quantity=F('quantity') - quantity)
        locked_item.refresh_from_db()
        
        transaction_obj = StockTransaction.objects.create(
            item=locked_item,
            transaction_type='OUT',
            quantity_changed=quantity,
            previous_quantity=previous_quantity,
            new_quantity=locked_item.quantity,
            user=user,
            notes=notes
        )
        
        # Log warning if stock is now low
        if locked_item.is_low_stock():
            logger.warning(
                f"LOW STOCK ALERT: {locked_item.name} (SKU: {locked_item.sku}) "
                f"is now at {locked_item.quantity} units "
                f"(threshold: {locked_item.threshold_level})"
            )
        
        logger.info(
            f"Stock OUT: {quantity} units removed from {locked_item.name} "
            f"(SKU: {locked_item.sku}) by {user.username}. "
            f"Quantity: {previous_quantity} → {locked_item.quantity}"
        )
        
        return transaction_obj
    
    @staticmethod
    @transaction.atomic
    def adjust_stock(item, new_quantity, user, notes=''):
        """
        Adjust stock to a specific quantity.
        
        Args:
            item: Item instance
            new_quantity: New quantity
            user: User performing the operation
            notes: Optional notes
            
        Returns:
            StockTransaction instance
            
        Raises:
            ValidationError: If new quantity is invalid
        """
        if new_quantity < 0:
            raise ValidationError('Quantity cannot be negative')
        
        # Lock the row to prevent concurrent modifications
        locked_item = Item.objects.select_for_update().get(pk=item.pk)
        
        previous_quantity = locked_item.quantity
        quantity_changed = abs(new_quantity - previous_quantity)
        
        locked_item.quantity = new_quantity
        locked_item.save(update_fields=['quantity', 'updated_at'])
        
        transaction_obj = StockTransaction.objects.create(
            item=locked_item,
            transaction_type='ADJUSTMENT',
            quantity_changed=quantity_changed,
            previous_quantity=previous_quantity,
            new_quantity=locked_item.quantity,
            user=user,
            notes=notes
        )
        
        logger.info(
            f"Stock ADJUSTMENT: {locked_item.name} (SKU: {locked_item.sku}) "
            f"adjusted by {user.username}. "
            f"Quantity: {previous_quantity} → {new_quantity}"
        )
        
        return transaction_obj
