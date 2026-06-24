"""
Tests for REST API endpoints.
"""

import pytest
from django.urls import reverse
from tests.conftest import ItemFactory, CategoryFactory, SupplierFactory


@pytest.mark.django_db
class TestItemAPI:
    """Test Item API endpoints."""
    
    def test_list_items_unauthenticated(self, api_client):
        response = api_client.get('/api/v1/items/')
        assert response.status_code == 403
    
    def test_list_items_authenticated(self, authenticated_client, item):
        response = authenticated_client.get('/api/v1/items/')
        assert response.status_code == 200
        assert response.data['count'] >= 1
    
    def test_item_detail(self, authenticated_client, item):
        response = authenticated_client.get(f'/api/v1/items/{item.pk}/')
        assert response.status_code == 200
        assert response.data['name'] == item.name
        assert response.data['sku'] == item.sku
    
    def test_item_not_found(self, authenticated_client):
        response = authenticated_client.get('/api/v1/items/99999/')
        assert response.status_code == 404
    
    def test_create_item(self, admin_client, category, supplier):
        data = {
            'name': 'New Item',
            'sku': 'NEW-001',
            'quantity': 50,
            'unit_price': '19.99',
            'threshold_level': 5,
            'category': category.pk,
            'supplier': supplier.pk,
        }
        response = admin_client.post('/api/v1/items/', data)
        assert response.status_code == 201
    
    def test_low_stock_endpoint(self, authenticated_client, low_stock_item):
        response = authenticated_client.get('/api/v1/items/low_stock/')
        assert response.status_code == 200
        assert response.data['count'] >= 1
    
    def test_out_of_stock_endpoint(self, authenticated_client, out_of_stock_item):
        response = authenticated_client.get('/api/v1/items/out_of_stock/')
        assert response.status_code == 200
        assert response.data['count'] >= 1
    
    def test_search_items(self, authenticated_client, item):
        response = authenticated_client.get('/api/v1/items/', {'search': item.name})
        assert response.status_code == 200
    
    def test_filter_by_stock_status(self, authenticated_client, item, low_stock_item):
        response = authenticated_client.get('/api/v1/items/', {'stock_status': 'low_stock'})
        assert response.status_code == 200


@pytest.mark.django_db
class TestCategoryAPI:
    """Test Category API endpoints."""
    
    def test_list_categories(self, authenticated_client, category):
        response = authenticated_client.get('/api/v1/categories/')
        assert response.status_code == 200
    
    def test_create_category(self, admin_client):
        data = {'title': 'New Category', 'description': 'Test description'}
        response = admin_client.post('/api/v1/categories/', data)
        assert response.status_code == 201


@pytest.mark.django_db
class TestSupplierAPI:
    """Test Supplier API endpoints."""
    
    def test_list_suppliers(self, authenticated_client, supplier):
        response = authenticated_client.get('/api/v1/suppliers/')
        assert response.status_code == 200
    
    def test_create_supplier(self, admin_client):
        data = {'name': 'New Supplier', 'email': 'new@supplier.com'}
        response = admin_client.post('/api/v1/suppliers/', data)
        assert response.status_code == 201


@pytest.mark.django_db
class TestTransactionAPI:
    """Test Transaction API endpoints."""
    
    def test_list_transactions(self, authenticated_client):
        response = authenticated_client.get('/api/v1/transactions/')
        assert response.status_code == 200
    
    def test_create_stock_in(self, admin_client, item):
        data = {
            'item_id': item.pk,
            'transaction_type': 'IN',
            'quantity': 25,
            'notes': 'Test stock in',
        }
        response = admin_client.post('/api/v1/transactions/', data)
        assert response.status_code == 201
        assert response.data['quantity_changed'] == 25
    
    def test_create_stock_out_insufficient(self, admin_client, item):
        data = {
            'item_id': item.pk,
            'transaction_type': 'OUT',
            'quantity': 999999,
            'notes': 'Should fail',
        }
        response = admin_client.post('/api/v1/transactions/', data)
        assert response.status_code == 400


@pytest.mark.django_db
class TestUserAPI:
    """Test User API endpoints."""
    
    def test_list_users_requires_admin(self, authenticated_client):
        response = authenticated_client.get('/api/v1/users/')
        assert response.status_code == 403  # Staff can't access
    
    def test_list_users_admin(self, admin_client):
        response = admin_client.get('/api/v1/users/')
        assert response.status_code == 200
    
    def test_profile_me(self, authenticated_client, user):
        response = authenticated_client.get('/api/v1/profile/me/')
        assert response.status_code == 200
        assert response.data['username'] == user.username
