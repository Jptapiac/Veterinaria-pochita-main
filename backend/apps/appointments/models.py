from django.db import models
from django.conf import settings
from apps.pets.models import Pet


class TimeSlot(models.Model):
    """Bloques de tiempo disponibles para citas por veterinario"""
    
    veterinarian = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='time_slots',
        limit_choices_to={'role': 'VETERINARIO'},
        verbose_name='Veterinario'
    )
    
    date = models.DateField(verbose_name='Fecha')
    start_time = models.TimeField(verbose_name='Hora de inicio')
    end_time = models.TimeField(verbose_name='Hora de fin')
    
    is_available = models.BooleanField(default=True, verbose_name='Disponible')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    
    class Meta:
        verbose_name = 'Bloque de Tiempo'
        verbose_name_plural = 'Bloques de Tiempo'
        ordering = ['date', 'start_time']
        unique_together = ['veterinarian', 'date', 'start_time']
    
    def __str__(self):
        return f"{self.veterinarian.get_full_name()} - {self.date} {self.start_time}-{self.end_time}"


class Appointment(models.Model):
    """Modelo para las citas de atención"""
    
    STATUS_CHOICES = (
        ('PENDIENTE', 'Pendiente'),
        ('CONFIRMADA', 'Confirmada'),
        ('ATENDIDA', 'Atendida'),
        ('CANCELADA', 'Cancelada'),
        ('REPROGRAMADA', 'Reprogramada'),
    )
    
    # Información de la cita
    pet = models.ForeignKey(
        Pet,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name='Mascota'
    )
    
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='client_appointments',
        limit_choices_to={'role': 'CLIENTE'},
        verbose_name='Cliente'
    )
    
    veterinarian = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='veterinarian_appointments',
        limit_choices_to={'role': 'VETERINARIO'},
        verbose_name='Veterinario'
    )
    
    time_slot = models.OneToOneField(
        TimeSlot,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointment',
        verbose_name='Bloque de tiempo'
    )
    
    # Fecha y hora
    appointment_date = models.DateField(verbose_name='Fecha de la cita')
    appointment_time = models.TimeField(verbose_name='Hora de la cita')
    
    # Motivo y estado
    reason = models.CharField(max_length=200, verbose_name='Motivo de consulta')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDIENTE',
        verbose_name='Estado'
    )
    
    # Confirmación
    confirmed_24h = models.BooleanField(default=False, verbose_name='Confirmada 24h antes')
    confirmation_date = models.DateTimeField(
        blank=True, 
        null=True,
        verbose_name='Fecha de confirmación'
    )
    
    # Notas y observaciones
    notes = models.TextField(blank=True, null=True, verbose_name='Notas')
    receptionist_notes = models.TextField(
        blank=True, 
        null=True,
        verbose_name='Notas de recepción'
    )
    
    # Reprogramación
    rescheduled_from = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rescheduled_appointments',
        verbose_name='Reprogramada desde'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    
    # Creador de la cita (puede ser cliente o recepcionista)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_appointments',
        verbose_name='Creado por'
    )
    
    class Meta:
        verbose_name = 'Cita'
        verbose_name_plural = 'Citas'
        ordering = ['-appointment_date', '-appointment_time']
    
    def __str__(self):
        return f"{self.pet.name} - {self.appointment_date} {self.appointment_time} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        # Si se asigna un time_slot, marcar como no disponible
        if self.time_slot:
            self.time_slot.is_available = False
            self.time_slot.save()
        super().save(*args, **kwargs)


class WaitingList(models.Model):
    """Lista de espera para citas"""
    
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='waiting_list_entries',
        limit_choices_to={'role': 'CLIENTE'},
        verbose_name='Cliente'
    )
    
    pet = models.ForeignKey(
        Pet,
        on_delete=models.CASCADE,
        related_name='waiting_list_entries',
        verbose_name='Mascota'
    )
    
    preferred_veterinarian = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='preferred_waiting_list_entries',
        limit_choices_to={'role': 'VETERINARIO'},
        verbose_name='Veterinario preferido'
    )
    
    reason = models.CharField(max_length=200, verbose_name='Motivo de consulta')
    notes = models.TextField(blank=True, null=True, verbose_name='Notas')
    
    # Estado
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    contacted = models.BooleanField(default=False, verbose_name='Contactado')
    contact_date = models.DateTimeField(blank=True, null=True, verbose_name='Fecha de contacto')
    
    # Prioridad (orden en la lista)
    priority = models.IntegerField(default=0, verbose_name='Prioridad')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    
    class Meta:
        verbose_name = 'Lista de Espera'
        verbose_name_plural = 'Listas de Espera'
        ordering = ['priority', 'created_at']
    
    def __str__(self):
        return f"{self.client.get_full_name()} - {self.pet.name} - Prioridad: {self.priority}"

