// book_appointment.js - Wizard de agendamiento paso a paso
let currentStep = 1;
let selectedVeterinarian = null;
let selectedDate = null;
let selectedTimeSlot = null;
let selectedPet = null;
let selectedBranch = 'CHIGUAYANTE'; // Única sucursal disponible
let selectedService = null;
let veterinarians = [];
let availableSlots = [];
let currentSlotsData = [];

document.addEventListener('DOMContentLoaded', async function() {
    // NO requerir autenticación - cualquiera puede acceder
    
    // Verificar si está autenticado
    const isAuth = isAuthenticated();
    let userData = null;
    
    if (isAuth) {
        try {
            userData = getUserData();
            if (!userData) {
                userData = await getCurrentUser();
            }
            
            // Los veterinarios NO pueden agendar citas
            if (userData && userData.role === 'VETERINARIO') {
                showAlert('booking-alert', 
                    'Los veterinarios no pueden agendar citas. Serás redirigido al dashboard.', 
                    'warning');
                setTimeout(() => {
                    window.location.href = '/dashboard/';
                }, 2000);
                return;
            }
            
            // Si está autenticado, cargar mascotas
            await loadUserPets();
            
            // Ocultar mensaje de autenticación requerida y mostrar formulario de reserva
            const authMsg = document.getElementById('auth-required-message');
            const reservationSection = document.getElementById('reservation-section');
            if (authMsg) authMsg.classList.add('d-none');
            if (reservationSection) reservationSection.classList.remove('d-none');
        } catch (error) {
            console.error('Error verificando autenticación:', error);
        }
    } else {
        // Si NO está autenticado, mostrar mensaje de autenticación requerida en paso 3
        const authMsg = document.getElementById('auth-required-message');
        const reservationSection = document.getElementById('reservation-section');
        if (authMsg) {
            authMsg.classList.remove('d-none');
        }
        if (reservationSection) {
            reservationSection.classList.add('d-none');
        }
    }
    
    // NO cargar veterinarios automáticamente - solo después de buscar
    
    // Inicializar sucursal (solo Chiguayante disponible)
    const branchSelector = document.getElementById('branch-selector');
    if (branchSelector) {
        branchSelector.value = 'CHIGUAYANTE';
        selectedBranch = 'CHIGUAYANTE';
    }
    
    // Event listeners
    setupEventListeners();
    
    // Inicializar calendario
    setupCalendar();
    
    // Configurar límites de fecha de nacimiento para mascotas
    setupPetBirthDateLimits();
});

// Actualizar límites de fecha de nacimiento según la especie seleccionada
function updateBirthDateLimits(species) {
    const birthDateInput = document.getElementById('reg-pet-birth-date');
    if (!birthDateInput) return;
    
    const today = new Date();
    const maxDate = today.toISOString().split('T')[0]; // Fecha de hoy (máximo)
    
    // Calcular fecha mínima según la especie
    let maxAgeYears = 20; // Default
    let helpText = 'Los perros suelen vivir entre 10 a 20 años';
    
    if (species === 'PERRO') {
        maxAgeYears = 20;
        helpText = 'Los perros suelen vivir entre 10 a 20 años';
    } else if (species === 'GATO') {
        maxAgeYears = 20;
        helpText = 'Los gatos suelen vivir entre 13 a 20 años';
    }
    
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - maxAgeYears);
    const minDateStr = minDate.toISOString().split('T')[0];
    
    birthDateInput.setAttribute('max', maxDate);
    birthDateInput.setAttribute('min', minDateStr);
    
    // Actualizar texto de ayuda
    const helpElement = document.getElementById('birth-date-help') || birthDateInput.nextElementSibling;
    if (helpElement && (helpElement.classList.contains('text-muted') || helpElement.id === 'birth-date-help')) {
        helpElement.textContent = helpText;
    }
}

// Configurar límites de fecha de nacimiento para mascotas
function setupPetBirthDateLimits() {
    const registerModal = document.getElementById('registerWithPetModal');
    if (registerModal) {
        registerModal.addEventListener('shown.bs.modal', function() {
            // Configurar límites iniciales
            const speciesSelect = document.getElementById('reg-pet-species');
            if (speciesSelect && speciesSelect.value) {
                updateBirthDateLimits(speciesSelect.value);
            }
            
            // Actualizar cuando cambie la especie
            speciesSelect.addEventListener('change', function() {
                updateBirthDateLimits(this.value);
            });
        });
    }
    
    // También configurar inmediatamente si el elemento ya existe
    const speciesSelect = document.getElementById('reg-pet-species');
    if (speciesSelect) {
        speciesSelect.addEventListener('change', function() {
            updateBirthDateLimits(this.value);
        });
        
        // Configurar límites iniciales si ya hay una especie seleccionada
        if (speciesSelect.value) {
            updateBirthDateLimits(speciesSelect.value);
        }
    }
}

function setupEventListeners() {
    document.getElementById('btn-next').addEventListener('click', nextStep);
    document.getElementById('btn-prev').addEventListener('click', prevStep);
    document.getElementById('btn-confirm').addEventListener('click', confirmAppointment);
    
    const btnAddPet = document.getElementById('btn-add-pet');
    if (btnAddPet) {
        btnAddPet.addEventListener('click', () => {
            window.location.href = '/dashboard/?section=pets';
        });
    }
    
    // Búsqueda por servicio
    const btnBuscarServicio = document.getElementById('btn-buscar-servicio');
    if (btnBuscarServicio) {
        btnBuscarServicio.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSearchByService();
        });
    }
    
    // Cuando cambia el área médica, actualizar servicios disponibles
    document.querySelectorAll('input[name="medical-area"]').forEach(radio => {
        radio.addEventListener('change', updateServicesByArea);
    });
    
    
    // Prevenir submit del formulario de registro
    const registerWithPetForm = document.getElementById('register-with-pet-form');
    if (registerWithPetForm) {
        registerWithPetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    }
    
    // Botón de registro con mascota - múltiples estrategias para asegurar que funcione
    function attachRegisterButtonListener() {
        const registerWithPetSubmit = document.getElementById('register-with-pet-submit');
        if (registerWithPetSubmit) {
            // Remover listeners anteriores
            const newButton = registerWithPetSubmit.cloneNode(true);
            registerWithPetSubmit.parentNode.replaceChild(newButton, registerWithPetSubmit);
            
            // Agregar nuevo listener
            newButton.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('✅ Botón de registro clickeado - Ejecutando handleRegisterWithPet');
                try {
                    await window.handleRegisterWithPet();
                } catch (error) {
                    console.error('❌ Error en handleRegisterWithPet:', error);
                    showAlert('register-with-pet-alert', 'Error inesperado: ' + error.message, 'danger');
                }
                return false;
            });
            console.log('✅ Listener agregado al botón de registro');
        }
    }
    
    // Intentar agregar listener inmediatamente
    attachRegisterButtonListener();
    
    // También intentar cuando el modal se muestre
    const registerWithPetModal = document.getElementById('registerWithPetModal');
    if (registerWithPetModal) {
        registerWithPetModal.addEventListener('shown.bs.modal', function() {
            console.log('📋 Modal de registro abierto');
            attachRegisterButtonListener();
        });
    }
    
    // Delegación de eventos como respaldo
    document.addEventListener('click', async function(e) {
        const button = e.target.closest('#register-with-pet-submit');
        if (button) {
            e.preventDefault();
            e.stopPropagation();
            console.log('✅ Click capturado por delegación de eventos');
            try {
                await window.handleRegisterWithPet();
            } catch (error) {
                console.error('❌ Error:', error);
                showAlert('register-with-pet-alert', 'Error: ' + error.message, 'danger');
            }
        }
    });
    
    // Botón agregar mascota (paso 3)
    const btnAddPetStep3 = document.getElementById('btn-add-pet-step3');
    if (btnAddPetStep3) {
        btnAddPetStep3.addEventListener('click', () => {
            window.location.href = '/dashboard/?section=pets';
        });
    }
}

// Registrar usuario con mascota (disponible globalmente)
window.handleRegisterWithPet = async function handleRegisterWithPet() {
    console.log('=== handleRegisterWithPet INICIADA ===');
    
    // Mostrar mensaje de carga inmediatamente
    const alertEl = document.getElementById('register-with-pet-alert');
    if (alertEl) {
        alertEl.className = 'alert alert-info';
        alertEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando registro...';
        alertEl.classList.remove('d-none');
    }
    
    const usernameEl = document.getElementById('reg-username-with-pet');
    const emailEl = document.getElementById('reg-email-with-pet');
    const firstNameEl = document.getElementById('reg-first-name-with-pet');
    const lastNameEl = document.getElementById('reg-last-name-with-pet');
    const rutEl = document.getElementById('reg-rut-with-pet');
    const phoneEl = document.getElementById('reg-phone-with-pet');
    const passwordEl = document.getElementById('reg-password-with-pet');
    const passwordConfirmEl = document.getElementById('reg-password-confirm-with-pet');
    
    const petNameEl = document.getElementById('reg-pet-name');
    const petSpeciesEl = document.getElementById('reg-pet-species');
    const petBreedEl = document.getElementById('reg-pet-breed');
    const petGenderEl = document.getElementById('reg-pet-gender');
    const petBirthDateEl = document.getElementById('reg-pet-birth-date');
    const petColorEl = document.getElementById('reg-pet-color');
    const petWeightEl = document.getElementById('reg-pet-weight');
    
    if (!usernameEl || !emailEl || !firstNameEl || !lastNameEl || !passwordEl || !passwordConfirmEl) {
        console.error('Faltan elementos del formulario');
        showAlert('register-with-pet-alert', 'Error: No se encontraron los campos del formulario', 'danger');
        return;
    }
    
    // Verificar si el usuario ya está autenticado
    const isAuth = isAuthenticated();
    
    // Si está autenticado, solo necesitamos los datos de la mascota
    if (isAuth) {
        const petName = petNameEl ? petNameEl.value.trim() : '';
        const petSpecies = petSpeciesEl ? petSpeciesEl.value : '';
        const petBreed = petBreedEl ? petBreedEl.value.trim() : '';
        const petGender = petGenderEl ? petGenderEl.value : '';
        const petBirthDate = petBirthDateEl ? petBirthDateEl.value : '';
        const petColor = petColorEl ? petColorEl.value.trim() : '';
        const petWeight = petWeightEl ? petWeightEl.value : '';
        
        if (!petName || !petSpecies || !petGender) {
            showAlert('register-with-pet-alert', 'Por favor complete todos los datos obligatorios de la mascota', 'warning');
            return;
        }
        
        // Validar fecha de nacimiento según la especie
        if (petBirthDate && petSpecies) {
            const birthDate = new Date(petBirthDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (birthDate > today) {
                showAlert('register-with-pet-alert', 'La fecha de nacimiento no puede ser futura. Por favor, ingresa una fecha válida.', 'warning');
                return;
            }
            
            let maxAgeYears = 20;
            let speciesName = 'perros';
            let ageRange = '10 a 20 años';
            
            if (petSpecies === 'PERRO') {
                maxAgeYears = 20;
                speciesName = 'perros';
                ageRange = '10 a 20 años';
            } else if (petSpecies === 'GATO') {
                maxAgeYears = 20;
                speciesName = 'gatos';
                ageRange = '13 a 20 años';
            }
            
            const minDate = new Date();
            minDate.setFullYear(minDate.getFullYear() - maxAgeYears);
            minDate.setHours(0, 0, 0, 0);
            
            if (birthDate < minDate) {
                const minDateStr = minDate.toLocaleDateString('es-CL');
                showAlert('register-with-pet-alert', 
                    `La fecha de nacimiento no puede ser anterior a ${minDateStr}. Los ${speciesName} suelen vivir entre ${ageRange}. Por favor, verifica la fecha.`, 
                    'warning');
                return;
            }
        }
        
        // Registrar solo la mascota
        try {
            showAlert('register-with-pet-alert', 'Registrando mascota...', 'info');
            
            // Preparar datos de la mascota
            const petData = {
                name: petName,
                species: petSpecies,
                gender: petGender
            };
            
            // Agregar campos opcionales solo si tienen valor
            if (petBreed && petBreed.trim()) {
                petData.breed = petBreed.trim();
            }
            
            if (petBirthDate) {
                petData.birth_date = petBirthDate;
            }
            
            if (petColor && petColor.trim()) {
                petData.color = petColor.trim();
            }
            
            if (petWeight && petWeight.trim()) {
                const weightValue = parseFloat(petWeight);
                if (!isNaN(weightValue) && weightValue > 0) {
                    petData.weight = weightValue;
                }
            }
            
            console.log('Datos de la mascota a enviar:', petData);
            
            const petResponse = await authenticatedFetch('/api/pets/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(petData)
            });
            
            if (!petResponse.ok) {
                const errorData = await petResponse.json().catch(() => ({}));
                let errorMsg = 'Error al registrar mascota';
                
                // Mostrar detalles del error
                console.error('Error al registrar mascota:', errorData);
                
                if (errorData.detail) {
                    errorMsg = errorData.detail;
                } else if (errorData.owner) {
                    errorMsg = Array.isArray(errorData.owner) ? errorData.owner[0] : errorData.owner;
                } else if (errorData.name) {
                    errorMsg = Array.isArray(errorData.name) ? errorData.name[0] : errorData.name;
                } else if (errorData.species) {
                    errorMsg = Array.isArray(errorData.species) ? errorData.species[0] : errorData.species;
                } else if (errorData.gender) {
                    errorMsg = Array.isArray(errorData.gender) ? errorData.gender[0] : errorData.gender;
                } else if (errorData.non_field_errors) {
                    errorMsg = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors;
            } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
                // Si hay múltiples errores, mostrarlos todos
                const errorMessages = Object.entries(errorData)
                    .map(([key, value]) => {
                        const errorText = Array.isArray(value) ? value[0] : value;
                        return `${key}: ${errorText}`;
                    })
                    .join('<br>');
                errorMsg = errorMessages || 'Error al registrar mascota. Por favor verifica los datos.';
            }
            
            // Mostrar error completo en consola para debugging
            console.error('Error completo del servidor:', errorData);
            console.error('Mensaje de error formateado:', errorMsg);
            
            showAlert('register-with-pet-alert', errorMsg, 'danger');
            return;
            }
            
            showAlert('register-with-pet-alert', 'Mascota registrada exitosamente', 'success');
            
            // Cerrar modal
            const modalEl = document.getElementById('registerWithPetModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            
            // Cargar mascotas del usuario
            await loadUserPets();
            
            // Actualizar vista del paso 3
            if (currentStep === 3) {
                showAuthenticatedSectionStep3();
                
                // Si hay mascotas y tenemos todos los datos necesarios, confirmar automáticamente
                if (userPets.length > 0 && selectedVeterinarian && selectedDate && selectedTimeSlot) {
                    selectedPet = userPets[0];
                    await confirmAppointment();
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('register-with-pet-alert', 'Error al registrar la mascota', 'danger');
        }
        return;
    }
    
    // Si NO está autenticado, proceder con registro completo de usuario y mascota
    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const firstName = firstNameEl.value.trim();
    const lastName = lastNameEl.value.trim();
    const rut = rutEl ? rutEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const password = passwordEl.value;
    const passwordConfirm = passwordConfirmEl.value;
    
    const petName = petNameEl ? petNameEl.value.trim() : '';
    const petSpecies = petSpeciesEl ? petSpeciesEl.value : '';
    const petBreed = petBreedEl ? petBreedEl.value.trim() : '';
    const petGender = petGenderEl ? petGenderEl.value : '';
    const petBirthDate = petBirthDateEl ? petBirthDateEl.value : '';
    const petColor = petColorEl ? petColorEl.value.trim() : '';
    const petWeight = petWeightEl ? petWeightEl.value : '';
    
    if (!username || !email || !firstName || !lastName || !password || !passwordConfirm) {
        showAlert('register-with-pet-alert', 'Por favor complete todos los campos obligatorios', 'warning');
        return;
    }
    
    if (password !== passwordConfirm) {
        showAlert('register-with-pet-alert', 'Las contraseñas no coinciden', 'warning');
        return;
    }
    
    if (!petName || !petSpecies || !petGender) {
        showAlert('register-with-pet-alert', 'Por favor complete todos los datos obligatorios de la mascota', 'warning');
        return;
    }
    
    // Validar fecha de nacimiento según la especie
    if (petBirthDate && petSpecies) {
        const birthDate = new Date(petBirthDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Validar que no sea futura
        if (birthDate > today) {
            showAlert('register-with-pet-alert', 'La fecha de nacimiento no puede ser futura. Por favor, ingresa una fecha válida.', 'warning');
            return;
        }
        
        // Validar según la especie
        let maxAgeYears = 20;
        let speciesName = 'perros';
        let ageRange = '10 a 20 años';
        
        if (petSpecies === 'PERRO') {
            maxAgeYears = 20;
            speciesName = 'perros';
            ageRange = '10 a 20 años';
        } else if (petSpecies === 'GATO') {
            maxAgeYears = 20;
            speciesName = 'gatos';
            ageRange = '13 a 20 años';
        }
        
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - maxAgeYears);
        minDate.setHours(0, 0, 0, 0);
        
        if (birthDate < minDate) {
            const minDateStr = minDate.toLocaleDateString('es-CL');
            showAlert('register-with-pet-alert', 
                `La fecha de nacimiento no puede ser anterior a ${minDateStr}. Los ${speciesName} suelen vivir entre ${ageRange}. Por favor, verifica la fecha.`, 
                'warning');
            return;
        }
    }
    
    try {
        showAlert('register-with-pet-alert', 'Registrando usuario y mascota...', 'info');
        
        // Preparar datos del usuario
        const userData = {
            username, 
            email, 
            first_name: firstName, 
            last_name: lastName,
            password,
            password_confirm: passwordConfirm,
            role: 'CLIENTE'
        };
        
        // Agregar campos opcionales solo si tienen valor
        if (rut && rut.trim()) {
            userData.rut = rut.trim();
        }
        
        if (phone && phone.trim()) {
            userData.phone = phone.trim();
        }
        
        console.log('Datos del usuario a registrar:', { ...userData, password: '***', password_confirm: '***' });
        
        // Registrar usuario
        const userResponse = await fetch('/api/auth/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        if (!userResponse.ok) {
            const errorData = await userResponse.json().catch(() => ({}));
            let errorMsg = 'Error al registrar usuario';
            
            // Mostrar detalles del error en consola
            console.error('Error al registrar usuario:', errorData);
            
            // Buscar errores específicos por campo
            if (errorData.username) {
                errorMsg = Array.isArray(errorData.username) 
                    ? `Usuario: ${errorData.username[0]}` 
                    : `Usuario: ${errorData.username}`;
            } else if (errorData.email) {
                errorMsg = Array.isArray(errorData.email) 
                    ? `Email: ${errorData.email[0]}` 
                    : `Email: ${errorData.email}`;
            } else if (errorData.password) {
                errorMsg = Array.isArray(errorData.password) 
                    ? `Contraseña: ${errorData.password[0]}` 
                    : `Contraseña: ${errorData.password}`;
            } else if (errorData.rut) {
                errorMsg = Array.isArray(errorData.rut) 
                    ? `RUT: ${errorData.rut[0]}` 
                    : `RUT: ${errorData.rut}`;
            } else if (errorData.detail) {
                errorMsg = errorData.detail;
            } else if (errorData.non_field_errors) {
                errorMsg = Array.isArray(errorData.non_field_errors) 
                    ? errorData.non_field_errors[0] 
                    : errorData.non_field_errors;
            } else if (typeof errorData === 'object') {
                // Si hay múltiples errores, mostrarlos todos
                const errorMessages = Object.entries(errorData)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
                    .join(', ');
                errorMsg = errorMessages || 'Error al registrar usuario. Por favor verifica los datos.';
            }
            
            showAlert('register-with-pet-alert', errorMsg, 'danger');
            return;
        }
        
        // Iniciar sesión
        const loginResponse = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        if (!loginResponse.ok) {
            showAlert('register-with-pet-alert', 'Usuario creado pero error al iniciar sesión', 'warning');
            return;
        }
        
        const loginData = await loginResponse.json();
        saveTokens(loginData.access, loginData.refresh);
        
        // Registrar mascota
        const petResponse = await authenticatedFetch('/api/pets/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: petName, species: petSpecies, breed: petBreed || null,
                gender: petGender, birth_date: petBirthDate || null,
                color: petColor || null, weight: petWeight ? parseFloat(petWeight) : null
            })
        });
        
        if (!petResponse.ok) {
            const errorData = await petResponse.json().catch(() => ({}));
            console.error('Error al registrar mascota:', errorData);
            
            let errorMsg = 'Error al registrar mascota';
            if (errorData.detail) {
                errorMsg = errorData.detail;
            } else if (errorData.owner) {
                errorMsg = Array.isArray(errorData.owner) ? errorData.owner[0] : errorData.owner;
            } else if (errorData.name) {
                errorMsg = Array.isArray(errorData.name) ? errorData.name[0] : errorData.name;
            } else if (errorData.species) {
                errorMsg = Array.isArray(errorData.species) ? errorData.species[0] : errorData.species;
            } else if (errorData.gender) {
                errorMsg = Array.isArray(errorData.gender) ? errorData.gender[0] : errorData.gender;
            } else if (errorData.non_field_errors) {
                errorMsg = Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors[0] : errorData.non_field_errors;
            } else if (typeof errorData === 'object') {
                const errorMessages = Object.entries(errorData)
                    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
                    .join(', ');
                errorMsg = errorMessages || 'Error al registrar mascota. Por favor verifica los datos.';
            }
            
            showAlert('register-with-pet-alert', errorMsg, 'danger');
            return;
        }
        
        showAlert('register-with-pet-alert', 'Registro exitoso', 'success');
        
        // Cerrar modal
        const modalEl = document.getElementById('registerWithPetModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        
        // Actualizar paso 3 y confirmar automáticamente la cita
        if (currentStep === 3) {
            await getCurrentUser();
            
            // Cargar mascotas del usuario
            await loadUserPets();
            
            // Si hay mascotas y tenemos todos los datos necesarios, confirmar automáticamente
            if (userPets.length > 0 && selectedVeterinarian && selectedDate && selectedTimeSlot) {
                // Usar la primera mascota (la que acabamos de registrar)
                selectedPet = userPets[0];
                
                // Confirmar automáticamente la cita
                await confirmAppointment();
            } else {
                // Si falta algo, solo mostrar la sección autenticada
                // Si acabamos de agregar una mascota, actualizar la vista
                showAuthenticatedSectionStep3();
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('register-with-pet-alert', 'Error al registrar', 'danger');
    }
}

// Mostrar veterinarios después de buscar
async function loadVeterinarians() {
    try {
        const response = await fetch('/api/auth/veterinarians/');
        if (response.ok) {
            const data = await response.json();
            veterinarians = Array.isArray(data) ? data : [];
            renderVeterinarians();
        }
    } catch (error) {
        console.error('Error loading veterinarians:', error);
    }
}

// Cargar veterinarios por sucursal (para el paso 2)
async function loadVeterinariansByBranch(branch) {
    try {
        const response = await fetch('/api/auth/veterinarians/');
        if (response.ok) {
            const data = await response.json();
            // Por ahora, cargar todos los veterinarios
            // En el futuro se puede filtrar por sucursal cuando se agregue el campo
            veterinarians = Array.isArray(data) ? data : [];
            
            // Mostrar nombre de sucursal
            const branchNames = {
                'CHIGUAYANTE': 'Chiguayante',
                'CONCEPCION': 'Concepción',
                'TALCAHUANO': 'Talcahuano'
            };
            const branchNameElement = document.getElementById('selected-branch-name');
            if (branchNameElement) {
                branchNameElement.textContent = branchNames[branch] || branch;
            }
            
            // Renderizar veterinarios en el paso 2
            renderVeterinariansStep2();
        }
    } catch (error) {
        console.error('Error loading veterinarians by branch:', error);
        showAlert('booking-alert', 'Error al cargar veterinarios', 'danger');
    }
}

// Renderizar veterinarios en el paso 2
function renderVeterinariansStep2() {
    const container = document.getElementById('veterinarians-list-step2');
    if (!container) return;
    
    if (veterinarians.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay veterinarios disponibles en esta sucursal</p>';
        return;
    }
    
    container.innerHTML = veterinarians.map(vet => `
        <div class="vet-card" data-vet-id="${vet.id}" style="cursor: pointer;">
            <div class="d-flex align-items-center">
                <div class="flex-shrink-0">
                    <i class="fas fa-user-md fa-2x text-primary"></i>
                </div>
                <div class="flex-grow-1 ms-3">
                    <h5 class="mb-1">${vet.first_name} ${vet.last_name}</h5>
                    <p class="text-muted mb-0">${vet.email || ''}</p>
                </div>
                <div class="flex-shrink-0">
                    <i class="fas fa-check-circle text-success" style="display: none;"></i>
                </div>
            </div>
        </div>
    `).join('');
    
    // Event listeners para seleccionar veterinario
    document.querySelectorAll('.vet-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.vet-card').forEach(c => {
                c.classList.remove('selected');
                c.querySelector('.fa-check-circle').style.display = 'none';
            });
            card.classList.add('selected');
            card.querySelector('.fa-check-circle').style.display = 'block';
            
            const vetId = parseInt(card.dataset.vetId);
            selectedVeterinarian = veterinarians.find(v => v.id === vetId);
            
            // Mostrar sección de fecha y hora
            const selectionSection = document.getElementById('veterinarians-selection-section');
            const dateTimeSection = document.getElementById('date-time-selection-section');
            if (selectionSection) selectionSection.classList.add('d-none');
            if (dateTimeSection) {
                dateTimeSection.classList.remove('d-none');
                
                // Actualizar nombre del veterinario
                const vetNameElement = document.getElementById('selected-vet-name');
                if (vetNameElement) {
                    vetNameElement.textContent = `${selectedVeterinarian.first_name} ${selectedVeterinarian.last_name}`;
                }
                
                // Cargar calendario
                loadAvailableSlots();
            }
        });
    });
}

// Manejar búsqueda por servicio
async function handleSearchByService() {
    const serviceSelector = document.getElementById('service-selector');
    const branchEl = document.getElementById('branch-selector');
    
    if (!serviceSelector) {
        console.error('No se encontró el selector de servicio');
        return;
    }
    
    const service = serviceSelector.value;
    const branch = branchEl ? branchEl.value : 'CHIGUAYANTE';
    
    // La sucursal siempre será Chiguayante (única opción)
    const finalBranch = branch || 'CHIGUAYANTE';
    
    // Guardar selecciones
    selectedService = service;
    selectedBranch = finalBranch;
    
    // Ir al paso 2
    currentStep = 2;
    updateStepDisplay();
    
    // Cargar veterinarios de la sucursal seleccionada
    await loadVeterinariansByBranch(finalBranch);
    
    // Scroll al inicio del wizard para asegurar que se vea el paso 2
    setTimeout(() => {
        const wizardContainer = document.querySelector('.wizard-container');
        if (wizardContainer) {
            wizardContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

// Actualizar servicios según el área médica seleccionada
function updateServicesByArea() {
    const area = document.querySelector('input[name="medical-area"]:checked').value;
    const serviceSelector = document.getElementById('service-selector');
    
    // Limpiar servicios
    serviceSelector.innerHTML = '<option value="">Seleccione un Servicio</option>';
    
    // Agregar servicios según el área
    if (area === 'CONSULTA_VETERINARIA') {
        serviceSelector.innerHTML += `
            <option value="CONSULTA_VETERINARIA">Consulta Veterinaria</option>
            <option value="VACUNACION">Vacunación</option>
            <option value="URGENCIA">Urgencia</option>
        `;
    } else if (area === 'EXAMENES') {
        serviceSelector.innerHTML += `
            <option value="ANALISIS_SANGRE">Análisis de Sangre</option>
            <option value="ANALISIS_ORINA">Análisis de Orina</option>
            <option value="RADIOLOGIA">Radiología</option>
        `;
    } else if (area === 'IMAGENOLOGIA') {
        serviceSelector.innerHTML += `
            <option value="RADIOGRAFIA">Radiografía</option>
            <option value="ULTRASONIDO">Ultrasonido</option>
            <option value="ECOCARDIOGRAMA">Ecocardiograma</option>
        `;
    } else if (area === 'CONSULTA_ESPECIALISTA') {
        serviceSelector.innerHTML += `
            <option value="DERMATOLOGIA">Dermatología</option>
            <option value="CARDIOLOGIA">Cardiología</option>
            <option value="NEUROLOGIA">Neurología</option>
        `;
    }
}

function renderVeterinarians() {
    const container = document.getElementById('veterinarians-list');
    
    if (veterinarians.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No hay veterinarios disponibles</p>';
        return;
    }
    
    container.innerHTML = veterinarians.map(vet => `
        <div class="vet-card" data-vet-id="${vet.id}">
            <div class="d-flex align-items-center">
                <div class="flex-shrink-0">
                    <i class="fas fa-user-md fa-3x text-primary"></i>
                </div>
                <div class="flex-grow-1 ms-3">
                    <h5 class="mb-1">${vet.first_name} ${vet.last_name}</h5>
                    <p class="text-muted mb-0">
                        <i class="fas fa-envelope"></i> ${vet.email || 'No disponible'}
                    </p>
                </div>
                <div class="flex-shrink-0">
                    <i class="fas fa-check-circle text-success" style="display: none;"></i>
                </div>
            </div>
        </div>
    `).join('');
    
    // Event listeners para seleccionar veterinario
    document.querySelectorAll('.vet-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.vet-card').forEach(c => {
                c.classList.remove('selected');
                c.querySelector('.fa-check-circle').style.display = 'none';
            });
            card.classList.add('selected');
            card.querySelector('.fa-check-circle').style.display = 'block';
            
            const vetId = parseInt(card.dataset.vetId);
            selectedVeterinarian = veterinarians.find(v => v.id === vetId);
            
            // Actualizar el nombre del veterinario en el paso 2 si existe
            const vetNameElement = document.getElementById('selected-vet-name');
            if (vetNameElement) {
                if (vetNameElement.tagName === 'INPUT') {
                    vetNameElement.value = `${selectedVeterinarian.first_name} ${selectedVeterinarian.last_name}`;
                } else {
                    vetNameElement.textContent = `${selectedVeterinarian.first_name} ${selectedVeterinarian.last_name}`;
                }
            }
        });
    });
}

function setupCalendar() {
    const today = new Date();
    const monthSelector = document.getElementById('month-selector');
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    monthSelector.value = `${year}-${month}`;
    
    // Cargar slots cuando se cambie el mes
    monthSelector.addEventListener('change', () => {
        if (selectedVeterinarian) {
            loadAvailableSlots();
        }
    });
}

async function loadAvailableSlots() {
    if (!selectedVeterinarian) return;
    
    const monthSelector = document.getElementById('month-selector');
    const [year, month] = monthSelector.value.split('-');
    
    try {
        // Usar endpoint público para obtener disponibilidad (no requiere autenticación)
        let response;
        
        if (isAuthenticated()) {
            // Si está autenticado, usar el endpoint normal
            response = await authenticatedFetch(
                `/api/appointments/calendar/monthly/?year=${year}&month=${parseInt(month)}&veterinarian_id=${selectedVeterinarian.id}`
            );
        } else {
            // Si no está autenticado, usar endpoint público
            response = await fetch(
                `/api/appointments/calendar/monthly/?year=${year}&month=${parseInt(month)}&veterinarian_id=${selectedVeterinarian.id}`
            );
        }
        
        if (response.ok) {
            const data = await response.json();
            const vetSlots = (data.calendar || []).filter(
                item => item.veterinarian_id === selectedVeterinarian.id
            );
            
            currentSlotsData = vetSlots;
            renderCalendar(year, parseInt(month), vetSlots);
        } else {
            console.error('Error loading slots:', response.status);
            showAlert('booking-alert', 'No se pudieron cargar los horarios disponibles', 'warning');
        }
    } catch (error) {
        console.error('Error loading slots:', error);
        showAlert('booking-alert', 'Error al cargar los horarios disponibles', 'warning');
    }
}

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

function renderCalendar(year, month, slotsData) {
    const container = document.getElementById('calendar-container');
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDay = (firstDay.getDay() + 6) % 7; // Lunes = 0
    
    let html = `
        <div class="calendar-grid mb-3" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;">
            <div class="text-center fw-bold">Lun</div>
            <div class="text-center fw-bold">Mar</div>
            <div class="text-center fw-bold">Mié</div>
            <div class="text-center fw-bold">Jue</div>
            <div class="text-center fw-bold">Vie</div>
            <div class="text-center fw-bold">Sáb</div>
            <div class="text-center fw-bold">Dom</div>
    `;
    
    // Días vacíos al inicio
    for (let i = 0; i < startDay; i++) {
        html += '<div></div>';
    }
    
    // Días del mes
    const today = new Date();
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month - 1, day);
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const daySlots = slotsData.filter(s => s.date === dateStr);
        const hasSlots = daySlots.length > 0 && daySlots.some(s => s.available_slots.length > 0);
        const isPast = date < today && date.toDateString() !== today.toDateString();
        const isSelected = selectedDate === dateStr;
        const isHoliday = isChileanHoliday(year, month, day);
        const holidayName = isHoliday ? getHolidayName(year, month, day) : null;
        
        // Los feriados siempre están bloqueados, incluso si tienen slots
        const canSelect = hasSlots && !isPast && !isHoliday;
        
        html += `
            <div class="calendar-day text-center p-2 border rounded ${canSelect ? 'has-slots' : ''} ${isSelected ? 'selected bg-primary text-white' : ''} ${isPast ? 'opacity-50' : ''} ${isHoliday ? 'holiday bg-danger text-white' : ''}" 
                 data-date="${dateStr}"
                 data-is-holiday="${isHoliday}"
                 data-holiday-name="${holidayName || ''}"
                 style="cursor: ${canSelect ? 'pointer' : 'not-allowed'};">
                ${day}
                ${isHoliday ? '<br><small style="font-size: 0.7em;">Feriado</small>' : ''}
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Event listeners para días
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', async () => {
            const dateStr = day.dataset.date;
            const isHoliday = day.dataset.isHoliday === 'true';
            const holidayName = day.dataset.holidayName;
            
            // Validar si es feriado
            if (isHoliday) {
                const [y, m, d] = dateStr.split('-').map(Number);
                const holidayDisplayName = holidayName || getHolidayName(y, m, d);
                const whatsappUrl = 'https://wa.me/56949729777?text=Hola,%20tengo%20una%20emergencia%20veterinaria%20y%20necesito%20atención%20urgente.';
                const phoneNumber = '+56 9 4972 9777';
                
                // Mostrar mensaje con información de contacto
                const alertContainer = document.getElementById('booking-alert') || document.querySelector('.alert-container');
                if (alertContainer) {
                    alertContainer.innerHTML = `
                        <div class="alert alert-warning d-flex align-items-center" role="alert">
                            <i class="fas fa-exclamation-triangle me-3" style="font-size: 2rem;"></i>
                            <div class="flex-grow-1">
                                <h5 class="alert-heading mb-2">¡Clínica Cerrada por Feriado!</h5>
                                <p class="mb-2"><strong>${holidayDisplayName}</strong></p>
                                <p class="mb-2">La clínica está cerrada en días feriados. Si tienes una <strong>emergencia</strong>, contáctanos:</p>
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
                    // Si no hay contenedor, usar alert nativo
                    alert(`⚠️ Clínica Cerrada por Feriado\n\n${holidayDisplayName}\n\nLa clínica está cerrada en días feriados. Si tienes una emergencia, contáctanos:\n\n📱 WhatsApp: ${phoneNumber}\n📞 Teléfono: ${phoneNumber}`);
                }
                return;
            }
            
            // Si no es feriado y tiene slots, continuar normalmente
            if (!day.classList.contains('has-slots')) {
                return;
            }
            
            selectedDate = dateStr;
            
            // Resaltar día seleccionado
            document.querySelectorAll('.calendar-day').forEach(d => {
                d.classList.remove('selected', 'bg-primary', 'text-white');
            });
            day.classList.add('selected', 'bg-primary', 'text-white');
            
            // Cargar horarios disponibles
            await loadTimeSlotsForDate(dateStr, currentSlotsData);
            
            // Si ya hay un time slot seleccionado, actualizar resumen
            if (selectedTimeSlot && currentStep === 2) {
                updateSummaryStep2();
            }
        });
    });
}

async function loadTimeSlotsForDate(dateStr, slotsData) {
    const dayData = slotsData.find(s => s.date === dateStr);
    
    if (!dayData || !dayData.available_slots || dayData.available_slots.length === 0) {
        document.getElementById('time-slots-container').classList.add('d-none');
        return;
    }
    
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Crear la fecha en hora local usando mediodía para evitar problemas de zona horaria
    const date = new Date(year, month - 1, day, 12, 0, 0);
    
    // Días de la semana en español
    const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    // Meses en español
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    // Obtener día de la semana usando la fecha local
    const weekday = weekdays[date.getDay()];
    // Usar el mes directamente del string parseado (month - 1 porque los arrays son 0-indexados)
    const monthName = months[month - 1];
    
    // Formatear la fecha manualmente - usar siempre el día del string parseado, no del objeto Date
    const dateFormatted = `${weekday}, ${day} de ${monthName} de ${year}`;
    
    document.getElementById('selected-date-text').textContent = dateFormatted;
    
    const container = document.getElementById('time-slots-list');
    container.innerHTML = dayData.available_slots.map(slot => {
        const timeStr = slot.start_time.substring(0, 5); // HH:MM
        return `
            <button type="button" class="time-slot-btn" 
                    data-slot-id="${slot.id}"
                    data-start-time="${slot.start_time}">
                ${timeStr}
            </button>
        `;
    }).join('');
    
    // Event listeners para horarios
    document.querySelectorAll('.time-slot-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            
            selectedTimeSlot = {
                id: parseInt(btn.dataset.slotId),
                startTime: btn.dataset.startTime
            };
            
            // Actualizar resumen en paso 2 si estamos en ese paso
            if (currentStep === 2) {
                updateSummaryStep2();
                
                // Avanzar al paso 3 (Identificación) cuando se selecciona un horario
                if (selectedVeterinarian && selectedDate && selectedTimeSlot) {
                    currentStep = 3;
                    updateStepDisplay();
                    updateSummaryStep3();
                    
                    // Si ya está autenticado, mostrar sección autenticada
                    if (isAuthenticated()) {
                        showAuthenticatedSectionStep3();
                    } else {
                        showAuthSectionStep3();
                    }
                }
            }
        });
    });
    
    document.getElementById('time-slots-container').classList.remove('d-none');
}

let userPets = [];

async function loadUserPets() {
    try {
        const response = await authenticatedFetch('/api/pets/');
        if (response.ok) {
            const data = await response.json();
            userPets = Array.isArray(data) ? data : (data.results || []);
            renderPets();
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

function renderPets() {
    const container = document.getElementById('pets-list');
    
    // Si el contenedor no existe (como en la página de booking), simplemente retornar
    if (!container) {
        return;
    }
    
    if (userPets.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No tienes mascotas registradas. 
                <a href="/dashboard/?section=pets" class="alert-link">Registra una mascota</a> primero.
            </div>
        `;
        return;
    }
    
    container.innerHTML = userPets.map(pet => `
        <div class="pet-card" data-pet-id="${pet.id}">
            <div class="d-flex align-items-center">
                <div class="flex-shrink-0">
                    <i class="fas fa-paw fa-3x text-success"></i>
                </div>
                <div class="flex-grow-1 ms-3">
                    <h5 class="mb-1">${pet.name}</h5>
                    <p class="text-muted mb-0">
                        ${pet.species} - ${pet.breed || 'Sin raza especificada'}
                    </p>
                </div>
                <div class="flex-shrink-0">
                    <i class="fas fa-check-circle text-success" style="display: none;"></i>
                </div>
            </div>
        </div>
    `).join('');
    
    // Event listeners para seleccionar mascota
    document.querySelectorAll('.pet-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.pet-card').forEach(c => {
                c.classList.remove('selected');
                c.querySelector('.fa-check-circle').style.display = 'none';
            });
            card.classList.add('selected');
            card.querySelector('.fa-check-circle').style.display = 'block';
            
            const petId = parseInt(card.dataset.petId);
            selectedPet = userPets.find(p => p.id === petId);
        });
    });
}

async function nextStep() {
    if (currentStep === 1) {
        // El paso 1 no valida nada aquí, la búsqueda se maneja en handleSearchByService
        // Esta función solo se llama si ya se hizo la búsqueda y se está avanzando
        return;
    } else if (currentStep === 2) {
        // Validar que tenga veterinario, fecha y hora seleccionados
        if (!selectedVeterinarian) {
            showAlert('booking-alert', 'Por favor seleccione un veterinario', 'warning');
            return;
        }
        if (!selectedDate || !selectedTimeSlot) {
            showAlert('booking-alert', 'Por favor seleccione una fecha y horario', 'warning');
            return;
        }
        // Avanzar al paso 3 (Identificación)
        currentStep = 3;
        updateStepDisplay();
        updateSummaryStep3();
        
        // Si ya está autenticado, mostrar sección autenticada
        if (isAuthenticated()) {
            showAuthenticatedSectionStep3();
        } else {
            showAuthSectionStep3();
        }
        return;
    } else if (currentStep === 3) {
        // Validar que esté autenticado antes de confirmar
        if (!isAuthenticated()) {
            showAlert('booking-alert', 'Por favor regístrese antes de continuar', 'warning');
            return;
        }
        // Confirmar la cita y avanzar a Reserva Exitosa
        await confirmAppointment();
        return;
    }
    
    // Avanzar hasta el paso 4 (Reserva Exitosa)
    if (currentStep < 4) {
        currentStep++;
        updateStepDisplay();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

function updateStepDisplay() {
    // Actualizar pasos visuales (ahora hay 4 pasos)
    document.querySelectorAll('.wizard-step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        }
    });
    
    // Mostrar/ocultar paneles
    document.querySelectorAll('.wizard-panel').forEach((panel, index) => {
        const panelNum = index + 1;
        const shouldBeActive = panelNum === currentStep;
        
        // Remover clase active de todos primero
        panel.classList.remove('active');
        
        // Agregar clase active solo al panel del paso actual
        if (shouldBeActive) {
            panel.classList.add('active');
        }
    });
    
    // Mostrar/ocultar botones
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnConfirm = document.getElementById('btn-confirm');
    
    if (btnPrev) {
        btnPrev.style.display = currentStep > 1 && currentStep < 4 ? 'block' : 'none';
    }
    
    // En el paso 4 (reserva exitosa), ocultar todos los botones de navegación
    if (currentStep === 4) {
        if (btnNext) btnNext.style.display = 'none';
        if (btnConfirm) btnConfirm.classList.add('d-none');
    } else {
        // En pasos 1, 2 y 3, mostrar botón "Siguiente"
        if (btnNext) btnNext.style.display = 'block';
        if (btnConfirm) btnConfirm.classList.add('d-none');
    }
}

function updateSummaryStep2() {
    if (!selectedDate || !selectedTimeSlot || !selectedVeterinarian) return;
    
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Días de la semana en español
    const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    // Meses en español
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const weekday = weekdays[date.getDay()];
    const monthName = months[date.getMonth()];
    const dateFormatted = `${weekday}, ${day} de ${monthName} de ${year}`;
    
    const timeStr = selectedTimeSlot.startTime.substring(0, 5);
    
    // Actualizar resumen en paso 2
    const summaryVetStep2 = document.getElementById('summary-vet-step2');
    const summaryDateStep2 = document.getElementById('summary-date-step2');
    const summaryTimeStep2 = document.getElementById('summary-time-step2');
    
    if (summaryVetStep2) summaryVetStep2.textContent = `${selectedVeterinarian.first_name} ${selectedVeterinarian.last_name}`;
    if (summaryDateStep2) summaryDateStep2.textContent = dateFormatted;
    if (summaryTimeStep2) summaryTimeStep2.textContent = timeStr;
}

function updateSummaryStep3() {
    if (!selectedDate || !selectedTimeSlot || !selectedVeterinarian) return;
    
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Días de la semana en español
    const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    // Meses en español
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const weekday = weekdays[date.getDay()];
    const monthName = months[date.getMonth()];
    const dateFormatted = `${weekday}, ${day} de ${monthName} de ${year}`;
    
    const timeStr = selectedTimeSlot.startTime.substring(0, 5);
    
    // Actualizar resumen en paso 3
    const summaryVet = document.getElementById('summary-vet-step3');
    const summaryDate = document.getElementById('summary-date-step3');
    const summaryTime = document.getElementById('summary-time-step3');
    
    if (summaryVet) summaryVet.textContent = `${selectedVeterinarian.first_name} ${selectedVeterinarian.last_name}`;
    if (summaryDate) summaryDate.textContent = dateFormatted;
    if (summaryTime) summaryTime.textContent = timeStr;
}

function showAuthSectionStep3() {
    const authSection = document.getElementById('auth-section-step3');
    const authenticatedSection = document.getElementById('authenticated-section-step3');
    if (authSection) authSection.classList.remove('d-none');
    if (authenticatedSection) authenticatedSection.classList.add('d-none');
}

function showAuthenticatedSectionStep3() {
    const authSection = document.getElementById('auth-section-step3');
    const authenticatedSection = document.getElementById('authenticated-section-step3');
    
    // Cargar mascotas del usuario
    loadUserPets().then(() => {
        if (authSection) authSection.classList.add('d-none');
        if (authenticatedSection) authenticatedSection.classList.remove('d-none');
        
        // Verificar si tiene mascotas
        if (userPets.length === 0) {
            // Si no tiene mascotas, mostrar opción para agregar una
            const noPetsMessage = document.getElementById('no-pets-message-step3');
            const readyToConfirmMessage = document.getElementById('ready-to-confirm-message-step3');
            
            if (noPetsMessage) noPetsMessage.classList.remove('d-none');
            if (readyToConfirmMessage) readyToConfirmMessage.classList.add('d-none');
        } else {
            // Si tiene mascotas, mostrar mensaje de que está listo
            const noPetsMessage = document.getElementById('no-pets-message-step3');
            const readyToConfirmMessage = document.getElementById('ready-to-confirm-message-step3');
            
            if (noPetsMessage) noPetsMessage.classList.add('d-none');
            if (readyToConfirmMessage) readyToConfirmMessage.classList.remove('d-none');
        }
    });
}

async function loadUserPetsStep3() {
    try {
        const response = await authenticatedFetch('/api/pets/');
        if (response.ok) {
            const data = await response.json();
            userPets = Array.isArray(data) ? data : (data.results || []);
            renderPetsStep3();
        }
    } catch (error) {
        console.error('Error loading pets:', error);
    }
}

function renderPetsStep3() {
    const container = document.getElementById('pets-list-step3');
    if (!container) return;
    
    if (userPets.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i> No tienes mascotas registradas. 
                <button type="button" class="btn btn-sm btn-primary" id="btn-add-pet-step3">
                    <i class="fas fa-plus"></i> Agregar Nueva Mascota
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userPets.map(pet => `
        <div class="pet-card" data-pet-id="${pet.id}" style="cursor: pointer;">
            <div class="d-flex align-items-center">
                <div class="flex-shrink-0">
                    <i class="fas fa-paw fa-3x text-success"></i>
                </div>
                <div class="flex-grow-1 ms-3">
                    <h5 class="mb-1">${pet.name}</h5>
                    <p class="text-muted mb-0">
                        ${pet.species} - ${pet.breed || 'Sin raza especificada'}
                    </p>
                </div>
                <div class="flex-shrink-0">
                    <i class="fas fa-check-circle text-success" style="display: none;"></i>
                </div>
            </div>
        </div>
    `).join('');
    
    // Event listeners para seleccionar mascota
    document.querySelectorAll('.pet-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.pet-card').forEach(c => {
                c.classList.remove('selected');
                c.querySelector('.fa-check-circle').style.display = 'none';
            });
            card.classList.add('selected');
            card.querySelector('.fa-check-circle').style.display = 'block';
            
            const petId = parseInt(card.dataset.petId);
            selectedPet = userPets.find(p => p.id === petId);
        });
    });
}

function updateConfirmation() {
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
    
    // Días de la semana en español
    const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    // Meses en español
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const weekday = weekdays[date.getDay()];
    const monthName = months[date.getMonth()];
    const dateFormatted = `${weekday}, ${day} de ${monthName} de ${year}`;
    
    const timeStr = selectedTimeSlot.startTime.substring(0, 5);
    
    document.getElementById('confirm-vet').textContent = 
        `${selectedVeterinarian.first_name} ${selectedVeterinarian.last_name}`;
    document.getElementById('confirm-date').textContent = dateFormatted;
    document.getElementById('confirm-time').textContent = timeStr;
    document.getElementById('confirm-pet').textContent = `${selectedPet.name} (${selectedPet.species})`;
}

// Función global para seleccionar un veterinario alternativo
window.selectAlternativeVeterinarian = async function(vetId, vetName, timeSlotId, startTime) {
    // Buscar el veterinario en la lista
    const vet = veterinarians.find(v => v.id === vetId);
    if (!vet) {
        // Si no está en la lista, cargarlo
        try {
            const response = await fetch(`/api/auth/veterinarians/`);
            if (response.ok) {
                const vets = await response.json();
                const foundVet = Array.isArray(vets) ? vets.find(v => v.id === vetId) : null;
                if (foundVet) {
                    selectedVeterinarian = foundVet;
                } else {
                    showAlert('booking-alert', 'No se pudo encontrar el veterinario seleccionado', 'danger');
                    return;
                }
            }
        } catch (error) {
            console.error('Error loading veterinarian:', error);
            showAlert('booking-alert', 'Error al cargar el veterinario', 'danger');
            return;
        }
    } else {
        selectedVeterinarian = vet;
    }
    
    // Actualizar el time slot seleccionado
    selectedTimeSlot = {
        id: timeSlotId,
        startTime: startTime
    };
    
    // Actualizar el resumen en el paso 2
    if (currentStep === 2) {
        updateSummaryStep2();
        renderVeterinariansStep2();
    }
    
    // Ocultar el mensaje de error
    const alertContainer = document.getElementById('booking-alert');
    if (alertContainer) {
        alertContainer.classList.add('d-none');
    }
    
    // Mostrar mensaje de confirmación
    showAlert('booking-alert', `Veterinario cambiado a: ${vetName}. Puede continuar con la reserva.`, 'success');
    
    // Si estamos en el paso 3, volver al paso 2 para que el usuario vea el cambio
    if (currentStep === 3) {
        currentStep = 2;
        updateStepDisplay();
    }
};

async function confirmAppointment() {
    // Verificar autenticación
    if (!isAuthenticated()) {
        showAlert('booking-alert', 'Por favor inicie sesión o regístrese antes de continuar', 'warning');
        return;
    }
    
    const userData = getUserData();
    if (!userData) {
        showAlert('booking-alert', 'Error al obtener datos del usuario', 'danger');
        return;
    }
    
    // Cargar mascotas del usuario si no están cargadas
    if (userPets.length === 0) {
        await loadUserPets();
    }
    
    // Si no hay mascotas, mostrar error
    if (userPets.length === 0) {
        showAlert('booking-alert', 'No tiene mascotas registradas. Por favor registre una mascota primero.', 'warning');
        return;
    }
    
    // Usar la primera mascota si no hay una seleccionada
    if (!selectedPet) {
        selectedPet = userPets[0];
    }
    
    // Motivo por defecto si no se especifica
    const reason = 'Consulta veterinaria';
    
    const appointmentData = {
        pet: selectedPet.id,
        client: userData.id,
        veterinarian: selectedVeterinarian.id,
        time_slot: selectedTimeSlot.id,
        appointment_date: selectedDate,
        appointment_time: selectedTimeSlot.startTime,
        reason: reason,
        notes: ''
    };
    
    try {
        showAlert('booking-alert', 'Agendando cita...', 'info');
        
        // Log de datos que se envían para debugging
        console.log('Datos de la cita a crear:', appointmentData);
        
        const response = await authenticatedFetch('/api/appointments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appointmentData)
        });
        
        if (response.ok) {
            // Actualizar confirmación en paso 4 (Reserva Exitosa)
            updateConfirmation();
            
            // Ir al paso 4 (reserva exitosa)
            currentStep = 4;
            updateStepDisplay();
            
            // Redirigir al dashboard después de 3 segundos
            setTimeout(() => {
                window.location.href = '/dashboard/';
            }, 3000);
        } else {
            const errorData = await response.json();
            let errorMessage = 'Error al agendar la cita';
            
            // Si el horario está ocupado y hay veterinarios alternativos, mostrarlos
            if (errorData.time_slot && errorData.alternative_veterinarians && errorData.alternative_veterinarians.length > 0) {
                const alertContainer = document.getElementById('booking-alert');
                if (alertContainer) {
                    const alternativeVets = errorData.alternative_veterinarians;
                    alertContainer.innerHTML = `
                        <div class="alert alert-warning d-flex align-items-start" role="alert">
                            <i class="fas fa-exclamation-triangle me-3 mt-1" style="font-size: 1.5rem;"></i>
                            <div class="flex-grow-1">
                                <h5 class="alert-heading mb-2">¡Horario No Disponible!</h5>
                                <p class="mb-2">El horario seleccionado con <strong>${selectedVeterinarian.first_name} ${selectedVeterinarian.last_name}</strong> ya está ocupado.</p>
                                <p class="mb-3"><strong>Veterinarios alternativos disponibles en el mismo horario:</strong></p>
                                <div class="d-flex flex-column gap-2">
                                    ${alternativeVets.map(vet => `
                                        <button type="button" class="btn btn-outline-primary text-start" onclick="selectAlternativeVeterinarian(${vet.id}, '${vet.name}', ${vet.time_slot_id}, '${selectedTimeSlot.startTime}')">
                                            <i class="fas fa-user-md me-2"></i>
                                            <strong>${vet.name}</strong>
                                            <small class="text-muted d-block ms-4">Disponible en el mismo horario</small>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                    alertContainer.classList.remove('d-none');
                    alertContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                return;
            }
            
            // Mostrar error completo en consola para debugging
            console.error('Error completo al agendar cita:', errorData);
            
            // Construir mensaje de error más detallado
            if (errorData.time_slot) {
                errorMessage = Array.isArray(errorData.time_slot) ? errorData.time_slot[0] : errorData.time_slot;
            } else if (errorData.pet) {
                errorMessage = Array.isArray(errorData.pet) ? errorData.pet[0] : errorData.pet;
            } else if (errorData.client) {
                errorMessage = Array.isArray(errorData.client) ? errorData.client[0] : errorData.client;
            } else if (errorData.veterinarian) {
                errorMessage = Array.isArray(errorData.veterinarian) ? errorData.veterinarian[0] : errorData.veterinarian;
            } else if (errorData.detail) {
                errorMessage = errorData.detail;
            } else if (typeof errorData === 'object' && Object.keys(errorData).length > 0) {
                // Si hay múltiples errores, mostrarlos todos
                const errorMessages = Object.entries(errorData)
                    .filter(([key]) => key !== 'alternative_veterinarians')
                    .map(([key, value]) => {
                        const errorText = Array.isArray(value) ? value[0] : value;
                        return `${key}: ${errorText}`;
                    })
                    .join(', ');
                errorMessage = errorMessages || 'Error al agendar la cita. Por favor verifica los datos.';
            }
            
            showAlert('booking-alert', errorMessage, 'danger');
        }
    } catch (error) {
        console.error('Error creating appointment:', error);
        showAlert('booking-alert', 'Error al agendar la cita', 'danger');
    }
}

async function handleQuickLogin() {
    const username = document.getElementById('quick-username').value;
    const password = document.getElementById('quick-password').value;
    
    if (!username || !password) {
        showAlert('booking-alert', 'Por favor ingrese usuario y contraseña', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (!data.access || !data.refresh) {
                throw new Error('No se recibieron los tokens de autenticación');
            }
            
            // Guardar tokens
            saveTokens(data.access, data.refresh);
            
            // Obtener datos del usuario
            const userData = await getCurrentUser();
            
            if (userData && userData.role === 'VETERINARIO') {
                showAlert('booking-alert', 
                    'Los veterinarios no pueden agendar citas. Serás redirigido al dashboard.', 
                    'warning');
                setTimeout(() => {
                    window.location.href = '/dashboard/';
                }, 2000);
                return;
            }
            
            showAlert('booking-alert', 'Inicio de sesión exitoso', 'success');
            
            // Ocultar mensaje de autenticación requerida y mostrar sección autenticada (en paso 2)
            const authMsg = document.getElementById('auth-required-message');
            const authSection = document.getElementById('authenticated-section-step2');
            if (authMsg) authMsg.classList.add('d-none');
            if (authSection) authSection.classList.remove('d-none');
            
            // Actualizar resumen en paso 2 si ya hay fecha/hora seleccionada
            if (selectedDate && selectedTimeSlot) {
                updateSummaryStep2();
            }
            
            // Actualizar display de botones
            updateStepDisplay();
            
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.detail || errorData.error || 'Credenciales inválidas';
            showAlert('booking-alert', errorMsg, 'danger');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showAlert('booking-alert', 'Error al iniciar sesión', 'danger');
    }
}

async function handlePetPreRegister() {
    const petName = document.getElementById('pet-prereg-name').value;
    const petSpecies = document.getElementById('pet-prereg-species').value;
    const petBreed = document.getElementById('pet-prereg-breed').value;
    const ownerEmail = document.getElementById('pet-prereg-email').value;
    
    if (!petName || !petSpecies || !ownerEmail) {
        showAlert('pet-prereg-alert', 'Por favor complete todos los campos obligatorios', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/pets/pre-register/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: petName,
                species: petSpecies,
                breed: petBreed,
                owner_email: ownerEmail
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            showAlert('pet-prereg-alert', 'Mascota registrada exitosamente. Ahora puedes crear tu cuenta.', 'success');
            
            // Cerrar modal después de 2 segundos
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('petPreRegisterModal'));
                if (modal) modal.hide();
                
                // Redirigir a registro con el email pre-llenado
                window.location.href = `/login/?email=${ownerEmail}`;
            }, 2000);
        } else {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.detail || errorData.error || 'Error al registrar la mascota';
            showAlert('pet-prereg-alert', errorMsg, 'danger');
        }
    } catch (error) {
        console.error('Error al registrar mascota:', error);
        showAlert('pet-prereg-alert', 'Error al registrar la mascota', 'danger');
    }
}

function showAlert(elementId, message, type) {
    const alertElement = document.getElementById(elementId);
    if (!alertElement) {
        console.warn(`Elemento con ID ${elementId} no encontrado`);
        return;
    }
    
    alertElement.className = `alert alert-${type}`;
    alertElement.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i> ${message}`;
    alertElement.classList.remove('d-none');
    
    // No ocultar automáticamente para errores importantes
    if (type !== 'danger' && type !== 'warning') {
        setTimeout(() => {
            if (alertElement) {
                alertElement.classList.add('d-none');
            }
        }, 5000);
    }
}

