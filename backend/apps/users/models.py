from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Modelo de usuario personalizado con roles para la veterinaria.
    Roles: CLIENTE, RECEPCIONISTA, VETERINARIO
    """
    
    ROLE_CHOICES = (
        ('CLIENTE', 'Cliente'),
        ('RECEPCIONISTA', 'Recepcionista'),
        ('VETERINARIO', 'Veterinario'),
    )
    
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='CLIENTE',
        verbose_name='Rol'
    )
    
    phone = models.CharField(
        max_length=15, 
        blank=True, 
        null=True,
        verbose_name='Teléfono'
    )
    
    address = models.TextField(
        blank=True, 
        null=True,
        verbose_name='Dirección'
    )
    
    rut = models.CharField(
        max_length=12, 
        unique=True, 
        blank=True, 
        null=True,
        verbose_name='RUT'
    )
    
    profile_image = models.ImageField(
        upload_to='profiles/', 
        blank=True, 
        null=True,
        verbose_name='Imagen de perfil'
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Fecha de actualización')
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_full_name()} - {self.get_role_display()}"
    
    def is_veterinarian(self):
        return self.role == 'VETERINARIO'
    
    def is_receptionist(self):
        return self.role == 'RECEPCIONISTA'
    
    def is_client(self):
        return self.role == 'CLIENTE'

