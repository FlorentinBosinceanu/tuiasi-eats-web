import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import BottomNav from './BottomNav';

export default function StudentLayout() {
  return (
    <div className="min-h-screen bg-white sm:bg-gradient-to-br sm:from-orange-50 sm:via-white sm:to-amber-50 flex justify-center items-start">
      <div className="w-full sm:max-w-md bg-white sm:bg-white/80 sm:backdrop-blur-sm relative sm:shadow-[0_0_60px_rgba(0,0,0,0.08)] min-h-screen flex flex-col">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20">
          <Outlet />
        </main>

        {/* Bottom Navigation */}
        <BottomNav />

        {/* Toast Notifications */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
            style: { background: '#1f2937', color: '#fff', borderRadius: '12px', fontSize: '14px', fontWeight: '600', padding: '12px 16px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </div>
    </div>
  );
}
