@echo off
chcp 65001 >nul
echo ========================================
echo  Iniciando servidor Django
echo  Veterinaria Pochita
echo ========================================
echo.
echo Navegando a la carpeta backend...
cd /d "%~dp0backend"
echo.
echo Verificando configuración...
python manage.py check
echo.
echo ========================================
echo  Iniciando servidor en http://localhost:8000
echo  Presiona Ctrl+C para detener el servidor
echo ========================================
echo.
python manage.py runserver
pause

