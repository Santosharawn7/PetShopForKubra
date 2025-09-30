import React from 'react';
import { FaShoppingCart, FaStore, FaUser, FaCog } from 'react-icons/fa';

const ModeToggle = ({ mode, onModeChange }) => {
  return (
    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl p-1">
      <button
        onClick={() => onModeChange('buyer')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
          mode === 'buyer'
            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg'
            : 'text-white/80 hover:text-white hover:bg-white/10'
        }`}
      >
        <FaShoppingCart className="text-sm" />
        <span className="hidden sm:inline">Buyer</span>
      </button>
      
      <button
        onClick={() => onModeChange('seller')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
          mode === 'seller'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
            : 'text-white/80 hover:text-white hover:bg-white/10'
        }`}
      >
        <FaStore className="text-sm" />
        <span className="hidden sm:inline">Seller</span>
      </button>
    </div>
  );
};

export default ModeToggle;
