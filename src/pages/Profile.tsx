import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, History, UserPen, Settings, LogOut, ChevronRight, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  full_name: string;
  email: string;
}

interface ActiveOrder {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  Pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  Preparing: { label: 'Preparing', color: 'text-blue-700', bg: 'bg-blue-100' },
  Ready: { label: 'Ready', color: 'text-green-700', bg: 'bg-green-100' },
};

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;

        // Get profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', authData.user.id)
          .single();

        setProfile({
          full_name: profileData?.full_name || 'Student',
          email: authData.user.email || '',
        });

        // Get active order
        const { data: orders } = await supabase
          .from('orders')
          .select('id, status, total_price, created_at')
          .eq('user_id', authData.user.id)
          .in('status', ['Pending', 'Preparing', 'Ready'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (orders && orders.length > 0) {
          setActiveOrder(orders[0]);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Profile Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 px-5 pt-10 pb-8 rounded-b-3xl shadow-lg shadow-blue-500/20">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center flex-shrink-0">
            <User size={36} className="text-white" />
          </div>

          {/* Name & Email */}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">
              {profile?.full_name}
            </h1>
            <p className="text-blue-100 text-sm mt-1 truncate">
              {profile?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-5 mt-6 space-y-3">
        {/* Current Order */}
        {activeOrder && statusConfig[activeOrder.status] && (
          <button
            onClick={() => navigate('/app/current-order')}
            className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Package size={22} className="text-orange-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900">Current Order</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeOrder.total_price.toFixed(2)} RON
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusConfig[activeOrder.status].bg} ${statusConfig[activeOrder.status].color}`}>
              {statusConfig[activeOrder.status].label}
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        )}

        {/* If no active order */}
        {!activeOrder && (
          <div className="w-full bg-gray-50 rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Package size={22} className="text-gray-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-400">No Active Order</p>
              <p className="text-xs text-gray-400 mt-0.5">Place an order from the menu</p>
            </div>
          </div>
        )}

        {/* Order History */}
        <button
          onClick={() => navigate('/app/order-history')}
          className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <History size={22} className="text-blue-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900">Order History</p>
            <p className="text-xs text-gray-500 mt-0.5">View your past orders</p>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </button>

        {/* Edit Profile */}
        <button
          onClick={() => navigate('/app/edit-profile')}
          className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <UserPen size={22} className="text-green-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900">Edit Profile</p>
            <p className="text-xs text-gray-500 mt-0.5">Update your personal info</p>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('/app/settings')}
          className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Settings size={22} className="text-purple-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-gray-900">Settings</p>
            <p className="text-xs text-gray-500 mt-0.5">App preferences</p>
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl border border-red-100 p-4 flex items-center gap-4 hover:shadow-md hover:border-red-200 transition-all active:scale-[0.98] mt-4"
        >
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <LogOut size={22} className="text-red-500" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-red-500">Logout</p>
          </div>
        </button>
      </div>
    </div>
  );
}
