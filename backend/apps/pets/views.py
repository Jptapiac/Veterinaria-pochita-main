from rest_framework import generics, permissions, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Pet, MedicalRecord, PreRegisteredPet
from .serializers import (
    PetSerializer, 
    PetCreateSerializer,
    MedicalRecordSerializer,
    MedicalRecordCreateSerializer,
    PreRegisteredPetSerializer
)


class PetListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear mascotas"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'owner__first_name', 'owner__last_name', 'microchip']
    ordering_fields = ['name', 'created_at']
    filterset_fields = ['species', 'gender', 'owner', 'is_active']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PetCreateSerializer
        return PetSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Los clientes solo ven sus propias mascotas
        if user.role == 'CLIENTE':
            return Pet.objects.filter(owner=user, is_active=True)
        
        # Recepcionistas y veterinarios ven todas las mascotas
        return Pet.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        # Asignar el owner automáticamente al usuario autenticado
        # Siempre asignar el owner al usuario que está creando la mascota
        serializer.save(owner=self.request.user)


class PetDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar una mascota específica"""
    serializer_class = PetSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Los clientes solo pueden acceder a sus propias mascotas
        if user.role == 'CLIENTE':
            return Pet.objects.filter(owner=user)
        
        # Recepcionistas y veterinarios pueden acceder a todas
        return Pet.objects.all()


class MedicalRecordListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear fichas médicas"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['pet__name', 'reason', 'diagnosis']
    ordering_fields = ['visit_date', 'created_at']
    filterset_fields = ['pet', 'veterinarian', 'visit_date']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MedicalRecordCreateSerializer
        return MedicalRecordSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Los clientes solo ven las fichas de sus mascotas
        if user.role == 'CLIENTE':
            return MedicalRecord.objects.filter(pet__owner=user)
        
        # Veterinarios ven las fichas que han creado
        if user.role == 'VETERINARIO':
            return MedicalRecord.objects.filter(veterinarian=user)
        
        # Recepcionistas ven todas
        return MedicalRecord.objects.all()


class MedicalRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar una ficha médica específica"""
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Los clientes solo pueden ver fichas de sus mascotas
        if user.role == 'CLIENTE':
            return MedicalRecord.objects.filter(pet__owner=user)
        
        # Veterinarios solo pueden ver/editar sus propias fichas
        if user.role == 'VETERINARIO':
            return MedicalRecord.objects.filter(veterinarian=user)
        
        # Recepcionistas pueden ver todas
        return MedicalRecord.objects.all()


class PetMedicalHistoryView(generics.ListAPIView):
    """Vista para obtener el historial médico completo de una mascota"""
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        pet_id = self.kwargs.get('pet_id')
        user = self.request.user
        
        # Verificar permisos de acceso
        if user.role == 'CLIENTE':
            return MedicalRecord.objects.filter(pet_id=pet_id, pet__owner=user)
        
        return MedicalRecord.objects.filter(pet_id=pet_id)


class PreRegisterPetView(generics.CreateAPIView):
    """Vista para pre-registrar una mascota ANTES de crear cuenta de usuario"""
    queryset = PreRegisteredPet.objects.all()
    serializer_class = PreRegisteredPetSerializer
    permission_classes = [permissions.AllowAny]  # No requiere autenticación
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response({
            'message': 'Mascota pre-registrada exitosamente. Al crear tu cuenta con este email, tu mascota se asociará automáticamente.',
            'pet': serializer.data
        }, status=status.HTTP_201_CREATED)

