// CART DATA
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentSpot = localStorage.getItem('currentSpot') || 'bufet';
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
    transactionType: 'bufet',
    categories: [
      {
        name: 'Drinks',
        items: [
          { name: 'Kofola 5dcl', price: 2 },
          { name: 'Kofola 3dcl', price: 1.5 },
          { name: 'Vinea 3dcl', price: 1.5 },
          { name: 'Minerálka 3dcl', price: 1 },
          { name: 'Džús 2dcl', price: 1.5 },
          { name: 'Káva', price: 2 },
        ],
      },
      {
        name: 'Alcohol',
        items: [
          { name: 'Pivo 5dcl', price: 2 },
          { name: 'Pivo 3dcl', price: 1.5 },
          { name: 'Radler 5dcl', price: 2 },
          { name: 'Radler 3dcl', price: 1.5 },
          { name: 'Prosecco 2dcl', price: 5 },
          { name: 'Aperol Spritz 3dcl', price: 7 },
          { name: 'Gin Tonic', price: 4 },
          { name: 'Cuba Libre', price: 4 },
        ],
      },
      {
        name: 'Snacks',
        items: [
          { name: 'Müsli tyčinka', price: 1.5 },
          { name: 'Oriešková tyčinka', price: 1.5 },
          { name: 'Horalka', price: 1.5 },
          { name: 'Snickers', price: 2 },
          { name: 'Žížaly', price: 2 },
          { name: 'Soletky', price: 1 },
          { name: 'Čipsy', price: 1.5 },
          { name: 'Chrumky', price: 1.5 },
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
}

// CLEAR CART
function clearCart() {
  cart = [];
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
function handleDoneClick() {
  if (cart.length === 0) {
    return;
  }

  if (currentSpot === 'tickets') {
    openPaymentEmailPrompt();
  } else {
    createPayment(null);
  }
}

// OPEN PAYMENT MODAL (ASKS FOR OPTIONAL EMAIL BEFORE CREATING THE PAYMENT)
function openPaymentEmailPrompt() {
  stopPaymentPolling();

  document.getElementById("payment-email-input").value = "";
  document.getElementById("payment-email").style.display = "flex";
  document.getElementById("payment-loading").style.display = "none";
  document.getElementById("payment-result").style.display = "none";
  document.getElementById("payment-modal").style.display = "flex";
}

// EMAIL STEP CONFIRMED, CREATE THE PAYMENT
function submitPaymentEmail() {
  const email = document.getElementById("payment-email-input").value.trim();
  createPayment(email);
}

async function createPayment(email) {
  stopPaymentPolling();

  document.getElementById("payment-email").style.display = "none";
  document.getElementById("payment-loading").style.display = "flex";
  document.getElementById("payment-result").style.display = "none";
  document.getElementById("payment-modal").style.display = "flex";

  try {
    const body = {
      transactionType: currentSpot,
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };
    if (email) {
      body.email = email;
    }

    const response = await fetch(`${API_BASE_URL}/api/payment/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

// CLOSE PAYMENT MODAL
function closePaymentModal() {
  stopPaymentPolling();
  document.getElementById("payment-email").style.display = "none";
  document.getElementById("payment-modal").style.display = "none";
}

// "ZAVRIEŤ" BUTTON: CLOSE THE MODAL AND CLEAR THE CART (PAYMENT REVIEW IS DONE)
function finishPaymentModal() {
  clearCart();
  closePaymentModal();
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
  document.getElementById("payment-cancel-btn").style.display = "flex";

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
  const variableSymbol = paymentVariableSymbol;
  if (!variableSymbol) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/payment/check?vs=${encodeURIComponent(variableSymbol)}`);
    if (!response.ok) {
      return;
    }

    const result = await response.json();
    if (result.found && paymentVariableSymbol === variableSymbol) {
      showPaymentConfirmed();
    }
  } catch (err) {
    // ignore network errors, keep polling / let the user retry
  }
}

// CANCEL PAYMENT (TRASH ICON): DELETE THE RECORD ON THE SERVER AND CLOSE THE MODAL
async function cancelPayment() {
  const variableSymbol = paymentVariableSymbol;
  stopPaymentPolling();
  paymentVariableSymbol = null;

  if (variableSymbol) {
    try {
      await fetch(`${API_BASE_URL}/api/payment?vs=${encodeURIComponent(variableSymbol)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      // ignore network errors; payment record cleanup is best-effort
    }
  }

  closePaymentModal();
}

// SHOW BIG GREEN CHECK
function showPaymentConfirmed() {
  stopPaymentPolling();
  clearCart();

  document.getElementById("payment-qr").style.display = "none";
  document.getElementById("payment-checking").style.display = "none";
  document.getElementById("payment-failed").style.display = "none";
  document.getElementById("payment-success").style.display = "flex";
  document.getElementById("payment-cancel-btn").style.display = "none";
}

// SHOW "PAYMENT DIDN'T GO THROUGH" MESSAGE WITH MANUAL RETRY
function showPaymentFailed() {
  stopPaymentPolling();

  document.getElementById("payment-checking").style.display = "none";
  document.getElementById("payment-failed").style.display = "flex";
  document.getElementById("payment-cancel-btn").style.display = "none";
}
