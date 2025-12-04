from django.contrib import admin
from .models import Product, ProductReservation, Sale, SaleItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'min_stock', 'is_low_stock', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'sku', 'barcode')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'description', 'category')
        }),
        ('Precios', {
            'fields': ('price', 'cost')
        }),
        ('Inventario', {
            'fields': ('stock', 'min_stock')
        }),
        ('Identificación', {
            'fields': ('sku', 'barcode', 'image')
        }),
        ('Estado', {
            'fields': ('is_active',)
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProductReservation)
class ProductReservationAdmin(admin.ModelAdmin):
    list_display = ('client', 'product', 'quantity', 'status', 'priority', 'reserved_at')
    list_filter = ('status', 'reserved_at')
    search_fields = ('client__first_name', 'client__last_name', 'product__name')
    readonly_fields = ('created_at', 'updated_at', 'reserved_at')


class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 1
    readonly_fields = ('subtotal',)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'receptionist', 'total_amount', 'payment_method', 'created_at')
    list_filter = ('payment_method', 'created_at')
    search_fields = ('client__first_name', 'client__last_name')
    readonly_fields = ('created_at',)
    inlines = [SaleItemInline]
    
    fieldsets = (
        ('Información de la Venta', {
            'fields': ('client', 'receptionist', 'payment_method')
        }),
        ('Totales', {
            'fields': ('total_amount',)
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
        ('Fecha', {
            'fields': ('created_at',)
        }),
    )

