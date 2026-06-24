"""
API URL configuration - versioned API routing.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from inventory.api_views import ItemViewSet, CategoryViewSet, SupplierViewSet
from operations.api_views import StockTransactionViewSet
from accounts.api_views import UserViewSet, ProfileViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'items', ItemViewSet, basename='api-item')
router.register(r'categories', CategoryViewSet, basename='api-category')
router.register(r'suppliers', SupplierViewSet, basename='api-supplier')
router.register(r'transactions', StockTransactionViewSet, basename='api-transaction')
router.register(r'users', UserViewSet, basename='api-user')
router.register(r'profile', ProfileViewSet, basename='api-profile')

urlpatterns = [
    path('', include(router.urls)),
]
