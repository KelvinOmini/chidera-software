from django.urls import path
from . import views

app_name = 'operations'

urlpatterns = [
    path('transactions/', views.transaction_list, name='transaction_list'),
    path('transactions/create/', views.transaction_create, name='transaction_create'),
    path('transactions/<int:pk>/', views.transaction_detail, name='transaction_detail'),
    path('items/<int:item_id>/transactions/', views.item_transactions, name='item_transactions'),
]
