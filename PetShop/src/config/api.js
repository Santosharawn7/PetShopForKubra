// Secure API configuration with OWASP compliance
import axios from 'axios';
import { secureApiMethods, initializeCSRF } from '../utils/secureApi.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    products: '/api/products',
    product: (id) => `/api/products/${id}`,
    categories: '/api/categories',
    cart: (sessionId) => `/api/cart/${sessionId}`,
    addToCart: '/api/cart',
    updateCartItem: (itemId) => `/api/cart/${itemId}`,
    removeCartItem: (itemId) => `/api/cart/${itemId}`,
    orders: '/api/orders',
    dashboard: '/api/admin/dashboard',
    ratingStats: (id) => `/api/products/${id}/rating-stats`
  }
};

// Secure API methods with OWASP compliance
export const secureApi = {
  // Get products with input validation
  getProducts: async (params = {}) => {
    const sanitizedParams = {};
    if (params.category) sanitizedParams.category = params.category;
    if (params.search) sanitizedParams.search = params.search;
    
    const response = await axios.get(buildApiUrl(apiConfig.endpoints.products), { params: sanitizedParams });
    return response.data;
  },
  
  // Get single product
  getProduct: async (id) => {
    if (!id || isNaN(parseInt(id))) {
      throw new Error('Invalid product ID');
    }
    const response = await axios.get(buildApiUrl(apiConfig.endpoints.product(id)));
    return response.data;
  },
  
  // Get categories
  getCategories: async () => {
    const response = await axios.get(buildApiUrl(apiConfig.endpoints.categories));
    return response.data;
  },
  
  // Get cart items
  getCart: async (sessionId) => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Invalid session ID');
    }
    const response = await axios.get(buildApiUrl(apiConfig.endpoints.cart(sessionId)));
    return response.data;
  },
  
  // Add to cart with validation
  addToCart: async (productId, quantity = 1, sessionId) => {
    if (!productId || isNaN(parseInt(productId))) {
      throw new Error('Invalid product ID');
    }
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('Invalid session ID');
    }
    if (quantity < 1 || quantity > 99) {
      throw new Error('Invalid quantity');
    }
    
    const response = await axios.post(buildApiUrl(apiConfig.endpoints.addToCart), {
      product_id: parseInt(productId),
      quantity: parseInt(quantity),
      session_id: sessionId
    });
    return response.data;
  },
  
  // Update cart item
  updateCartItem: async (itemId, quantity) => {
    if (!itemId || isNaN(parseInt(itemId))) {
      throw new Error('Invalid item ID');
    }
    if (quantity < 0 || quantity > 99) {
      throw new Error('Invalid quantity');
    }
    
    const response = await axios.put(buildApiUrl(apiConfig.endpoints.updateCartItem(itemId)), {
      quantity: parseInt(quantity)
    });
    return response.data;
  },
  
  // Remove cart item
  removeCartItem: async (itemId) => {
    if (!itemId || isNaN(parseInt(itemId))) {
      throw new Error('Invalid item ID');
    }
    const response = await axios.delete(buildApiUrl(apiConfig.endpoints.removeCartItem(itemId)));
    return response.data;
  },
  
  // Create order with validation
  createOrder: async (orderData) => {
    const requiredFields = ['session_id', 'shipping_address', 'buyer_name'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        throw new Error(`${field} is required`);
      }
    }
    
    const response = await axios.post(buildApiUrl(apiConfig.endpoints.orders), orderData);
    return response.data;
  },
  
  // Get dashboard data
  getDashboard: async () => {
    const response = await axios.get(buildApiUrl(apiConfig.endpoints.dashboard));
    return response.data;
  },
  
  // Get rating stats
  getRatingStats: async (productId) => {
    if (!productId || isNaN(parseInt(productId))) {
      throw new Error('Invalid product ID');
    }
    const response = await axios.get(buildApiUrl(apiConfig.endpoints.ratingStats(productId)));
    return response.data;
  }
};

// Initialize security features
export const initializeSecurity = () => {
  initializeCSRF();
};

// Helper function to build full URL
export const buildApiUrl = (endpoint) => {
  return `${apiConfig.baseURL}${endpoint}`;
};
