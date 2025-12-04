from rest_framework import generics, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Product, ProductReservation, Sale
from .serializers import (
    ProductSerializer,
    ProductReservationSerializer,
    SaleSerializer,
    SaleCreateSerializer
)


class ProductListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear productos"""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description', 'sku', 'barcode']
    ordering_fields = ['name', 'price', 'stock', 'created_at']
    filterset_fields = ['category', 'is_active']


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar productos"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]


class LowStockProductsView(generics.ListAPIView):
    """Vista para obtener productos con stock bajo"""
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Product.objects.filter(
            is_active=True,
            stock__lte=models.F('min_stock')
        )


class ProductReservationListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear reservas de productos"""
    serializer_class = ProductReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['priority', 'created_at']
    filterset_fields = ['status', 'product', 'client']
    
    def get_queryset(self):
        user = self.request.user
        
        # Los clientes solo ven sus propias reservas
        if user.role == 'CLIENTE':
            return ProductReservation.objects.filter(client=user)
        
        # Recepcionistas ven todas
        return ProductReservation.objects.all()


class ProductReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar reservas de productos"""
    queryset = ProductReservation.objects.all()
    serializer_class = ProductReservationSerializer
    permission_classes = [permissions.IsAuthenticated]


class SaleListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear ventas"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['created_at', 'total_amount']
    filterset_fields = ['client', 'receptionist', 'payment_method']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SaleCreateSerializer
        return SaleSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Los clientes solo ven sus propias compras
        if user.role == 'CLIENTE':
            return Sale.objects.filter(client=user)
        
        # Recepcionistas ven todas
        return Sale.objects.all()


class SaleDetailView(generics.RetrieveAPIView):
    """Vista para ver detalles de una venta"""
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProductStatsView(APIView):
    """Vista para obtener estadísticas de productos"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Solo accesible para recepcionistas y veterinarios
        if request.user.role == 'CLIENTE':
            return Response(
                {'error': 'No tiene permiso para ver estadísticas'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from django.db.models import Sum, Count
        
        total_products = Product.objects.filter(is_active=True).count()
        low_stock_products = Product.objects.filter(
            is_active=True,
            stock__lte=models.F('min_stock')
        ).count()
        
        total_sales = Sale.objects.count()
        total_revenue = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        
        pending_reservations = ProductReservation.objects.filter(
            status='PENDIENTE'
        ).count()
        
        return Response({
            'total_products': total_products,
            'low_stock_products': low_stock_products,
            'total_sales': total_sales,
            'total_revenue': float(total_revenue),
            'pending_reservations': pending_reservations
        }, status=status.HTTP_200_OK)


# Import necesario para el queryset en LowStockProductsView
from django.db import models

