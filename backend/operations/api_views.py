from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.core.exceptions import ValidationError
from inventory.models import Item
from .models import StockTransaction
from .serializers import StockTransactionSerializer, StockTransactionCreateSerializer
from .services import StockOperationService


class StockTransactionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for stock transactions.
    
    list: Get all transactions with filtering.
    create: Create a new stock transaction (stock in/out/adjustment).
    retrieve: Get transaction details.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['item', 'transaction_type']
    search_fields = ['item__name', 'item__sku', 'notes']
    ordering_fields = ['timestamp', 'quantity_changed']
    ordering = ['-timestamp']
    http_method_names = ['get', 'post', 'head', 'options']  # No PUT/DELETE on transactions
    
    def get_queryset(self):
        queryset = StockTransaction.objects.select_related('item', 'user').all()
        
        # Date range filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return StockTransactionCreateSerializer
        return StockTransactionSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a stock transaction using the service layer."""
        serializer = StockTransactionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        item = Item.objects.get(pk=serializer.validated_data['item_id'])
        transaction_type = serializer.validated_data['transaction_type']
        quantity = serializer.validated_data['quantity']
        notes = serializer.validated_data.get('notes', '')
        
        try:
            if transaction_type == 'IN':
                transaction = StockOperationService.stock_in(item, quantity, request.user, notes)
            elif transaction_type == 'OUT':
                transaction = StockOperationService.stock_out(item, quantity, request.user, notes)
            elif transaction_type == 'ADJUSTMENT':
                transaction = StockOperationService.adjust_stock(item, quantity, request.user, notes)
            else:
                return Response(
                    {'error': f'Invalid transaction type: {transaction_type}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result_serializer = StockTransactionSerializer(transaction)
            return Response(result_serializer.data, status=status.HTTP_201_CREATED)
        
        except ValidationError as e:
            return Response(
                {'error': str(e.message if hasattr(e, 'message') else e)},
                status=status.HTTP_400_BAD_REQUEST
            )
