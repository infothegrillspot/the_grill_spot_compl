import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  Sun,
  Moon,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Clock,
  ChevronRight,
  Sparkles,
  Plus,
  Check,
  Flame,
  Award,
  Settings,
  ShieldAlert,
  Edit2
} from 'lucide-react';

export const AccountView: React.FC = () => {
  const {
    theme,
    toggleTheme,
    user,
    isAdmin,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    updateUserProfile,
    setActiveTab,
    activeOrder,
    orders,
    showToast
  } = useApp();

  // Auth form state if logged out
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address editing state for logged-in user
  const [newAddressInput, setNewAddressInput] = useState('');
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneInput, setEditPhoneInput] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    if (authMode === 'login') {
      const res = await loginWithEmail(email, password);
      setIsSubmitting(false);
      if (!res.success) {
        setAuthError(res.error || 'Failed to login');
      }
    } else {
      const res = await registerWithEmail(name, email, password, phone, address);
      setIsSubmitting(false);
      if (!res.success) {
        setAuthError(res.error || 'Failed to register account');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    const res = await loginWithGoogle();
    setIsSubmitting(false);
    if (!res.success) {
      setAuthError(res.error || 'Google login failed');
    }
  };

  const handleSaveSecondaryAddress = async () => {
    if (!newAddressInput.trim() || !user) return;
    await updateUserProfile({
      secondaryAddress: newAddressInput.trim()
    });
    setIsAddingAddress(false);
    setNewAddressInput('');
  };

  const handleSavePhone = async () => {
    if (!editPhoneInput.trim() || !user) return;
    await updateUserProfile({
      phone: editPhoneInput.trim()
    });
    setIsEditingPhone(false);
  };

  return (
    <div className="space-y-6 pb-16 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            Customer Account &amp; Preferences
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage your secure profile, live order tracking, and theme display settings
          </p>
        </div>

        {/* Admin Shortcut if Admin user is logged in */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className="px-3.5 py-2 rounded-2xl bg-linear-to-r from-orange-600 to-amber-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/30 cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Admin Console</span>
          </button>
        )}
      </div>

      {/* Prominent Theme & Readability Switcher Card (Explicitly requested by user) */}
      <section
        id="theme-readability-section"
        className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 space-y-4 shadow-xs"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50">
                Display Theme &amp; Readability
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Switch between high-contrast light and soothing dark modes for optimal reading
              </p>
            </div>
          </div>
          <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              if (theme !== 'light') toggleTheme();
            }}
            className={`p-4 rounded-2xl border-2 transition-all text-left cursor-pointer flex flex-col justify-between h-24 ${
              theme === 'light'
                ? 'border-orange-500 bg-orange-50/50 shadow-sm'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-orange-600' : 'text-neutral-400'}`} />
              {theme === 'light' && <Check className="w-4 h-4 text-orange-600" />}
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Light Mode</p>
              <p className="text-[10px] text-neutral-500">Daytime outdoor visibility</p>
            </div>
          </button>

          <button
            onClick={() => {
              if (theme !== 'dark') toggleTheme();
            }}
            className={`p-4 rounded-2xl border-2 transition-all text-left cursor-pointer flex flex-col justify-between h-24 ${
              theme === 'dark'
                ? 'border-orange-500 bg-orange-950/40 shadow-sm'
                : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-amber-400' : 'text-neutral-400'}`} />
              {theme === 'dark' && <Check className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Dark Mode</p>
              <p className="text-[10px] text-neutral-500">Night dining &amp; eye-comfort</p>
            </div>
          </button>
        </div>
      </section>

      {/* User Status Section */}
      {user ? (
        /* LOGGED IN VIEW */
        <div className="space-y-6">
          {/* User Profile Card */}
          <section className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-orange-600 to-amber-500 text-white font-black text-xl flex items-center justify-center shadow-md shadow-orange-500/25 shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                      {user.name}
                    </h2>
                    {isAdmin && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] uppercase">
                        Admin / Pitmaster
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                    {user.email}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors w-fit"
              >
                <LogOut className="w-3.5 h-3.5 text-neutral-500" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Account Details & Verified Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-start justify-between">
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                      Phone Number
                    </span>
                    {isEditingPhone ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="tel"
                          value={editPhoneInput}
                          onChange={e => setEditPhoneInput(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="px-2 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs"
                        />
                        <button
                          onClick={handleSavePhone}
                          className="px-2 py-1 bg-orange-600 text-white rounded-lg text-[10px] font-bold"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {user.phone || 'No phone set'}
                      </span>
                    )}
                  </div>
                </div>
                {!isEditingPhone && (
                  <button
                    onClick={() => {
                      setEditPhoneInput(user.phone || '');
                      setIsEditingPhone(true);
                    }}
                    className="text-neutral-400 hover:text-orange-600 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800 flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 block">
                    Verified Firebase Auth
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 truncate block">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Saved Delivery Addresses for Fast Foodpanda-Style Checkout */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-xs font-black uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
                    Saved Delivery Addresses
                  </h3>
                </div>
                {!isAddingAddress && !user.secondaryAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Office/Work Address</span>
                  </button>
                )}
              </div>

              {/* Primary Address */}
              <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-start justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Primary Address
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black uppercase">
                      Default
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    {user.address}
                  </p>
                </div>
              </div>

              {/* Secondary Address if exists */}
              {user.secondaryAddress && (
                <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Secondary Address (Work / Office)
                    </span>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300">
                      {user.secondaryAddress}
                    </p>
                  </div>
                </div>
              )}

              {/* Form to add secondary address */}
              {isAddingAddress && (
                <div className="p-3.5 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-800/80 bg-orange-50/40 dark:bg-orange-950/20 space-y-2.5">
                  <label className="block text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Add New Address (e.g. Work, Apt, Studio)
                  </label>
                  <input
                    type="text"
                    value={newAddressInput}
                    onChange={e => setNewAddressInput(e.target.value)}
                    placeholder="e.g. 100 Tech Hub Plaza, Floor 8"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveSecondaryAddress}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold cursor-pointer hover:bg-orange-500"
                    >
                      Save Address
                    </button>
                    <button
                      onClick={() => setIsAddingAddress(false)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Quick Shortcuts to Orders & Rewards */}
          <section className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-black uppercase text-neutral-500 dark:text-neutral-400 tracking-wider">
              Quick Shortcuts
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('orders')}
                className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-left transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Active Orders &amp; History
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {activeOrder ? '1 order currently in progress' : `${orders.length} past orders`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-left transition-colors cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      Order Food Now
                    </h4>
                    <p className="text-[11px] text-neutral-500">Browse live pitmaster BBQ menu</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          </section>
        </div>
      ) : (
        /* LOGGED OUT VIEW - INLINE SECURE AUTH (Google + Email) */
        <section className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="text-center max-w-sm mx-auto space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-50">
              Sign In to The Grill Spot
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Required for Foodpanda-style live order dispatch, address storage, and administrator terminal access
            </p>
          </div>

          {/* Google Sign-in */}
          <div className="max-w-md mx-auto">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-100 font-extrabold text-xs flex items-center justify-center gap-3 shadow-xs cursor-pointer transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <span className="relative px-3 bg-white dark:bg-neutral-900 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Or with email
              </span>
            </div>

            {/* Auth Mode Toggle */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  authMode === 'login'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold'
                    : 'border-transparent text-neutral-500'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  authMode === 'register'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold'
                    : 'border-transparent text-neutral-500'
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-semibold text-red-600 dark:text-red-400">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="info.thegrillspot@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 438-9201"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="450 Flame Blvd, Apt 4B"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs shadow-md shadow-orange-500/25 cursor-pointer transition-all disabled:opacity-50"
              >
                {authMode === 'login' ? 'Sign In & Track Orders' : 'Create Customer Account'}
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
};
