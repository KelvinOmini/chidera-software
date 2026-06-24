import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from accounts.models import CustomUser
from inventory.models import Item, Category
from operations.models import StockTransaction
from operations.services import StockOperationService


@pytest.mark.django_db
class TestStockOperationService(TestCase):
    """Test stock operation service."""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        self.category = Category.objects.create(title='Test')
        self.item = Item.objects.create(
            name='Test Item',
            sku='TEST-001',
            quantity=100,
            category=self.category,
            threshold_level=10
        )
    
    def test_stock_in(self):
        """Test stock in operation."""
        initial_quantity = self.item.quantity
        
        transaction = StockOperationService.stock_in(
            self.item, 50, self.user, 'Test stock in'
        )
        
        self.item.refresh_from_db()
        assert self.item.quantity == initial_quantity + 50
        assert transaction.transaction_type == 'IN'
        assert transaction.quantity_changed == 50
    
    def test_stock_out(self):
        """Test stock out operation."""
        initial_quantity = self.item.quantity
        
        transaction = StockOperationService.stock_out(
            self.item, 30, self.user, 'Test stock out'
        )
        
        self.item.refresh_from_db()
        assert self.item.quantity == initial_quantity - 30
        assert transaction.transaction_type == 'OUT'
        assert transaction.quantity_changed == 30
    
    def test_stock_out_insufficient(self):
        """Test stock out with insufficient quantity."""
        with pytest.raises(ValidationError):
            StockOperationService.stock_out(
                self.item, 200, self.user, 'Insufficient stock'
            )
    
    def test_stock_out_invalid_quantity(self):
        """Test stock out with invalid quantity."""
        with pytest.raises(ValidationError):
            StockOperationService.stock_out(
                self.item, -10, self.user, 'Invalid quantity'
            )
    
    def test_adjust_stock(self):
        """Test stock adjustment."""
        transaction = StockOperationService.adjust_stock(
            self.item, 75, self.user, 'Adjustment'
        )
        
        self.item.refresh_from_db()
        assert self.item.quantity == 75
        assert transaction.transaction_type == 'ADJUSTMENT'
    
    def test_adjust_stock_negative(self):
        """Test adjustment with negative quantity."""
        with pytest.raises(ValidationError):
            StockOperationService.adjust_stock(
                self.item, -10, self.user, 'Invalid'
            )
