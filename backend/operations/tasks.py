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
def check_low_stock_levels(self):
    """
    Continuous stock level monitoring task running periodically via Celery Beat.
    
    1. Single optimised database query retrieving all items where quantity <= threshold_level.
    2. Creates Alert database records for each low-stock item, reflected in dashboard alert badge count.
    3. Constructs a formatted email notification listing each item with name, SKU, current quantity,
       and threshold level, and dispatches the email to all administrator email addresses.
    """
    from inventory.models import Item
    from operations.models import Alert
    from django.contrib.auth import get_user_model
    
    # Single optimised database query
    low_stock_items = list(Item.objects.filter(
        quantity__lte=F('threshold_level')
    ).select_related('category', 'supplier'))
    
    if not low_stock_items:
        return 'No low stock items'
    
    # Create Alert records in the database for each low-stock item
    alerts_created = 0
    for item in low_stock_items:
        alert, created = Alert.objects.get_or_create(
            item=item,
            is_resolved=False,
            defaults={
                'alert_type': 'LOW_STOCK',
                'message': f"Low stock warning: {item.name} (SKU: {item.sku}) has {item.quantity} units remaining (Threshold: {item.threshold_level}).",
                'quantity_at_alert': item.quantity,
                'threshold_at_alert': item.threshold_level,
            }
        )
        if created:
            alerts_created += 1
        else:
            alert.quantity_at_alert = item.quantity
            alert.threshold_at_alert = item.threshold_level
            alert.message = f"Low stock warning: {item.name} (SKU: {item.sku}) has {item.quantity} units remaining (Threshold: {item.threshold_level})."
            alert.save(update_fields=['quantity_at_alert', 'threshold_at_alert', 'message', 'updated_at'])

    # Construct formatted email notification listing each item with name, SKU, quantity, threshold level
    subject = f"Automated Alert: {len(low_stock_items)} Low Stock Item(s) Detected"
    
    items_list_lines = [
        f"• Name: {item.name} | SKU: {item.sku} | Current Quantity: {item.quantity} | Threshold Level: {item.threshold_level}"
        for item in low_stock_items
    ]
    
    email_body = (
        f"Automated Stock Level Monitoring System\n"
        f"----------------------------------------\n"
        f"The following {len(low_stock_items)} item(s) are currently at or below their low stock threshold level:\n\n"
        + "\n".join(items_list_lines) +
        f"\n\nPlease log in to the inventory dashboard to review and manage restock requests."
    )
    
    # Dispatch email to all configured administrator email addresses
    User = get_user_model()
    admin_emails = list(
        User.objects.filter(role='admin', is_active=True)
        .exclude(email='')
        .values_list('email', flat=True)
    )
    
    if hasattr(settings, 'ADMIN_EMAIL') and settings.ADMIN_EMAIL and settings.ADMIN_EMAIL not in admin_emails:
        admin_emails.append(settings.ADMIN_EMAIL)
    
    if not admin_emails:
        admin_emails = [getattr(settings, 'ADMIN_EMAIL', 'admin@example.com')]
        
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@inventory.system')
    
    try:
        send_mail(
            subject=subject,
            message=email_body,
            from_email=from_email,
            recipient_list=admin_emails,
            fail_silently=True,
        )
        logger.info(f"Low stock notification email sent to {len(admin_emails)} admins for {len(low_stock_items)} items.")
    except Exception as exc:
        logger.error(f"Error sending automated low stock alert emails: {exc}")
        
    return f"{len(low_stock_items)} low stock items processed ({alerts_created} new alerts created)"


@shared_task(bind=True, max_retries=3)
def check_low_stock_alerts(self):
    """Wrapper function for check_low_stock_levels for backward compatibility."""
    return check_low_stock_levels()


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
