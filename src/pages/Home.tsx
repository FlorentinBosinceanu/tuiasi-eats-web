import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, ChevronRight, Package, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/CartContext';
import { showNotification, playNotificationSound, requestNotificationPermission } from '../lib/notifications';
import { useFavorites } from '../lib/useFavorites';
import MenuItemCard from '../components/MenuItemCard';

interface MenuItem {
  id: number;
  name: string;
  category: string;
  gramaj: string;
  price: number;
  image_url: string | null;
  alergeni?: string | null;
  obs?: string | null;
  is_available: boolean;
}

interface ActiveOrder {
  id: string;
  status: string;
  total_price: number;
}

const categoryOrder = [
  { name: 'Soups', emoji: '🍲' },
  { name: 'Main Courses', emoji: '🥩' },
  { name: 'Side Dishes', emoji: '🍟' },
  { name: 'Salads/Bread/Extras', emoji: '🥗' },
  { name: 'Desserts', emoji: '🍰' },
  { name: 'Beverages', emoji: '🥤' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  Pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-400' },
  Preparing: { label: 'Preparing', color: 'text-blue-700', bg: 'bg-blue-400' },
  Ready: { label: 'Ready for Pickup', color: 'text-green-700', bg: 'bg-green-400' },
};

export default function Home() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [nameLoading, setNameLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('menu')
          .select('*')
          .eq('is_available', true)
          .order('name');

        if (error) throw error;
        setMenuItems(data || []);
      } catch (error) {
        console.error('Error fetching menu:', error);
        setMenuItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Fetch user name (once)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', authData.user.id)
          .single();

        if (profile?.full_name) {
          setUserName(profile.full_name);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setNameLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch active order — runs on mount + refetches when window regains focus
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          setActiveOrder(null);
          return;
        }
        userIdRef.current = authData.user.id;

        const { data: orders } = await supabase
          .from('orders')
          .select('id, status, total_price')
          .eq('user_id', authData.user.id)
          .in('status', ['Pending', 'Preparing', 'Ready'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (orders && orders.length > 0) {
          setActiveOrder(orders[0]);
        } else {
          setActiveOrder(null);
        }
      } catch (error) {
        console.error('Error fetching active order:', error);
        setActiveOrder(null);
      }
    };

    fetchActiveOrder();
    requestNotificationPermission();

    // Re-check when user navigates back to this tab/page
    const handleFocus = () => fetchActiveOrder();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Realtime: listen for order changes for this user
  useEffect(() => {
    if (!userIdRef.current) return;

    const channel = supabase
      .channel('home-orders-' + userIdRef.current)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userIdRef.current}`,
        },
        (payload) => {
          const newRow = payload.new as { id: string; status: string; total_price: number } | undefined;
          if (!newRow) return;

          const activeStatuses = ['Pending', 'Preparing', 'Ready'];
          if (activeStatuses.includes(newRow.status)) {
            setActiveOrder({ id: newRow.id, status: newRow.status, total_price: newRow.total_price });

            // Notify on key status changes
            if (newRow.status === 'Ready') {
              playNotificationSound('order-ready');
              showNotification('Order Ready! 🎉', 'Your food is ready for pickup!');
              toast.success('Your order is ready! 🎉');
            } else if (newRow.status === 'Preparing') {
              playNotificationSound('status-update');
              showNotification('Order Update', 'Your food is being prepared!');
            }
          } else {
            setActiveOrder(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userIdRef.current]);

  // Group items by category
  const groupedItems = categoryOrder
    .map((cat) => ({
      ...cat,
      items: menuItems.filter((item) => {
        const matchesCategory = item.category === cat.name;
        const matchesSearch =
          !searchQuery ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="pb-28">
      {/* Header Bar — sticky so it stays visible on scroll */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-blue-600 to-blue-500 px-5 pt-8 pb-5 rounded-b-3xl shadow-lg shadow-blue-500/20">
        {/* Top Row: Logo + Greeting + Logout */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
              <span className="text-white text-base font-extrabold tracking-tight">TUIASI EATS</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-white text-sm">
              Bună, {nameLoading ? '...' : <span className="font-bold">{userName || 'Student'}</span>}!
            </p>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-90 transition-all"
              title="Logout"
            >
              <LogOut size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for meals..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/95 text-gray-900 placeholder-gray-400 text-sm font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {/* Menu Section */}
      <div className="px-5 mt-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Menu</h2>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-20" />
            ))}
          </div>
        ) : groupedItems.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            {searchQuery ? 'No items match your search' : 'No items available right now'}
          </p>
        ) : (
          <div className="space-y-6">
            {groupedItems.map((group) => (
              <div key={group.name}>
                {/* Category Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{group.emoji}</span>
                  <h3 className="text-base font-bold text-gray-800">{group.name}</h3>
                  <div className="flex-1 h-px bg-gray-200 ml-2" />
                </div>

                {/* Category Items */}
                <div className="flex flex-col gap-2.5">
                  {group.items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      name={item.name}
                      price={item.price}
                      gramaj={item.gramaj}
                      imageUrl={item.image_url || undefined}
                      isFavorite={isFavorite(item.id)}
                      onToggleFavorite={() => toggleFavorite(item.id)}
                      onAdd={() => {
                        addToCart({ id: item.id, name: item.name, price: item.price });
                        toast.success(`${item.name} added to cart!`);
                      }}
                      onClick={() =>
                        navigate('/app/menu', {
                          state: { openItem: item, fromHome: true },
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Order Floating Bar — shows only when an active order exists */}
      {activeOrder && statusConfig[activeOrder.status] && (
        <div className="fixed bottom-24 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-full sm:max-w-md px-4 z-40">
          <button
            onClick={() => navigate('/app/current-order')}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl shadow-xl shadow-orange-500/30 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Package size={22} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-bold text-white">Current Order</p>
              <p className="text-sm text-orange-100 font-medium">
                {activeOrder.total_price.toFixed(2)} RON
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 text-white">
              {statusConfig[activeOrder.status].label}
            </span>
            <ChevronRight size={20} className="text-white/70" />
          </button>
        </div>
      )}
    </div>
  );
}