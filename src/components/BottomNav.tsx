import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../types';
import { Home, Search, ShoppingBag, Clock, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, cartCount, activeOrder, user } = useApp();

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: number | boolean }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Menu Search', icon: Search },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: cartCount > 0 ? cartCount : undefined },
    { id: 'orders', label: 'Orders', icon: Clock, badge: !!activeOrder },
    { id: 'account', label: 'Account', icon: User, badge: !user ? false : undefined },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 transition-colors duration-200 shadow-2xl safe-area-pb"
      aria-label="Bottom Navigation"
    >
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all duration-150 min-w-[58px] sm:min-w-[66px] cursor-pointer touch-manipulation active:scale-95 ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400 font-extrabold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200 font-medium'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.6]' : 'opacity-80'
                  }`}
                />

                {/* Badge for Cart count */}
                {item.id === 'cart' && typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[10px] font-black min-w-[17px] h-[17px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900 shadow-xs">
                    {item.badge}
                  </span>
                )}

                {/* Pulsing indicator for Active Order in progress */}
                {item.id === 'orders' && item.badge === true && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-600" />
                  </span>
                )}

                {/* Small indicator dot for active logged-in user on Account */}
                {item.id === 'account' && user && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-neutral-900" />
                )}
              </div>

              <span className={`text-[11px] mt-1 tracking-tight leading-none ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>

              {/* Active indicator bar/dot */}
              {isActive && (
                <span className="w-4 h-1 rounded-full bg-orange-600 dark:bg-orange-400 mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
