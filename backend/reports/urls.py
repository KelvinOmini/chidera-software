from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    path('inventory-summary/', views.inventory_summary, name='inventory_summary'),
    path('low-stock/', views.low_stock_report, name='low_stock_report'),
    path('transactions/', views.transaction_report, name='transaction_report'),
    path('export/transactions/', views.export_transactions_csv, name='export_transactions'),
    path('export/inventory/', views.export_inventory_csv, name='export_inventory'),
]
