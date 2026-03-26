const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const CURRENCIES_FILE = path.join(__dirname, 'currencies.json');

// ==============================
// PRODUCTS
// ==============================
function loadProducts() {
  if (!fs.existsSync(PRODUCTS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(PRODUCTS_FILE)); }
  catch { return []; }
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function addProduct(name, type, file, price) {
  const products = loadProducts();
  products.push({ id: Date.now(), name, type, file, price });
  saveProducts(products);
}

function updateProduct(id, field, value) {
  const products = loadProducts();
  const product = products.find(p => p.id === Number(id));
  if (product) {
    product[field] = value;
    saveProducts(products);
    return true;
  }
  return false;
}

function deleteProduct(id) {
  let products = loadProducts();
  const before = products.length;
  products = products.filter(p => p.id !== Number(id));
  saveProducts(products);
  return before !== products.length;
}

function getProduct(name, minPrice = 0, maxPrice = Infinity) {
  const products = loadProducts();
  return products.filter(p => 
    p.name.toLowerCase().includes(name.toLowerCase()) &&
    p.price >= minPrice && p.price <= maxPrice
  );
}

// ==============================
// CURRENCIES & CRYPTO
// ==============================
function loadCurrencies() {
  if (!fs.existsSync(CURRENCIES_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(CURRENCIES_FILE)); }
  catch { return []; }
}

function saveCurrencies(data) {
  fs.writeFileSync(CURRENCIES_FILE, JSON.stringify(data, null, 2));
}

// Auto-update crypto & currency rates daily
async function refreshRates() {
  try {
    const currencies = loadCurrencies();
    const symbols = currencies.map(c => c.code).join(',');
    // Get crypto + fx rates from coingecko & exchangerate-api
    const cryptoData = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd').then(r=>r.json());
    const fxData = await fetch('https://api.exchangerate-api.com/v4/latest/USD').then(r=>r.json());

    const updated = currencies.map(c => {
      let rate = c.rate;
      if (c.code === 'BTC') rate = cryptoData.bitcoin.usd;
      if (c.code === 'ETH') rate = cryptoData.ethereum.usd;
      if (c.code === 'USDT') rate = cryptoData.tether.usd;
      if (fxData.rates[c.code]) rate = fxData.rates[c.code];
      return { ...c, rate };
    });

    saveCurrencies(updated);
    console.log('[Memory] Currency & crypto rates updated ✅');
  } catch (e) {
    console.error('[Memory] Error updating rates:', e.message);
  }
}

// Auto-refresh every 24 hours
setInterval(refreshRates, 24 * 60 * 60 * 1000);
refreshRates(); // refresh on startup

module.exports = {
  loadProducts,
  saveProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  loadCurrencies,
  saveCurrencies,
  refreshRates
};