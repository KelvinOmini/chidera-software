# Smart Inventory Management System

A comprehensive web-based inventory management system built with Django, featuring real-time tracking, role-based access control, and advanced reporting capabilities.

## Features

### Core Functionality
- **User Authentication & Authorization**: Secure login with role-based access control (Admin, Manager, Staff)
- **Inventory Management**: Add, update, delete, and view inventory items with detailed tracking
- **Stock Operations**: Real-time stock-in/out operations with automatic transaction logging
- **Smart Alerts**: Low-stock threshold alerts and predictive restocking suggestions
- **Reporting**: Comprehensive reports with filtering, date range selection, and CSV export
- **Dashboard**: Interactive dashboard with charts, summary cards, and recent activity tracking

### Technical Features
- PostgreSQL database for scalability
- Role-based permissions system
- CSRF protection and input validation
- Responsive Bootstrap UI
- RESTful API endpoints
- Comprehensive test coverage

## System Requirements

- Python 3.9+
- PostgreSQL 12+
- Redis (optional, for caching/tasks)

## Installation

### 1. Clone and Setup

```bash
cd /Users/masterkelvin/Documents/Chidera/inventory_system
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Database Configuration

Create a PostgreSQL database:

```sql
CREATE DATABASE inventory_system;
CREATE USER inventory_user WITH PASSWORD 'your_secure_password';
ALTER ROLE inventory_user SET client_encoding TO 'utf8';
ALTER ROLE inventory_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE inventory_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE inventory_system TO inventory_user;
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_ENGINE=django.db.backends.postgresql
DB_NAME=inventory_system
DB_USER=inventory_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
```

### 4. Initialize Database

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py loaddata initial_data  # Optional: Load sample data
```

### 5. Run Development Server

```bash
python manage.py runserver
```

Access the application at `http://localhost:8000`

## Project Structure

```
inventory_system/
├── manage.py
├── requirements.txt
├── .env
├── config/                    # Project settings
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── accounts/                  # Authentication & User Management
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── forms.py
│   ├── decorators.py
│   └── templates/
├── inventory/                 # Inventory Management
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── forms.py
│   ├── serializers.py
│   └── templates/
├── operations/                # Stock Operations
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py
│   └── templates/
├── reports/                   # Reporting & Analytics
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── services.py
│   └── templates/
├── dashboard/                 # Dashboard & Widgets
│   ├── views.py
│   ├── urls.py
│   ├── services.py
│   └── templates/
├── static/                    # Static files (CSS, JS, images)
│   ├── css/
│   ├── js/
│   └── img/
├── media/                     # User-uploaded files
└── tests/                     # Test suite
    ├── test_models.py
    ├── test_views.py
    ├── test_operations.py
    └── test_reports.py
```

## Usage

### Admin Panel
Access Django admin at `/admin` with superuser credentials.

### User Roles

1. **Admin**: Full system access, user management, system configuration
2. **Manager**: Inventory management, operations, reporting
3. **Staff**: Limited operations, view-only access to reports

### Common Tasks

#### Add Inventory Item
1. Navigate to Inventory → Add Item
2. Fill in item details (name, SKU, quantity, category, supplier)
3. Set low-stock threshold
4. Save

#### Stock In/Out
1. Navigate to Operations
2. Select item and transaction type
3. Enter quantity
4. System automatically logs transaction

#### Generate Reports
1. Navigate to Reports
2. Select filters (date range, transaction type, category)
3. View or export as CSV

## API Endpoints

### Items
- `GET /api/items/` - List all items
- `POST /api/items/` - Create item
- `GET /api/items/{id}/` - Get item details
- `PUT /api/items/{id}/` - Update item
- `DELETE /api/items/{id}/` - Delete item

### Transactions
- `GET /api/transactions/` - List transactions
- `POST /api/transactions/` - Create transaction
- `GET /api/transactions/{id}/` - Get transaction details

### Reports
- `GET /api/reports/summary/` - Get summary data
- `GET /api/reports/transactions/` - Get transaction report

## Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_models.py

# Run specific test
pytest tests/test_models.py::TestItemModel::test_create_item
```

## Performance Optimization

- Database indexing on frequently queried fields (SKU, name, category)
- Pagination for large datasets
- Caching for dashboard data
- Query optimization with select_related/prefetch_related

## Security Features

- CSRF protection on all forms
- Input validation and sanitization
- SQL injection prevention (Django ORM)
- Password hashing (PBKDF2)
- Role-based access control
- Secure session management

## Deployment

### Production Checklist
- [ ] Set `DEBUG=False` in settings
- [ ] Configure allowed hosts
- [ ] Use environment variables for secrets
- [ ] Set up PostgreSQL with proper backups
- [ ] Configure static file serving (WhiteNoise/CDN)
- [ ] Set up SSL/TLS certificates
- [ ] Configure logging and monitoring
- [ ] Run security checks: `python manage.py check --deploy`

### Docker Deployment (Optional)

```bash
docker-compose up -d
```

## Contributing

1. Follow Django best practices
2. Write tests for new features
3. Maintain code style consistency
4. Document API changes

## License

MIT License

## Support

For issues or questions, contact the development team.
