export type ThemeMode = 'light' | 'dark';

export type TabType = 'home' | 'search' | 'cart' | 'orders' | 'account' | 'admin';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  rating: number;
  reviewCount: number;
  isSpicy?: boolean;
  spiceLevel?: 1 | 2 | 3;
  isBestseller?: boolean;
  isChefSpecial?: boolean;
  prepTime: string;
  calories?: number;
  inStock?: boolean;
  stockCount?: number;
  customizationOptions?: {
    doneness?: string[];
    spiceLevels?: string[];
    addOns?: { name: string; price: number }[];
  };
}

export interface CartItemOption {
  doneness?: string;
  spiceLevel?: string;
  addOns?: { name: string; price: number }[];
  specialInstructions?: string;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  options: CartItemOption;
  totalPrice: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  secondaryAddress?: string;
  avatarUrl?: string;
  role?: 'admin' | 'staff' | 'rider' | 'customer';
  createdAt: string;
}

export type OrderStatus =
  | 'confirmed'
  | 'grilling'
  | 'quality_check'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
  status: OrderStatus;
  orderType: 'delivery' | 'pickup';
  deliveryAddress: string;
  customerPhone: string;
  paymentMethod: 'Cash on Delivery' | 'Credit / Debit Card' | 'Digital Wallet';
  specialInstructions?: string;
  createdAt: string;
  estimatedDeliveryTime: string;
  riderName?: string;
  riderPhone?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  shift: string;
  active: boolean;
}

export interface RiderMember {
  id: string;
  name: string;
  phone: string;
  vehicle: string;
  status: 'available' | 'on_delivery' | 'offline';
  rating: number;
  deliveriesCount: number;
}
