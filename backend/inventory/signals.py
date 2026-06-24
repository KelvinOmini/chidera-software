from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Item

@receiver(post_save, sender=Item)
def notify_low_stock(sender, instance, **kwargs):
    if instance.is_low_stock():
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'inventory_updates',
            {
                'type': 'inventory.message',
                'type_event': 'low_stock',
                'message': f'Low Stock Alert: {instance.name} is now at {instance.quantity} units.'
            }
        )
