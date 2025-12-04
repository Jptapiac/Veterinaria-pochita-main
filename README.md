# 🐾 Veterinaria Pochita S.A. - Sistema de Gestión

Sistema web completo para la gestión de una veterinaria, desarrollado con Django REST Framework en el backend y HTML/CSS/JavaScript con Bootstrap en el frontend.

## 📋 Descripción

Sistema integral para **Veterinaria Pochita S.A.** que permite gestionar:
- ✅ Agendamiento y gestión de citas médicas
- ✅ Registro y seguimiento de mascotas
- ✅ Fichas médicas y tratamientos
- ✅ Venta de productos e inventario
- ✅ Sistema de roles (Cliente, Recepcionista, Veterinario)
- ✅ Lista de espera y reprogramación de citas

## 🎯 Historias de Usuario Implementadas

### HU002: Agendar hora de atención (Recepcionista/Cliente)
- Vista de calendario mensual con bloques de atención disponibles
- Identificación de disponibilidad por veterinario
- Selección visual de fecha y horario
- Confirmación de cita con información de la mascota

### HU006: Replanificar horas de atención (Recepcionista)
- Reprogramación de citas existentes
- Liberación automática de horarios cancelados
- Visualización de antecedentes de pacientes
- Notificación de horarios liberados para lista de espera

## 🛠 Tecnologías Utilizadas

### Backend
- **Python 3.x**
- **Django 4.2.7** - Framework web
- **Django REST Framework 3.14.0** - API REST
- **PostgreSQL** - Base de datos
- **JWT (Simple JWT)** - Autenticación
- **Pillow** - Manejo de imágenes

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos y responsivos
- **JavaScript (ES6+)** - Interactividad
- **Bootstrap 5.3** - Framework CSS
- **Font Awesome 6.4** - Iconos

## 📁 Estructura del Proyecto

```
veterinaria-pochita/
├── apps/
│   ├── users/              # Gestión de usuarios y autenticación
│   ├── pets/               # Gestión de mascotas y fichas médicas
│   ├── appointments/       # Gestión de citas y calendario
│   └── products/           # Gestión de productos y ventas
├── static/
│   ├── css/
│   │   └── style.css       # Estilos personalizados
│   └── js/
│       ├── auth.js         # Gestión de autenticación
│       ├── main.js         # Funciones generales
│       ├── login.js        # Login y registro
│       ├── dashboard.js    # Dashboard principal
│       └── calendar.js     # Calendario (HU002 y HU006)
├── templates/
│   ├── base.html           # Template base
│   ├── index.html          # Página principal
│   ├── login.html          # Login y registro
│   ├── dashboard.html      # Dashboard
│   └── calendar.html       # Calendario de citas
├── veterinaria_pochita/
│   ├── settings.py         # Configuración del proyecto
│   ├── urls.py             # URLs principales
│   └── wsgi.py             # WSGI config
├── manage.py
├── requirements.txt
└── README.md
```

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd Veterinaria-pochita
```

### 2. Crear entorno virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Django Settings
SECRET_KEY=tu-clave-secreta-aqui
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Settings (PostgreSQL)
DB_NAME=veterinaria_pochita
DB_USER=postgres
DB_PASSWORD=tu-password
DB_HOST=localhost
DB_PORT=5432

# JWT Settings
JWT_SECRET_KEY=tu-jwt-secret-key
```

### 5. Crear base de datos PostgreSQL

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE veterinaria_pochita;

# Salir
\q
```

### 6. Ejecutar migraciones

```bash
python manage.py makemigrations
python manage.py migrate
```

### 7. Crear superusuario

```bash
python manage.py createsuperuser
```

### 8. Ejecutar servidor de desarrollo

```bash
python manage.py runserver
```

El proyecto estará disponible en: `http://localhost:8000`

## 👥 Roles del Sistema

### Cliente
- Ver y editar perfil
- Registrar mascotas
- Agendar citas
- Ver historial médico de mascotas
- Comprar productos
- Hacer reservas de productos

### Recepcionista
- Todas las funciones del cliente
- Agendar citas para cualquier cliente
- Reprogramar y cancelar citas
- Gestionar lista de espera
- Procesar ventas
- Actualizar inventario

### Veterinario
- Ver agenda de citas asignadas
- Acceder a fichas médicas
- Crear y actualizar tratamientos
- Registrar consultas
- Programar revisiones post-operatorias

## 📊 Modelos de Datos Principales

### User (usuarios)
- Modelo personalizado con roles
- Información de contacto
- Autenticación JWT

### Pet (mascotas)
- Datos de la mascota
- Relación con dueño (User)
- Foto e información médica básica

### Appointment (citas)
- Relación con mascota, cliente y veterinario
- TimeSlot asignado
- Estados: Pendiente, Confirmada, Atendida, Cancelada, Reprogramada
- Sistema de confirmación 24h

### TimeSlot (bloques de tiempo)
- Horarios disponibles por veterinario
- Fecha y rango de horas
- Estado de disponibilidad

### MedicalRecord (fichas médicas)
- Historial de visitas
- Diagnósticos y tratamientos
- Prescripciones
- Seguimientos

### Product (productos)
- Catálogo de productos
- Control de inventario
- Stock mínimo

## 🔗 Endpoints del API

### Autenticación
- `POST /api/auth/login/` - Iniciar sesión
- `POST /api/auth/register/` - Registrar usuario
- `POST /api/auth/logout/` - Cerrar sesión
- `GET /api/auth/me/` - Obtener usuario actual

### Mascotas
- `GET /api/pets/` - Listar mascotas
- `POST /api/pets/` - Crear mascota
- `GET /api/pets/{id}/` - Detalle de mascota
- `GET /api/pets/{id}/history/` - Historial médico

### Citas
- `GET /api/appointments/` - Listar citas
- `POST /api/appointments/` - Crear cita
- `GET /api/appointments/calendar/monthly/` - Calendario mensual (HU002)
- `POST /api/appointments/{id}/reschedule/` - Reprogramar cita (HU006)
- `POST /api/appointments/{id}/cancel/` - Cancelar cita

### Productos
- `GET /api/products/` - Listar productos
- `GET /api/products/low-stock/` - Productos con stock bajo
- `POST /api/products/sales/` - Registrar venta

## ✨ Características Destacadas

### Sistema de Calendario Avanzado (HU002)
- Vista mensual con navegación intuitiva
- Bloques de tiempo identificados por veterinario
- Visualización de disponibilidad en tiempo real
- Selección visual de fecha y horario
- Validación automática de disponibilidad

### Reprogramación Inteligente (HU006)
- Liberación automática de horarios
- Historial de cambios en la cita
- Notificación a lista de espera
- Identificación de cliente y mascota
- Registro de motivo de reprogramación

### Seguridad
- Autenticación JWT con refresh tokens
- Permisos basados en roles
- Validación de datos en frontend y backend
- CORS configurado
- Protección CSRF

### UX/UI
- Diseño moderno y responsivo
- Inspirado en veterinariaubo.cl
- Animaciones suaves
- Feedback visual inmediato
- Navegación intuitiva

## 🐛 Solución de Errores Comunes

El sistema evita los siguientes errores identificados en proyectos anteriores:

1. ✅ Errores mostrados en la sección correcta
2. ✅ Indicación clara de errores en formularios
3. ✅ Validación de roles en operaciones
4. ✅ Almacenamiento completo de información en BD
5. ✅ Validación de campos en frontend y backend
6. ✅ Cierre automático de modales tras operaciones
7. ✅ Identificación de cliente/mascota en operaciones
8. ✅ Alertas al liberar horarios
9. ✅ Individualización de información de mascotas
10. ✅ Asociación correcta mascota-dueño en agenda

## 📝 Uso del Sistema

### Para Clientes

1. **Registro**: Crear cuenta desde la página de login
2. **Agregar Mascotas**: Registrar mascotas desde el dashboard
3. **Agendar Cita**:
   - Ir al calendario
   - Seleccionar fecha con disponibilidad
   - Elegir veterinario y horario
   - Seleccionar mascota y motivo
   - Confirmar cita

### Para Recepcionistas

1. **Gestionar Citas**:
   - Ver calendario mensual completo
   - Agendar citas para clientes
   - Reprogramar citas existentes
   - Cancelar citas (libera horarios automáticamente)
   
2. **Lista de Espera**:
   - Agregar clientes a lista de espera
   - Contactar cuando se liberen horarios
   - Asignar citas desde lista de espera

### Para Veterinarios

1. **Ver Agenda**: Acceder a citas asignadas
2. **Fichas Médicas**: Consultar y actualizar historial
3. **Tratamientos**: Registrar procedimientos y prescripciones

## 🔄 Flujo de Agendamiento (HU002)

```
1. Cliente/Recepcionista → Accede al calendario
2. Sistema → Muestra disponibilidad mensual por veterinario
3. Usuario → Selecciona fecha
4. Sistema → Muestra horarios disponibles
5. Usuario → Selecciona horario y veterinario
6. Usuario → Completa información (mascota, motivo)
7. Sistema → Valida disponibilidad
8. Sistema → Confirma cita y marca horario como ocupado
```

## 🔄 Flujo de Reprogramación (HU006)

```
1. Cliente/Recepcionista → Solicita reprogramar cita
2. Sistema → Redirige a calendario con modo reprogramación
3. Usuario → Selecciona nueva fecha y horario
4. Sistema → Libera horario anterior
5. Sistema → Asigna nuevo horario
6. Sistema → Registra cambio en historial
7. Sistema → Notifica horario liberado a lista de espera
```

## 📞 Contacto y Soporte

Para consultas o problemas:
- Email: contacto@veterinariapochita.cl
- Teléfono: +56 9 1234 5678

## 📄 Licencia

Este proyecto es propiedad de Veterinaria Pochita S.A. © 2024

---

**Desarrollado con ❤️ para el cuidado de nuestras mascotas** 🐶🐱

