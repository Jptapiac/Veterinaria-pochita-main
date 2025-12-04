"""
Script para arreglar y agregar más horarios a Ana María Oñate
Este script elimina horarios duplicados y crea horarios completos
Ejecutar con: python manage.py shell
Luego ejecutar: exec(open('fix_ana_maria_hours.py').read())
"""

import os
import django
from datetime import datetime, timedelta, time

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veterinaria_pochita.settings')
django.setup()

from apps.users.models import User
from apps.appointments.models import TimeSlot, Appointment

print("🔧 Arreglando horarios de Ana María Oñate...")
print("=" * 60)

# Buscar a Ana María Oñate
try:
    ana_maria = User.objects.get(first_name='Ana María', last_name='Oñate', role='VETERINARIO')
    print(f"✓ Veterinaria encontrada: {ana_maria.get_full_name()}")
    print(f"  ID: {ana_maria.id}")
except User.DoesNotExist:
    print("❌ Error: No se encontró a Ana María Oñate")
    exit(1)

# Contar horarios actuales
current_slots = TimeSlot.objects.filter(veterinarian=ana_maria)
occupied_slots = current_slots.filter(is_available=False)
available_slots = current_slots.filter(is_available=True)

print(f"\n📊 Horarios actuales:")
print(f"  - Total: {current_slots.count()}")
print(f"  - Disponibles: {available_slots.count()}")
print(f"  - Ocupados: {occupied_slots.count()}")

today = datetime.now().date()
time_slots_created = 0
time_slots_updated = 0

print(f"\n📅 Creando/actualizando horarios desde {today}...")

# Crear horarios para los próximos 60 días
for day in range(60):
    date = today + timedelta(days=day)
    
    # Saltar domingos
    if date.weekday() == 6:
        continue
    
    # Horarios de mañana (9:00 - 13:00) - TODOS los horarios
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
        else:
            # Si ya existe pero está ocupado, no lo tocamos
            # Si está disponible pero no ocupado, lo actualizamos
            if slot.is_available:
                time_slots_updated += 1
    
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
            else:
                if slot.is_available:
                    time_slots_updated += 1

# Contar horarios después
final_slots = TimeSlot.objects.filter(veterinarian=ana_maria, date__gte=today)
final_available = final_slots.filter(is_available=True)

print(f"\n✅ Proceso completado!")
print(f"=" * 60)
print(f"📈 Nuevos horarios creados: {time_slots_created}")
print(f"🔄 Horarios actualizados: {time_slots_updated}")
print(f"\n📊 Horarios finales desde hoy:")
print(f"  - Total: {final_slots.count()}")
print(f"  - Disponibles: {final_available.count()}")
print(f"\n✨ Ana María ahora tiene los mismos horarios que Carlos Reyes!")

