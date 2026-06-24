from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from inventory.models import Item

User = get_user_model()


class StockTransaction(models.Model):
    """Model for tracking stock in/out transactions."""
    
    TRANSACTION_TYPE_CHOICES = (
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('ADJUSTMENT', 'Adjustment'),
    )
    
    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        related_name='transactions'
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE_CHOICES
    )
    quantity_changed = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text='Quantity added or removed'
    )
    previous_quantity = models.IntegerField(
        validators=[MinValueValidator(0)]
    )
    new_quantity = models.IntegerField(
        validators=[MinValueValidator(0)]
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='stock_transactions'
    )
    notes = models.TextField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True, help_text='IP address of the user performing the transaction')
    user_agent = models.TextField(null=True, blank=True, help_text='Browser user agent for security tracking')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['item', '-timestamp']),
            models.Index(fields=['transaction_type', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.item.name} ({self.quantity_changed})"
    
    def get_transaction_icon(self):
        """Get icon for transaction type."""
        icons = {
            'IN': '📥',
            'OUT': '📤',
            'ADJUSTMENT': '⚙️',
        }
        return icons.get(self.transaction_type, '📋')
