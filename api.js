async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`https://dummyjson.com${endpoint}`, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la solicitud');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function getUsers() {
    return apiRequest('/users');
}

export async function getUserById(id) {
    return apiRequest(`/users/${id}`);
}

export async function addUser(userData) {
    return apiRequest('/users/add', 'POST', userData);
}

export async function getProducts() {
    return apiRequest('/products');
}

export async function getProductById(id) {
    return apiRequest(`/products/${id}`);
}

export async function searchProducts(query) {
    return apiRequest(`/products/search?q=${query}`);
}

export async function addProduct(productData) {
    return apiRequest('/products/add', 'POST', productData);
}

export async function getCarts() {
    return apiRequest('/carts');
}

export async function getCartById(id) {
    return apiRequest(`/carts/${id}`);
}

export async function addCart(cartData) {
    return apiRequest('/carts/add', 'POST', cartData);
}

export async function login(username, password) {
    return apiRequest('/auth/login', 'POST', { username, password });
}