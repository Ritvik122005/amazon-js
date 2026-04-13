import { cart, addToCart, initCart } from '../../data/cart.js';
import { products } from '../../data/products.js';
import { getCurrentUser, logout } from './auth.js';

await initCart();

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

renderHeaderAuth();

let productsHTML = '';

products.forEach((product) => {
  productsHTML +=
`<div class="product-container">
          <div class="product-image-container">
            <img class="product-image"
              src="${product.image}">
          </div>

          <div class="product-name limit-text-to-2-lines">
            ${product.name}
          </div>

          <div class="product-rating-container">
            <img class="product-rating-stars"
              src="images/ratings/rating-${product.rating.stars * 10}.png">
            <div class="product-rating-count link-primary">
              ${product.rating.count}
            </div>
          </div>

          <div class="product-price">
            $${(product.priceCents / 100).toFixed(2)}
          </div>

          <div class="product-quantity-container">
            <select>
              <option selected value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
            </select>
          </div>

          <div class="product-spacer"></div>

          <div class="added-to-cart">
            <img src="images/icons/checkmark.png">
            Added
          </div>

          <button class="add-to-cart-button button-primary js-add-to-cart"
          data-product-id="${product.id}">
            Add to Cart
          </button>
        </div>
`;
});

document.querySelector('.js-product-grid').innerHTML = productsHTML;

function updatCartQuantity() {
  let cartQuantity = 0;
  cart.forEach((cartItem) => {
    cartQuantity += cartItem.quantity;
  });
  const el = document.querySelector('.js-cart-quantity');
  if (el) el.innerHTML = cartQuantity;
}

updatCartQuantity();

document.querySelectorAll('.js-add-to-cart').forEach((button) => {
  button.addEventListener('click', () => {
    const productId = button.dataset.productId;
    addToCart(productId);
    updatCartQuantity();
  });
});
