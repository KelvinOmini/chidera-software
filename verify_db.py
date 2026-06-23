import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from operations.models import StockTransaction
from inventory.models import Item, Category

print(f"Transactions: {StockTransaction.objects.count()}")
print(f"Items: {Item.objects.count()}")
print(f"Categories: {Category.objects.count()}")

if StockTransaction.objects.exists():
    latest = StockTransaction.objects.order_by('-timestamp').first()
    print(f"Latest Transaction: {latest.timestamp} (Type: {latest.transaction_type})")
else:
    print("No Transactions found.")
