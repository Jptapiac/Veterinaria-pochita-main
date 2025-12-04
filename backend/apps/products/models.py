from django.db import models
from django.conf import settings


class Product(models.Model):
    """Modelo para productos veterinarios"""
    
    CATEGORY_CHOICES = (
        ('ALIMENTO', 'Alimento'),
        ('MEDICAMENTO', 'Medicamento'),
        ('ACCESORIO', 'Accesorio'),
        ('HIGIENE', 'Higiene'),
        ('JUGUETE', 'Juguete'),
        ('OTRO', 'Otro'),
    )
    
    name = models.CharField(max_length=200, verbose_name='Nombre')
    description = models.TextField(blank=True, null=True, verbose_name='Descripción')
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        verbose_name='Categoría'
    )
    
    # Precios
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio'
    )
    cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Costo'
    )
    
    # Inventario
    stock = models.IntegerField(default=0, verbose_name='Stock')
    min_stock = models.IntegerField(default=5, verbose_name='Stock mínimo')
    
    # Información adicional
    sku = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        null=True,
        verbose_name='SKU'
    )
    barcode = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Código de barras'
    )
    image = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True,
        verbose_name='Imagen'
    )
    
    # Estado
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    
    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - ${self.price}"
    
    @property
    def is_low_stock(self):
        """Verifica si el stock está bajo"""
        return self.stock <= self.min_stock


class ProductReservation(models.Model):
    """Modelo para reservas de productos"""
    
    STATUS_CHOICES = (
        ('PENDIENTE', 'Pendiente'),
        ('CONTACTADO', 'Contactado'),
        ('CONFIRMADA', 'Confirmada'),
        ('COMPLETADA', 'Completada'),
        ('CANCELADA', 'Cancelada'),
    )
    
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='reservations',
        verbose_name='Producto'
    )
    
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='product_reservations',
        limit_choices_to={'role': 'CLIENTE'},
        verbose_name='Cliente'
    )
    
    quantity = models.IntegerField(default=1, verbose_name='Cantidad')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado'
    )
    
    # Fechas
    reserved_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de reserva')
    contacted_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Fecha de contacto'
    )
    expires_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Fecha de expiración'
    )
    
    notes = models.TextField(blank=True, null=True, verbose_name='Notas')
    
    # Prioridad (orden en la lista)
    priority = models.IntegerField(default=0, verbose_name='Prioridad')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    
    class Meta:
        verbose_name = 'Reserva de Producto'
        verbose_name_plural = 'Reservas de Productos'
        ordering = ['priority', 'created_at']
    
    def __str__(self):
        return f"{self.client.get_full_name()} - {self.product.name} ({self.quantity})"


class Sale(models.Model):
    """Modelo para ventas"""
    
    PAYMENT_METHOD_CHOICES = (
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('TRANSFERENCIA', 'Transferencia'),
    )
    
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sales',
        limit_choices_to={'role': 'CLIENTE'},
        verbose_name='Cliente'
    )
    
    receptionist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='processed_sales',
        limit_choices_to={'role': 'RECEPCIONISTA'},
        verbose_name='Recepcionista'
    )
    
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Monto total'
    )
    
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        verbose_name='Método de pago'
    )
    
    notes = models.TextField(blank=True, null=True, verbose_name='Notas')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de venta')
    
    class Meta:
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
        ordering = ['-created_at']
    
    def __str__(self):
        client_name = self.client.get_full_name() if self.client else 'Cliente genérico'
        return f"Venta #{self.id} - {client_name} - ${self.total_amount}"


class SaleItem(models.Model):
    """Modelo para items de una venta"""
    
    sale = models.ForeignKey(
        Sale,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Venta'
    )
    
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='sale_items',
        verbose_name='Producto'
    )
    
    quantity = models.IntegerField(default=1, verbose_name='Cantidad')
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio unitario'
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Subtotal'
    )
    
    class Meta:
        verbose_name = 'Item de Venta'
        verbose_name_plural = 'Items de Venta'
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
    
    def save(self, *args, **kwargs):
        # Calcular subtotal automáticamente
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)

