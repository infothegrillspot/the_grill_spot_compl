import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ThemeMode,
  TabType,
  MenuItem,
  CartItem,
  CartItemOption,
  User,
  Order,
  OrderStatus,
  StaffMember,
  RiderMember
} from '../types';
import { MENU_ITEMS as DEFAULT_MENU_ITEMS, PROMO_CODES } from '../data/menuData';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  d1SyncUser,
  d1SaveOrder,
  d1UpdateOrderStatus,
  d1SaveMenuItem,
  d1DeleteMenuItem,
  d1SaveStaff,
  d1DeleteStaff,
  d1SaveRider,
  d1DeleteRider,
  d1LogActivity,
  d1GetStatus,
  d1SyncAllDefaults,
  D1StatusResponse
} from '../services/d1Service';

export const ADMIN_EMAIL = 'info.thegrillspot@gmail.com';

interface AppContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: User | null;
  isAdmin: boolean;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (name: string, email: string, pass: string, phone: string, address: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (item: MenuItem, options?: CartItemOption, qty?: number) => void;
  updateCartQty: (cartItemId: string, newQty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  appliedPromo: string | null;
  promoDiscount: number;
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  orders: Order[];
  activeOrder: Order | null;
  placeOrder: (details: {
    orderType: 'delivery' | 'pickup';
    deliveryAddress: string;
    customerPhone: string;
    paymentMethod: 'Cash on Delivery' | 'Credit / Debit Card' | 'Digital Wallet';
    specialInstructions?: string;
    tip: number;
  }) => Promise<{ success: boolean; orderId?: string; error?: string }>;
  reorder: (order: Order) => void;
  cancelOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, riderName?: string, riderPhone?: string) => Promise<void>;
  selectedItemForDetail: MenuItem | null;
  setSelectedItemForDetail: (item: MenuItem | null) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  toast: string | null;
  showToast: (msg: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // Admin Management State & Actions
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  staffList: StaffMember[];
  addStaffMember: (staff: Omit<StaffMember, 'id'>) => Promise<void>;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaffMember: (id: string) => Promise<void>;
  ridersList: RiderMember[];
  addRiderMember: (rider: Omit<RiderMember, 'id'>) => Promise<void>;
  updateRiderMember: (id: string, updates: Partial<RiderMember>) => Promise<void>;
  deleteRiderMember: (id: string) => Promise<void>;
  allUsersList: User[];

  // Cloudflare D1 SQL State & Actions
  d1Status: D1StatusResponse | null;
  refreshD1Status: () => Promise<void>;
  syncAllToD1: () => Promise<{ success: boolean; message?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Default Staff if none in Firestore
const DEFAULT_STAFF: StaffMember[] = [
  { id: 'st-1', name: 'Chef Gordon Alvarez', role: 'Head Pitmaster', phone: '+1 (555) 345-8910', shift: 'Morning & Lunch (10 AM - 6 PM)', active: true },
  { id: 'st-2', name: 'Sarah Jenkins', role: 'Kitchen Lead & Expediter', phone: '+1 (555) 456-7890', shift: 'Evening Rush (3 PM - 11:30 PM)', active: true },
  { id: 'st-3', name: 'Tariq Al-Mansoor', role: 'Smoker & Grill Artisan', phone: '+1 (555) 567-8901', shift: 'Full Day Pit (11 AM - 9 PM)', active: true }
];

// Initial Default Riders if none in Firestore
const DEFAULT_RIDERS: RiderMember[] = [
  { id: 'rd-1', name: 'Marcus "Speedy" Vance', phone: '+1 (555) 902-8812', vehicle: 'Motorcycle (Heated Bag)', status: 'available', rating: 4.9, deliveriesCount: 312 },
  { id: 'rd-2', name: 'Elena Rostova', phone: '+1 (555) 903-4421', vehicle: 'E-Bike Express', status: 'available', rating: 4.8, deliveriesCount: 245 },
  { id: 'rd-3', name: 'Jamal Washington', phone: '+1 (555) 904-7733', vehicle: 'Thermal Cruiser Car', status: 'on_delivery', rating: 5.0, deliveriesCount: 420 }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('grill_theme');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('grill_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Firebase User & Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<MenuItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast(null);
    }, 3400);
  };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || user?.role === 'admin';

  // Live Menu Items State (loaded from Firestore with fallback to defaults)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);

  // Live Staff & Riders state
  const [staffList, setStaffList] = useState<StaffMember[]>(DEFAULT_STAFF);
  const [ridersList, setRidersList] = useState<RiderMember[]>(DEFAULT_RIDERS);
  const [allUsersList, setAllUsersList] = useState<User[]>([]);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);

  // Cloudflare D1 SQL State
  const [d1Status, setD1Status] = useState<D1StatusResponse | null>(null);

  const refreshD1Status = async () => {
    try {
      const status = await d1GetStatus();
      if (status) {
        setD1Status(status);
      }
    } catch (e) {
      console.warn('Failed to refresh Cloudflare D1 status:', e);
    }
  };

  const syncAllToD1 = async () => {
    try {
      const res = await d1SyncAllDefaults({
        menuItems,
        staffList,
        ridersList
      });
      await refreshD1Status();
      return res;
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // Initial D1 status check on mount
  useEffect(() => {
    refreshD1Status();
    // Also perform initial seeding of default menu/staff/riders to D1 if D1 is newly connected
    d1SyncAllDefaults({
      menuItems: DEFAULT_MENU_ITEMS,
      staffList: DEFAULT_STAFF,
      ridersList: DEFAULT_RIDERS
    }).then(() => refreshD1Status());
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      setIsAuthLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          const isUserAdmin = (firebaseUser.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

          let activeUser: User;
          if (userSnap.exists()) {
            const data = userSnap.data() as User;
            activeUser = {
              ...data,
              id: firebaseUser.uid,
              email: firebaseUser.email || data.email,
              role: isUserAdmin ? 'admin' : (data.role || 'customer')
            };
          } else {
            // New user registration in Firestore
            activeUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || (firebaseUser.email?.split('@')[0] || 'Customer'),
              email: firebaseUser.email || '',
              phone: firebaseUser.phoneNumber || '+1 (555) 438-9201',
              address: '742 Evergreen Terrace, Apt 12',
              role: isUserAdmin ? 'admin' : 'customer',
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, activeUser);
          }

          setUser(activeUser);
          // Sync Customer Account to Cloudflare D1 SQL
          d1SyncUser(activeUser);
          d1LogActivity('user_session_restored', activeUser.email, activeUser.name, {
            role: activeUser.role,
            provider: 'firebase_auth'
          });
        } catch (err) {
          console.warn('Could not read user profile from Firestore, using local fallback:', err);
          const fallbackUser: User = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Customer',
            email: firebaseUser.email || '',
            phone: '+1 (555) 438-9201',
            address: '450 Flame Blvd, Apt 4B',
            role: (firebaseUser.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'customer',
            createdAt: new Date().toISOString()
          };
          setUser(fallbackUser);
          d1SyncUser(fallbackUser);
        }
      } else {
        setUser(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to live Menu Items in Firestore
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, 'menu'),
        snapshot => {
          if (!snapshot.empty) {
            const items: MenuItem[] = [];
            snapshot.forEach(docSnap => {
              items.push({ ...(docSnap.data() as MenuItem), id: docSnap.id });
            });
            setMenuItems(items);
          } else {
            // If empty, initialize default menu items in Firestore if user is admin
            setMenuItems(DEFAULT_MENU_ITEMS);
          }
        },
        error => {
          console.warn('Firestore onSnapshot menu items error (falling back to default menu):', error);
          setMenuItems(DEFAULT_MENU_ITEMS);
        }
      );
      return () => unsubscribe();
    } catch {
      setMenuItems(DEFAULT_MENU_ITEMS);
    }
  }, []);

  // Listen to Orders in Firestore (filtered by user or all if admin)
  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    try {
      const ordersCol = collection(db, 'orders');
      const unsubscribe = onSnapshot(
        ordersCol,
        snapshot => {
          const list: Order[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Order;
            // Admin sees all orders; customer only sees their own orders
            if (isAdmin || data.userId === user.id) {
              list.push({ ...data, id: docSnap.id });
            }
          });
          // Sort orders by createdAt descending
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(list);
        },
        error => {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        }
      );
      return () => unsubscribe();
    } catch {
      // Fallback handled
    }
  }, [user?.id, isAdmin]);

  // Listen to Staff & Riders in Firestore if Admin
  useEffect(() => {
    if (!isAdmin) return;

    try {
      const unsubStaff = onSnapshot(
        collection(db, 'staff'),
        snapshot => {
          if (!snapshot.empty) {
            const items: StaffMember[] = [];
            snapshot.forEach(docSnap => {
              items.push({ ...(docSnap.data() as StaffMember), id: docSnap.id });
            });
            setStaffList(items);
          }
        },
        () => {}
      );

      const unsubRiders = onSnapshot(
        collection(db, 'riders'),
        snapshot => {
          if (!snapshot.empty) {
            const items: RiderMember[] = [];
            snapshot.forEach(docSnap => {
              items.push({ ...(docSnap.data() as RiderMember), id: docSnap.id });
            });
            setRidersList(items);
          }
        },
        () => {}
      );

      const unsubUsers = onSnapshot(
        collection(db, 'users'),
        snapshot => {
          const uList: User[] = [];
          snapshot.forEach(docSnap => {
            uList.push({ ...(docSnap.data() as User), id: docSnap.id });
          });
          setAllUsersList(uList);
        },
        () => {}
      );

      return () => {
        unsubStaff();
        unsubRiders();
        unsubUsers();
      };
    } catch {
      // fallback
    }
  }, [isAdmin]);

  // Auth Functions
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const isUserAdmin = (result.user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // Check or create Firestore document
      const userRef = doc(db, 'users', result.user.uid);
      const existingSnap = await getDoc(userRef);
      let activeUser: User;
      if (!existingSnap.exists()) {
        activeUser = {
          id: result.user.uid,
          name: result.user.displayName || 'Customer',
          email: result.user.email || '',
          phone: result.user.phoneNumber || '+1 (555) 438-9201',
          address: '450 Flame Blvd, Apt 4B, Foodie District',
          role: isUserAdmin ? 'admin' : 'customer',
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, activeUser);
      } else {
        activeUser = {
          ...(existingSnap.data() as User),
          id: result.user.uid,
          email: result.user.email || '',
          role: isUserAdmin ? 'admin' : ((existingSnap.data() as User).role || 'customer')
        };
      }

      // Persist user to Cloudflare D1 SQL
      await d1SyncUser(activeUser);
      await d1LogActivity('auth_login_google', activeUser.email, activeUser.name, {
        provider: 'google',
        role: activeUser.role
      });
      await refreshD1Status();

      setAuthModalOpen(false);
      showToast(`Welcome ${result.user.displayName || 'to The Grill Spot'}! ${isUserAdmin ? '(Pitmaster Admin)' : ''}`);
      return { success: true };
    } catch (err: any) {
      console.error('Google login error:', err);
      return { success: false, error: err.message || 'Google sign-in failed' };
    }
  };

  const loginWithEmail = async (emailInput: string, pass: string) => {
    try {
      const res = await signInWithEmailAndPassword(auth, emailInput, pass);
      const isUserAdmin = (res.user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

      // Log activity to Cloudflare D1 SQL
      d1LogActivity('auth_login_email', emailInput, emailInput, { isUserAdmin });

      setAuthModalOpen(false);
      showToast(`Welcome back, ${res.user.email}! ${isUserAdmin ? '(Pitmaster Admin)' : ''}`);
      return { success: true };
    } catch (err: any) {
      console.error('Email login error:', err);
      let msg = err.message || 'Failed to sign in';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please try again or sign in with Google.';
      }
      return { success: false, error: msg };
    }
  };

  const registerWithEmail = async (
    nameInput: string,
    emailInput: string,
    pass: string,
    phoneInput: string,
    addressInput: string
  ) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, emailInput, pass);
      await updateProfile(res.user, { displayName: nameInput });
      const isUserAdmin = (emailInput || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

      const newUser: User = {
        id: res.user.uid,
        name: nameInput,
        email: emailInput,
        phone: phoneInput,
        address: addressInput,
        role: isUserAdmin ? 'admin' : 'customer',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', res.user.uid), newUser);
      setUser(newUser);

      // Persist customer record to Cloudflare D1 SQL
      await d1SyncUser(newUser);
      await d1LogActivity('auth_register_email', newUser.email, newUser.name, {
        phone: phoneInput,
        address: addressInput,
        role: newUser.role
      });
      await refreshD1Status();

      setAuthModalOpen(false);
      showToast(`Account created! Welcome, ${nameInput}!`);
      return { success: true };
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = err.message || 'Failed to register account';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered. Please sign in instead.';
      }
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      if (user) {
        d1LogActivity('auth_logout', user.email, user.name);
      }
      await signOut(auth);
      setUser(null);
      showToast('You have been safely signed out.');
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, updates);
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);

      // Save customer profile to Cloudflare D1 SQL
      await d1SyncUser(updatedUser);
      await d1LogActivity('user_profile_updated', updatedUser.email, updatedUser.name, updates);
      await refreshD1Status();

      showToast('Profile information saved in Cloudflare D1 SQL & cloud.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('grill_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('grill_cart', JSON.stringify(cart));
  }, [cart]);

  // Promo code
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  let promoDiscount = 0;
  if (appliedPromo && PROMO_CODES[appliedPromo]) {
    const p = PROMO_CODES[appliedPromo];
    if (cartSubtotal >= p.minSpend) {
      if (p.discountPercent) {
        promoDiscount = Number(((cartSubtotal * p.discountPercent) / 100).toFixed(2));
      } else if (p.fixedDiscount) {
        promoDiscount = Math.min(p.fixedDiscount, cartSubtotal);
      }
    }
  }

  const applyPromoCode = (code: string) => {
    const upper = code.trim().toUpperCase();
    if (!PROMO_CODES[upper]) {
      return { success: false, message: 'Invalid promo code. Try GRILL20 or FIRSTBITE' };
    }
    const promo = PROMO_CODES[upper];
    if (cartSubtotal < promo.minSpend) {
      return { success: false, message: `Minimum spend of $${promo.minSpend} required for code ${upper}` };
    }
    setAppliedPromo(upper);
    d1LogActivity('promo_code_applied', user?.email, user?.name, { code: upper });
    showToast(`Promo ${upper} applied! Saved discount.`);
    return { success: true, message: promo.label };
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    showToast('Promo code removed.');
  };

  const addToCart = (item: MenuItem, options: CartItemOption = {}, qty = 1) => {
    let itemBasePrice = item.price;
    if (options.addOns && options.addOns.length > 0) {
      const addOnsTotal = options.addOns.reduce((sum, addOn) => sum + addOn.price, 0);
      itemBasePrice += addOnsTotal;
    }
    const unitPrice = itemBasePrice;

    const optionKey = `${item.id}-${options.doneness || ''}-${options.spiceLevel || ''}-${(options.addOns || []).map(a => a.name).sort().join(',')}-${options.specialInstructions || ''}`;

    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(ci => {
        const ciKey = `${ci.menuItem.id}-${ci.options.doneness || ''}-${ci.options.spiceLevel || ''}-${(ci.options.addOns || []).map(a => a.name).sort().join(',')}-${ci.options.specialInstructions || ''}`;
        return ciKey === optionKey;
      });

      if (existingIdx > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIdx].quantity + qty;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          totalPrice: Number((newQty * unitPrice).toFixed(2))
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: 'ci-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          menuItem: item,
          quantity: qty,
          options,
          totalPrice: Number((qty * unitPrice).toFixed(2))
        };
        return [...prevCart, newItem];
      }
    });

    d1LogActivity('cart_add_item', user?.email, user?.name, {
      itemId: item.id,
      itemName: item.name,
      quantity: qty,
      unitPrice
    });

    showToast(`Added ${qty}x ${item.name} to cart`);
  };

  const updateCartQty = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.id === cartItemId) {
          const unitPrice = item.totalPrice / item.quantity;
          return {
            ...item,
            quantity: newQty,
            totalPrice: Number((newQty * unitPrice).toFixed(2))
          };
        }
        return item;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    d1LogActivity('cart_remove_item', user?.email, user?.name, { cartItemId });
    showToast('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromo(null);
    d1LogActivity('cart_cleared', user?.email, user?.name);
  };

  // Active Order
  const activeOrder = orders.find(o => o.status !== 'delivered' && o.status !== 'cancelled') || null;

  const placeOrder = async (details: {
    orderType: 'delivery' | 'pickup';
    deliveryAddress: string;
    customerPhone: string;
    paymentMethod: 'Cash on Delivery' | 'Credit / Debit Card' | 'Digital Wallet';
    specialInstructions?: string;
    tip: number;
  }) => {
    if (cart.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    // Ensure we have an active user context (either logged in or seamless guest)
    let currentUser = user;
    if (!currentUser) {
      const guestId = auth.currentUser?.uid || ('guest-' + Date.now());
      currentUser = {
        id: guestId,
        name: 'Guest Customer',
        email: 'guest@thegrillspot.local',
        phone: details.customerPhone || '+1 (555) 438-9201',
        address: details.deliveryAddress || '450 Flame Blvd, Apt 4B',
        role: 'customer',
        createdAt: new Date().toISOString()
      };
      setUser(currentUser);
      try {
        await d1SyncUser(currentUser);
      } catch {
        // D1 user sync warning ignored
      }
    }

    const subtotal = cartSubtotal;
    const deliveryFee = details.orderType === 'delivery' ? 2.99 : 0;
    const tax = Number((subtotal * 0.0825).toFixed(2));
    const discount = promoDiscount;
    const total = Number((subtotal + deliveryFee + tax + details.tip - discount).toFixed(2));

    const orderId = 'ord-' + Date.now() + '-' + Math.floor(100 + Math.random() * 900);
    const orderNumber = '#GS-' + Math.floor(1000 + Math.random() * 9000);

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: currentUser.id,
      customerName: currentUser.name,
      items: [...cart],
      subtotal,
      deliveryFee,
      tax,
      discount,
      tip: details.tip,
      total,
      status: 'confirmed',
      orderType: details.orderType,
      deliveryAddress: details.deliveryAddress || currentUser.address,
      customerPhone: details.customerPhone || currentUser.phone,
      paymentMethod: details.paymentMethod,
      specialInstructions: details.specialInstructions,
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: details.orderType === 'delivery' ? '25-30 mins' : '15-20 mins',
      riderName: 'Marcus Vance',
      riderPhone: '+1 (555) 902-8812'
    };

    // 1. Try Firestore if user is authenticated with Firebase
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'orders', orderId), newOrder);
      } catch (fsErr) {
        console.warn('Firestore setDoc warning, persisting order via Cloudflare D1 SQL:', fsErr);
      }
    }

    // 2. Persist Order in Cloudflare D1 SQL database
    try {
      await d1SaveOrder(newOrder);
      await refreshD1Status();
    } catch (d1Err) {
      console.warn('Cloudflare D1 save order warning:', d1Err);
    }

    // 3. Immediately update UI state, clear cart, navigate to orders and notify user
    setOrders(prev => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
    clearCart();
    setActiveTab('orders');
    showToast(`Order ${newOrder.orderNumber} placed! Hardwood charcoal is searing...`);
    return { success: true, orderId };
  };

  const reorder = (pastOrder: Order) => {
    pastOrder.items.forEach(item => {
      addToCart(item.menuItem, item.options, item.quantity);
    });
    setActiveTab('cart');
    showToast('Added items from past order into your cart!');
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled' });
      await d1UpdateOrderStatus(orderId, 'cancelled', undefined, user?.email, user?.name);
      await refreshD1Status();
      showToast('Order marked as cancelled in Cloudflare D1.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      await d1UpdateOrderStatus(orderId, 'cancelled', undefined, user?.email, user?.name);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    riderName?: string,
    riderPhone?: string
  ) => {
    try {
      const updates: any = {
        status: newStatus,
        estimatedDeliveryTime:
          newStatus === 'delivered'
            ? 'Delivered'
            : newStatus === 'out_for_delivery'
            ? '5-10 mins'
            : newStatus === 'quality_check'
            ? '15-20 mins'
            : '25-35 mins'
      };
      if (riderName) updates.riderName = riderName;
      if (riderPhone) updates.riderPhone = riderPhone;

      await updateDoc(doc(db, 'orders', orderId), updates);
      // Save status update to Cloudflare D1 SQL
      await d1UpdateOrderStatus(orderId, newStatus, riderName, user?.email, user?.name);
      await refreshD1Status();

      showToast(`Order status updated to: ${newStatus.replace('_', ' ').toUpperCase()} (Cloudflare D1 SQL)`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      await d1UpdateOrderStatus(orderId, newStatus, riderName, user?.email, user?.name);
    }
  };

  // Menu Management
  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const newId = 'menu-' + Date.now();
    const newItem: MenuItem = { ...item, id: newId, rating: 5.0, reviewCount: 1 };
    try {
      await setDoc(doc(db, 'menu', newId), newItem);
      await d1SaveMenuItem(newItem, user?.email);
      await refreshD1Status();
      showToast(`Added ${item.name} to Cloudflare D1 menu!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `menu/${newId}`);
      await d1SaveMenuItem(newItem, user?.email);
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      await updateDoc(doc(db, 'menu', id), updates);
      await d1SaveMenuItem({ id, ...updates }, user?.email);
      await refreshD1Status();
      showToast('Menu item updated in Cloudflare D1 SQL!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `menu/${id}`);
      await d1SaveMenuItem({ id, ...updates }, user?.email);
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'menu', id));
      await d1DeleteMenuItem(id);
      await refreshD1Status();
      showToast('Item deleted from Cloudflare D1 menu.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `menu/${id}`);
      await d1DeleteMenuItem(id);
    }
  };

  // Staff Management
  const addStaffMember = async (staff: Omit<StaffMember, 'id'>) => {
    const id = 'st-' + Date.now();
    const newMember: StaffMember = { ...staff, id };
    try {
      await setDoc(doc(db, 'staff', id), newMember);
      await d1SaveStaff(newMember);
      await refreshD1Status();
      showToast(`Added staff member ${staff.name} to Cloudflare D1!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `staff/${id}`);
      await d1SaveStaff(newMember);
    }
  };

  const updateStaffMember = async (id: string, updates: Partial<StaffMember>) => {
    try {
      await updateDoc(doc(db, 'staff', id), updates);
      await d1SaveStaff({ id, ...updates });
      await refreshD1Status();
      showToast('Staff member updated in Cloudflare D1 SQL!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `staff/${id}`);
      await d1SaveStaff({ id, ...updates });
    }
  };

  const deleteStaffMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
      await d1DeleteStaff(id);
      await refreshD1Status();
      showToast('Staff member removed from Cloudflare D1.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `staff/${id}`);
      await d1DeleteStaff(id);
    }
  };

  // Riders Management
  const addRiderMember = async (rider: Omit<RiderMember, 'id'>) => {
    const id = 'rd-' + Date.now();
    const newRider: RiderMember = { ...rider, id };
    try {
      await setDoc(doc(db, 'riders', id), newRider);
      await d1SaveRider(newRider);
      await refreshD1Status();
      showToast(`Added rider ${rider.name} to Cloudflare D1 fleet!`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `riders/${id}`);
      await d1SaveRider(newRider);
    }
  };

  const updateRiderMember = async (id: string, updates: Partial<RiderMember>) => {
    try {
      await updateDoc(doc(db, 'riders', id), updates);
      await d1SaveRider({ id, ...updates });
      await refreshD1Status();
      showToast('Rider details updated in Cloudflare D1 SQL!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `riders/${id}`);
      await d1SaveRider({ id, ...updates });
    }
  };

  const deleteRiderMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'riders', id));
      await d1DeleteRider(id);
      await refreshD1Status();
      showToast('Rider removed from Cloudflare D1.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `riders/${id}`);
      await d1DeleteRider(id);
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        user,
        isAdmin,
        isAuthLoading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        updateUserProfile,
        cart,
        cartCount,
        cartSubtotal,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        appliedPromo,
        promoDiscount,
        applyPromoCode,
        removePromoCode,
        orders,
        activeOrder,
        placeOrder,
        reorder,
        cancelOrder,
        updateOrderStatus,
        selectedItemForDetail,
        setSelectedItemForDetail,
        authModalOpen,
        setAuthModalOpen,
        toast,
        showToast,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
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
        allUsersList,
        d1Status,
        refreshD1Status,
        syncAllToD1
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
