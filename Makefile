.PHONY: help run test lint migrate docker-up docker-down shell celery

# Default target
help: ## Show this help message
	@echo "Smart Inventory Management System"
	@echo "================================="
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development
run: ## Run the development server
	python manage.py runserver

shell: ## Open Django shell
	python manage.py shell

migrate: ## Run database migrations
	python manage.py makemigrations
	python manage.py migrate

createsuperuser: ## Create a superuser
	python manage.py createsuperuser

collectstatic: ## Collect static files
	python manage.py collectstatic --noinput

# Testing
test: ## Run all tests
	pytest

test-verbose: ## Run tests with verbose output
	pytest -v

test-coverage: ## Run tests with coverage report
	pytest --cov=. --cov-report=html --cov-report=term-missing

test-fast: ## Run tests without coverage (faster)
	pytest --no-cov -x

# Code Quality
lint: ## Run linting
	python -m flake8 . --max-line-length=120 --exclude=venv,migrations,__pycache__

check: ## Run Django system checks
	python manage.py check

check-deploy: ## Run deployment checks
	python manage.py check --deploy

# Docker
docker-up: ## Start all Docker services
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

docker-build: ## Build Docker images
	docker-compose build

docker-logs: ## View Docker logs
	docker-compose logs -f

docker-migrate: ## Run migrations in Docker
	docker-compose exec web python manage.py migrate

docker-shell: ## Open Django shell in Docker
	docker-compose exec web python manage.py shell

# Celery
celery: ## Start Celery worker
	celery -A config worker -l info

celery-beat: ## Start Celery beat scheduler
	celery -A config beat -l info

# Utilities
clean: ## Remove cached files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name '*.pyc' -delete 2>/dev/null || true
	rm -rf htmlcov .coverage .pytest_cache

seed: ## Load sample data
	python manage.py loaddata initial_data 2>/dev/null || echo "No fixture found"

reset-db: ## Reset the database (WARNING: destructive)
	python manage.py flush --no-input
