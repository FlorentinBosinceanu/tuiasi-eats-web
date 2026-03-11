import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AdminLayout() {
  const [email, setEmail] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user email
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || '');
    });

    // Fetch pending order count
    const fetchPending = async () => {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['Pending', 'Preparing']);
      setPendingCount(count || 0);
    };
    fetchPending();
    const interval = setInterval(fetchPending, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
      isActive
        ? 'bg-green-500 text-white'
        : 'text-gray-300 hover:bg-slate-700 hover:text-white'
    }`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-800 text-white overflow-y-auto flex flex-col">
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-orange-400">🍽️ TUIASI EATS</h1>
          <p className="text-xs text-slate-400 mt-1">Admin Panel</p>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1 flex-1">
          <NavLink to="/admin/dashboard" className={linkClass}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/admin/menu" className={linkClass}>
            <UtensilsCrossed size={20} />
            <span>Menu Management</span>
          </NavLink>

          <NavLink to="/admin/orders" className={linkClass}>
            <ClipboardList size={20} />
            <span>Order Management</span>
            {pendingCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {pendingCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/admin/settings" className={linkClass}>
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* User Info + Logout */}
        <div className="p-4 border-t border-slate-700">
          <div className="mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm mb-2">
              {email.charAt(0).toUpperCase()}
            </div>
            <p className="text-sm font-medium text-white truncate">{email}</p>
            <p className="text-xs text-slate-400">Staff</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors text-sm font-medium"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1">
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: { background: '#1f2937', color: '#fff', borderRadius: '12px', fontSize: '14px', fontWeight: '600', padding: '12px 16px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  );
}
