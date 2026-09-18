import React, { useState, useEffect } from 'react';
import { useApp, ADMIN_EMAIL } from '../context/AppContext';
import { MenuItem, StaffMember, RiderMember, OrderStatus } from '../types';
import { d1GetActivityLogs } from '../services/d1Service';
import {
  ShieldAlert,
  Flame,
  Utensils,
  Users,
  Bike,
  Package,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  Phone,
  Clock,
  DollarSign,
  Search,
  Check,
  Eye,
  LogOut,
  Sparkles,
  Database,
  RefreshCw,
  Server,
  Activity,
  ArrowUpDown,
  FileText
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const {
    user,
    isAdmin,
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    staffList,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    ridersList,
    addRiderMember,
    updateRiderMember,
    deleteRiderMember,
    orders,
    updateOrderStatus,
    allUsersList,
    logout,
    showToast,
    d1Status,
    refreshD1Status,
    syncAllToD1,
    refreshOrders
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'orders' | 'menu' | 'staff' | 'riders' | 'accounts' | 'database'>('orders');
  const [isSyncingD1, setIsSyncingD1] = useState(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [d1Logs, setD1Logs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const handleManualRefreshOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      await refreshOrders();
      await refreshD1Status();
      showToast('Live customer orders refreshed from Cloudflare D1.');
    } finally {
      setTimeout(() => setIsRefreshingOrders(false), 500);
    }
  };

  const fetchD1Logs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await d1GetActivityLogs(50);
      setD1Logs(logs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'database') {
      fetchD1Logs();
      refreshD1Status();
    }
  }, [activeAdminTab]);

  const handleSyncAll = async () => {
    setIsSyncingD1(true);
    try {
      await syncAllToD1();
      await fetchD1Logs();
      showToast('All menu, users, staff, riders, and orders synced to Cloudflare D1 SQL!');
    } catch (e) {
      showToast('Error syncing data to Cloudflare D1');
    } finally {
      setIsSyncingD1(false);
    }
  };

  // New Menu Item Form Modal / State
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'burgers',
    price: 15.99,
    originalPrice: 18.99,
    description: '',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    prepTime: '20-25 mins',
    isSpicy: false,
    isBestseller: false,
    isChefSpecial: false,
    inStock: true,
    stockCount: 50
  });

  // New Staff Modal / State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    role: 'Grill Pitmaster',
    phone: '+1 (555) 000-0000',
    shift: 'Morning & Lunch (10 AM - 6 PM)',
    active: true
  });

  // New Rider Modal / State
  const [showAddRiderModal, setShowAddRiderModal] = useState(false);
  const [riderForm, setRiderForm] = useState({
    name: '',
    phone: '+1 (555) 000-0000',
    vehicle: 'Motorcycle (Thermal Bag)',
    status: 'available' as 'available' | 'on_delivery' | 'offline',
    rating: 5.0,
    deliveriesCount: 0
  });

  // Filter orders by status in Admin view
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'active') return o.status !== 'delivered' && o.status !== 'cancelled';
    if (orderFilter === 'delivered') return o.status === 'delivered';
    if (orderFilter === 'cancelled') return o.status === 'cancelled';
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
          Admin Access Required
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          You must be signed in with the authorized pitmaster account (
          <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">{ADMIN_EMAIL}</span>) to manage website, staff, riders, menu items, orders, and stocks.
        </p>
      </div>
    );
  }

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.name || !menuForm.description) return;
    await addMenuItem({
      name: menuForm.name,
      category: menuForm.category,
      price: Number(menuForm.price),
      originalPrice: menuForm.originalPrice ? Number(menuForm.originalPrice) : undefined,
      description: menuForm.description,
      image: menuForm.image,
      prepTime: menuForm.prepTime,
      isSpicy: menuForm.isSpicy,
      isBestseller: menuForm.isBestseller,
      isChefSpecial: menuForm.isChefSpecial,
      inStock: menuForm.inStock,
      stockCount: Number(menuForm.stockCount),
      rating: 5.0,
      reviewCount: 1
    });
    setShowAddMenuModal(false);
    setMenuForm({
      name: '',
      category: 'burgers',
      price: 15.99,
      originalPrice: 18.99,
      description: '',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      prepTime: '20-25 mins',
      isSpicy: false,
      isBestseller: false,
      isChefSpecial: false,
      inStock: true,
      stockCount: 50
    });
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.role) return;
    await addStaffMember(staffForm);
    setShowAddStaffModal(false);
    setStaffForm({
      name: '',
      role: 'Grill Pitmaster',
      phone: '+1 (555) 000-0000',
      shift: 'Morning & Lunch (10 AM - 6 PM)',
      active: true
    });
  };

  const handleCreateRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderForm.name || !riderForm.phone) return;
    await addRiderMember(riderForm);
    setShowAddRiderModal(false);
    setRiderForm({
      name: '',
      phone: '+1 (555) 000-0000',
      vehicle: 'Motorcycle (Thermal Bag)',
      status: 'available',
      rating: 5.0,
      deliveriesCount: 0
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Admin Title Header */}
      <div className="bg-linear-to-r from-neutral-900 via-neutral-950 to-orange-950 p-5 sm:p-6 rounded-3xl text-white border border-neutral-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[11px] font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>Master Admin Terminal</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <Database className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Cloudflare D1 SQL: {d1Status.connected ? 'Active' : 'Connecting'}</span>
              {d1Status.latencyMs !== undefined && (
                <span className="text-[10px] text-emerald-300 font-mono">({d1Status.latencyMs}ms)</span>
              )}
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            The Grill Spot Command Center
          </h1>
          <p className="text-xs text-neutral-300">
            Logged in as <strong className="text-white">{user?.email}</strong>. Persisting live to Cloudflare D1 SQL (<span className="font-mono text-orange-400">c41385c3-6bbd-4b69-88c3-d3d155c17cf7</span>).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveAdminTab('database')}
            className="px-3 py-2 rounded-xl bg-orange-600/80 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Database className="w-3.5 h-3.5" />
            <span>D1 Console</span>
          </button>
          <button
            onClick={() => logout()}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        {[
          { id: 'orders', label: 'Live Orders', icon: Package, count: orders.length },
          { id: 'menu', label: 'Menu & Stocks', icon: Utensils, count: menuItems.length },
          { id: 'staff', label: 'Staff Management', icon: Users, count: staffList.length },
          { id: 'riders', label: 'Delivery Riders', icon: Bike, count: ridersList.length },
          { id: 'accounts', label: 'Registered Accounts', icon: ShieldAlert, count: allUsersList.length },
          { id: 'database', label: 'Cloudflare D1 SQL', icon: Database, count: d1Status?.totalRecords || 0 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeAdminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveAdminTab(tab.id as any);
                if (tab.id === 'orders') refreshOrders();
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 ring-2 ring-orange-500'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-orange-500/50 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {tab.id === 'orders' && (
                <span className="relative flex h-2 w-2 mr-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                isActive
                  ? 'bg-black/30 text-white'
                  : tab.id === 'orders' && tab.count > 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORDERS MANAGEMENT */}
      {activeAdminTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                  Customer Orders
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live D1 Dispatch
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Change order status live, assign couriers, and manage customer deliveries
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleManualRefreshOrders}
                disabled={isRefreshingOrders}
                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Sync live orders from Cloudflare D1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin text-orange-500' : ''}`} />
                <span>{isRefreshingOrders ? 'Syncing...' : 'Refresh Orders'}</span>
              </button>

              {/* Filter pills */}
              <div className="flex items-center gap-1 text-xs font-bold bg-neutral-100 dark:bg-neutral-800/60 p-1 rounded-xl">
                {(['all', 'active', 'delivered', 'cancelled'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setOrderFilter(f)}
                    className={`px-3 py-1 rounded-lg capitalize cursor-pointer transition-colors ${
                      orderFilter === f
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-3">
              <Package className="w-10 h-10 text-neutral-400 mx-auto" />
              <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                No orders match this filter
              </p>
              <button
                onClick={handleManualRefreshOrders}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm shadow-orange-600/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh from Cloudflare D1</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                        {order.orderNumber || order.id}
                      </span>
                      <span className="text-xs text-neutral-400">
                        • {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        order.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : order.status === 'grilling'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : order.status === 'quality_check'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : order.status === 'out_for_delivery'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                          : order.status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      }`}>
                        {(order.status || 'confirmed').replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Address Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                    <div>
                      <p><strong className="text-neutral-900 dark:text-neutral-100">Customer:</strong> {order.customerName || 'Customer'} ({order.customerPhone || 'N/A'})</p>
                      <p><strong className="text-neutral-900 dark:text-neutral-100">Address:</strong> {order.deliveryAddress || 'Pickup at Restaurant'}</p>
                    </div>
                    <div>
                      <p><strong className="text-neutral-900 dark:text-neutral-100">Type:</strong> {(order.orderType || 'delivery').toUpperCase()} • <strong className="text-neutral-900 dark:text-neutral-100">Payment:</strong> {order.paymentMethod || 'Cash on Delivery'}</p>
                      <p><strong className="text-neutral-900 dark:text-neutral-100">Total:</strong> ${(order.total || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Ordered Items preview */}
                  <div className="bg-neutral-50 dark:bg-neutral-800/50 p-3 rounded-2xl text-xs space-y-1">
                    {(order.items || []).map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.quantity}x {it.menuItem?.name || 'Flame Special'} {it.options?.doneness ? `(${it.options.doneness})` : ''}</span>
                        <span className="font-bold">${(it.totalPrice || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Live Status Controls */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500">
                      <span>Update Status:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {(['confirmed', 'grilling', 'quality_check', 'out_for_delivery', 'delivered', 'cancelled'] as OrderStatus[]).map(st => (
                        <button
                          key={st}
                          disabled={order.status === st}
                          onClick={() => updateOrderStatus(order.id, st)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                            order.status === st
                              ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-default'
                              : 'bg-neutral-100 dark:bg-neutral-800 hover:bg-orange-600 hover:text-white text-neutral-700 dark:text-neutral-200'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU & STOCKS */}
      {activeAdminTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                Menu Items &amp; Inventory Stocks
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Add new grill cuts, update pricing, toggle in-stock availability, or remove items
              </p>
            </div>
            <button
              onClick={() => setShowAddMenuModal(true)}
              className="px-4 py-2 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {menuItems.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3 flex flex-col justify-between"
              >
                <div className="flex gap-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 bg-neutral-100 dark:bg-neutral-800"
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100 truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-black">
                      ${item.price.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-neutral-400 capitalize">{item.category}</p>
                  </div>
                </div>

                {/* Stock Controls */}
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateMenuItem(item.id, { inStock: !(item.inStock !== false) })}
                      className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                        item.inStock !== false
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                    </button>
                    <span className="text-[11px] text-neutral-400">
                      Qty: {item.stockCount ?? 45}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const newPrice = prompt(`Enter new price for ${item.name}:`, String(item.price));
                        if (newPrice && !isNaN(Number(newPrice))) {
                          updateMenuItem(item.id, { price: Number(newPrice) });
                        }
                      }}
                      className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
                      title="Edit Price"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${item.name}" from the live menu?`)) {
                          deleteMenuItem(item.id);
                        }
                      }}
                      className="p-1.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 cursor-pointer"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF MANAGEMENT */}
      {activeAdminTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                Grill Spot Staff &amp; Pitmasters
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Manage kitchen crew, pitmasters, shifts, and contacts
              </p>
            </div>
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {staffList.map(st => (
              <div
                key={st.id}
                className="p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                      {st.name}
                    </h3>
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">{st.role}</p>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${st.active ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                </div>

                <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{st.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{st.shift}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <button
                    onClick={() => updateStaffMember(st.id, { active: !st.active })}
                    className="text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:underline cursor-pointer"
                  >
                    {st.active ? 'Set Inactive' : 'Set Active'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove staff member ${st.name}?`)) {
                        deleteStaffMember(st.id);
                      }
                    }}
                    className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RIDERS MANAGEMENT */}
      {activeAdminTab === 'riders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
                Delivery Couriers &amp; Fleet
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Manage dispatch riders, vehicles, live availability, and delivery counts
              </p>
            </div>
            <button
              onClick={() => setShowAddRiderModal(true)}
              className="px-4 py-2 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rider</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {ridersList.map(rd => (
              <div
                key={rd.id}
                className="p-4 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                      {rd.name}
                    </h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{rd.vehicle}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    rd.status === 'available'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : rd.status === 'on_delivery'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                      : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}>
                    {rd.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{rd.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span>★ {rd.rating} Rating</span>
                    <span>{rd.deliveriesCount} Deliveries</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                  <button
                    onClick={() =>
                      updateRiderMember(rd.id, {
                        status: rd.status === 'available' ? 'on_delivery' : rd.status === 'on_delivery' ? 'offline' : 'available'
                      })
                    }
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline cursor-pointer"
                  >
                    Cycle Status
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove rider ${rd.name}?`)) {
                        deleteRiderMember(rd.id);
                      }
                    }}
                    className="p-1 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REGISTERED ACCOUNTS */}
      {activeAdminTab === 'accounts' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-black text-neutral-900 dark:text-neutral-100">
              Registered Accounts
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              View customer profiles, registered phone numbers, and addresses stored in Firebase
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Phone</th>
                    <th className="p-3.5">Address</th>
                    <th className="p-3.5">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {allUsersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-neutral-400">
                        No registered customer accounts yet.
                      </td>
                    </tr>
                  ) : (
                    allUsersList.map(u => (
                      <tr key={u.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                        <td className="p-3.5 font-bold text-neutral-900 dark:text-neutral-100">{u.name}</td>
                        <td className="p-3.5 text-neutral-600 dark:text-neutral-300 font-mono">{u.email}</td>
                        <td className="p-3.5 text-neutral-500 dark:text-neutral-400">{u.phone || '—'}</td>
                        <td className="p-3.5 text-neutral-500 dark:text-neutral-400 max-w-xs truncate">{u.address || '—'}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}>
                            {u.role || 'customer'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CLOUDFLARE D1 SQL DATABASE CONSOLE */}
      {activeAdminTab === 'database' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Connection Card */}
          <div className="p-6 rounded-3xl bg-neutral-900 text-white border border-neutral-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                      Cloudflare D1 SQL Database
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        {d1Status.connected ? 'Operational & Synced' : 'Connecting'}
                      </span>
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Distributed SQL storage powering customer records, live orders, menus, staff, riders, and audit logs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={fetchD1Logs}
                  disabled={isLoadingLogs}
                  className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  <span>Refresh Logs</span>
                </button>
                <button
                  onClick={handleSyncAll}
                  disabled={isSyncingD1}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md shadow-orange-600/30 transition-colors disabled:opacity-50"
                >
                  <ArrowUpDown className={`w-3.5 h-3.5 ${isSyncingD1 ? 'animate-spin' : ''}`} />
                  <span>{isSyncingD1 ? 'Syncing...' : 'Sync All Live Data'}</span>
                </button>
              </div>
            </div>

            {/* D1 Connection Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-1">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Account ID</div>
                <div className="font-mono text-neutral-200 truncate select-all">5847d87426a6e542bb9b8a61fa6e4fdc</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-1">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Database UUID</div>
                <div className="font-mono text-orange-400 truncate select-all">c41385c3-6bbd-4b69-88c3-d3d155c17cf7</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-1">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Engine & Latency</div>
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span>Cloudflare D1 ({d1Status.latencyMs ?? '—'} ms)</span>
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-neutral-950/70 border border-neutral-800 space-y-1">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Last Sync Status</div>
                <div className="font-semibold text-neutral-200">
                  {d1Status.lastSync ? new Date(d1Status.lastSync).toLocaleTimeString() : 'Auto-Syncing'}
                </div>
              </div>
            </div>
          </div>

          {/* Database Tables Summary Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-600" />
              <span>SQL Tables & Live Record Counts</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { table: 'users', label: 'Customers & Admin', count: d1Status.tableCounts?.users ?? allUsersList.length, icon: Users },
                { table: 'orders', label: 'Orders & Receipts', count: d1Status.tableCounts?.orders ?? orders.length, icon: Package },
                { table: 'menu_items', label: 'Live Dishes & Stock', count: d1Status.tableCounts?.menu_items ?? menuItems.length, icon: Utensils },
                { table: 'staff', label: 'Pitmasters & Crew', count: d1Status.tableCounts?.staff ?? staffList.length, icon: Users },
                { table: 'riders', label: 'Delivery Fleet', count: d1Status.tableCounts?.riders ?? ridersList.length, icon: Bike },
                { table: 'activity_logs', label: 'Audit Trail Logs', count: d1Status.tableCounts?.activity_logs ?? d1Logs.length, icon: FileText }
              ].map(t => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.table}
                    className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-neutral-400">{t.table}</span>
                      <Icon className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <div className="text-2xl font-black text-neutral-900 dark:text-neutral-100">
                      {t.count}
                    </div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                      {t.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Activity & Audit Log Stream */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Cloudflare D1 Activity Stream (Audit Logs)</span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Every user login, order placed, cart change, menu edit, and rider dispatch is captured in D1 SQL.
                </p>
              </div>

              <span className="text-xs font-mono text-neutral-400">
                {d1Logs.length} events logged
              </span>
            </div>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[480px] overflow-y-auto">
              {isLoadingLogs ? (
                <div className="p-8 text-center text-xs text-neutral-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" />
                  Fetching audit logs from Cloudflare D1...
                </div>
              ) : d1Logs.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 space-y-1">
                  <p className="font-bold">No activity logs recorded yet.</p>
                  <p>Click "Sync All Live Data" above to record initial sync events.</p>
                </div>
              ) : (
                d1Logs.map((log: any) => {
                  let parsedDetails = null;
                  try {
                    if (log.details) {
                      parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                    }
                  } catch (e) {
                    parsedDetails = log.details;
                  }

                  const actionName = String(log.action || log.event_type || 'activity');

                  const getActionBadgeColor = (action?: string) => {
                    const act = String(action || '').toLowerCase();
                    if (act.includes('order')) return 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300';
                    if (act.includes('login') || act.includes('register') || act.includes('auth') || act.includes('user')) return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
                    if (act.includes('menu')) return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
                    if (act.includes('staff') || act.includes('rider')) return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300';
                    return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
                  };

                  return (
                    <div key={log.id || ('log-' + Math.random())} className="p-3.5 sm:p-4 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase tracking-wide ${getActionBadgeColor(actionName)}`}>
                            {actionName.replace(/_/g, ' ')}
                          </span>
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {log.actor_name || log.actor_email || 'System'}
                          </span>
                          {log.actor_email && (
                            <span className="text-neutral-400 font-mono text-[11px]">
                              ({log.actor_email})
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-neutral-400">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'Just now'}
                        </span>
                      </div>

                      {parsedDetails && (
                        <pre className="mt-1.5 p-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-600 dark:text-neutral-400 overflow-x-auto">
                          {JSON.stringify(parsedDetails, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD MENU ITEM */}
      {showAddMenuModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <h3 className="font-black text-base text-neutral-900 dark:text-neutral-100">
                Add New Dish to Menu
              </h3>
              <button
                onClick={() => setShowAddMenuModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={menuForm.name}
                  onChange={e => setMenuForm({ ...menuForm, name: e.target.value })}
                  placeholder="e.g. Hickory Smoked Pork Ribs"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Category</label>
                  <select
                    value={menuForm.category}
                    onChange={e => setMenuForm({ ...menuForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                  >
                    <option value="burgers">Burgers</option>
                    <option value="steaks">Steaks</option>
                    <option value="ribs">Ribs &amp; BBQ</option>
                    <option value="skewers">Skewers &amp; Kebabs</option>
                    <option value="sides">Sides &amp; Fries</option>
                    <option value="drinks">Beverages</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={menuForm.price}
                    onChange={e => setMenuForm({ ...menuForm, price: parseFloat(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={menuForm.description}
                  onChange={e => setMenuForm({ ...menuForm, description: e.target.value })}
                  placeholder="Smoked over mesquite charcoal with pitmaster glaze..."
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Image URL</label>
                <input
                  type="url"
                  value={menuForm.image}
                  onChange={e => setMenuForm({ ...menuForm, image: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Prep Time</label>
                  <input
                    type="text"
                    value={menuForm.prepTime}
                    onChange={e => setMenuForm({ ...menuForm, prepTime: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    value={menuForm.stockCount}
                    onChange={e => setMenuForm({ ...menuForm, stockCount: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.isBestseller}
                    onChange={e => setMenuForm({ ...menuForm, isBestseller: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Bestseller</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={menuForm.isSpicy}
                    onChange={e => setMenuForm({ ...menuForm, isSpicy: e.target.checked })}
                    className="rounded text-orange-600"
                  />
                  <span>Spicy</span>
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-extrabold hover:bg-orange-500"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-neutral-900 dark:text-neutral-100">
              Add Restaurant Staff
            </h3>
            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Marco Rossi"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Role / Position</label>
                <input
                  type="text"
                  required
                  value={staffForm.role}
                  onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                  placeholder="e.g. Senior Smoker Specialist"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={staffForm.phone}
                  onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Shift Hours</label>
                <input
                  type="text"
                  required
                  value={staffForm.shift}
                  onChange={e => setStaffForm({ ...staffForm, shift: e.target.value })}
                  placeholder="Morning Rush (10 AM - 6 PM)"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-extrabold hover:bg-orange-500"
                >
                  Add Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD RIDER */}
      {showAddRiderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-neutral-900 dark:text-neutral-100">
              Add Delivery Courier / Rider
            </h3>
            <form onSubmit={handleCreateRider} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Rider Full Name</label>
                <input
                  type="text"
                  required
                  value={riderForm.name}
                  onChange={e => setRiderForm({ ...riderForm, name: e.target.value })}
                  placeholder="e.g. Leo Cruz"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={riderForm.phone}
                  onChange={e => setRiderForm({ ...riderForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Vehicle Type</label>
                <input
                  type="text"
                  required
                  value={riderForm.vehicle}
                  onChange={e => setRiderForm({ ...riderForm, vehicle: e.target.value })}
                  placeholder="E-Bike or Motorcycle"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                />
              </div>
              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRiderModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 text-white font-extrabold hover:bg-orange-500"
                >
                  Register Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
