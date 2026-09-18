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

// Log an event to D1 activity_logs table
export async function recordD1Activity(
  eventType: string,
  actorEmail: string = 'system',
  actorName: string = 'System',
  details: Record<string, any> = {}
) {
  try {
    const id = 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    await queryD1(
      'INSERT INTO activity_logs (id, event_type, actor_email, actor_name, details, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, eventType, actorEmail, actorName, JSON.stringify(details), now]
    );
  } catch (err) {
    console.error('Failed to write activity log to D1:', err);
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
    console.error('Cloudflare D1 Schema check warning:', e.message);
  }
}

// ==========================================
// API ROUTES: Cloudflare D1 SQL Endpoints
// ==========================================

// 1. Health & Database Status
app.get('/api/d1/status', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
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
        details: typeof log.details === 'string' ? safeParseJson(log.details) : log.details
      }))
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      connected: false,
      error: err.message
    });
  }
});

// Helper safe JSON parse
function safeParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

// 2. Customer & User Data
app.post('/api/d1/users/sync', async (req: Request, res: Response) => {
  try {
    const { id, name, email, phone, address, secondaryAddress, role } = req.body;
    if (!id || !email) {
      return res.status(400).json({ success: false, error: 'User id and email are required' });
    }

    const now = new Date().toISOString();
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

    await recordD1Activity('user_sync', email, name || 'Customer', {
      userId: id,
      action: 'Profile synchronized with Cloudflare D1 SQL'
    });

    res.json({ success: true, message: 'User profile saved to Cloudflare D1' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/d1/users', async (_req: Request, res: Response) => {
  try {
    const users = await queryD1('SELECT * FROM users ORDER BY created_at DESC');
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Orders Management
app.post('/api/d1/orders', async (req: Request, res: Response) => {
  try {
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

    if (!id || !customerEmail) {
      return res.status(400).json({ success: false, error: 'Order ID and customer email are required' });
    }

    const now = new Date().toISOString();
    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);

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
        customerEmail,
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

    await recordD1Activity('order_placed', customerEmail, customerName || 'Customer', {
      orderId: id,
      total,
      status: status || 'confirmed',
      itemCount: Array.isArray(items) ? items.length : 1
    });

    res.json({ success: true, orderId: id, message: 'Order saved to Cloudflare D1 SQL' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/d1/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, riderName, actorEmail, actorName } = req.body;
    const now = new Date().toISOString();

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

    await recordD1Activity('order_status_update', actorEmail || 'admin', actorName || 'Pitmaster Admin', {
      orderId: id,
      newStatus: status,
      riderName: riderName || undefined
    });

    res.json({ success: true, message: `Order ${id} status updated to ${status} in Cloudflare D1` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/d1/orders', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    let orders: any[];
    if (email) {
      orders = await queryD1('SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC', [email]);
    } else {
      orders = await queryD1('SELECT * FROM orders ORDER BY created_at DESC');
    }

    const parsed = orders.map((o: any) => ({
      ...o,
      items: typeof o.items === 'string' ? safeParseJson(o.items) : o.items
    }));

    res.json({ success: true, orders: parsed });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
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
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/d1/menu', async (req: Request, res: Response) => {
  try {
    const item = req.body;
    const now = new Date().toISOString();
    const id = item.id || 'm_' + Date.now();

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

    await recordD1Activity('menu_item_saved', req.body.actorEmail || 'admin', 'Admin', {
      itemId: id,
      name: item.name,
      price: item.price
    });

    res.json({ success: true, id, message: 'Menu item saved in Cloudflare D1 SQL' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/d1/menu/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await queryD1('DELETE FROM menu_items WHERE id = ?', [id]);
    await recordD1Activity('menu_item_deleted', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', { itemId: id });
    res.json({ success: true, message: `Menu item ${id} deleted from Cloudflare D1` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/d1/staff', async (req: Request, res: Response) => {
  try {
    const s = req.body;
    const id = s.id || 'st_' + Date.now();
    const now = new Date().toISOString();

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

    await recordD1Activity('staff_updated', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', { staffId: id, name: s.name });
    res.json({ success: true, id, message: 'Staff saved in Cloudflare D1 SQL' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/d1/staff/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await queryD1('DELETE FROM staff WHERE id = ?', [id]);
    await recordD1Activity('staff_deleted', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', { staffId: id });
    res.json({ success: true, message: `Staff ${id} deleted from Cloudflare D1` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/d1/riders', async (req: Request, res: Response) => {
  try {
    const r = req.body;
    const id = r.id || 'rd_' + Date.now();
    const now = new Date().toISOString();

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

    await recordD1Activity('rider_updated', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', { riderId: id, name: r.name });
    res.json({ success: true, id, message: 'Rider saved in Cloudflare D1 SQL' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/d1/riders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await queryD1('DELETE FROM riders WHERE id = ?', [id]);
    await recordD1Activity('rider_deleted', 'info.thegrillspot@gmail.com', 'Pitmaster Admin', { riderId: id });
    res.json({ success: true, message: `Rider ${id} deleted from Cloudflare D1` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. General Activity Logging Endpoint ("all things that happen in this website")
app.post('/api/d1/activity', async (req: Request, res: Response) => {
  try {
    const { eventType, actorEmail, actorName, details } = req.body;
    await recordD1Activity(eventType || 'user_event', actorEmail || 'guest', actorName || 'Guest Visitor', details || {});
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/d1/activity', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const logs = await queryD1(
      'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    res.json({
      success: true,
      logs: logs.map((l: any) => ({
        ...l,
        details: typeof l.details === 'string' ? safeParseJson(l.details) : l.details
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Seed/Sync All Existing Data to Cloudflare D1
app.post('/api/d1/seed-defaults', async (req: Request, res: Response) => {
  try {
    const { menuItems, staffList, ridersList } = req.body;
    let seededMenu = 0;
    let seededStaff = 0;
    let seededRiders = 0;

    const now = new Date().toISOString();

    if (Array.isArray(menuItems) && menuItems.length > 0) {
      for (const item of menuItems) {
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
        seededMenu++;
      }
    }

    if (Array.isArray(staffList) && staffList.length > 0) {
      for (const s of staffList) {
        await queryD1(
          `INSERT INTO staff (id, name, role, shift, phone, active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             role = excluded.role,
             shift = excluded.shift;`,
          [s.id, s.name, s.role, s.shift, s.phone || '', s.active !== false ? 1 : 0, now]
        );
        seededStaff++;
      }
    }

    if (Array.isArray(ridersList) && ridersList.length > 0) {
      for (const r of ridersList) {
        await queryD1(
          `INSERT INTO riders (id, name, phone, vehicle, available, rating, deliveries, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             phone = excluded.phone,
             vehicle = excluded.vehicle;`,
          [r.id, r.name, r.phone, r.vehicle, r.available !== false ? 1 : 0, Number(r.rating) || 4.9, Number(r.deliveries) || 0, now]
        );
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
      message: `Successfully synchronized ${seededMenu} menu items, ${seededStaff} staff members, and ${seededRiders} riders into Cloudflare D1 SQL.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
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
