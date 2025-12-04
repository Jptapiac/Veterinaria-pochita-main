# 🚀 Inicio Rápido - Veterinaria Pochita

Guía express para poner en marcha el proyecto en 5 minutos.

## ⚡ Comandos Rápidos

### 1. Configuración Inicial (Solo la primera vez)

```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env (editar con tus datos)
# Windows:
copy .env.example .env
# Linux/Mac:
cp .env.example .env
```

### 2. Configurar Base de Datos

```bash
# Conectar a PostgreSQL y ejecutar:
CREATE DATABASE veterinaria_pochita;

# Luego, ejecutar migraciones
python manage.py makemigrations
python manage.py migrate
```

### 3. Crear Superusuario

```bash
python manage.py createsuperuser
# Username: admin
# Email: admin@pochita.cl
# Password: (tu contraseña)
```

### 4. Crear Datos de Prueba

```bash
python manage.py shell < create_sample_data.py
```

### 5. Iniciar Servidor

```bash
python manage.py runserver
```

**¡Listo!** Accede a: http://localhost:8000

---

## 🔑 Usuarios de Prueba

Después de ejecutar `create_sample_data.py`, puedes usar:

| Rol | Usuario | Contraseña |
|-----|---------|------------|
| Veterinario | `vet_carlos` | `veterinario123` |
| Veterinario | `vet_ana` | `veterinario123` |
| Recepcionista | `recep_maria` | `recepcionista123` |
| Cliente | `cliente_juan` | `cliente123` |
| Cliente | `cliente_sofia` | `cliente123` |

---

## 🎯 Pruebas Rápidas

### Probar HU002: Agendar Cita

1. Iniciar sesión como cliente (`cliente_juan` / `cliente123`)
2. Ir a "Calendario de Citas"
3. Seleccionar una fecha con disponibilidad (marcada en verde)
4. Elegir un horario disponible
5. Seleccionar mascota "Max"
6. Completar motivo de consulta
7. Confirmar cita

### Probar HU006: Reprogramar Cita

1. Iniciar sesión como recepcionista (`recep_maria` / `recepcionista123`)
2. Ir a "Dashboard" → "Mis Citas"
3. Buscar una cita confirmada
4. Click en "Reprogramar"
5. Seleccionar nueva fecha y horario
6. Confirmar reprogramación

---

## 📱 URLs Importantes

- **Inicio**: http://localhost:8000/
- **Login**: http://localhost:8000/login/
- **Dashboard**: http://localhost:8000/dashboard/
- **Calendario**: http://localhost:8000/calendario/
- **Admin Django**: http://localhost:8000/admin/
- **API Root**: http://localhost:8000/api/

---

## 🔧 Comandos Útiles

### Desarrollo

```bash
# Ver versión de Python
python --version

# Ver paquetes instalados
pip list

# Verificar migraciones pendientes
python manage.py showmigrations

# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Shell de Django
python manage.py shell

# Recolectar archivos estáticos
python manage.py collectstatic
```

### Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Ver bases de datos
\l

# Conectar a una base de datos
\c veterinaria_pochita

# Ver tablas
\dt

# Salir
\q
```

### Git

```bash
# Inicializar repositorio
git init

# Agregar archivos
git add .

# Commit
git commit -m "Initial commit"

# Ver estado
git status

# Ver historial
git log
```

---

## 🐛 Solución Rápida de Problemas

### "ModuleNotFoundError"
```bash
pip install -r requirements.txt
```

### "FATAL: database does not exist"
```bash
psql -U postgres -c "CREATE DATABASE veterinaria_pochita;"
python manage.py migrate
```

### "Port 8000 is already in use"
```bash
python manage.py runserver 8080
```

### "No module named 'decouple'"
```bash
pip install python-decouple
```

### Resetear base de datos (⚠️ elimina todos los datos)
```bash
python manage.py flush
python manage.py migrate
python manage.py createsuperuser
python manage.py shell < create_sample_data.py
```

---

## 📚 Documentación Completa

Para más detalles, consulta:
- `README.md` - Documentación general del proyecto
- `INSTALLATION_GUIDE.md` - Guía de instalación paso a paso

---

## 🎉 ¡Listo para empezar!

El sistema está funcionando. Explora las diferentes funcionalidades:

✅ Sistema de autenticación con roles  
✅ Gestión de mascotas  
✅ Calendario de citas (HU002)  
✅ Reprogramación de citas (HU006)  
✅ Fichas médicas  
✅ Catálogo de productos  
✅ Panel de administración  

**¿Necesitas ayuda?** Revisa la documentación o contacta al equipo de desarrollo.

