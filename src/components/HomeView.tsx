import React from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/menuData';
import {
  Flame,
  Star,
  Clock,
  Plus,
  ArrowRight,
  ShieldCheck,
  Award,
  Sparkles,
  Truck,
  Check,
  Search,
  Phone
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    setActiveTab,
    setSelectedCategory,
    setSelectedItemForDetail,
    addToCart,
    activeOrder,
    applyPromoCode,
    appliedPromo,
    setSearchQuery,
    showToast,
    menuItems
  } = useApp();

  const bestsellers = menuItems.filter(item => item.isBestseller);
  const chefSpecials = menuItems.filter(item => item.isChefSpecial);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10">
      {/* Live Active Order Alert Banner if in progress */}
      {activeOrder && (
        <div
          onClick={() => setActiveTab('orders')}
          className="cursor-pointer bg-linear-to-r from-orange-600 via-amber-600 to-red-600 text-white p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-lg shadow-orange-500/20 active:scale-[0.99] transition-all flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-amber-200 animate-bounce" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-xs font-black tracking-wider uppercase bg-black/25 px-2 py-0.5 rounded-full">
                  Order {activeOrder.orderNumber}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-xs sm:text-sm font-bold mt-0.5 truncate">
                {activeOrder.status === 'confirmed' && 'Order confirmed! Searing coals...'}
                {activeOrder.status === 'grilling' && 'On the open mesquite charcoal grill...'}
                {activeOrder.status === 'quality_check' && 'Inspected & sealed in thermal bags...'}
                {activeOrder.status === 'out_for_delivery' && `Courier on the way! ETA: ${activeOrder.estimatedDeliveryTime}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-extrabold bg-white text-orange-700 px-2.5 py-1.5 rounded-xl group-hover:bg-orange-50 transition-colors shrink-0">
            <span>Track</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Quick Mobile Search Bar right inside Home (Foodpanda pattern) */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="Craving burgers, steaks, ribs, or fries?"
          onClick={() => setActiveTab('search')}
          onChange={e => {
            setSearchQuery(e.target.value);
            setActiveTab('search');
          }}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-sm shadow-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500 cursor-pointer"
          readOnly={false}
        />
        <button
          onClick={() => setActiveTab('search')}
          className="absolute right-2.5 top-2 px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Mobile-Reliable Hero Promotional Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-950 text-white shadow-xl">
        {/* Background Image with optimized dark scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1600&q=80"
            alt="The Grill Spot BBQ"
            className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/50" />
          <div className="absolute inset-0 bg-radial from-orange-600/30 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 p-5 sm:p-8 max-w-xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-600/30 border border-orange-500/40 text-orange-300 text-[11px] font-bold uppercase tracking-wider backdrop-blur-md">
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>Open Mesquite Charcoal Grill</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Craving Sizzling <br className="hidden xs:inline" />
            <span className="bg-linear-to-r from-orange-400 via-amber-300 to-red-400 bg-clip-text text-transparent">
              Prime BBQ Cuts?
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 font-normal leading-relaxed line-clamp-2 sm:line-clamp-none">
            From smoky Texas brisket and flame burgers to Tomahawk ribeyes — delivered sizzling hot in insulated thermal packs.
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setActiveTab('search');
              }}
              className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <span>Order Now</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={() => applyPromoCode('GRILL20')}
              className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                appliedPromo === 'GRILL20'
                  ? 'border-emerald-500 bg-emerald-950/70 text-emerald-300'
                  : 'border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md'
              }`}
            >
              {appliedPromo === 'GRILL20' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>20% OFF Applied</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>20% OFF (GRILL20)</span>
                </>
              )}
            </button>
          </div>

          {/* Value Props Row */}
          <div className="pt-3 grid grid-cols-3 gap-2 border-t border-neutral-800/80 text-neutral-300 text-[10px] sm:text-[11px] font-semibold">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-orange-400 shrink-0" />
              <span className="truncate">25-35m Fast ETA</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">100% Halal Prime</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">Thermal Packed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fast Horizontal Categories Bar */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-50">
            Categories
          </h2>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setActiveTab('search');
            }}
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Scrollable pill bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setActiveTab('search');
              }}
              className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-500 text-neutral-800 dark:text-neutral-200 text-xs font-bold whitespace-nowrap shadow-2xs flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Bestseller Highlights with Mobile-First Responsive Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              Most Popular Grill Sizzlers
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setActiveTab('search');
            }}
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
          >
            Full Menu
          </button>
        </div>

        {/* Mobile Horizontal Food Card & Desktop Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {bestsellers.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItemForDetail(item)}
              className="rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-row sm:flex-col active:scale-[0.99]"
            >
              {/* Image Column (Compact on mobile, top on desktop) */}
              <div className="relative w-28 sm:w-full h-28 sm:h-44 overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80';
                  }}
                />
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black bg-amber-500 text-black rounded-md shadow-xs">
                    ★ Bestseller
                  </span>
                </div>
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {item.prepTime}
                </div>
              </div>

              {/* Content Column */}
              <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <h3 className="font-extrabold text-xs sm:text-base text-neutral-900 dark:text-neutral-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-0.5 text-[11px] font-bold text-amber-500 shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{item.rating}</span>
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 leading-tight">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-800/60 mt-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm sm:text-lg font-black text-neutral-900 dark:text-neutral-50">
                      ${item.price.toFixed(2)}
                    </span>
                    {item.originalPrice && (
                      <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                        ${item.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      if (item.customizationOptions?.doneness || item.customizationOptions?.addOns) {
                        setSelectedItemForDetail(item);
                      } else {
                        addToCart(item);
                      }
                    }}
                    className="px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-orange-50 hover:bg-orange-600 dark:bg-orange-950/60 dark:hover:bg-orange-600 text-orange-600 hover:text-white dark:text-orange-300 dark:hover:text-white font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    title="Add to Cart"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Chef's Signature Picks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-red-500" />
            <h2 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 dark:text-neutral-50">
              Pitmaster Prime Signatures
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('steaks');
              setActiveTab('search');
            }}
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
          >
            See Steaks
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {chefSpecials.slice(0, 4).map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItemForDetail(item)}
              className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={e => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400 tracking-wider">
                  Chef Choice
                </span>
                <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400">
                  {item.name}
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs sm:text-sm font-black text-neutral-900 dark:text-neutral-100">
                    ${item.price.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedItemForDetail(item);
                    }}
                    className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                  >
                    Customize &rarr;
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Direct Restaurant Contact Footer Card for Mobile Customers */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
            Need Direct Support or Custom Catering?
          </h4>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            The Grill Spot Pitmasters are ready on the phone line 11 AM - 11:30 PM.
          </p>
        </div>
        <a
          href="tel:+15554389201"
          onClick={() => showToast('Calling The Grill Spot...')}
          className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2 cursor-pointer shadow-2xs shrink-0"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-500" />
          <span>+1 (555) 438-9201</span>
        </a>
      </div>
    </div>
  );
};
