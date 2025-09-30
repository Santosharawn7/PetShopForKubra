import { useState } from 'react';
import axios from 'axios';
import { buildApiUrl, secureApi } from '../config/api';
import SecureInput from './SecureInput';

const ItemUploader = ({ onProductUpload }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '',
    stock: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await axios.post(
        buildApiUrl('/api/upload-item'),
        {
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10)
        }
      );

      setMessage('Item uploaded successfully!');
      setFormData({
        name: '',
        description: '',
        price: '',
        image_url: '',
        category: '',
        stock: ''
      });

      if (onProductUpload) onProductUpload();
    } catch (err) {
      console.error(err);
      setError('Failed to upload item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Add New Product</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SecureInput
            type="text"
            name="name"
            label="Product Name"
            value={formData.name}
            onChange={(value) => handleChange('name', value)}
            placeholder="Enter product name"
            required
            validation={{
              type: 'text',
              maxLength: 100,
              minLength: 2
            }}
          />
          <SecureInput
            type="text"
            name="category"
            label="Category"
            value={formData.category}
            onChange={(value) => handleChange('category', value)}
            placeholder="Enter category"
            validation={{
              type: 'text',
              maxLength: 50
            }}
          />
          <SecureInput
            type="number"
            name="price"
            label="Price ($)"
            value={formData.price}
            onChange={(value) => handleChange('price', value)}
            placeholder="0.00"
            required
            validation={{
              type: 'price',
              min: 0,
              max: 999999.99
            }}
          />
          <SecureInput
            type="number"
            name="stock"
            label="Stock Quantity"
            value={formData.stock}
            onChange={(value) => handleChange('stock', value)}
            placeholder="0"
            required
            validation={{
              type: 'stock',
              min: 0,
              max: 999999
            }}
          />
        </div>
        <SecureInput
          type="url"
          name="image_url"
          label="Image URL"
          value={formData.image_url}
          onChange={(value) => handleChange('image_url', value)}
          placeholder="https://example.com/image.jpg"
          validation={{
            type: 'url'
          }}
        />
        <SecureInput
          type="textarea"
          name="description"
          label="Description"
          value={formData.description}
          onChange={(value) => handleChange('description', value)}
          placeholder="Enter product description"
          validation={{
            type: 'text',
            maxLength: 1000
          }}
        />
        <button
          type="submit"
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload Product'}
        </button>
      </form>
      {message && <p className="text-green-600 mt-3">{message}</p>}
      {error && <p className="text-red-500 mt-3">{error}</p>}
    </div>
  );
};

export default ItemUploader;
