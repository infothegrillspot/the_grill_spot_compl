import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck, Tag, Check, MapPin, Phone, CreditCard, DollarSign, Wallet, Utensils, Loader2 } from 'lucide-react';

export const CartView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    updateCartQty,
    removeFromCart,
    clearCart,
    appliedPromo,
    promoDiscount,
    applyPromoCode,
    removePromoCode,
    user,
    setAuthModalOpen,
    placeOrder,
    setActiveTab,
    showToast
  } = useApp();

  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [selectedTip, setSelectedTip] = useState<number>(3.00);
  const [paymentMethod, setPaymentMethod] = useState<'Cash on Delivery' | 'Credit / Debit Card' | 'Digital Wallet'>('Credit / Debit Card');
  const [specialNote, setSpecialNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable delivery address & phone if user wants custom for this order
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '450 Flame Blvd, Apt 4B, Foodie District');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '+1 (555) 438-9201');

  const deliveryFee = orderType === 'delivery' ? 2.99 : 0.00;
  const tax = Number((cartSubtotal * 0.0825).toFixed(2));
  const orderTotal = Math.max(0, Number((cartSubtotal + deliveryFee + tax + selectedTip - promoDiscount).toFixed(2)));

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    if (!res.success) {
      setPromoError(res.message);
    } else {
      setPromoInput('');
    }
  };

  const handlePlaceOrderClick = async () => {
    if (isSubmitting) return;

    if (cart.length === 0) {
      showToast('Your cart is empty');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      showToast('Please enter your delivery street address');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await placeOrder({
        orderType,
        deliveryAddress: deliveryAddress.trim() || '450 Flame Blvd, Apt 4B, Foodie District',
        customerPhone: customerPhone.trim() || '+1 (555) 438-9201',
        paymentMethod,
        specialInstructions: specialNote.trim() || undefined,
        tip: selectedTip,
      });

      if (!res.success && res.error) {
        showToast(res.error);
      }
    } catch (err: any) {
      console.error('Failed to complete order checkout:', err);
      showToast('Could not complete order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4 max-w-md mx-auto my-6">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto shadow-inner">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
          Your Cart is Empty
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Looks like you haven&apos;t added any sizzling steaks, burgers, or skewers to your grill bag yet.
        </p>
        <button
          onClick={() => setActiveTab('search')}
          className="px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 cursor-pointer transition-all inline-flex items-center gap-2"
        >
          <span>Explore Sizzling Menu</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
            Review Your Grill Order
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {cart.length} item{cart.length > 1 ? 's' : ''} in your order bag
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
        >
          Clear All
        </button>
      </div>

      {/* Order Type Toggle: Delivery vs Pickup */}
      <div className="p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 grid grid-cols-2 gap-1 text-xs font-extrabold">
        <button
          type="button"
          onClick={() => setOrderType('delivery')}
          className={`py-2.5 rounded-xl transition-all cursor-pointer ${
            orderType === 'delivery'
              ? 'bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
          }`}
        >
          Delivery (25–35 mins) • $2.99
        </button>
        <button
          type="button"
          onClick={() => setOrderType('pickup')}
          className={`py-2.5 rounded-xl transition-all cursor-pointer ${
            orderType === 'pickup'
              ? 'bg-white dark:bg-neutral-900 text-orange-600 dark:text-orange-400 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
          }`}
        >
          Self-Pickup (15–20 mins) • Free
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cart Items & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Items Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 divide-y divide-neutral-100 dark:divide-neutral-800 shadow-xs">
            {cart.map(item => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-3 sm:gap-4 items-start">
                <img
                  src={item.menuItem.image}
                  alt={item.menuItem.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-neutral-100 dark:bg-neutral-800 shrink-0"
                  onError={e => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80';
                  }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
                      {item.menuItem.name}
                    </h3>
                    <span className="font-black text-sm text-neutral-900 dark:text-neutral-50 shrink-0">
                      ${item.totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Customization labels */}
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 space-y-0.5 mt-1">
                    {item.options?.doneness && (
                      <p>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">Doneness:</span> {item.options.doneness}
                      </p>
                    )}
                    {item.options?.spiceLevel && (
                      <p>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">Spice:</span> {item.options.spiceLevel}
                      </p>
                    )}
                    {item.options?.addOns && item.options.addOns.length > 0 && (
                      <p>
                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">Add-ons:</span>{' '}
                        {item.options.addOns.map(a => `${a.name} (+$${a.price.toFixed(2)})`).join(', ')}
                      </p>
                    )}
                    {item.options?.specialInstructions && (
                      <p className="italic text-amber-600 dark:text-amber-400">
                        &quot;{item.options.specialInstructions}&quot;
                      </p>
                    )}
                  </div>

                  {/* Quantity and Remove */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl bg-neutral-50 dark:bg-neutral-800 p-0.5">
                      <button
                        onClick={() => updateCartQty(item.id, item.quantity - 1)}
                        className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                        aria-label="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-black text-neutral-900 dark:text-neutral-100">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQty(item.id, item.quantity + 1)}
                        className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                        aria-label="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-neutral-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Details Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span>{orderType === 'delivery' ? 'Delivery Destination' : 'Pickup Location'}</span>
              </h3>
              {user && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                  Logged in as {user.name}
                </span>
              )}
            </div>

            {orderType === 'delivery' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Street Address &amp; Apartment
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. 450 Flame Blvd, Apt 4B"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                    Contact Phone (for Rider Delivery Updates)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral-400" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+1 (555) 438-9201"
                      className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-2.5">
                <Utensils className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">
                    The Grill Spot Main Kitchen
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    128 Hickory Charcoal Way, Foodie Quarter. Present your order number at the express pickup counter.
                  </p>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1">
                Order Delivery Note (Optional)
              </label>
              <input
                type="text"
                value={specialNote}
                onChange={e => setSpecialNote(e.target.value)}
                placeholder="e.g. Leave at front porch, ring buzzer 4B..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Vouchers, Payment, Summary & Checkout (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Promo Code Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3 shadow-xs">
            <h3 className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-orange-500" />
              <span>Promo Code &amp; Grill Vouchers</span>
            </h3>

            {appliedPromo ? (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                      {appliedPromo} APPLIED
                    </span>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Saving ${promoDiscount.toFixed(2)} on this order
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removePromoCode}
                  className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter code e.g. GRILL20"
                    className="flex-1 px-3 py-2 text-xs uppercase font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl text-xs font-bold cursor-pointer hover:bg-neutral-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-[11px] font-semibold text-red-500">{promoError}</p>
                )}
                {/* Quick click suggestions */}
                <div className="flex items-center gap-2 text-[11px] pt-1 text-neutral-500">
                  <span>Try:</span>
                  <button
                    type="button"
                    onClick={() => applyPromoCode('GRILL20')}
                    className="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
                  >
                    GRILL20 (20% off)
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => applyPromoCode('FIRSTBITE')}
                    className="text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
                  >
                    FIRSTBITE ($5 off)
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3 shadow-xs">
            <h3 className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
              Payment Method
            </h3>
            <div className="space-y-2">
              {[
                { id: 'Credit / Debit Card', icon: CreditCard, subtitle: 'Visa, Mastercard, Amex' },
                { id: 'Cash on Delivery', icon: DollarSign, subtitle: 'Pay directly to rider' },
                { id: 'Digital Wallet', icon: Wallet, subtitle: 'Apple Pay / Google Pay' },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`w-full p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500'
                        : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-orange-500" />
                      <div className="text-left">
                        <p className="font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                          {method.id}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-normal">
                          {method.subtitle}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Driver Tip */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-neutral-900 dark:text-neutral-100">
                Tip Your Grill Rider
              </span>
              <span className="text-[11px] text-neutral-400">100% goes to rider</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[0, 2, 3, 5].map(tip => (
                <button
                  key={tip}
                  type="button"
                  onClick={() => setSelectedTip(tip)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedTip === tip
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800'
                  }`}
                >
                  {tip === 0 ? 'None' : `$${tip}`}
                </button>
              ))}
            </div>
          </div>

          {/* Summary & Place Order CTA */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-3.5 shadow-xs">
            <h3 className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
              Order Breakdown
            </h3>

            <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8.25%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Discount ({appliedPromo})</span>
                  <span>-${promoDiscount.toFixed(2)}</span>
                </div>
              )}
              {selectedTip > 0 && (
                <div className="flex justify-between">
                  <span>Rider Tip</span>
                  <span>${selectedTip.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-baseline text-neutral-900 dark:text-neutral-50 font-black text-base">
                <span>Total Due</span>
                <span className="text-xl text-orange-600 dark:text-orange-400">
                  ${orderTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Customer Notice */}
            {!user && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-[11px]">Instant Guest Checkout</p>
                    <p className="text-[10px] text-amber-800 dark:text-amber-400">
                      No password required. Deliveries are tracked live.
                    </p>
                  </div>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => setAuthModalOpen(true)}
                  onKeyDown={e => e.key === 'Enter' && setAuthModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 text-orange-600 dark:text-orange-400 text-[11px] font-bold border border-amber-300 dark:border-amber-700 shadow-2xs cursor-pointer hover:bg-orange-50 dark:hover:bg-neutral-700"
                >
                  Sign In
                </span>
              </div>
            )}

            <button
              id="place-order-button"
              type="button"
              disabled={isSubmitting}
              onClick={handlePlaceOrderClick}
              className="w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-full flex items-center justify-center gap-2 py-0.5">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Placing Grill Order...</span>
                </div>
              ) : (
                <>
                  <span>{user ? 'Place Grill Order Now' : 'Place Order as Guest'}</span>
                  <span className="flex items-center gap-1.5">
                    <span>${orderTotal.toFixed(2)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
