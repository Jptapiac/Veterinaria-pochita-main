# 📖 Guía de Instalación Detallada - Veterinaria Pochita

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- Python 3.8 o superior
- PostgreSQL 12 o superior
- pip (gestor de paquetes de Python)
- Git (opcional, para clonar el repositorio)

## Paso a Paso

### 1. Instalación de PostgreSQL

#### Windows
1. Descargar desde: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador
3. Anotar la contraseña del usuario `postgres`
4. Puerto por defecto: 5432

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

### 2. Configuración de la Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Dentro de psql:
CREATE DATABASE veterinaria_pochita;
CREATE USER veterinaria_user WITH PASSWORD 'tu_password_segura';
ALTER ROLE veterinaria_user SET client_encoding TO 'utf8';
ALTER ROLE veterinaria_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE veterinaria_user SET timezone TO 'America/Santiago';
GRANT ALL PRIVILEGES ON DATABASE veterinaria_pochita TO veterinaria_user;

# Salir
\q
```

### 3. Preparación del Proyecto

```bash
# Navegar a la carpeta del proyecto
cd ruta/a/Veterinaria-pochita

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Verificar que el entorno esté activo (debe aparecer (venv) antes del prompt)
```

### 4. Instalación de Dependencias

```bash
# Actualizar pip
python -m pip install --upgrade pip

# Instalar dependencias del proyecto
pip install -r requirements.txt
```

### 5. Configuración de Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Configuración de Django
SECRET_KEY=django-insecure-cambiar-esto-por-una-clave-segura-random
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Configuración de Base de Datos
DB_NAME=veterinaria_pochita
DB_USER=veterinaria_user
DB_PASSWORD=tu_password_segura
DB_HOST=localhost
DB_PORT=5432

# Configuración JWT
JWT_SECRET_KEY=jwt-secret-key-cambiar-por-algo-seguro
```

> **Importante**: Para producción, genera claves secretas seguras usando:
```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

### 6. Migraciones de Base de Datos

```bash
# Crear migraciones
python manage.py makemigrations users
python manage.py makemigrations pets
python manage.py makemigrations appointments
python manage.py makemigrations products

# Aplicar migraciones
python manage.py migrate
```

### 7. Crear Superusuario

```bash
python manage.py createsuperuser

# Ingresa los datos solicitados:
# - Username: admin
# - Email: admin@veterinariapochita.cl
# - Password: (elige una contraseña segura)
# - Password (again): (repite la contraseña)
```

### 8. Crear Directorios para Archivos Estáticos y Media

```bash
# Windows (PowerShell):
New-Item -ItemType Directory -Force -Path media, media\profiles, media\pets, media\products

# Linux/Mac:
mkdir -p media/profiles media/pets media/products
```

### 9. Recolectar Archivos Estáticos

```bash
python manage.py collectstatic --noinput
```

### 10. Ejecutar el Servidor de Desarrollo

```bash
python manage.py runserver
```

El servidor estará disponible en: **http://localhost:8000**

## Verificación de la Instalación

### 1. Acceder al Admin de Django

Visita: http://localhost:8000/admin/

Inicia sesión con el superusuario creado.

### 2. Crear Datos de Prueba

#### Crear Veterinarios

1. En el admin, ir a **Usuarios** → **Agregar usuario**
2. Crear usuario con:
   - Username: `vet1`
   - Password: `veterinario123`
   - First name: `Carlos`
   - Last name: `Veterinario`
   - Role: `VETERINARIO`
   - Email: `vet1@pochita.cl`

#### Crear Recepcionista

1. Ir a **Usuarios** → **Agregar usuario**
2. Crear usuario con:
   - Username: `recep1`
   - Password: `recepcionista123`
   - First name: `María`
   - Last name: `Recepcionista`
   - Role: `RECEPCIONISTA`
   - Email: `recep1@pochita.cl`

#### Crear Cliente de Prueba

Puedes hacerlo desde el admin o desde la página de registro en:
http://localhost:8000/login/

### 3. Crear Bloques de Tiempo (TimeSlots)

Para que el calendario funcione, necesitas crear bloques de tiempo:

1. En el admin, ir a **Bloques de Tiempo** → **Agregar bloque de tiempo**
2. Crear varios bloques para diferentes días y horas
3. Ejemplo:
   - Veterinario: Carlos Veterinario
   - Fecha: (fecha futura)
   - Hora inicio: 09:00:00
   - Hora fin: 10:00:00
   - Disponible: ✓

Repite para crear varios bloques durante el mes.

## Solución de Problemas Comunes

### Error: "ModuleNotFoundError"

**Solución**: Asegúrate de que el entorno virtual esté activado y las dependencias instaladas.

```bash
# Activar entorno virtual
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Reinstalar dependencias
pip install -r requirements.txt
```

### Error: "FATAL: password authentication failed"

**Solución**: Verifica las credenciales en el archivo `.env`:
- DB_USER
- DB_PASSWORD
- DB_NAME

### Error: "relation does not exist"

**Solución**: Ejecuta las migraciones:

```bash
python manage.py migrate
```

### Error: "Port 8000 is already in use"

**Solución**: Usa un puerto diferente:

```bash
python manage.py runserver 8080
```

### Error de CORS en el frontend

**Solución**: Verifica que `django-cors-headers` esté instalado y configurado en `settings.py`.

## Configuración para Producción

Para desplegar en producción, considera:

1. **DEBUG = False** en el archivo `.env`
2. Configurar `ALLOWED_HOSTS` con tu dominio
3. Usar un servidor WSGI como Gunicorn
4. Configurar un proxy reverso con Nginx
5. Usar HTTPS con certificados SSL
6. Configurar archivos estáticos con WhiteNoise o CDN
7. Usar variables de entorno seguras
8. Configurar logs y monitoreo

## Scripts Útiles

### Resetear la base de datos

```bash
# ⚠️ CUIDADO: Esto eliminará todos los datos

python manage.py flush --noinput
python manage.py migrate
python manage.py createsuperuser
```

### Crear backup de la base de datos

```bash
# PostgreSQL
pg_dump -U veterinaria_user veterinaria_pochita > backup_$(date +%Y%m%d).sql
```

### Restaurar backup

```bash
psql -U veterinaria_user veterinaria_pochita < backup_20240101.sql
```

## Próximos Pasos

1. Explora el panel de administración
2. Crea algunos usuarios de prueba
3. Registra mascotas
4. Crea bloques de tiempo para veterinarios
5. Prueba el sistema de agendamiento
6. Prueba la reprogramación de citas

## Soporte

Si encuentras problemas no cubiertos en esta guía:
1. Revisa los logs de Django en la consola
2. Revisa los logs de PostgreSQL
3. Consulta la documentación oficial de Django
4. Contacta al equipo de desarrollo

---

**¡Listo!** Tu sistema de Veterinaria Pochita está configurado y funcionando. 🎉

