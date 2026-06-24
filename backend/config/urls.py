"""
URL configuration for inventory_system project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('accounts/', include('allauth.urls')),
    
    # Versioned REST API
    path('api/v1/', include('config.api_urls')),
    
    # Local app URLs
    path('accounts/', include('accounts.urls', namespace='accounts')),
    path('inventory/', include('inventory.urls', namespace='inventory')),
    path('operations/', include('operations.urls', namespace='operations')),
    path('reports/', include('reports.urls', namespace='reports')),
    path('', include('dashboard.urls', namespace='dashboard')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
