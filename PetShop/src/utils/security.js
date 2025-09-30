// OWASP Security Utilities
// Implements OWASP security best practices (excluding authentication)

// Input Validation and Sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

// XSS Protection - Escape HTML entities
export const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return unsafe;
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Input validation for common data types
export const validateInput = {
  // Email validation
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },
  
  // Phone number validation
  phone: (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },
  
  // Price validation
  price: (price) => {
    const num = parseFloat(price);
    return !isNaN(num) && num >= 0 && num <= 999999.99;
  },
  
  // Stock validation
  stock: (stock) => {
    const num = parseInt(stock);
    return !isNaN(num) && num >= 0 && num <= 999999;
  },
  
  // Text length validation
  text: (text, maxLength = 1000) => {
    return typeof text === 'string' && text.length <= maxLength;
  },
  
  // URL validation
  url: (url) => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
};

// CSRF Protection - Generate and validate tokens
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Rate Limiting
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }
  
  isAllowed(identifier) {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  reset(identifier) {
    this.requests.delete(identifier);
  }
}

// SQL Injection Prevention - Parameterized queries helper
export const sanitizeForSQL = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove SQL injection patterns
  return input
    .replace(/[';]/g, '') // Remove single quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .replace(/union/gi, '') // Remove UNION keywords
    .replace(/select/gi, '') // Remove SELECT keywords
    .replace(/insert/gi, '') // Remove INSERT keywords
    .replace(/update/gi, '') // Remove UPDATE keywords
    .replace(/delete/gi, '') // Remove DELETE keywords
    .replace(/drop/gi, '') // Remove DROP keywords
    .trim();
};

// Content Security Policy helper
export const getCSPHeader = () => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  };
};

// Secure headers
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    ...getCSPHeader()
  };
};

// Input sanitization for form data
export const sanitizeFormData = (formData) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'number') {
      sanitized[key] = isNaN(value) ? 0 : value;
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// File upload security
export const validateFileUpload = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'], maxSize = 5 * 1024 * 1024) => {
  if (!file) return { valid: false, error: 'No file provided' };
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }
  
  return { valid: true };
};

// Secure random string generation
export const generateSecureRandom = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Session security
export const createSecureSession = () => {
  return {
    id: generateSecureRandom(32),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    csrfToken: generateCSRFToken()
  };
};

// Validate session
export const validateSession = (session, maxAge = 24 * 60 * 60 * 1000) => {
  if (!session) return false;
  
  const now = Date.now();
  const age = now - session.createdAt;
  
  return age < maxAge;
};
