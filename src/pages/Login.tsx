import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Email validation - must end with @student.tuiasi.ro, @staff.tuiasi.ro, or @tuiasi.ro
  const isValidTuiasiEmail = (emailAddress: string): boolean => {
    return (
      emailAddress.endsWith('@student.tuiasi.ro') ||
      emailAddress.endsWith('@staff.tuiasi.ro') ||
      emailAddress.endsWith('@tuiasi.ro')
    );
  };

  // Determine user role based on email domain
  const getUserRole = (emailAddress: string): 'student' | 'staff' | 'admin' => {
    if (emailAddress.endsWith('@student.tuiasi.ro')) {
      return 'student';
    }
    if (emailAddress.endsWith('@staff.tuiasi.ro') || emailAddress.endsWith('@tuiasi.ro')) {
      return 'staff';
    }
    return 'student'; // default fallback
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email format
    if (!isValidTuiasiEmail(email)) {
      setError('Only valid TUIASI email addresses are allowed.');
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || 'Invalid login credentials');
      } else {
        // Route based on user role
        const role = getUserRole(email);
        if (role === 'staff') {
          navigate('/admin/dashboard');
        } else {
          navigate('/app/home');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        {/* TUIASI EATS Logo */}
        <h1 className="text-3xl font-bold text-orange-500 text-center mb-8">TUIASI EATS</h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Email Input */}
        <div className="mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400"
            disabled={loading}
          />
        </div>

        {/* Password Input */}
        <div className="mb-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-400"
            disabled={loading}
          />
        </div>

        {/* Sign In Button (Primary) */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}
