# 🚀 Cómo Iniciar el Servidor

## Opción 1: Usando el script batch (Más fácil)

1. Haz doble clic en el archivo **`iniciar_servidor.bat`** que está en la raíz del proyecto
2. Se abrirá una ventana de consola mostrando el progreso
3. Cuando veas el mensaje "Starting development server at http://127.0.0.1:8000/", el servidor estará listo

## Opción 2: Manualmente desde la terminal

### Windows (PowerShell o CMD):

```bash
cd backend
python manage.py runserver
```

### Si el puerto 8000 está ocupado:

```bash
cd backend
python manage.py runserver 8080
```

## Acceder al sitio

Una vez que el servidor esté corriendo, abre tu navegador y ve a:

- **Página de inicio**: http://localhost:8000
- **Admin de Django**: http://localhost:8000/admin/

## Detener el servidor

Presiona `Ctrl + C` en la ventana donde está corriendo el servidor.

---

**Nota**: Si ves algún error, asegúrate de estar en el directorio `backend` y que todas las dependencias estén instaladas.

