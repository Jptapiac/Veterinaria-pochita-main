// dashboard.js - Panel principal y gestión de secciones
let dashboardInitialHTML = null;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

async function initializeDashboard() {
    // Verificar autenticación
    if (!isAuthenticated()) {
        window.location.href = '/login/';
        return;
    }
    
    // Actualizar UI del usuario
    updateUserUI();
    
    // Configurar navegación
    setupSectionNavigation();
    
    // Configurar menú según rol
    const userData = getUserData();
    if (userData && userData.role) {
        setupMenuByRole(userData.role);
    }
    
    // Cargar contenido inicial
    loadDashboardContent();
    
    // Configurar logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

function updateUserUI() {
    const userData = getUserData();
    if (userData) {
        const userName = document.getElementById('user-name');
        const userRole = document.getElementById('user-role');
        
        if (userName) {
            userName.textContent = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || 'Usuario';
        }
        
        if (userRole) {
            const roleMap = {
                'CLIENTE': 'CLIENTE',
                'VETERINARIO': 'VETERINARIO',
                'RECEPCIONISTA': 'RECEPCIONISTA'
            };
            userRole.textContent = roleMap[userData.role] || userData.role || 'Usuario';
        }
    }
}

function setupSectionNavigation() {
    // Navegación por clic en enlaces del menú
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            navigateToSection(section, this);
        });
    });
}

function navigateToSection(section, element = null) {
    // Actualizar clase activa en el menú
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    if (element) {
        element.classList.add('active');
    }
    
    // Cargar la sección
    loadSection(section);
}

function loadSection(section) {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    // Actualizar título
    const userData = getUserData();
    const isVet = userData && userData.role === 'VETERINARIO';
    const isReceptionist = userData && userData.role === 'RECEPCIONISTA';
    
    const titles = {
        'dashboard': '<i class="fas fa-home"></i> Panel Principal',
        'pets': '<i class="fas fa-paw"></i> Mis Mascotas',
        'appointments': isVet ? '<i class="fas fa-calendar-alt"></i> Mi Agenda' : (isReceptionist ? '<i class="fas fa-clock"></i> Gestión de Citas' : '<i class="fas fa-clock"></i> Mis Citas'),
        'medical-records': '<i class="fas fa-file-medical"></i> Fichas Médicas',
        'profile': '<i class="fas fa-user"></i> Mi Perfil'
    };
    
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.innerHTML = titles[section] || '<i class="fas fa-home"></i> Panel Principal';
    }
    
    // Cargar contenido de la sección
    switch(section) {
        case 'dashboard':
            loadDashboardContent();
            break;
        case 'pets':
            loadPetsSection(contentArea);
            break;
        case 'medical-records':
            loadMedicalRecordsSection(contentArea);
            break;
        case 'appointments':
            loadAppointmentsSection(contentArea);
            break;
        case 'profile':
            loadProfileSection(contentArea);
            break;
        default:
            loadDashboardContent();
            break;
    }
}

function setupMenuByRole(role) {
    const menuPets = document.getElementById('menu-pets');
    const menuAppointments = document.getElementById('menu-appointments-alt');
    const menuMedicalRecords = document.getElementById('menu-medical-records');
    const menuAgenda = document.getElementById('menu-agenda');
    const menuCalendar = document.getElementById('menu-calendar');
    
    // Ocultar todos primero
    if (menuPets) {
        menuPets.style.display = 'none';
        menuPets.style.visibility = 'hidden';
        menuPets.classList.add('d-none');
    }
    if (menuAppointments) {
        menuAppointments.style.display = 'none';
        menuAppointments.style.visibility = 'hidden';
        menuAppointments.classList.add('d-none');
    }
    if (menuMedicalRecords) {
        menuMedicalRecords.style.display = 'none';
        menuMedicalRecords.style.visibility = 'hidden';
        menuMedicalRecords.classList.add('d-none');
    }
    if (menuAgenda) {
        menuAgenda.style.display = 'none';
        menuAgenda.style.visibility = 'hidden';
        menuAgenda.classList.add('d-none');
    }
    if (menuCalendar) {
        menuCalendar.style.display = 'none';
        menuCalendar.style.visibility = 'hidden';
        menuCalendar.classList.add('d-none');
    }
    
    if (role === 'CLIENTE') {
        // Clientes: Mascotas, Citas, Historial
        if (menuPets) {
            menuPets.style.display = 'block';
            menuPets.style.visibility = 'visible';
            menuPets.classList.remove('d-none');
        }
        if (menuAppointments) {
            menuAppointments.style.display = 'block';
            menuAppointments.style.visibility = 'visible';
            menuAppointments.classList.remove('d-none');
        }
        if (menuMedicalRecords) {
            menuMedicalRecords.style.display = 'block';
            menuMedicalRecords.style.visibility = 'visible';
            menuMedicalRecords.classList.remove('d-none');
        }
    } else if (role === 'VETERINARIO') {
        // Veterinarios: Fichas Médicas, Mi Agenda
        if (menuMedicalRecords) {
            menuMedicalRecords.style.display = 'block';
            menuMedicalRecords.style.visibility = 'visible';
            menuMedicalRecords.classList.remove('d-none');
        }
        if (menuAgenda) {
            menuAgenda.style.display = 'block';
            menuAgenda.style.visibility = 'visible';
            menuAgenda.classList.remove('d-none');
        }
    } else if (role === 'RECEPCIONISTA') {
        // Recepcionistas: Gestión de Citas (appointments), Calendario de Citas
        if (menuAppointments) {
            menuAppointments.style.display = 'block';
            menuAppointments.style.visibility = 'visible';
            menuAppointments.classList.remove('d-none');
            // Cambiar el texto del menú para recepcionistas
            const menuLink = menuAppointments.querySelector('a');
            if (menuLink) {
                menuLink.innerHTML = '<i class="fas fa-clock"></i> Gestión de Citas';
            }
        }
        if (menuCalendar) {
            menuCalendar.style.display = 'block';
            menuCalendar.style.visibility = 'visible';
            menuCalendar.classList.remove('d-none');
        }
    }
}

// ==================== CARGA DE SECCIONES ====================

async function loadDashboardContent() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;
    
    // Guardar HTML inicial si no está guardado
    if (!dashboardInitialHTML) {
        dashboardInitialHTML = contentArea.innerHTML;
    }
    
    // Restaurar contenido inicial
    contentArea.innerHTML = dashboardInitialHTML;
    
    // Cargar próximas citas
    loadUpcomingAppointments();
    
    // Cargar estadísticas si es necesario
    const userData = getUserData();
    if (userData && (userData.role === 'RECEPCIONISTA' || userData.role === 'VETERINARIO')) {
        const statsSection = document.getElementById('stats-section');
        if (statsSection) {
            statsSection.classList.remove('d-none');
        }
        loadStatistics();
    }
}

async function loadUpcomingAppointments() {
    const container = document.getElementById('upcoming-appointments');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center py-3"><div class="spinner-border spinner-border-sm"></div></div>';
    
    try {
        const response = await authenticatedFetch('/api/appointments/');
        
        if (response.ok) {
            const data = await response.json();
            const appointments = data.results || data;
            
            const userData = getUserData();
            const isVet = userData.role === 'VETERINARIO';
            
            // Filtrar citas según el rol
            let upcomingAppointments;
            if (isVet) {
                // Veterinarios ven solo sus citas confirmadas
                upcomingAppointments = appointments
                    .filter(apt => apt.veterinarian === userData.id && apt.status === 'CONFIRMADA')
                    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
                    .slice(0, 5);
            } else {
                // Clientes y recepcionistas ven todas las citas
                upcomingAppointments = appointments
                    .filter(apt => apt.status !== 'CANCELADA')
                    .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
                    .slice(0, 5);
            }
            
            if (upcomingAppointments.length === 0) {
                container.innerHTML = '<p class="text-muted text-center">No hay citas próximas</p>';
                return;
            }
            
            container.innerHTML = upcomingAppointments.map(apt => `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h6 class="mb-1">${apt.pet_name || 'Mascota'}</h6>
                            <p class="mb-1"><i class="fas fa-calendar"></i> ${formatDate(apt.appointment_date)}</p>
                            <p class="mb-1"><i class="fas fa-clock"></i> ${formatTime(apt.time_slot?.start_time || apt.start_time || '')}</p>
                            ${apt.veterinarian_name ? `<p class="mb-0 text-muted"><small><i class="fas fa-user-md"></i> ${apt.veterinarian_name}</small></p>` : ''}
                        </div>
                        ${getStatusBadge(apt.status)}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-danger">Error al cargar las citas</p>';
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        container.innerHTML = '<p class="text-danger">Error al cargar las citas</p>';
    }
}

async function loadStatistics() {
    try {
        // Cargar estadísticas de citas
        const appointmentsResponse = await authenticatedFetch('/api/appointments/');
        if (appointmentsResponse.ok) {
            const appointmentsData = await appointmentsResponse.json();
            const appointments = appointmentsData.results || appointmentsData;
            
            const today = new Date().toISOString().split('T')[0];
            const todayAppointments = appointments.filter(apt => 
                apt.appointment_date && apt.appointment_date.split('T')[0] === today
            );
            
            const statAppointments = document.getElementById('stat-appointments');
            if (statAppointments) {
                statAppointments.textContent = todayAppointments.length;
            }
            
            const pendingAppointments = appointments.filter(apt => apt.status === 'PENDIENTE');
            const statPending = document.getElementById('stat-pending');
            if (statPending) {
                statPending.textContent = pendingAppointments.length;
            }
        }
        
        // Cargar estadísticas de mascotas
        const petsResponse = await authenticatedFetch('/api/pets/');
        if (petsResponse.ok) {
            const petsData = await petsResponse.json();
            const pets = petsData.results || petsData;
            
            const statPets = document.getElementById('stat-pets');
            if (statPets) {
                statPets.textContent = pets.length;
            }
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

async function loadMedicalRecordsSection(container) {
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border"></div></div>';
    
    const userData = getUserData();
    const isVet = userData.role === 'VETERINARIO';
    
    try {
        let allRecords = [];
        
        if (isVet) {
            // Para veterinarios: usar endpoint directo de fichas médicas
            const recordsResponse = await authenticatedFetch('/api/pets/medical-records/');
            
            if (recordsResponse.ok) {
                const recordsData = await recordsResponse.json();
                allRecords = recordsData.results || recordsData;
                
                // Obtener información adicional de las mascotas
                if (allRecords.length > 0) {
                    const petsResponse = await authenticatedFetch('/api/pets/');
                    if (petsResponse.ok) {
                        const petsData = await petsResponse.json();
                        const pets = petsData.results || petsData;
                        const petsMap = {};
                        pets.forEach(pet => {
                            petsMap[pet.id] = pet;
                        });
                        
                        allRecords.forEach(record => {
                            const pet = petsMap[record.pet];
                            if (pet) {
                                record.pet_name = pet.name;
                                record.pet_id = pet.id;
                                record.owner_name = pet.owner_name || 'N/A';
                            }
                        });
                    }
                }
            } else {
                container.innerHTML = '<p class="text-danger">Error al cargar las fichas médicas</p>';
                return;
            }
        } else {
            // Para clientes y recepcionistas: cargar desde historial de mascotas
            const petsResponse = await authenticatedFetch('/api/pets/');
            
            if (petsResponse.ok) {
                const petsData = await petsResponse.json();
                const pets = petsData.results || petsData;
                
                // Para clientes, solo mostrar sus propias mascotas
                const userPets = userData.role === 'CLIENTE' 
                    ? pets.filter(pet => pet.owner === userData.id || pet.owner_id === userData.id)
                    : pets;
                
                if (userPets.length === 0) {
                    container.innerHTML = `
                        <div class="text-center py-5">
                            <i class="fas fa-file-medical fa-3x text-muted mb-3"></i>
                            <p class="text-muted">${userData.role === 'CLIENTE' ? 'No tienes mascotas registradas' : 'No hay mascotas registradas'}</p>
                            ${userData.role === 'CLIENTE' ? `
                                <button class="btn btn-primary mt-3" onclick="loadSection('pets')">
                                    <i class="fas fa-plus"></i> Registrar Mascota
                                </button>
                            ` : ''}
                        </div>
                    `;
                    return;
                }
                
                // Cargar fichas médicas de todas las mascotas
                for (const pet of userPets) {
                    try {
                        const recordsResponse = await authenticatedFetch(`/api/pets/${pet.id}/history/`);
                        if (recordsResponse.ok) {
                            const recordsData = await recordsResponse.json();
                            const records = recordsData.results || recordsData;
                            records.forEach(record => {
                                record.pet_name = pet.name;
                                record.pet_id = pet.id;
                                record.owner_name = pet.owner_name || 'N/A';
                            });
                            allRecords = allRecords.concat(records);
                        }
                    } catch (error) {
                        console.error(`Error loading records for pet ${pet.id}:`, error);
                    }
                }
            } else {
                container.innerHTML = '<p class="text-danger">Error al cargar las fichas médicas</p>';
                return;
            }
        }
        
        // Ordenar por fecha más reciente
        allRecords.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
        
        const sectionTitle = userData.role === 'CLIENTE' ? 'Historial Médico' : 'Fichas Médicas';
        
        container.innerHTML = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-file-medical"></i> ${sectionTitle}</h5>
                    ${isVet ? `
                        <button class="btn btn-primary btn-sm" onclick="showCreateMedicalRecordModalForVet()">
                            <i class="fas fa-plus"></i> Nueva Ficha Médica
                        </button>
                    ` : ''}
                </div>
                <div class="card-body">
                    ${allRecords.length === 0 ? `
                        <div class="text-center py-5">
                            <i class="fas fa-file-medical fa-3x text-muted mb-3"></i>
                            <p class="text-muted">No hay fichas médicas registradas</p>
                            ${userData.role === 'CLIENTE' ? `
                                <p class="text-muted small">El historial médico aparecerá aquí después de que tu mascota sea atendida por un veterinario.</p>
                            ` : isVet ? `
                                <p class="text-muted small mb-3">Aún no has creado ninguna ficha médica. Puedes crear una nueva ficha médica haciendo clic en el botón arriba.</p>
                                <button class="btn btn-primary" onclick="showCreateMedicalRecordModalForVet()">
                                    <i class="fas fa-plus-circle"></i> Crear Primera Ficha Médica
                                </button>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="list-group">
                            ${allRecords.map(record => `
                                <div class="list-group-item">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div class="flex-grow-1">
                                            <h6 class="mb-2">
                                                <i class="fas fa-paw text-primary"></i> ${record.pet_name || record.pet?.name || 'N/A'}
                                                ${userData.role !== 'CLIENTE' ? `<small class="text-muted ms-2">- ${record.owner_name || record.pet?.owner_name || 'N/A'}</small>` : ''}
                                            </h6>
                                            <p class="mb-1"><i class="fas fa-calendar"></i> <strong>Fecha:</strong> ${formatDate(record.visit_date)}</p>
                                            <p class="mb-1"><strong>Motivo:</strong> ${record.reason}</p>
                                            <p class="mb-1"><strong>Diagnóstico:</strong> ${record.diagnosis}</p>
                                            <p class="mb-1"><strong>Tratamiento:</strong> ${record.treatment}</p>
                                            ${record.veterinarian_name ? `<p class="mb-0 text-muted"><small><i class="fas fa-user-md"></i> ${record.veterinarian_name}</small></p>` : ''}
                                        </div>
                                        <button class="btn btn-sm btn-outline-primary" onclick="viewPetHistory(${record.pet || record.pet_id})">
                                            <i class="fas fa-eye"></i> Ver Completo
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading medical records:', error);
        container.innerHTML = '<p class="text-danger">Error al cargar las fichas médicas</p>';
    }
}

// ==================== FUNCIONES PARA FICHAS MÉDICAS ====================

async function showCreateMedicalRecordModalForVet() {
    // Cargar todas las mascotas para que el veterinario pueda seleccionar
    try {
        const petsResponse = await authenticatedFetch('/api/pets/');
        
        if (!petsResponse.ok) {
            showAlert('dashboard-alert', 'Error al cargar las mascotas', 'danger');
            return;
        }
        
        const petsData = await petsResponse.json();
        const pets = petsData.results || petsData;
        
        if (pets.length === 0) {
            showAlert('dashboard-alert', 'No hay mascotas registradas', 'warning');
            return;
        }
        
        // Crear modal con selector de mascota
        const modalHtml = `
            <div class="modal fade" id="createMedicalRecordModalForVet" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-file-medical"></i> Nueva Ficha Médica
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div id="medical-record-vet-alert" class="alert d-none" role="alert"></div>
                            
                            <form id="create-medical-record-vet-form">
                                <div class="mb-3">
                                    <label class="form-label">Mascota *</label>
                                    <select class="form-select" id="medical-pet-select" required>
                                        <option value="">Seleccione una mascota</option>
                                        ${pets.map(pet => `
                                            <option value="${pet.id}">
                                                ${pet.name} (${pet.species})${pet.owner_name ? ' - Dueño: ' + pet.owner_name : ''}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Motivo de Consulta *</label>
                                    <input type="text" class="form-control" id="medical-reason-vet" required 
                                           placeholder="Ej: Control de salud, Vacunación, etc.">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Diagnóstico *</label>
                                    <textarea class="form-control" id="medical-diagnosis-vet" rows="3" required 
                                              placeholder="Describa el diagnóstico"></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Tratamiento *</label>
                                    <textarea class="form-control" id="medical-treatment-vet" rows="3" required 
                                              placeholder="Describa el tratamiento aplicado"></textarea>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Prescripción</label>
                                    <textarea class="form-control" id="medical-prescription-vet" rows="2" 
                                              placeholder="Medicamentos o indicaciones (opcional)"></textarea>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Peso (kg)</label>
                                        <input type="number" step="0.1" class="form-control" id="medical-weight-vet" 
                                               placeholder="Ej: 10.5">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Temperatura (°C)</label>
                                        <input type="number" step="0.1" class="form-control" id="medical-temperature-vet" 
                                               placeholder="Ej: 38.5">
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Próxima Visita</label>
                                    <input type="date" class="form-control" id="medical-next-visit-vet">
                                </div>
                                
                                <div class="mb-3">
                                    <label class="form-label">Notas Adicionales</label>
                                    <textarea class="form-control" id="medical-notes-vet" rows="2" 
                                              placeholder="Observaciones adicionales (opcional)"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="save-medical-record-vet-btn">
                                <i class="fas fa-save"></i> Guardar Ficha Médica
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Eliminar modal anterior si existe
        const existingModal = document.getElementById('createMedicalRecordModalForVet');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Agregar modal al body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('createMedicalRecordModalForVet'));
        modal.show();
        
        // Evento para guardar
        document.getElementById('save-medical-record-vet-btn').addEventListener('click', async () => {
            const userData = getUserData();
            const recordData = {
                pet: parseInt(document.getElementById('medical-pet-select').value),
                veterinarian: userData.id,
                reason: document.getElementById('medical-reason-vet').value,
                diagnosis: document.getElementById('medical-diagnosis-vet').value,
                treatment: document.getElementById('medical-treatment-vet').value,
                prescription: document.getElementById('medical-prescription-vet').value || null,
                weight_at_visit: document.getElementById('medical-weight-vet').value || null,
                temperature: document.getElementById('medical-temperature-vet').value || null,
                next_visit: document.getElementById('medical-next-visit-vet').value || null,
                notes: document.getElementById('medical-notes-vet').value || null
            };
            
            // Validaciones
            if (!recordData.pet || !recordData.reason || !recordData.diagnosis || !recordData.treatment) {
                const alertDiv = document.getElementById('medical-record-vet-alert');
                alertDiv.className = 'alert alert-danger';
                alertDiv.textContent = 'Por favor, complete los campos obligatorios (Mascota, Motivo, Diagnóstico y Tratamiento).';
                alertDiv.classList.remove('d-none');
                return;
            }
            
            try {
                const response = await authenticatedFetch('/api/pets/medical-records/', {
                    method: 'POST',
                    body: JSON.stringify(recordData)
                });
                
                if (response.ok) {
                    modal.hide();
                    showAlert('dashboard-alert', 'Ficha médica creada exitosamente', 'success');
                    
                    // Recargar la sección de fichas médicas
                    loadMedicalRecordsSection(document.getElementById('content-area'));
                } else {
                    const errorData = await response.json();
                    const alertDiv = document.getElementById('medical-record-vet-alert');
                    alertDiv.className = 'alert alert-danger';
                    alertDiv.textContent = errorData.detail || errorData.error || 'Error al crear la ficha médica';
                    alertDiv.classList.remove('d-none');
                }
            } catch (error) {
                console.error('Error creating medical record:', error);
                const alertDiv = document.getElementById('medical-record-vet-alert');
                alertDiv.className = 'alert alert-danger';
                alertDiv.textContent = 'Error al crear la ficha médica. Por favor, intente nuevamente.';
                alertDiv.classList.remove('d-none');
            }
        });
    } catch (error) {
        console.error('Error loading pets:', error);
        showAlert('dashboard-alert', 'Error al cargar las mascotas', 'danger');
    }
}

async function viewPetHistory(petId) {
    const userData = getUserData();
    const contentArea = document.getElementById('content-area');
    
    contentArea.innerHTML = '<div class="text-center py-5"><div class="spinner-border"></div></div>';
    
    try {
        const response = await authenticatedFetch(`/api/pets/${petId}/history/`);
        
        if (response.ok) {
            const data = await response.json();
            const records = data.results || data;
            
            // Obtener información de la mascota
            const petResponse = await authenticatedFetch(`/api/pets/${petId}/`);
            const petData = await petResponse.json();
            
            contentArea.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4><i class="fas fa-file-medical"></i> Historial Médico - ${petData.name}</h4>
                    <button class="btn btn-outline-secondary" onclick="loadSection('medical-records')">
                        <i class="fas fa-arrow-left"></i> Volver
                    </button>
                </div>
                
                ${records.length === 0 ? 
                    `<div class="text-center py-5">
                        <i class="fas fa-file-medical fa-3x text-muted mb-3"></i>
                        <h5 class="text-muted mb-2">No hay registros médicos registrados</h5>
                        <p class="text-muted mb-4">Esta mascota aún no tiene fichas médicas.</p>
                        ${userData.role === 'VETERINARIO' ? `
                            <button class="btn btn-primary btn-lg" onclick="showCreateMedicalRecordModal(${petId}, '${petData.name}')">
                                <i class="fas fa-plus-circle"></i> Crear Primera Ficha Médica
                            </button>
                        ` : ''}
                    </div>` :
                    `<div class="mb-3 text-end">
                        ${userData.role === 'VETERINARIO' ? `
                            <button class="btn btn-primary" onclick="showCreateMedicalRecordModal(${petId}, '${petData.name}')">
                                <i class="fas fa-plus"></i> Agregar Ficha Médica
                            </button>
                        ` : ''}
                    </div>
                    <div class="list-group">
                        ${records.map(record => `
                            <div class="list-group-item">
                                <div class="row">
                                    <div class="col-md-8">
                                        <h6><i class="fas fa-calendar"></i> ${formatDate(record.visit_date)}</h6>
                                        <p class="mb-1"><strong>Motivo:</strong> ${record.reason}</p>
                                        <p class="mb-1"><strong>Diagnóstico:</strong> ${record.diagnosis}</p>
                                        <p class="mb-1"><strong>Tratamiento:</strong> ${record.treatment}</p>
                                        ${record.prescription ? `<p class="mb-1"><strong>Prescripción:</strong> ${record.prescription}</p>` : ''}
                                        ${record.weight_at_visit ? `<p class="mb-1"><strong>Peso:</strong> ${record.weight_at_visit} kg</p>` : ''}
                                        ${record.temperature ? `<p class="mb-1"><strong>Temperatura:</strong> ${record.temperature} °C</p>` : ''}
                                        ${record.veterinarian_name ? `<p class="mb-1"><strong>Veterinario:</strong> ${record.veterinarian_name}</p>` : ''}
                                        ${record.notes ? `<p class="mb-1 text-muted"><small>${record.notes}</small></p>` : ''}
                                        ${record.next_visit ? `<p class="mb-0"><strong>Próxima visita:</strong> ${formatDateShort(record.next_visit)}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }
            `;
        } else {
            contentArea.innerHTML = '<p class="text-danger">Error al cargar el historial médico</p>';
        }
    } catch (error) {
        console.error('Error loading pet history:', error);
        contentArea.innerHTML = '<p class="text-danger">Error al cargar el historial médico</p>';
    }
}

function showCreateMedicalRecordModal(petId, petName) {
    const userData = getUserData();
    
    const modalHtml = `
        <div class="modal fade" id="createMedicalRecordModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-file-medical"></i> Nueva Ficha Médica - ${petName}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="medical-record-alert" class="alert d-none" role="alert"></div>
                        
                        <form id="create-medical-record-form">
                            <div class="mb-3">
                                <label class="form-label">Motivo de Consulta *</label>
                                <input type="text" class="form-control" id="medical-reason" required 
                                       placeholder="Ej: Control de salud, Vacunación, etc.">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Diagnóstico *</label>
                                <textarea class="form-control" id="medical-diagnosis" rows="3" required 
                                          placeholder="Describa el diagnóstico"></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Tratamiento *</label>
                                <textarea class="form-control" id="medical-treatment" rows="3" required 
                                          placeholder="Describa el tratamiento aplicado"></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Prescripción</label>
                                <textarea class="form-control" id="medical-prescription" rows="2" 
                                          placeholder="Medicamentos o indicaciones (opcional)"></textarea>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Peso (kg)</label>
                                    <input type="number" step="0.1" class="form-control" id="medical-weight" 
                                           placeholder="Ej: 10.5">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Temperatura (°C)</label>
                                    <input type="number" step="0.1" class="form-control" id="medical-temperature" 
                                           placeholder="Ej: 38.5">
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Próxima Visita</label>
                                <input type="date" class="form-control" id="medical-next-visit">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Notas Adicionales</label>
                                <textarea class="form-control" id="medical-notes" rows="2" 
                                          placeholder="Observaciones adicionales (opcional)"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="save-medical-record-btn">
                            <i class="fas fa-save"></i> Guardar Ficha Médica
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Eliminar modal anterior si existe
    const existingModal = document.getElementById('createMedicalRecordModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar modal al body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('createMedicalRecordModal'));
    modal.show();
    
    // Evento para guardar
    document.getElementById('save-medical-record-btn').addEventListener('click', async () => {
        const recordData = {
            pet: parseInt(petId),
            veterinarian: userData.id,
            reason: document.getElementById('medical-reason').value,
            diagnosis: document.getElementById('medical-diagnosis').value,
            treatment: document.getElementById('medical-treatment').value,
            prescription: document.getElementById('medical-prescription').value || null,
            weight_at_visit: document.getElementById('medical-weight').value || null,
            temperature: document.getElementById('medical-temperature').value || null,
            next_visit: document.getElementById('medical-next-visit').value || null,
            notes: document.getElementById('medical-notes').value || null
        };
        
        // Validaciones
        if (!recordData.reason || !recordData.diagnosis || !recordData.treatment) {
            const alertDiv = document.getElementById('medical-record-alert');
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'Por favor, complete los campos obligatorios (Motivo, Diagnóstico y Tratamiento).';
            alertDiv.classList.remove('d-none');
            return;
        }
        
        try {
            const response = await authenticatedFetch('/api/pets/medical-records/', {
                method: 'POST',
                body: JSON.stringify(recordData)
            });
            
            if (response.ok) {
                modal.hide();
                showAlert('dashboard-alert', 'Ficha médica creada exitosamente', 'success');
                
                // Recargar el historial
                viewPetHistory(petId);
            } else {
                const errorData = await response.json();
                const alertDiv = document.getElementById('medical-record-alert');
                alertDiv.className = 'alert alert-danger';
                alertDiv.textContent = errorData.detail || errorData.error || 'Error al crear la ficha médica';
                alertDiv.classList.remove('d-none');
            }
        } catch (error) {
            console.error('Error creating medical record:', error);
            const alertDiv = document.getElementById('medical-record-alert');
            alertDiv.className = 'alert alert-danger';
            alertDiv.textContent = 'Error al crear la ficha médica. Por favor, intente nuevamente.';
            alertDiv.classList.remove('d-none');
        }
    });
}

// ==================== OTRAS SECCIONES (PLACEHOLDER) ====================

async function loadPetsSection(container) {
    container.innerHTML = '<div class="alert alert-info">Sección de mascotas - Funcionalidad en desarrollo</div>';
}

async function loadAppointmentsSection(container) {
    container.innerHTML = '<div class="text-center py-5"><div class="spinner-border"></div></div>';
    
    const userData = getUserData();
    const isVet = userData && userData.role === 'VETERINARIO';
    const isReceptionist = userData && userData.role === 'RECEPCIONISTA';
    
    try {
        const response = await authenticatedFetch('/api/appointments/');
        
        if (!response.ok) {
            container.innerHTML = '<p class="text-danger">Error al cargar las citas</p>';
            return;
        }
        
        const data = await response.json();
        const appointments = data.results || data;
        
        // Filtrar y ordenar citas
        let filteredAppointments = appointments;
        
        if (isVet) {
            // Para veterinarios, solo sus citas (ya viene filtrado del backend, pero por seguridad)
            filteredAppointments = appointments.filter(apt => apt.veterinarian === userData.id);
        } else if (!isReceptionist) {
            // Para clientes, solo sus citas
            filteredAppointments = appointments.filter(apt => apt.client === userData.id);
        }
        
        // Ordenar por fecha (próximas primero), luego por hora
        filteredAppointments.sort((a, b) => {
            const dateA = new Date(a.appointment_date + 'T' + (a.appointment_time || '00:00:00'));
            const dateB = new Date(b.appointment_date + 'T' + (b.appointment_time || '00:00:00'));
            return dateA - dateB;
        });
        
        // Separar citas por estado: próximas (futuras), pasadas, canceladas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcoming = [];
        const past = [];
        const canceled = [];
        
        filteredAppointments.forEach(apt => {
            if (apt.status === 'CANCELADA') {
                canceled.push(apt);
            } else {
                const aptDate = new Date(apt.appointment_date);
                aptDate.setHours(0, 0, 0, 0);
                
                if (aptDate >= today) {
                    upcoming.push(apt);
                } else {
                    past.push(apt);
                }
            }
        });
        
        // Construir HTML
        let html = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="fas fa-calendar-alt"></i> ${isVet ? 'Mi Agenda' : (isReceptionist ? 'Gestión de Citas' : 'Mis Citas')}
                    </h5>
                </div>
                <div class="card-body">
        `;
        
        if (upcoming.length === 0 && past.length === 0 && canceled.length === 0) {
            html += `
                <div class="text-center py-5">
                    <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay citas registradas</p>
                    <p class="text-muted small">${isVet ? 'Tus citas asignadas aparecerán aquí' : 'Tus citas aparecerán aquí'}</p>
                </div>
            `;
        } else {
            // Próximas citas
            if (upcoming.length > 0) {
                html += `
                    <h6 class="mb-3 text-primary"><i class="fas fa-arrow-up"></i> Próximas Citas (${upcoming.length})</h6>
                    <div class="list-group mb-4">
                        ${upcoming.map(apt => `
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <h6 class="mb-0">
                                                <i class="fas fa-paw text-primary"></i> ${apt.pet_name || 'Mascota'}
                                            </h6>
                                            ${getStatusBadge(apt.status)}
                                        </div>
                                        <p class="mb-1">
                                            <i class="fas fa-user"></i> <strong>Cliente:</strong> ${apt.client_name || 'N/A'}
                                        </p>
                                        <p class="mb-1">
                                            <i class="fas fa-calendar"></i> <strong>Fecha:</strong> ${formatDate(apt.appointment_date)}
                                        </p>
                                        <p class="mb-1">
                                            <i class="fas fa-clock"></i> <strong>Hora:</strong> ${formatTime(apt.time_slot?.start_time || apt.appointment_time || '')}
                                        </p>
                                        ${apt.reason ? `<p class="mb-1"><strong>Motivo:</strong> ${apt.reason}</p>` : ''}
                                        ${apt.notes ? `<p class="mb-0 text-muted"><small><i class="fas fa-sticky-note"></i> ${apt.notes}</small></p>` : ''}
                                    </div>
                                    ${isVet && apt.status === 'CONFIRMADA' ? `
                                        <button class="btn btn-sm btn-success ms-3" onclick="markAppointmentAttended(${apt.id})" title="Marcar como atendida">
                                            <i class="fas fa-check"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            // Citas pasadas
            if (past.length > 0) {
                html += `
                    <h6 class="mb-3 text-secondary"><i class="fas fa-history"></i> Citas Pasadas (${past.length})</h6>
                    <div class="list-group mb-4">
                        ${past.map(apt => `
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <h6 class="mb-0">
                                                <i class="fas fa-paw text-secondary"></i> ${apt.pet_name || 'Mascota'}
                                            </h6>
                                            ${getStatusBadge(apt.status)}
                                        </div>
                                        <p class="mb-1">
                                            <i class="fas fa-user"></i> <strong>Cliente:</strong> ${apt.client_name || 'N/A'}
                                        </p>
                                        <p class="mb-1">
                                            <i class="fas fa-calendar"></i> <strong>Fecha:</strong> ${formatDate(apt.appointment_date)}
                                        </p>
                                        <p class="mb-1">
                                            <i class="fas fa-clock"></i> <strong>Hora:</strong> ${formatTime(apt.time_slot?.start_time || apt.appointment_time || '')}
                                        </p>
                                        ${apt.reason ? `<p class="mb-1"><strong>Motivo:</strong> ${apt.reason}</p>` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            // Citas canceladas (solo si hay)
            if (canceled.length > 0 && !isVet) {
                html += `
                    <h6 class="mb-3 text-danger"><i class="fas fa-times-circle"></i> Citas Canceladas (${canceled.length})</h6>
                    <div class="list-group">
                        ${canceled.map(apt => `
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div class="flex-grow-1">
                                        <div class="d-flex justify-content-between align-items-center mb-2">
                                            <h6 class="mb-0">
                                                <i class="fas fa-paw text-danger"></i> ${apt.pet_name || 'Mascota'}
                                            </h6>
                                            ${getStatusBadge(apt.status)}
                                        </div>
                                        <p class="mb-1">
                                            <i class="fas fa-calendar"></i> <strong>Fecha:</strong> ${formatDate(apt.appointment_date)}
                                        </p>
                                        <p class="mb-1">
                                            <i class="fas fa-clock"></i> <strong>Hora:</strong> ${formatTime(apt.time_slot?.start_time || apt.appointment_time || '')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
        
        html += `
                </div>
            </div>
        `;
        
        container.innerHTML = html;
        
        // Si es veterinario, configurar función para marcar como atendida
        if (isVet) {
            window.markAppointmentAttended = async function(appointmentId) {
                if (!confirm('¿Deseas marcar esta cita como atendida?')) {
                    return;
                }
                
                try {
                    const response = await authenticatedFetch(`/api/appointments/${appointmentId}/attend/`, {
                        method: 'POST'
                    });
                    
                    if (response.ok) {
                        showAlert('dashboard-alert', 'Cita marcada como atendida exitosamente', 'success');
                        // Recargar la sección
                        loadAppointmentsSection(container);
                    } else {
                        const errorData = await response.json();
                        showAlert('dashboard-alert', errorData.error || 'Error al marcar la cita como atendida', 'danger');
                    }
                } catch (error) {
                    console.error('Error marking appointment as attended:', error);
                    showAlert('dashboard-alert', 'Error al marcar la cita como atendida', 'danger');
                }
            };
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        container.innerHTML = '<p class="text-danger">Error al cargar las citas</p>';
    }
}

function loadProfileSection(container) {
    const userData = getUserData();
    container.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h4 class="mb-4"><i class="fas fa-user"></i> Mi Perfil</h4>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Nombre:</strong> ${userData.first_name} ${userData.last_name}</p>
                        <p><strong>Email:</strong> ${userData.email}</p>
                        <p><strong>Usuario:</strong> ${userData.username}</p>
                        <p><strong>Rol:</strong> ${userData.role}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Hacer funciones globales
window.loadSection = loadSection;
window.navigateToSection = navigateToSection;
window.viewPetHistory = viewPetHistory;
window.showCreateMedicalRecordModalForVet = showCreateMedicalRecordModalForVet;
window.showCreateMedicalRecordModal = showCreateMedicalRecordModal;
