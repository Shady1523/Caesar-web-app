from django.urls import path
from . import views

urlpatterns = [
    path('', views.scraper_api, name='index'),
    path('stores/', views.dashboard_api, name='api_view'),
    path('api/check_scrape_status/', views.check_scrape_status, name='check_scrape_status'),
    path('api/db_version/', views.get_db_version, name='db_version'),
]