from django.contrib import admin
from .models import Pet, MedicalRecord, PreRegisteredPet


@admin.register(PreRegisteredPet)
class PreRegisteredPetAdmin(admin.ModelAdmin):
    list_display = ('name', 'species', 'owner_email', 'owner_name', 'is_claimed', 'claimed_by', 'created_at')
    list_filter = ('is_claimed', 'species')
    search_fields = ('name', 'owner_email', 'owner_name')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Información de la Mascota', {
            'fields': ('name', 'species', 'breed', 'gender', 'birth_date', 'color', 'weight')
        }),
        ('Información del Dueño', {
            'fields': ('owner_email', 'owner_name', 'owner_phone')
        }),
        ('Estado', {
            'fields': ('is_claimed', 'claimed_by', 'notes')
        }),
        ('Fechas', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ('name', 'species', 'breed', 'owner', 'is_active', 'created_at')
    list_filter = ('species', 'gender', 'is_active')
    search_fields = ('name', 'owner__username', 'owner__first_name', 'owner__last_name', 'microchip')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'species', 'breed', 'gender', 'birth_date')
        }),
        ('Información Física', {
            'fields': ('color', 'weight', 'photo')
        }),
        ('Dueño', {
            'fields': ('owner',)
        }),
        ('Información Adicional', {
            'fields': ('microchip', 'notes', 'is_active')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('pet', 'veterinarian', 'visit_date', 'reason')
    list_filter = ('visit_date', 'veterinarian')
    search_fields = ('pet__name', 'reason', 'diagnosis')
    readonly_fields = ('created_at', 'updated_at', 'visit_date')
    
    fieldsets = (
        ('Información de la Visita', {
            'fields': ('pet', 'veterinarian', 'visit_date', 'reason')
        }),
        ('Diagnóstico y Tratamiento', {
            'fields': ('diagnosis', 'treatment', 'prescription')
        }),
        ('Mediciones', {
            'fields': ('weight_at_visit', 'temperature')
        }),
        ('Seguimiento', {
            'fields': ('next_visit', 'notes')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

