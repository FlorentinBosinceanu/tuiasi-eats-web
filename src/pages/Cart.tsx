import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../lib/CartContext';

export default function Cart() {
  const { cart, addToCart, removeFromCart, removeItemCompletely, getCartTotal } = useCart();
  const [includeUtensils, setIncludeUtensils] = useState(false);
  const navigate = useNavigate();

  const handleGoToCheckout = () => {
    navigate('/app/checkout', { state: { includeUtensils } });
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-white px-6">
        <div className="text-center">
          <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🛒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-500 mb-8 text-sm">Add some delicious food from our menu!</p>
          <button
            onClick={() => navigate('/app/menu')}
            className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 px-10 rounded-xl shadow-lg shadow-orange-500/25 transition active:scale-[0.97] text-sm"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h1 className="text-2xl font-bold text-gray-900">Your Order</h1>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-4">
        {cart.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
                <p className="text-orange-500 font-medium text-sm mt-1">{item.price.toFixed(2)} RON</p>
              </div>
              <div className="text-right">
                <p className="text-gray-600 text-sm">Subtotal</p>
                <p className="text-lg font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)} RON</p>
              </div>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-2">
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-1 px-3 rounded transition duration-200"
                >
                  −
                </button>
                <span className="text-lg font-semibold text-gray-900 w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => addToCart({ id: item.id, name: item.name, price: item.price })}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1 px-3 rounded transition duration-200"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItemCompletely(item.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        {/* Utensils Toggle */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mt-6">
          <div className="flex items-center justify-between">
            <label className="text-gray-900 font-medium">Tacâmuri (Utensils)?</label>
            <button
              onClick={() => setIncludeUtensils(!includeUtensils)}
              className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                includeUtensils ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  includeUtensils ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {includeUtensils ? '✓ Utensils will be included' : 'No utensils included'}
          </p>
        </div>
      </div>

      {/* Sticky Summary & Checkout */}
      <div className="fixed bottom-20 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-full sm:max-w-md bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-sm font-semibold text-gray-600 block">TOTAL:</span>
            <p className="text-2xl font-bold text-orange-500">{getCartTotal().toFixed(2)} RON</p>
          </div>
          <button
            onClick={handleGoToCheckout}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-4 rounded-lg transition duration-200 text-lg"
          >
            GO TO CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
}
