import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../lib/CartContext';
import { supabase } from '../lib/supabase';

type PaymentMethod = 'cash' | 'card';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, getCartTotal, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Get utensils preference from navigation state
  const includeUtensils = (location.state as { includeUtensils?: boolean })?.includeUtensils || false;

  const handlePlaceOrder = async () => {
    // Business hours check (08:00 - 16:00)
    const now = new Date();
    const hour = now.getHours();
    if (hour < 8 || hour >= 16) {
      toast.error('Cantina is closed! Orders are accepted between 08:00 - 16:00');
      setError('The canteen is closed right now. Please order between 08:00 and 16:00.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get logged-in user
      const { data: authData, error: authError } = await supabase.auth.getUser();

      let userId: string | null = null;

      if (authError || !authData.user) {
        // If not authenticated, try to get session instead
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          userId = sessionData.session.user.id;
        } else {
          console.error('Auth error:', authError);
          setError('User not authenticated. Please log in again.');
          setLoading(false);
          return;
        }
      } else {
        userId = authData.user.id;
      }

      const totalPrice = getCartTotal();

      // Insert into orders table
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          total_price: totalPrice,
          status: 'Pending',
          include_utensils: includeUtensils,
        })
        .select()
        .single();

      if (orderError || !newOrder) {
        console.error('Order creation error:', orderError);
        setError(`Failed to create order: ${orderError?.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      // Insert order items
      const orderItems = cart.map((item) => ({
        order_id: newOrder.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items error:', itemsError);
        setError(`Failed to add items to order: ${itemsError.message}`);
        setLoading(false);
        return;
      }

      // Success: clear cart and navigate to success screen
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
      const orderInfo = {
        orderId: newOrder.id,
        totalPrice: totalPrice,
        itemCount: itemCount,
      };
      // Save to sessionStorage (reliable fallback for all browsers)
      sessionStorage.setItem('lastOrder', JSON.stringify(orderInfo));
      clearCart();
      // Use window.location for guaranteed navigation on mobile
      window.location.href = '/app/order-success';
      return;
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-32">
      {/* Back Button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/app/cart')}
          className="text-blue-500 hover:text-blue-700 font-semibold text-lg"
        >
          ← Back
        </button>
      </div>

      {/* Page Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      {/* Order Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
        <div className="space-y-3 mb-4 border-b pb-4">
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p className="text-gray-900 font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">x{item.quantity}</p>
              </div>
              <p className="text-gray-900 font-semibold">{(item.price * item.quantity).toFixed(2)} RON</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">Total:</span>
          <span className="text-2xl font-bold text-orange-500">{getCartTotal().toFixed(2)} RON</span>
        </div>
        {includeUtensils && (
          <p className="text-sm text-green-600 mt-3">✓ Utensils included</p>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
        <div className="flex gap-4">
          {/* Cash Button */}
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-200 ${
              paymentMethod === 'cash'
                ? 'bg-blue-500 text-white border-2 border-blue-600'
                : 'bg-gray-100 text-gray-900 border-2 border-gray-300 hover:bg-gray-200'
            }`}
          >
            💵 Cash
          </button>

          {/* Card Button */}
          <button
            onClick={() => setPaymentMethod('card')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition duration-200 ${
              paymentMethod === 'card'
                ? 'bg-blue-500 text-white border-2 border-blue-600'
                : 'bg-gray-100 text-gray-900 border-2 border-gray-300 hover:bg-gray-200'
            }`}
          >
            💳 Card
          </button>
        </div>
      </div>

      {/* Business Hours Notice */}
      {(() => {
        const h = new Date().getHours();
        const isOpen = h >= 8 && h < 16;
        return !isOpen ? (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-3">
            <span className="text-2xl">🕐</span>
            <div>
              <p className="text-amber-800 font-semibold text-sm">Canteen is closed</p>
              <p className="text-amber-700 text-xs">Orders are accepted between 08:00 – 16:00</p>
            </div>
          </div>
        ) : null;
      })()}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Place Order Button */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-bold py-4 px-4 rounded-lg transition duration-200 text-lg"
        >
          {loading ? 'Processing Order...' : 'PLACE ORDER'}
        </button>
      </div>
    </div>
  );
}
