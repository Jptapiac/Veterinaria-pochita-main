"""
Script para crear datos de prueba en el sistema
Ejecutar con: python manage.py shell < create_sample_data.py
O: python manage.py shell, luego exec(open('create_sample_data.py').read())
"""

import os
import django
from datetime import datetime, timedelta, time

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veterinaria_pochita.settings')
django.setup()

from apps.users.models import User
from apps.pets.models import Pet, MedicalRecord
from apps.appointments.models import TimeSlot, Appointment
from apps.products.models import Product

print("🔧 Creando datos de prueba para Veterinaria Pochita...")

# 1. Crear Veterinarios
print("\n👨‍⚕️ Creando veterinarios...")
vet1, created = User.objects.get_or_create(
    username='vet_carlos',
    defaults={
        'first_name': 'Carlos',
        'last_name': 'Reyes',
        'email': 'carlos.reyes@pochita.cl',
        'role': 'VETERINARIO',
        'phone': '+56912345001',
    }
)
# Actualizar si ya existe
if not created:
    vet1.first_name = 'Carlos'
    vet1.last_name = 'Reyes'
    vet1.email = 'carlos.reyes@pochita.cl'
    vet1.save()
else:
    vet1.set_password('veterinario123')
    vet1.save()
print(f"✓ {'Creado' if created else 'Actualizado'}: {vet1.get_full_name()}")

vet2, created = User.objects.get_or_create(
    username='vet_ana',
    defaults={
        'first_name': 'Ana María',
        'last_name': 'Oñate',
        'email': 'ana.onate@pochita.cl',
        'role': 'VETERINARIO',
        'phone': '+56912345002',
    }
)
# Actualizar si ya existe
if not created:
    vet2.first_name = 'Ana María'
    vet2.last_name = 'Oñate'
    vet2.email = 'ana.onate@pochita.cl'
    vet2.save()
else:
    vet2.set_password('veterinario123')
    vet2.save()
print(f"✓ {'Creado' if created else 'Actualizado'}: {vet2.get_full_name()}")

# 2. Crear Recepcionistas
print("\n📋 Creando recepcionistas...")
recep1, created = User.objects.get_or_create(
    username='recep_maria',
    defaults={
        'first_name': 'María',
        'last_name': 'Torres',
        'email': 'maria.torres@pochita.cl',
        'role': 'RECEPCIONISTA',
        'phone': '+56912345010',
    }
)
if created:
    recep1.set_password('recepcionista123')
    recep1.save()
    print(f"✓ Creado: {recep1.get_full_name()}")

# 3. Crear Clientes
print("\n👥 Creando clientes...")
client1, created = User.objects.get_or_create(
    username='cliente_juan',
    defaults={
        'first_name': 'Juan',
        'last_name': 'Pérez',
        'email': 'juan.perez@email.com',
        'role': 'CLIENTE',
        'phone': '+56912345100',
        'address': 'Av. Providencia 1234, Santiago',
        'rut': '12345678-9',
    }
)
if created:
    client1.set_password('cliente123')
    client1.save()
    print(f"✓ Creado: {client1.get_full_name()}")

client2, created = User.objects.get_or_create(
    username='cliente_sofia',
    defaults={
        'first_name': 'Sofía',
        'last_name': 'Ramírez',
        'email': 'sofia.ramirez@email.com',
        'role': 'CLIENTE',
        'phone': '+56912345101',
        'address': 'Los Leones 567, Santiago',
        'rut': '98765432-1',
    }
)
if created:
    client2.set_password('cliente123')
    client2.save()
    print(f"✓ Creado: {client2.get_full_name()}")

# 4. Crear Mascotas
print("\n🐾 Creando mascotas...")
pet1, created = Pet.objects.get_or_create(
    name='Max',
    owner=client1,
    defaults={
        'species': 'PERRO',
        'breed': 'Golden Retriever',
        'gender': 'MACHO',
        'birth_date': datetime(2020, 3, 15).date(),
        'color': 'Dorado',
        'weight': 28.5,
    }
)
if created:
    print(f"✓ Creada: {pet1.name} ({pet1.species})")

pet2, created = Pet.objects.get_or_create(
    name='Luna',
    owner=client1,
    defaults={
        'species': 'GATO',
        'breed': 'Persa',
        'gender': 'HEMBRA',
        'birth_date': datetime(2021, 7, 20).date(),
        'color': 'Blanco',
        'weight': 3.8,
    }
)
if created:
    print(f"✓ Creada: {pet2.name} ({pet2.species})")

pet3, created = Pet.objects.get_or_create(
    name='Rocky',
    owner=client2,
    defaults={
        'species': 'PERRO',
        'breed': 'Bulldog Francés',
        'gender': 'MACHO',
        'birth_date': datetime(2019, 11, 5).date(),
        'color': 'Café con blanco',
        'weight': 12.0,
    }
)
if created:
    print(f"✓ Creada: {pet3.name} ({pet3.species})")

# 5. Crear Bloques de Tiempo (TimeSlots)
print("\n📅 Creando bloques de tiempo...")
today = datetime.now().date()
time_slots_created = 0

# Crear slots para los próximos 14 días
for day in range(14):
    date = today + timedelta(days=day)
    
    # Saltar domingos
    if date.weekday() == 6:
        continue
    
    # Horarios de mañana (9:00 - 13:00)
    for hour in range(9, 13):
        # Para vet1 (Carlos Reyes)
        slot, created = TimeSlot.objects.get_or_create(
            veterinarian=vet1,
            date=date,
            start_time=time(hour, 0),
            defaults={
                'end_time': time(hour + 1, 0),
                'is_available': True
            }
        )
        if created:
            time_slots_created += 1
        
        # Para vet2 (Ana María Oñate) - Todos los horarios de mañana
        slot, created = TimeSlot.objects.get_or_create(
            veterinarian=vet2,
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
            # Para vet1 (Carlos Reyes)
            slot, created = TimeSlot.objects.get_or_create(
                veterinarian=vet1,
                date=date,
                start_time=time(hour, 0),
                defaults={
                    'end_time': time(hour + 1, 0),
                    'is_available': True
                }
            )
            if created:
                time_slots_created += 1
            
            # Para vet2 (Ana María Oñate) - Horarios de tarde también
            slot, created = TimeSlot.objects.get_or_create(
                veterinarian=vet2,
                date=date,
                start_time=time(hour, 0),
                defaults={
                    'end_time': time(hour + 1, 0),
                    'is_available': True
                }
            )
            if created:
                time_slots_created += 1

print(f"✓ Creados {time_slots_created} bloques de tiempo")

# 6. Crear algunas citas de ejemplo
print("\n📋 Creando citas de ejemplo...")

# Buscar un slot disponible
available_slot = TimeSlot.objects.filter(
    is_available=True,
    date__gte=today
).first()

if available_slot:
    appt, created = Appointment.objects.get_or_create(
        pet=pet1,
        client=client1,
        veterinarian=available_slot.veterinarian,
        appointment_date=available_slot.date,
        appointment_time=available_slot.start_time,
        defaults={
            'time_slot': available_slot,
            'reason': 'Control de salud general',
            'status': 'CONFIRMADA',
            'notes': 'Paciente con buena salud',
            'created_by': recep1
        }
    )
    if created:
        print(f"✓ Creada cita para {pet1.name}")

# 7. Crear Productos
print("\n📦 Creando productos...")
products_data = [
    {
        'name': 'Alimento Premium Perro Adulto 15kg',
        'category': 'ALIMENTO',
        'price': 45000,
        'stock': 25,
        'min_stock': 5,
        'sku': 'ALI-PER-001'
    },
    {
        'name': 'Alimento Premium Gato Adulto 10kg',
        'category': 'ALIMENTO',
        'price': 38000,
        'stock': 20,
        'min_stock': 5,
        'sku': 'ALI-GAT-001'
    },
    {
        'name': 'Antipulgas para Perros (hasta 10kg)',
        'category': 'MEDICAMENTO',
        'price': 12000,
        'stock': 30,
        'min_stock': 10,
        'sku': 'MED-ANT-001'
    },
    {
        'name': 'Collar Anti-pulgas Gatos',
        'category': 'ACCESORIO',
        'price': 8500,
        'stock': 15,
        'min_stock': 5,
        'sku': 'ACC-COL-001'
    },
    {
        'name': 'Shampoo Hipoalergénico 500ml',
        'category': 'HIGIENE',
        'price': 9500,
        'stock': 40,
        'min_stock': 10,
        'sku': 'HIG-SHA-001'
    },
    {
        'name': 'Juguete Interactivo para Gatos',
        'category': 'JUGUETE',
        'price': 6500,
        'stock': 50,
        'min_stock': 15,
        'sku': 'JUG-GAT-001'
    },
]

for product_data in products_data:
    product, created = Product.objects.get_or_create(
        sku=product_data['sku'],
        defaults=product_data
    )
    if created:
        print(f"✓ Creado: {product.name}")

print("\n✅ ¡Datos de prueba creados exitosamente!")
print("\n📝 Credenciales de acceso:")
print("-" * 50)
print("Veterinario 1:")
print("  Usuario: vet_carlos")
print("  Contraseña: veterinario123")
print("\nVeterinario 2:")
print("  Usuario: vet_ana")
print("  Contraseña: veterinario123")
print("\nRecepcionista:")
print("  Usuario: recep_maria")
print("  Contraseña: recepcionista123")
print("\nCliente 1:")
print("  Usuario: cliente_juan")
print("  Contraseña: cliente123")
print("\nCliente 2:")
print("  Usuario: cliente_sofia")
print("  Contraseña: cliente123")
print("-" * 50)
print("\n🚀 Puedes iniciar sesión en: http://localhost:8000/login/")

