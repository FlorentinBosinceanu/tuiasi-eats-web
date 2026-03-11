import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, Clock, ChevronDown, ChevronUp, ShoppingBag, Receipt, RotateCcw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatOrderNumber } from '../lib/notifications';
import { useCart } from '../lib/CartContext';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  menu_item_id?: number;
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

const statusConfig: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  Pending:   { label: 'Pending',   color: 'text-amber-700',  bg: 'bg-amber-50',  ring: 'ring-amber-200' },
  Preparing: { label: 'Preparing', color: 'text-blue-700',   bg: 'bg-blue-50',   ring: 'ring-blue-200' },
  Ready:     { label: 'Ready',     color: 'text-emerald-700',bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  Completed: { label: 'Completed', color: 'text-gray-600',   bg: 'bg-gray-100',  ring: 'ring-gray-200' },
  Cancelled: { label: 'Cancelled', color: 'text-red-600',    bg: 'bg-red-50',    ring: 'ring-red-200' },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ro-RO', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleReorder = (order: Order) => {
    let addedCount = 0;
    for (const item of order.order_items) {
      if (item.menu_item) {
        for (let i = 0; i < item.quantity; i++) {
          addToCart({
            id: item.menu_item_id || Math.floor(Math.random() * 100000),
            name: item.menu_item.name,
            price: item.unit_price,
          });
          addedCount++;
        }
      }
    }
    if (addedCount > 0) {
      toast.success(`${addedCount} items added to cart!`);
      navigate('/app/cart');
    } else {
      toast.error('Could not reorder — items unavailable');
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
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
              menu_item_id,
              menu_item:menu_item_id ( name, category )
            )
          `)
          .eq('user_id', authData.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          return;
        }

        setOrders((data as unknown as Order[]) || []);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const activeOrders = orders.filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.status));
  const pastOrders = orders.filter(o => ['Completed', 'Cancelled'].includes(o.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-500 to-amber-500 px-5 pt-10 pb-6 rounded-b-3xl shadow-lg shadow-orange-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/profile')}
            className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Order History</h1>
            <p className="text-orange-100 text-sm">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-6">
        {/* Empty State */}
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mb-4">
              <ShoppingBag size={36} className="text-orange-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">No orders yet</h2>
            <p className="text-sm text-gray-500 mb-6">Your order history will appear here</p>
            <button
              onClick={() => navigate('/app/menu')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition"
            >
              Browse Menu
            </button>
          </div>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Active Orders</h2>
            </div>
            <div className="space-y-3">
              {activeOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedId === order.id}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  isActive
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Orders */}
        {pastOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Past Orders</h2>
            <div className="space-y-3">
              {pastOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedId === order.id}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  onReorder={() => handleReorder(order)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────── Order Card Component ───────── */

function OrderCard({
  order,
  expanded,
  onToggle,
  isActive = false,
  onReorder,
}: {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  isActive?: boolean;
  onReorder?: () => void;
}) {
  const status = statusConfig[order.status] || statusConfig.Completed;
  const itemCount = order.order_items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${
        isActive ? 'border-orange-200 shadow-md shadow-orange-500/10' : 'border-gray-200'
      }`}
    >
      {/* Main Row */}
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 text-left">
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isActive ? 'bg-orange-100' : 'bg-gray-100'
        }`}>
          {isActive
            ? <Package size={22} className="text-orange-600" />
            : <Receipt size={22} className="text-gray-500" />
          }
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900 truncate">
              Order #{formatOrderNumber(order.id, order.created_at)}
            </p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ring-1 ${status.bg} ${status.color} ${status.ring}`}>
              {status.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500">{timeAgo(order.created_at)}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          </div>
        </div>

        {/* Price & Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-gray-900">{order.total_price.toFixed(2)} RON</span>
          {expanded
            ? <ChevronUp size={16} className="text-gray-400" />
            : <ChevronDown size={16} className="text-gray-400" />
          }
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-2">
          {/* Date */}
          <p className="text-xs text-gray-500 mb-2">{formatDate(order.created_at)}</p>

          {/* Items */}
          {order.order_items.map(item => (
            <div key={item.id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-orange-500 bg-orange-50 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.quantity}×
                </span>
                <span className="text-sm text-gray-800 truncate">
                  {item.menu_item?.name || 'Unknown item'}
                </span>
              </div>
              <span className="text-sm text-gray-600 font-medium flex-shrink-0 ml-2">
                {(item.unit_price * item.quantity).toFixed(2)} RON
              </span>
            </div>
          ))}

          {/* Total row */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Total</span>
            <span className="text-sm font-extrabold text-gray-900">{order.total_price.toFixed(2)} RON</span>
          </div>

          {/* Reorder button — only for completed orders */}
          {onReorder && order.status === 'Completed' && (
            <button
              onClick={(e) => { e.stopPropagation(); onReorder(); }}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all active:scale-[0.98]"
            >
              <RotateCcw size={16} />
              Reorder
            </button>
          )}
        </div>
      )}
    </div>
  );
}
