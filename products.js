import { getProducts, getProductById, addProduct, searchProducts as apiSearchProducts } from './api.js';

let allProducts = [];
let currentPage = 1;
const productsPerPage = 9;

document.addEventListener('DOMContentLoaded', async function() {
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap no está cargado. Asegúrate de incluir Bootstrap JS en tu HTML.');
        return;
    }

    try {
        const response = await getProducts();
        allProducts = response.products;
        renderProducts(getPaginatedProducts());
        
        document.getElementById('searchProductBtn').addEventListener('click', handleSearch);
        document.getElementById('searchProduct').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleSearch();
        });
        
        document.getElementById('saveProductBtn').addEventListener('click', saveProduct);
        
        document.getElementById('prevPageBtn')?.addEventListener('click', goToPrevPage);
        document.getElementById('nextPageBtn')?.addEventListener('click', goToNextPage);
        
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showAlert('Error al cargar productos', 'danger');
    }
});

function getPaginatedProducts() {
    const startIndex = (currentPage - 1) * productsPerPage;
    return allProducts.slice(startIndex, startIndex + productsPerPage);
}

function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><h4>No se encontraron productos</h4></div>';
        return;
    }
    
    products.forEach(product => {
        const discountPrice = product.price * (1 - product.discountPercentage / 100);
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card h-100 product-card">
                <div class="badge bg-dark text-white position-absolute" style="top: 0.5rem; right: 0.5rem">
                    ${product.discountPercentage}% OFF
                </div>
                <img src="${product.thumbnail}" class="card-img-top product-img" alt="${product.title}" 
                     style="height: 200px; object-fit: contain; background: #f5f5f5; padding: 10px;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.title}</h5>
                    <p class="card-text text-muted">${product.brand}</p>
                    <p class="card-text text-truncate">${product.description}</p>
                    <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="text-decoration-line-through text-muted me-2">$${product.price.toFixed(2)}</span>
                                <span class="text-success fw-bold">$${discountPrice.toFixed(2)}</span>
                            </div>
                            <span class="badge bg-${product.stock > 0 ? 'primary' : 'danger'}">
                                ${product.stock > 0 ? `Stock: ${product.stock}` : 'Agotado'}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-white d-flex justify-content-between">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewProductDetails(${product.id})">
                        <i class="bi bi-eye"></i> Detalles
                    </button>
                    <button class="btn btn-sm btn-success" onclick="addToCart(${product.id})" ${product.stock <= 0 ? 'disabled' : ''}>
                        <i class="bi bi-cart-plus"></i> Agregar
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    updatePaginationControls();
}

function updatePaginationControls() {
    const totalPages = Math.ceil(allProducts.length / productsPerPage);
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (paginationInfo) {
        paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderProducts(getPaginatedProducts());
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(allProducts.length / productsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderProducts(getPaginatedProducts());
    }
}

async function handleSearch() {
    const searchTerm = document.getElementById('searchProduct').value.trim();
    
    if (searchTerm === '') {
        const response = await getProducts();
        allProducts = response.products;
        currentPage = 1;
        renderProducts(getPaginatedProducts());
        return;
    }
    
    try {
        const response = await apiSearchProducts(searchTerm);
        allProducts = response.products;
        currentPage = 1;
        renderProducts(getPaginatedProducts());
    } catch (error) {
        console.error('Error al buscar productos:', error);
        showAlert('Error al buscar productos', 'danger');
    }
}

async function saveProduct() {
    const productData = {
        title: document.getElementById('productTitle').value,
        brand: document.getElementById('productBrand').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        discountPercentage: parseFloat(document.getElementById('productDiscount').value) || 0,
        stock: parseInt(document.getElementById('productStock').value),
        category: document.getElementById('productCategory').value,
        thumbnail: document.getElementById('productThumbnail').value,
    };
    
    if (!productData.title || !productData.price || !productData.stock) {
        showAlert('Por favor complete los campos requeridos', 'warning');
        return;
    }
    
    try {
        const newProduct = await addProduct(productData);
        showAlert('Producto agregado correctamente', 'success');
        
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
        document.getElementById('addProductForm').reset();
        
        const response = await getProducts();
        allProducts = response.products;
        currentPage = 1;
        renderProducts(getPaginatedProducts());
    } catch (error) {
        console.error('Error al guardar producto:', error);
        showAlert(error.message || 'Error al guardar producto', 'danger');
    }
}

async function viewProductDetails(productId) {
    try {
        const product = await getProductById(productId);
        const discountPrice = product.price * (1 - product.discountPercentage / 100);
        
        const modal = new bootstrap.Modal(document.getElementById('productDetailModal') || createDetailModal());
        
        document.getElementById('detailProductTitle').textContent = product.title;
        document.getElementById('detailProductBrand').textContent = product.brand;
        document.getElementById('detailProductCategory').textContent = product.category;
        document.getElementById('detailProductDescription').textContent = product.description;
        document.getElementById('detailProductPrice').innerHTML = `
            <span class="text-decoration-line-through text-muted me-2">$${product.price.toFixed(2)}</span>
            <span class="text-success fw-bold fs-4">$${discountPrice.toFixed(2)}</span>
            <span class="badge bg-danger ms-2">${product.discountPercentage}% OFF</span>
        `;
        document.getElementById('detailProductStock').textContent = product.stock;
        document.getElementById('detailProductRating').textContent = `${product.rating} (${product.reviews || 0} reviews)`;
        
        const imagesContainer = document.getElementById('detailProductImages');
        imagesContainer.innerHTML = '';
        
        const mainImg = document.createElement('img');
        mainImg.src = product.thumbnail;
        mainImg.className = 'img-fluid rounded mb-3';
        mainImg.alt = product.title;
        mainImg.style.maxHeight = '300px';
        imagesContainer.appendChild(mainImg);
        
        const gallery = document.createElement('div');
        gallery.className = 'd-flex flex-wrap gap-2';
        
        product.images.forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = img;
            thumb.className = 'img-thumbnail';
            thumb.style.height = '80px';
            thumb.style.cursor = 'pointer';
            thumb.onclick = () => mainImg.src = img;
            gallery.appendChild(thumb);
        });
        
        imagesContainer.appendChild(gallery);
        
        const addBtn = document.getElementById('addToCartFromDetailBtn');
        addBtn.setAttribute('data-product-id', productId);
        addBtn.onclick = () => addToCart(productId);
        
        modal.show();
        
    } catch (error) {
        console.error('Error al obtener detalles del producto:', error);
        showAlert('Error al obtener detalles del producto', 'danger');
    }
}

function createDetailModal() {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal fade';
    modalDiv.id = 'productDetailModal';
    modalDiv.tabIndex = '-1';
    modalDiv.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="detailProductTitle"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div id="detailProductImages"></div>
                        </div>
                        <div class="col-md-6">
                            <p class="text-muted mb-1">
                                Marca: <span id="detailProductBrand"></span>
                            </p>
                            <p class="text-muted mb-1">
                                Categoría: <span id="detailProductCategory"></span>
                            </p>
                            <div class="my-3" id="detailProductPrice"></div>
                            <p class="mb-2"><strong>Descripción:</strong></p>
                            <p id="detailProductDescription"></p>
                            <div class="d-flex gap-4 mt-3">
                                <div>
                                    <strong>Stock:</strong> 
                                    <span id="detailProductStock"></span>
                                </div>
                                <div>
                                    <strong>Rating:</strong> 
                                    <span id="detailProductRating"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    <button type="button" class="btn btn-primary" id="addToCartFromDetailBtn">Agregar al carrito</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalDiv);
    return modalDiv;
}

async function addToCart(productId) {
    try {        
        showAlert('Producto agregado al carrito', 'success');
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        showAlert('Error al agregar al carrito', 'danger');
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

// Exportar funciones al ámbito global
window.viewProductDetails = viewProductDetails;
window.addToCart = addToCart;