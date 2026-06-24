"""
Tests for form validation.
"""

import pytest
from accounts.forms import CustomUserCreationForm, ProfileForm, LoginForm
from inventory.forms import ItemForm, CategoryForm, SupplierForm


@pytest.mark.django_db
class TestLoginForm:
    """Test login form validation."""
    
    def test_valid_login_form(self):
        form = LoginForm(data={
            'username': 'testuser',
            'password': 'testpass123',
        })
        assert form.is_valid()
    
    def test_empty_username(self):
        form = LoginForm(data={
            'username': '',
            'password': 'testpass123',
        })
        assert not form.is_valid()
        assert 'username' in form.errors
    
    def test_empty_password(self):
        form = LoginForm(data={
            'username': 'testuser',
            'password': '',
        })
        assert not form.is_valid()
        assert 'password' in form.errors


@pytest.mark.django_db
class TestProfileForm:
    """Test profile form — must NOT include role field."""
    
    def test_profile_form_excludes_role(self):
        form = ProfileForm()
        assert 'role' not in form.fields
        assert 'is_active' not in form.fields
    
    def test_profile_form_includes_basic_fields(self):
        form = ProfileForm()
        assert 'username' in form.fields
        assert 'email' in form.fields
        assert 'first_name' in form.fields
        assert 'last_name' in form.fields


@pytest.mark.django_db
class TestItemForm:
    """Test item form validation."""
    
    def test_valid_item_form(self, category, supplier):
        form = ItemForm(data={
            'name': 'Test Item',
            'sku': 'TEST-001',
            'quantity': 10,
            'category': category.pk,
            'supplier': supplier.pk,
            'threshold_level': 5,
            'unit_price': '29.99',
        })
        assert form.is_valid()
    
    def test_negative_quantity(self, category):
        form = ItemForm(data={
            'name': 'Test Item',
            'sku': 'TEST-002',
            'quantity': -5,
            'category': category.pk,
            'threshold_level': 5,
            'unit_price': '29.99',
        })
        assert not form.is_valid()
    
    def test_duplicate_sku(self, item, category):
        form = ItemForm(data={
            'name': 'Another Item',
            'sku': item.sku,  # Duplicate
            'quantity': 10,
            'category': category.pk,
            'threshold_level': 5,
            'unit_price': '29.99',
        })
        assert not form.is_valid()
        assert 'sku' in form.errors


@pytest.mark.django_db
class TestCategoryForm:
    """Test category form."""
    
    def test_valid_category(self):
        form = CategoryForm(data={
            'title': 'New Category',
            'description': 'A test category',
        })
        assert form.is_valid()
    
    def test_empty_title(self):
        form = CategoryForm(data={
            'title': '',
        })
        assert not form.is_valid()


@pytest.mark.django_db
class TestSupplierForm:
    """Test supplier form."""
    
    def test_valid_supplier(self):
        form = SupplierForm(data={
            'name': 'New Supplier',
            'email': 'supplier@test.com',
        })
        assert form.is_valid()
    
    def test_invalid_email(self):
        form = SupplierForm(data={
            'name': 'Bad Email Supplier',
            'email': 'not-an-email',
        })
        assert not form.is_valid()
