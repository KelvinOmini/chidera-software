import csv
from io import StringIO
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from accounts.decorators import manager_required
from .services import ReportService
from operations.models import StockTransaction


@manager_required
@require_http_methods(["GET"])
def inventory_summary(request):
    """Display inventory summary report."""
    summary = ReportService.get_inventory_summary()
    stock_movement = ReportService.get_stock_movement_report(days=30)
    category_report = ReportService.get_category_report()
    
    context = {
        'summary': summary,
        'stock_movement': stock_movement,
        'category_report': category_report,
    }
    return render(request, 'reports/inventory_summary.html', context)


@manager_required
@require_http_methods(["GET"])
def low_stock_report(request):
    """Display low stock items report."""
    items = ReportService.get_low_stock_report()
    
    context = {
        'items': items,
        'count': items.count(),
    }
    return render(request, 'reports/low_stock_report.html', context)


@manager_required
@require_http_methods(["GET"])
def transaction_report(request):
    """Display transaction report with filters."""
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    transaction_type = request.GET.get('type', '')
    
    transactions = ReportService.get_transaction_report(
        date_from=date_from if date_from else None,
        date_to=date_to if date_to else None,
        transaction_type=transaction_type if transaction_type else None,
    )
    
    context = {
        'transactions': transactions,
        'date_from': date_from,
        'date_to': date_to,
        'transaction_type': transaction_type,
        'transaction_types': StockTransaction.TRANSACTION_TYPE_CHOICES,
    }
    return render(request, 'reports/transaction_report.html', context)


@manager_required
@require_http_methods(["GET"])
def export_transactions_csv(request):
    """Export transactions to CSV."""
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    transaction_type = request.GET.get('type', '')
    
    transactions = ReportService.get_transaction_report(
        date_from=date_from if date_from else None,
        date_to=date_to if date_to else None,
        transaction_type=transaction_type if transaction_type else None,
    )
    
    fields = ['item', 'transaction_type', 'quantity_changed', 'previous_quantity', 'new_quantity', 'user', 'timestamp']
    csv_data = ReportService.export_to_csv(transactions, fields)
    
    response = HttpResponse(csv_data, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="transactions_report.csv"'
    return response


@manager_required
@require_http_methods(["GET"])
def export_inventory_csv(request):
    """Export inventory to CSV with proper escaping (prevents CSV injection)."""
    from inventory.models import Item
    
    items = Item.objects.select_related('category', 'supplier').all()
    
    output = StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_ALL)
    
    # Write header
    writer.writerow(['Name', 'SKU', 'Quantity', 'Category', 'Supplier',
                     'Threshold', 'Unit Price', 'Total Value', 'Status'])
    
    # Write data with proper escaping
    for item in items:
        writer.writerow([
            item.name,
            item.sku,
            item.quantity,
            item.category.title,
            item.supplier.name if item.supplier else 'N/A',
            item.threshold_level,
            str(item.unit_price),
            str(item.get_total_value()),
            item.get_stock_status(),
        ])
    
    csv_data = output.getvalue()
    response = HttpResponse(csv_data, content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="inventory_report.csv"'
    return response
