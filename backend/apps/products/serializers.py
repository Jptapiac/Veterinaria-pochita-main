from rest_framework import serializers
from .models import Product, ProductReservation, Sale, SaleItem


class ProductSerializer(serializers.ModelSerializer):
    """Serializer para productos"""
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Product
        fields = (
            'id', 'name', 'description', 'category', 'price', 'cost',
            'stock', 'min_stock', 'is_low_stock', 'sku', 'barcode',
            'image', 'is_active', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class ProductReservationSerializer(serializers.ModelSerializer):
    """Serializer para reservas de productos"""
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ProductReservation
        fields = (
            'id', 'product', 'product_name', 'client', 'client_name',
            'quantity', 'status', 'status_display', 'reserved_at',
            'contacted_at', 'expires_at', 'notes', 'priority',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'reserved_at', 'created_at', 'updated_at')


class SaleItemSerializer(serializers.ModelSerializer):
    """Serializer para items de venta"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = ('id', 'product', 'product_name', 'quantity', 'unit_price', 'subtotal')
        read_only_fields = ('id', 'subtotal')


class SaleSerializer(serializers.ModelSerializer):
    """Serializer para ventas"""
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    receptionist_name = serializers.CharField(source='receptionist.get_full_name', read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Sale
        fields = (
            'id', 'client', 'client_name', 'receptionist', 'receptionist_name',
            'total_amount', 'payment_method', 'notes', 'items', 'created_at'
        )
        read_only_fields = ('id', 'created_at')


class SaleCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear ventas"""
    items = SaleItemSerializer(many=True)
    
    class Meta:
        model = Sale
        fields = ('client', 'receptionist', 'payment_method', 'notes', 'items')
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        
        # Calcular total
        total = sum(item['unit_price'] * item['quantity'] for item in items_data)
        validated_data['total_amount'] = total
        
        # Crear la venta
        sale = Sale.objects.create(**validated_data)
        
        # Crear los items y actualizar inventario
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            
            # Verificar stock
            if product.stock < quantity:
                raise serializers.ValidationError({
                    "items": f"Stock insuficiente para {product.name}. Disponible: {product.stock}"
                })
            
            # Crear item de venta
            SaleItem.objects.create(sale=sale, **item_data)
            
            # Actualizar inventario
            product.stock -= quantity
            product.save()
        
        return sale

