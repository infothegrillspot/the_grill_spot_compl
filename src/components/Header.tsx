import React from 'react';
import { useApp } from '../context/AppContext';
import { Flame, ShoppingBag, User, Phone, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  const { cartCount, setActiveTab, activeTab, user, setAuthModalOpen, showToast } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md transition-colors duration-200 border-b border-orange-500/10 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 text-neutral-900 dark:text-neutral-50 shadow-xs">
      {/* Top Mobile-Optimized Announcement Bar */}
      <div className="bg-linear-to-r from-orange-600 via-amber-600 to-red-600 text-white text-[11px] sm:text-xs py-1.5 px-3 font-semibold flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-amber-200 shrink-0 animate-pulse" />
          <span className="truncate">
            Use code <strong className="underline underline-offset-2">GRILL20</strong> for 20% OFF!
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] shrink-0 font-medium">
          <span className="flex items-center gap-1 text-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="hidden xs:inline">Open •</span> 25-35m delivery
          </span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Logo & Restaurant Brand */}
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 sm:gap-3 group text-left cursor-pointer focus:outline-hidden min-w-0"
          aria-label="The Grill Spot Home"
        >
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-tr from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-xs" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-neutral-900 rounded-full" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg sm:text-2xl tracking-tight bg-linear-to-r from-orange-600 via-amber-600 to-red-600 dark:from-orange-400 dark:via-amber-400 dark:to-red-400 bg-clip-text text-transparent truncate">
                The Grill Spot
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 font-medium truncate leading-tight">
              Flames &amp; Prime BBQ Cuts
            </p>
          </div>
        </button>

        {/* Right: Theme Toggle, Quick Phone Call & Account / Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Call for Mobile Customers */}
          <a
            href="tel:+15554389201"
            onClick={() => showToast('Connecting call to The Grill Spot Kitchen...')}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Call Restaurant Directly"
            aria-label="Call Restaurant Directly"
          >
            <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline text-xs font-bold">Call Kitchen</span>
          </a>

          {/* Admin shortcut in header if user is admin */}
          {user && (user.email.toLowerCase() === 'info.thegrillspot@gmail.com' || user.role === 'admin') && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/25'
                  : 'border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
              }`}
              title="Restaurant Admin Dashboard"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}

          {/* User Profile / Login indicator */}
          {user ? (
            <button
              onClick={() => setActiveTab('account')}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'account'
                  ? 'bg-orange-50 dark:bg-orange-950/50 border-orange-500/50 text-orange-600 dark:text-orange-400'
                  : 'border-neutral-200 dark:border-neutral-700/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
              }`}
              title="Customer Account & Order Tracking"
            >
              <div className="w-6 h-6 rounded-full bg-linear-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold hidden md:inline max-w-[80px] truncate">
                {user.name}
              </span>
            </button>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-extrabold text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors cursor-pointer flex items-center gap-1"
              title="Login for Customer Order Tracking"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Cart Icon */}
          <button
            onClick={() => setActiveTab('cart')}
            className={`relative p-2 sm:px-3 sm:py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'cart'
                ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/25'
                : 'border-neutral-200 dark:border-neutral-700/80 bg-neutral-50 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-100'
            }`}
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
