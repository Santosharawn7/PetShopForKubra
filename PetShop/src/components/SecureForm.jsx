import React, { useState } from 'react';
import { validateForm } from '../utils/secureApi.js';
import { sanitizeInput } from '../utils/security.js';

const SecureForm = ({ 
  fields = [], 
  onSubmit, 
  submitText = 'Submit',
  className = '',
  showValidation = true 
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (fieldName, value) => {
    // Sanitize input in real-time
    const sanitizedValue = sanitizeInput(value);
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: sanitizedValue
    }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate form data
      const validation = validateForm(formData, fields.reduce((acc, field) => {
        acc[field.name] = field.validation || {};
        return acc;
      }, {}));
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }
      
      // Submit form
      await onSubmit(formData);
      
      // Reset form on success
      setFormData({});
      setErrors({});
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: error.message || 'Submission failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const { name, type, label, placeholder, validation = {}, options = [] } = field;
    const value = formData[name] || '';
    const error = errors[name];
    
    const inputProps = {
      id: name,
      name,
      value,
      onChange: (e) => handleInputChange(name, e.target.value),
      placeholder: placeholder || label,
      className: `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        error ? 'border-red-500' : 'border-gray-300'
      }`,
      required: validation.required || false,
      maxLength: validation.maxLength || undefined,
      minLength: validation.minLength || undefined
    };

    return (
      <div key={name} className="mb-4">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {validation.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {type === 'textarea' ? (
          <textarea
            {...inputProps}
            rows={validation.rows || 3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        ) : type === 'select' ? (
          <select
            {...inputProps}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select {label}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            {...inputProps}
            type={type}
          />
        )}
        
        {showValidation && error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {fields.map(renderField)}
      
      {errors.submit && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.submit}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          isSubmitting
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isSubmitting ? 'Submitting...' : submitText}
      </button>
    </form>
  );
};

export default SecureForm;
