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
    def stock_in(item, quantity, user, notes='', ip_address=None, user_agent=None):
        if quantity <= 0:
            raise ValidationError('Quantity must be greater than 0')
        
        locked_item = Item.objects.select_for_update().get(pk=item.pk)
        previous_quantity = locked_item.quantity
        
        Item.objects.filter(pk=item.pk).update(quantity=F('quantity') + quantity)
        locked_item.refresh_from_db()
        
        transaction_obj = StockTransaction.objects.create(
            item=locked_item,
            transaction_type='IN',
            quantity_changed=quantity,
            previous_quantity=previous_quantity,
            new_quantity=locked_item.quantity,
            user=user,
            notes=notes,
            ip_address=ip_address,
            user_agent=user_agent
        )
        return transaction_obj

    @staticmethod
    @transaction.atomic
    def stock_out(item, quantity, user, notes='', ip_address=None, user_agent=None):
        if quantity <= 0:
            raise ValidationError('Quantity must be greater than 0')
        
        locked_item = Item.objects.select_for_update().get(pk=item.pk)
        if locked_item.quantity < quantity:
            raise ValidationError(f'Insufficient stock. Available: {locked_item.quantity}, Requested: {quantity}')
        
        previous_quantity = locked_item.quantity
        Item.objects.filter(pk=item.pk).update(quantity=F('quantity') - quantity)
        locked_item.refresh_from_db()
        
        transaction_obj = StockTransaction.objects.create(
            item=locked_item,
            transaction_type='OUT',
            quantity_changed=quantity,
            previous_quantity=previous_quantity,
            new_quantity=locked_item.quantity,
            user=user,
            notes=notes,
            ip_address=ip_address,
            user_agent=user_agent
        )
        return transaction_obj

    @staticmethod
    @transaction.atomic
    def adjust_stock(item, new_quantity, user, notes='', ip_address=None, user_agent=None):
        if new_quantity < 0:
            raise ValidationError('Quantity cannot be negative')
        
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
            notes=notes,
            ip_address=ip_address,
            user_agent=user_agent
        )
        return transaction_obj
