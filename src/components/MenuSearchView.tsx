import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/menuData';
import { Search, X, Flame, Star, Clock, Plus, SlidersHorizontal } from 'lucide-react';

export const MenuSearchView: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    setSelectedItemForDetail,
    addToCart,
    menuItems
  } = useApp();

  const [onlySpicy, setOnlySpicy] = useState(false);
  const [onlyBestsellers, setOnlyBestsellers] = useState(false);
  const [under15, setUnder15] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price-low' | 'price-high' | 'rating'>('recommended');

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (item.name || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchCat = (item.category || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      // Spicy filter
      if (onlySpicy && !item.isSpicy) return false;
      // Bestseller filter
      if (onlyBestsellers && !item.isBestseller) return false;
      // Price filter
      if (under15 && item.price >= 15) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // recommended order
    });
  }, [selectedCategory, searchQuery, onlySpicy, onlyBestsellers, under15, sortBy]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Header title */}
      <div>
        <h1 className="text-xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
          Menu &amp; Search
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
          Flame-grilled steaks, brisket, burgers, and skewers made fresh to order
        </p>
      </div>

      {/* Mobile-Friendly Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 sm:w-5 sm:h-5 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search burger, ribeye, ribs, kebab..."
          className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-neutral-400">
          <span>Categories</span>
          <span className="text-[11px] font-normal">{filteredItems.length} dishes available</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/25 ring-1 ring-orange-500'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Filter Chips for Mobile View */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0 text-xs">
        <button
          onClick={() => setOnlySpicy(!onlySpicy)}
          className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
            onlySpicy
              ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-600 dark:text-red-400'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-red-500" />
          <span>Spicy</span>
        </button>

        <button
          onClick={() => setOnlyBestsellers(!onlyBestsellers)}
          className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
            onlyBestsellers
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-400'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Bestseller</span>
        </button>

        <button
          onClick={() => setUnder15(!under15)}
          className={`px-3 py-1.5 rounded-xl border font-bold shrink-0 cursor-pointer transition-colors ${
            under15
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-400'
              : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <span>Under $15</span>
        </button>

        <div className="ml-auto flex items-center gap-1 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-2 py-1 text-xs text-neutral-700 dark:text-neutral-300 font-bold focus:outline-hidden"
          >
            <option value="recommended">Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Menu Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
            No grill dishes matched your search
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setOnlySpicy(false);
              setOnlyBestsellers(false);
              setUnder15(false);
            }}
            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSelectedItemForDetail(item)}
              className="rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-row sm:flex-col active:scale-[0.99]"
            >
              {/* Image */}
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
                  {item.isBestseller && (
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black bg-amber-500 text-black rounded-md shadow-xs">
                      ★ Bestseller
                    </span>
                  )}
                  {item.isSpicy && (
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold bg-red-600 text-white rounded-md shadow-xs flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5" /> Hot
                    </span>
                  )}
                </div>
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {item.prepTime}
                </div>
              </div>

              {/* Content */}
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
      )}
    </div>
  );
};
