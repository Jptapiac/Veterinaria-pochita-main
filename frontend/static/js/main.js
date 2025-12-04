// main.js - Funciones generales
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scroll para enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Ignorar enlaces que son solo "#"
            if (!href || href === '#' || href.length <= 1) {
                return;
            }
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Animación de aparición al hacer scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.service-card, .card').forEach(el => {
        observer.observe(el);
    });
});

// Utilidades para mostrar alertas
function showAlert(elementId, message, type = 'info') {
    const alertElement = document.getElementById(elementId);
    if (!alertElement) return;
    
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    alertElement.classList.remove('d-none');
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        hideAlert(elementId);
    }, 5000);
}

function hideAlert(elementId) {
    const alertElement = document.getElementById(elementId);
    if (alertElement) {
        alertElement.classList.add('d-none');
    }
}

// Formatear fecha
function formatDate(dateString) {
    // Parsear la fecha manualmente para evitar problemas de zona horaria
    // dateString debe estar en formato YYYY-MM-DD
    if (!dateString) return '';
    
    // Si ya es una fecha formateada, intentar parsearla
    if (dateString.includes(' ') || dateString.includes(',')) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return date.toLocaleDateString('es-CL', options);
        }
    }
    
    // Parsear formato YYYY-MM-DD manualmente para evitar problemas de zona horaria
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexados
        const day = parseInt(parts[2], 10);
        
        const months = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        
        return `${day} de ${months[month]} de ${year}`;
    }
    
    // Fallback: usar Date normal
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-CL', options);
}

// Formatear fecha corta
function formatDateShort(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

// Formatear hora
function formatTime(timeString) {
    if (!timeString) return '';
    // timeString puede ser "HH:MM:SS" o "HH:MM"
    const parts = timeString.split(':');
    const hours = parts[0];
    let minutes = parts[1] || '00';
    
    // Asegurar que los minutos tengan dos dígitos
    if (minutes.length === 1) {
        minutes = '0' + minutes;
    }
    
    // Formato 24 horas (HH:MM)
    return `${hours}:${minutes}`;
}

// Formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(price);
}

// Obtener badge de estado
function getStatusBadge(status) {
    const statusMap = {
        'PENDIENTE': { class: 'warning', text: 'Pendiente' },
        'CONFIRMADA': { class: 'success', text: 'Confirmada' },
        'ATENDIDA': { class: 'info', text: 'Atendida' },
        'CANCELADA': { class: 'danger', text: 'Cancelada' },
        'REPROGRAMADA': { class: 'secondary', text: 'Reprogramada' }
    };
    
    const statusInfo = statusMap[status] || { class: 'secondary', text: status };
    return `<span class="badge bg-${statusInfo.class}">${statusInfo.text}</span>`;
}

// Validar RUT chileno
function validateRUT(rut) {
    if (!rut) return true; // RUT es opcional
    
    // Limpiar RUT
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    
    if (rut.length < 2) return false;
    
    const body = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();
    
    // Calcular dígito verificador
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body.charAt(i)) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const calculatedDV = 11 - (sum % 11);
    let expectedDV;
    
    if (calculatedDV === 11) {
        expectedDV = '0';
    } else if (calculatedDV === 10) {
        expectedDV = 'K';
    } else {
        expectedDV = calculatedDV.toString();
    }
    
    return dv === expectedDV;
}

// Formatear RUT
function formatRUT(rut) {
    if (!rut) return '';
    
    // Limpiar RUT
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    
    if (rut.length < 2) return rut;
    
    const body = rut.slice(0, -1);
    const dv = rut.slice(-1);
    
    // Formatear con puntos
    let formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formattedBody}-${dv}`;
}

// Debounce function para búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Confirmar acción
function confirmAction(message) {
    return confirm(message);
}

// Loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 text-muted">Cargando...</p>
            </div>
        `;
    }
}

// Mensaje de "no hay datos"
function showNoData(elementId, message = 'No hay datos para mostrar') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">${message}</p>
            </div>
        `;
    }
}

