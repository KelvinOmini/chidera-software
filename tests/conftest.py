"""
Test configuration and fixtures using factory_boy.
"""

import pytest
from factory import django as factory_django
from factory import Faker, SubFactory, Sequence, LazyAttribute
from accounts.models import CustomUser
from inventory.models import Item, Category, Supplier
from operations.models import StockTransaction


# ============================================================
# Factories
# ============================================================

class UserFactory(factory_django.DjangoModelFactory):
    """Factory for creating test users."""
    
    class Meta:
        model = CustomUser
        skip_postgeneration_save = True
    
    username = Sequence(lambda n: f'user_{n}')
    email = LazyAttribute(lambda obj: f'{obj.username}@example.com')
    first_name = Faker('first_name')
    last_name = Faker('last_name')
    role = 'staff'
    is_active = True
    
    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop('password', 'testpass123')
        user = model_class(**kwargs)
        user.set_password(password)
        user.save()
        return user


class AdminFactory(UserFactory):
    """Factory for creating admin users."""
    role = 'admin'
    username = Sequence(lambda n: f'admin_{n}')


class ManagerFactory(UserFactory):
    """Factory for creating manager users."""
    role = 'manager'
    username = Sequence(lambda n: f'manager_{n}')


class CategoryFactory(factory_django.DjangoModelFactory):
    """Factory for creating test categories."""
    
    class Meta:
        model = Category
    
    title = Sequence(lambda n: f'Category {n}')
    description = Faker('sentence')


class SupplierFactory(factory_django.DjangoModelFactory):
    """Factory for creating test suppliers."""
    
    class Meta:
        model = Supplier
    
    name = Sequence(lambda n: f'Supplier {n}')
    contact_info = Faker('name')
    email = Faker('email')
    phone = Faker('phone_number')
    address = Faker('address')


class ItemFactory(factory_django.DjangoModelFactory):
    """Factory for creating test inventory items."""
    
    class Meta:
        model = Item
    
    name = Sequence(lambda n: f'Item {n}')
    description = Faker('sentence')
    sku = Sequence(lambda n: f'SKU-{n:04d}')
    quantity = 100
    category = SubFactory(CategoryFactory)
    supplier = SubFactory(SupplierFactory)
    threshold_level = 10
    unit_price = 29.99


class StockTransactionFactory(factory_django.DjangoModelFactory):
    """Factory for creating test stock transactions."""
    
    class Meta:
        model = StockTransaction
    
    item = SubFactory(ItemFactory)
    transaction_type = 'IN'
    quantity_changed = 50
    previous_quantity = 100
    new_quantity = 150
    user = SubFactory(UserFactory)
    notes = Faker('sentence')


# ============================================================
# Fixtures
# ============================================================

@pytest.fixture
def user(db):
    """Create a standard staff user."""
    return UserFactory()


@pytest.fixture
def admin_user(db):
    """Create an admin user."""
    return AdminFactory()


@pytest.fixture
def manager_user(db):
    """Create a manager user."""
    return ManagerFactory()


@pytest.fixture
def category(db):
    """Create a test category."""
    return CategoryFactory(title='Electronics')


@pytest.fixture
def supplier(db):
    """Create a test supplier."""
    return SupplierFactory(name='Tech Supplier Co.')


@pytest.fixture
def item(db, category, supplier):
    """Create a test inventory item."""
    return ItemFactory(
        name='Laptop',
        sku='LAPTOP-001',
        quantity=100,
        category=category,
        supplier=supplier,
        threshold_level=10,
        unit_price=999.99,
    )


@pytest.fixture
def low_stock_item(db, category, supplier):
    """Create an item that is below threshold."""
    return ItemFactory(
        name='Low Stock Item',
        sku='LOW-001',
        quantity=3,
        category=category,
        supplier=supplier,
        threshold_level=10,
        unit_price=49.99,
    )


@pytest.fixture
def out_of_stock_item(db, category, supplier):
    """Create an item with zero quantity."""
    return ItemFactory(
        name='Out of Stock Item',
        sku='OOS-001',
        quantity=0,
        category=category,
        supplier=supplier,
        threshold_level=5,
        unit_price=19.99,
    )


@pytest.fixture
def api_client():
    """Create a DRF test client."""
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def authenticated_client(api_client, user):
    """Create an authenticated DRF test client."""
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def admin_client(api_client, admin_user):
    """Create an admin authenticated DRF test client."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def manager_client(api_client, manager_user):
    """Create a manager authenticated DRF test client."""
    api_client.force_authenticate(user=manager_user)
    return api_client


@pytest.fixture
def django_client(db):
    """Create a Django test client."""
    from django.test import Client
    return Client()


@pytest.fixture
def authenticated_django_client(django_client, admin_user):
    """Create an authenticated Django test client."""
    django_client.login(username=admin_user.username, password='testpass123')
    return django_client
