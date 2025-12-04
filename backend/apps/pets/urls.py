from django.urls import path
from .views import (
    PetListCreateView,
    PetDetailView,
    MedicalRecordListCreateView,
    MedicalRecordDetailView,
    PetMedicalHistoryView,
    PreRegisterPetView
)

app_name = 'pets'

urlpatterns = [
    # Pre-registro de mascotas (sin autenticación)
    path('pre-register/', PreRegisterPetView.as_view(), name='pre_register_pet'),
    
    # Gestión de mascotas
    path('', PetListCreateView.as_view(), name='pet_list_create'),
    path('<int:pk>/', PetDetailView.as_view(), name='pet_detail'),
    path('<int:pet_id>/history/', PetMedicalHistoryView.as_view(), name='pet_medical_history'),
    
    # Gestión de fichas médicas
    path('medical-records/', MedicalRecordListCreateView.as_view(), name='medical_record_list_create'),
    path('medical-records/<int:pk>/', MedicalRecordDetailView.as_view(), name='medical_record_detail'),
]

