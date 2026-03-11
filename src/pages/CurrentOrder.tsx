import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Package, ChefHat, CheckCircle2, MapPin, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showNotification, playNotificationSound, requestNotificationPermission, formatOrderNumber } from '../lib/notifications';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  menu_item: {
    name: string;
    category: string;
  } | null;
}

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  order_items: OrderItem[];
}

const steps = [
  { key: 'Pending',   label: 'Order Placed',  icon: Clock,        color: 'amber' },
  { key: 'Preparing', label: 'Preparing',      icon: ChefHat,      color: 'blue' },
  { key: 'Ready',     label: 'Ready for Pickup', icon: MapPin,     color: 'emerald' },
  { key: 'Completed', label: 'Completed',      icon: CheckCircle2, color: 'gray' },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function CurrentOrder() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancelling(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Cancelled' })
        .eq('id', order.id)
        .eq('status', 'Pending'); // Only cancel if still Pending

      if (error) throw error;

      toast.success('Order cancelled');
      setOrder(null);
    } catch (err) {
      console.error('Error cancelling order:', err);
      toast.error('Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_price,
          created_at,
          order_items (
            id,
            quantity,
            unit_price,
            menu_item:menu_item_id ( name, category )
          )
        `)
        .eq('user_id', authData.user.id)
        .in('status', ['Pending', 'Preparing', 'Ready'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching order:', error);
      }

      setOrder((data as unknown as Order) || null);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    requestNotificationPermission();
  }, []);

  // Realtime subscription — listen for status changes on the active order
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!order) return;
    prevStatusRef.current = order.status;

    const channel = supabase
      .channel('student-order-' + order.id)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status: string }).status;
          const oldStatus = prevStatusRef.current;

          if (newStatus !== oldStatus) {
            prevStatusRef.current = newStatus;

            // Update order in state
            setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);

            // Notifications + sounds based on status
            if (newStatus === 'Preparing') {
              toast('👨‍🍳 Your order is being prepared!', { icon: '🔥' });
              playNotificationSound('status-update');
              showNotification('Order Update', 'Your food is being prepared!');
            } else if (newStatus === 'Ready') {
              toast.success('Your order is ready for pickup! 🎉');
              playNotificationSound('order-ready');
              showNotification('Order Ready! 🎉', 'Your food is ready for pickup at the counter!');
            } else if (newStatus === 'Completed') {
              toast.success('Order completed!');
              playNotificationSound('status-update');
            } else if (newStatus === 'Cancelled') {
              toast.error('Your order was cancelled');
              setOrder(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id]);

  // Find current step index
  const currentStepIdx = order ? steps.findIndex(s => s.key === order.status) : -1;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pb-24">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 px-5 pt-10 pb-6 rounded-b-3xl shadow-lg shadow-orange-500/20">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ArrowLeft size={20} className="text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Current Order</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Package size={36} className="text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">No active order</h2>
          <p className="text-sm text-gray-500 mb-6">Place an order from the menu to track it here</p>
          <button
            onClick={() => navigate('/app/menu')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  const itemCount = order.order_items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 px-5 pt-10 pb-8 rounded-b-3xl shadow-lg shadow-orange-500/20">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Current Order</h1>
            <p className="text-orange-100 text-sm">#{formatOrderNumber(order.id, order.created_at)}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-2">
          {steps.slice(0, 3).map((step, idx) => {
            const isActive = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center relative flex-1">
                {/* Connector line */}
                {idx > 0 && (
                  <div className={`absolute top-5 right-1/2 w-full h-0.5 -z-0 ${
                    idx <= currentStepIdx ? 'bg-white' : 'bg-white/30'
                  }`} />
                )}

                {/* Circle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${
                  isCurrent
                    ? 'bg-white shadow-lg shadow-white/30 scale-110'
                    : isActive
                      ? 'bg-white/80'
                      : 'bg-white/20 backdrop-blur-sm'
                }`}>
                  <Icon size={18} className={isCurrent || isActive ? 'text-orange-500' : 'text-white/60'} />
                </div>

                {/* Label */}
                <p className={`text-[10px] font-bold mt-2 text-center ${
                  isCurrent ? 'text-white' : isActive ? 'text-white/80' : 'text-white/40'
                }`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Card */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-gray-900">
              {order.status === 'Pending' && '⏳ Waiting for kitchen...'}
              {order.status === 'Preparing' && '👨‍🍳 Your food is being prepared!'}
              {order.status === 'Ready' && '✅ Ready for pickup!'}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={14} />
            <span>Placed {timeAgo(order.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Order Items</h3>
            <span className="text-xs text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </div>

          <div className="divide-y divide-gray-50">
            {order.order_items.map(item => (
              <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-orange-500 bg-orange-50 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.quantity}×
                  </span>
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {item.menu_item?.name || 'Unknown item'}
                  </span>
                </div>
                <span className="text-sm text-gray-600 font-semibold flex-shrink-0 ml-2">
                  {(item.unit_price * item.quantity).toFixed(2)} RON
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-500">Total</span>
            <span className="text-lg font-extrabold text-gray-900">{order.total_price.toFixed(2)} RON</span>
          </div>
        </div>
      </div>

      {/* Tip / Info */}
      <div className="px-4 mt-4">
        <div className="bg-blue-50 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-blue-900">Pickup Location</p>
            <p className="text-xs text-blue-700 mt-0.5">Cantina TUIASI — Ground Floor Counter</p>
          </div>
        </div>
      </div>

      {/* Cancel Order — only if still Pending */}
      {order.status === 'Pending' && (
        <div className="px-4 mt-4">
          <button
            onClick={handleCancelOrder}
            disabled={cancelling}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-200 bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <XCircle size={18} />
            {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      )}
    </div>
  );
}
