import json
from channels.generic.websocket import AsyncWebsocketConsumer

class InventoryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'inventory_updates'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def inventory_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def user_activity(self, event):
        await self.send(text_data=json.dumps({
            'type': 'collaboration',
            'user': event['user'],
            'action': event['action'],
            'item_id': event.get('item_id')
        }))
