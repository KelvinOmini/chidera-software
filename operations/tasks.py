"""
Background tasks for inventory operations.
"""

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import F
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def check_low_stock_alerts(self):
    """
    Check all items for low stock and trigger notifications.
    Runs periodically via Celery Beat.
    """
    from inventory.models import Item
    
    low_stock_items = Item.objects.filter(
        quantity__lte=F('threshold_level')
    ).select_related('category', 'supplier')
    
    if low_stock_items.exists():
        count = low_stock_items.count()
        items_list = '\n'.join([
            f"  - {item.name} (SKU: {item.sku}): {item.quantity} units "
            f"(threshold: {item.threshold_level})"
            for item in low_stock_items[:20]
        ])
        
        logger.warning(
            f"Low stock alert: {count} items below threshold.\n{items_list}"
        )
        
        return f'{count} low stock items detected'
    
    return 'No low stock items'


@shared_task(bind=True, max_retries=3)
def send_low_stock_email(self, item_id):
    """Send email notification for a specific low-stock item."""
    from inventory.models import Item
    
    try:
        item = Item.objects.select_related('category', 'supplier').get(pk=item_id)
        
        if item.is_low_stock():
            subject = f'Low Stock Alert: {item.name} (SKU: {item.sku})'
            message = (
                f"Item: {item.name}\n"
                f"SKU: {item.sku}\n"
                f"Current Quantity: {item.quantity}\n"
                f"Threshold: {item.threshold_level}\n"
                f"Category: {item.category.title}\n"
                f"Supplier: {item.supplier.name if item.supplier else 'N/A'}\n\n"
                f"Please restock this item as soon as possible."
            )
            
            logger.info(f"Low stock email queued for {item.name}")
            
            # Only send if email backend is configured
            if hasattr(settings, 'EMAIL_HOST') and settings.EMAIL_HOST:
                send_mail(
                    subject=subject,
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.ADMIN_EMAIL] if hasattr(settings, 'ADMIN_EMAIL') else [],
                    fail_silently=True,
                )
            
            return f'Alert sent for {item.name}'
        
        return f'{item.name} is not low stock'
    
    except Exception as exc:
        logger.error(f"Error sending low stock email for item {item_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task
def generate_daily_report():
    """Generate daily inventory summary report."""
    from reports.services import ReportService
    
    summary = ReportService.get_inventory_summary()
    movement = ReportService.get_stock_movement_report(days=1)
    
    logger.info(
        f"Daily Report: {summary['total_items']} items, "
        f"{summary['total_quantity']} total units, "
        f"{summary['low_stock_count']} low stock, "
        f"{movement['total_transactions']} transactions today"
    )
    
    return {
        'total_items': summary['total_items'],
        'low_stock': summary['low_stock_count'],
        'transactions_today': movement['total_transactions'],
    }
