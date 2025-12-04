"""
URL configuration for veterinaria_pochita project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('apps.users.urls')),
    path('api/pets/', include('apps.pets.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
    path('api/products/', include('apps.products.urls')),
    
    # Frontend views
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('login/', TemplateView.as_view(template_name='login.html'), name='login'),
    path('servicios/', TemplateView.as_view(template_name='servicios.html'), name='servicios'),
    path('nosotros/', TemplateView.as_view(template_name='nosotros.html'), name='nosotros'),
    path('contacto/', TemplateView.as_view(template_name='contacto.html'), name='contacto'),
    path('dashboard/', TemplateView.as_view(template_name='dashboard.html'), name='dashboard'),
    path('calendario/', TemplateView.as_view(template_name='calendar.html'), name='calendar'),
    path('agendar/', TemplateView.as_view(template_name='book_appointment.html'), name='book_appointment'),
]

# Configuración para servir archivos media y static en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Servir archivos estáticos desde STATICFILES_DIRS en desarrollo
    from django.contrib.staticfiles.urls import staticfiles_urlpatterns
    urlpatterns += staticfiles_urlpatterns()

