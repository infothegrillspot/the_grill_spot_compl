import { User, Order, MenuItem, StaffMember, RiderMember, OrderStatus } from '../types';

export interface D1StatusResponse {
  success: boolean;
  connected: boolean;
  provider: string;
  accountId: string;
  databaseId: string;
  latencyMs: number;
  tables: {
    users: number;
    orders: number;
    menuItems: number;
    staff: number;
    riders: number;
    activityLogs: number;
  };
  recentLogs: Array<{
    id: string;
    event_type: string;
    actor_email: string;
    actor_name: string;
    details: any;
    created_at: string;
  }>;
}

// 1. Sync User to Cloudflare D1
export async function d1SyncUser(user: Partial<User>) {
  try {
    const res = await fetch('/api/d1/users/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    return await res.json();
  } catch (err) {
    console.error('Error syncing user to Cloudflare D1:', err);
    return { success: false, error: String(err) };
  }
}

// 2. Save Order to Cloudflare D1
export async function d1SaveOrder(order: Order) {
  try {
    const res = await fetch('/api/d1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: order.id,
        customerName: order.customerName,
        customerEmail: (order as any).customerEmail || (order as any).email || null,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        notes: order.specialInstructions || null,
        estimatedTime: order.estimatedDeliveryTime || null,
        promoCode: (order as any).promoCode || null,
        riderName: order.riderName || null
      })
    });
    return await res.json();
  } catch (err) {
    console.error('Error saving order to Cloudflare D1:', err);
    return { success: false, error: String(err) };
  }
}

// 3. Update Order Status in Cloudflare D1
export async function d1UpdateOrderStatus(
  orderId: string,
  status: OrderStatus,
  riderName?: string,
  actorEmail: string = 'info.thegrillspot@gmail.com',
  actorName: string = 'Pitmaster Admin'
) {
  try {
    const res = await fetch(`/api/d1/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, riderName, actorEmail, actorName })
    });
    return await res.json();
  } catch (err) {
    console.error('Error updating order status in Cloudflare D1:', err);
    return { success: false, error: String(err) };
  }
}

// 4. Save Menu Item to Cloudflare D1
export async function d1SaveMenuItem(item: Partial<MenuItem>, actorEmail: string = 'info.thegrillspot@gmail.com') {
  try {
    const res = await fetch('/api/d1/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, actorEmail })
    });
    return await res.json();
  } catch (err) {
    console.error('Error saving menu item to Cloudflare D1:', err);
    return { success: false, error: String(err) };
  }
}

// 5. Delete Menu Item from Cloudflare D1
export async function d1DeleteMenuItem(id: string) {
  try {
    const res = await fetch(`/api/d1/menu/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    console.error('Error deleting menu item from Cloudflare D1:', err);
    return { success: false, error: String(err) };
  }
}

// 6. Save Staff Member to Cloudflare D1
export async function d1SaveStaff(staff: Partial<StaffMember>) {
  try {
    const res = await fetch('/api/d1/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff)
    });
    return await res.json();
  } catch (err) {
    console.error('Error saving staff to Cloudflare D1:', err);
    return { success: false, error: String(err) };
  }
}

// 7. Delete Staff Member from Cloudflare D1
export async function d1DeleteStaff(id: string) {
  try {
    const res = await fetch(`/api/d1/staff/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    console.error('Error deleting staff from Cloudflare D1:', err);
    return { success: false, error: String(err) };
  }
}

// 8. Save Rider to Cloudflare D1
export async function d1SaveRider(rider: Partial<RiderMember>) {
  try {
    const res = await fetch('/api/d1/riders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rider)
    });
    return await res.json();
  } catch (err) {
    console.error('Error saving rider to Cloudflare D1:', err);
    return { success: false, error: String(err) };
  }
}

// 9. Delete Rider from Cloudflare D1
export async function d1DeleteRider(id: string) {
  try {
    const res = await fetch(`/api/d1/riders/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await res.json();
  } catch (err) {
    console.error('Error deleting rider from Cloudflare D1:', err);
    return { success: false, error: String(err) };
  }
}

// 10. Record Activity Log in Cloudflare D1 ("all things that happen in this website")
export async function d1LogActivity(
  eventType: string,
  actorEmail?: string,
  actorName?: string,
  details?: Record<string, any>
) {
  try {
    await fetch('/api/d1/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        actorEmail: actorEmail || 'guest',
        actorName: actorName || 'Guest User',
        details
      })
    });
  } catch (err) {
    console.error('Error recording activity to Cloudflare D1:', err);
  }
}

// 10b. Fetch Activity Logs from Cloudflare D1
export async function d1GetActivityLogs(limit: number = 50) {
  try {
    const res = await fetch(`/api/d1/activity?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.error('Error fetching activity logs from Cloudflare D1:', err);
    return [];
  }
}

// 11. Fetch Cloudflare D1 Status & Diagnostics
export async function d1GetStatus(): Promise<D1StatusResponse | null> {
  try {
    const res = await fetch('/api/d1/status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching Cloudflare D1 status:', err);
    return null;
  }
}

// 12. Sync All Initial Data to Cloudflare D1
export async function d1SyncAllDefaults(payload: {
  menuItems: any[];
  staffList: any[];
  ridersList: any[];
}) {
  try {
    const res = await fetch('/api/d1/seed-defaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('Error syncing all defaults to Cloudflare D1:', err);
    return { success: false, error: String(err) };
  }
}
