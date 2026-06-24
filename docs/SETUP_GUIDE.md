# Smart Inventory Management System - Setup Guide

## Quick Start

### 1. Prerequisites
- Python 3.9 or higher
- PostgreSQL 12 or higher (or SQLite for development)
- pip and virtualenv

### 2. Installation Steps

#### Step 1: Clone and Navigate
```bash
cd /Users/masterkelvin/Documents/Chidera/inventory_system
```

#### Step 2: Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

#### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```
DEBUG=True
SECRET_KEY=your-secret-key-here-change-in-production
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
```

**For PostgreSQL (Production):**

```
DEBUG=False
SECRET_KEY=your-secret-key-here
DB_ENGINE=django.db.backends.postgresql
DB_NAME=inventory_system
DB_USER=inventory_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
```

#### Step 5: Database Setup

**SQLite (Development):**
```bash
python manage.py migrate
```

**PostgreSQL (Production):**

First, create the database and user:

```sql
CREATE DATABASE inventory_system;
CREATE USER inventory_user WITH PASSWORD 'your_secure_password';
ALTER ROLE inventory_user SET client_encoding TO 'utf8';
ALTER ROLE inventory_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE inventory_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE inventory_system TO inventory_user;
```

Then run migrations:

```bash
python manage.py migrate
```

#### Step 6: Create Superuser
```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin account.

#### Step 7: Run Development Server
```bash
python manage.py runserver
```

Access the application at: `http://localhost:8000`

### 3. Default Login Credentials

After creating a superuser, use those credentials to login.

### 4. Initial Data Setup

#### Create Sample Data (Optional)

```bash
python manage.py shell
```

Then in the shell:

```python
from inventory.models import Category, Supplier, Item
from accounts.models import CustomUser

# Create categories
electronics = Category.objects.create(title='Electronics', description='Electronic items')
furniture = Category.objects.create(title='Furniture', description='Office furniture')

# Create suppliers
supplier1 = Supplier.objects.create(name='Tech Supplier', email='tech@supplier.com')
supplier2 = Supplier.objects.create(name='Furniture Co', email='furniture@supplier.com')

# Create items
Item.objects.create(
    name='Laptop',
    sku='LAPTOP-001',
    quantity=50,
    category=electronics,
    supplier=supplier1,
    threshold_level=10,
    unit_price=999.99
)

Item.objects.create(
    name='Office Chair',
    sku='CHAIR-001',
    quantity=100,
    category=furniture,
    supplier=supplier2,
    threshold_level=20,
    unit_price=199.99
)

exit()
```

## Project Structure

```
inventory_system/
├── manage.py
├── requirements.txt
├── .env
├── .env.example
├── pytest.ini
├── README.md
├── SETUP_GUIDE.md
├── config/                 # Django settings
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── accounts/              # User authentication
│   ├── models.py
│   ├── views.py
│   ├── forms.py
│   ├── urls.py
│   ├── decorators.py
│   └── admin.py
├── inventory/             # Inventory management
│   ├── models.py
│   ├── views.py
│   ├── forms.py
│   ├── urls.py
│   └── admin.py
├── operations/            # Stock operations
│   ├── models.py
│   ├── views.py
│   ├── forms.py
│   ├── services.py
│   ├── urls.py
│   └── admin.py
├── reports/              # Reporting
│   ├── models.py
│   ├── views.py
│   ├── services.py
│   ├── urls.py
│   └── admin.py
├── dashboard/            # Dashboard
│   ├── models.py
│   ├── views.py
│   ├── services.py
│   ├── urls.py
│   └── admin.py
├── templates/            # HTML templates
│   ├── base.html
│   ├── accounts/
│   ├── inventory/
│   ├── operations/
│   ├── reports/
│   └── dashboard/
├── static/              # Static files (CSS, JS, images)
├── media/               # User uploads
├── tests/               # Test suite
│   ├── test_models.py
│   ├── test_operations.py
│   └── conftest.py
└── logs/                # Application logs
```

## Running Tests

### Run All Tests
```bash
pytest
```

### Run with Coverage
```bash
pytest --cov=. --cov-report=html
```

### Run Specific Test File
```bash
pytest tests/test_models.py
```

### Run Specific Test
```bash
pytest tests/test_models.py::TestCustomUser::test_user_creation
```

## Common Commands

### Create Migrations
```bash
python manage.py makemigrations
```

### Apply Migrations
```bash
python manage.py migrate
```

### Create Superuser
```bash
python manage.py createsuperuser
```

### Access Django Shell
```bash
python manage.py shell
```

### Collect Static Files (Production)
```bash
python manage.py collectstatic --noinput
```

### Run Development Server
```bash
python manage.py runserver
```

### Run with Different Port
```bash
python manage.py runserver 8080
```

## Features Overview

### User Roles

1. **Admin**: Full system access, user management
2. **Manager**: Inventory management, operations, reporting
3. **Staff**: Limited operations, view-only reports

### Core Modules

#### Accounts
- User authentication and authorization
- Role-based access control
- User profile management

#### Inventory
- Item management (CRUD)
- Category management
- Supplier management
- Stock status tracking

#### Operations
- Stock in/out transactions
- Stock adjustments
- Transaction history
- Automatic logging

#### Reports
- Inventory summary
- Low stock alerts
- Transaction reports
- CSV export

#### Dashboard
- Real-time inventory overview
- Stock movement charts
- Category distribution
- Recent transactions
- Low stock alerts

## Security Considerations

### Development
- DEBUG=True (for development only)
- SQLite database
- Local testing

### Production
- DEBUG=False
- PostgreSQL database
- HTTPS/SSL enabled
- Strong SECRET_KEY
- Environment variables for secrets
- CSRF protection enabled
- Secure cookies
- Input validation
- SQL injection prevention

## Performance Tips

1. **Database Indexing**: Frequently queried fields are indexed
2. **Query Optimization**: Use select_related() and prefetch_related()
3. **Pagination**: Large datasets are paginated
4. **Caching**: Dashboard data can be cached
5. **Static Files**: Use WhiteNoise for efficient serving

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U inventory_user -d inventory_system
```

### Migration Issues
```bash
# Reset migrations (development only)
python manage.py migrate accounts zero
python manage.py migrate
```

### Static Files Not Loading
```bash
python manage.py collectstatic --clear --noinput
```

### Permission Denied Errors
```bash
# Check user role
python manage.py shell
from accounts.models import CustomUser
user = CustomUser.objects.get(username='username')
print(user.role)
```

## Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```

### Using Docker
```bash
docker build -t inventory-system .
docker run -p 8000:8000 inventory-system
```

### Using Heroku
```bash
heroku create your-app-name
git push heroku main
heroku run python manage.py migrate
```

## Support and Documentation

- Django Documentation: https://docs.djangoproject.com/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Bootstrap Documentation: https://getbootstrap.com/docs/
- Chart.js Documentation: https://www.chartjs.org/docs/

## License

MIT License - See LICENSE file for details
