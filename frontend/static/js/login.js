// login.js - Gestión de login
document.addEventListener('DOMContentLoaded', function() {
    // Si ya está autenticado, redirigir al dashboard
    if (isAuthenticated()) {
        window.location.href = '/dashboard/';
        return;
    }
    
    const loginForm = document.getElementById('login-form');
    
    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
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
                    
                    // Verificar que se recibieron los tokens
                    if (!data.access || !data.refresh) {
                        throw new Error('No se recibieron los tokens de autenticación');
                    }
                    
                    // Guardar tokens
                    saveTokens(data.access, data.refresh);
                    
                    // Obtener datos del usuario
                    await getCurrentUser();
                    
                    showAlert('login-alert', 'Inicio de sesión exitoso', 'success');
                    
                    // Redirigir al dashboard
                    setTimeout(() => {
                        window.location.href = '/dashboard/';
                    }, 1000);
                } else {
                    let errorMessage = 'Credenciales inválidas';
                    
                    try {
                        const errorData = await response.json();
                        if (errorData.detail) {
                            errorMessage = errorData.detail;
                        } else if (errorData.non_field_errors) {
                            errorMessage = errorData.non_field_errors[0];
                        } else if (errorData.username) {
                            errorMessage = errorData.username[0];
                        } else if (errorData.password) {
                            errorMessage = errorData.password[0];
                        }
                    } catch (jsonError) {
                        // Si no se puede parsear JSON, usar el texto de la respuesta
                        const text = await response.text();
                        console.error('Error response:', text);
                        errorMessage = `Error ${response.status}: ${response.statusText}`;
                    }
                    
                    showAlert('login-alert', errorMessage, 'danger');
                }
            } catch (error) {
                console.error('Error during login:', error);
                showAlert('login-alert', 'Error al iniciar sesión. Por favor, intente nuevamente.', 'danger');
            }
        });
    }
});

