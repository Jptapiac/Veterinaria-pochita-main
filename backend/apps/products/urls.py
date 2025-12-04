from django.urls import path
from .views import (
    ProductListCreateView,
    ProductDetailView,
    LowStockProductsView,
    ProductReservationListCreateView,
    ProductReservationDetailView,
    SaleListCreateView,
    SaleDetailView,
    ProductStatsView
)

app_name = 'products'

urlpatterns = [
    # Gestión de productos
    path('', ProductListCreateView.as_view(), name='product_list_create'),
    path('<int:pk>/', ProductDetailView.as_view(), name='product_detail'),
    path('low-stock/', LowStockProductsView.as_view(), name='low_stock_products'),
    path('stats/', ProductStatsView.as_view(), name='product_stats'),
    
    # Gestión de reservas
    path('reservations/', ProductReservationListCreateView.as_view(), name='reservation_list_create'),
    path('reservations/<int:pk>/', ProductReservationDetailView.as_view(), name='reservation_detail'),
    
    # Gestión de ventas
    path('sales/', SaleListCreateView.as_view(), name='sale_list_create'),
    path('sales/<int:pk>/', SaleDetailView.as_view(), name='sale_detail'),
]

