alert("JS LOADED");
console.log("JS CONNECTED");

const IBAN = "SK6767676767679999999922"; // fake for now
const NAME = "Festival Buffet";

// CART DATA
let cart = [];
let total = 0;
let showingFirstQR = true;

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
}

//UPDATE TOTAL
function updateTotal() {
  let total = 0;

  cart.forEach(item => {
    total += item.price;
  });

  document.getElementById("total").textContent = total.toFixed(2) + "€";
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
  
    btn.innerText = `${item.name} x${item.quantity}`;
  
    btn.onclick = () => {
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        cart.splice(index, 1);
      }
    
      updateCart();
    };
  
    cartContainer.appendChild(btn);
  });

  // 🔹 display grouped items
  Object.keys(grouped).forEach(name => {
    const div = document.createElement("div");

    const count = grouped[name];
    div.textContent = count > 1 ? `${name} ${count}x` : name;

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
}

// GO TO QR SCREEN
function handleDoneClick() {
  if (cart.length === 0) {
    alert("Cart is empty!");
    return;
  }

  document.getElementById("main-page").style.display = "none";
  document.getElementById("qrScreen").style.display = "block";

  generateQRCodes();
}

// GO BACK
function goBack() {
  document.getElementById("qrScreen").style.display = "none";
  document.getElementById("main-page").style.display = "block";

  showingFirstQR = true;
  document.getElementById("qr1").style.display = "block";
  document.getElementById("qr2").style.display = "none";
}

// SWITCH QR
function switchQR() {
  showingFirstQR = !showingFirstQR;

  document.getElementById("qr1").style.display = showingFirstQR ? "block" : "none";
  document.getElementById("qr2").style.display = showingFirstQR ? "none" : "block";
}

// PAYMENT SUCCESS
function paymentSuccess() {
  alert("Payment successful!");
  clearCart();
  goBack();
}

//GENERATE QR CODES
//THIS IS THE SHIT UR WORKING ON MOST OF THE TIMESSSSSSSSS
//LOOK HEREE
function generateQRCodes() {
  const qr1 = document.getElementById("qr1");
  const qr2 = document.getElementById("qr2");

  qr1.innerHTML = "";
  qr2.innerHTML = "";

// ✅ PUT IT HERE (THIS IS THE FIX)
let total = 0;
cart.forEach(item => {
  total += item.price;
});

  // 🧾 Items
  let itemsText = cart.map(item => `${item.name} x${item.quantity}`).join(", ");

  // 💰 Amount
  let amount = total.toFixed(2);

  // 📝 Note
  let note = "Festival buffet";

  // 🏦 IBAN
  let iban = "SK6767676767679999999922";

  const paymentData = {
    payments: [
      {
        amount: parseFloat(amount),
        currencyCode: "EUR",
        iban: iban,
        variableSymbol: Date.now().toString().slice(-10),
        constantSymbol: "0308",
        specificSymbol: "0000",
        paymentNote: cart.map(i => i.name).join(", ") || "Payment"
      }
    ]
  };
  
  // ✅ REAL encoding
  const payBySquareString = PayBySquare.generate(paymentData);

  new QRCode(qr1, {
    text: payBySquareString,
    width: 220,
    height: 220
  });

  // =========================
  // ✅ QR2 (manual fallback)
  // =========================
// 🔗 CREATE URL QR (NEW SYSTEM)

total = 0;
cart.forEach(item => {
  total += item.price;
});

// items formatted
itemsText = cart.map(i => `${i.name} x${i.quantity}`).join(",");

// ⚠️ CHANGE THIS LATER TO YOUR REAL LINK
const baseURL = "https://YOURUSERNAME.github.io/vendoora/pay.html";

const url = `${baseURL}?iban=${encodeURIComponent(iban)}&amount=${total.toFixed(2)}&note=Festival%20buffet&items=${encodeURIComponent(itemsText)}`;

new QRCode(qr2, {
  text: url,
  width: 220,
  height: 220
});

// 👇 THIS IS "DIRECTLY UNDER"
document.getElementById("copyIbanBtn").addEventListener("click", () => {
  navigator.clipboard.writeText(iban);
  alert("IBAN copied!");
});

total = 0;

cart.forEach(item => {
  total += item.price;
});

const grouped = {};

cart.forEach(item => {
  if (!grouped[item.name]) {
    grouped[item.name] = 1;
  } else {
    grouped[item.name]++;
  }
});

itemsText = "";

Object.keys(grouped).forEach(name => {
  const count = grouped[name];
  itemsText += count > 1 ? `${name} ${count}x, ` : `${name}, `;
});

// remove last comma
itemsText = itemsText.slice(0, -2);

const qrText = `TOTAL:${total.toFixed(2)}|ITEMS:${itemsText}`;

new QRCode(qr2, {
  text: qrText,
  width: 220,
  height: 220
});
}

function showManualPayment(productName, price) {
  const manualText = `
IBAN: ${IBAN}
Name: ${NAME}
Amount: ${price} EUR
Message: Payment for ${productName} - Festival Buffet
  `;

  alert(manualText); // simple version for now
}
