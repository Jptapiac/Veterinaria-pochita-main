from rest_framework import serializers
from .models import TimeSlot, Appointment, WaitingList
from apps.pets.serializers import PetSerializer


class TimeSlotSerializer(serializers.ModelSerializer):
    """Serializer para bloques de tiempo"""
    veterinarian_name = serializers.CharField(source='veterinarian.get_full_name', read_only=True)
    
    class Meta:
        model = TimeSlot
        fields = (
            'id', 'veterinarian', 'veterinarian_name', 'date',
            'start_time', 'end_time', 'is_available',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class TimeSlotCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear bloques de tiempo"""
    
    class Meta:
        model = TimeSlot
        fields = ('veterinarian', 'date', 'start_time', 'end_time', 'is_available')
    
    def validate(self, attrs):
        # Validar que el veterinario sea realmente un veterinario
        veterinarian = attrs.get('veterinarian')
        if veterinarian and veterinarian.role != 'VETERINARIO':
            raise serializers.ValidationError({
                "veterinarian": "El usuario debe tener rol de VETERINARIO."
            })
        
        # Validar que la hora de fin sea posterior a la hora de inicio
        if attrs['end_time'] <= attrs['start_time']:
            raise serializers.ValidationError({
                "end_time": "La hora de fin debe ser posterior a la hora de inicio."
            })
        
        return attrs


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializer para citas"""
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    pet_details = PetSerializer(source='pet', read_only=True)
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    veterinarian_name = serializers.CharField(source='veterinarian.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = (
            'id', 'pet', 'pet_name', 'pet_details', 'client', 'client_name',
            'veterinarian', 'veterinarian_name', 'time_slot',
            'appointment_date', 'appointment_time', 'reason', 'status', 'status_display',
            'confirmed_24h', 'confirmation_date', 'notes', 'receptionist_notes',
            'rescheduled_from', 'created_by', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear citas"""
    
    class Meta:
        model = Appointment
        fields = (
            'pet', 'client', 'veterinarian', 'time_slot',
            'appointment_date', 'appointment_time', 'reason',
            'notes', 'receptionist_notes'
        )
    
    def validate(self, attrs):
        # Validar que el cliente sea realmente un cliente
        client = attrs.get('client')
        if client and client.role != 'CLIENTE':
            raise serializers.ValidationError({
                "client": "El usuario debe tener rol de CLIENTE."
            })
        
        # Validar que el veterinario sea realmente un veterinario
        veterinarian = attrs.get('veterinarian')
        if veterinarian and veterinarian.role != 'VETERINARIO':
            raise serializers.ValidationError({
                "veterinarian": "El usuario debe tener rol de VETERINARIO."
            })
        
        # Validar que la mascota pertenezca al cliente
        pet = attrs.get('pet')
        if pet and pet.owner != client:
            raise serializers.ValidationError({
                "pet": "La mascota no pertenece al cliente seleccionado."
            })
        
        # Validar que el time_slot esté disponible (si se proporciona)
        time_slot = attrs.get('time_slot')
        if time_slot:
            # Refrescar desde la BD para obtener el estado más reciente
            time_slot.refresh_from_db()
            if not time_slot.is_available:
                # Buscar veterinarios alternativos disponibles en ese mismo horario
                alternative_vets = self._find_alternative_veterinarians(
                    time_slot.date,
                    time_slot.start_time,
                    time_slot.veterinarian
                )
                error_data = {
                    "time_slot": ["Este bloque de tiempo ya no está disponible."]
                }
                # Si hay alternativas, agregarlas al error
                if alternative_vets:
                    error_data["alternative_veterinarians"] = alternative_vets
                raise serializers.ValidationError(error_data)
            
            # Validar y asegurar que la fecha de la cita coincida con la fecha del time_slot
            appointment_date = attrs.get('appointment_date')
            if appointment_date:
                # Usar la fecha del time_slot para asegurar consistencia
                # Esto previene problemas de zona horaria
                attrs['appointment_date'] = time_slot.date
                # También asegurar que la hora coincida
                if 'appointment_time' not in attrs or attrs.get('appointment_time') != time_slot.start_time:
                    attrs['appointment_time'] = time_slot.start_time
        
        return attrs
    
    def _find_alternative_veterinarians(self, date, time, excluded_vet):
        """Buscar veterinarios alternativos disponibles en el mismo horario"""
        from apps.users.models import User
        
        # Buscar todos los veterinarios activos excepto el excluido
        alternative_vets = User.objects.filter(
            role='VETERINARIO',
            is_active=True
        ).exclude(id=excluded_vet.id if excluded_vet else None)
        
        alternatives = []
        for vet in alternative_vets:
            # Buscar slots disponibles para este veterinario en la misma fecha y hora
            from .models import TimeSlot
            available_slots = TimeSlot.objects.filter(
                veterinarian=vet,
                date=date,
                start_time=time,
                is_available=True
            )
            
            if available_slots.exists():
                slot = available_slots.first()
                alternatives.append({
                    'id': vet.id,
                    'name': vet.get_full_name(),
                    'email': vet.email,
                    'time_slot_id': slot.id
                })
        
        return alternatives


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar citas"""
    
    class Meta:
        model = Appointment
        fields = (
            'status', 'confirmed_24h', 'confirmation_date',
            'notes', 'receptionist_notes'
        )


class AppointmentRescheduleSerializer(serializers.Serializer):
    """Serializer para reprogramar citas"""
    new_date = serializers.DateField(required=True)
    new_time = serializers.TimeField(required=True)
    new_veterinarian = serializers.IntegerField(required=False, allow_null=True)
    new_time_slot = serializers.IntegerField(required=False, allow_null=True)
    reason = serializers.CharField(required=False, allow_blank=True)


class WaitingListSerializer(serializers.ModelSerializer):
    """Serializer para lista de espera"""
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    pet_name = serializers.CharField(source='pet.name', read_only=True)
    veterinarian_name = serializers.CharField(source='preferred_veterinarian.get_full_name', read_only=True)
    
    class Meta:
        model = WaitingList
        fields = (
            'id', 'client', 'client_name', 'pet', 'pet_name',
            'preferred_veterinarian', 'veterinarian_name', 'reason',
            'notes', 'is_active', 'contacted', 'contact_date',
            'priority', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')


class WaitingListCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear entradas en lista de espera"""
    
    class Meta:
        model = WaitingList
        fields = (
            'client', 'pet', 'preferred_veterinarian',
            'reason', 'notes', 'priority'
        )
    
    def validate(self, attrs):
        # Validar que el cliente sea realmente un cliente
        client = attrs.get('client')
        if client and client.role != 'CLIENTE':
            raise serializers.ValidationError({
                "client": "El usuario debe tener rol de CLIENTE."
            })
        
        # Validar que la mascota pertenezca al cliente
        pet = attrs.get('pet')
        if pet and pet.owner != client:
            raise serializers.ValidationError({
                "pet": "La mascota no pertenece al cliente seleccionado."
            })
        
        return attrs


class CalendarSerializer(serializers.Serializer):
    """Serializer para respuesta del calendario mensual"""
    veterinarian_id = serializers.IntegerField()
    veterinarian_name = serializers.CharField()
    date = serializers.DateField()
    available_slots = TimeSlotSerializer(many=True)
    occupied_slots = serializers.ListField(child=serializers.DictField())

