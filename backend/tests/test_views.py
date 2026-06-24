"""
Tests for Django views — authentication, permissions, and CRUD operations.
"""

import pytest
from django.test import Client
from django.urls import reverse
from tests.conftest import UserFactory, AdminFactory, ManagerFactory, ItemFactory, CategoryFactory


@pytest.mark.django_db
class TestLoginView:
    """Test login functionality."""
    
    def test_login_page_renders(self, django_client):
        response = django_client.get(reverse('accounts:login'))
        assert response.status_code == 200
    
    def test_login_success(self, django_client):
        user = UserFactory(username='testlogin')
        response = django_client.post(reverse('accounts:login'), {
            'username': 'testlogin',
            'password': 'testpass123',
        })
        assert response.status_code == 302  # Redirects to dashboard
    
    def test_login_invalid_credentials(self, django_client):
        response = django_client.post(reverse('accounts:login'), {
            'username': 'nonexistent',
            'password': 'wrongpass',
        })
        assert response.status_code == 200  # Stays on login page
    
    def test_authenticated_user_redirected(self, authenticated_django_client):
        response = authenticated_django_client.get(reverse('accounts:login'))
        assert response.status_code == 302


@pytest.mark.django_db
class TestLogoutView:
    """Test logout is POST-only."""
    
    def test_logout_post(self, authenticated_django_client):
        response = authenticated_django_client.post(reverse('accounts:logout'))
        assert response.status_code == 302
    
    def test_logout_get_not_allowed(self, authenticated_django_client):
        response = authenticated_django_client.get(reverse('accounts:logout'))
        assert response.status_code == 405  # Method Not Allowed


@pytest.mark.django_db
class TestDashboardView:
    """Test dashboard access."""
    
    def test_dashboard_requires_login(self, django_client):
        response = django_client.get(reverse('dashboard:home'))
        assert response.status_code == 302  # Redirects to login
    
    def test_dashboard_authenticated(self, authenticated_django_client):
        response = authenticated_django_client.get(reverse('dashboard:home'))
        assert response.status_code == 200


@pytest.mark.django_db
class TestItemViews:
    """Test inventory item views."""
    
    def test_item_list_requires_login(self, django_client):
        response = django_client.get(reverse('inventory:item_list'))
        assert response.status_code == 302
    
    def test_item_list_authenticated(self, authenticated_django_client):
        response = authenticated_django_client.get(reverse('inventory:item_list'))
        assert response.status_code == 200
    
    def test_item_detail(self, authenticated_django_client, item):
        response = authenticated_django_client.get(
            reverse('inventory:item_detail', kwargs={'pk': item.pk})
        )
        assert response.status_code == 200
    
    def test_item_detail_not_found(self, authenticated_django_client):
        response = authenticated_django_client.get(
            reverse('inventory:item_detail', kwargs={'pk': 99999})
        )
        assert response.status_code == 404
    
    def test_item_create_requires_manager(self, django_client):
        user = UserFactory(role='staff')
        django_client.login(username=user.username, password='testpass123')
        response = django_client.get(reverse('inventory:item_create'))
        assert response.status_code == 302  # Redirected (no permission)


@pytest.mark.django_db
class TestUserManagement:
    """Test user management views."""
    
    def test_user_list_requires_admin(self, django_client):
        manager = ManagerFactory()
        django_client.login(username=manager.username, password='testpass123')
        response = django_client.get(reverse('accounts:user_list'))
        assert response.status_code == 302  # Managers can't access
    
    def test_user_list_admin_access(self, authenticated_django_client):
        response = authenticated_django_client.get(reverse('accounts:user_list'))
        assert response.status_code == 200
    
    def test_user_delete_not_found(self, authenticated_django_client):
        response = authenticated_django_client.post(
            reverse('accounts:user_delete', kwargs={'pk': 99999})
        )
        assert response.status_code == 404


@pytest.mark.django_db
class TestProfileView:
    """Test profile editing — ensures role escalation is prevented."""
    
    def test_profile_renders(self, django_client):
        user = UserFactory(role='staff')
        django_client.login(username=user.username, password='testpass123')
        response = django_client.get(reverse('accounts:profile'))
        assert response.status_code == 200
        # ProfileForm should NOT have role field
        assert 'role' not in response.context['form'].fields
