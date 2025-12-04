from django.db import models
from django.conf import settings


class PreRegisteredPet(models.Model):
    """Modelo para mascotas pre-registradas antes de que el cliente cree su cuenta"""
    
    SPECIES_CHOICES = (
        ('PERRO', 'Perro'),
        ('GATO', 'Gato'),
        # Las especies exóticas fueron eliminadas - solo atendemos perros y gatos
    )
    
    GENDER_CHOICES = (
        ('MACHO', 'Macho'),
        ('HEMBRA', 'Hembra'),
    )
    
    # Datos de la mascota
    name = models.CharField(max_length=100, verbose_name='Nombre')
    species = models.CharField(max_length=20, choices=SPECIES_CHOICES, verbose_name='Especie')
    breed = models.CharField(max_length=100, blank=True, null=True, verbose_name='Raza')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, verbose_name='Sexo')
    birth_date = models.DateField(blank=True, null=True, verbose_name='Fecha de nacimiento')
    color = models.CharField(max_length=50, blank=True, null=True, verbose_name='Color')
    weight = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True, verbose_name='Peso (kg)')
    
    # Email del futuro dueño
    owner_email = models.EmailField(verbose_name='Email del dueño', unique=True)
    owner_name = models.CharField(max_length=200, verbose_name='Nombre del dueño')
    owner_phone = models.CharField(max_length=15, blank=True, null=True, verbose_name='Teléfono')
    
    # Estado
    is_claimed = models.BooleanField(default=False, verbose_name='Reclamada')
    claimed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='claimed_pets',
        verbose_name='Reclamada por'
    )
    
    notes = models.TextField(blank=True, null=True, verbose_name='Notas')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de pre-registro')
    
    class Meta:
        verbose_name = 'Mascota Pre-registrada'
        verbose_name_plural = 'Mascotas Pre-registradas'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.species}) - {self.owner_email}"


class Pet(models.Model):
    """Modelo para las mascotas/pacientes de la veterinaria"""
    
    SPECIES_CHOICES = (
        ('PERRO', 'Perro'),
        ('GATO', 'Gato'),
        # Las especies exóticas fueron eliminadas - solo atendemos perros y gatos
    )
    
    GENDER_CHOICES = (
        ('MACHO', 'Macho'),
        ('HEMBRA', 'Hembra'),
    )
    
    name = models.CharField(max_length=100, verbose_name='Nombre')
    species = models.CharField(
        max_length=20, 
        choices=SPECIES_CHOICES,
        verbose_name='Especie'
    )
    breed = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name='Raza'
    )
    gender = models.CharField(
        max_length=10, 
        choices=GENDER_CHOICES,
        verbose_name='Sexo'
    )
    birth_date = models.DateField(blank=True, null=True, verbose_name='Fecha de nacimiento')
    color = models.CharField(max_length=50, blank=True, null=True, verbose_name='Color')
    weight = models.DecimalField(
        max_digits=6, 
        decimal_places=2, 
        blank=True, 
        null=True,
        verbose_name='Peso (kg)'
    )
    
    # Relación con el dueño (cliente)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pets',
        verbose_name='Dueño'
    )
    
    # Información adicional
    microchip = models.CharField(
        max_length=50, 
        blank=True, 
        null=True, 
        unique=True,
        verbose_name='Microchip'
    )
    photo = models.ImageField(
        upload_to='pets/', 
        blank=True, 
        null=True,
        verbose_name='Foto'
    )
    notes = models.TextField(blank=True, null=True, verbose_name='Notas adicionales')
    
    # Estado
    is_active = models.BooleanField(default=True, verbose_name='Activo')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de registro')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    
    class Meta:
        verbose_name = 'Mascota'
        verbose_name_plural = 'Mascotas'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_species_display()}) - Dueño: {self.owner.get_full_name()}"
    
    @property
    def age(self):
        """Calcula la edad de la mascota en años"""
        if self.birth_date:
            from datetime import date
            today = date.today()
            age = today.year - self.birth_date.year
            if today.month < self.birth_date.month or (today.month == self.birth_date.month and today.day < self.birth_date.day):
                age -= 1
            return age
        return None


class MedicalRecord(models.Model):
    """Ficha médica/historial de la mascota"""
    
    pet = models.ForeignKey(
        Pet,
        on_delete=models.CASCADE,
        related_name='medical_records',
        verbose_name='Mascota'
    )
    
    veterinarian = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='medical_records',
        verbose_name='Veterinario'
    )
    
    visit_date = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de visita')
    reason = models.CharField(max_length=200, verbose_name='Motivo de consulta')
    diagnosis = models.TextField(verbose_name='Diagnóstico')
    treatment = models.TextField(verbose_name='Tratamiento')
    prescription = models.TextField(blank=True, null=True, verbose_name='Prescripción')
    
    # Información adicional
    weight_at_visit = models.DecimalField(
        max_digits=6, 
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Peso en la visita (kg)'
    )
    temperature = models.DecimalField(
        max_digits=4, 
        decimal_places=1,
        blank=True,
        null=True,
        verbose_name='Temperatura (°C)'
    )
    
    notes = models.TextField(blank=True, null=True, verbose_name='Notas adicionales')
    next_visit = models.DateField(blank=True, null=True, verbose_name='Próxima visita')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de creación')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Última actualización')
    
    class Meta:
        verbose_name = 'Ficha Médica'
        verbose_name_plural = 'Fichas Médicas'
        ordering = ['-visit_date']
    
    def __str__(self):
        return f"Ficha de {self.pet.name} - {self.visit_date.strftime('%d/%m/%Y')}"
