import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Clock, ChefHat, CheckCircle, Archive, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { playNotificationSound, showNotification, requestNotificationPermission, formatOrderNumber } from '../lib/notifications';

interface MenuItem {
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  menu: MenuItem;
}

interface Profile {
  full_name: string;
}

interface Order {
  id: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed';
  total_price: number;
  created_at: string;
  profiles: Profile;
  order_items: OrderItem[];
}

type FilterTab = 'All' | 'Pending' | 'Preparing' | 'Ready' | 'Completed';

const tabs: { label: FilterTab; icon: typeof Clock; color: string; activeColor: string }[] = [
  { label: 'All', icon: RefreshCw, color: 'text-gray-500', activeColor: 'bg-gray-900 text-white' },
  { label: 'Pending', icon: Clock, color: 'text-yellow-600', activeColor: 'bg-yellow-500 text-white' },
  { label: 'Preparing', icon: ChefHat, color: 'text-blue-600', activeColor: 'bg-blue-500 text-white' },
  { label: 'Ready', icon: CheckCircle, color: 'text-green-600', activeColor: 'bg-green-500 text-white' },
  { label: 'Completed', icon: Archive, color: 'text-gray-500', activeColor: 'bg-gray-500 text-white' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(full_name), order_items(*, menu(name))')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    requestNotificationPermission();
  }, [fetchOrders]);

  // Realtime: listen for new & updated orders
  const orderCountRef = useRef(0);

  useEffect(() => {
    orderCountRef.current = orders.length;
  }, [orders.length]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        () => {
          // New order placed!
          playNotificationSound('new-order');
          showNotification('🍽️ New Order!', 'A new order has been placed.');
          toast('🍽️ New order received!', { icon: '🔔', duration: 4000 });
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Order updated to ${newStatus}`);
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filteredOrders = activeTab === 'All'
    ? orders
    : orders.filter((o) => o.status === activeTab);

  const counts: Record<string, number> = {
    All: orders.length,
    Pending: orders.filter((o) => o.status === 'Pending').length,
    Preparing: orders.filter((o) => o.status === 'Preparing').length,
    Ready: orders.filter((o) => o.status === 'Ready').length,
    Completed: orders.filter((o) => o.status === 'Completed').length,
  };

  const statusStyles: Record<string, { bg: string; text: string }> = {
    Pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    Preparing: { bg: 'bg-blue-100', text: 'text-blue-800' },
    Ready: { bg: 'bg-green-100', text: 'text-green-800' },
    Completed: { bg: 'bg-gray-100', text: 'text-gray-600' },
  };

  const getNextAction = (order: Order) => {
    switch (order.status) {
      case 'Pending':
        return { label: 'Start Preparing', color: 'bg-blue-500 hover:bg-blue-600', next: 'Preparing' };
      case 'Preparing':
        return { label: 'Mark Ready', color: 'bg-green-500 hover:bg-green-600', next: 'Ready' };
      case 'Ready':
        return { label: 'Complete', color: 'bg-gray-500 hover:bg-gray-600', next: 'Completed' };
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-1 text-gray-500">Live updates — new orders appear instantly</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.label;
          const count = counts[tab.label] || 0;
          return (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? `${tab.activeColor} shadow-md`
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/25' : 'bg-gray-100'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No {activeTab === 'All' ? '' : activeTab.toLowerCase()} orders</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
          {filteredOrders.map((order) => {
            const style = statusStyles[order.status] || statusStyles.Completed;
            const action = getNextAction(order);

            return (
              <div key={order.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                {/* Top row: ID, student, time, status, action */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-gray-600 text-sm">
                        {order.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>

                    {/* Name + ID + Time */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 text-sm truncate">
                          {order.profiles?.full_name || 'Unknown Student'}
                        </p>
                        <span className="text-xs text-gray-400 font-mono flex-shrink-0">
                          #{formatOrderNumber(order.id, order.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(order.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Price */}
                    <span className="font-bold text-gray-900 text-sm">{order.total_price?.toFixed(2)} RON</span>

                    {/* Status Badge */}
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
                      {order.status}
                    </span>

                    {/* Action Button */}
                    {action && (
                      <button
                        onClick={() => updateOrderStatus(order.id, action.next)}
                        className={`${action.color} text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap`}
                      >
                        {action.label}
                      </button>
                    )}
                  </div>
                </div>

                {/* Items row */}
                <div className="ml-14 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {order.order_items && order.order_items.length > 0 ? (
                      order.order_items.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-lg"
                        >
                          {item.menu?.name}
                          {item.quantity > 1 && (
                            <span className="text-gray-400">×{item.quantity}</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No items</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
