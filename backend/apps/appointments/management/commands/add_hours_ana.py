"""
Comando de Django para agregar mas horarios a Ana Maria Onate
Ejecutar con: python manage.py add_hours_ana
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, time
from apps.users.models import User
from apps.appointments.models import TimeSlot


class Command(BaseCommand):
    help = 'Agrega mas horarios disponibles para Ana Maria Onate'

    def handle(self, *args, **options):
        self.stdout.write('Agregando mas horarios para Ana Maria Onate...')
        
        # Buscar a Ana Maria Onate
        try:
            ana_maria = User.objects.get(
                first_name='Ana María', 
                last_name='Oñate', 
                role='VETERINARIO'
            )
            self.stdout.write(
                self.style.SUCCESS(f'Encontrada: {ana_maria.get_full_name()}')
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('Error: No se encontro a Ana Maria Onate')
            )
            return
        
        today = timezone.now().date()
        time_slots_created = 0
        
        # Crear horarios para los proximos 60 dias
        for day in range(60):
            date = today + timedelta(days=day)
            
            # Saltar domingos
            if date.weekday() == 6:
                continue
            
            # Horarios de manana (9:00 - 13:00) - TODOS los horarios
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
            
            # Horarios de tarde (15:00 - 19:00) - Solo dias de semana
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
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Se agregaron {time_slots_created} nuevos bloques de tiempo para {ana_maria.get_full_name()}'
            )
        )
        self.stdout.write('Ana Maria ahora tiene los mismos horarios que Carlos Reyes!')

