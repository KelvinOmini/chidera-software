from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta
from inventory.models import Item, Category, Supplier
from operations.models import StockTransaction


class DashboardService:
    """Service for dashboard data."""
    
    @staticmethod
    def get_dashboard_data():
        """Get all dashboard data."""
        return {
            'summary_cards': DashboardService.get_summary_cards(),
            'recent_transactions': DashboardService.get_recent_transactions(limit=10),
            'low_stock_items': DashboardService.get_low_stock_items(limit=5),
            'stock_movement_data': DashboardService.get_stock_movement_chart_data(),
            'category_distribution': DashboardService.get_category_distribution(),
        }
    
    @staticmethod
    def get_summary_cards():
        """Get summary card data."""
        items = Item.objects.all()
        
        return {
            'total_items': items.count(),
            'total_quantity': items.aggregate(Sum('quantity'))['quantity__sum'] or 0,
            'low_stock_count': items.filter(quantity__lte=F('threshold_level')).count(),
            'categories': Category.objects.count(),
            'suppliers': Supplier.objects.count(),
            'total_transactions': StockTransaction.objects.count(),
        }
    
    @staticmethod
    def get_recent_transactions(limit=10):
        """Get recent transactions."""
        return StockTransaction.objects.select_related(
            'item', 'user'
        ).order_by('-timestamp')[:limit]
    
    @staticmethod
    def get_low_stock_items(limit=5):
        """Get low stock items."""
        return Item.objects.filter(
            quantity__lte=F('threshold_level')
        ).select_related('category', 'supplier').order_by('quantity')[:limit]
    
    @staticmethod
    def get_stock_movement_chart_data(days=30):
        """Get stock movement data for chart."""
        date_from = timezone.now() - timedelta(days=days)
        
        transactions = StockTransaction.objects.filter(
            timestamp__gte=date_from
        ).values('transaction_type').annotate(
            count=Count('id'),
            total_quantity=Sum('quantity_changed')
        )
        
        data = {
            'stock_in': 0,
            'stock_out': 0,
            'adjustments': 0,
        }
        
        for transaction in transactions:
            if transaction['transaction_type'] == 'IN':
                data['stock_in'] = transaction['total_quantity']
            elif transaction['transaction_type'] == 'OUT':
                data['stock_out'] = transaction['total_quantity']
            elif transaction['transaction_type'] == 'ADJUSTMENT':
                data['adjustments'] = transaction['count']
        
        return data
    
    @staticmethod
    def get_category_distribution():
        """Get inventory distribution by category."""
        categories = Category.objects.annotate(
            item_count=Count('items'),
            total_quantity=Sum('items__quantity')
        ).all()
        
        return [
            {
                'name': category.title,
                'items': category.item_count or 0,
                'quantity': category.total_quantity or 0,
            }
            for category in categories
        ]
    
    @staticmethod
    def get_activity_timeline(days=7):
        """Get activity timeline for the last N days."""
        date_from = timezone.now() - timedelta(days=days)
        
        transactions = StockTransaction.objects.filter(
            timestamp__gte=date_from
        ).select_related('item', 'user').order_by('-timestamp')
        
        return transactions
