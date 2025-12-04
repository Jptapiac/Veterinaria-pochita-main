# 📡 Documentación del API - Veterinaria Pochita

Documentación completa de los endpoints del API REST.

## 🔐 Autenticación

El API usa **JWT (JSON Web Tokens)** para autenticación.

### Obtener Token (Login)

```http
POST /api/auth/login/
Content-Type: application/json

{
  "username": "usuario",
  "password": "contraseña"
}
```

**Respuesta exitosa (200):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Refrescar Token

```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### Usar el Token

En todas las peticiones autenticadas, incluir el header:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## 👥 Endpoints de Usuarios

### Registrar Usuario

```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "nuevo_usuario",
  "email": "usuario@email.com",
  "password": "contraseña123",
  "password_confirm": "contraseña123",
  "first_name": "Nombre",
  "last_name": "Apellido",
  "role": "CLIENTE",
  "phone": "+56912345678",
  "rut": "12345678-9",
  "address": "Dirección completa"
}
```

### Obtener Usuario Actual

```http
GET /api/auth/me/
Authorization: Bearer {token}
```

### Actualizar Perfil

```http
PATCH /api/auth/profile/
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "Nuevo Nombre",
  "phone": "+56987654321"
}
```

### Cambiar Contraseña

```http
POST /api/auth/change-password/
Authorization: Bearer {token}
Content-Type: application/json

{
  "old_password": "contraseña_actual",
  "new_password": "nueva_contraseña",
  "new_password_confirm": "nueva_contraseña"
}
```

### Listar Usuarios

```http
GET /api/auth/list/
Authorization: Bearer {token}
```

---

## 🐾 Endpoints de Mascotas

### Listar Mascotas

```http
GET /api/pets/
Authorization: Bearer {token}

# Filtros disponibles:
?species=PERRO
?gender=MACHO
?owner=1
?is_active=true

# Búsqueda:
?search=Max

# Ordenamiento:
?ordering=name
?ordering=-created_at
```

### Crear Mascota

```http
POST /api/pets/
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Max",
  "species": "PERRO",
  "breed": "Golden Retriever",
  "gender": "MACHO",
  "birth_date": "2020-03-15",
  "color": "Dorado",
  "weight": 28.5,
  "owner": 1,
  "microchip": "123456789",
  "notes": "Muy activo y juguetón"
}
```

### Obtener Mascota

```http
GET /api/pets/{id}/
Authorization: Bearer {token}
```

### Actualizar Mascota

```http
PATCH /api/pets/{id}/
Authorization: Bearer {token}
Content-Type: application/json

{
  "weight": 29.0,
  "notes": "Actualización de peso"
}
```

### Historial Médico de Mascota

```http
GET /api/pets/{id}/history/
Authorization: Bearer {token}
```

---

## 📅 Endpoints de Citas

### Listar Citas

```http
GET /api/appointments/
Authorization: Bearer {token}

# Filtros:
?status=PENDIENTE
?veterinarian=1
?client=2
?appointment_date=2024-12-15

# Búsqueda:
?search=control

# Ordenamiento:
?ordering=appointment_date
?ordering=-created_at
```

### Crear Cita

```http
POST /api/appointments/
Authorization: Bearer {token}
Content-Type: application/json

{
  "pet": 1,
  "client": 2,
  "veterinarian": 3,
  "time_slot": 10,
  "appointment_date": "2024-12-15",
  "appointment_time": "10:00:00",
  "reason": "Control de salud",
  "notes": "Primera consulta"
}
```

### Obtener Cita

```http
GET /api/appointments/{id}/
Authorization: Bearer {token}
```

### Actualizar Cita

```http
PATCH /api/appointments/{id}/
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "CONFIRMADA",
  "confirmed_24h": true,
  "receptionist_notes": "Cliente confirmó asistencia"
}
```

### 📆 HU002: Calendario Mensual

```http
GET /api/appointments/calendar/monthly/
Authorization: Bearer {token}

# Parámetros:
?year=2024
?month=12
?veterinarian_id=1
```

**Respuesta:**
```json
{
  "year": 2024,
  "month": 12,
  "calendar": [
    {
      "veterinarian_id": 1,
      "veterinarian_name": "Dr. Carlos Méndez",
      "date": "2024-12-15",
      "available_slots": [
        {
          "id": 10,
          "start_time": "10:00:00",
          "end_time": "11:00:00",
          "is_available": true
        }
      ],
      "occupied_slots": [
        {
          "time_slot_id": 11,
          "start_time": "11:00",
          "end_time": "12:00",
          "appointment_id": 5,
          "pet_name": "Max",
          "client_name": "Juan Pérez",
          "status": "CONFIRMADA"
        }
      ]
    }
  ]
}
```

### 🔄 HU006: Reprogramar Cita

```http
POST /api/appointments/{id}/reschedule/
Authorization: Bearer {token}
Content-Type: application/json

{
  "new_date": "2024-12-20",
  "new_time": "15:00:00",
  "new_veterinarian": 2,
  "new_time_slot": 25,
  "reason": "Conflicto de horario del cliente"
}
```

**Respuesta:**
```json
{
  "message": "Cita reprogramada exitosamente",
  "appointment": { /* datos de la cita */ },
  "old_data": {
    "date": "2024-12-15",
    "time": "10:00:00",
    "veterinarian": "Dr. Carlos Méndez"
  }
}
```

### Cancelar Cita

```http
POST /api/appointments/{id}/cancel/
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "message": "Cita cancelada exitosamente",
  "freed_slot": {
    "message": "Se ha liberado un horario de Dr. Carlos Méndez",
    "date": "2024-12-15",
    "time": "10:00:00 - 11:00:00",
    "veterinarian_id": 1
  },
  "waiting_list_count": 3,
  "waiting_list_clients": [ /* clientes en espera */ ]
}
```

### Disponibilidad de Veterinario

```http
GET /api/appointments/veterinarian/{id}/availability/
Authorization: Bearer {token}

?date=2024-12-15
```

---

## ⏰ Endpoints de Bloques de Tiempo

### Listar Bloques

```http
GET /api/appointments/timeslots/
Authorization: Bearer {token}

?veterinarian=1
?date=2024-12-15
?is_available=true
```

### Crear Bloque

```http
POST /api/appointments/timeslots/
Authorization: Bearer {token}
Content-Type: application/json

{
  "veterinarian": 1,
  "date": "2024-12-15",
  "start_time": "10:00:00",
  "end_time": "11:00:00",
  "is_available": true
}
```

---

## 📦 Endpoints de Productos

### Listar Productos

```http
GET /api/products/
Authorization: Bearer {token}

?category=ALIMENTO
?is_active=true
?search=premium
?ordering=name
```

### Crear Producto

```http
POST /api/products/
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Alimento Premium Perro",
  "description": "Alimento balanceado para perros adultos",
  "category": "ALIMENTO",
  "price": 45000,
  "cost": 30000,
  "stock": 25,
  "min_stock": 5,
  "sku": "ALI-PER-001",
  "barcode": "7890123456789"
}
```

### Productos con Stock Bajo

```http
GET /api/products/low-stock/
Authorization: Bearer {token}
```

### Estadísticas de Productos

```http
GET /api/products/stats/
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "total_products": 50,
  "low_stock_products": 5,
  "total_sales": 120,
  "total_revenue": 5400000.00,
  "pending_reservations": 8
}
```

---

## 💰 Endpoints de Ventas

### Listar Ventas

```http
GET /api/products/sales/
Authorization: Bearer {token}

?client=1
?receptionist=2
?payment_method=EFECTIVO
?ordering=-created_at
```

### Crear Venta

```http
POST /api/products/sales/
Authorization: Bearer {token}
Content-Type: application/json

{
  "client": 1,
  "receptionist": 2,
  "payment_method": "TARJETA",
  "notes": "Cliente frecuente",
  "items": [
    {
      "product": 1,
      "quantity": 2,
      "unit_price": 45000
    },
    {
      "product": 3,
      "quantity": 1,
      "unit_price": 12000
    }
  ]
}
```

**Nota:** El sistema calcula automáticamente:
- El subtotal de cada item
- El total de la venta
- Actualiza el stock de los productos

---

## 📋 Endpoints de Lista de Espera

### Listar

```http
GET /api/appointments/waiting-list/
Authorization: Bearer {token}

?client=1
?preferred_veterinarian=2
?is_active=true
?contacted=false
?ordering=priority
```

### Agregar a Lista de Espera

```http
POST /api/appointments/waiting-list/
Authorization: Bearer {token}
Content-Type: application/json

{
  "client": 1,
  "pet": 2,
  "preferred_veterinarian": 3,
  "reason": "Consulta general",
  "notes": "Urgente",
  "priority": 1
}
```

---

## 🏥 Endpoints de Fichas Médicas

### Listar Fichas

```http
GET /api/pets/medical-records/
Authorization: Bearer {token}

?pet=1
?veterinarian=2
?visit_date=2024-12-15
```

### Crear Ficha

```http
POST /api/pets/medical-records/
Authorization: Bearer {token}
Content-Type: application/json

{
  "pet": 1,
  "veterinarian": 2,
  "reason": "Control de salud",
  "diagnosis": "Paciente en buen estado general",
  "treatment": "Vitaminas y desparasitación",
  "prescription": "Desparasitante cada 3 meses",
  "weight_at_visit": 28.5,
  "temperature": 38.5,
  "next_visit": "2025-03-15",
  "notes": "Paciente cooperativo"
}
```

---

## 📊 Códigos de Respuesta HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Petición exitosa |
| 201 | Created - Recurso creado exitosamente |
| 204 | No Content - Operación exitosa sin contenido |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 🔍 Ejemplos con cURL

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"cliente_juan","password":"cliente123"}'
```

### Obtener Mascotas
```bash
curl -X GET http://localhost:8000/api/pets/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Crear Cita
```bash
curl -X POST http://localhost:8000/api/appointments/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pet": 1,
    "client": 2,
    "veterinarian": 3,
    "time_slot": 10,
    "appointment_date": "2024-12-15",
    "appointment_time": "10:00:00",
    "reason": "Control"
  }'
```

---

## 🛠 Testing con Postman

1. Importar colección desde: `/postman_collection.json` (si existe)
2. Configurar variable de entorno `base_url`: `http://localhost:8000`
3. Ejecutar "Login" primero para obtener token
4. El token se guarda automáticamente en las variables

---

## 📝 Notas Importantes

1. **Autenticación**: Todos los endpoints requieren autenticación excepto login y register
2. **Permisos**: Los permisos varían según el rol del usuario
3. **Paginación**: Resultados paginados por defecto (10 items por página)
4. **Filtros**: Usa query parameters para filtrar resultados
5. **Validación**: El backend valida todos los datos enviados

---

Para más información, consulta el código fuente en las vistas y serializers de cada app.

