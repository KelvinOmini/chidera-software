from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, F
from .models import Item, Category, Supplier
from .serializers import (
    CategorySerializer, SupplierSerializer,
    ItemListSerializer, ItemDetailSerializer, ItemCreateUpdateSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for categories.
    
    list: Get all categories with item counts.
    create: Create a new category.
    retrieve: Get category details.
    update: Update a category.
    destroy: Delete a category.
    """
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at']
    ordering = ['title']
    
    def get_queryset(self):
        return Category.objects.annotate(item_count=Count('items')).all()


class SupplierViewSet(viewsets.ModelViewSet):
    """
    API endpoint for suppliers.
    
    list: Get all suppliers with item counts.
    create: Create a new supplier.
    retrieve: Get supplier details.
    update: Update a supplier.
    destroy: Delete a supplier.
    """
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'phone', 'contact_info']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        return Supplier.objects.annotate(item_count=Count('items')).all()


class ItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for inventory items.
    
    list: Get all items with filtering, searching, and ordering.
    create: Create a new item.
    retrieve: Get full item details with related data.
    update: Update an item.
    destroy: Delete an item.
    low_stock: Get items below their threshold.
    out_of_stock: Get items with zero quantity.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'supplier']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['name', 'sku', 'quantity', 'unit_price', 'created_at', 'updated_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Item.objects.select_related('category', 'supplier').all()
        
        # Custom filter: stock_status
        stock_status = self.request.query_params.get('stock_status')
        if stock_status == 'in_stock':
            queryset = queryset.filter(quantity__gt=F('threshold_level'))
        elif stock_status == 'low_stock':
            queryset = queryset.filter(quantity__lte=F('threshold_level'), quantity__gt=0)
        elif stock_status == 'out_of_stock':
            queryset = queryset.filter(quantity=0)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ItemListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ItemCreateUpdateSerializer
        return ItemDetailSerializer
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get items that are below their low-stock threshold."""
        items = self.get_queryset().filter(
            quantity__lte=F('threshold_level'), quantity__gt=0
        )
        page = self.paginate_queryset(items)
        if page is not None:
            serializer = ItemListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ItemListSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def out_of_stock(self, request):
        """Get items with zero quantity."""
        items = self.get_queryset().filter(quantity=0)
        page = self.paginate_queryset(items)
        if page is not None:
            serializer = ItemListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = ItemListSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get transaction history for a specific item."""
        from operations.serializers import StockTransactionSerializer
        item = self.get_object()
        transactions = item.transactions.select_related('user').order_by('-timestamp')
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = StockTransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = StockTransactionSerializer(transactions, many=True)
        return Response(serializer.data)
