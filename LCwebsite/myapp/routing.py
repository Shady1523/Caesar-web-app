from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/scrape/(?P<task_id>[-\w]+)/$', consumers.ScraperConsumer.as_asgi()),
]