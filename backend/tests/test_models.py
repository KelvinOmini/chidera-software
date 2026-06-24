import pytest
from django.test import TestCase
from accounts.models import CustomUser
from inventory.models import Item, Category, Supplier
from operations.models import StockTransaction


@pytest.mark.django_db
class TestCustomUser(TestCase):
    """Test CustomUser model."""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='staff'
        )
    
    def test_user_creation(self):
        """Test user creation."""
        assert self.user.username == 'testuser'
        assert self.user.role == 'staff'
        assert not self.user.is_admin()
    
    def test_admin_user(self):
        """Test admin user."""
        admin = CustomUser.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            role='admin'
        )
        assert admin.is_admin()
        assert admin.can_manage_inventory()


@pytest.mark.django_db
class TestInventoryModels(TestCase):
    """Test inventory models."""
    
    def setUp(self):
        self.category = Category.objects.create(
            title='Electronics',
            description='Electronic items'
        )
        
        self.supplier = Supplier.objects.create(
            name='Tech Supplier',
            email='supplier@example.com'
        )
        
        self.item = Item.objects.create(
            name='Laptop',
            sku='LAPTOP-001',
            quantity=10,
            category=self.category,
            supplier=self.supplier,
            threshold_level=5,
            unit_price=999.99
        )
    
    def test_item_creation(self):
        """Test item creation."""
        assert self.item.name == 'Laptop'
        assert self.item.quantity == 10
        assert not self.item.is_low_stock()
    
    def test_low_stock_alert(self):
        """Test low stock alert."""
        self.item.quantity = 3
        self.item.save()
        assert self.item.is_low_stock()
        assert self.item.get_stock_status() == 'Low Stock'
    
    def test_out_of_stock(self):
        """Test out of stock status."""
        self.item.quantity = 0
        self.item.save()
        assert self.item.get_stock_status() == 'Out of Stock'
    
    def test_total_value(self):
        """Test total inventory value calculation."""
        total_value = self.item.get_total_value()
        assert total_value == 9999.90


@pytest.mark.django_db
class TestStockTransaction(TestCase):
    """Test stock transaction model."""
    
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
    
    def test_stock_in_transaction(self):
        """Test stock in transaction."""
        transaction = StockTransaction.objects.create(
            item=self.item,
            transaction_type='IN',
            quantity_changed=50,
            previous_quantity=100,
            new_quantity=150,
            user=self.user
        )
        
        assert transaction.transaction_type == 'IN'
        assert transaction.quantity_changed == 50
    
    def test_stock_out_transaction(self):
        """Test stock out transaction."""
        transaction = StockTransaction.objects.create(
            item=self.item,
            transaction_type='OUT',
            quantity_changed=20,
            previous_quantity=100,
            new_quantity=80,
            user=self.user
        )
        
        assert transaction.transaction_type == 'OUT'
        assert transaction.quantity_changed == 20
