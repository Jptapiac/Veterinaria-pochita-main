// calendar.js - Implementación de HU002 y HU006
let currentDate = new Date();
let selectedDate = null;
let selectedSlot = null;
let veterinarians = [];
let calendarData = [];
let rescheduleAppointmentId = null;

// Función para calcular la fecha de Pascua (algoritmo de Meeus/Jones/Butcher)
function calculateEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

// Función para obtener el nombre del feriado
function getHolidayName(year, month, day) {
    const date = new Date(year, month - 1, day);
    const monthDay = `${month}-${day}`;
    
    // Feriados fijos
    const fixedHolidays = {
        '1-1': 'Año Nuevo',
        '5-1': 'Día del Trabajador',
        '5-21': 'Día de las Glorias Navales',
        '8-15': 'Asunción de la Virgen',
        '9-18': 'Día de la Independencia Nacional',
        '9-19': 'Día del Ejército',
        '11-1': 'Día de Todos los Santos',
        '12-8': 'Inmaculada Concepción',
        '12-25': 'Navidad'
    };
    
    if (fixedHolidays[monthDay]) {
        return fixedHolidays[monthDay];
    }
    
    // Feriados variables (pueden moverse al lunes si caen en domingo)
    const dayOfWeek = date.getDay();
    const dayNum = date.getDate();
    
    // 29 de junio: San Pedro y San Pablo
    if (month === 6 && dayNum === 29) {
        return 'San Pedro y San Pablo';
    }
    // Si cae en domingo, se mueve al lunes
    if (month === 6 && dayNum === 30 && dayOfWeek === 1) {
        return 'San Pedro y San Pablo';
    }
    
    // 12 de octubre: Encuentro de Dos Mundos
    if (month === 10 && dayNum === 12) {
        return 'Encuentro de Dos Mundos';
    }
    if (month === 10 && dayNum === 13 && dayOfWeek === 1) {
        return 'Encuentro de Dos Mundos';
    }
    
    // 31 de octubre: Día de las Iglesias Evangélicas y Protestantes
    if (month === 10 && dayNum === 31) {
        return 'Día de las Iglesias Evangélicas y Protestantes';
    }
    if (month === 11 && dayNum === 1 && dayOfWeek === 1) {
        return 'Día de las Iglesias Evangélicas y Protestantes';
    }
    
    // Feriados religiosos variables
    const easter = calculateEaster(year);
    const goodFriday = new Date(easter);
    goodFriday.setDate(easter.getDate() - 2);
    const holySaturday = new Date(easter);
    holySaturday.setDate(easter.getDate() - 1);
    
    if (date.toDateString() === goodFriday.toDateString()) {
        return 'Viernes Santo';
    }
    if (date.toDateString() === holySaturday.toDateString()) {
        return 'Sábado Santo';
    }
    
    return null;
}

// Función para verificar si una fecha es feriado en Chile
function isChileanHoliday(year, month, day) {
    return getHolidayName(year, month, day) !== null;
}

// Función para mostrar alerta de feriado
function showHolidayAlert(holidayName) {
    const whatsappUrl = 'https://wa.me/56949729777?text=Hola,%20tengo%20una%20emergencia%20veterinaria%20y%20necesito%20atención%20urgente.';
    const phoneNumber = '+56 9 4972 9777';
    
    const alertContainer = document.getElementById('calendar-alert');
    if (alertContainer) {
        alertContainer.innerHTML = `
            <div class="alert alert-warning d-flex align-items-center" role="alert">
                <i class="fas fa-exclamation-triangle me-3" style="font-size: 2rem;"></i>
                <div class="flex-grow-1">
                    <h5 class="alert-heading mb-2">¡Clínica Cerrada por Feriado!</h5>
                    <p class="mb-2"><strong>${holidayName}</strong></p>
                    <p class="mb-2">La clínica está cerrada en días feriados. Si hay una <strong>emergencia</strong>, el cliente debe contactarnos:</p>
                    <div class="d-flex gap-2 flex-wrap">
                        <a href="${whatsappUrl}" target="_blank" class="btn btn-success btn-sm">
                            <i class="fab fa-whatsapp"></i> WhatsApp: ${phoneNumber}
                        </a>
                        <a href="tel:${phoneNumber.replace(/\s/g, '')}" class="btn btn-primary btn-sm">
                            <i class="fas fa-phone"></i> Llamar: ${phoneNumber}
                        </a>
                    </div>
                </div>
            </div>
        `;
        alertContainer.classList.remove('d-none');
        alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        alert(`⚠️ Clínica Cerrada por Feriado\n\n${holidayName}\n\nLa clínica está cerrada en días feriados. Si hay una emergencia, el cliente debe contactarnos:\n\n📱 WhatsApp: ${phoneNumber}\n📞 Teléfono: ${phoneNumber}`);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    requireAuth();
    
    // Los veterinarios NO pueden acceder al calendario
    const userData = getUserData();
    if (!userData) {
        userData = await getCurrentUser();
    }
    
    if (userData && userData.role === 'VETERINARIO') {
        showAlert('calendar-alert', 
            'Los veterinarios no pueden gestionar el calendario. Serás redirigido al dashboard.', 
            'warning');
        setTimeout(() => {
            window.location.href = '/dashboard/';
        }, 2000);
        return;
    }
    
    // Verificar si se está reprogramando una cita (HU006)
    const urlParams = new URLSearchParams(window.location.search);
    rescheduleAppointmentId = urlParams.get('reschedule');
    
    if (rescheduleAppointmentId) {
        // Cargar información de la cita a reprogramar (mostrará mensaje más detallado)
        await loadAppointmentForReschedule(rescheduleAppointmentId);
    }
    
    // Cargar veterinarios
    await loadVeterinarians();
    
    // Inicializar calendario
    initializeCalendar();
    
    // Cargar datos del calendario
    await loadCalendarData();
    
    // Event listeners
    setupEventListeners();
    
    // Cargar mascotas del usuario
    await loadUserPets();
});

function initializeCalendar() {
    // Establecer mes actual
    const monthSelector = document.getElementById('month-selector');
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    monthSelector.value = `${year}-${month}`;
    
    updateMonthLabel();
}

function setupEventListeners() {
    // Navegación de mes
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });
    
    document.getElementById('month-selector').addEventListener('change', (e) => {
        const [year, month] = e.target.value.split('-');
        currentDate = new Date(year, month - 1, 1);
        updateCalendar();
    });
    
    // Filtro de veterinario - recargar datos cuando cambia
    document.getElementById('veterinarian-filter').addEventListener('change', () => {
        // Recargar datos del calendario para aplicar el filtro
        loadCalendarData();
    });
    
    // Formulario de cita
    const appointmentForm = document.getElementById('appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitAppointment();
        });
    }
    
    // Botón cancelar formulario
    document.getElementById('cancel-form-btn').addEventListener('click', () => {
        document.getElementById('appointment-form-section').classList.add('d-none');
        // Limpiar campos del formulario
        document.getElementById('appointment-form').reset();
        // Limpiar selecciones
        selectedSlot = null;
        // Deseleccionar slots visualmente
        document.querySelectorAll('.time-slot-btn, .time-slot-card').forEach(element => {
            element.classList.remove('selected');
        });
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });
    });
}

async function loadVeterinarians() {
    try {
        console.log('Iniciando carga de veterinarios...');
        const response = await authenticatedFetch('/api/auth/list/');
        
        if (response.ok) {
            const data = await response.json();
            console.log('Respuesta del API recibida:', data);
            
            // Manejar paginación si existe
            let allUsers = [];
            if (Array.isArray(data)) {
                // Si es un array directo
                allUsers = data;
            } else if (data.results && Array.isArray(data.results)) {
                // Si tiene paginación
                allUsers = data.results;
                console.log('Datos paginados. Total en esta página:', allUsers.length);
                console.log('¿Hay más páginas?', !!data.next);
                
                // Cargar páginas siguientes si existen
                if (data.next) {
                    await loadVeterinariansNextPage(data.next, allUsers);
                }
            } else {
                console.error('Formato de datos inesperado:', data);
                return;
            }
            
            // Filtrar solo veterinarios activos
            veterinarians = allUsers.filter(user => {
                const isVet = user.role === 'VETERINARIO';
                const isActive = user.is_active !== false;
                return isVet && isActive;
            });
            
            console.log('Total de usuarios recibidos:', allUsers.length);
            console.log('Veterinarios filtrados:', veterinarians.length);
            veterinarians.forEach(vet => {
                console.log(`  ✓ ${vet.first_name} ${vet.last_name} (ID: ${vet.id}, is_active: ${vet.is_active})`);
            });
            
            // Llenar select de veterinarios
            const select = document.getElementById('veterinarian-filter');
            if (!select) {
                console.error('❌ Select de veterinarios no encontrado');
                return;
            }
            
            console.log('Limpiando select...');
            // Limpiar opciones existentes (excepto "Todos los veterinarios")
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            console.log('Agregando veterinarios al select...');
            // Agregar cada veterinario
            veterinarians.forEach(vet => {
                const option = document.createElement('option');
                option.value = vet.id;
                option.textContent = `${vet.first_name} ${vet.last_name}`;
                select.appendChild(option);
                console.log(`  ✓ Agregado: ${vet.first_name} ${vet.last_name} (ID: ${vet.id})`);
            });
            
            console.log(`✅ Total de veterinarios en el select: ${select.children.length - 1}`); // -1 por "Todos los veterinarios"
            
            // Verificar visualmente
            const options = Array.from(select.options).map(opt => opt.textContent);
            console.log('Opciones en el select:', options);
        } else {
            const errorText = await response.text();
            console.error('❌ Error al cargar veterinarios:', response.status, response.statusText);
            console.error('Respuesta del servidor:', errorText);
        }
    } catch (error) {
        console.error('❌ Error loading veterinarians:', error);
        console.error('Stack trace:', error.stack);
    }
}

async function loadVeterinariansNextPage(nextUrl, existingUsers = []) {
    try {
        console.log('Cargando página siguiente:', nextUrl);
        const response = await authenticatedFetch(nextUrl);
        
        if (response.ok) {
            const data = await response.json();
            const users = data.results || data;
            
            console.log('Usuarios de la página siguiente:', users.length);
            
            // Agregar a la lista existente
            existingUsers.push(...users);
            
            // Filtrar solo veterinarios activos de esta página
            const moreVets = users.filter(user => user.role === 'VETERINARIO' && user.is_active !== false);
            
            console.log('Veterinarios adicionales encontrados:', moreVets.length);
            
            // Agregar a la lista global
            veterinarians.push(...moreVets);
            
            // Agregar al select
            const select = document.getElementById('veterinarian-filter');
            if (select) {
                moreVets.forEach(vet => {
                    const option = document.createElement('option');
                    option.value = vet.id;
                    option.textContent = `${vet.first_name} ${vet.last_name}`;
                    select.appendChild(option);
                    console.log(`  ✓ Agregado desde página siguiente: ${vet.first_name} ${vet.last_name}`);
                });
            }
            
            // Si hay más páginas, continuar cargando
            if (data.next) {
                await loadVeterinariansNextPage(data.next, existingUsers);
            } else {
                console.log('✅ Todas las páginas cargadas. Total de veterinarios:', veterinarians.length);
            }
        }
    } catch (error) {
        console.error('❌ Error loading next page of veterinarians:', error);
    }
}

async function loadCalendarData() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const vetFilter = document.getElementById('veterinarian-filter').value;
    
    try {
        // SIEMPRE cargar todos los veterinarios, ignorar el filtro para mostrar todos los slots disponibles
        let url = `/api/appointments/calendar/monthly/?year=${year}&month=${month}`;
        // No aplicar filtro aquí para que siempre muestre todos los veterinarios
        
        console.log('Cargando datos del calendario para:', year, month);
        
        const response = await authenticatedFetch(url);
        
        if (response.ok) {
            const data = await response.json();
            calendarData = data.calendar || [];
            
            console.log('Datos del calendario cargados:', calendarData.length, 'días');
            // Agrupar por veterinario para ver cuántos hay
            const vetsInData = {};
            calendarData.forEach(day => {
                if (day.veterinarian_id && day.veterinarian_name) {
                    if (!vetsInData[day.veterinarian_id]) {
                        vetsInData[day.veterinarian_id] = day.veterinarian_name;
                    }
                }
            });
            console.log('Veterinarios en los datos:', Object.keys(vetsInData).length);
            Object.entries(vetsInData).forEach(([id, name]) => {
                console.log(`  - ${name} (ID: ${id})`);
            });
            
            renderCalendar();
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error al cargar calendario:', errorData);
            showAlert('calendar-alert', 'Error al cargar el calendario', 'danger');
        }
    } catch (error) {
        console.error('Error loading calendar data:', error);
        showAlert('calendar-alert', 'Error al cargar el calendario', 'danger');
    }
}

function updateCalendar() {
    // Actualizar selector de mes
    const monthSelector = document.getElementById('month-selector');
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    monthSelector.value = `${year}-${month}`;
    
    updateMonthLabel();
    loadCalendarData();
}

function updateMonthLabel() {
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const label = document.getElementById('current-month-label');
    label.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajustar primer día (lunes = 0)
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;
    
    // Días del mes anterior
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevLastDay - i;
        const cell = createDayCell(day, true, year, month - 1);
        grid.appendChild(cell);
    }
    
    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const cell = createDayCell(day, false, year, month);
        grid.appendChild(cell);
    }
    
    // Días del siguiente mes
    const totalCells = grid.children.length;
    const remainingCells = 35 - totalCells; // 5 semanas * 7 días
    
    for (let day = 1; day <= remainingCells; day++) {
        const cell = createDayCell(day, true, year, month + 1);
        grid.appendChild(cell);
    }
}

function createDayCell(day, otherMonth, year, month) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    
    if (otherMonth) {
        cell.classList.add('other-month');
    }
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Almacenar la fecha en un atributo data para facilitar su identificación
    cell.dataset.date = dateStr;
    
    // Verificar si es feriado
    const isHoliday = !otherMonth && isChileanHoliday(year, month + 1, day);
    const holidayName = isHoliday ? getHolidayName(year, month + 1, day) : null;
    
    if (isHoliday) {
        cell.classList.add('holiday');
        cell.style.backgroundColor = '#dc3545';
        cell.style.color = 'white';
    }
    
    // Header del día
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    cell.appendChild(header);
    
    // Si es feriado, mostrar badge
    if (isHoliday) {
        const holidayBadge = document.createElement('div');
        holidayBadge.className = 'slot-badge badge bg-danger';
        holidayBadge.textContent = 'Feriado';
        cell.appendChild(holidayBadge);
        cell.dataset.isHoliday = 'true';
        cell.dataset.holidayName = holidayName || '';
        cell.style.cursor = 'not-allowed';
        cell.addEventListener('click', () => {
            showHolidayAlert(holidayName || 'Feriado');
        });
        return cell;
    }
    
    // Buscar disponibilidad para esta fecha
    const dayData = calendarData.filter(data => data.date === dateStr);
    
    if (dayData.length > 0 && !otherMonth) {
        const totalAvailable = dayData.reduce((sum, data) => sum + data.available_slots.length, 0);
        const totalOccupied = dayData.reduce((sum, data) => sum + data.occupied_slots.length, 0);
        
        if (totalAvailable > 0) {
            cell.classList.add('has-slots');
            const badge = document.createElement('div');
            badge.className = 'slot-badge badge bg-success';
            badge.textContent = `${totalAvailable} disponibles`;
            cell.appendChild(badge);
        }
        
        if (totalOccupied > 0) {
            const badge = document.createElement('div');
            badge.className = 'slot-badge badge bg-secondary';
            badge.textContent = `${totalOccupied} ocupados`;
            cell.appendChild(badge);
        }
        
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
            selectDate(dateStr, dayData);
        });
    }
    
    return cell;
}

function selectDate(dateStr, dayData) {
    // Asegurar que la fecha esté en formato YYYY-MM-DD
    selectedDate = dateStr;
    
    // Resaltar día seleccionado
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
        if (day.dataset.date === dateStr) {
            day.classList.add('selected');
        }
    });
    
    // Mostrar horarios disponibles
    displayAvailableSlots(dateStr, dayData);
}

function displayAvailableSlots(dateStr, dayData) {
    const slotsSection = document.getElementById('slots-section');
    const slotsContainer = document.getElementById('available-slots-container');
    const dateLabel = document.getElementById('selected-date-label');
    
    dateLabel.textContent = formatDate(dateStr);
    slotsSection.classList.remove('d-none');
    
    // Agrupar por veterinario
    const slotsByVet = {};
    
    dayData.forEach(data => {
        if (!slotsByVet[data.veterinarian_id]) {
            slotsByVet[data.veterinarian_id] = {
                name: data.veterinarian_name,
                slots: []
            };
        }
        slotsByVet[data.veterinarian_id].slots.push(...data.available_slots);
    });
    
    slotsContainer.innerHTML = '';
    
    if (Object.keys(slotsByVet).length === 0) {
        slotsContainer.innerHTML = '<p class="text-muted">No hay horarios disponibles para esta fecha</p>';
        return;
    }
    
    // Renderizar slots por veterinario
    Object.entries(slotsByVet).forEach(([vetId, vetData]) => {
        if (vetData.slots.length === 0) return;
        
        const vetSection = document.createElement('div');
        vetSection.className = 'vet-section';
        vetSection.innerHTML = `
            <div class="vet-name">
                <i class="fas fa-user-md text-primary me-2"></i> ${vetData.name}
            </div>
            <p class="text-muted small mb-3">Seleccione una de las siguientes horas disponibles:</p>
            <div class="time-slots-list">
                ${vetData.slots.map(slot => `
                    <button type="button" class="time-slot-btn" 
                            data-slot-id="${slot.id}" 
                            data-vet-id="${vetId}" 
                            data-vet-name="${vetData.name}"
                            data-start="${slot.start_time}" 
                            data-end="${slot.end_time}">
                        ${formatTime(slot.start_time)}
                    </button>
                `).join('')}
            </div>
        `;
        
        slotsContainer.appendChild(vetSection);
    });
    
    // Event listeners para seleccionar slot
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectTimeSlot(btn);
        });
    });
}

function selectTimeSlot(btn) {
    // Resaltar slot seleccionado (tanto botones como tarjetas por compatibilidad)
    document.querySelectorAll('.time-slot-btn, .time-slot-card').forEach(element => {
        element.classList.remove('selected');
    });
    btn.classList.add('selected');
    
    // Guardar información del slot
    selectedSlot = {
        id: btn.dataset.slotId,
        vetId: btn.dataset.vetId,
        vetName: btn.dataset.vetName,
        startTime: btn.dataset.start,
        endTime: btn.dataset.end
    };
    
    // Asegurarse de que selectedDate esté definido
    if (!selectedDate) {
        console.error('Error: selectedDate no está definido al seleccionar un horario');
        showAlert('calendar-alert', 'Error: Por favor seleccione una fecha primero', 'danger');
        return;
    }
    
    // Mostrar formulario de cita
    showAppointmentForm();
}

function showAppointmentForm() {
    const formSection = document.getElementById('appointment-form-section');
    formSection.classList.remove('d-none');
    
    // Validar que tenemos los datos necesarios
    if (!selectedDate) {
        console.error('selectedDate no está definido');
        return;
    }
    
    if (!selectedSlot) {
        console.error('selectedSlot no está definido');
        return;
    }
    
    // Actualizar el título del formulario si estamos reprogramando
    const formHeader = formSection.querySelector('.card-header h5');
    if (formHeader) {
        if (rescheduleAppointmentId) {
            formHeader.innerHTML = '<i class="fas fa-calendar-alt"></i> Reprogramar Cita';
        } else {
            formHeader.innerHTML = '<i class="fas fa-calendar-plus"></i> Confirmar Cita';
        }
    }
    
    // Llenar campos del formulario
    const dateField = document.getElementById('form-date');
    const timeField = document.getElementById('form-time');
    const vetField = document.getElementById('form-vet');
    const petSelect = document.getElementById('form-pet');
    const reasonField = document.getElementById('form-reason');
    
    if (dateField) {
        dateField.value = formatDate(selectedDate);
    }
    
    if (timeField && selectedSlot.startTime) {
        timeField.value = formatTime(selectedSlot.startTime);
    }
    
    if (vetField && selectedSlot.vetName) {
        vetField.value = selectedSlot.vetName;
    }
    
    // Si estamos reprogramando, pre-llenar mascota y motivo de la cita original
    if (rescheduleAppointmentId && currentAppointmentData) {
        if (petSelect) {
            // El campo pet puede ser un ID (número) o un objeto con id
            let petId = null;
            if (typeof currentAppointmentData.pet === 'number') {
                petId = currentAppointmentData.pet;
            } else if (currentAppointmentData.pet && currentAppointmentData.pet.id) {
                petId = currentAppointmentData.pet.id;
            } else if (currentAppointmentData.pet_details && currentAppointmentData.pet_details.id) {
                petId = currentAppointmentData.pet_details.id;
            }
            
            if (petId) {
                petSelect.value = petId;
                console.log('Mascota pre-seleccionada para reprogramación:', petId);
            }
        }
        
        if (reasonField && currentAppointmentData.reason) {
            reasonField.value = currentAppointmentData.reason;
        }
    }
    
    // Scroll al formulario
    formSection.scrollIntoView({ behavior: 'smooth' });
}

// Variable global para almacenar datos de la cita a reprogramar
let currentAppointmentData = null;

async function loadAppointmentForReschedule(appointmentId) {
    try {
        showAlert('calendar-alert', 'Cargando información de la cita a reprogramar...', 'info');
        
        const response = await authenticatedFetch(`/api/appointments/${appointmentId}/`);
        
        if (response.ok) {
            currentAppointmentData = await response.json();
            console.log('Cita a reprogramar cargada:', currentAppointmentData);
            
            // Mostrar información de la cita actual
            if (currentAppointmentData.pet_name && currentAppointmentData.appointment_date && currentAppointmentData.appointment_time) {
                const currentDate = formatDate(currentAppointmentData.appointment_date);
                const currentTime = formatTime(currentAppointmentData.appointment_time);
                const vetName = currentAppointmentData.veterinarian_name || 'Por asignar';
                
                showAlert('calendar-alert', 
                    `📋 Reprogramando cita para ${currentAppointmentData.pet_name} (${currentAppointmentData.client_name}). Fecha actual: ${currentDate} ${currentTime} con Dr. ${vetName}. Seleccione nueva fecha y horario.`, 
                    'info');
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Error al cargar la cita para reprogramar:', errorData);
            const errorMsg = errorData.error || errorData.detail || 'Error al cargar la información de la cita a reprogramar';
            showAlert('calendar-alert', errorMsg, 'danger');
        }
    } catch (error) {
        console.error('Error loading appointment for reschedule:', error);
        showAlert('calendar-alert', 'Error al cargar la información de la cita. Por favor, intente nuevamente.', 'danger');
    }
}

async function loadUserPets() {
    try {
        const response = await authenticatedFetch('/api/pets/');
        
        if (response.ok) {
            const data = await response.json();
            const pets = data.results || data;
            
            const petSelect = document.getElementById('form-pet');
            if (!petSelect) return;
            
            petSelect.innerHTML = '';  // Limpiar el select sin opción por defecto
            
            // Verificar si es recepcionista para mostrar nombre del cliente
            const userData = getUserData();
            const isReceptionist = userData && userData.role === 'RECEPCIONISTA';
            
            // Guardar las mascotas en una variable global para poder acceder al owner después
            window.allPets = pets;
            
            pets.forEach(pet => {
                const option = document.createElement('option');
                option.value = pet.id;
                // Guardar el owner_id como atributo para uso posterior
                if (pet.owner) {
                    option.dataset.ownerId = pet.owner;
                }
                // Si es recepcionista, mostrar también el nombre del cliente
                if (isReceptionist && pet.owner_name) {
                    option.textContent = `${pet.name} (${pet.species}) - ${pet.owner_name}`;
                } else {
                    option.textContent = `${pet.name} (${pet.species})`;
                }
                petSelect.appendChild(option);
            });
            
            // Si estamos reprogramando, seleccionar la mascota de la cita original
            if (rescheduleAppointmentId && currentAppointmentData) {
                // El campo pet puede ser un ID (número) o un objeto con id
                let petId = null;
                if (typeof currentAppointmentData.pet === 'number') {
                    petId = currentAppointmentData.pet;
                } else if (currentAppointmentData.pet && currentAppointmentData.pet.id) {
                    petId = currentAppointmentData.pet.id;
                } else if (currentAppointmentData.pet_details && currentAppointmentData.pet_details.id) {
                    petId = currentAppointmentData.pet_details.id;
                }
                
                if (petId) {
                    petSelect.value = petId;
                    console.log('Mascota pre-seleccionada para reprogramación:', petId);
                }
            }
            
            if (pets.length === 0) {
                const alertMsg = isReceptionist 
                    ? 'No hay mascotas registradas en el sistema.' 
                    : 'No tienes mascotas registradas. Por favor, registra una mascota antes de agendar una cita.';
                showAlert('calendar-alert', alertMsg, 'warning');
            }
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

async function submitAppointment() {
    const petId = document.getElementById('form-pet').value;
    const reason = document.getElementById('form-reason').value;
    const notes = document.getElementById('form-notes').value;
    
    if (!petId) {
        showAlert('calendar-alert', 'Por favor, seleccione una mascota', 'warning');
        return;
    }
    
    if (!reason) {
        showAlert('calendar-alert', 'Por favor, ingrese el motivo de la consulta', 'warning');
        return;
    }
    
    const userData = getUserData();
    const isReceptionist = userData && userData.role === 'RECEPCIONISTA';
    
    // HU006: Si estamos reprogramando
    if (rescheduleAppointmentId) {
        await rescheduleAppointment(rescheduleAppointmentId);
        return;
    }
    
    // Obtener el cliente correcto
    let clientId;
    if (isReceptionist) {
        // Si es recepcionista, usar el owner de la mascota seleccionada
        const petSelect = document.getElementById('form-pet');
        const selectedOption = petSelect.options[petSelect.selectedIndex];
        const ownerId = selectedOption.dataset.ownerId;
        
        if (!ownerId) {
            // Si no hay owner_id en el dataset, buscar en la lista de mascotas
            const pet = window.allPets?.find(p => p.id === parseInt(petId));
            clientId = pet?.owner || pet?.owner_id;
        } else {
            clientId = parseInt(ownerId);
        }
        
        if (!clientId) {
            showAlert('calendar-alert', 'Error: No se pudo determinar el cliente de la mascota seleccionada', 'danger');
            return;
        }
    } else {
        // Si es cliente, usar su propio ID
        clientId = userData.id;
    }
    
    // HU002: Crear nueva cita
    const appointmentData = {
        pet: parseInt(petId),
        client: clientId,
        veterinarian: parseInt(selectedSlot.vetId),
        time_slot: parseInt(selectedSlot.id),
        appointment_date: selectedDate,
        appointment_time: selectedSlot.startTime,
        reason: reason,
        notes: notes
    };
    
    try {
        const response = await authenticatedFetch('/api/appointments/', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
        
        if (response.ok) {
            showAlert('calendar-alert', 'Cita agendada exitosamente', 'success');
            
            // Resetear formulario
            document.getElementById('appointment-form').reset();
            document.getElementById('appointment-form-section').classList.add('d-none');
            
            // Recargar calendario
            await loadCalendarData();
            
            // Scroll arriba
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            setTimeout(() => {
                window.location.href = '/dashboard/';
            }, 2000);
        } else {
            const errorData = await response.json();
            let errorMessage = 'Error al agendar la cita';
            
            if (errorData.time_slot) {
                errorMessage = errorData.time_slot[0];
            } else if (errorData.pet) {
                errorMessage = errorData.pet[0];
            }
            
            showAlert('calendar-alert', errorMessage, 'danger');
        }
    } catch (error) {
        console.error('Error creating appointment:', error);
        showAlert('calendar-alert', 'Error al agendar la cita', 'danger');
    }
}

// HU006: Reprogramar cita
async function rescheduleAppointment(appointmentId) {
    const reason = document.getElementById('form-notes').value || 'Reprogramación solicitada por el cliente';
    
    const rescheduleData = {
        new_date: selectedDate,
        new_time: selectedSlot.startTime,
        new_veterinarian: parseInt(selectedSlot.vetId),
        new_time_slot: parseInt(selectedSlot.id),
        reason: reason
    };
    
    try {
        const response = await authenticatedFetch(`/api/appointments/${appointmentId}/reschedule/`, {
            method: 'POST',
            body: JSON.stringify(rescheduleData)
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Mensaje principal con información del cliente y mascota
            let rescheduleMessage = data.message || 'Cita reprogramada exitosamente';
            if (data.client && data.pet) {
                rescheduleMessage = `Cita reprogramada para ${data.pet.name} (Cliente: ${data.client.name})`;
            }
            showAlert('calendar-alert', rescheduleMessage, 'success');
            
            // Resetear formulario y ocultar sección
            document.getElementById('appointment-form').reset();
            document.getElementById('appointment-form-section').classList.add('d-none');
            
            // Mostrar información detallada de la reprogramación
            if (data.old_data && data.pet) {
                setTimeout(() => {
                    showAlert('calendar-alert', 
                        `📅 ${data.pet.name}: Cambio de ${data.old_data.date} ${data.old_data.time} (Dr. ${data.old_data.veterinarian}) → ${selectedDate} ${formatTime(selectedSlot.startTime)}`, 
                        'info');
                }, 1500);
            }
            
            // Cerrar modal automáticamente y redirigir
            setTimeout(() => {
                window.location.href = '/dashboard/';
            }, 3000);
        } else {
            const errorData = await response.json();
            let errorMsg = 'Error al reprogramar la cita';
            if (errorData.error) {
                errorMsg = errorData.error;
            } else if (errorData.detail) {
                errorMsg = errorData.detail;
            } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
                // Mostrar el primer error encontrado
                const firstError = Object.values(errorData)[0];
                errorMsg = Array.isArray(firstError) ? firstError[0] : firstError;
            }
            showAlert('calendar-alert', errorMsg, 'danger');
        }
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        showAlert('calendar-alert', 'Error al reprogramar la cita', 'danger');
    }
}

