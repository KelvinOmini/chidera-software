# Diagram Generation Prompts for Smart Inventory Management System

## Prompt 1: Three-Tier System Architecture Diagram

### Context
The Smart Inventory Management System uses a three-tier architectural pattern for scalability and separation of concerns.

### Detailed Prompt for AI/Diagram Generator

```
Generate a three-tier system architecture diagram for a Django-based Inventory Management System with the following specifications:

TIER 1 - PRESENTATION LAYER (Client-facing UI):
- Components: Web Browser, HTML/CSS Templates, JavaScript (Chart.js for visualizations)
- Features: Bootstrap 5 responsive design, interactive dashboards, forms, real-time data display
- Technologies: Django Templates, Static Files (CSS, JS), Chart.js for analytics charts
- User Interfaces: Login page, Dashboard, Inventory List, Transactions, Reports, User Management

TIER 2 - APPLICATION LAYER (Business Logic):
- Django Framework (Python) running on Gunicorn/uWSGI application server
- Core Modules:
  * Accounts App: Authentication, authorization, role-based access control (Admin, Manager, Staff)
  * Inventory App: CRUD operations for Items, Categories, Suppliers, Stock management
  * Operations App: Stock transactions, transaction logging, inventory movement tracking
  * Reports App: Reporting services, analytics aggregation, data export
  * Dashboard App: KPI calculations, real-time metrics, chart data aggregation
  * API Layer: RESTful endpoints (30+ endpoints), JWT authentication for programmatic access
- Services: Business logic layer, data validation, transaction management
- Middleware: CSRF protection, Security headers (HSTS), Session management, Logging

TIER 3 - DATA LAYER (Database):
- Database: PostgreSQL 15 (relational database)
- Schema Components:
  * accounts_customuser: User authentication and role management
  * inventory_category: Product categories
  * inventory_supplier: Supplier information
  * inventory_item: Inventory items with stock levels and pricing
  * operations_stocktransaction: Transaction audit trail
  * Authentication tokens, session data
- Features: Referential integrity constraints, database indexes for performance, atomic transactions
- Backup and replication capabilities

EXTERNAL COMPONENTS:
- Redis: Caching layer and message broker
- Celery: Asynchronous task processing (background job queue for stock alerts)
- Static File Server: WhiteNoise for serving static files

COMMUNICATION FLOWS:
- User requests → Web Server (Presentation) → Django Application (Application) → Database (Data)
- Asynchronous operations: Celery tasks → Redis Queue → Background workers
- API requests: External clients → REST API endpoints → Services → Database

VISUAL STYLE:
- Use rectangular boxes for layers
- Show clear separation between tiers with visual spacing
- Use arrows to show data flow between layers
- Include technology stack labels
- Use different colors for each tier (Presentation: Blue, Application: Green, Data: Orange/Red)
- Add bidirectional arrows showing request-response cycles
- Include database replication indicators
```

---

## Prompt 2: Use Case Diagram for Smart Inventory Management System

### Context
The system has three primary user roles with distinct responsibilities and capabilities.

### Detailed Prompt for AI/Diagram Generator

```
Generate a comprehensive Use Case Diagram for a Smart Inventory Management System with the following actors and use cases:

PRIMARY ACTORS:
1. Admin
   - Highest privilege level
   - System-wide management capabilities
   - User management authority
   
2. Inventory Manager
   - Mid-level privileges
   - Inventory and operations management
   - Report generation and analysis
   
3. Staff Member (Staff)
   - Limited privileges
   - Operational tasks only
   - View-only for sensitive operations

4. System (Automated Background Process)
   - Executes scheduled tasks
   - Generates alerts

USE CASES TO INCLUDE:

AUTHENTICATION & USER MANAGEMENT:
- UC1: User Login (all actors)
- UC2: User Logout (all actors)
- UC3: Manage Users (Admin only)
- UC4: Create User (Admin)
- UC5: Update User Profile (Admin)
- UC6: Delete User (Admin)
- UC7: Assign User Roles (Admin only)

INVENTORY MANAGEMENT:
- UC8: View Inventory List (Admin, Manager, Staff)
- UC9: Search Items (Admin, Manager, Staff)
- UC10: Add New Item (Admin, Manager)
- UC11: Update Item Details (Admin, Manager)
- UC12: Delete Item (Admin, Manager)
- UC13: Manage Categories (Admin, Manager)
- UC14: Manage Suppliers (Admin, Manager)
- UC15: View Item Details (all actors)

STOCK OPERATIONS:
- UC16: Record Stock In (Admin, Manager, Staff)
- UC17: Record Stock Out (Admin, Manager, Staff)
- UC18: Adjust Stock Quantity (Admin, Manager)
- UC19: View Transaction History (Admin, Manager, Staff)
- UC20: Generate Transaction Report (Admin, Manager)

MONITORING & ALERTS:
- UC21: Monitor Stock Levels (System - background process)
- UC22: Check Threshold Alerts (System)
- UC23: Receive Low Stock Alert (Admin, Manager - automatic notification)
- UC24: View Alerts Dashboard (Admin, Manager)

REPORTING & ANALYTICS:
- UC25: View Dashboard (Admin, Manager)
- UC26: Generate Inventory Summary Report (Admin, Manager)
- UC27: Generate Low Stock Report (Admin, Manager)
- UC28: Generate Transaction Report (Admin, Manager)
- UC29: Export Report to CSV (Admin, Manager)
- UC30: View Sales Analytics (Admin, Manager)

RELATIONSHIPS:
- "Manage Users" extends "Add User", "Update User", "Delete User"
- "Record Stock Operation" (parent) generalizes "Record Stock In", "Record Stock Out", "Adjust Stock"
- "Generate Reports" (parent) generalizes "Inventory Summary Report", "Low Stock Report", "Transaction Report"
- "Monitor Stock" includes "Check Threshold", "Generate Alert"
- System sends notification to Admin/Manager when alerts are generated

VISUAL STYLE:
- Use oval shapes for use cases
- Use stick figures for actors
- Use rectangles with dashed borders for system boundary
- Use solid lines for associations and include relationships
- Use dashed lines for extend and generalization relationships
- Arrange actors on the left, use cases in the center
- Group related use cases by functional area
- Use color coding: Blue for Admin, Green for Manager, Yellow for Staff, Gray for System
```

---

## Prompt 3: UML Class Diagram for Smart Inventory Management System

### Context
The system uses Django models to represent core business entities with relationships and constraints.

### Detailed Prompt for AI/Diagram Generator

```
Generate a UML Class Diagram for the Smart Inventory Management System database models with the following specifications:

CLASSES TO INCLUDE:

1. CustomUser (Extends AbstractUser)
   - Attributes:
     * username: str (inherited)
     * email: str (inherited)
     * first_name: str (inherited)
     * last_name: str (inherited)
     * password: str (inherited, hashed)
     * role: str {admin | manager | staff} [default: staff]
     * is_active: bool [default: True]
     * date_created: DateTime (auto-created)
     * date_modified: DateTime (auto-updated)
   - Methods:
     * is_admin(): bool
     * is_manager(): bool
     * is_staff_user(): bool
     * can_manage_inventory(): bool
     * can_view_reports(): bool
     * can_manage_users(): bool
     * __str__(): str

2. Category
   - Attributes:
     * id: UUID (primary key)
     * title: str (unique, max 100)
     * description: str (optional)
     * created_at: DateTime (auto-created)
     * updated_at: DateTime (auto-updated)
   - Methods:
     * __str__(): str
   - Constraints: Unique title, database index on title

3. Supplier
   - Attributes:
     * id: UUID (primary key)
     * name: str (unique, max 150)
     * contact_info: str (max 255, optional)
     * email: str (optional)
     * phone: str (max 20, optional)
     * address: str (optional)
     * created_at: DateTime (auto-created)
     * updated_at: DateTime (auto-updated)
   - Methods:
     * __str__(): str
   - Constraints: Unique name, database index on name

4. Item
   - Attributes:
     * id: UUID (primary key)
     * name: str (max 200)
     * description: str (optional)
     * sku: str (unique, max 50) - Stock Keeping Unit
     * quantity: int [default: 0, min: 0]
     * unit_price: Decimal (max 10 digits, 2 decimals, min: 0)
     * threshold_level: int [default: 10, min: 0] - Low stock alert threshold
     * category: ForeignKey → Category (PROTECT on delete)
     * supplier: ForeignKey → Supplier (SET_NULL on delete, optional)
     * created_at: DateTime (auto-created)
     * updated_at: DateTime (auto-updated)
   - Methods:
     * __str__(): str
     * is_low_stock(): bool
     * get_stock_value(): Decimal
   - Constraints: Unique SKU, database indexes on SKU, name, category, quantity

5. StockTransaction
   - Attributes:
     * id: UUID (primary key)
     * item: ForeignKey → Item (PROTECT on delete) [required]
     * transaction_type: str {IN | OUT | ADJUSTMENT} - Transaction type
     * quantity_changed: int [min: 1]
     * previous_quantity: int [min: 0]
     * new_quantity: int [min: 0]
     * user: ForeignKey → CustomUser (SET_NULL on delete) [optional]
     * notes: str (optional)
     * timestamp: DateTime (auto-created)
   - Methods:
     * __str__(): str
     * get_transaction_icon(): str
   - Constraints: Database indexes on (item, timestamp), (transaction_type, timestamp)

RELATIONSHIPS:
- Category 1 ←→ * Item (one category has many items)
- Supplier 1 ←→ * Item (one supplier supplies many items)
- Item 1 ←→ * StockTransaction (one item has many transactions)
- CustomUser 1 ←→ * StockTransaction (one user performs many transactions)

INHERITANCE:
- CustomUser extends AbstractUser (Django's built-in user model)

CARDINALITY NOTATION:
- Use (1..1) to (0..*) or (1..1) to (1..*)
- Show mandatory vs optional relationships
- Display crow's foot notation

VISUAL STYLE:
- Use rectangular boxes for each class
- Display class name in bold at top
- Show attributes with type and constraints
- Show methods with return types
- Use solid lines for associations
- Use hollow arrow heads for inheritance
- Show multiplicity at both ends
- Color code: Blue for core entities, Green for transaction tracking, Orange for authentication
- Include database constraints as notes
- Add stereotype indicators (<<entity>>, <<audit>> etc.)
```

---

## Prompt 4: Activity Diagram for Stock Alert Notification Workflow

### Context
The system automatically monitors inventory levels and generates alerts when stock falls below threshold values. This process runs as a background task using Celery.

### Detailed Prompt for AI/Diagram Generator

```
Generate an Activity Diagram for the Stock Alert Notification Workflow in the Smart Inventory Management System with the following specifications:

WORKFLOW TITLE: "Automated Low Stock Alert Generation and Notification"

ACTIVITIES AND FLOW:

Start Point:
- Celery scheduled task triggers (e.g., every 5 minutes or hourly)

Activity Sequence:

1. [Retrieve All Inventory Items]
   - Query all Item records from database
   - Order by quantity ascending (critical items first)

2. [For Each Item - Begin Loop]
   - Iteration point: Process items sequentially

3. [Get Item Quantity]
   - Read current quantity value
   - Retrieve threshold_level value

4. [Decision: Is Quantity <= Threshold?]
   - Decision point with two paths:
     * YES → Continue to Activity 5
     * NO → Jump to next item (Activity 2)

5. [Decision: Has Alert Already Been Sent?]
   - Check if alert for this item already exists (within last hour)
   - Decision point:
     * YES → Skip to Activity 2 (prevent duplicate alerts)
     * NO → Continue to Activity 6

6. [Create Alert Record]
   - Create a new Alert object with:
     * Item reference
     * Current quantity
     * Threshold level
     * Alert timestamp
     * Status: "PENDING"

7. [Log Transaction]
   - Log the alert creation in system logs
   - Record: Item name, SKU, quantity, threshold, timestamp

8. [Prepare Notification Message]
   - Format message: "Item [SKU] [Name] has [quantity] units. Threshold: [threshold]"
   - Include: Item ID, current stock level, reorder recommendation

9. [Send Notification - Parallel Tasks]
   - Decision/fork point for multiple notification channels:
     * Send Email to Managers and Admins
     * Send Dashboard Alert (in-app notification)
     * Add to Notification Queue
   - All paths execute in parallel

10. [Email Notification Task]
    - Format email body with item details
    - Get email addresses of all Managers and Admins
    - Send via SMTP
    - Wait for confirmation

11. [Dashboard Alert Task]
    - Create AlertNotification record
    - Mark as "read: false"
    - Add to in-memory cache

12. [Queue Alert Task]
    - Add to Redis queue for processing
    - Set priority level

13. [Wait for Parallel Tasks to Complete]
    - Join point: Wait for all notification tasks

14. [Update Alert Status]
    - Mark Alert record as "SENT"
    - Record completion timestamp

15. [Continue Loop]
    - Return to Activity 2 for next item

End Loop:
- After all items processed

16. [Generate Summary Log]
    - Count total alerts generated
    - Count notifications sent
    - Log any failures

17. [Update Task Status]
    - Mark task as completed
    - Record execution time
    - Set next scheduled run

End Point:
- Task completed, scheduled for next execution

EXCEPTION HANDLERS:
- [Database Error]: Log error → Retry mechanism → Send admin alert
- [Email Failure]: Log error → Add to retry queue → Continue processing
- [Memory Error]: Log error → Graceful shutdown → Alert system admin

GUARD CONDITIONS:
- Only process items with quantity > 0 (avoid invalid data)
- Only notify if notification preference is enabled for user
- Skip items marked as archived

SWIMLANES (if applicable):
- Celery Worker (initiates and coordinates)
- Database (retrieves and updates data)
- Email Service (sends notifications)
- Alert System (generates alerts)
- Dashboard Service (updates UI)

VISUAL STYLE:
- Use rounded rectangles for activities
- Use diamonds for decision points
- Use horizontal bars for parallel/concurrent activities
- Use bold arrows for the main flow
- Use thin arrows for alternate paths
- Color code: Green for main flow, Blue for notifications, Red for errors
- Include swim lanes to show responsible components
- Add timing information where applicable
- Show asynchronous operations with fork/join bars
```

---

## Prompt 5: Entity-Relationship Diagram (ERD) for Database Schema

### Context
The system uses a normalized relational database schema following Django ORM conventions with PostgreSQL for production and SQLite for development.

### Detailed Prompt for AI/Diagram Generator

```
Generate a comprehensive Entity-Relationship Diagram (ERD) for the Smart Inventory Management System database schema with the following specifications:

ENTITIES AND ATTRIBUTES:

1. accounts_customuser
   - PK: id (Integer, Auto-increment)
   - username: Varchar(150, UNIQUE, NOT NULL)
   - email: Varchar(254, NOT NULL)
   - password: Varchar(128, NOT NULL) - hashed with PBKDF2-SHA256
   - first_name: Varchar(150)
   - last_name: Varchar(150)
   - role: Varchar(20, DEFAULT='staff') {admin | manager | staff}
   - is_active: Boolean (DEFAULT=True)
   - is_staff: Boolean (inherited from AbstractUser)
   - is_superuser: Boolean (inherited from AbstractUser)
   - date_joined: DateTime (auto)
   - date_created: DateTime (auto)
   - date_modified: DateTime (auto)
   - Indexes: (username), (email), (role), (is_active)

2. inventory_category
   - PK: id (Integer, Auto-increment)
   - title: Varchar(100, UNIQUE, NOT NULL)
   - description: Text (nullable)
   - created_at: DateTime (auto)
   - updated_at: DateTime (auto)
   - Indexes: (title)

3. inventory_supplier
   - PK: id (Integer, Auto-increment)
   - name: Varchar(150, UNIQUE, NOT NULL)
   - contact_info: Varchar(255, nullable)
   - email: Varchar(254, nullable)
   - phone: Varchar(20, nullable)
   - address: Text (nullable)
   - created_at: DateTime (auto)
   - updated_at: DateTime (auto)
   - Indexes: (name)

4. inventory_item
   - PK: id (Integer, Auto-increment)
   - name: Varchar(200, NOT NULL)
   - description: Text (nullable)
   - sku: Varchar(50, UNIQUE, NOT NULL)
   - quantity: Integer (DEFAULT=0, CHECK quantity >= 0)
   - unit_price: Decimal(10, 2, DEFAULT=0.00, CHECK >= 0)
   - threshold_level: Integer (DEFAULT=10, CHECK >= 0)
   - category_id: Integer (NOT NULL) - FK to inventory_category
   - supplier_id: Integer (nullable) - FK to inventory_supplier
   - created_at: DateTime (auto)
   - updated_at: DateTime (auto)
   - Indexes: (sku), (name), (category_id), (supplier_id), (quantity), (created_at)

5. operations_stocktransaction
   - PK: id (Integer, Auto-increment)
   - item_id: Integer (NOT NULL) - FK to inventory_item
   - transaction_type: Varchar(20, NOT NULL) {IN | OUT | ADJUSTMENT}
   - quantity_changed: Integer (NOT NULL, CHECK > 0)
   - previous_quantity: Integer (NOT NULL, CHECK >= 0)
   - new_quantity: Integer (NOT NULL, CHECK >= 0)
   - user_id: Integer (nullable) - FK to accounts_customuser
   - notes: Text (nullable)
   - timestamp: DateTime (auto)
   - Indexes: (item_id, timestamp), (transaction_type, timestamp), (timestamp), (user_id)

RELATIONSHIPS:

1. inventory_category 1 ←→ * inventory_item
   - Relationship Type: One-to-Many
   - FK: inventory_item.category_id → inventory_category.id
   - Cardinality: (1,1) to (0,*)
   - Delete Rule: PROTECT (prevent deletion if items exist)
   - Notation: One category has many items

2. inventory_supplier 1 ←→ * inventory_item
   - Relationship Type: One-to-Many
   - FK: inventory_item.supplier_id → inventory_supplier.id
   - Cardinality: (1,1) to (0,*)
   - Delete Rule: SET NULL (items can exist without supplier)
   - Notation: One supplier supplies many items

3. inventory_item 1 ←→ * operations_stocktransaction
   - Relationship Type: One-to-Many
   - FK: operations_stocktransaction.item_id → inventory_item.id
   - Cardinality: (1,1) to (0,*)
   - Delete Rule: PROTECT (maintain transaction history)
   - Notation: One item has many transactions

4. accounts_customuser 1 ←→ * operations_stocktransaction
   - Relationship Type: One-to-Many
   - FK: operations_stocktransaction.user_id → accounts_customuser.id
   - Cardinality: (1,1) to (0,*)
   - Delete Rule: SET NULL (preserve transaction even if user deleted)
   - Notation: One user performs many transactions

CONSTRAINTS:

Primary Keys:
- All entities use surrogate keys (auto-increment integers)

Unique Constraints:
- accounts_customuser.username
- accounts_customuser.email
- inventory_category.title
- inventory_supplier.name
- inventory_item.sku

Check Constraints:
- inventory_item.quantity >= 0
- inventory_item.unit_price >= 0
- inventory_item.threshold_level >= 0
- operations_stocktransaction.quantity_changed > 0
- operations_stocktransaction.previous_quantity >= 0
- operations_stocktransaction.new_quantity >= 0

Foreign Key Constraints:
- ON DELETE PROTECT for Category → Item (maintain data integrity)
- ON DELETE SET NULL for Supplier → Item (allow orphaned items)
- ON DELETE PROTECT for Item → StockTransaction (preserve history)
- ON DELETE SET NULL for User → StockTransaction (preserve history)

Indexes for Performance:
- Primary keys are indexed by default
- Foreign keys indexed for JOIN performance
- Timestamp fields indexed for range queries
- SKU indexed for fast item lookup
- Category indexed for filtering

METADATA TABLES (Generated by Django):
- django_migrations: Migration history
- auth_group: User groups (if used)
- django_content_type: Model metadata
- django_session: Session storage

VISUAL STYLE FOR ERD:

Entity Representation:
- Use rectangular boxes for each entity
- Display entity name in bold at top
- List attributes in the box below entity name
- Mark PK with underline or "(PK)" notation
- Mark FK with "(FK)" notation
- Mark NOT NULL with asterisk (*)
- Mark UNIQUE with (U) notation

Relationship Lines:
- Use solid lines for relationships
- Show crow's foot notation (crow's foot, one-to-one, zero-or-many)
- Use circle for optional (0..1) cardinality
- Use vertical line for mandatory (1..1) cardinality
- Add relationship labels on lines
- Show delete rules (PROTECT, CASCADE, SET NULL) on lines

Color Coding:
- Authentication entities: Blue background
- Inventory entities: Green background
- Operations entities: Orange background
- Indexes: Bold text
- FK references: Italic text

Layout:
- Place core entities in center (Item)
- Arrange related entities around core
- Minimize line crossing
- Use hierarchical layout (users top, transactions bottom)
- Clearly show all many-to-one relationships

Annotations:
- Add notes for special constraints
- Indicate calculated fields
- Show data types for critical fields
- Include index information
```

---

## Usage Instructions

These prompts are designed to be used with:
1. **Mermaid.js** - For text-based diagram generation
2. **Lucidchart** - For interactive diagram creation
3. **Draw.io** - For free, open-source diagramming
4. **PlantUML** - For UML diagram generation
5. **AI Diagram Generators** (Claude with image generation, ChatGPT, etc.)

### Recommended Tools:
- **Architecture Diagram**: Mermaid, Draw.io, or Lucidchart
- **Use Case Diagram**: PlantUML, Lucidchart, or Mermaid
- **Class Diagram**: PlantUML, StarUML, or Mermaid
- **Activity Diagram**: PlantUML, Mermaid, or Lucidchart
- **ERD**: PlantUML, Mermaid, Draw.io, or specialized ERD tools

### Tips for Best Results:
1. Copy the entire prompt for your chosen diagram
2. Paste into your diagram tool
3. The tools should interpret the specifications directly
4. Adjust colors and styling as needed for your documentation
5. Export as PNG, SVG, or PDF for inclusion in documentation
