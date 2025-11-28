from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class Category(models.Model):
    """Product category model."""
    
    title = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['title']
        indexes = [
            models.Index(fields=['title']),
        ]
    
    def __str__(self):
        return self.title


class Supplier(models.Model):
    """Supplier model."""
    
    name = models.CharField(max_length=150, unique=True)
    contact_info = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return self.name


class Item(models.Model):
    """Inventory item model."""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    sku = models.CharField(
        max_length=50,
        unique=True,
        help_text='Stock Keeping Unit - unique identifier'
    )
    quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='items'
    )
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items'
    )
    threshold_level = models.IntegerField(
        default=10,
        validators=[MinValueValidator(0)],
        help_text='Low stock alert threshold'
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['quantity']),
        ]
    
    def __str__(self):
        return f"{self.name} (SKU: {self.sku})"
    
    def is_low_stock(self):
        """Check if item is below threshold."""
        return self.quantity <= self.threshold_level
    
    def get_stock_status(self):
        """Get human-readable stock status."""
        if self.quantity == 0:
            return 'Out of Stock'
        elif self.is_low_stock():
            return 'Low Stock'
        else:
            return 'In Stock'
    
    def get_total_value(self):
        """Calculate total inventory value for this item."""
        return self.quantity * self.unit_price
