from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer para el modelo User"""
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'address', 'rut', 'profile_image',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer para el registro de nuevos usuarios"""
    
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'role', 'phone', 'address', 'rut'
        )
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Las contraseñas no coinciden."
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        
        # Si es un cliente, buscar mascotas pre-registradas con su email
        if user.role == 'CLIENTE':
            from apps.pets.models import PreRegisteredPet, Pet
            
            pre_registered_pets = PreRegisteredPet.objects.filter(
                owner_email=user.email,
                is_claimed=False
            )
            
            # Convertir las mascotas pre-registradas en mascotas reales
            for pre_pet in pre_registered_pets:
                Pet.objects.create(
                    name=pre_pet.name,
                    species=pre_pet.species,
                    breed=pre_pet.breed,
                    gender=pre_pet.gender,
                    birth_date=pre_pet.birth_date,
                    color=pre_pet.color,
                    weight=pre_pet.weight,
                    owner=user,
                    notes=pre_pet.notes
                )
                
                # Marcar como reclamada
                pre_pet.is_claimed = True
                pre_pet.claimed_by = user
                pre_pet.save()
        
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar información del usuario"""
    
    class Meta:
        model = User
        fields = (
            'email', 'first_name', 'last_name', 'phone', 
            'address', 'profile_image'
        )


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambiar contraseña"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                "new_password": "Las contraseñas no coinciden."
            })
        return attrs

