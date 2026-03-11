import { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, Clock, ChefHat, CheckCircle, Archive, TrendingUp, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RecentOrder {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  profiles: { full_name: string } | null;
}

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  completedCount: number;
  totalMenuItems: number;
  totalStudents: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingCount: 0,
    preparingCount: 0,
    readyCount: 0,
    completedCount: 0,
    totalMenuItems: 0,
    totalStudents: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30s
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Fetch all orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id, status, total_price, created_at');

      // Today's orders
      const todayOrders = (allOrders || []).filter(
        (o) => new Date(o.created_at) >= todayStart
      );
      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

      // Status counts (all active, not just today)
      const pendingCount = (allOrders || []).filter((o) => o.status === 'Pending').length;
      const preparingCount = (allOrders || []).filter((o) => o.status === 'Preparing').length;
      const readyCount = (allOrders || []).filter((o) => o.status === 'Ready').length;
      const completedCount = (allOrders || []).filter((o) => o.status === 'Completed').length;

      // Menu items count
      const { count: menuCount } = await supabase
        .from('menu')
        .select('id', { count: 'exact', head: true });

      // Students count
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });

      // Recent 5 orders
      const { data: recent } = await supabase
        .from('orders')
        .select('id, status, total_price, created_at, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue,
        pendingCount,
        preparingCount,
        readyCount,
        completedCount,
        totalMenuItems: menuCount || 0,
        totalStudents: studentCount || 0,
      });
      setRecentOrders((recent as unknown as RecentOrder[]) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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

  const statusColor: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Preparing: 'bg-blue-100 text-blue-800',
    Ready: 'bg-green-100 text-green-800',
    Completed: 'bg-gray-100 text-gray-600',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">Today's overview — auto-refreshes every 30s</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Today's Orders</p>
              <p className="text-3xl font-extrabold mt-1">{stats.todayOrders}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Today's Revenue</p>
              <p className="text-3xl font-extrabold mt-1">{stats.todayRevenue.toFixed(2)} <span className="text-lg font-bold">RON</span></p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Menu Items</p>
              <p className="text-3xl font-extrabold mt-1">{stats.totalMenuItems}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">Registered Students</p>
              <p className="text-3xl font-extrabold mt-1">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Order Pipeline */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Pipeline</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
            <Clock size={28} className="mx-auto text-yellow-600 mb-2" />
            <p className="text-3xl font-extrabold text-yellow-700">{stats.pendingCount}</p>
            <p className="text-sm text-yellow-600 font-medium">Pending</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <ChefHat size={28} className="mx-auto text-blue-600 mb-2" />
            <p className="text-3xl font-extrabold text-blue-700">{stats.preparingCount}</p>
            <p className="text-sm text-blue-600 font-medium">Preparing</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <CheckCircle size={28} className="mx-auto text-green-600 mb-2" />
            <p className="text-3xl font-extrabold text-green-700">{stats.readyCount}</p>
            <p className="text-sm text-green-600 font-medium">Ready</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <Archive size={28} className="mx-auto text-gray-500 mb-2" />
            <p className="text-3xl font-extrabold text-gray-600">{stats.completedCount}</p>
            <p className="text-sm text-gray-500 font-medium">Completed</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No orders yet</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-sm">
                    {order.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{order.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{timeAgo(order.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-900 text-sm">{order.total_price?.toFixed(2)} RON</span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
