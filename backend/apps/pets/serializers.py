from rest_framework import serializers
from .models import Pet, MedicalRecord, PreRegisteredPet
from apps.users.serializers import UserSerializer


class PetSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Pet"""
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    age = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Pet
        fields = (
            'id', 'name', 'species', 'breed', 'gender', 'birth_date',
            'color', 'weight', 'owner', 'owner_name', 'microchip',
            'photo', 'notes', 'is_active', 'age', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class PetCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear mascotas"""
    
    class Meta:
        model = Pet
        fields = (
            'name', 'species', 'breed', 'gender', 'birth_date',
            'color', 'weight', 'microchip', 'photo', 'notes'
        )
        # El campo 'owner' se asigna automáticamente en perform_create() de la vista
    
    def validate_species(self, value):
        """Validar que solo se acepten perros y gatos"""
        if value and value not in ['PERRO', 'GATO']:
            raise serializers.ValidationError(
                "Solo atendemos perros y gatos. Por favor, seleccione Perro o Gato."
            )
        return value
    
    def create(self, validated_data):
        """
        Crear la mascota asignando el owner desde el contexto.
        """
        # Obtener el owner del contexto (request.user)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['owner'] = request.user
        return super().create(validated_data)
    
    def validate(self, attrs):
        # El owner se asigna automáticamente en create() o perform_create(), no necesita validarse aquí
        # Remover owner si está presente en los datos para evitar conflictos
        attrs.pop('owner', None)
        
        # Validar fecha de nacimiento según la especie
        birth_date = attrs.get('birth_date')
        species = attrs.get('species')
        
        if birth_date and species:
            from datetime import date, timedelta
            today = date.today()
            
            # No permitir fechas futuras
            if birth_date > today:
                raise serializers.ValidationError({
                    "birth_date": "La fecha de nacimiento no puede ser futura. Por favor, ingresa una fecha válida."
                })
            
            # Validar según la especie
            if species == 'PERRO':
                max_age_years = 20
                species_name = 'perros'
                age_range = '10 a 20 años'
            elif species == 'GATO':
                max_age_years = 20
                species_name = 'gatos'
                age_range = '13 a 20 años'
            else:
                max_age_years = 20  # Default
                species_name = 'mascotas'
                age_range = 'hasta 20 años'
            
            min_date = today - timedelta(days=max_age_years * 365)
            
            if birth_date < min_date:
                raise serializers.ValidationError({
                    "birth_date": f"La fecha de nacimiento no puede ser anterior a {min_date.strftime('%d/%m/%Y')}. "
                                 f"Los {species_name} suelen vivir entre {age_range}. Por favor, verifica la fecha."
                })
        
        return attrs


class MedicalRecordSerializer(serializers.ModelSerializer):
    """Serializer para el modelo MedicalRecord"""
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    veterinarian_name = serializers.CharField(source='veterinarian.get_full_name', read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = (
            'id', 'pet', 'pet_name', 'veterinarian', 'veterinarian_name',
            'visit_date', 'reason', 'diagnosis', 'treatment', 'prescription',
            'weight_at_visit', 'temperature', 'notes', 'next_visit',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'visit_date', 'created_at', 'updated_at')


class MedicalRecordCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear fichas médicas"""
    
    class Meta:
        model = MedicalRecord
        fields = (
            'pet', 'veterinarian', 'reason', 'diagnosis', 'treatment',
            'prescription', 'weight_at_visit', 'temperature', 'notes', 'next_visit'
        )
    
    def validate(self, attrs):
        # Validar que el veterinario sea realmente un veterinario
        veterinarian = attrs.get('veterinarian')
        if veterinarian and veterinarian.role != 'VETERINARIO':
            raise serializers.ValidationError({
                "veterinarian": "El veterinario debe ser un usuario con rol de VETERINARIO."
            })
        return attrs


class PreRegisteredPetSerializer(serializers.ModelSerializer):
    """Serializer para mascotas pre-registradas"""
    
    class Meta:
        model = PreRegisteredPet
        fields = (
            'id', 'name', 'species', 'breed', 'gender', 'birth_date',
            'color', 'weight', 'owner_email', 'owner_name', 'owner_phone',
            'is_claimed', 'notes', 'created_at'
        )
        read_only_fields = ('id', 'is_claimed', 'claimed_by', 'created_at')
    
    def validate_species(self, value):
        """Validar que solo se acepten perros y gatos"""
        if value and value not in ['PERRO', 'GATO']:
            raise serializers.ValidationError(
                "Solo atendemos perros y gatos. Por favor, seleccione Perro o Gato."
            )
        return value
    
    def validate_owner_email(self, value):
        """Validar que el email no esté ya registrado como usuario"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Este email ya está registrado. Por favor, inicia sesión."
            )
        
        return value
    
    def validate(self, attrs):
        """Validar fecha de nacimiento según la especie"""
        birth_date = attrs.get('birth_date')
        species = attrs.get('species')
        
        if birth_date and species:
            from datetime import date, timedelta
            today = date.today()
            
            # No permitir fechas futuras
            if birth_date > today:
                raise serializers.ValidationError({
                    "birth_date": "La fecha de nacimiento no puede ser futura. Por favor, ingresa una fecha válida."
                })
            
            # Validar según la especie
            if species == 'PERRO':
                max_age_years = 20
                species_name = 'perros'
                age_range = '10 a 20 años'
            elif species == 'GATO':
                max_age_years = 20
                species_name = 'gatos'
                age_range = '13 a 20 años'
            else:
                max_age_years = 20  # Default
                species_name = 'mascotas'
                age_range = 'hasta 20 años'
            
            min_date = today - timedelta(days=max_age_years * 365)
            
            if birth_date < min_date:
                raise serializers.ValidationError({
                    "birth_date": f"La fecha de nacimiento no puede ser anterior a {min_date.strftime('%d/%m/%Y')}. "
                                 f"Los {species_name} suelen vivir entre {age_range}. Por favor, verifica la fecha."
                })
        
        return attrs

