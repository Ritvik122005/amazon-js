const TOKEN_KEY = 'auth_token';
const EMAIL_KEY = 'auth_email';

const API_BASE =
  typeof window !== 'undefined' && /^55\d\d$/.test(window.location.port)
    ? 'http://localhost:3001'
    : '';

async function apiFetch(path, init) {
  try {
    return await fetch(`${API_BASE}${path}`, init);
  } catch (e) {
    const err = new Error('NETWORK_ERROR');
    err.cause = e;
    throw err;
  }
}

function mergeCartLines(serverItems, guestItems) {
  const map = new Map();
  for (const i of serverItems) {
    map.set(i.productId, {
      productId: i.productId,
      quantity: i.quantity,
      deliveryOptionId: String(i.deliveryOptionId || '1'),
    });
  }
  for (const g of guestItems) {
    const ex = map.get(g.productId);
    if (ex) ex.quantity += g.quantity;
    else {
      map.set(g.productId, {
        productId: g.productId,
        quantity: g.quantity,
        deliveryOptionId: String(g.deliveryOptionId || '1'),
      });
    }
  }
  return [...map.values()];
}

async function syncGuestCartAfterAuth(token) {
  let guest = [];
  try {
    guest = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!Array.isArray(guest)) guest = [];
  } catch {
    guest = [];
  }
  if (guest.length === 0) return;
  let serverItems = [];
  try {
    const r = await apiFetch('/api/cart', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      const data = await r.json();
      serverItems = Array.isArray(data.items) ? data.items : [];
    }
  } catch {
    /* ignore */
  }
  const merged = mergeCartLines(serverItems, guest);
  try {
    await apiFetch('/api/cart', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: merged }),
    });
  } catch {
    /* ignore */
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  if (!getToken()) return null;
  const email = localStorage.getItem(EMAIL_KEY);
  return email ? { email } : null;
}

export async function register(email, password) {
  const trimmed = (email || '').trim();
  if (!trimmed || !password) {
    return { success: false, message: 'Email and password are required' };
  }
  let r;
  try {
    r = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmed, password }),
    });
  } catch {
    return { success: false, message: 'Server is not reachable. Open the site at http://localhost:3001' };
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return { success: false, message: data.message || 'Registration failed' };
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(EMAIL_KEY, data.user.email);
  await syncGuestCartAfterAuth(data.token);
  return { success: true };
}

export async function login(email, password) {
  const trimmed = (email || '').trim();
  if (!trimmed || !password) {
    return { success: false, message: 'Email and password are required' };
  }
  let r;
  try {
    r = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmed, password }),
    });
  } catch {
    return { success: false, message: 'Server is not reachable. Open the site at http://localhost:3001' };
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return { success: false, message: data.message || 'Sign in failed' };
  }
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(EMAIL_KEY, data.user.email);
  await syncGuestCartAfterAuth(data.token);
  return { success: true };
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export async function fetchOrders() {
  const token = getToken();
  if (!token) return { ok: false, message: 'Sign in required', orders: [] };
  const r = await apiFetch('/api/orders', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, message: data.message || 'Failed to load orders', orders: [] };
  return { ok: true, orders: data.orders || [] };
}

export async function placeOrder() {
  const token = getToken();
  if (!token) return { ok: false, message: 'Sign in to place an order' };
  const r = await apiFetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, message: data.message || 'Could not place order' };
  return { ok: true, order: data.order };
}
