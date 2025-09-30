import axios from 'axios';
import { sanitizeInput, escapeHtml, validateInput, generateCSRFToken, sanitizeForSQL, sanitizeFormData } from './security.js';

// Create secure axios instance
const secureApi = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Request interceptor for input sanitization
secureApi.interceptors.request.use(
  (config) => {
    // Sanitize URL parameters
    if (config.params) {
      const sanitizedParams = {};
      for (const [key, value] of Object.entries(config.params)) {
        sanitizedParams[key] = sanitizeInput(String(value));
      }
      config.params = sanitizedParams;
    }
    
    // Sanitize request data
    if (config.data) {
      if (typeof config.data === 'object') {
        config.data = sanitizeFormData(config.data);
      } else if (typeof config.data === 'string') {
        config.data = sanitizeInput(config.data);
      }
    }
    
    // Add CSRF token if available
    const csrfToken = localStorage.getItem('csrfToken');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for security validation
secureApi.interceptors.response.use(
  (response) => {
    // Validate response content type
    const contentType = response.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      console.warn('Unexpected content type:', contentType);
    }
    
    // Sanitize response data if it's a string
    if (typeof response.data === 'string') {
      response.data = escapeHtml(response.data);
    }
    
    return response;
  },
  (error) => {
    // Log security-related errors
    if (error.response?.status === 403) {
      console.warn('Access forbidden - possible security violation');
    } else if (error.response?.status === 429) {
      console.warn('Rate limit exceeded');
    }
    
    return Promise.reject(error);
  }
);

// Secure API methods
export const secureApiMethods = {
  // Secure GET request
  get: async (url, params = {}) => {
    try {
      const response = await secureApi.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('Secure GET error:', error);
      throw error;
    }
  },
  
  // Secure POST request
  post: async (url, data = {}) => {
    try {
      const sanitizedData = sanitizeFormData(data);
      const response = await secureApi.post(url, sanitizedData);
      return response.data;
    } catch (error) {
      console.error('Secure POST error:', error);
      throw error;
    }
  },
  
  // Secure PUT request
  put: async (url, data = {}) => {
    try {
      const sanitizedData = sanitizeFormData(data);
      const response = await secureApi.put(url, sanitizedData);
      return response.data;
    } catch (error) {
      console.error('Secure PUT error:', error);
      throw error;
    }
  },
  
  // Secure DELETE request
  delete: async (url) => {
    try {
      const response = await secureApi.delete(url);
      return response.data;
    } catch (error) {
      console.error('Secure DELETE error:', error);
      throw error;
    }
  }
};

// Form validation helper
export const validateForm = (formData, rules = {}) => {
  const errors = {};
  
  for (const [field, value] of Object.entries(formData)) {
    const rule = rules[field];
    if (!rule) continue;
    
    if (rule.required && (!value || value.trim() === '')) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    if (value && rule.type) {
      const validator = validateInput[rule.type];
      if (validator && !validator(value)) {
        errors[field] = `Invalid ${field} format`;
      }
    }
    
    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${field} is too long (max ${rule.maxLength} characters)`;
    }
    
    if (value && rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field} is too short (min ${rule.minLength} characters)`;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Secure file upload
export const secureFileUpload = async (file, uploadUrl, options = {}) => {
  const { validateFileUpload } = await import('./security.js');
  
  const validation = validateFileUpload(file, options.allowedTypes, options.maxSize);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await secureApi.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Secure file upload error:', error);
    throw error;
  }
};

// Initialize CSRF token
export const initializeCSRF = () => {
  const existingToken = localStorage.getItem('csrfToken');
  if (!existingToken) {
    const token = generateCSRFToken();
    localStorage.setItem('csrfToken', token);
  }
};

export default secureApi;
