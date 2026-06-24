import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ScraperConsumer(AsyncWebsocketConsumer):
    async def connect(self):
  
        self.task_id = self.scope['url_route']['kwargs']['task_id']
        
        self.room_group_name = f'scrape_{self.task_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def scrape_complete(self, event):
        message = event['message']
        data = event['data']

        await self.send(text_data=json.dumps({
            'message': message,
            'data': data
        }))