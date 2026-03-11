import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, User, Phone, Leaf, Shield, Save, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

const allergyOptions = [
  { id: 'gluten', label: 'Gluten', emoji: '🌾' },
  { id: 'lactose', label: 'Lactose', emoji: '🥛' },
  { id: 'nuts', label: 'Nuts', emoji: '🥜' },
  { id: 'eggs', label: 'Eggs', emoji: '🥚' },
  { id: 'soy', label: 'Soy', emoji: '🫘' },
  { id: 'fish', label: 'Fish', emoji: '🐟' },
  { id: 'shellfish', label: 'Shellfish', emoji: '🦐' },
  { id: 'celery', label: 'Celery', emoji: '🥬' },
];

const dietOptions = [
  { id: 'none', label: 'No preference', emoji: '🍽️' },
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
  { id: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
];

export default function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [diet, setDiet] = useState('none');
  const [allergies, setAllergies] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return;

        setEmail(authData.user.email || '');

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, diet, allergies')
          .eq('id', authData.user.id)
          .single();

        if (profile) {
          setFullName(profile.full_name || '');
          setPhone(profile.phone || '');
          setDiet(profile.diet || 'none');
          setAllergies(profile.allergies || []);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const toggleAllergy = (id: string) => {
    setAllergies(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ phone, diet, allergies })
        .eq('id', authData.user.id);

      if (error) {
        console.error('Error saving profile:', error);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-500 px-5 pt-10 pb-6 rounded-b-3xl shadow-lg shadow-green-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/profile')}
            className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">My Information</h1>
            <p className="text-green-100 text-sm">View & manage your profile</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-5 space-y-4">
        {/* University-Provided Info */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Shield size={14} className="text-blue-500" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">University Account</span>
            <span className="ml-auto text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Managed by TUIASI</span>
          </div>

          {/* Full Name — read-only */}
          <div className="px-4 py-3.5 border-b border-gray-50">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Full Name</label>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">{fullName || 'Not set'}</p>
            </div>
          </div>

          {/* Email — read-only */}
          <div className="px-4 py-3.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Email</label>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">{email}</p>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Personal Details</span>
          </div>

          {/* Phone Number */}
          <div className="px-4 py-3.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Phone Number</label>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                <Phone size={16} className="text-green-500" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XX XXX XXX"
                className="flex-1 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Dietary Preference */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Leaf size={14} className="text-green-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dietary Preference</span>
          </div>

          <div className="p-4 grid grid-cols-2 gap-2">
            {dietOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setDiet(opt.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  diet === opt.id
                    ? 'bg-green-50 border-green-300 text-green-700 shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-base">{opt.emoji}</span>
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Allergies & Intolerances</span>
            <p className="text-[10px] text-gray-400 mt-0.5">Select any that apply to you</p>
          </div>

          <div className="p-4 grid grid-cols-2 gap-2">
            {allergyOptions.map(opt => {
              const active = allergies.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleAllergy(opt.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    active
                      ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span className="truncate">{opt.label}</span>
                  {active && <Check size={14} className="ml-auto text-red-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-gray-900 hover:bg-gray-800 text-white active:scale-[0.98]'
          } ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {saved ? (
            <>
              <Check size={20} />
              Saved!
            </>
          ) : saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
