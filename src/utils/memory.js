const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const CURRENCIES_FILE = path.join(__dirname, 'currencies.json');

// Generic JSON loader (auto-creates file if missing)
function loadJSON(file, defaultData = []) {
  try {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
    const raw = fs.readFileSync(file);
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error loading JSON:", e);
    return defaultData;
  }
}

// Generic JSON saver
function saveJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error saving JSON:", e);
  }
}

// Products
function loadProducts() { return loadJSON(PRODUCTS_FILE); }
function saveProducts(products) { saveJSON(PRODUCTS_FILE, products); }

// Currencies / Crypto
function loadCurrencies() { return loadJSON(CURRENCIES_FILE, ["USD","NGN","EUR","GBP","BTC","ETH"]); }
function saveCurrencies(currencies) { saveJSON(CURRENCIES_FILE, currencies); }

module.exports = {
  loadProducts,
  saveProducts,
  loadCurrencies,
  saveCurrencies
};