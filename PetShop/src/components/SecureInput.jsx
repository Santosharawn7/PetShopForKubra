import React, { useState, useEffect } from 'react';
import { sanitizeInput, validateInput } from '../utils/security.js';

const SecureInput = ({
  type = 'text',
  name,
  label,
  placeholder,
  value = '',
  onChange,
  validation = {},
  required = false,
  className = '',
  showValidation = true,
  ...props
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizeInput(rawValue);
    
    setInputValue(sanitizedValue);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
    
    // Call parent onChange with sanitized value
    if (onChange) {
      onChange(sanitizedValue);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    validateInputValue(inputValue);
  };

  const validateInputValue = (value) => {
    if (!touched && !required) return;
    
    // Required validation
    if (required && (!value || value.trim() === '')) {
      setError(`${label || name} is required`);
      return;
    }
    
    // Type-specific validation
    if (value && validation.type) {
      const validator = validateInput[validation.type];
      if (validator && !validator(value)) {
        setError(`Invalid ${label || name} format`);
        return;
      }
    }
    
    // Length validation
    if (value && validation.maxLength && value.length > validation.maxLength) {
      setError(`${label || name} is too long (max ${validation.maxLength} characters)`);
      return;
    }
    
    if (value && validation.minLength && value.length < validation.minLength) {
      setError(`${label || name} is too short (min ${validation.minLength} characters)`);
      return;
    }
    
    // Custom validation
    if (value && validation.custom && !validation.custom(value)) {
      setError(validation.customMessage || `Invalid ${label || name}`);
      return;
    }
    
    setError('');
  };

  const inputClasses = `
    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
    ${error ? 'border-red-500' : 'border-gray-300'}
    ${className}
  `.trim();

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          rows={validation.rows || 3}
          className={inputClasses}
          {...props}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          maxLength={validation.maxLength}
          minLength={validation.minLength}
          className={inputClasses}
          {...props}
        />
      )}
      
      {showValidation && error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {validation.helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{validation.helpText}</p>
      )}
    </div>
  );
};

export default SecureInput;
