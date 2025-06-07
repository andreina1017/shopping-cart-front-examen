import { login } from './api.js';

export function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'index.html';
    }
}

if (typeof bootstrap === 'undefined') {
    console.error('Bootstrap no está cargado. Asegúrate de incluir Bootstrap JS en tu HTML.');
}

document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showAlert('Por favor complete todos los campos', 'danger');
        return;
    }
    
    try {
        const data = await login(username, password);
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data));
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        showAlert(error.message || 'Error en el login', 'danger');
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', function() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

if (!window.location.pathname.endsWith('index.html')) {
    checkAuth();
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.style.zIndex = '1100';
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}