import { getCarts, getCartById, addCart, getUserById, getProductById } from './api.js';

document.addEventListener('DOMContentLoaded', async function() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap no está cargado. Asegúrate de incluir Bootstrap JS en tu HTML.');
        return;
    }

    try {
        const response = await getCarts();
        renderCarts(response.carts);
        
        document.getElementById('searchCartBtn').addEventListener('click', searchCarts);
        document.getElementById('searchCart').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchCarts();
        });
        
        document.getElementById('saveCartBtn').addEventListener('click', saveCart);
        document.getElementById('addProductToCartBtn').addEventListener('click', addProductToCartForm);
        
    } catch (error) {
        console.error('Error al cargar carritos:', error);
        showAlert('Error al cargar carritos', 'danger');
    }
});

function renderCarts(carts) {
    const tableBody = document.getElementById('cartsTableBody');
    tableBody.innerHTML = '';
    
    if (carts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">No se encontraron carritos</td>
            </tr>
        `;
        return;
    }
    
    carts.forEach(async cart => {
        try {
            const user = await getUserById(cart.userId);
            const userName = `${user.firstName} ${user.lastName}`;
            
            const total = cart.products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const productCount = cart.products.reduce((count, item) => count + item.quantity, 0);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cart.id}</td>
                <td>${userName}</td>
                <td>${productCount} productos</td>
                <td>$${total.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewCartDetails(${cart.id})">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCart(${cart.id})">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        } catch (error) {
            console.error(`Error al cargar información del carrito ${cart.id}:`, error);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${cart.id}</td>
                <td colspan="4" class="text-danger">Error al cargar información del carrito</td>
            `;
            tableBody.appendChild(row);
        }
    });
}

async function searchCarts() {
    const searchTerm = document.getElementById('searchCart').value.trim().toLowerCase();
    
    if (searchTerm === '') {
        const response = await getCarts();
        renderCarts(response.carts);
        return;
    }
    
    try {
        const response = await getCarts();
        const filteredCarts = await Promise.all(
            response.carts.map(async cart => {
                try {
                    const user = await getUserById(cart.userId);
                    const userName = `${user.firstName} ${user.lastName}`.toLowerCase();
                    return userName.includes(searchTerm) ? cart : null;
                } catch {
                    return null;
                }
            })
        );
        
        renderCarts(filteredCarts.filter(cart => cart !== null));
    } catch (error) {
        console.error('Error al buscar carritos:', error);
        showAlert('Error al buscar carritos', 'danger');
    }
}

async function saveCart() {
    const userId = parseInt(document.getElementById('cartUserId').value);
    
    if (!userId || isNaN(userId)) {
        showAlert('Por favor ingrese un ID de usuario válido', 'warning');
        return;
    }
    
    const productRows = document.querySelectorAll('#cartProductsContainer .product-row');
    const products = [];
    
    for (const row of productRows) {
        const productId = parseInt(row.querySelector('.product-id').value);
        const quantity = parseInt(row.querySelector('.product-quantity').value);
        
        if (!isNaN(productId)) {
            products.push({
                id: productId,
                quantity: isNaN(quantity) ? 1 : quantity
            });
        }
    }
    
    if (products.length === 0) {
        showAlert('Debe agregar al menos un producto al carrito', 'warning');
        return;
    }
    
    const cartData = {
        userId,
        products
    };
    
    try {
        await getUserById(userId);
        
        const newCart = await addCart(cartData);
        showAlert('Carrito creado correctamente', 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('addCartModal')).hide();
        document.getElementById('addCartForm').reset();
        document.getElementById('cartProductsContainer').innerHTML = '';
        
        const response = await getCarts();
        renderCarts(response.carts);
    } catch (error) {
        console.error('Error al guardar carrito:', error);
        showAlert(error.message || 'Error al guardar carrito', 'danger');
    }
}

function addProductToCartForm() {
    const container = document.getElementById('cartProductsContainer');
    const rowId = Date.now();
    
    const row = document.createElement('div');
    row.className = 'product-row mb-3 p-3 border rounded';
    row.innerHTML = `
        <div class="row g-2">
            <div class="col-md-5">
                <label class="form-label">ID del Producto</label>
                <input type="number" class="form-control product-id" placeholder="ID del producto">
            </div>
            <div class="col-md-3">
                <label class="form-label">Cantidad</label>
                <input type="number" class="form-control product-quantity" value="1" min="1">
            </div>
            <div class="col-md-3">
                <label class="form-label">Info</label>
                <div class="product-info small text-muted">Ingrese el ID y presione Tab</div>
            </div>
            <div class="col-md-1 d-flex align-items-end">
                <button type="button" class="btn btn-sm btn-danger" onclick="this.closest('.product-row').remove()">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(row);
    
    const productIdInput = row.querySelector('.product-id');
    productIdInput.addEventListener('change', async function() {
        const productId = parseInt(this.value);
        if (isNaN(productId)) return;
        
        try {
            const product = await getProductById(productId);
            const infoDiv = row.querySelector('.product-info');
            infoDiv.innerHTML = `
                <strong>${product.title}</strong><br>
                $${product.price} | Stock: ${product.stock}
            `;
            infoDiv.classList.remove('text-muted');
        } catch (error) {
            console.error('Error al cargar producto:', error);
            row.querySelector('.product-info').textContent = 'Producto no encontrado';
        }
    });
}

async function viewCartDetails(cartId) {
    try {
        const cart = await getCartById(cartId);
        const user = await getUserById(cart.userId);
        
        const total = cart.products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountedTotal = total * 0.9;
        
        const modal = new bootstrap.Modal(document.getElementById('cartDetailModal') || createCartDetailModal());
        
        document.getElementById('detailCartId').textContent = cart.id;
        document.getElementById('detailCartUser').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('detailCartTotal').textContent = `$${total.toFixed(2)}`;
        document.getElementById('detailCartDiscountedTotal').textContent = `$${discountedTotal.toFixed(2)}`;
        
        const productsBody = document.getElementById('detailCartProducts');
        productsBody.innerHTML = '';
        
        let productsHtml = '';
        let counter = 1;
        
        for (const item of cart.products) {
            try {
                const product = await getProductById(item.id);
                const total = product.price * item.quantity;
                
                productsHtml += `
                    <tr>
                        <td>${counter++}</td>
                        <td>
                            <img src="${product.thumbnail}" class="img-thumbnail me-2" style="width: 50px; height: 50px; object-fit: contain;">
                            ${product.title}
                        </td>
                        <td>$${product.price.toFixed(2)}</td>
                        <td>${item.quantity}</td>
                        <td>$${total.toFixed(2)}</td>
                        <td>${product.discountPercentage}%</td>
                    </tr>
                `;
            } catch (error) {
                console.error(`Error al cargar producto ${item.id}:`, error);
                productsHtml += `
                    <tr>
                        <td>${counter++}</td>
                        <td>Producto ID: ${item.id} (no disponible)</td>
                        <td>-</td>
                        <td>${item.quantity}</td>
                        <td>-</td>
                        <td>-</td>
                    </tr>
                `;
            }
        }
        
        productsBody.innerHTML = productsHtml;
        modal.show();
        
    } catch (error) {
        console.error('Error al obtener detalles del carrito:', error);
        showAlert('Error al obtener detalles del carrito', 'danger');
    }
}

function createCartDetailModal() {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal fade';
    modalDiv.id = 'cartDetailModal';
    modalDiv.tabIndex = '-1';
    modalDiv.innerHTML = `
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Detalles del Carrito <span id="detailCartId"></span></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row mb-4">
                        <div class="col-md-6">
                            <p><strong>Usuario:</strong> <span id="detailCartUser"></span></p>
                        </div>
                        <div class="col-md-6 text-end">
                            <p><strong>Total:</strong> <span id="detailCartTotal"></span></p>
                            <p><strong>Total con descuento:</strong> <span id="detailCartDiscountedTotal"></span></p>
                        </div>
                    </div>
                    
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Producto</th>
                                    <th>Precio</th>
                                    <th>Cantidad</th>
                                    <th>Total</th>
                                    <th>Descuento</th>
                                </tr>
                            </thead>
                            <tbody id="detailCartProducts"></tbody>
                        </table>
                    </div>
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

async function deleteCart(cartId) {
    if (!confirm('¿Está seguro que desea eliminar este carrito?')) return;
    
    try {
        
        showAlert(`Carrito ${cartId} eliminado`, 'success');
        
        const response = await getCarts();
        renderCarts(response.carts);
    } catch (error) {
        console.error('Error al eliminar carrito:', error);
        showAlert('Error al eliminar carrito', 'danger');
    }
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

window.viewCartDetails = viewCartDetails;
window.deleteCart = deleteCart;
window.addProductToCartForm = addProductToCartForm;