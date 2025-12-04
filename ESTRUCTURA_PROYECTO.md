# 📁 Estructura del Proyecto - Veterinaria Pochita

Este proyecto está organizado en tres carpetas principales para una mejor separación de responsabilidades:

## 🗂️ Estructura de Carpetas

```
veterinaria-pochita-main/
├── backend/              # Código del servidor Django
│   ├── apps/             # Aplicaciones Django (users, pets, appointments, products)
│   ├── veterinaria_pochita/  # Configuración del proyecto Django
│   ├── manage.py         # Script de administración de Django
│   ├── requirements.txt  # Dependencias de Python
│   ├── create_sample_data.py  # Script para crear datos de prueba
│   └── update_user_names.py   # Script de utilidad
│
├── frontend/             # Código del cliente (HTML, CSS, JavaScript)
│   ├── templates/        # Plantillas HTML
│   │   ├── base.html
│   │   ├── index.html
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   └── calendar.html
│   └── static/           # Archivos estáticos
│       ├── css/
│       │   └── style.css
│       └── js/
│           ├── auth.js
│           ├── login.js
│           ├── main.js
│           ├── dashboard.js
│           └── calendar.js
│
└── database/             # Base de datos
    └── db.sqlite3        # Base de datos SQLite (desarrollo)
```

## 🚀 Cómo Ejecutar el Proyecto

### 1. Navegar al directorio backend

```bash
cd backend
```

### 2. Ejecutar el servidor Django

```bash
python manage.py runserver
```

El servidor estará disponible en: `http://localhost:8000`

## 📝 Notas Importantes

- **Backend**: Contiene todo el código del servidor Django, incluyendo modelos, vistas, serializers y configuración.
- **Frontend**: Contiene las plantillas HTML y archivos estáticos (CSS y JavaScript) que se sirven desde Django.
- **Database**: Contiene la base de datos SQLite. En producción, esta carpeta puede contener scripts de migración o backups.

## ⚙️ Configuración

Las rutas están configuradas en `backend/veterinaria_pochita/settings.py`:

- **Templates**: `PROJECT_ROOT / 'frontend' / 'templates'`
- **Static Files**: `PROJECT_ROOT / 'frontend' / 'static'`
- **Database**: `PROJECT_ROOT / 'database' / 'db.sqlite3'`
- **Media Files**: `BASE_DIR / 'media'` (dentro de backend)

## 🔄 Migraciones

Para ejecutar migraciones desde la nueva estructura:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 📦 Crear Datos de Prueba

```bash
cd backend
python -c "import os, sys, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'veterinaria_pochita.settings'); django.setup(); exec(open('create_sample_data.py', encoding='utf-8').read())"
```

