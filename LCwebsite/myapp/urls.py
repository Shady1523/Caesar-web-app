from django.urls import path
from . import views

urlpatterns = [
    path('api/v2/', views.scraper_api, name='index'),
    path('api/v1/stores/', views.dashboard_api, name='api_view'),
]