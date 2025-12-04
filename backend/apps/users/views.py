from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer
)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """Vista para registrar nuevos usuarios"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Vista para ver y actualizar el perfil del usuario autenticado"""
    serializer_class = UserUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserDetailView(generics.RetrieveAPIView):
    """Vista para obtener detalles completos del usuario autenticado"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """Vista para cambiar la contraseña del usuario"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            # Verificar la contraseña actual
            if not user.check_password(serializer.data.get('old_password')):
                return Response(
                    {'old_password': 'Contraseña incorrecta.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Establecer la nueva contraseña
            user.set_password(serializer.data.get('new_password'))
            user.save()
            
            return Response(
                {'message': 'Contraseña actualizada exitosamente.'},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Vista para cerrar sesión (blacklist del refresh token)"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Sesión cerrada exitosamente.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': 'Token inválido o ya expirado.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserListView(generics.ListAPIView):
    """Vista para listar usuarios (solo para staff/recepcionistas)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Los veterinarios y recepcionistas pueden ver todos los usuarios
        user = self.request.user
        if user.role in ['VETERINARIO', 'RECEPCIONISTA']:
            # Ordenar por nombre para consistencia
            return User.objects.all().order_by('first_name', 'last_name')
        # Los clientes solo pueden verse a sí mismos
        return User.objects.filter(id=user.id)


class VeterinariansPublicListView(APIView):
    """Vista pública para listar veterinarios activos (sin autenticación requerida)"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        veterinarians = User.objects.filter(
            role='VETERINARIO',
            is_active=True
        ).order_by('first_name', 'last_name')
        
        serializer = UserSerializer(veterinarians, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

