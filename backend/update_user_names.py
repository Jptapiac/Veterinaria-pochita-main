"""
Script para actualizar los nombres de los usuarios existentes
Ejecutar con: Get-Content update_user_names.py | python manage.py shell
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veterinaria_pochita.settings')
django.setup()

from apps.users.models import User

print("🔄 Actualizando nombres de usuarios...")

# Actualizar Carlos
try:
    vet_carlos = User.objects.get(username='vet_carlos')
    vet_carlos.first_name = 'Carlos'
    vet_carlos.last_name = 'Reyes'
    vet_carlos.email = 'carlos.reyes@pochita.cl'
    vet_carlos.save()
    print(f"✓ Actualizado: {vet_carlos.get_full_name()}")
except User.DoesNotExist:
    print("✗ Usuario vet_carlos no encontrado")

# Actualizar Ana
try:
    vet_ana = User.objects.get(username='vet_ana')
    vet_ana.first_name = 'Ana María'
    vet_ana.last_name = 'Oñate'
    vet_ana.email = 'ana.onate@pochita.cl'
    vet_ana.save()
    print(f"✓ Actualizado: {vet_ana.get_full_name()}")
except User.DoesNotExist:
    print("✗ Usuario vet_ana no encontrado")

# Verificar María (ya está correcto, pero confirmamos)
try:
    recep_maria = User.objects.get(username='recep_maria')
    if recep_maria.first_name != 'María' or recep_maria.last_name != 'Torres':
        recep_maria.first_name = 'María'
        recep_maria.last_name = 'Torres'
        recep_maria.save()
        print(f"✓ Actualizado: {recep_maria.get_full_name()}")
    else:
        print(f"✓ Confirmado: {recep_maria.get_full_name()}")
except User.DoesNotExist:
    print("✗ Usuario recep_maria no encontrado")

print("\n✅ ¡Actualización completada!")

