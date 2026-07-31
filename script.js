// CART DATA
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentSpot = localStorage.getItem('currentSpot') || 'bufet';
let saleItems = [];

// LOAD SALE ITEMS (SHARED WITH ADMIN STATS VIA web/items.json)
async function loadSaleItems() {
  const response = await fetch('../items.json');
  saleItems = await response.json();
}

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

document.addEventListener("DOMContentLoaded", async () => {
  await loadSaleItems();
  renderCategories();
  updateHeader();
  renderCart();
  updateTotal();
  document.getElementById("payment-total-input").addEventListener("input", updateCashButton);
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

//CALCULATE CART TOTAL
function getCartTotal() {
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;
  });

  return total;
}

//UPDATE TOTAL
function updateTotal() {
  document.getElementById("doneBtn").textContent = `PAY ${getCartTotal().toFixed(2)} EUR`;
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

const PAYMENT_CHECK_INTERVAL_MS = 1000;
const PAYMENT_CHECK_TIMEOUT_MS = 60000;

let paymentCheckPending = false;
let paymentCheckTimeoutId = null;
let paymentVariableSymbol = null;

// PAY BUTTON
function handleDoneClick() {
  if (cart.length === 0) {
    return;
  }

  openPaymentPrompt();
}

// OPEN PAYMENT MODAL (ASKS FOR THE TOTAL, PLUS AN OPTIONAL NAME FOR 'tickets')
function openPaymentPrompt() {
  stopPaymentPolling();

  document.getElementById("payment-name-input").value = "";
  document.getElementById("payment-name-group").style.display = currentSpot === 'tickets' ? "flex" : "none";
  document.getElementById("payment-total-input").value = getCartTotal().toFixed(2);
  document.getElementById("payment-details").style.display = "flex";
  document.getElementById("payment-loading").style.display = "none";
  document.getElementById("payment-result").style.display = "none";
  document.getElementById("payment-modal").style.display = "flex";
  updateCashButton();
}

// UPDATE THE "PLATBA V HOTOVOSTI" BUTTON (BUFET SPOT ONLY): SHOWS THE
// CURRENT AMOUNT FLOORED TO ONE DECIMAL PLACE
function updateCashButton() {
  const cashBtn = document.getElementById("payment-cash-btn");

  if (currentSpot !== 'bufet') {
    cashBtn.style.display = "none";
    return;
  }

  document.getElementById("payment-cash-amount").textContent = `${getFlooredCashAmount().toFixed(2)} EUR`;
  cashBtn.style.display = "block";
}

// READS THE (POSSIBLY USER-EDITED) AMOUNT INPUT, FLOORED TO ONE DECIMAL PLACE
function getFlooredCashAmount() {
  const totalInput = document.getElementById("payment-total-input").value.trim().replace(',', '.');
  const total = parseFloat(totalInput);
  return Number.isFinite(total) ? Math.floor(total * 10) / 10 : 0;
}

// DETAILS STEP CONFIRMED, CREATE THE PAYMENT
function submitPaymentDetails(paidVia) {
  const name = document.getElementById("payment-name-input").value.trim();
  const total = paidVia === 'cash'
    ? getFlooredCashAmount()
    : parseFloat(document.getElementById("payment-total-input").value.trim().replace(',', '.'));
  createPayment(name, total, paidVia);
}

async function createPayment(name, total, paidVia) {
  stopPaymentPolling();

  document.getElementById("payment-details").style.display = "none";
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
      paidVia: paidVia || 'wire',
    };
    if (name) {
      body.name = name;
    }
    if (Number.isFinite(total)) {
      body.amount = total;
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
  document.getElementById("payment-details").style.display = "none";
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

  document.getElementById("payment-loading").style.display = "none";
  document.getElementById("payment-result").style.display = "flex";

  // CASH IS PAID ON THE SPOT: SKIP THE QR CODE AND THE WAIT FOR A MATCHING
  // BANK TRANSACTION, JUST SHOW THE SUCCESS CHECK RIGHT AWAY
  if (payment.paidVia === 'cash') {
    showPaymentConfirmed();
    return;
  }

  const qr = qrcode(0, 'M');
  qr.addData(payment.paymeLink);
  qr.make();
  document.getElementById("payment-qr").innerHTML = qr.createImgTag(6, 8, 'QR platba');
  document.getElementById("payment-qr").style.display = "block";

  document.getElementById("payment-success").style.display = "none";
  document.getElementById("payment-checking").style.display = "flex";
  document.getElementById("payment-failed").style.display = "none";
  document.getElementById("payment-cancel-btn").style.display = "flex";

  startPaymentPolling(payment.variableSymbol);
}

// START POLLING /api/payment/check UNTIL CONFIRMED OR TIMED OUT
// The endpoint itself retries server-side for a few seconds before
// responding, so the next request is scheduled only after the previous
// one finishes rather than on a fixed interval on top of that wait.
function startPaymentPolling(variableSymbol) {
  stopPaymentPolling();
  paymentVariableSymbol = variableSymbol;
  paymentCheckPending = true;

  checkPaymentNow();
  paymentCheckTimeoutId = setTimeout(showPaymentFailed, PAYMENT_CHECK_TIMEOUT_MS);
}

// STOP POLLING (MODAL CLOSED / REOPENED / PAYMENT CONFIRMED)
function stopPaymentPolling() {
  paymentCheckPending = false;
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
      return;
    }
  } catch (err) {
    // ignore network errors, keep polling / let the user retry
  } finally {
    if (paymentCheckPending && paymentVariableSymbol === variableSymbol) {
      setTimeout(checkPaymentNow, PAYMENT_CHECK_INTERVAL_MS);
    }
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
