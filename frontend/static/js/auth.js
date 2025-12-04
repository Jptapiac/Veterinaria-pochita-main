// auth.js - Gestión de autenticación
const API_BASE_URL = '/api';

// Guardar tokens
function saveTokens(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
}

// Obtener token de acceso
function getAccessToken() {
    return localStorage.getItem('access_token');
}

// Obtener token de refresh
function getRefreshToken() {
    return localStorage.getItem('refresh_token');
}

// Eliminar tokens
function clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
}

// Verificar si está autenticado
function isAuthenticated() {
    return !!getAccessToken();
}

// Obtener headers con autenticación
function getAuthHeaders() {
    const token = getAccessToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}

// Refresh token
async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access);
            return true;
        } else {
            clearTokens();
            return false;
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
}

// Realizar petición autenticada con manejo de refresh
async function authenticatedFetch(url, options = {}) {
    // Agregar headers de autenticación
    if (!options.headers) {
        options.headers = {};
    }
    
    const token = getAccessToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    
    let response = await fetch(url, options);
    
    // Si es 401, intentar refresh
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Reintentar la petición con el nuevo token
            const newToken = getAccessToken();
            options.headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(url, options);
        } else {
            // Redirect a login si no se pudo refrescar
            window.location.href = '/login/';
            throw new Error('Session expired');
        }
    }
    
    return response;
}

// Logout
async function logout() {
    const refreshToken = getRefreshToken();
    
    if (refreshToken) {
        try {
            await authenticatedFetch(`${API_BASE_URL}/auth/logout/`, {
                method: 'POST',
                body: JSON.stringify({ refresh_token: refreshToken })
            });
        } catch (error) {
            console.error('Error during logout:', error);
        }
    }
    
    clearTokens();
    window.location.href = '/login/';
}

// Obtener datos del usuario actual
async function getCurrentUser() {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/auth/me/`);
        
        if (response.ok) {
            const userData = await response.json();
            localStorage.setItem('user_data', JSON.stringify(userData));
            return userData;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
    }
}

// Obtener datos del usuario desde localStorage
function getUserData() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

// Proteger rutas (redirigir si no está autenticado)
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login/';
    }
}

// Actualizar UI según estado de autenticación
function updateAuthUI() {
    const navAuth = document.getElementById('nav-auth');
    const publicNav = document.getElementById('public-nav');
    
    if (isAuthenticated()) {
        const userData = getUserData();
        
        // Ocultar navegación pública
        if (publicNav) {
            publicNav.style.display = 'none';
            publicNav.classList.add('hidden');
            publicNav.classList.remove('d-flex', 'flex');
        }
        
        // Actualizar logo para que redirija al dashboard
        const navbarBrand = document.getElementById('navbar-brand-link');
        if (navbarBrand) {
            navbarBrand.href = '/dashboard/';
        }
        
        // Mostrar menú de usuario con dropdown
        if (userData && navAuth) {
            const userName = userData.first_name || userData.username;
            // Limpiar contenido anterior
            navAuth.innerHTML = '';
            
            // Crear elemento dropdown
            const dropdownItem = document.createElement('li');
            dropdownItem.className = 'nav-item dropdown';
            dropdownItem.innerHTML = `
                <a class="nav-link dropdown-toggle btn btn-primary ms-2 text-white d-inline-flex align-items-center" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user me-2"></i> ${userName}
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li>
                        <a class="dropdown-item" href="#" id="profile-link-navbar">
                            <i class="fas fa-user me-2"></i> Mi Perfil
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item text-danger" href="#" id="logout-link-navbar">
                            <i class="fas fa-sign-out-alt me-2"></i> Cerrar Sesión
                        </a>
                    </li>
                </ul>
            `;
            navAuth.appendChild(dropdownItem);
            
            // Agregar evento de logout
            const logoutLink = document.getElementById('logout-link-navbar');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    logout();
                });
            }
            
            // Agregar evento de perfil
            const profileLink = document.getElementById('profile-link-navbar');
            if (profileLink) {
                profileLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Si estamos en dashboard, cargar sección de perfil
                    if (typeof loadSection === 'function') {
                        loadSection('profile');
                    } else {
                        // Si no, redirigir al dashboard y luego cargar perfil
                        window.location.href = '/dashboard/';
                        setTimeout(() => {
                            if (typeof loadSection === 'function') {
                                loadSection('profile');
                            }
                        }, 500);
                    }
                });
            }
        }
    } else {
        // Mostrar navegación pública
        if (publicNav) {
            publicNav.style.display = 'flex';
            publicNav.classList.remove('hidden');
        }
        
        // Restaurar logo para que redirija a inicio
        const navbarBrand = document.getElementById('navbar-brand-link');
        if (navbarBrand) {
            navbarBrand.href = '/';
        }
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

