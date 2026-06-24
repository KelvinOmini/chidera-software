#!/bin/bash

# Smart Inventory Management System - Quick Start Script
# This script sets up the development environment

echo "🚀 Smart Inventory Management System - Quick Start"
echo "=================================================="
echo ""

# Check Python version
echo "✓ Checking Python version..."
python_version=$(python --version 2>&1 | awk '{print $2}')
echo "  Python version: $python_version"
echo ""

# Create virtual environment
echo "✓ Creating virtual environment..."
python -m venv venv
source venv/bin/activate
echo "  Virtual environment created and activated"
echo ""

# Install dependencies
echo "✓ Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "  Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "✓ Creating .env file..."
    cp .env.example .env
    echo "  .env file created (please update with your settings)"
else
    echo "✓ .env file already exists"
fi
echo ""

# Run migrations
echo "✓ Running database migrations..."
python manage.py migrate
echo "  Migrations completed"
echo ""

# Create superuser
echo "✓ Creating superuser..."
echo "  Please enter superuser credentials:"
python manage.py createsuperuser
echo ""

# Collect static files
echo "✓ Collecting static files..."
python manage.py collectstatic --noinput
echo "  Static files collected"
echo ""

# Create logs directory
echo "✓ Creating logs directory..."
mkdir -p logs
echo "  Logs directory created"
echo ""

echo "=================================================="
echo "✅ Setup Complete!"
echo ""
echo "To start the development server, run:"
echo "  python manage.py runserver"
echo ""
echo "Then access the application at:"
echo "  http://localhost:8000"
echo ""
echo "Admin panel:"
echo "  http://localhost:8000/admin"
echo ""
echo "Default credentials: (use the superuser you just created)"
echo ""
