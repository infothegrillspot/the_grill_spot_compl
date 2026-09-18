import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { MenuSearchView } from './components/MenuSearchView';
import { CartView } from './components/CartView';
import { OrdersView } from './components/OrdersView';
import { AccountView } from './components/AccountView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ItemDetailModal } from './components/ItemDetailModal';
import { AuthModal } from './components/AuthModal';
import { CheckCircle, ShoppingBag, ArrowRight } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedItemForDetail,
    setSelectedItemForDetail,
    authModalOpen,
    setAuthModalOpen,
    cartCount,
    cartSubtotal,
    toast
  } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-200 antialiased font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      {/* Top Header */}
      <Header />

      {/* Main Page Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-6 pb-28 sm:pb-32">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'search' && <MenuSearchView />}
        {activeTab === 'cart' && <CartView />}
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'account' && <AccountView />}
        {activeTab === 'admin' && <AdminDashboardView />}
      </main>

      {/* Floating Quick Cart Bar for Mobile Viewers (Like Foodpanda) */}
      {cartCount > 0 && activeTab !== 'cart' && (
        <div className="fixed bottom-16 sm:bottom-18 left-0 right-0 z-30 px-3 max-w-md mx-auto pointer-events-none animate-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={() => setActiveTab('cart')}
            className="pointer-events-auto w-full bg-linear-to-r from-orange-600 via-amber-600 to-red-600 text-white p-3.5 rounded-2xl shadow-xl shadow-orange-600/35 flex items-center justify-between font-black text-sm active:scale-98 transition-transform cursor-pointer border border-white/20"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-black/25 backdrop-blur-xs flex items-center justify-center text-xs font-black">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold">
                {cartCount} {cartCount === 1 ? 'item' : 'items'} in Cart
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm bg-black/20 px-3 py-1 rounded-xl">
              <span>${cartSubtotal.toFixed(2)}</span>
              <span className="opacity-75">• View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-16 sm:top-20 right-3 sm:right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-200 max-w-sm">
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xl border border-neutral-700 dark:border-neutral-200 text-xs font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toast}</span>
          </div>
        </div>
      )}

      {/* Item Detail / Customization Modal (Mobile-first Bottom Sheet) */}
      {selectedItemForDetail && (
        <ItemDetailModal
          item={selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
        />
      )}

      {/* Auth Modal (Triggered on checkout or manual login) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Bottom Navigation Bar */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
