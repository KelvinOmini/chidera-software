import os
import django
from django.utils import timezone
from datetime import timedelta
import random

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from operations.models import StockTransaction

def shift_transactions():
    transactions = StockTransaction.objects.all().order_by('timestamp')
    if not transactions.exists():
        print("No transactions found.")
        return

    now = timezone.now()
    # We want the most recent transaction to be "today"
    # and others to be spread out in the last 60 days
    last_tx_time = transactions.last().timestamp
    time_diff = now - last_tx_time
    
    print(f"Shifting internal timestamps by {time_diff.days} days...")
    
    for tx in transactions:
        # Shift each transaction to be relative to 'now'
        # We'll spread them more if they are very old
        original_time = tx.timestamp
        # Formula: new_time = now - (last_tx_time - original_time)
        new_time = now - (last_tx_time - original_time)
        
        # Ensure it's not EXACTLY now if there are many
        new_time = new_time - timedelta(minutes=random.randint(0, 59))
        
        tx.timestamp = new_time
        tx.save()

    print("Successfully updated transaction timestamps.")

if __name__ == "__main__":
    shift_transactions()
