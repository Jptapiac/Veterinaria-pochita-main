from django.urls import path
from .views import (
    TimeSlotListCreateView,
    TimeSlotDetailView,
    AppointmentListCreateView,
    AppointmentDetailView,
    MonthlyCalendarView,
    RescheduleAppointmentView,
    CancelAppointmentView,
    AttendAppointmentView,
    WaitingListListCreateView,
    WaitingListDetailView,
    VeterinarianAvailabilityView,
    VeterinarianAvailabilityPublicView
)

app_name = 'appointments'

urlpatterns = [
    # Gestión de bloques de tiempo
    path('timeslots/', TimeSlotListCreateView.as_view(), name='timeslot_list_create'),
    path('timeslots/<int:pk>/', TimeSlotDetailView.as_view(), name='timeslot_detail'),
    
    # Gestión de citas
    path('', AppointmentListCreateView.as_view(), name='appointment_list_create'),
    path('<int:pk>/', AppointmentDetailView.as_view(), name='appointment_detail'),
    path('<int:pk>/reschedule/', RescheduleAppointmentView.as_view(), name='appointment_reschedule'),
    path('<int:pk>/cancel/', CancelAppointmentView.as_view(), name='appointment_cancel'),
    path('<int:pk>/attend/', AttendAppointmentView.as_view(), name='appointment_attend'),
    
    # HU002: Calendario mensual
    path('calendar/monthly/', MonthlyCalendarView.as_view(), name='monthly_calendar'),
    
    # Disponibilidad de veterinarios
    path('veterinarian/<int:veterinarian_id>/availability/', VeterinarianAvailabilityView.as_view(), name='veterinarian_availability'),
    path('availability/public/', VeterinarianAvailabilityPublicView.as_view(), name='veterinarian_availability_public'),
    
    # Lista de espera
    path('waiting-list/', WaitingListListCreateView.as_view(), name='waiting_list_list_create'),
    path('waiting-list/<int:pk>/', WaitingListDetailView.as_view(), name='waiting_list_detail'),
]

