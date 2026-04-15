from rest_framework import serializers
from .models import StockTransaction


class StockTransactionSerializer(serializers.ModelSerializer):
    """Serializer for stock transactions."""
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True, default=None)
    transaction_type_display = serializers.CharField(
        source='get_transaction_type_display', read_only=True
    )
    
    class Meta:
        model = StockTransaction
        fields = ['id', 'item', 'item_name', 'item_sku', 'transaction_type',
                  'transaction_type_display', 'quantity_changed',
                  'previous_quantity', 'new_quantity', 'user', 'user_username',
                  'notes', 'timestamp']
        read_only_fields = ['previous_quantity', 'new_quantity', 'user',
                           'user_username', 'timestamp']


class StockTransactionCreateSerializer(serializers.Serializer):
    """Serializer for creating stock transactions via API."""
    item_id = serializers.IntegerField()
    transaction_type = serializers.ChoiceField(
        choices=StockTransaction.TRANSACTION_TYPE_CHOICES
    )
    quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    
    def validate_item_id(self, value):
        from inventory.models import Item
        try:
            Item.objects.get(pk=value)
        except Item.DoesNotExist:
            raise serializers.ValidationError(f'Item with id {value} does not exist.')
        return value
