import React from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus, Order } from '../types';
import {
  Clock,
  CheckCircle2,
  Flame,
  PackageCheck,
  Bike,
  MapPin,
  Phone,
  MessageSquare,
  FastForward,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Receipt
} from 'lucide-react';

export const OrdersView: React.FC = () => {
  const {
    user,
    setAuthModalOpen,
    orders,
    activeOrder,
    updateOrderStatus,
    cancelOrder,
    reorder,
    setActiveTab,
    showToast
  } = useApp();

  // If user is not logged in
  if (!user) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
          Customer Login Required
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Order tracking and history are securely linked to your customer account. Sign in to track your active deliveries and review previous grill orders.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 cursor-pointer transition-all"
        >
          Sign In to Access Order Tracking
        </button>
      </div>
    );
  }

  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  // Stages configuration for tracker
  const trackingSteps: { status: OrderStatus; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
    { status: 'confirmed', label: 'Order Confirmed', desc: 'Received by The Grill Spot kitchen', icon: CheckCircle2 },
    { status: 'grilling', label: 'On the Flame Grill', desc: 'Pitmaster searing over hardwood charcoal', icon: Flame },
    { status: 'quality_check', label: 'Thermal Packaging', desc: 'Quality inspected & sealed hot', icon: PackageCheck },
    { status: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider is speeding your way', icon: Bike },
    { status: 'delivered', label: 'Order Delivered', desc: 'Enjoy your smoky feast!', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed': return 0;
      case 'grilling': return 1;
      case 'quality_check': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-neutral-50 tracking-tight">
          Customer Orders &amp; Live Tracking
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Real-time GPS tracker &amp; order history for {user.name} ({user.email})
        </p>
      </div>

      {/* Active Order Live Tracker */}
      {activeOrder ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border-2 border-orange-500/40 dark:border-orange-500/30 overflow-hidden shadow-xl shadow-orange-500/5">
          {/* Tracker Header Bar */}
          <div className="bg-linear-to-r from-orange-600 via-amber-600 to-red-600 text-white p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-xs">
                  Active Delivery Tracker
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                Order {activeOrder.orderNumber}
              </h2>
              <p className="text-xs text-orange-100 font-medium">
                {activeOrder.items.reduce((sum, i) => sum + i.quantity, 0)} items • Destination: {activeOrder.deliveryAddress}
              </p>
            </div>

            {/* Live ETA Box */}
            <div className="bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-right">
              <span className="text-[10px] text-orange-200 uppercase font-black tracking-wider block">
                Estimated Arrival
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-300">
                {activeOrder.estimatedDeliveryTime}
              </span>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* Visual Multi-step Timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700 dark:text-neutral-300">
                <span>Preparation &amp; Transit Status</span>
                <span className="text-orange-600 dark:text-orange-400 font-extrabold capitalize">
                  {activeOrder.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Step indicator bar */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {trackingSteps.map((step, idx) => {
                  const currentIdx = getStepIndex(activeOrder.status);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex flex-col items-center text-center group">
                      <div
                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 scale-110 ring-4 ring-orange-500/20'
                            : isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs mt-2 font-bold leading-tight hidden sm:block ${
                          isCurrent
                            ? 'text-orange-600 dark:text-orange-400'
                            : isCompleted
                            ? 'text-neutral-800 dark:text-neutral-200'
                            : 'text-neutral-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar line */}
              <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-linear-to-r from-orange-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((getStepIndex(activeOrder.status) + 1) / 5) * 100)}%` }}
                />
              </div>
            </div>

            {/* Simulated Live GPS Map View */}
            <div className="relative h-48 sm:h-60 rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 shadow-inner">
              {/* Map grid background pattern */}
              <div className="absolute inset-0 opacity-40 dark:opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
              
              {/* Animated Route Line */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M 60 140 C 140 100, 220 180, 320 120 C 380 90, 480 140, 560 100"
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="4"
                  strokeDasharray="6,6"
                  className="animate-pulse"
                />
              </svg>

              {/* Restaurant Pin */}
              <div className="absolute left-6 top-28 sm:top-24 flex items-center gap-1.5 bg-neutral-900 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold shadow-lg z-10">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>The Grill Spot Kitchen</span>
              </div>

              {/* Moving Rider Bike Pin */}
              <div className="absolute left-1/2 top-20 -translate-x-1/2 flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded-2xl text-xs font-black shadow-xl z-20 animate-bounce">
                <Bike className="w-4 h-4" />
                <span>Rider: {activeOrder.riderName}</span>
              </div>

              {/* Customer Delivery Pin */}
              <div className="absolute right-6 top-16 sm:top-14 flex items-center gap-1.5 bg-emerald-600 text-white px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold shadow-lg z-10">
                <MapPin className="w-3.5 h-3.5" />
                <span>Your Address</span>
              </div>

              {/* Fast Forward simulation testing control */}
              <div className="absolute bottom-3 right-3 z-30">
                <button
                  onClick={() => {
                    const statusSequence: OrderStatus[] = ['confirmed', 'grilling', 'quality_check', 'out_for_delivery', 'delivered'];
                    const currentIdx = statusSequence.indexOf(activeOrder.status);
                    if (currentIdx < statusSequence.length - 1) {
                      updateOrderStatus(activeOrder.id, statusSequence[currentIdx + 1]);
                    }
                  }}
                  className="px-3 py-1.5 bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 hover:bg-white text-[11px] font-extrabold rounded-xl border border-neutral-300 dark:border-neutral-700 shadow-md backdrop-blur-md flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                  title="Simulate next delivery stage for testing"
                >
                  <FastForward className="w-3.5 h-3.5 text-orange-500" />
                  <span>Simulate Next Step</span>
                </button>
              </div>
            </div>

            {/* Rider Details Card */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs">
                  MV
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {activeOrder.riderName} • Grill Express Courier
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Insulated Thermal Bag • 4.9 ★ (1,480 deliveries)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast(`Calling ${activeOrder.riderName}... (+1 555 902-8812)`)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Call</span>
                </button>
                <button
                  onClick={() => showToast(`Opening chat with ${activeOrder.riderName}...`)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                  <span>Message</span>
                </button>
              </div>
            </div>

            {/* Order Items List Breakdown */}
            <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-orange-500" />
                <span>Order Summary ({activeOrder.items.length} item types)</span>
              </h4>

              <div className="space-y-2">
                {activeOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs">
                    <div>
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {it.quantity}x {it.menuItem.name}
                      </span>
                      {it.options.doneness && (
                        <span className="text-[11px] text-neutral-400 block">
                          Doneness: {it.options.doneness}
                        </span>
                      )}
                      {it.options.addOns && it.options.addOns.length > 0 && (
                        <span className="text-[11px] text-neutral-400 block">
                          + {it.options.addOns.map(a => a.name).join(', ')}
                        </span>
                      )}
                    </div>
                    <span className="font-black text-neutral-900 dark:text-neutral-100">
                      ${it.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-xs">
                <span className="text-neutral-500">Paid via {activeOrder.paymentMethod}</span>
                <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                  Total: ${activeOrder.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Cancel option if still in early stages */}
            {(activeOrder.status === 'confirmed' || activeOrder.status === 'grilling') && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => cancelOrder(activeOrder.id)}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 hover:underline cursor-pointer"
                >
                  Cancel this order
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
            No Active Orders Right Now
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
            Ready to taste tender steaks and smoky brisket? Add items to your cart and place an order to track live delivery.
          </p>
          <button
            onClick={() => setActiveTab('search')}
            className="px-5 py-2.5 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-xs cursor-pointer hover:bg-orange-500 transition-colors"
          >
            Browse Menu &amp; Order
          </button>
        </div>
      )}

      {/* Past Orders History Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
          Past Grill Orders History
        </h2>

        {pastOrders.length === 0 ? (
          <p className="text-xs text-neutral-400 italic">No past completed orders yet.</p>
        ) : (
          <div className="space-y-3">
            {pastOrders.map(order => (
              <div
                key={order.id}
                className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-neutral-900 dark:text-neutral-100">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        order.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-400">
                    {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-neutral-600 dark:text-neutral-300">
                  <p className="line-clamp-1 font-medium">
                    {order.items.map(it => `${it.quantity}x ${it.menuItem.name}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-black text-neutral-900 dark:text-neutral-100">
                    Total: ${order.total.toFixed(2)}
                  </span>
                  <button
                    onClick={() => reorder(order)}
                    className="px-3 py-1.5 rounded-xl border border-orange-200 dark:border-orange-800/60 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold text-xs hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 dark:hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reorder</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
