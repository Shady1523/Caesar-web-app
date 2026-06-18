from django.urls import path
from . import views

urlpatterns = [
    path('api/v2/', views.scraper_api, name='index'),
    path('api/v1/stores/', views.dashboard_api, name='api_view'),
    path('api/v1/check_scrape_status/', views.check_scrape_status, name='check_scrape_status'),
    path('api/db_version/', views.get_db_version, name='db_version'),
]