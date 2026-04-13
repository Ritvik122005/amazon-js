import { getToken } from '../styles/scripts/auth.js';

const GUEST_KEY = 'cart';

function loadGuestCartFromStorage() {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export let cart = [];

let syncTimer = null;

function scheduleSyncToServer() {
  const token = getToken();
  if (!token) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const snapshot = cart.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      deliveryOptionId: String(i.deliveryOptionId || '1'),
    }));
    try {
      await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items: snapshot }),
      });
    } catch {
      /* offline or server down */
    }
  }, 400);
}

function saveToStorage() {
  localStorage.setItem(GUEST_KEY, JSON.stringify(cart));
  scheduleSyncToServer();
}

export async function initCart() {
  const token = getToken();
  if (token) {
    try {
      const r = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) {
        const data = await r.json();
        cart = Array.isArray(data.items) ? data.items : [];
        localStorage.setItem(GUEST_KEY, JSON.stringify(cart));
        return;
      }
    } catch {
      /* fall through to guest */
    }
  }
  cart = loadGuestCartFromStorage();
}

export function addToCart(productId) {
  let matchingItem;
  cart.forEach((cartItem) => {
    if (productId === cartItem.productId) {
      matchingItem = cartItem;
    }
  });
  if (matchingItem) {
    matchingItem.quantity += 1;
  } else {
    cart.push({
      productId,
      quantity: 1,
      deliveryOptionId: '1',
    });
  }
  saveToStorage();
}

export function removeFromCart(productId) {
  const newCart = [];
  cart.forEach((cartItem) => {
    if (cartItem.productId !== productId) {
      newCart.push(cartItem);
    }
  });
  cart = newCart;
  saveToStorage();
}

export function updateDeiliveryOption(productId, deliveryOptionId) {
  let matchingItem;
  cart.forEach((cartItem) => {
    if (productId === cartItem.productId) {
      matchingItem = cartItem;
    }
  });
  if (matchingItem) {
    matchingItem.deliveryOptionId = deliveryOptionId;
    saveToStorage();
  }
}

export function clearCart() {
  cart = [];
  saveToStorage();
}
