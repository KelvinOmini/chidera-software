from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.db.models import Q, Count, F
from django.core.paginator import Paginator
from django.conf import settings
from accounts.decorators import manager_required
from .models import Item, Category, Supplier
from .forms import ItemForm, CategoryForm, SupplierForm, ItemFilterForm


@login_required(login_url='accounts:login')
@require_http_methods(["GET"])
def item_list(request):
    """Display list of inventory items with filtering and pagination."""
    items = Item.objects.select_related('category', 'supplier').all()
    
    # Search functionality
    search_query = request.GET.get('search', '')
    if search_query:
        items = items.filter(
            Q(name__icontains=search_query) |
            Q(sku__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    
    # Filter by category
    category_id = request.GET.get('category', '')
    if category_id:
        items = items.filter(category_id=category_id)
    
    # Filter by supplier
    supplier_id = request.GET.get('supplier', '')
    if supplier_id:
        items = items.filter(supplier_id=supplier_id)
    
    # Filter by stock status
    stock_status = request.GET.get('stock_status', '')
    if stock_status == 'in_stock':
        items = items.filter(quantity__gt=F('threshold_level'))
    elif stock_status == 'low_stock':
        items = items.filter(quantity__lte=F('threshold_level'), quantity__gt=0)
    elif stock_status == 'out_of_stock':
        items = items.filter(quantity=0)
    
    form = ItemFilterForm(request.GET)
    
    # Pagination
    paginator = Paginator(items, getattr(settings, 'ITEMS_PER_PAGE', 20))
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'items': page_obj,
        'form': form,
        'search_query': search_query,
        'page_obj': page_obj,
        'total_count': paginator.count,
        'categories': Category.objects.all(),
        'suppliers': Supplier.objects.all(),
        'type_filter': stock_status,
    }
    return render(request, 'inventory/item_list.html', context)


@login_required(login_url='accounts:login')
@require_http_methods(["GET"])
def item_detail(request, pk):
    """Display item details."""
    item = get_object_or_404(Item, pk=pk)
    recent_transactions = item.transactions.select_related('user').order_by('-timestamp')[:10]
    context = {
        'item': item,
        'recent_transactions': recent_transactions,
    }
    return render(request, 'inventory/item_detail.html', context)


@manager_required
@require_http_methods(["GET", "POST"])
def item_create(request):
    """Create a new inventory item."""
    if request.method == 'POST':
        form = ItemForm(request.POST)
        if form.is_valid():
            item = form.save()
            messages.success(request, f'Item {item.name} created successfully.')
            return redirect('inventory:item_detail', pk=item.pk)
    else:
        form = ItemForm()
    
    return render(request, 'inventory/item_form.html', {'form': form, 'title': 'Add Item'})


@manager_required
@require_http_methods(["GET", "POST"])
def item_update(request, pk):
    """Update an inventory item."""
    item = get_object_or_404(Item, pk=pk)
    
    if request.method == 'POST':
        form = ItemForm(request.POST, instance=item)
        if form.is_valid():
            form.save()
            messages.success(request, f'Item {item.name} updated successfully.')
            return redirect('inventory:item_detail', pk=item.pk)
    else:
        form = ItemForm(instance=item)
    
    return render(request, 'inventory/item_form.html', {
        'form': form,
        'title': f'Edit Item: {item.name}',
        'item': item
    })


@manager_required
@require_http_methods(["POST"])
def item_delete(request, pk):
    """Delete an inventory item."""
    item = get_object_or_404(Item, pk=pk)
    item_name = item.name
    item.delete()
    messages.success(request, f'Item {item_name} deleted successfully.')
    return redirect('inventory:item_list')


@login_required(login_url='accounts:login')
@require_http_methods(["GET"])
def category_list(request):
    """Display list of categories with pagination."""
    categories = Category.objects.annotate(item_count=Count('items')).all()
    
    paginator = Paginator(categories, getattr(settings, 'ITEMS_PER_PAGE', 20))
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'categories': page_obj,
        'page_obj': page_obj,
    }
    return render(request, 'inventory/category_list.html', context)


@manager_required
@require_http_methods(["GET", "POST"])
def category_create(request):
    """Create a new category."""
    if request.method == 'POST':
        form = CategoryForm(request.POST)
        if form.is_valid():
            category = form.save()
            messages.success(request, f'Category {category.title} created successfully.')
            return redirect('inventory:category_list')
    else:
        form = CategoryForm()
    
    return render(request, 'inventory/category_form.html', {'form': form, 'title': 'Add Category'})


@manager_required
@require_http_methods(["GET", "POST"])
def category_update(request, pk):
    """Update a category."""
    category = get_object_or_404(Category, pk=pk)
    
    if request.method == 'POST':
        form = CategoryForm(request.POST, instance=category)
        if form.is_valid():
            form.save()
            messages.success(request, f'Category {category.title} updated successfully.')
            return redirect('inventory:category_list')
    else:
        form = CategoryForm(instance=category)
    
    return render(request, 'inventory/category_form.html', {
        'form': form,
        'title': f'Edit Category: {category.title}'
    })


@manager_required
@require_http_methods(["POST"])
def category_delete(request, pk):
    """Delete a category."""
    category = get_object_or_404(Category, pk=pk)
    category_name = category.title
    category.delete()
    messages.success(request, f'Category {category_name} deleted successfully.')
    return redirect('inventory:category_list')


@login_required(login_url='accounts:login')
@require_http_methods(["GET"])
def supplier_list(request):
    """Display list of suppliers with pagination."""
    suppliers = Supplier.objects.annotate(item_count=Count('items')).all()
    
    paginator = Paginator(suppliers, getattr(settings, 'ITEMS_PER_PAGE', 20))
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'suppliers': page_obj,
        'page_obj': page_obj,
    }
    return render(request, 'inventory/supplier_list.html', context)


@manager_required
@require_http_methods(["GET", "POST"])
def supplier_create(request):
    """Create a new supplier."""
    if request.method == 'POST':
        form = SupplierForm(request.POST)
        if form.is_valid():
            supplier = form.save()
            messages.success(request, f'Supplier {supplier.name} created successfully.')
            return redirect('inventory:supplier_list')
    else:
        form = SupplierForm()
    
    return render(request, 'inventory/supplier_form.html', {'form': form, 'title': 'Add Supplier'})


@manager_required
@require_http_methods(["GET", "POST"])
def supplier_update(request, pk):
    """Update a supplier."""
    supplier = get_object_or_404(Supplier, pk=pk)
    
    if request.method == 'POST':
        form = SupplierForm(request.POST, instance=supplier)
        if form.is_valid():
            form.save()
            messages.success(request, f'Supplier {supplier.name} updated successfully.')
            return redirect('inventory:supplier_list')
    else:
        form = SupplierForm(instance=supplier)
    
    return render(request, 'inventory/supplier_form.html', {
        'form': form,
        'title': f'Edit Supplier: {supplier.name}'
    })


@manager_required
@require_http_methods(["POST"])
def supplier_delete(request, pk):
    """Delete a supplier."""
    supplier = get_object_or_404(Supplier, pk=pk)
    supplier_name = supplier.name
    supplier.delete()
    messages.success(request, f'Supplier {supplier_name} deleted successfully.')
    return redirect('inventory:supplier_list')
