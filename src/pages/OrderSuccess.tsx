import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, Clock, MapPin, ArrowRight, UtensilsCrossed } from 'lucide-react';
import { formatOrderNumber } from '../lib/notifications';

interface OrderConfirmationState {
  orderId: string;
  totalPrice: number;
  itemCount: number;
}

export default function OrderSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read from location.state first, fallback to sessionStorage
  const getOrderInfo = (): OrderConfirmationState | null => {
    const locState = location.state as OrderConfirmationState | null;
    if (locState?.orderId) return locState;

    try {
      const stored = sessionStorage.getItem('lastOrder');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.orderId) return parsed;
      }
    } catch { /* ignore */ }

    return null;
  };

  const orderInfo = getOrderInfo();

  const [showCheck, setShowCheck] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  // Staggered entrance animation
  useEffect(() => {
    const t1 = setTimeout(() => setShowCheck(true), 200);
    const t2 = setTimeout(() => setShowContent(true), 700);
    const t3 = setTimeout(() => setShowButtons(true), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // If no order info at all, still show a generic success
  // (the order went through if they reached this page from checkout)
  const orderId = orderInfo?.orderId || '';
  const totalPrice = orderInfo?.totalPrice || 0;
  const itemCount = orderInfo?.itemCount || 0;
  const hasDetails = !!orderInfo;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-12" style={{ minHeight: 'calc(100vh - 6rem)' }}>
      {/* Animated Checkmark */}
      <div className={`transition-all duration-700 ease-out ${showCheck ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        {/* Outer glow ring */}
        <div className="relative">
          <div className="absolute inset-0 bg-green-400/20 rounded-full blur-2xl scale-150 animate-pulse" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-500/30">
            <CheckCircle2 size={56} className="text-white" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className={`mt-8 text-center transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <h1 className="text-2xl font-extrabold text-gray-900">Comandă plasată! 🎉</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Comanda ta a fost trimisă la bucătărie
        </p>

        {/* Order Summary Card */}
        {hasDetails && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left w-full max-w-sm mx-auto">
          {/* Order ID */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order</span>
            <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
              #{formatOrderNumber(orderId)}
            </span>
          </div>

          <div className="h-px bg-gray-100 mb-3" />

          {/* Details */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                <UtensilsCrossed size={14} className="text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Items</p>
                <p className="text-sm font-bold text-gray-900">{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <span className="text-sm">💰</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-sm font-bold text-gray-900">{totalPrice.toFixed(2)} RON</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Clock size={14} className="text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Estimated time</p>
                <p className="text-sm font-bold text-gray-900">~15–20 min</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <MapPin size={14} className="text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-400">Pickup</p>
                <p className="text-sm font-bold text-gray-900">Cantina TUIASI</p>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className={`mt-8 w-full max-w-sm space-y-3 transition-all duration-700 ease-out ${showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        {/* Primary: Track Order */}
        <button
          onClick={() => navigate('/app/current-order')}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-transform text-sm"
        >
          Track My Order
          <ArrowRight size={18} />
        </button>

        {/* Secondary: Back to Menu */}
        <button
          onClick={() => navigate('/app/menu')}
          className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}
