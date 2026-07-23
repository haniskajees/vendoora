// CART DATA
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let total = 0;
let currentSpot = localStorage.getItem('currentSpot') || 'buffet';
const saleItems = [
  {
    name: 'Vstup',
    transactionType: 'tickets',
    categories: [
      {
        name: 'Entry',
        items: [
          { name: 'Dospelý (15+)', price: 20 },
          { name: 'Dieťa (do 15 r.)', price: 10 },
        ],
      },
    ],
  },
  {
    name: 'Bufet',
    transactionType: 'buffet',
    categories: [
      {
        name: 'Drinks',
        items: [
          { name: 'Kofola 0,5l', price: 1.5 },
          { name: 'Kofola 0,3l', price: 1.5 },
          { name: 'Vinea 0,5l', price: 1.5 },
          { name: 'Vinea 0,3l', price: 1.5 },
          { name: 'Minerálka', price: 1 },
          { name: 'Coca Cola', price: 1 },
          { name: 'Sprite', price: 1 },
          { name: 'Tonic', price: 1 },
          { name: 'Džús', price: 1 },
          { name: 'Káva', price: 1 },
        ],
      },
      {
        name: 'Alcohol',
        items: [
          { name: 'Pivo 0,5l', price: 1 },
          { name: 'Pivo 0,3l', price: 1 },
          { name: 'Radler 0,5l', price: 1 },
          { name: 'Radler 0,3l', price: 1 },
          { name: 'Víno', price: 1.5 },
          { name: 'Cuba Libre', price: 1 },
          { name: 'Gin Tonic', price: 1.8 },
        ],
      },
      {
        name: 'Snacks',
        items: [
          { name: 'Müsli tyčinka', price: 1 },
          { name: 'Oriešková tyčinka', price: 1 },
          { name: 'Horalka', price: 1.2 },
          { name: 'Snickers', price: 1.5 },
          { name: 'Žížaly', price: 1.5 },
          { name: 'Soletky', price: 1.1 },
          { name: 'Čipsy', price: 1.3 },
          { name: 'Chrumky', price: 1.3 },
        ],
      },
    ],
  },
  {
    name: 'Gastro',
    transactionType: 'food',
    categories: [
      {
        name: 'Food',
        items: [
          { name: 'Gulášová', price: 4.5 },
          { name: 'Rezeň so šalátom', price: 8 },
          { name: 'Hranolky s trhaným mäsom', price: 8 },
        ],
      },
    ],
  },
];

// GET CURRENTLY SELECTED SALE ITEM (SPOT)
function getCurrentSaleItem() {
  return saleItems.find(saleItem => saleItem.transactionType === currentSpot) || saleItems[0];
}

// UPDATE HEADER TEXT
function updateHeader() {
  document.getElementById("app-header").textContent = getCurrentSaleItem().name + " - Čaj o 41vej";
}

// OPEN SPOT PICKER
function openSpotPicker() {
  const optionsContainer = document.getElementById("spot-options");
  optionsContainer.innerHTML = "";

  saleItems.forEach(saleItem => {
    const option = document.createElement("div");
    option.className = "spot-option";
    option.textContent = saleItem.name;
    option.onclick = () => selectSpot(saleItem.transactionType);
    optionsContainer.appendChild(option);
  });

  document.getElementById("spot-modal").style.display = "flex";
}

// CLOSE SPOT PICKER
function closeSpotPicker() {
  document.getElementById("spot-modal").style.display = "none";
}

// SELECT SPOT
function selectSpot(transactionType) {
  currentSpot = transactionType;
  localStorage.setItem('currentSpot', transactionType);
  closeSpotPicker();
  renderCategories();
  updateHeader();
  clearCart();
}

// RENDER CATEGORIES + ITEMS
function renderCategories() {
  const container = document.getElementById("categories-container");
  container.innerHTML = "";

  const categories = getCurrentSaleItem().categories;

  categories.forEach(category => {
    const heading = document.createElement("h2");
    heading.textContent = category.name.toUpperCase();
    container.appendChild(heading);

    const itemsDiv = document.createElement("div");
    itemsDiv.className = "items";

    category.items.forEach(item => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "item";
      itemDiv.onclick = () => addItem(item.name, item.price);

      const nameSpan = document.createElement("div");
      nameSpan.textContent = item.name;

      const priceSpan = document.createElement("div");
      priceSpan.className = "item-price";
      priceSpan.textContent = `${item.price.toFixed(2)}€`;

      itemDiv.appendChild(nameSpan);
      itemDiv.appendChild(priceSpan);
      itemsDiv.appendChild(itemDiv);
    });

    container.appendChild(itemsDiv);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderCategories();
  updateHeader();
  renderCart();
  updateTotal();
});

// SAVE CART
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// ADD ITEM
function addItem(name, price) {
  const existingItem = cart.find(item => item.name === name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      name: name,
      price: price,
      quantity: 1
    });
  }

  renderCart();
  updateTotal();
  saveCart();
}

//UPDATE TOTAL
function updateTotal() {
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
  });

  document.getElementById("doneBtn").textContent = `PAY ${total.toFixed(2)} EUR`;
}

//RENDER CART
function renderCart() {
  const cartContainer = document.getElementById("cart-items");
  cartContainer.innerHTML = "";

  const grouped = {};

  // 🔹 group items
  cart.forEach((item, index) => {
    const btn = document.createElement("button");
    btn.className = "cart-item-btn";
  
    btn.innerText = `${item.quantity}x ${item.name}`;
  
    btn.onclick = () => {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        cart.splice(index, 1);
      }
      renderCart();
      updateTotal();
      saveCart();
    };

    cartContainer.appendChild(btn);
  });

  // 🔹 display grouped items
  Object.keys(grouped).forEach(name => {
    const div = document.createElement("div");
    div.onclick = () => {
      // remove ONE instance when clicked
      const index = cart.findIndex(item => item.name === name);
      if (index !== -1) {
        cart.splice(index, 1);
        renderCart();
        updateTotal();
      }
    };

    cartContainer.appendChild(div);
  });
}

// CLEAR CART
function clearCart() {
  cart = [];
  total = 0;
  renderCart();
  updateTotal();
  saveCart();
}

// PAYMENT HELPER VARS
const API_BASE_URL = '';

const PAYMENT_CHECK_INTERVAL_MS = 5000;
const PAYMENT_CHECK_TIMEOUT_MS = 60000;

let paymentCheckIntervalId = null;
let paymentCheckTimeoutId = null;
let paymentVariableSymbol = null;

// PAY BUTTON
async function handleDoneClick() {
  if (cart.length === 0) {
    return;
  }

  openPaymentModal();

  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionType: currentSpot,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error('Payment registration failed');
    }

    const payment = await response.json();
    showPaymentResult(payment);
  } catch (err) {
    closePaymentModal();
    alert('Platbu sa nepodarilo vytvoriť. Skús to prosím znova.');
  }
}

// OPEN PAYMENT MODAL (SHOWS PROGRESS INDICATOR)
function openPaymentModal() {
  stopPaymentPolling();

  document.getElementById("payment-loading").style.display = "flex";
  document.getElementById("payment-result").style.display = "none";
  document.getElementById("payment-modal").style.display = "flex";
}

// CLOSE PAYMENT MODAL
function closePaymentModal() {
  stopPaymentPolling();
  document.getElementById("payment-modal").style.display = "none";
}

// SHOW PAYMENT RESULT (AMOUNT, CURRENCY, QR CODE)
function showPaymentResult(payment) {
  document.getElementById("payment-amount").textContent = Number(payment.amount).toFixed(2);
  document.getElementById("payment-currency").textContent = payment.currency;

  const qr = qrcode(0, 'M');
  qr.addData(payment.paymeLink);
  qr.make();
  document.getElementById("payment-qr").innerHTML = qr.createImgTag(6, 8, 'QR platba');
  document.getElementById("payment-qr").style.display = "block";

  document.getElementById("payment-success").style.display = "none";
  document.getElementById("payment-checking").style.display = "flex";
  document.getElementById("payment-failed").style.display = "none";

  document.getElementById("payment-loading").style.display = "none";
  document.getElementById("payment-result").style.display = "flex";

  startPaymentPolling(payment.variableSymbol);
}

// START POLLING /api/payment/check UNTIL CONFIRMED OR TIMED OUT
function startPaymentPolling(variableSymbol) {
  stopPaymentPolling();
  paymentVariableSymbol = variableSymbol;

  paymentCheckIntervalId = setInterval(() => checkPaymentNow(), PAYMENT_CHECK_INTERVAL_MS);
  paymentCheckTimeoutId = setTimeout(showPaymentFailed, PAYMENT_CHECK_TIMEOUT_MS);
}

// STOP POLLING (MODAL CLOSED / REOPENED / PAYMENT CONFIRMED)
function stopPaymentPolling() {
  if (paymentCheckIntervalId !== null) {
    clearInterval(paymentCheckIntervalId);
    paymentCheckIntervalId = null;
  }
  if (paymentCheckTimeoutId !== null) {
    clearTimeout(paymentCheckTimeoutId);
    paymentCheckTimeoutId = null;
  }
}

// MANUALLY TRIGGER A CHECK (POLLING TICK OR "SKONTROLOVAŤ ZNOVA" BUTTON)
async function checkPaymentNow() {
  if (!paymentVariableSymbol) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/check?vs=${encodeURIComponent(paymentVariableSymbol)}`);
    if (!response.ok) {
      return;
    }

    const result = await response.json();
    if (result.found) {
      showPaymentConfirmed();
    }
  } catch (err) {
    // ignore network errors, keep polling / let the user retry
  }
}

// SHOW BIG GREEN CHECK
function showPaymentConfirmed() {
  stopPaymentPolling();

  document.getElementById("payment-qr").style.display = "none";
  document.getElementById("payment-checking").style.display = "none";
  document.getElementById("payment-failed").style.display = "none";
  document.getElementById("payment-success").style.display = "flex";
}

// SHOW "PAYMENT DIDN'T GO THROUGH" MESSAGE WITH MANUAL RETRY
function showPaymentFailed() {
  stopPaymentPolling();

  document.getElementById("payment-checking").style.display = "none";
  document.getElementById("payment-failed").style.display = "flex";
}
