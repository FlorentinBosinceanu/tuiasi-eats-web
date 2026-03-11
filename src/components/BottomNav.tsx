import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, ClipboardList, User } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { to: '/app/home', label: 'Home', icon: Home },
    { to: '/app/menu', label: 'Menu', icon: UtensilsCrossed },
    { to: '/app/cart', label: 'Orders', icon: ClipboardList },
    { to: '/app/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 w-full sm:max-w-md bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-50">
      <div className="flex justify-around items-center py-2 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-orange-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-orange-50' : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-orange-500' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
