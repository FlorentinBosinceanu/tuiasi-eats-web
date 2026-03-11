import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Minus, Plus, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCart } from '../lib/CartContext';
import { useFavorites } from '../lib/useFavorites';

// ==========================================
// Types
// ==========================================

interface MenuItem {
  id: number;
  name: string;
  category: string;
  gramaj: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  alergeni?: string | null;
  obs?: string | null;
}

type Screen = 'categories' | 'submenu' | 'item';

// ==========================================
// Category Data
// ==========================================

const categories = [
  { name: 'Soups', emoji: '🍲', gradient: 'from-amber-500 to-orange-600', glow: 'bg-amber-400/30' },
  { name: 'Main Courses', emoji: '🥩', gradient: 'from-rose-500 to-red-700', glow: 'bg-rose-400/30' },
  { name: 'Side Dishes', emoji: '🍟', gradient: 'from-orange-400 to-amber-600', glow: 'bg-orange-400/30' },
  { name: 'Salads/Bread/Extras', emoji: '🥗', gradient: 'from-emerald-500 to-green-700', glow: 'bg-emerald-400/30' },
  { name: 'Desserts', emoji: '🍰', gradient: 'from-pink-400 to-fuchsia-600', glow: 'bg-pink-400/30' },
  { name: 'Beverages', emoji: '🥤', gradient: 'from-blue-500 to-indigo-700', glow: 'bg-blue-400/30' },
];

// ==========================================
// Main Component
// ==========================================

export default function Menu() {
  const [screen, setScreen] = useState<Screen>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const location = useLocation();
  const navigate = useNavigate();
  const fromHome = useRef(false);

  // Deep-link: open directly to item detail when navigating from Home
  useEffect(() => {
    const state = location.state as { openItem?: MenuItem; fromHome?: boolean } | null;
    if (state?.openItem) {
      setSelectedItem(state.openItem);
      setSelectedCategory(state.openItem.category);
      setScreen('item');
      fromHome.current = !!state.fromHome;
      // Clear the state so refreshing doesn't re-open
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // Fetch items when a category is selected
  useEffect(() => {
    if (screen === 'submenu' && selectedCategory) {
      fetchItemsByCategory(selectedCategory);
    }
  }, [screen, selectedCategory]);

  const fetchItemsByCategory = async (category: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('menu')
        .select('*')
        .eq('category', category)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setScreen('submenu');
  };

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    setScreen('item');
  };

  const handleBack = () => {
    if (screen === 'item') {
      if (fromHome.current) {
        fromHome.current = false;
        navigate('/app/home');
        return;
      }
      setScreen('submenu');
      setSelectedItem(null);
      setQuantity(1);
    } else if (screen === 'submenu') {
      setScreen('categories');
      setSelectedCategory('');
      setMenuItems([]);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart({ id: item.id, name: item.name, price: item.price });
    toast.success(`${item.name} added to cart!`);
  };

  // ==========================================
  // Screen 1: Category Grid
  // ==========================================
  if (screen === 'categories') {
    return (
      <div className="flex flex-col min-h-[calc(100vh-5rem)] pb-4 px-5">
        {/* Header */}
        <div className="pt-3 pb-5">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">MENU</h1>
          <p className="text-sm text-gray-500 mt-1">Ce poftești azi?</p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleCategoryClick(cat.name)}
              className={`relative flex flex-col items-center justify-center gap-2.5 aspect-square rounded-3xl bg-gradient-to-br ${cat.gradient} text-white transition-all duration-200 hover:scale-[1.03] hover:shadow-xl active:scale-95 shadow-md overflow-hidden`}
            >
              {/* Glow backdrop behind emoji */}
              <div className={`absolute w-20 h-20 rounded-full ${cat.glow} blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`} />
              <span className="text-4xl drop-shadow-lg relative z-10">{cat.emoji}</span>
              <span className="text-xs font-bold text-center leading-tight px-3 relative z-10 drop-shadow-sm">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ==========================================
  // Screen 2: Sub Menu (Items List)
  // ==========================================
  if (screen === 'submenu') {
    const currentCategory = categories.find((c) => c.name === selectedCategory);

    return (
      <div className="pb-20">
        {/* Colored header banner matching category */}
        <div className={`bg-gradient-to-br ${currentCategory?.gradient || 'from-gray-700 to-gray-900'} px-4 pt-5 pb-6 rounded-b-3xl shadow-lg`}>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentCategory?.emoji}</span>
              <h1 className="text-2xl font-bold text-white drop-shadow-sm">{selectedCategory}</h1>
            </div>
          </div>
          <p className="text-white/70 text-sm mt-2 ml-1">{menuItems.length} {menuItems.length === 1 ? 'produs disponibil' : 'produse disponibile'}</p>
        </div>

        {/* Items List */}
        <div className="px-4 mt-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Se încarcă...</p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-5xl">😔</span>
              <p className="text-gray-400 text-sm">Niciun produs disponibil în această categorie</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200 text-left active:scale-[0.98] border border-gray-100"
                >
                  {/* Image */}
                  <div className={`w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br ${currentCategory?.gradient || 'from-gray-200 to-gray-300'} bg-opacity-10`}>
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-2xl drop-shadow-sm">{currentCategory?.emoji}</span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-950 truncate text-base">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">{item.gramaj}</p>
                  </div>

                  {/* Favorite + Price + Arrow */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                      className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Heart
                        size={18}
                        className={isFavorite(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-300'}
                      />
                    </button>
                    <span className="text-base font-extrabold text-gray-950">{item.price.toFixed(2)} <span className="text-xs font-semibold text-gray-500">RON</span></span>
                    <div className="text-gray-300">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // Screen 3: Item Detail
  // ==========================================
  if (screen === 'item' && selectedItem) {
    const currentCategory = categories.find((c) => c.name === selectedItem.category);

    return (
      <div className="pb-44">
        {/* Gradient header with back button */}
        <div className={`bg-gradient-to-br ${currentCategory?.gradient || 'from-gray-700 to-gray-900'} px-4 pt-5 pb-20 rounded-b-[2.5rem] shadow-lg relative`}>
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <button
              onClick={() => toggleFavorite(selectedItem.id)}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <Heart
                size={22}
                className={isFavorite(selectedItem.id) ? 'fill-red-500 text-red-500' : 'text-white'}
              />
            </button>
          </div>
        </div>

        {/* Floating image circle - overlaps header */}
        <div className="flex justify-center -mt-16 mb-5 relative z-10">
          <div className={`w-32 h-32 rounded-full overflow-hidden flex items-center justify-center border-4 border-white shadow-xl bg-gradient-to-br ${currentCategory?.gradient || 'from-gray-200 to-gray-300'}`}>
            {selectedItem.image_url ? (
              <img
                src={selectedItem.image_url}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-6xl drop-shadow-lg">{currentCategory?.emoji}</span>
            )}
          </div>
        </div>

        {/* Item Name & Price */}
        <div className="text-center px-6 mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900">{selectedItem.name}</h2>
          <p className={`text-2xl font-extrabold mt-2 bg-gradient-to-r ${currentCategory?.gradient || 'from-gray-700 to-gray-900'} bg-clip-text text-transparent`}>
            {selectedItem.price.toFixed(2)} RON
          </p>
        </div>

        {/* Item Details */}
        <div className="mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {/* Gramaj */}
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⚖️</span>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Gramaj</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{selectedItem.gramaj}</p>
            </div>
          </div>

          {/* Alergeni */}
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Alergeni</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {selectedItem.alergeni
                  ? String(selectedItem.alergeni).replace(/([a-z])([A-Z])/g, '$1, $2')
                  : 'Niciun alergen specificat'}
              </p>
            </div>
          </div>

          {/* Observatii */}
          <div className="flex items-center gap-4 px-5 py-5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📝</span>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Observații</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {selectedItem.obs || 'Nicio observație'}
              </p>
            </div>
          </div>
        </div>

        {/* Fixed bottom: Quantity + CTA */}
        <div className="fixed bottom-20 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-full sm:max-w-md px-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100 p-4 flex items-center gap-3">
            {/* Quantity selector */}
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-2 py-1.5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform"
              >
                <Minus size={16} className="text-gray-600" />
              </button>
              <span className="text-lg font-extrabold text-gray-900 w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform"
              >
                <Plus size={16} className="text-gray-600" />
              </button>
            </div>

            {/* Add button with price */}
            <button
              onClick={() => {
                for (let i = 0; i < quantity; i++) {
                  handleAddToCart(selectedItem);
                }
                setQuantity(1);
                if (fromHome.current) {
                  fromHome.current = false;
                  navigate('/app/home');
                } else {
                  handleBack();
                }
              }}
              className={`flex-1 bg-gradient-to-r ${currentCategory?.gradient || 'from-orange-500 to-orange-600'} text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-lg active:scale-[0.97] hover:shadow-xl`}
            >
              Adaugă · {(selectedItem.price * quantity).toFixed(2)} RON
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
