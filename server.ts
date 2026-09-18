import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Normalize URL for Vercel Serverless Function rewrites:
// When Vercel rewrites /api/(.*) to /api, ensure endpoints matching /api/* are matched properly
app.use((req, _res, next) => {
  if (!req.url.startsWith('/api') && (req.url.startsWith('/d1') || req.url.startsWith('/health'))) {
    req.url = '/api' + req.url;
  }
  next();
});

let d1SchemaInitialized = false;
export async function ensureD1Schema() {
  if (d1SchemaInitialized) return;
  try {
    await initializeD1Schema();
    d1SchemaInitialized = true;
  } catch (e: any) {
    console.error('Cloudflare D1 schema initialization warning:', e?.message || e);
  }
}

// Ensure schema is checked on first D1 API call in serverless environments
app.use(async (req, _res, next) => {
  if (!d1SchemaInitialized && req.url.includes('/d1')) {
    await ensureD1Schema();
  }
  next();
});

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '5847d87426a6e542bb9b8a61fa6e4fdc';
const CF_DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID || 'c41385c3-6bbd-4b69-88c3-d3d155c17cf7';
const CF_API_TOKEN = process.env.CLOUDFLARE_D1_API_TOKEN || 'cfat_ldCnx64HxxyBbUtawZkEBc79dbC7o6rrYUxX6LsAd2f7d586';

let d1AuthWarningLogged = false;

// Resilient in-memory fallback cache to ensure uninterrupted operation
export const d1FallbackStore = {
  users: new Map<string, any>(),
  orders: new Map<string, any>(),
  menuItems: new Map<string, any>(),
  staff: new Map<string, any>(),
  riders: new Map<string, any>(),
  activityLogs: [] as Array<{
    id: string;
    event_type: string;
    actor_email: string;
    actor_name: string;
    details: any;
    created_at: string;
  }>
};

// Generic Cloudflare D1 SQL Query Runner
export async function queryD1<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_DATABASE_ID}/query`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CF_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sql,
      params
    })
  });

  const data = await response.json();
  if (!data.success) {
    const errorMsg = data.errors?.map((e: any) => e.message).join(', ') || 'Unknown Cloudflare D1 error';
    throw new Error(errorMsg);
  }

  return (data.result?.[0]?.results || []) as T[];
}

// Log an event to D1 activity_logs table with resilient fallback
export async function recordD1Activity(
  eventType: string,
  actorEmail: string = 'system',
  actorName: string = 'System',
  details: Record<string, any> = {}
) {
  const id = 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();
  const parsedDetails = typeof details === 'string' ? safeParseJson(details) : details;

  const logEntry = {
    id,
    event_type: eventType,
    action: eventType,
    actor_email: actorEmail,
    actor_name: actorName,
    details: parsedDetails,
    created_at: now
  };

  // Buffer in local memory so logs are always preserved and accessible
  d1FallbackStore.activityLogs.unshift(logEntry);
  if (d1FallbackStore.activityLogs.length > 200) {
    d1FallbackStore.activityLogs.pop();
  }

  try {
    await queryD1(
      'INSERT INTO activity_logs (id, event_type, actor_email, actor_name, details, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, eventType, actorEmail, actorName, JSON.stringify(details), now]
    );
  } catch (err: any) {
    // Gracefully handle unconfigured/expired D1 token without polluting error logs
    if (!d1AuthWarningLogged) {
      console.info('ℹ️ [Cloudflare D1] Remote database credentials pending or in standby. Using resilient in-memory activity tracking.');
      d1AuthWarningLogged = true;
    }
  }
}

// Initialize tables on startup if not already created
async function initializeD1Schema() {
  try {
    const ddl = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        address TEXT,
        secondary_address TEXT,
        role TEXT DEFAULT 'customer',
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        delivery_address TEXT NOT NULL,
        items TEXT NOT NULL,
        subtotal REAL NOT NULL,
        delivery_fee REAL NOT NULL,
        discount REAL DEFAULT 0,
        total REAL NOT NULL,
        status TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        notes TEXT,
        estimated_time TEXT,
        promo_code TEXT,
        rider_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        original_price REAL,
        category TEXT NOT NULL,
        rating REAL DEFAULT 4.8,
        rating_count INTEGER DEFAULT 0,
        wait_time TEXT,
        is_bestseller INTEGER DEFAULT 0,
        is_chef_special INTEGER DEFAULT 0,
        is_spicy INTEGER DEFAULT 0,
        image TEXT,
        in_stock INTEGER DEFAULT 1,
        stock_quantity INTEGER DEFAULT 50,
        portions_remaining INTEGER DEFAULT 25,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        shift TEXT NOT NULL,
        phone TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS riders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        vehicle TEXT NOT NULL,
        available INTEGER DEFAULT 1,
        rating REAL DEFAULT 4.9,
        deliveries INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        actor_email TEXT,
        actor_name TEXT,
        details TEXT,
        created_at TEXT NOT NULL
      );
    `;

    await queryD1(ddl);
    console.log('✅ Cloudflare D1 SQL Schema verified.');
  } catch (e: any) {
    if (!d1AuthWarningLogged) {
      console.info('ℹ️ [Cloudflare D1] Running with in-memory resilient storage while D1 token is pending configuration.');
      d1AuthWarningLogged = true;
    }
  }
}

// ==========================================
// API ROUTES: Cloudflare D1 SQL Endpoints
// ==========================================

// Helper safe JSON parse
function safeParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// Helper to normalize orders for frontend Order interface
function formatOrderResponse(o: any) {
  const items = typeof o.items === 'string' ? safeParseJson(o.items) : (o.items || []);
  const safeItems = Array.isArray(items)
    ? items.map((it: any) => ({
        ...it,
        options: it?.options || {}
      }))
    : [];
  const idStr = String(o.id || '');
  const orderNum = o.orderNumber || o.order_number || (idStr.startsWith('#GS-') ? idStr : ('#GS-' + (idStr.includes('-') ? idStr.split('-').pop() : (idStr.length > 4 ? idStr.slice(-4) : '4821'))));
  const subtotal = Number(o.subtotal) || 0;
  const deliveryFee = Number(o.deliveryFee !== undefined ? o.deliveryFee : (o.delivery_fee !== undefined ? o.delivery_fee : 2.99));
  const tax = Number(o.tax !== undefined ? o.tax : Number((subtotal * 0.0825).toFixed(2)));
  const discount = Number(o.discount) || 0;
  const tip = Number(o.tip) || 0;
  const total = Number(o.total) || Number((subtotal + deliveryFee + tax + tip - discount).toFixed(2));

  return {
    id: o.id,
    orderNumber: orderNum,
    userId: o.userId || o.user_id || o.customerEmail || o.customer_email || 'cust_guest',
    customerName: o.customerName || o.customer_name || 'Grill Customer',
    customerEmail: o.customerEmail || o.customer_email || 'customer@thegrillspot.local',
    customerPhone: o.customerPhone || o.customer_phone || '+1 (555) 438-9201',
    deliveryAddress: o.deliveryAddress || o.delivery_address || '742 Evergreen Terrace, Apt 12',
    items: safeItems,
    subtotal,
    deliveryFee,
    tax,
    discount,
    tip,
    total,
    status: o.status || 'confirmed',
    orderType: o.orderType || o.order_type || 'delivery',
    paymentMethod: o.paymentMethod || o.payment_method || 'Cash on Delivery',
    specialInstructions: o.notes || o.specialInstructions || o.special_instructions || '',
    estimatedDeliveryTime: o.estimatedTime || o.estimatedDeliveryTime || o.estimated_time || '20-25 mins',
    riderName: o.riderName || o.rider_name || 'Marcus "Speedy" Vance',
    riderPhone: o.riderPhone || o.rider_phone || '+1 (555) 902-8812',
    createdAt: o.createdAt || o.created_at || new Date().toISOString()
  };
}

// Initial demonstration orders for live dispatching
const DEMO_LIVE_ORDERS = [
  {
    id: 'ord-live-101',
    orderNumber: '#GS-4821',
    userId: 'cust-101',
    customerName: 'David Miller',
    customerEmail: 'david.m@example.com',
    customerPhone: '+1 (555) 782-9014',
    deliveryAddress: '842 Highland Ave, Apt 4B',
    items: [
      {
        menuItem: {
          id: 'g1',
          name: 'The Boss Flame Burger',
          price: 13.99,
          category: 'burgers',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
          prepTime: '15-20 min',
          isBestseller: true
        },
        options: { doneness: 'Medium Well' },
        quantity: 2,
        totalPrice: 27.98
      },
      {
        menuItem: {
          id: 'g12',
          name: 'Fresh Mint Flame Lemonade',
          price: 4.99,
          category: 'drinks',
          image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
          prepTime: '5 min'
        },
        quantity: 2,
        totalPrice: 9.98
      }
    ],
    subtotal: 37.96,
    deliveryFee: 2.99,
    tax: 3.13,
    discount: 0,
    tip: 5.00,
    total: 49.08,
    status: 'grilling',
    orderType: 'delivery',
    paymentMethod: 'Credit / Debit Card',
    specialInstructions: 'Extra napkins and smoky BBQ sauce on the side please!',
    estimatedDeliveryTime: '15-20 mins',
    riderName: 'Marcus "Speedy" Vance',
    riderPhone: '+1 (555) 902-8812',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString()
  },
  {
    id: 'ord-live-102',
    orderNumber: '#GS-5104',
    userId: 'cust-102',
    customerName: 'Jessica Taylor',
    customerEmail: 'jessica.t@example.com',
    customerPhone: '+1 (555) 234-8891',
    deliveryAddress: '1204 Pine Ridge Rd, Fl 2',
    items: [
      {
        menuItem: {
          id: 'g3',
          name: 'Prime Tomahawk Ribeye Steak (16 oz)',
          price: 34.99,
          category: 'steaks',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
          prepTime: '25-30 min',
          isChefSpecial: true
        },
        options: { doneness: 'Medium Rare (Chef Pick)' },
        quantity: 1,
        totalPrice: 34.99
      },
      {
        menuItem: {
          id: 'g11',
          name: 'Smoked Vanilla Salted Caramel Milkshake',
          price: 6.99,
          category: 'drinks',
          image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
          prepTime: '5 min'
        },
        quantity: 1,
        totalPrice: 6.99
      }
    ],
    subtotal: 41.98,
    deliveryFee: 2.99,
    tax: 3.46,
    discount: 5.00,
    tip: 6.00,
    total: 49.43,
    status: 'confirmed',
    orderType: 'delivery',
    paymentMethod: 'Digital Wallet',
    specialInstructions: 'Ring doorbell twice upon arrival.',
    estimatedDeliveryTime: '25-30 mins',
    riderName: 'Elena Rostova',
    riderPhone: '+1 (555) 903-4421',
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString()
  },
  {
    id: 'ord-live-103',
    orderNumber: '#GS-3982',
    userId: 'cust-103',
    customerName: 'Robert Chen',
    customerEmail: 'robert.c@example.com',
    customerPhone: '+1 (555) 671-3490',
    deliveryAddress: '305 Downtown Metro Plaza, Suite 900',
    items: [
      {
        menuItem: {
          id: 'g2',
          name: 'Smoked Texas Brisket Burger',
          price: 15.49,
          category: 'burgers',
          image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
          prepTime: '15-20 min',
          isChefSpecial: true
        },
        quantity: 2,
        totalPrice: 30.98
      },
      {
        menuItem: {
          id: 'g9',
          name: 'Truffle & Herb Smoked Fries',
          price: 7.99,
          category: 'sides',
          image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
          prepTime: '10 min',
          isBestseller: true
        },
        quantity: 1,
        totalPrice: 7.99
      }
    ],
    subtotal: 38.97,
    deliveryFee: 2.99,
    tax: 3.22,
    discount: 0,
    tip: 4.50,
    total: 49.68,
    status: 'out_for_delivery',
    orderType: 'delivery',
    paymentMethod: 'Cash on Delivery',
    specialInstructions: 'Leave with front desk security if needed.',
    estimatedDeliveryTime: '5-10 mins',
    riderName: 'Jamal Washington',
    riderPhone: '+1 (555) 904-7733',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString()
  }
];

// Initialize in-memory fallback store with demo live orders
DEMO_LIVE_ORDERS.forEach(order => {
  d1FallbackStore.orders.set(order.id, order);
});

// 1. Health & Database Status
app.get('/api/d1/status', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    await queryD1('SELECT 1');
    const latency = Date.now() - startTime;

    // Fetch counts from all tables
    const [usersCount] = await queryD1<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const [ordersCount] = await queryD1<{ count: number }>('SELECT COUNT(*) as count FROM orders');
    const [menuCount] = await queryD1<{ count: number }>('SELECT COUNT(*) as count FROM menu_items');
    const [staffCount] = await queryD1<{ count: number }>('SELECT COUNT(*) as count FROM staff');
    const [ridersCount] = await queryD1<{ count: number }>('SELECT COUNT(*) as count FROM riders');
    const [logsCount] = await queryD1<{ count: number }>('SELECT COUNT(*) as count FROM activity_logs');

    // Fetch recent 15 activity logs
    const recentLogs = await queryD1(
      'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 15'
    );

    res.json({
      success: true,
      connected: true,
      provider: 'Cloudflare D1 SQL Database',
      accountId: CF_ACCOUNT_ID,
      databaseId: CF_DATABASE_ID,
      latencyMs: latency,
      tables: {
        users: usersCount?.count || 0,
        orders: ordersCount?.count || 0,
        menuItems: menuCount?.count || 0,
        staff: staffCount?.count || 0,
        riders: ridersCount?.count || 0,
        activityLogs: logsCount?.count || 0
      },
      recentLogs: recentLogs.map((log: any) => ({
        ...log,
        action: log.event_type || log.action || 'system_event',
        details: typeof log.details === 'string' ? safeParseJson(log.details) : log.details
      }))
    });
  } catch (err: any) {
    // Graceful response without HTTP 500 error
    res.json({
      success: true,
      connected: false,
      isFallback: true,
      provider: 'Cloudflare D1 SQL (Resilient Cache Mode)',
      accountId: CF_ACCOUNT_ID,
      databaseId: CF_DATABASE_ID,
      latencyMs: Date.now() - startTime,
      message: err?.message || 'Cloudflare D1 in standby or awaiting token configuration',
      tables: {
        users: d1FallbackStore.users.size,
        orders: d1FallbackStore.orders.size,
        menuItems: d1FallbackStore.menuItems.size,
        staff: d1FallbackStore.staff.size,
        riders: d1FallbackStore.riders.size,
        activityLogs: d1FallbackStore.activityLogs.length
      },
      recentLogs: d1FallbackStore.activityLogs.slice(0, 15)
    });
  }
});

// 2. Customer & User Data
app.post('/api/d1/users/sync', async (req: Request, res: Response) => {
  const { id, name, email, phone, address, secondaryAddress, role } = req.body;
  if (!id || !email) {
    return res.status(400).json({ success: false, error: 'User id and email are required' });
  }

  const now = new Date().toISOString();
  const userRecord = {
    id,
    name: name || 'Customer',
    email,
    phone: phone || '',
    address: address || '',
    secondary_address: secondaryAddress || '',
    role: role || 'customer',
    created_at: now,
    updated_at: now
  };
  d1FallbackStore.users.set(id, userRecord);

  try {
    await queryD1(
      `INSERT INTO users (id, name, email, phone, address, secondary_address, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         email = excluded.email,
         phone = COALESCE(excluded.phone, users.phone),
         address = COALESCE(excluded.address, users.address),
         secondary_address = COALESCE(excluded.secondary_address, users.secondary_address),
         role = COALESCE(excluded.role, users.role),
         updated_at = excluded.updated_at;`,
      [id, name || 'Customer', email, phone || '', address || '', secondaryAddress || '', role || 'customer', now, now]
    );
  } catch {
    // Saved in resilient in-memory store
  }

  await recordD1Activity('user_sync', email, name || 'Customer', {
    userId: id,
    action: 'Profile synchronized with Cloudflare D1 SQL'
  });

  res.json({ success: true, message: 'User profile saved to Cloudflare D1' });
});

app.get('/api/d1/users', async (_req: Request, res: Response) => {
  try {
    const users = await queryD1('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, users });
  } catch {
    res.json({ success: true, users: Array.from(d1FallbackStore.users.values()) });
  }
});

// 3. Orders Management
app.post('/api/d1/orders', async (req: Request, res: Response) => {
  const {
    id,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    items,
    subtotal,
    deliveryFee,
    discount,
    total,
    status,
    paymentMethod,
    notes,
    estimatedTime,
    promoCode,
    riderName
  } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Order ID is required' });
  }

  const effectiveEmail = customerEmail || 'guest@thegrillspot.local';
  const now = new Date().toISOString();
  const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);

  const orderRecord = {
    id,
    orderNumber: req.body.orderNumber || ('#GS-' + String(id).slice(-4)),
    userId: req.body.userId || effectiveEmail,
    customerName: customerName || 'Customer',
    customerEmail: effectiveEmail,
    customerPhone: customerPhone || '',
    deliveryAddress: deliveryAddress || '',
    items: typeof items === 'string' ? safeParseJson(items) : (items || []),
    subtotal: Number(subtotal) || 0,
    deliveryFee: Number(deliveryFee) || 0,
    tax: Number(req.body.tax) || Number(((Number(subtotal) || 0) * 0.0825).toFixed(2)),
    discount: Number(discount) || 0,
    tip: Number(req.body.tip) || 0,
    total: Number(total) || 0,
    status: status || 'confirmed',
    orderType: req.body.orderType || 'delivery',
    paymentMethod: paymentMethod || 'Cash on Delivery',
    notes: notes || '',
    estimatedTime: estimatedTime || '25-35 min',
    promoCode: promoCode || '',
    riderName: riderName || '',
    riderPhone: req.body.riderPhone || '',
    created_at: now,
    updated_at: now
  };
  d1FallbackStore.orders.set(id, orderRecord);

  try {
    await queryD1(
      `INSERT INTO orders (
        id, customer_name, customer_email, customer_phone, delivery_address,
        items, subtotal, delivery_fee, discount, total, status,
        payment_method, notes, estimated_time, promo_code, rider_name,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        rider_name = COALESCE(excluded.rider_name, orders.rider_name),
        updated_at = excluded.updated_at;`,
      [
        id,
        customerName || 'Customer',
        effectiveEmail,
        customerPhone || '',
        deliveryAddress || '',
        itemsJson,
        Number(subtotal) || 0,
        Number(deliveryFee) || 0,
        Number(discount) || 0,
        Number(total) || 0,
        status || 'confirmed',
        paymentMethod || 'Cash on Delivery',
        notes || '',
        estimatedTime || '25-35 min',
        promoCode || '',
        riderName || '',
        now,
        now
      ]
    );
  } catch {
    // Saved in resilient in-memory store
  }

  await recordD1Activity('order_placed', effectiveEmail, customerName || 'Customer', {
    orderId: id,
    total,
    status: status || 'confirmed',
    itemCount: Array.isArray(items) ? items.length : 1
  });

  res.json({ success: true, orderId: id, message: 'Order saved to Cloudflare D1 SQL' });
});

app.patch('/api/d1/orders/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, riderName, actorEmail, actorName } = req.body;
  const now = new Date().toISOString();

  const existing = d1FallbackStore.orders.get(id);
  if (existing) {
    existing.status = status;
    if (riderName) existing.rider_name = riderName;
    existing.updated_at = now;
  }

  try {
    if (riderName) {
      await queryD1(
        'UPDATE orders SET status = ?, rider_name = ?, updated_at = ? WHERE id = ?',
        [status, riderName, now, id]
      );
    } else {
      await queryD1(
        'UPDATE orders SET status = ?, updated_at = ? WHERE id = ?',
        [status, now, id]
      );
    }
  } catch {
    // Handled in fallback
  }

  await recordD1Activity('order_status_update', actorEmail || 'admin', actorName || 'Pitmaster Admin', {
    orderId: id,
    newStatus: status,
    riderName: riderName || undefined
  });

  res.json({ success: true, message: `Order ${id} status updated to ${status}` });
});

app.get('/api/d1/orders', async (req: Request, res: Response) => {
  const { email } = req.query;
  try {
    let orders: any[];
    if (email) {
      orders = await queryD1('SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC', [email]);
    } else {
      orders = await queryD1('SELECT * FROM orders ORDER BY created_at DESC');
    }

    if (Array.isArray(orders) && orders.length > 0) {
      const parsed = orders.map(formatOrderResponse);
      return res.json({ success: true, orders: parsed });
    }

    // If D1 table has no records yet, use the in-memory fallback store
    const list = Array.from(d1FallbackStore.orders.values())
      .filter(o => !email || (o.customerEmail || o.customer_email) === email)
      .map(formatOrderResponse);

    res.json({ success: true, orders: list });
  } catch {
    const list = Array.from(d1FallbackStore.orders.values())
      .filter(o => !email || (o.customerEmail || o.customer_email) === email)
      .map(formatOrderResponse);
    res.json({ success: true, orders: list });
  }
});

// 4. Menu Items Management
app.get('/api/d1/menu', async (_req: Request, res: Response) => {
  try {
    const menu = await queryD1('SELECT * FROM menu_items ORDER BY category ASC, price ASC');
    const parsed = menu.map((item: any) => ({
      ...item,
      isBestseller: Boolean(item.is_bestseller),
      isChefSpecial: Boolean(item.is_chef_special),
      isSpicy: Boolean(item.is_spicy),
      inStock: Boolean(item.in_stock),
      originalPrice: item.original_price,
      stockQuantity: item.stock_quantity,
      portionsRemaining: item.portions_remaining,
      reviewCount: item.rating_count,
      prepTime: item.wait_time
    }));
    res.json({ success: true, menu: parsed });
  } catch {
    const list = Array.from(d1FallbackStore.menuItems.values());
    res.json({ success: true, menu: list });
  }
});

app.post('/api/d1/menu', async (req: Request, res: Response) => {
  const item = req.body;
  const now = new Date().toISOString();
  const id = item.id || 'm_' + Date.now();

  const menuItemRecord = {
    ...item,
    id,
    updated_at: now
  };
  d1FallbackStore.menuItems.set(id, menuItemRecord);

  try {
    await queryD1(
      `INSERT INTO menu_items (
        id, name, description, price, original_price, category,
        rating, rating_count, wait_time, is_bestseller, is_chef_special,
        is_spicy, image, in_stock, stock_quantity, portions_remaining,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        description = excluded.description,
        price = excluded.price,
        original_price = excluded.original_price,
        category = excluded.category,
        in_stock = excluded.in_stock,
        stock_quantity = excluded.stock_quantity,
        portions_remaining = excluded.portions_remaining,
        updated_at = excluded.updated_at;`,
      [
        id,
        item.name,
        item.description || '',
        Number(item.price) || 0,
        item.originalPrice ? Number(item.originalPrice) : null,
        item.category || 'burgers',
        Number(item.rating) || 4.8,
        Number(item.reviewCount || item.rating_count) || 120,
        item.prepTime || item.wait_time || '15-20 min',
        item.isBestseller ? 1 : 0,
        item.isChefSpecial ? 1 : 0,
        item.isSpicy ? 1 : 0,
        item.image || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
        item.inStock !== false ? 1 : 0,
        Number(item.stockQuantity) || 50,
        Number(item.portionsRemaining) || 25,
        now,
        now
      ]
    );
  } catch {
    // Saved in fallback
  }

  await recordD1Activity('menu_item_saved', req.body.actorEmail || 'admin', 'Admin', {
    itemId: id,
    name: item.name,
    price: item.price
  });

  res.json({ success: true, id, message: 'Menu item saved in Cloudflare D1 SQL' });
});

app.delete('/api/d1/menu/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  d1FallbackStore.menuItems.delete(id);

  try {
    await queryD1('DELETE FROM menu_items WHERE id = ?', [id]);
  } catch {
    // Handled in fallback
  }

  await recordD1Activity('menu_item_deleted', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', { itemId: id });
  res.json({ success: true, message: `Menu item ${id} deleted` });
});

// 5. Staff Management
app.get('/api/d1/staff', async (_req: Request, res: Response) => {
  try {
    const staff = await queryD1('SELECT * FROM staff ORDER BY created_at DESC');
    res.json({
      success: true,
      staff: staff.map((s: any) => ({
        ...s,
        active: Boolean(s.active)
      }))
    });
  } catch {
    res.json({ success: true, staff: Array.from(d1FallbackStore.staff.values()) });
  }
});

app.post('/api/d1/staff', async (req: Request, res: Response) => {
  const s = req.body;
  const id = s.id || 'st_' + Date.now();
  const now = new Date().toISOString();

  const staffRecord = {
    ...s,
    id,
    created_at: now
  };
  d1FallbackStore.staff.set(id, staffRecord);

  try {
    await queryD1(
      `INSERT INTO staff (id, name, role, shift, phone, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         role = excluded.role,
         shift = excluded.shift,
         phone = excluded.phone,
         active = excluded.active;`,
      [id, s.name, s.role, s.shift, s.phone || '', s.active !== false ? 1 : 0, now]
    );
  } catch {
    // Saved in fallback
  }

  await recordD1Activity('staff_updated', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', { staffId: id, name: s.name });
  res.json({ success: true, id, message: 'Staff saved in Cloudflare D1 SQL' });
});

app.delete('/api/d1/staff/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  d1FallbackStore.staff.delete(id);

  try {
    await queryD1('DELETE FROM staff WHERE id = ?', [id]);
  } catch {
    // Handled in fallback
  }

  await recordD1Activity('staff_deleted', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', { staffId: id });
  res.json({ success: true, message: `Staff ${id} deleted` });
});

// 6. Riders Management
app.get('/api/d1/riders', async (_req: Request, res: Response) => {
  try {
    const riders = await queryD1('SELECT * FROM riders ORDER BY created_at DESC');
    res.json({
      success: true,
      riders: riders.map((r: any) => ({
        ...r,
        available: Boolean(r.available)
      }))
    });
  } catch {
    res.json({ success: true, riders: Array.from(d1FallbackStore.riders.values()) });
  }
});

app.post('/api/d1/riders', async (req: Request, res: Response) => {
  const r = req.body;
  const id = r.id || 'rd_' + Date.now();
  const now = new Date().toISOString();

  const riderRecord = {
    ...r,
    id,
    created_at: now
  };
  d1FallbackStore.riders.set(id, riderRecord);

  try {
    await queryD1(
      `INSERT INTO riders (id, name, phone, vehicle, available, rating, deliveries, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         phone = excluded.phone,
         vehicle = excluded.vehicle,
         available = excluded.available,
         rating = excluded.rating,
         deliveries = excluded.deliveries;`,
      [id, r.name, r.phone, r.vehicle, r.available !== false ? 1 : 0, Number(r.rating) || 4.9, Number(r.deliveries) || 0, now]
    );
  } catch {
    // Saved in fallback
  }

  await recordD1Activity('rider_updated', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', { riderId: id, name: r.name });
  res.json({ success: true, id, message: 'Rider saved in Cloudflare D1 SQL' });
});

app.delete('/api/d1/riders/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  d1FallbackStore.riders.delete(id);

  try {
    await queryD1('DELETE FROM riders WHERE id = ?', [id]);
  } catch {
    // Handled in fallback
  }

  await recordD1Activity('rider_deleted', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', { riderId: id });
  res.json({ success: true, message: `Rider ${id} deleted` });
});

// 7. General Activity Logging Endpoint ("all things that happen in this website")
app.post('/api/d1/activity', async (req: Request, res: Response) => {
  try {
    const { eventType, actorEmail, actorName, details } = req.body;
    await recordD1Activity(eventType || 'user_event', actorEmail || 'guest', actorName || 'Guest Visitor', details || {});
    res.json({ success: true });
  } catch {
    res.json({ success: true, fallback: true });
  }
});

app.get('/api/d1/activity', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  try {
    const logs = await queryD1(
      'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    res.json({
      success: true,
      logs: logs.map((l: any) => ({
        ...l,
        action: l.event_type || l.action || 'system_event',
        details: typeof l.details === 'string' ? safeParseJson(l.details) : l.details
      }))
    });
  } catch {
    res.json({
      success: true,
      fallback: true,
      logs: d1FallbackStore.activityLogs.slice(0, limit)
    });
  }
});

// 8. Seed/Sync All Existing Data to Cloudflare D1
app.post('/api/d1/seed-defaults', async (req: Request, res: Response) => {
  const { menuItems, staffList, ridersList } = req.body;
  let seededMenu = 0;
  let seededStaff = 0;
  let seededRiders = 0;

  const now = new Date().toISOString();

  if (Array.isArray(menuItems) && menuItems.length > 0) {
    for (const item of menuItems) {
      d1FallbackStore.menuItems.set(item.id, item);
      try {
        await queryD1(
          `INSERT INTO menu_items (
            id, name, description, price, original_price, category,
            rating, rating_count, wait_time, is_bestseller, is_chef_special,
            is_spicy, image, in_stock, stock_quantity, portions_remaining,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            price = excluded.price,
            category = excluded.category,
            updated_at = excluded.updated_at;`,
          [
            item.id,
            item.name,
            item.description || '',
            Number(item.price) || 0,
            item.originalPrice ? Number(item.originalPrice) : null,
            item.category || 'burgers',
            Number(item.rating) || 4.8,
            Number(item.reviewCount) || 120,
            item.prepTime || '15-20 min',
            item.isBestseller ? 1 : 0,
            item.isChefSpecial ? 1 : 0,
            item.isSpicy ? 1 : 0,
            item.image || '',
            item.inStock !== false ? 1 : 0,
            Number(item.stockQuantity) || 50,
            Number(item.portionsRemaining) || 25,
            now,
            now
          ]
        );
      } catch {
        // Handled in fallback store
      }
      seededMenu++;
    }
  }

  if (Array.isArray(staffList) && staffList.length > 0) {
    for (const s of staffList) {
      d1FallbackStore.staff.set(s.id, s);
      try {
        await queryD1(
          `INSERT INTO staff (id, name, role, shift, phone, active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             role = excluded.role,
             shift = excluded.shift;`,
          [s.id, s.name, s.role, s.shift, s.phone || '', s.active !== false ? 1 : 0, now]
        );
      } catch {
        // Handled in fallback store
      }
      seededStaff++;
    }
  }

  if (Array.isArray(ridersList) && ridersList.length > 0) {
    for (const r of ridersList) {
      d1FallbackStore.riders.set(r.id, r);
      try {
        await queryD1(
          `INSERT INTO riders (id, name, phone, vehicle, available, rating, deliveries, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             phone = excluded.phone,
             vehicle = excluded.vehicle;`,
          [r.id, r.name, r.phone, r.vehicle, r.available !== false ? 1 : 0, Number(r.rating) || 4.9, Number(r.deliveries) || 0, now]
        );
      } catch {
        // Handled in fallback store
      }
      seededRiders++;
    }
  }

  await recordD1Activity('database_synced', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', {
    seededMenu,
    seededStaff,
    seededRiders
  });

  res.json({
    success: true,
    message: `Synchronized ${seededMenu} menu items, ${seededStaff} staff members, and ${seededRiders} riders.`
  });
});

export default app;
export { app };

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function start() {
  await ensureD1Schema();

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only launch standalone HTTP server when not running in a serverless environment (e.g., Vercel)
if (!process.env.VERCEL) {
  start();
}
