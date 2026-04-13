import dayjs from 'https://unpkg.com/supersimpledev@8.5.0/dayjs/esm/index.js';
import { fetchOrders, getCurrentUser, logout } from './auth.js';
import { getProduct } from '../../data/products.js';
import { getDeliveryOption } from '../../data/deliveryOption.js';

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function renderHeaderAuth() {
  const el = document.querySelector('.js-header-auth');
  if (!el) return;
  const user = getCurrentUser();
  if (user) {
    el.innerHTML = `
      <span class="returns-text">${escapeHtml(user.email)}</span>
      <span class="orders-text"><a href="#" class="js-logout link-primary">Log out</a></span>
    `;
    el.querySelector('.js-logout')?.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
      window.location.reload();
    });
  } else {
    el.innerHTML = '<a href="login.html" class="header-link">Sign in</a>';
  }
}

function deliveryDateLabel(orderPlacedIso, deliveryOptionId) {
  const opt = getDeliveryOption(deliveryOptionId);
  const days = Number(opt.deliveryDays) || 0;
  const dateStr = dayjs(orderPlacedIso)
    .add(days, 'days')
    .format('dddd, MMMM D');
  return dateStr;
}

function orderItemsHtml(order) {
  let html = '';
  for (const item of order.items) {
    const p = getProduct(item.productId);
    if (!p) continue;
    const dateStr = deliveryDateLabel(order.placedAt, item.deliveryOptionId);
    html += `
            <div class="product-image-container">
              <img src="${escapeHtml(p.image)}" alt="">
            </div>

            <div class="product-details">
              <div class="product-name">
                ${escapeHtml(p.name)}
              </div>
              <div class="product-delivery-date">
                Arriving on: ${dateStr}
              </div>
              <div class="product-quantity">
                Quantity: ${item.quantity}
              </div>
            </div>

            <div class="product-actions">
              <a href="tracking.html?orderId=${encodeURIComponent(order.id)}">
                <button type="button" class="track-package-button button-secondary">
                  Track package
                </button>
              </a>
            </div>
`;
  }
  return html;
}

renderHeaderAuth();

const grid = document.querySelector('.js-orders-grid');
if (grid) {
  (async () => {
    if (!getCurrentUser()) {
      grid.innerHTML =
        '<p>Sign in to see your orders.</p><p><a href="login.html">Sign in</a></p>';
      return;
    }
    const { ok, orders } = await fetchOrders();
    if (!ok) {
      grid.innerHTML = '<p>Could not load orders. Try signing in again.</p>';
      return;
    }
    if (!orders.length) {
      grid.innerHTML =
        '<p>No orders yet.</p><p><a href="amazon.html">Continue shopping</a></p>';
      return;
    }
    let html = '';
    for (const order of orders) {
      const placed = dayjs(order.placedAt).format('MMMM D');
      const total = ((order.totals && order.totals.totalCents) ? order.totals.totalCents : 0) / 100;
      html += `
        <div class="order-container">
          <div class="order-header">
            <div class="order-header-left-section">
              <div class="order-date">
                <div class="order-header-label">Order Placed:</div>
                <div>${placed}</div>
              </div>
              <div class="order-total">
                <div class="order-header-label">Total:</div>
                <div>$${total.toFixed(2)}</div>
              </div>
            </div>

            <div class="order-header-right-section">
              <div class="order-header-label">Order ID:</div>
              <div>${escapeHtml(order.id)}</div>
            </div>
          </div>

          <div class="order-details-grid">
            ${orderItemsHtml(order)}
          </div>
        </div>`;
    }
    grid.innerHTML = html;
  })();
}

const cartQtyEl = document.querySelector('.js-cart-quantity');
if (cartQtyEl) {
  try {
    const raw = localStorage.getItem('cart');
    const c = raw ? JSON.parse(raw) : [];
    const n = Array.isArray(c) ? c.reduce((s, i) => s + (i.quantity || 0), 0) : 0;
    cartQtyEl.textContent = String(n);
  } catch {
    cartQtyEl.textContent = '0';
  }
}
