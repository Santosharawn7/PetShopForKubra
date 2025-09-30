import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import { FaSearch, FaShoppingCart, FaPlus, FaChartBar, FaStore } from 'react-icons/fa';
import { MdPets } from 'react-icons/md';
import ModeToggle from './ModeToggle';

const Header = ({
  onSearch,
  onCategoryChange,
  cartItemCount,
  onCartClick,
  onAddProductClick,
  mode,
  onModeChange,
}) => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState(['All Categories']);
  
  // Determine if we're on dashboard or shop page
  const isDashboard = location.pathname.includes('/dashboard');
  const isShop = location.pathname === '/shop' || location.pathname === '/';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(buildApiUrl('/api/categories'));
      setCategories(['All Categories', ...response.data]);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  // Dynamic header colors based on page and mode
  const getHeaderColors = () => {
    if (isDashboard) {
      // Dashboard gets green colors for seller mode
      return mode === 'seller' 
        ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600'
        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600';
    } else {
      // Shop gets blue colors for buyer mode
      return mode === 'buyer'
        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'
        : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600';
    }
  };

  return (
    <header className={`${getHeaderColors()} text-white shadow-2xl sticky top-0 z-40`}>
      <div className="container mx-auto px-4 py-6">
        {/* Top row with logo, buttons */}
        <div className="flex items-center justify-between mb-6">
          <a 
            href={mode === 'seller' ? "/shop/dashboard" : "/shop"} 
            className="flex items-center gap-3 group"
          >
            <div className="p-2 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
              <FaStore className="text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                🐾 Pet Paradise Store
              </h1>
              <p className="text-sm text-purple-100">
                {mode === 'seller' ? 'Your seller dashboard' : 'Your one-stop pet shop'}
              </p>
            </div>
          </a>
          
          <div className="flex items-center gap-4">
            {/* Mode Toggle */}
            <ModeToggle mode={mode} onModeChange={onModeChange} />
            
            {/* Add Product Button - only show in seller mode or on dashboard */}
            {(mode === 'seller' || isDashboard) && (
              <button
                onClick={onAddProductClick}
                className="group flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <FaPlus className="text-lg group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Add Product</span>
              </button>
            )}
            
            {/* Dashboard Button */}
            <a
              href="/shop/dashboard"
              className="group flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <FaChartBar className="text-lg group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">
                {mode === 'seller' ? 'Dashboard' : 'Purchase History'}
              </span>
            </a>
            
            {/* Cart Button - only show in buyer mode or on shop page */}
            {(mode === 'buyer' || isShop) && (
              <button
                onClick={onCartClick}
                className="group relative flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <FaShoppingCart className="text-lg group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden sm:inline">Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                    {cartItemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Search + Categories */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for pet products..."
                className="w-full pl-12 pr-4 py-4 rounded-l-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-lg"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 rounded-r-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <span className="hidden sm:inline">Search</span>
              <FaSearch className="sm:hidden" />
            </button>
          </form>

          {/* Category Filter */}
          <div className="relative">
            <select
              onChange={(e) =>
                onCategoryChange(e.target.value === 'All Categories' ? '' : e.target.value)
              }
              className="appearance-none bg-white text-gray-900 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer min-w-[200px]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-8 right-8 w-6 h-6 bg-yellow-300/20 rounded-full animate-bounce"></div>
          <div className="absolute bottom-4 left-1/4 w-4 h-4 bg-pink-300/20 rounded-full animate-ping"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;