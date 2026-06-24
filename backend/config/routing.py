from django.urls import path
from inventory.consumers import InventoryConsumer

websocket_urlpatterns = [
    path('ws/inventory/', InventoryConsumer.as_asgi()),
]
