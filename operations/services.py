from django.db import transaction
from django.core.exceptions import ValidationError
from .models import StockTransaction
from inventory.models import Item


class StockOperationService:
    """Service for handling stock operations."""
    
    @staticmethod
    @transaction.atomic
    def stock_in(item, quantity, user, notes=''):
        """
        Add stock to inventory.
        
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
        
        previous_quantity = item.quantity
        item.quantity += quantity
        item.save()
        
        transaction_obj = StockTransaction.objects.create(
            item=item,
            transaction_type='IN',
            quantity_changed=quantity,
            previous_quantity=previous_quantity,
            new_quantity=item.quantity,
            user=user,
            notes=notes
        )
        
        return transaction_obj
    
    @staticmethod
    @transaction.atomic
    def stock_out(item, quantity, user, notes=''):
        """
        Remove stock from inventory.
        
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
        
        if item.quantity < quantity:
            raise ValidationError(
                f'Insufficient stock. Available: {item.quantity}, Requested: {quantity}'
            )
        
        previous_quantity = item.quantity
        item.quantity -= quantity
        item.save()
        
        transaction_obj = StockTransaction.objects.create(
            item=item,
            transaction_type='OUT',
            quantity_changed=quantity,
            previous_quantity=previous_quantity,
            new_quantity=item.quantity,
            user=user,
            notes=notes
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
        
        previous_quantity = item.quantity
        quantity_changed = abs(new_quantity - previous_quantity)
        
        item.quantity = new_quantity
        item.save()
        
        transaction_obj = StockTransaction.objects.create(
            item=item,
            transaction_type='ADJUSTMENT',
            quantity_changed=quantity_changed,
            previous_quantity=previous_quantity,
            new_quantity=item.quantity,
            user=user,
            notes=notes
        )
        
        return transaction_obj
