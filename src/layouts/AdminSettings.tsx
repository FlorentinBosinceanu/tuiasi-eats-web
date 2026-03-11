import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AdminSettings() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        setFullName(profile?.full_name || '');
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      alert('Profile updated!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      alert(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Error sending reset:', error);
      alert('Failed to send password reset email');
    }
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-500">Manage your admin account</p>
      </div>

      {/* Profile Section */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-100 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Security Section */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Security</h2>

        <div>
          <p className="text-sm text-gray-600 mb-3">
            Send a password reset link to your email address.
          </p>
          <button
            onClick={handlePasswordReset}
            className="bg-slate-700 hover:bg-slate-800 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Reset Password
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p><span className="font-medium text-gray-900">App:</span> TUIASI EATS Admin</p>
          <p><span className="font-medium text-gray-900">Version:</span> 1.0.0</p>
          <p><span className="font-medium text-gray-900">Stack:</span> React + Supabase</p>
        </div>
      </div>
    </div>
  );
}
