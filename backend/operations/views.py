from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db.models import Q
from django.conf import settings
from accounts.decorators import manager_required
from inventory.models import Item
from .models import StockTransaction
from .forms import StockTransactionForm
from .services import StockOperationService


@manager_required
@require_http_methods(["GET", "POST"])
def transaction_create(request):
    """Create a new stock transaction."""
    if request.method == 'POST':
        form = StockTransactionForm(request.POST)
        if form.is_valid():
            try:
                item = form.cleaned_data['item']
                transaction_type = form.cleaned_data['transaction_type']
                quantity = form.cleaned_data['quantity_changed']
                notes = form.cleaned_data.get('notes', '')
                
                ip_address = request.META.get('REMOTE_ADDR')
                user_agent = request.META.get('HTTP_USER_AGENT')
                
                if transaction_type == 'IN':
                    StockOperationService.stock_in(item, quantity, request.user, notes, ip_address, user_agent)
                    messages.success(request, f'Stock in: {quantity} units added to {item.name}')
                elif transaction_type == 'OUT':
                    StockOperationService.stock_out(item, quantity, request.user, notes, ip_address, user_agent)
                    messages.success(request, f'Stock out: {quantity} units removed from {item.name}')
                elif transaction_type == 'ADJUSTMENT':
                    StockOperationService.adjust_stock(item, quantity, request.user, notes, ip_address, user_agent)
                    messages.success(request, f'Stock adjusted: {item.name} quantity set to {quantity}')
                
                return redirect('operations:transaction_list')
            except ValidationError as e:
                messages.error(request, str(e))
    else:
        form = StockTransactionForm()
    
    return render(request, 'operations/transaction_form.html', {'form': form})


@login_required(login_url='accounts:login')
@require_http_methods(["GET"])
def transaction_list(request):
    """Display list of stock transactions with pagination."""
    transactions = StockTransaction.objects.select_related('item', 'user').all()
    
    # Filter by item
    item_id = request.GET.get('item', '')
    if item_id:
        transactions = transactions.filter(item_id=item_id)
    
    # Filter by transaction type
    transaction_type = request.GET.get('type', '')
    if transaction_type:
        transactions = transactions.filter(transaction_type=transaction_type)
    
    # Filter by date range
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    if date_from:
        transactions = transactions.filter(timestamp__gte=date_from)
    if date_to:
        transactions = transactions.filter(timestamp__lte=date_to)
    
    # Search by item name or notes
    search_query = request.GET.get('search', '')
    if search_query:
        transactions = transactions.filter(
            Q(item__name__icontains=search_query) |
            Q(item__sku__icontains=search_query) |
            Q(notes__icontains=search_query)
        )
    
    # Pagination
    paginator = Paginator(transactions, getattr(settings, 'ITEMS_PER_PAGE', 20))
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'transactions': page_obj,
        'items': Item.objects.only('id', 'name', 'sku').all(),
        'transaction_types': StockTransaction.TRANSACTION_TYPE_CHOICES,
        'search_query': search_query,
        'item_filter': item_id,
        'type_filter': transaction_type,
        'page_obj': page_obj,
        'total_count': paginator.count,
    }
    return render(request, 'operations/transaction_list.html', context)


@login_required(login_url='accounts:login')
@require_http_methods(["GET"])
def transaction_detail(request, pk):
    """Display transaction details."""
    transaction = get_object_or_404(StockTransaction, pk=pk)
    context = {'transaction': transaction}
    return render(request, 'operations/transaction_detail.html', context)


@login_required(login_url='accounts:login')
@require_http_methods(["GET"])
def item_transactions(request, item_id):
    """Display all transactions for a specific item with pagination."""
    item = get_object_or_404(Item, pk=item_id)
    transactions = item.transactions.select_related('user').all()
    
    # Pagination
    paginator = Paginator(transactions, getattr(settings, 'ITEMS_PER_PAGE', 20))
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'item': item,
        'transactions': page_obj,
        'page_obj': page_obj,
    }
    return render(request, 'operations/item_transactions.html', context)
