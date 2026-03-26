const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const RATES_FILE = path.join(__dirname, 'rates.json');

// ==============================
// HELPER: Load JSON
// ==============================
function loadJson(file) {
  try {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file));
  } catch (e) {
    console.error(`Error loading ${file}:`, e);
    return [];
  }
}

// ==============================
// HELPER: Save JSON
// ==============================
function saveJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error saving ${file}:`, e);
  }
}

// ==============================
// PRODUCT FUNCTIONS
// ==============================
function addProduct(name, type, file, price) {
  const products = loadJson(PRODUCTS_FILE);
  products.push({ id: Date.now(), name, type, file, price });
  saveJson(PRODUCTS_FILE, products);
}

function getProduct(name, minPrice = 0, maxPrice = Infinity) {
  const products = loadJson(PRODUCTS_FILE);
  return products.filter(p =>
    p.name.toLowerCase().includes(name.toLowerCase()) &&
    p.price >= minPrice && p.price <= maxPrice
  );
}

function deleteProduct(id) {
  let products = loadJson(PRODUCTS_FILE);
  products = products.filter(p => p.id != id);
  saveJson(PRODUCTS_FILE, products);
}

function updateProduct(id, field, value) {
  const products = loadJson(PRODUCTS_FILE);
  const idx = products.findIndex(p => p.id == id);
  if (idx !== -1) {
    products[idx][field] = value;
    saveJson(PRODUCTS_FILE, products);
    return true;
  }
  return false;
}

// ==============================
// RATES FUNCTIONS (cache)
// ==============================
function saveRate(currency, rate) {
  const rates = loadJson(RATES_FILE);
  const idx = rates.findIndex(r => r.currency === currency);
  const entry = { currency, rate, timestamp: Date.now() };
  if (idx !== -1) rates[idx] = entry;
  else rates.push(entry);
  saveJson(RATES_FILE, rates);
}

function getRate(currency) {
  const rates = loadJson(RATES_FILE);
  const entry = rates.find(r => r.currency === currency);
  if (!entry) return null;
  // use cached if < 60 min old
  if (Date.now() - entry.timestamp < 60 * 60 * 1000) return entry.rate;
  return null;
}

module.exports = {
  addProduct, getProduct, deleteProduct, updateProduct,
  saveRate, getRate
};