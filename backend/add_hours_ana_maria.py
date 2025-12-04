"""
Script para agregar más horarios a Ana María Oñate
Ejecutar con: python manage.py shell < add_hours_ana_maria.py
O: python manage.py shell, luego exec(open('add_hours_ana_maria.py').read())
"""

import os
import django
from datetime import datetime, timedelta, time

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veterinaria_pochita.settings')
django.setup()

from apps.users.models import User
from apps.appointments.models import TimeSlot

print("🔧 Agregando más horarios para Ana María Oñate...")

# Buscar a Ana María Oñate
try:
    ana_maria = User.objects.get(first_name='Ana María', last_name='Oñate', role='VETERINARIO')
    print(f"✓ Encontrada: {ana_maria.get_full_name()}")
except User.DoesNotExist:
    print("❌ Error: No se encontró a Ana María Oñate")
    exit(1)

today = datetime.now().date()
time_slots_created = 0

# Agregar horarios para los próximos 30 días
for day in range(30):
    date = today + timedelta(days=day)
    
    # Saltar domingos
    if date.weekday() == 6:
        continue
    
    # Horarios de mañana (9:00 - 13:00) - Agregar todos, no solo alternados
    for hour in range(9, 13):
        slot, created = TimeSlot.objects.get_or_create(
            veterinarian=ana_maria,
            date=date,
            start_time=time(hour, 0),
            defaults={
                'end_time': time(hour + 1, 0),
                'is_available': True
            }
        )
        if created:
            time_slots_created += 1
    
    # Horarios de tarde (15:00 - 19:00) - Solo días de semana
    if date.weekday() < 5:  # Lunes a Viernes
        for hour in range(15, 19):
            slot, created = TimeSlot.objects.get_or_create(
                veterinarian=ana_maria,
                date=date,
                start_time=time(hour, 0),
                defaults={
                    'end_time': time(hour + 1, 0),
                    'is_available': True
                }
            )
            if created:
                time_slots_created += 1

print(f"✅ Se agregaron {time_slots_created} nuevos bloques de tiempo para {ana_maria.get_full_name()}")
print(f"📅 Horarios creados para los próximos 30 días (excluyendo domingos)")

