import { getUsers, getUserById, addUser } from './api.js';

document.addEventListener('DOMContentLoaded', async function() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap no está cargado. Asegúrate de incluir Bootstrap JS en tu HTML.');
        return;
    }

    try {
        const users = await getUsers();
        renderUsersTable(users.users);
        
        document.getElementById('searchUserBtn').addEventListener('click', searchUsers);
        document.getElementById('searchUser').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchUsers();
        });
        
        document.getElementById('saveUserBtn').addEventListener('click', saveUser);
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        showAlert('Error al cargar usuarios', 'danger');
    }
});

function renderUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    tableBody.innerHTML = '';
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">No se encontraron usuarios</td>
            </tr>
        `;
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewUserDetails(${user.id})">Ver</button>
                <button class="btn btn-sm btn-warning">Editar</button>
                <button class="btn btn-sm btn-danger">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function searchUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    
    try {
        const users = await getUsers();
        const filteredUsers = users.users.filter(user => 
            user.firstName.toLowerCase().includes(searchTerm) ||
            user.lastName.toLowerCase().includes(searchTerm) ||
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
        
        renderUsersTable(filteredUsers);
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        showAlert('Error al buscar usuarios', 'danger');
    }
}

async function saveUser() {
    const userData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        phone: document.getElementById('phone').value,
    };
    
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.password) {
        showAlert('Por favor complete los campos requeridos', 'warning');
        return;
    }
    
    try {
        const newUser = await addUser(userData);
        showAlert('Usuario agregado correctamente', 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
        document.getElementById('addUserForm').reset();
        
        const users = await getUsers();
        renderUsersTable(users.users);
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        showAlert(error.message || 'Error al guardar usuario', 'danger');
    }
}

async function viewUserDetails(userId) {
    try {
        const user = await getUserById(userId);
        
        const modal = new bootstrap.Modal(document.getElementById('userDetailModal') || createUserDetailModal());
        
        document.getElementById('detailUserId').textContent = user.id;
        document.getElementById('detailUserName').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('detailUserUsername').textContent = user.username;
        document.getElementById('detailUserEmail').textContent = user.email;
        document.getElementById('detailUserPhone').textContent = user.phone;
        document.getElementById('detailUserAddress').textContent = 
            `${user.address?.address || ''}, ${user.address?.city || ''}, ${user.address?.state || ''}`;
        
        modal.show();
    } catch (error) {
        console.error('Error al obtener detalles del usuario:', error);
        showAlert('Error al obtener detalles del usuario', 'danger');
    }
}

function createUserDetailModal() {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal fade';
    modalDiv.id = 'userDetailModal';
    modalDiv.tabIndex = '-1';
    modalDiv.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Detalles del Usuario <span id="detailUserId"></span></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p><strong>Nombre:</strong> <span id="detailUserName"></span></p>
                    <p><strong>Username:</strong> <span id="detailUserUsername"></span></p>
                    <p><strong>Email:</strong> <span id="detailUserEmail"></span></p>
                    <p><strong>Teléfono:</strong> <span id="detailUserPhone"></span></p>
                    <p><strong>Dirección:</strong> <span id="detailUserAddress"></span></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalDiv);
    return modalDiv;
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

window.viewUserDetails = viewUserDetails;