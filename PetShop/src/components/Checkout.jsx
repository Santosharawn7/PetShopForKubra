import { useState } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import { FaCreditCard, FaMapMarkerAlt, FaUser, FaPhone, FaHome, FaCity, FaFlag } from 'react-icons/fa';

const Checkout = ({ cartItems, totalPrice, sessionId, onClose, onOrderComplete }) => {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!form.fullName.trim()) errors.fullName = 'Full name is required';
    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    if (!form.address.trim()) errors.address = 'Street address is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.province.trim()) errors.province = 'Province/State is required';
    if (!form.postalCode.trim()) errors.postalCode = 'Postal/ZIP code is required';
    if (!form.country.trim()) errors.country = 'Country is required';
    
    // Basic phone validation
    if (form.phone.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(form.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    // Basic postal code validation
    if (form.postalCode.trim()) {
      const postalCode = form.postalCode.trim().toUpperCase();
      const usZipRegex = /^\d{5}(-\d{4})?$/;
      const caPostalRegex = /^[A-Z]\d[A-Z] \d[A-Z]\d$/;
      
      if (!usZipRegex.test(postalCode) && !caPostalRegex.test(postalCode)) {
        errors.postalCode = 'Please enter a valid postal/ZIP code';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix the validation errors below.');
      return;
    }

    const shipping_address = `
${form.phone}
${form.address}
${form.city}, ${form.province}, ${form.postalCode}
${form.country}`.trim();

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(buildApiUrl('/api/orders'), {
        session_id: sessionId,
        shipping_address,
        buyer_name: form.fullName
      });

      onOrderComplete(response.data);
    } catch (err) {
      console.error('Failed to place order:', err.message);
      setError(err.response?.data?.error || 'Order could not be placed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFieldIcon = (fieldName) => {
    const icons = {
      fullName: FaUser,
      phone: FaPhone,
      address: FaHome,
      city: FaCity,
      province: FaMapMarkerAlt,
      postalCode: FaMapMarkerAlt,
      country: FaFlag
    };
    return icons[fieldName] || FaUser;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                <FaCreditCard className="text-white text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>
                <p className="text-gray-600">Complete your order</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-100 text-red-700 border border-red-400 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {/* Order Summary */}
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaCreditCard className="text-blue-500" />
              Order Summary
            </h3>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.image_url || "https://via.placeholder.com/60x60?text=Product"}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-800">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    ${totalPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="inline mr-2 text-gray-500" />
                  Full Name *
                </label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    validationErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaPhone className="inline mr-2 text-gray-500" />
                  Phone Number *
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaFlag className="inline mr-2 text-gray-500" />
                  Country *
                </label>
                <select
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    validationErrors.country ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select Country</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Other">Other</option>
                </select>
                {validationErrors.country && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.country}</p>
                )}
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaHome className="inline mr-2 text-gray-500" />
                  Street Address *
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="123 Main Street, Apt 4B"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    validationErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.address && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCity className="inline mr-2 text-gray-500" />
                  City *
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="New York"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    validationErrors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.city && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                )}
              </div>

              {/* Province/State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline mr-2 text-gray-500" />
                  Province/State *
                </label>
                <input
                  name="province"
                  value={form.province}
                  onChange={handleChange}
                  placeholder="NY or New York"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    validationErrors.province ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.province && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.province}</p>
                )}
              </div>

              {/* Postal Code */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline mr-2 text-gray-500" />
                  Postal/ZIP Code *
                </label>
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="10001 or K1A 0A6"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    validationErrors.postalCode ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.postalCode && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.postalCode}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                  loading
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Placing Order...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <FaCreditCard />
                    Place Order - ${totalPrice}
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;