import React, { useState, useEffect } from 'react';
import Home from './pages/Home';  
import Login from './pages/Login';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import StudentLayout from './components/StudentLayout';
import AdminLayout from './layouts/AdminLayout';
import AdminMenu from './layouts/AdminMenu';
import AdminOrders from './layouts/AdminOrders';
import AdminDashboard from './layouts/AdminDashboard';
import AdminSettings from './layouts/AdminSettings';
import Profile from './pages/Profile';
import OrderHistory from './pages/OrderHistory';
import CurrentOrder from './pages/CurrentOrder';
import OrderSuccess from './pages/OrderSuccess';
import EditProfile from './pages/EditProfile';
import StudentSettings from './pages/StudentSettings';
import { CartProvider } from './lib/CartContext';
import { supabase } from './lib/supabase';
import {
  Routes,
  Route,
  Navigate,
  Link,
} from 'react-router-dom';

// ==========================================
// 1. UTILITY COMPONENTS & WRAPPERS
// ==========================================

// Auth guard — checks for a real Supabase session
function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Admin guard — checks session + staff/admin email domain
function AdminGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const email = session.user.email;
        const isStaff =
          email.endsWith('@staff.tuiasi.ro') ||
          email.endsWith('@tuiasi.ro');
        setAuthorized(isStaff);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// ==========================================
// 2. LAYOUT COMPONENTS
// ==========================================

// AdminLayout is imported from layouts/AdminLayout.tsx

// ==========================================
// 3. PAGE COMPONENTS
// ==========================================

const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-center">
    <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
    <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
    <p className="text-gray-600 mb-8">Oops! It looks like this page doesn't exist.</p>
    <Link to="/app/home" className="bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700">
      Take Me Home
    </Link>
  </div>
);

// ==========================================
// 4. MAIN APP ROUTER
// ==========================================

export default function App() {
  return (
    <CartProvider>
      <Routes>
      <Route path="/" element={<Login />} />

      {/* Student Routes — requires authenticated session */}
      <Route path="/app" element={
        <AuthGuard>
          <StudentLayout />
        </AuthGuard>
      }>
        <Route path="home" element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="cart" element={<Cart />} />
        <Route path="order-history" element={<OrderHistory />} />
        <Route path="current-order" element={<CurrentOrder />} />
        <Route path="edit-profile" element={<EditProfile />} />
        <Route path="settings" element={<StudentSettings />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-success" element={<OrderSuccess />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin Routes — requires staff/admin email */}
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="menu" element={<AdminMenu />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Catch-all Route for 404s */}
      <Route path="*" element={<NotFound />} />
      </Routes>
    </CartProvider>
  );
}