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


@pytest.mark.django_db
class TestCheckLowStockLevelsTask(TestCase):
    """Test check_low_stock_levels Celery background task and Alert records."""
    
    def setUp(self):
        from django.core import mail
        mail.outbox = []
        
        self.admin = CustomUser.objects.create_user(
            username='adminuser',
            email='admin@example.com',
            password='password123',
            role='admin'
        )
        self.category = Category.objects.create(title='Gadgets')
        
        self.low_stock_item = Item.objects.create(
            name='Wireless Mouse',
            sku='MOUSE-123',
            quantity=3,
            threshold_level=10,
            category=self.category
        )
        self.normal_item = Item.objects.create(
            name='USB Keyboard',
            sku='KEYBOARD-456',
            quantity=25,
            threshold_level=10,
            category=self.category
        )
        
    def test_check_low_stock_levels_creates_alerts_and_sends_email(self):
        """Test check_low_stock_levels task creates Alert record and sends formatted email to admins."""
        from operations.tasks import check_low_stock_levels
        from operations.models import Alert
        from django.core import mail
        
        result = check_low_stock_levels()
        
        # Verify execution result
        assert '1 low stock items processed' in result
        
        # Verify Alert DB record creation
        alert = Alert.objects.get(item=self.low_stock_item, is_resolved=False)
        assert alert.alert_type == 'LOW_STOCK'
        assert alert.quantity_at_alert == 3
        assert alert.threshold_at_alert == 10
        assert 'Wireless Mouse' in alert.message
        
        # Verify email dispatch to admin email address
        assert len(mail.outbox) == 1
        email = mail.outbox[0]
        assert 'Low Stock Item(s) Detected' in email.subject
        assert 'Wireless Mouse' in email.body
        assert 'MOUSE-123' in email.body
        assert 'Current Quantity: 3' in email.body
        assert 'Threshold Level: 10' in email.body
        assert 'admin@example.com' in email.to
        
    def test_check_low_stock_levels_no_low_stock(self):
        """Test task when all items are above threshold."""
        from operations.tasks import check_low_stock_levels
        from operations.models import Alert
        from django.core import mail
        
        # Update low stock item to be above threshold
        self.low_stock_item.quantity = 50
        self.low_stock_item.save()
        
        result = check_low_stock_levels()
        assert result == 'No low stock items'
        assert Alert.objects.count() == 0
        assert len(mail.outbox) == 0

