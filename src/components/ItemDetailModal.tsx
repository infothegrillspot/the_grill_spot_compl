import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MenuItem, CartItemOption } from '../types';
import { X, Plus, Minus, Flame, Star, Clock, Check, Sparkles } from 'lucide-react';

export const ItemDetailModal: React.FC<{ item: MenuItem; onClose: () => void }> = ({ item, onClose }) => {
  const { addToCart } = useApp();

  const [quantity, setQuantity] = useState(1);
  const [selectedDoneness, setSelectedDoneness] = useState<string>(
    item.customizationOptions?.doneness ? item.customizationOptions.doneness[1] || item.customizationOptions.doneness[0] : ''
  );
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState<string>(
    item.customizationOptions?.spiceLevels ? item.customizationOptions.spiceLevels[0] : ''
  );
  const [selectedAddOns, setSelectedAddOns] = useState<{ name: string; price: number }[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const toggleAddOn = (addOn: { name: string; price: number }) => {
    if (selectedAddOns.some(a => a.name === addOn.name)) {
      setSelectedAddOns(prev => prev.filter(a => a.name !== addOn.name));
    } else {
      setSelectedAddOns(prev => [...prev, addOn]);
    }
  };

  const addOnsTotal = selectedAddOns.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = item.price + addOnsTotal;
  const totalPrice = Number((unitPrice * quantity).toFixed(2));

  const handleAddToCart = () => {
    const options: CartItemOption = {
      doneness: selectedDoneness || undefined,
      spiceLevel: selectedSpiceLevel || undefined,
      addOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
      specialInstructions: specialInstructions.trim() || undefined,
    };
    addToCart(item, options, quantity);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[28px] sm:rounded-3xl overflow-hidden shadow-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[88vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden absolute top-2 left-0 right-0 z-20 flex justify-center pointer-events-none">
          <div className="w-12 h-1.5 rounded-full bg-white/80 shadow-md" />
        </div>

        {/* Header Image with close button */}
        <div className="relative h-48 sm:h-64 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-colors cursor-pointer z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges in image */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {item.isBestseller && (
              <span className="px-2.5 py-1 text-xs font-extrabold bg-amber-500 text-black rounded-full shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> BESTSELLER
              </span>
            )}
            {item.isChefSpecial && (
              <span className="px-2.5 py-1 text-xs font-extrabold bg-red-600 text-white rounded-full shadow-sm">
                CHEF&apos;S CHOICE
              </span>
            )}
          </div>

          {/* Title on image overlay */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <h2 className="text-xl sm:text-2xl font-black leading-tight tracking-tight drop-shadow-md">
              {item.name}
            </h2>
            <div className="flex items-center gap-3 text-xs mt-1 text-neutral-200">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {item.rating} ({item.reviewCount}+)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {item.prepTime}
              </span>
              {item.calories && (
                <>
                  <span>•</span>
                  <span>{item.calories} kcal</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto scrollbar-none px-5 py-4 space-y-5 text-neutral-800 dark:text-neutral-200 divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Description & Base Price */}
          <div className="space-y-2">
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {item.description}
            </p>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                ${item.price.toFixed(2)}
              </span>
              {item.originalPrice && (
                <span className="text-sm text-neutral-400 line-through">
                  ${item.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Doneness Options (if applicable) */}
          {item.customizationOptions?.doneness && (
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Select Doneness <span className="text-orange-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Required</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {item.customizationOptions.doneness.map(doneness => {
                  const isSelected = selectedDoneness === doneness;
                  return (
                    <button
                      key={doneness}
                      type="button"
                      onClick={() => setSelectedDoneness(doneness)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                      }`}
                    >
                      <span>{doneness}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spice Level (if applicable) */}
          {item.customizationOptions?.spiceLevels && (
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Spice & Marinade Flavor
                </label>
              </div>
              <div className="space-y-1.5">
                {item.customizationOptions.spiceLevels.map(spice => {
                  const isSelected = selectedSpiceLevel === spice;
                  return (
                    <button
                      key={spice}
                      type="button"
                      onClick={() => setSelectedSpiceLevel(spice)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-medium text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                          : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span>{spice}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons (Optional) */}
          {item.customizationOptions?.addOns && (
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Upgrade & Extra Toppings
                </label>
                <span className="text-[11px] text-neutral-400">Optional</span>
              </div>
              <div className="space-y-2">
                {item.customizationOptions.addOns.map(addon => {
                  const isChecked = selectedAddOns.some(a => a.name === addon.name);
                  return (
                    <div
                      key={addon.name}
                      onClick={() => toggleAddOn(addon)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-orange-500/80 bg-orange-50/70 dark:bg-orange-950/30'
                          : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/50 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                            isChecked
                              ? 'bg-orange-600 border-orange-600 text-white'
                              : 'border-neutral-400 dark:border-neutral-600 bg-white dark:bg-neutral-900'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                          {addon.name}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                        +${addon.price.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions Note */}
          <div className="pt-4 space-y-1.5">
            <label className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
              Special Instructions for the Pitmaster
            </label>
            <input
              type="text"
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="e.g. sauce on side, extra napkins, cut into halves..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Footer with quantity and Add to Cart button */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/90 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3 shrink-0">
          {/* Quantity selector */}
          <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 p-1">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-30 text-neutral-700 dark:text-neutral-300 cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Add to Cart button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-md shadow-orange-500/25 flex items-center justify-between transition-all cursor-pointer"
          >
            <span>Add to Cart</span>
            <span>${totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
