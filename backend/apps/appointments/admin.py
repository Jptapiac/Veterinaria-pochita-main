from django.contrib import admin
from .models import TimeSlot, Appointment, WaitingList


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ('veterinarian', 'date', 'start_time', 'end_time', 'is_available')
    list_filter = ('is_available', 'date', 'veterinarian')
    search_fields = ('veterinarian__first_name', 'veterinarian__last_name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Información del Bloque', {
            'fields': ('veterinarian', 'date', 'start_time', 'end_time', 'is_available')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('pet', 'client', 'veterinarian', 'appointment_date', 'appointment_time', 'status')
    list_filter = ('status', 'appointment_date', 'veterinarian', 'confirmed_24h')
    search_fields = ('pet__name', 'client__first_name', 'client__last_name', 'reason')
    readonly_fields = ('created_at', 'updated_at', 'confirmation_date')
    
    fieldsets = (
        ('Información de la Cita', {
            'fields': ('pet', 'client', 'veterinarian', 'time_slot')
        }),
        ('Fecha y Hora', {
            'fields': ('appointment_date', 'appointment_time')
        }),
        ('Detalles', {
            'fields': ('reason', 'status', 'notes', 'receptionist_notes')
        }),
        ('Confirmación', {
            'fields': ('confirmed_24h', 'confirmation_date')
        }),
        ('Reprogramación', {
            'fields': ('rescheduled_from',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WaitingList)
class WaitingListAdmin(admin.ModelAdmin):
    list_display = ('client', 'pet', 'preferred_veterinarian', 'priority', 'is_active', 'contacted', 'created_at')
    list_filter = ('is_active', 'contacted', 'preferred_veterinarian')
    search_fields = ('client__first_name', 'client__last_name', 'pet__name', 'reason')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Información', {
            'fields': ('client', 'pet', 'preferred_veterinarian', 'reason', 'notes')
        }),
        ('Estado', {
            'fields': ('is_active', 'contacted', 'contact_date', 'priority')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

