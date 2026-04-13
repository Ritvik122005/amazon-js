import { initCart } from '../../data/cart.js';
import { renderOrderSummary } from './checkout/orderSummary.js';
import { renderPaymentSummary } from './checkout/paymentsummary.js';

await initCart();
renderOrderSummary();
renderPaymentSummary();