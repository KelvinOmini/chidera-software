import os
import django
import random
from datetime import datetime, timedelta

# Setup Django environment
import sys
project_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.append(project_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from inventory.models import Category, Supplier, Item
from operations.models import StockTransaction
from accounts.models import CustomUser

def load_data():
    print("🚀 Starting Demo Data Load...")
    
    # 1. Ensure Roles exist (redundant but safe)
    admin = CustomUser.objects.filter(role='admin').first()
    manager = CustomUser.objects.filter(role='manager').first()
    staff = CustomUser.objects.filter(role='staff').first()

    # 2. Create Categories
    categories_data = [
        ('Electronics', 'Laptops, Smartphones, and accessories'),
        ('Furniture', 'Office chairs, desks, and storage'),
        ('Stationery', 'Pens, notebooks, and office supplies'),
        ('Hardware', 'Tools and maintenance equipment'),
    ]
    categories = []
    for title, desc in categories_data:
        cat, _ = Category.objects.get_or_create(title=title, defaults={'description': desc})
        categories.append(cat)
    
    # 3. Create Suppliers
    suppliers_data = [
        ('Global Tech Solutions', 'sales@globaltech.com'),
        ('Office Depot Inc', 'orders@officedepot.com'),
        ('Industrial Supply Co', 'contact@indsupply.com'),
    ]
    suppliers = []
    for name, email in suppliers_data:
        sup, _ = Supplier.objects.get_or_create(name=name, defaults={'email': email})
        suppliers.append(sup)

    # 4. Create Items
    items_list = [
        ('MacBook Pro 14"', 'MAC-14-001', 25, categories[0], suppliers[0], 5, 1999.99),
        ('Dell XPS 15', 'DELL-15-002', 15, categories[0], suppliers[0], 3, 1799.50),
        ('Ergonomic Chair', 'FURN-001', 45, categories[1], suppliers[1], 10, 249.99),
        ('Standing Desk', 'FURN-002', 12, categories[1], suppliers[1], 5, 599.00),
        ('Mechanical Pencil Set', 'STAT-001', 200, categories[2], suppliers[1], 50, 15.99),
        ('Heavy Duty Drill', 'HARD-001', 8, categories[3], suppliers[2], 2, 129.99),
    ]
    
    for name, sku, qty, cat, sup, thresh, price in items_list:
        item, created = Item.objects.update_or_create(
            sku=sku,
            defaults={
                'name': name,
                'quantity': qty,
                'category': cat,
                'supplier': sup,
                'threshold_level': thresh,
                'unit_price': price
            }
        )
        
        # 5. Create random historical transactions for visualization
        if created:
            current_qty = qty
            for i in range(10):
                trans_type = random.choice(['IN', 'OUT'])
                change = random.randint(1, 5)
                
                if trans_type == 'OUT' and current_qty > change:
                    new_qty = current_qty - change
                else:
                    trans_type = 'IN'
                    new_qty = current_qty + change
                
                StockTransaction.objects.create(
                    item=item,
                    transaction_type=trans_type,
                    quantity_changed=change,
                    previous_quantity=current_qty,
                    new_quantity=new_qty,
                    user=random.choice([manager, staff]) if manager and staff else admin,
                    notes=f"Demo transaction {i+1}",
                    timestamp=datetime.now() - timedelta(days=random.randint(1, 30))
                )
                current_qty = new_qty
            
            # Final sync of quantity
            item.quantity = current_qty
            item.save()

    print("✅ Demo Data Loaded Successfully.")

if __name__ == "__main__":
    load_data()
