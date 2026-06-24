from rest_framework import serializers
from .models import Item, Category, Supplier


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""
    item_count = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = Category
        fields = ['id', 'title', 'description', 'item_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier model."""
    item_count = serializers.IntegerField(read_only=True, required=False)
    
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'contact_info', 'email', 'phone', 'address',
                  'item_count', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ItemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for item lists."""
    category_name = serializers.CharField(source='category.title', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, default=None)
    stock_status = serializers.CharField(source='get_stock_status', read_only=True)
    total_value = serializers.DecimalField(
        source='get_total_value', max_digits=14, decimal_places=2, read_only=True
    )
    
    class Meta:
        model = Item
        fields = ['id', 'name', 'sku', 'quantity', 'unit_price', 'threshold_level',
                  'category', 'category_name', 'supplier', 'supplier_name',
                  'stock_status', 'total_value', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ItemDetailSerializer(serializers.ModelSerializer):
    """Full serializer for item detail views."""
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(), source='supplier', write_only=True,
        required=False, allow_null=True
    )
    stock_status = serializers.CharField(source='get_stock_status', read_only=True)
    total_value = serializers.DecimalField(
        source='get_total_value', max_digits=14, decimal_places=2, read_only=True
    )
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'sku', 'quantity', 'unit_price',
                  'threshold_level', 'category', 'category_id', 'supplier',
                  'supplier_id', 'stock_status', 'total_value', 'is_low_stock',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class ItemCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating items."""
    
    class Meta:
        model = Item
        fields = ['name', 'description', 'sku', 'quantity', 'unit_price',
                  'threshold_level', 'category', 'supplier']
    
    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError('Quantity cannot be negative.')
        return value
    
    def validate_unit_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Unit price cannot be negative.')
        return value
    
    def validate_threshold_level(self, value):
        if value < 0:
            raise serializers.ValidationError('Threshold level cannot be negative.')
        return value
