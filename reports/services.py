from django.db.models import Sum, Count, Q, F, ExpressionWrapper, DecimalField
from django.utils import timezone
from datetime import timedelta
from inventory.models import Item, Category
from operations.models import StockTransaction
import csv
from io import StringIO


class ReportService:
    """Service for generating reports with optimized queries."""
    
    @staticmethod
    def get_inventory_summary():
        """Get overall inventory summary using database aggregation (no N+1)."""
        items = Item.objects.all()
        
        # Use database-level aggregation instead of Python iteration
        aggregates = items.aggregate(
            total_quantity=Sum('quantity'),
            total_value=Sum(
                ExpressionWrapper(
                    F('quantity') * F('unit_price'),
                    output_field=DecimalField(max_digits=14, decimal_places=2)
                )
            ),
        )
        
        return {
            'total_items': items.count(),
            'total_quantity': aggregates['total_quantity'] or 0,
            'low_stock_count': items.filter(quantity__lte=F('threshold_level'), quantity__gt=0).count(),
            'out_of_stock_count': items.filter(quantity=0).count(),
            'total_value': aggregates['total_value'] or 0,
            'categories_count': Category.objects.count(),
        }
    
    @staticmethod
    def get_stock_movement_report(days=30):
        """Get stock movement report for the last N days."""
        date_from = timezone.now() - timedelta(days=days)
        
        transactions = StockTransaction.objects.filter(
            timestamp__gte=date_from
        ).select_related('item')
        
        stock_in = transactions.filter(transaction_type='IN').aggregate(
            Sum('quantity_changed')
        )['quantity_changed__sum'] or 0
        
        stock_out = transactions.filter(transaction_type='OUT').aggregate(
            Sum('quantity_changed')
        )['quantity_changed__sum'] or 0
        
        adjustments = transactions.filter(transaction_type='ADJUSTMENT').count()
        
        return {
            'period_days': days,
            'stock_in_total': stock_in,
            'stock_out_total': stock_out,
            'adjustments_count': adjustments,
            'total_transactions': transactions.count(),
        }
    
    @staticmethod
    def get_category_report():
        """Get inventory report by category using optimized database queries."""
        categories = Category.objects.annotate(
            item_count=Count('items'),
            total_quantity=Sum('items__quantity'),
            total_value=Sum(
                ExpressionWrapper(
                    F('items__quantity') * F('items__unit_price'),
                    output_field=DecimalField(max_digits=14, decimal_places=2)
                )
            ),
            low_stock_count=Count(
                'items',
                filter=Q(items__quantity__lte=F('items__threshold_level'))
            ),
        ).all()
        
        report_data = []
        for category in categories:
            report_data.append({
                'category': category.title,
                'item_count': category.item_count or 0,
                'total_quantity': category.total_quantity or 0,
                'total_value': category.total_value or 0,
                'low_stock_count': category.low_stock_count or 0,
            })
        
        return report_data
    
    @staticmethod
    def get_low_stock_report():
        """Get items that are low on stock."""
        items = Item.objects.filter(
            quantity__lte=F('threshold_level')
        ).select_related('category', 'supplier').order_by('quantity')
        
        return items
    
    @staticmethod
    def get_transaction_report(date_from=None, date_to=None, transaction_type=None, item_id=None):
        """Get detailed transaction report with filters."""
        transactions = StockTransaction.objects.select_related('item', 'user').all()
        
        if date_from:
            transactions = transactions.filter(timestamp__gte=date_from)
        if date_to:
            transactions = transactions.filter(timestamp__lte=date_to)
        if transaction_type:
            transactions = transactions.filter(transaction_type=transaction_type)
        if item_id:
            transactions = transactions.filter(item_id=item_id)
        
        return transactions.order_by('-timestamp')
    
    @staticmethod
    def export_to_csv(queryset, fields, filename='report.csv'):
        """Export queryset to CSV with proper escaping."""
        output = StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        
        # Write header
        writer.writerow(fields)
        
        # Write data with proper escaping
        for obj in queryset:
            row = []
            for field in fields:
                value = getattr(obj, field, '')
                if hasattr(value, '__call__'):
                    value = value()
                # Sanitize values to prevent CSV injection
                str_value = str(value) if value is not None else ''
                if str_value.startswith(('=', '+', '-', '@', '\t', '\n')):
                    str_value = f"'{str_value}"
                row.append(str_value)
            writer.writerow(row)
        
        return output.getvalue()
