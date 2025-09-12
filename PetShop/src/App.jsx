import { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import ItemUploader from './components/ItemUploader';
import ItemProductList from './components/ItemProductList';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Dashboard from './components/Dashboard';
import ProductDetail from './components/ProductDetail';
import { getSessionId } from './utils/sessionId';
import { buildApiUrl } from './config/api';

function App() {
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState('0.00');
  const [sessionId] = useState(getSessionId());
  const [orderComplete, setOrderComplete] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showUploader, setShowUploader] = useState(false);

  useEffect(() => {
    fetchCartCount();
    // eslint-disable-next-line
  }, [sessionId]);

  const fetchCartCount = async () => {
    try {
      const response = await axios.get(buildApiUrl(`/api/cart/${sessionId}`));
      setCartItemCount(response.data.length);
    } catch (err) {
      console.warn('Backend not available:', err.message);
      setCartItemCount(0);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await axios.post(buildApiUrl('/api/cart'), {
        product_id: product.id,
        quantity: 1,
        session_id: sessionId,
      });
      fetchCartCount();
      alert(`${product.name} added to cart!`);
    } catch (err) {
      console.warn('Failed to add to cart:', err.message);
      alert('Failed to add item to cart.');
    }
  };

  const handleSearch = (term) => setSearchTerm(term);
  const handleCategoryChange = (cat) => setCategory(cat);
  const handleCartClick = () => setShowCart(true);
  const handleCloseCart = () => setShowCart(false);

  const handleCheckout = (items, total) => {
    setCartItems(items);
    setTotalPrice(total);
    setShowCart(false);
    setShowCheckout(true);
  };

  const handleCloseCheckout = () => setShowCheckout(false);

  const handleOrderComplete = (order) => {
    setOrderComplete(order);
    setShowCheckout(false);
    fetchCartCount();
    setTimeout(() => {
      alert(`Order placed successfully! Order ID: ${order.id}`);
      setOrderComplete(null);
    }, 100);
  };

  const handleRefreshInventory = () => {
    setRefreshKey((prev) => prev + 1);
    setShowUploader(false);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-purple-300 via-indigo-200 to-pink-200">
        <Header
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          cartItemCount={cartItemCount}
          onCartClick={handleCartClick}
          onAddProductClick={() => setShowUploader(true)}
        />

        <main className="container mx-auto px-4 py-8 relative z-10">
          <Routes>
            {/* Redirect '/' and all unknown routes to '/shop' */}
            <Route path="/" element={<Navigate to="/shop" replace />} />
            <Route path="*" element={<Navigate to="/shop" replace />} />

            {/* Home page */}
            <Route
              path="/shop"
              element={
                <>
                  <div className="mb-6 mt-6">
                    {category && (
                      <p className="text-lg text-white/90 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl inline-block">
                        Category: <span className="font-semibold text-yellow-200">{category}</span>
                      </p>
                    )}
                    {searchTerm && (
                      <p className="text-lg text-white/90 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl inline-block">
                        Search results for: <span className="font-semibold text-yellow-200">"{searchTerm}"</span>
                      </p>
                    )}
                  </div>

                  <ItemProductList
                    key={refreshKey}
                    category={category}
                    searchTerm={searchTerm}
                    onAddToCart={handleAddToCart}
                  />
                </>
              }
            />

            {/* Dashboard page */}
            <Route path="/shop/dashboard" element={<Dashboard />} />
            
            {/* Product Detail page */}
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/shop/products/:id" element={<ProductDetail />} />
            {/* Add more shop subroutes as needed */}
          </Routes>
        </main>

        {showCart && (
          <Cart
            sessionId={sessionId}
            onClose={handleCloseCart}
            onCheckout={handleCheckout}
          />
        )}

        {showCheckout && (
          <Checkout
            cartItems={cartItems}
            totalPrice={totalPrice}
            sessionId={sessionId}
            onClose={handleCloseCheckout}
            onOrderComplete={handleOrderComplete}
          />
        )}

        {showUploader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
              <button
                onClick={() => setShowUploader(false)}
                className="absolute top-3 right-4 text-gray-600 hover:text-black text-2xl"
              >
                &times;
              </button>
              <ItemUploader onProductUpload={handleRefreshInventory} />
            </div>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
