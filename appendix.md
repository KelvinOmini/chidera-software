# APPENDICES

## Appendix A: Sample Screenshots of the System Interfaces

**Figure A1:** Login/Authentication Screen (Glassmorphism design with dark mode support)  
**Figure A2:** Main Dashboard Overview (Key metrics cards, Chart.js visualizations for stock trends and low-stock alerts)  
**Figure A3:** Inventory List View (Paginated table with search, filters, status tags, and action buttons)  
**Figure A4:** Add/Edit Product Form (Fields for name, SKU, prices in ₦, category, reorder level)  
**Figure A5:** Sales Transaction Interface (Product selection, quantity input, automatic stock update, and receipt generation)  
**Figure A6:** Low-Stock Alert Notification (In-app badge and sample Celery-triggered email)  
**Figure A7:** Reports/Analytical Dashboard (Sales performance, profit summary, and stock movement charts)

*(Note: Insert actual screenshots with proper captions and numbering in the final Microsoft Word document.)*

## Appendix B: Database Schema and Entity-Relationship Diagram

### B.1 Core Database Tables (Normalized Relational Schema)

**Table B1: accounts_customuser**  
- `id` (PK, INT, Auto-increment)  
- `username` (VARCHAR(50))  
- `email` (VARCHAR(150), unique)  
- `password` (VARCHAR(128), hashed PBKDF2)  
- `role` (VARCHAR(20): ‘ADMIN’, ‘MANAGER’, ‘STAFF’)  
- `is_active` (BOOLEAN, default True)  

**Table B2: inventory_category**  
- `id` (PK)  
- `title` (VARCHAR(100), unique)  
- `description` (TEXT)

**Table B3: inventory_supplier**  
- `id` (PK)  
- `name` (VARCHAR(100))  
- `contact_email` (VARCHAR(254))  
- `phone` (VARCHAR(20))  
- `address` (TEXT)

**Table B4: inventory_item**  
- `id` (PK, INT)  
- `name` (VARCHAR(200))  
- `sku` (VARCHAR(50), unique)  
- `category_id` (FK)  
- `supplier_id` (FK)  
- `unit_price` (DECIMAL(10,2))  
- `quantity` (INT, default 0)  
- `threshold_level` (INT, default 10)  
- `description` (TEXT)  
- `created_at` (DATETIME)  
- `updated_at` (DATETIME)

**Table B5: operations_stocktransaction**  
- `id` (PK)  
- `item_id` (FK)  
- `user_id` (FK)  
- `transaction_type` (VARCHAR(20): ‘IN’, ‘OUT’, ‘ADJUSTMENT’)  
- `quantity_changed` (INT)  
- `notes` (TEXT)
- `timestamp` (DATETIME)  

### B.2 Entity-Relationship (ER) Diagram Description

The system uses a relational model with the following key relationships:  
- One-to-Many: Category → Items, Supplier → Items  
- One-to-Many: CustomUser → StockTransactions  
- One-to-Many: Item → StockTransactions  

Referential integrity is enforced with foreign keys, and race conditions are mitigated natively using `select_for_update()`.

*(Note: Insert the full ER diagram image generated from Draw.io, Lucidchart, or similar tools here.)*

## Appendix C: Key Source Code Snippets

### C.1: Mitigating Race Conditions via Database Locks (operations/services.py)
```python
from django.db import transaction
from django.db.models import F

class StockOperationService:
    @staticmethod
    @transaction.atomic
    def process_transaction(item_id, user_id, transaction_type, quantity, notes=""):
        # Acquire a database lock using select_for_update() to guarantee atomic execution
        item = Item.objects.select_for_update().get(id=item_id)
        
        if transaction_type == 'OUT' and item.quantity < quantity:
            raise ValidationError("Insufficient stock for this operation.")
            
        # Log the operation securely
        transaction_record = StockTransaction.objects.create(
            item=item,
            user_id=user_id,
            transaction_type=transaction_type,
            quantity_changed=quantity,
            notes=notes
        )
        
        # Atomically update to avoid conflicts between simultaneous requests
        if transaction_type == 'IN':
            item.quantity = F('quantity') + quantity
        elif transaction_type == 'OUT':
            item.quantity = F('quantity') - quantity
            
        item.save()
        item.refresh_from_db()
        return transaction_record
```

### C.2: Asynchronous Low Stock Verification (operations/tasks.py)
```python
from celery import shared_task
from django.core.mail import send_mail
from django.db.models import F
from inventory.models import Item

@shared_task
def check_low_stock_levels():
    """Background task to locate and notify management of low items."""
    low_items = Item.objects.filter(quantity__lte=F('threshold_level'))
    
    if low_items.exists():
        message = "The following items operate below safe threshold levels:\n\n"
        for item in low_items:
            message += f"- {item.name} (SKU: {item.sku}): {item.quantity} remaining\n"
            
        send_mail(
            subject='Critical: Low Stock Alert',
            message=message,
            from_email='system@smartinventory.ng',
            recipient_list=['admin@smartinventory.ng'],
            fail_silently=False,
        )
    return f"Checked stock: {low_items.count()} items currently low."
```

### C.3: API Viewset for Stock Movement (inventory/api_views.py)
```python
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Item
from .serializers import ItemSerializer
from accounts.permissions import IsManagerOrAdmin

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.select_related('category', 'supplier').all()
    serializer_class = ItemSerializer
    
    def get_permissions(self):
        """Allow read access to all, but mutations only for Managers/Admins."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsManagerOrAdmin()]
        return [IsAuthenticated()]
```

## Appendix D: Sample Test Cases (Pytest Excerpt)

- **AUTH-001:** Profile forms natively exclude `role` to block staff privilege escalation manipulations.
- **SYNC-001:** `test_atomic_stock_update` initiates simultaneous transactions confirming `select_for_update()` holds without overwriting.
- **ASYNC-001:** Verifies the `check_low_stock_levels` Celery task routes payload successfully through Redis.
- **API-001:** Enforces `IsManagerOrAdmin()` across versioned APIs (`api/v1/items/`) dropping unauthorized `403 Forbidden` limits securely.

## Appendix E: User Manual / Quick Start Guide

1. **System Installation:** Run `docker-compose up --build -d` to compile the PostgreSQL, Redis, web, and Celery instances contextually.
2. **Setup Automation:** Run `python manage.py load_sample_data` to instantiate predefined users and the Nigerian corporate dummy data environment natively.
3. **Operations Flow:** Login with `admin / admin123` → Access dashboard metrics → Switch theme settings → Execute stock `IN` or `OUT` maneuvers mapping to visual changes instantly.

## Appendix F: Sample Dataset (Nigerian Context)

**Table F1: Sample Items** (35 items with ₦ valuations)  
Example entries:  
- Item: HP ProBook 450, SKU: TECH-HP-450, Category: Hardware, Selling Price: ₦450,000, Threshold: 5  
- Item: A4 Office Paper (Ream), SKU: OFF-A4-001, Category: Stationery, Selling Price: ₦5,000, Threshold: 20

**Table F2: Sample Users**  
- Admin: Chidera Obilo (role: Admin)  
- Manager: Emeka Okoro (role: Manager)  
- Staff: Ada Nwosu (role: Staff)

**Table F3: Sample Transactions** (20+ entries simulating one year of activity)

## Appendix G: List of Tables

- Table 1.1: Summary of Manual vs. Smart Inventory Management Challenges (Chapter 1)  
- Table 3.1: Functional Requirements of the System (Chapter 3)  
- Table 3.2: Non-Functional Requirements of the System (Chapter 3)  
- Table 3.3: Program Modules and Descriptions (Chapter 3)  
- Table 3.4: Database Table – users (Chapter 3)  
- Table 3.5: Database Table – products (Chapter 3)  
- Table 3.6: Database Table – sales (Chapter 3)  
- Table 3.7: Database Table – sale_items (Chapter 3)  
- Table 3.8: Database Table – alerts (Chapter 3)  
- Table 3.9: System Controls Implemented (Chapter 3)  
- Table 4.1: Development Tools and Technologies Used (Chapter 4)  
- Table 4.2: Dataset Characteristics (Users, Suppliers, Categories, Items, Transactions) (Chapter 4)  
- Table B1: users Table Schema (Appendix B)  
- Table B2: categories Table Schema (Appendix B)  
- Table B3: suppliers Table Schema (Appendix B)  
- Table B4: products Table Schema (Appendix B)  
- Table B5: stock_transactions Table Schema (Appendix B)  
- Table F1: Sample Products Dataset (Appendix F)  
- Table F2: Sample Users Dataset (Appendix F)  
- Table F3: Sample Transactions Dataset (Appendix F)

## Appendix H: List of Figures

- Figure 1.1: Conceptual Framework of Smart Inventory Management (Chapter 1)  
- Figure 2.1: Technology Acceptance Model (TAM) Adapted for the Study (Chapter 2)  
- Figure 3.1: Three-Tier System Architecture (Chapter 3)  
- Figure 3.2: Use Case Diagram (Chapter 3)  
- Figure 3.3: UML Class Diagram (Chapter 3)  
- Figure 3.4: Activity Diagram for Sales Process (Chapter 3)  
- Figure 4.1: Authentication Screen (Chapter 4)  
- Figure 4.2: Main Dashboard (Chapter 4)  
- Figure 4.3: Inventory List View (Chapter 4)  
- Figure 4.4: Transaction History View (Chapter 4)  
- Figure A1: Login/Authentication Screen (Appendix A)  
- Figure A2: Main Dashboard Overview (Appendix A)  
- Figure A3: Inventory List View (Appendix A)  
- Figure A4: Add New Product Form (Appendix A)  
- Figure A5: Sales Transaction Interface (Appendix A)  
- Figure A6: Low-Stock Alert Notification (Appendix A)  
- Figure A7: Analytical Reports Dashboard (Appendix A)  
- Figure B1: Entity-Relationship Diagram of the Database (Appendix B)

---