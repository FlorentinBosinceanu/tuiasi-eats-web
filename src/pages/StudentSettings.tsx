import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, BellOff, Moon, Sun, Monitor, Info, Heart, ExternalLink } from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'system';

export default function StudentSettings() {
  const navigate = useNavigate();

  // Notification prefs (persisted in localStorage)
  const [notifOrders, setNotifOrders] = useState(() =>
    localStorage.getItem('pref_notif_orders') !== 'false'
  );
  const [notifPromo, setNotifPromo] = useState(() =>
    localStorage.getItem('pref_notif_promo') !== 'false'
  );

  // Theme (persisted in localStorage)
  const [theme, setTheme] = useState<ThemeMode>(() =>
    (localStorage.getItem('pref_theme') as ThemeMode) || 'light'
  );

  // Persist on change
  useEffect(() => {
    localStorage.setItem('pref_notif_orders', String(notifOrders));
  }, [notifOrders]);

  useEffect(() => {
    localStorage.setItem('pref_notif_promo', String(notifPromo));
  }, [notifPromo]);

  useEffect(() => {
    localStorage.setItem('pref_theme', theme);
  }, [theme]);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-violet-500 px-5 pt-10 pb-6 rounded-b-3xl shadow-lg shadow-purple-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/profile')}
            className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Settings</h1>
            <p className="text-purple-100 text-sm">App preferences</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-4">
        {/* ── Notifications ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Bell size={14} className="text-purple-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notifications</span>
          </div>

          {/* Order Status */}
          <div className="px-4 py-3.5 flex items-center justify-between border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
                {notifOrders
                  ? <Bell size={16} className="text-orange-500" />
                  : <BellOff size={16} className="text-gray-400" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Order Updates</p>
                <p className="text-[11px] text-gray-500">Get notified when your order status changes</p>
              </div>
            </div>
            <Toggle checked={notifOrders} onChange={setNotifOrders} />
          </div>

          {/* Promo */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center">
                {notifPromo
                  ? <Bell size={16} className="text-pink-500" />
                  : <BellOff size={16} className="text-gray-400" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Promotions</p>
                <p className="text-[11px] text-gray-500">New menu items & special offers</p>
              </div>
            </div>
            <Toggle checked={notifPromo} onChange={setNotifPromo} />
          </div>
        </div>

        {/* ── Appearance ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Moon size={14} className="text-purple-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Appearance</span>
          </div>

          <div className="p-4 flex gap-2">
            {([
              { id: 'light',  label: 'Light',  icon: Sun },
              { id: 'dark',   label: 'Dark',   icon: Moon },
              { id: 'system', label: 'System',  icon: Monitor },
            ] as const).map(opt => {
              const active = theme === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-all ${
                    active
                      ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-bold">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="px-4 pb-3">
            <p className="text-[10px] text-gray-400 text-center">
              {theme === 'dark' || theme === 'system'
                ? 'Dark mode support coming soon!'
                : 'Currently using light theme'}
            </p>
          </div>
        </div>

        {/* ── About ── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Info size={14} className="text-purple-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">About</span>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* App Info */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">App Name</span>
              <span className="text-sm font-bold text-gray-900">TUIASI EATS</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Version</span>
              <span className="text-sm font-bold text-gray-900">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Developer</span>
              <span className="text-sm font-bold text-gray-900">TUIASI</span>
            </div>

            <div className="h-px bg-gray-100 my-1" />

            {/* University link */}
            <a
              href="https://www.tuiasi.ro"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 py-2 text-blue-600 hover:text-blue-700 transition"
            >
              <ExternalLink size={16} />
              <span className="text-sm font-semibold">Visit TUIASI website</span>
            </a>
          </div>
        </div>

        {/* Built With Love */}
        <div className="flex items-center justify-center gap-1.5 pt-4 pb-2">
          <span className="text-xs text-gray-400">Made with</span>
          <Heart size={12} className="text-red-400 fill-red-400" />
          <span className="text-xs text-gray-400">for TUIASI students</span>
        </div>
      </div>
    </div>
  );
}

/* ───────── Toggle Component ───────── */

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
        checked ? 'bg-purple-500' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
