import React, { useEffect, useState } from "react";
import axios from "axios";
import { buildApiUrl } from "../config/api";
import { FaChartBar, FaShoppingCart, FaStar, FaComments, FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { MdPets, MdTrendingUp, MdTrendingDown } from "react-icons/md";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeProductId, setActiveProductId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image_url: ''
  });
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalComments: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(buildApiUrl("/api/admin/dashboard"));
      setProducts(response.data);
      
      // Calculate stats
      const totalProducts = response.data.length;
      const totalSales = response.data.reduce((sum, p) => sum + p.sold, 0);
      const totalRevenue = response.data.reduce((sum, p) => {
        return sum + (p.buyers.reduce((buyerSum, buyer) => buyerSum + (buyer.price_paid * buyer.quantity), 0));
      }, 0);
      
      setStats({
        totalProducts,
        totalSales,
        totalRevenue,
        averageRating: 0, // Will be calculated from individual product ratings
        totalComments: 0 // Will be calculated from individual product comments
      });
      
      setError(null);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const toggleDrawer = (productId) => {
    setActiveProductId((prevId) => (prevId === productId ? null : productId));
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.title || '',
      description: product.description || '',
      price: product.price || '',
      stock: product.stock || '',
      category: product.category || '',
      image_url: product.image_url || ''
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    try {
      const response = await axios.put(
        buildApiUrl(`/api/products/${editingProduct.id}`),
        editForm
      );
      
      if (response.data.message) {
        // Refresh dashboard data
        await fetchDashboardData();
        setEditingProduct(null);
        setEditForm({
          name: '',
          description: '',
          price: '',
          stock: '',
          category: '',
          image_url: ''
        });
        alert('Product updated successfully!');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      image_url: ''
    });
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(buildApiUrl(`/api/products/${productId}`));
        fetchDashboardData(); // Refresh data
        alert("Product deleted successfully!");
      } catch (err) {
        console.error("Error deleting product:", err);
        alert("Failed to delete product");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-300 via-indigo-200 to-pink-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-300 via-indigo-200 to-pink-200 flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-300 via-indigo-200 to-pink-200 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
              <FaChartBar className="text-3xl text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                📊 Inventory Dashboard
              </h1>
              <p className="text-gray-600">Manage your pet product inventory and track sales</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Products</p>
                  <p className="text-3xl font-bold">{stats.totalProducts}</p>
                </div>
                <MdPets className="text-4xl text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Sales</p>
                  <p className="text-3xl font-bold">{stats.totalSales}</p>
                </div>
                <FaShoppingCart className="text-4xl text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <MdTrendingUp className="text-4xl text-yellow-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avg Sentiment</p>
                  <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                </div>
                <FaStar className="text-4xl text-purple-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Product Inventory</h2>
            <p className="text-gray-600">Click "View Buyers" to see detailed purchase information</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <MdPets className="text-6xl text-gray-300 mx-auto mb-4" />
                      <p className="text-lg font-semibold">No products uploaded yet</p>
                      <p className="text-sm">Upload your first product to get started!</p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => {
                    const productRevenue = product.buyers.reduce((sum, buyer) => 
                      sum + (buyer.price_paid * buyer.quantity), 0
                    );
                    
                    return (
                      <React.Fragment key={product.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <img
                                src={product.image_url || "https://via.placeholder.com/100x100?text=Product"}
                                alt={product.title}
                                className="w-16 h-16 object-cover rounded-lg shadow-md"
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {product.id}
                                </div>
                                {/* Sentiment Score Display */}
                                {product.rating_stats && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-gray-600">Sentiment:</span>
                                    <div className="flex items-center gap-1">
                                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                                        <div 
                                          className={`h-1.5 rounded-full ${
                                            product.rating_stats.average_sentiment >= 7 ? 'bg-green-500' :
                                            product.rating_stats.average_sentiment >= 5 ? 'bg-yellow-500' :
                                            'bg-red-500'
                                          }`}
                                          style={{ width: `${(product.rating_stats.average_sentiment / 10) * 100}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs font-semibold text-gray-700">
                                        {product.rating_stats.average_sentiment?.toFixed(1) || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.stock === 0 
                                ? 'bg-red-100 text-red-800' 
                                : product.stock < 10 
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {product.sold}
                              </span>
                              {product.sold > 0 && (
                                <MdTrendingUp className="ml-2 text-green-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-900">
                              ${productRevenue.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleDrawer(product.id)}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                              >
                                {activeProductId === product.id ? "Hide Buyers" : "View Buyers"}
                              </button>
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="text-green-600 hover:text-green-800 p-1 rounded transition-colors"
                                title="Edit Product"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                                title="Delete Product"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expandable Buyers Row */}
                        {activeProductId === product.id && (
                          <tr>
                            <td colSpan="5" className="px-6 py-4 bg-gray-50">
                              <div className="bg-white rounded-lg shadow-sm border p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                  <FaComments className="text-blue-500" />
                                  🧾 Buyers for {product.title}
                                </h3>
                                
                                {product.buyers.length === 0 ? (
                                  <div className="text-center py-8 text-gray-500">
                                    <FaShoppingCart className="text-4xl text-gray-300 mx-auto mb-2" />
                                    <p>No purchases yet</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                      <thead>
                                        <tr className="text-left bg-gray-100">
                                          <th className="px-3 py-2 font-medium text-gray-700">Buyer Name</th>
                                          <th className="px-3 py-2 font-medium text-gray-700">Product</th>
                                          <th className="px-3 py-2 font-medium text-gray-700">Quantity</th>
                                          <th className="px-3 py-2 font-medium text-gray-700">Unit Price</th>
                                          <th className="px-3 py-2 font-medium text-gray-700">Total Paid</th>
                                          <th className="px-3 py-2 font-medium text-gray-700">Payment</th>
                                          <th className="px-3 py-2 font-medium text-gray-700">Phone</th>
                                          <th className="px-3 py-2 font-medium text-gray-700">Location</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {product.buyers.map((buyer, idx) => (
                                          <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                                            <td className="px-3 py-2 font-medium text-gray-900">
                                              {buyer.buyer_name || 'Anonymous'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                              {buyer.product_name}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                              <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                                                {buyer.quantity}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                              ${buyer.price_paid.toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 font-medium text-green-600">
                                              ${(buyer.price_paid * buyer.quantity).toFixed(2)}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                              <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                                                {buyer.payment_method}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                              {buyer.phone_number || 'N/A'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700 whitespace-pre-line">
                                              {buyer.location || 'N/A'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={editForm.price}
                    onChange={handleEditFormChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={editForm.stock}
                    onChange={handleEditFormChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={editForm.category}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  name="image_url"
                  value={editForm.image_url}
                  onChange={handleEditFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}