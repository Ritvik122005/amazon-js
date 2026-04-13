import { cart, clearCart, initCart } from '../../../data/cart.js';
import { getProduct } from '../../../data/products.js';
import { getDeliveryOption } from '../../../data/deliveryOption.js';
import { getToken, placeOrder } from '../auth.js';

export function renderPaymentSummary() {
  let productPriceCents = 0;
  let shippingPriceCents = 0;

  cart.forEach((cartItem) => {
    const product = getProduct(cartItem.productId);
    if (!product) return;
    productPriceCents += product.priceCents * cartItem.quantity;
    const deliveryOption = getDeliveryOption(cartItem.deliveryOptionId);
    shippingPriceCents += deliveryOption.priceCents;
  });

  const totalBeforeTaxCents = productPriceCents + shippingPriceCents;
  const taxCents = totalBeforeTaxCents * 0.1;
  const totalCents = totalBeforeTaxCents + taxCents;

  const itemCount = cart.reduce((n, i) => n + i.quantity, 0);

  const paymentSummaryHTML = `

<div class="payment-summary-title">
            Order Summary
          </div>

          <div class="payment-summary-row">
            <div>Items (${itemCount}):</div>
            <div class="payment-summary-money">${(productPriceCents / 100).toFixed(2)}</div>
          </div>

          <div class="payment-summary-row">
            <div>Shipping &amp; handling:</div>
            <div class="payment-summary-money">${(shippingPriceCents / 100).toFixed(2)}</div>
          </div>

          <div class="payment-summary-row subtotal-row">
            <div>Total before tax:</div>
            <div class="payment-summary-money">${(totalBeforeTaxCents / 100).toFixed(2)}</div>
          </div>

          <div class="payment-summary-row">
            <div>Estimated tax (10%):</div>
            <div class="payment-summary-money">${(taxCents / 100).toFixed(2)}</div>
          </div>

          <div class="payment-summary-row total-row">
            <div>Order total:</div>
            <div class="payment-summary-money">${(totalCents / 100).toFixed(2)}</div>
          </div>

          <p class="js-place-order-message" style="color:#c00;font-size:14px;"></p>
          <button type="button" class="place-order-button button-primary js-place-order">
            Place your order
          </button>
`;
  document.querySelector('.js-payment-summary').innerHTML = paymentSummaryHTML;

  const msgEl = document.querySelector('.js-place-order-message');
  document.querySelector('.js-place-order')?.addEventListener('click', async () => {
    if (msgEl) msgEl.textContent = '';
    if (cart.length === 0) {
      if (msgEl) msgEl.textContent = 'Your cart is empty.';
      return;
    }
    if (!getToken()) {
      if (window.confirm('Sign in to place your order. Go to sign in?')) {
        window.location.href = 'login.html';
      }
      return;
    }
    const res = await placeOrder();
    if (!res.ok) {
      if (msgEl) msgEl.textContent = res.message;
      return;
    }
    clearCart();
    await initCart();
    window.location.href = 'orders.html';
  });
}
