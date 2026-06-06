from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_page_view, name='index'),
    path('database/', views.database_view, name='database'),
    path('api/v1/stores/', views.api_view, name='api_view'),
]