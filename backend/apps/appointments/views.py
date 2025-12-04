from rest_framework import generics, permissions, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
from calendar import monthrange

from .models import TimeSlot, Appointment, WaitingList
from .serializers import (
    TimeSlotSerializer, TimeSlotCreateSerializer,
    AppointmentSerializer, AppointmentCreateSerializer,
    AppointmentUpdateSerializer, AppointmentRescheduleSerializer,
    WaitingListSerializer, WaitingListCreateSerializer,
    CalendarSerializer
)
from apps.users.models import User


class TimeSlotListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear bloques de tiempo"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['date', 'start_time']
    filterset_fields = ['veterinarian', 'date', 'is_available']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TimeSlotCreateSerializer
        return TimeSlotSerializer
    
    def get_queryset(self):
        return TimeSlot.objects.all()


class TimeSlotDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar bloques de tiempo"""
    queryset = TimeSlot.objects.all()
    serializer_class = TimeSlotSerializer
    permission_classes = [permissions.IsAuthenticated]


class AppointmentListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear citas"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['pet__name', 'client__first_name', 'client__last_name', 'reason']
    ordering_fields = ['appointment_date', 'appointment_time', 'created_at']
    filterset_fields = ['status', 'veterinarian', 'client', 'appointment_date']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AppointmentCreateSerializer
        return AppointmentSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Los clientes solo ven sus propias citas
        if user.role == 'CLIENTE':
            return Appointment.objects.filter(client=user)
        
        # Los veterinarios ven sus citas asignadas
        if user.role == 'VETERINARIO':
            return Appointment.objects.filter(veterinarian=user)
        
        # Los recepcionistas ven todas las citas
        return Appointment.objects.all()
    
    def perform_create(self, serializer):
        # Los veterinarios NO pueden crear citas
        if self.request.user.role == 'VETERINARIO':
            raise PermissionDenied(
                detail='Los veterinarios no pueden crear citas. Solo pueden ver su agenda asignada.'
            )
        
        # Verificar disponibilidad del slot ANTES de crear la cita
        time_slot = serializer.validated_data.get('time_slot')
        veterinarian = serializer.validated_data.get('veterinarian')
        appointment_date = serializer.validated_data.get('appointment_date')
        appointment_time = serializer.validated_data.get('appointment_time')
        
        if time_slot:
            # Verificar si el slot sigue disponible (race condition protection)
            time_slot.refresh_from_db()
            if not time_slot.is_available:
                # Buscar veterinarios alternativos disponibles en ese mismo horario
                alternative_vets = self._find_alternative_veterinarians(
                    appointment_date, 
                    appointment_time, 
                    veterinarian
                )
                
                error_response = {
                    'error': 'Este horario ya no está disponible con el veterinario seleccionado.',
                    'time_slot': ['Este bloque de tiempo ya no está disponible.'],
                    'alternative_veterinarians': alternative_vets
                }
                from rest_framework.exceptions import ValidationError
                raise ValidationError(error_response)
        
        # Establecer quién creó la cita
        serializer.save(created_by=self.request.user)
    
    def _find_alternative_veterinarians(self, date, time, excluded_vet):
        """Buscar veterinarios alternativos disponibles en el mismo horario"""
        # Buscar todos los veterinarios activos excepto el excluido
        alternative_vets = User.objects.filter(
            role='VETERINARIO',
            is_active=True
        ).exclude(id=excluded_vet.id if excluded_vet else None)
        
        alternatives = []
        for vet in alternative_vets:
            # Buscar slots disponibles para este veterinario en la misma fecha y hora
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


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar citas"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return AppointmentUpdateSerializer
        return AppointmentSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Los clientes solo pueden acceder a sus propias citas
        if user.role == 'CLIENTE':
            return Appointment.objects.filter(client=user)
        
        # Los veterinarios solo pueden acceder a sus citas
        if user.role == 'VETERINARIO':
            return Appointment.objects.filter(veterinarian=user)
        
        # Los recepcionistas pueden acceder a todas
        return Appointment.objects.all()


class MonthlyCalendarView(APIView):
    """
    HU002: Vista para obtener calendario mensual con disponibilidad por veterinario
    Muestra bloques de atención disponibles y ocupados para cada veterinario
    """
    permission_classes = [permissions.AllowAny]  # Público para permitir búsqueda sin autenticación
    
    def get(self, request):
        # Los veterinarios NO pueden acceder al calendario de agendamiento (solo si está autenticado)
        if request.user.is_authenticated and request.user.role == 'VETERINARIO':
            return Response(
                {'error': 'Los veterinarios no pueden acceder al calendario de agendamiento. Solo pueden ver su agenda asignada.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Obtener parámetros
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        veterinarian_id = request.query_params.get('veterinarian_id')
        
        # Validar mes y año
        if month < 1 or month > 12:
            return Response(
                {'error': 'El mes debe estar entre 1 y 12'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener primer y último día del mes
        first_day = datetime(year, month, 1).date()
        last_day_num = monthrange(year, month)[1]
        last_day = datetime(year, month, last_day_num).date()
        
        # Filtrar veterinarios
        if veterinarian_id:
            veterinarians = User.objects.filter(id=veterinarian_id, role='VETERINARIO')
        else:
            veterinarians = User.objects.filter(role='VETERINARIO', is_active=True)
        
        calendar_data = []
        
        for vet in veterinarians:
            # Obtener bloques de tiempo del veterinario para el mes
            time_slots = TimeSlot.objects.filter(
                veterinarian=vet,
                date__gte=first_day,
                date__lte=last_day
            ).order_by('date', 'start_time')
            
            # Agrupar por fecha
            dates_dict = {}
            for slot in time_slots:
                date_str = slot.date.isoformat()
                if date_str not in dates_dict:
                    dates_dict[date_str] = {
                        'date': slot.date,
                        'available_slots': [],
                        'occupied_slots': []
                    }
                
                if slot.is_available:
                    dates_dict[date_str]['available_slots'].append(slot)
                else:
                    # Obtener información de la cita
                    try:
                        appointment = Appointment.objects.get(time_slot=slot)
                        dates_dict[date_str]['occupied_slots'].append({
                            'time_slot_id': slot.id,
                            'start_time': slot.start_time.strftime('%H:%M'),
                            'end_time': slot.end_time.strftime('%H:%M'),
                            'appointment_id': appointment.id,
                            'pet_name': appointment.pet.name,
                            'client_name': appointment.client.get_full_name(),
                            'status': appointment.status
                        })
                    except Appointment.DoesNotExist:
                        # El slot está marcado como no disponible pero no tiene cita
                        dates_dict[date_str]['occupied_slots'].append({
                            'time_slot_id': slot.id,
                            'start_time': slot.start_time.strftime('%H:%M'),
                            'end_time': slot.end_time.strftime('%H:%M'),
                            'reason': 'No disponible'
                        })
            
            # Añadir al calendario
            for date_str, date_data in dates_dict.items():
                calendar_data.append({
                    'veterinarian_id': vet.id,
                    'veterinarian_name': vet.get_full_name(),
                    'date': date_str,  # Usar date_str (ya en formato ISO) en lugar del objeto date
                    'available_slots': TimeSlotSerializer(date_data['available_slots'], many=True).data,
                    'occupied_slots': date_data['occupied_slots']
                })
        
        return Response({
            'year': year,
            'month': month,
            'calendar': calendar_data
        }, status=status.HTTP_200_OK)


class RescheduleAppointmentView(APIView):
    """
    HU006: Vista para reprogramar citas
    Permite cambiar fecha, hora y veterinario de una cita existente
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        # Obtener la cita a reprogramar
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Cita no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar permisos
        user = request.user
        if user.role == 'CLIENTE' and appointment.client != user:
            return Response(
                {'error': 'No tiene permiso para reprogramar esta cita'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validar datos
        serializer = AppointmentRescheduleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener datos
        new_date = serializer.validated_data['new_date']
        new_time = serializer.validated_data['new_time']
        new_vet_id = serializer.validated_data.get('new_veterinarian')
        new_slot_id = serializer.validated_data.get('new_time_slot')
        reason = serializer.validated_data.get('reason', '')
        
        # Liberar el time_slot anterior si existe
        if appointment.time_slot:
            old_slot = appointment.time_slot
            old_slot.is_available = True
            old_slot.save()
        
        # Asignar nuevo time_slot si se proporciona
        new_time_slot = None
        if new_slot_id:
            try:
                new_time_slot = TimeSlot.objects.get(pk=new_slot_id)
                if not new_time_slot.is_available:
                    return Response(
                        {'error': 'El nuevo bloque de tiempo no está disponible'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except TimeSlot.DoesNotExist:
                return Response(
                    {'error': 'Bloque de tiempo no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Asignar nuevo veterinario si se proporciona
        new_veterinarian = appointment.veterinarian
        if new_vet_id:
            try:
                new_veterinarian = User.objects.get(pk=new_vet_id, role='VETERINARIO')
            except User.DoesNotExist:
                return Response(
                    {'error': 'Veterinario no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Guardar información de la cita antigua
        old_appointment_data = {
            'date': appointment.appointment_date,
            'time': appointment.appointment_time,
            'veterinarian': appointment.veterinarian.get_full_name() if appointment.veterinarian else 'N/A'
        }
        
        # Actualizar la cita
        appointment.appointment_date = new_date
        appointment.appointment_time = new_time
        appointment.veterinarian = new_veterinarian
        appointment.time_slot = new_time_slot
        appointment.status = 'REPROGRAMADA'
        
        # Agregar nota sobre la reprogramación
        reprogramming_note = f"\nReprogramada el {timezone.now().strftime('%d/%m/%Y %H:%M')}"
        reprogramming_note += f"\nDesde: {old_appointment_data['date']} {old_appointment_data['time']} - Dr. {old_appointment_data['veterinarian']}"
        reprogramming_note += f"\nHacia: {new_date} {new_time} - Dr. {new_veterinarian.get_full_name()}"
        if reason:
            reprogramming_note += f"\nMotivo: {reason}"
        
        if appointment.receptionist_notes:
            appointment.receptionist_notes += reprogramming_note
        else:
            appointment.receptionist_notes = reprogramming_note
        
        appointment.save()
        
        # Serializar y devolver
        response_serializer = AppointmentSerializer(appointment)
        
        # Información del cliente y mascota para el mensaje
        client_info = {
            'id': appointment.client.id,
            'name': appointment.client.get_full_name(),
            'email': appointment.client.email
        }
        pet_info = {
            'id': appointment.pet.id,
            'name': appointment.pet.name,
            'species': appointment.pet.species
        }
        
        return Response({
            'message': f'Cita reprogramada exitosamente para {appointment.pet.name} (Cliente: {appointment.client.get_full_name()})',
            'appointment': response_serializer.data,
            'client': client_info,
            'pet': pet_info,
            'old_data': old_appointment_data
        }, status=status.HTTP_200_OK)


class CancelAppointmentView(APIView):
    """Vista para cancelar citas y liberar el horario"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Cita no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar permisos
        user = request.user
        if user.role == 'CLIENTE' and appointment.client != user:
            return Response(
                {'error': 'No tiene permiso para cancelar esta cita'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Liberar el time_slot si existe
        if appointment.time_slot:
            slot = appointment.time_slot
            slot.is_available = True
            slot.save()
            
            veterinarian_name = appointment.veterinarian.get_full_name() if appointment.veterinarian else 'el veterinario'
            freed_slot_info = {
                'message': f'Se ha liberado un horario de {veterinarian_name}',
                'date': slot.date,
                'time': f"{slot.start_time} - {slot.end_time}",
                'veterinarian_id': appointment.veterinarian.id if appointment.veterinarian else None
            }
        else:
            freed_slot_info = None
        
        # Cambiar estado de la cita
        appointment.status = 'CANCELADA'
        cancellation_note = f"\nCancelada el {timezone.now().strftime('%d/%m/%Y %H:%M')} por {user.get_full_name()}"
        
        if appointment.receptionist_notes:
            appointment.receptionist_notes += cancellation_note
        else:
            appointment.receptionist_notes = cancellation_note
        
        appointment.save()
        
        # Buscar en lista de espera
        waiting_list_entries = WaitingList.objects.filter(
            is_active=True,
            contacted=False
        ).order_by('priority', 'created_at')[:5]
        
        # Información del cliente y mascota para el mensaje
        client_info = {
            'id': appointment.client.id,
            'name': appointment.client.get_full_name(),
            'email': appointment.client.email
        }
        pet_info = {
            'id': appointment.pet.id,
            'name': appointment.pet.name,
            'species': appointment.pet.species
        }
        
        return Response({
            'message': f'Cita cancelada exitosamente para {appointment.pet.name} (Cliente: {appointment.client.get_full_name()})',
            'client': client_info,
            'pet': pet_info,
            'freed_slot': freed_slot_info,
            'waiting_list_count': waiting_list_entries.count(),
            'waiting_list_clients': WaitingListSerializer(waiting_list_entries, many=True).data
        }, status=status.HTTP_200_OK)


class AttendAppointmentView(APIView):
    """Vista para que el veterinario marque una cita como atendida"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response(
                {'error': 'Cita no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Solo el veterinario asignado puede marcar como atendida
        user = request.user
        if user.role != 'VETERINARIO':
            return Response(
                {'error': 'Solo los veterinarios pueden marcar citas como atendidas'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if appointment.veterinarian != user:
            return Response(
                {'error': 'Solo puedes marcar como atendidas las citas asignadas a ti'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if appointment.status == 'ATENDIDA':
            return Response(
                {'error': 'Esta cita ya fue marcada como atendida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Marcar cita como atendida
        appointment.status = 'ATENDIDA'
        appointment.save()
        
        return Response({
            'message': 'Cita marcada como atendida exitosamente',
            'appointment': AppointmentSerializer(appointment).data
        }, status=status.HTTP_200_OK)


class WaitingListListCreateView(generics.ListCreateAPIView):
    """Vista para listar y crear entradas en lista de espera"""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, DjangoFilterBackend]
    ordering_fields = ['priority', 'created_at']
    filterset_fields = ['client', 'preferred_veterinarian', 'is_active', 'contacted']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return WaitingListCreateSerializer
        return WaitingListSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        # Los clientes solo ven sus propias entradas
        if user.role == 'CLIENTE':
            return WaitingList.objects.filter(client=user)
        
        # Recepcionistas y veterinarios ven todas
        return WaitingList.objects.filter(is_active=True)


class WaitingListDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vista para ver, actualizar y eliminar entradas de lista de espera"""
    queryset = WaitingList.objects.all()
    serializer_class = WaitingListSerializer
    permission_classes = [permissions.IsAuthenticated]


class VeterinarianAvailabilityPublicView(APIView):
    """Vista pública para obtener disponibilidad de horarios (sin autenticación)"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        veterinarian_id = request.query_params.get('veterinarian_id')
        
        # Validar mes y año
        if month < 1 or month > 12:
            return Response(
                {'error': 'El mes debe estar entre 1 y 12'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener primer y último día del mes
        first_day = datetime(year, month, 1).date()
        last_day_num = monthrange(year, month)[1]
        last_day = datetime(year, month, last_day_num).date()
        
        # Filtrar veterinario
        if not veterinarian_id:
            return Response(
                {'error': 'Se requiere veterinarian_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            veterinarian = User.objects.get(id=veterinarian_id, role='VETERINARIO', is_active=True)
        except User.DoesNotExist:
            return Response(
                {'error': 'Veterinario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener bloques de tiempo disponibles
        time_slots = TimeSlot.objects.filter(
            veterinarian=veterinarian,
            date__gte=first_day,
            date__lte=last_day,
            is_available=True
        ).order_by('date', 'start_time')
        
        # Agrupar por fecha
        dates_dict = {}
        for slot in time_slots:
            date_str = slot.date.isoformat()
            if date_str not in dates_dict:
                dates_dict[date_str] = {
                    'date': slot.date,
                    'available_slots': [],
                    'occupied_slots': []
                }
            dates_dict[date_str]['available_slots'].append(slot)
        
        # Obtener citas ocupadas
        appointments = Appointment.objects.filter(
            veterinarian=veterinarian,
            appointment_date__gte=first_day,
            appointment_date__lte=last_day,
            status__in=['CONFIRMADA', 'PENDIENTE']
        )
        
        for appointment in appointments:
            date_str = appointment.appointment_date.isoformat()
            if date_str in dates_dict:
                dates_dict[date_str]['occupied_slots'].append({
                    'id': appointment.id,
                    'time': appointment.appointment_time.strftime('%H:%M'),
                    'status': appointment.status
                })
        
        calendar_data = []
        for date_str, date_data in dates_dict.items():
            calendar_data.append({
                'veterinarian_id': veterinarian.id,
                'veterinarian_name': veterinarian.get_full_name(),
                'date': date_data['date'].isoformat(),
                'available_slots': TimeSlotSerializer(date_data['available_slots'], many=True).data,
                'occupied_slots': date_data['occupied_slots']
            })
        
        return Response({
            'calendar': calendar_data
        }, status=status.HTTP_200_OK)


class VeterinarianAvailabilityView(APIView):
    """Vista para obtener disponibilidad de un veterinario específico"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, veterinarian_id):
        try:
            veterinarian = User.objects.get(id=veterinarian_id, role='VETERINARIO')
        except User.DoesNotExist:
            return Response(
                {'error': 'Veterinario no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener fecha (por defecto hoy)
        date_str = request.query_params.get('date')
        if date_str:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            target_date = timezone.now().date()
        
        # Obtener bloques disponibles
        available_slots = TimeSlot.objects.filter(
            veterinarian=veterinarian,
            date=target_date,
            is_available=True
        ).order_by('start_time')
        
        serializer = TimeSlotSerializer(available_slots, many=True)
        
        return Response({
            'veterinarian': {
                'id': veterinarian.id,
                'name': veterinarian.get_full_name()
            },
            'date': target_date,
            'available_slots': serializer.data
        }, status=status.HTTP_200_OK)

