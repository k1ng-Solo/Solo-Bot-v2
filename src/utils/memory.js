const fs = require('fs');
const path = require('path');

// File paths
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const CURRENCIES_FILE = path.join(__dirname, 'currencies.json');

// ==============================
// HELPER: Load JSON data
// ==============================
function loadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

// ==============================
// HELPER: Save JSON data
// ==============================
function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err);
  }
}

// ==============================
// PRODUCTS HANDLER
// ==============================
function addProduct(name, type, file, price) {
  const products = loadJSON(PRODUCTS_FILE);
  products.push({ id: Date.now(), name, type, file, price });
  saveJSON(PRODUCTS_FILE, products);
}

function getProduct(name, minPrice = 0, maxPrice = Infinity) {
  const products = loadJSON(PRODUCTS_FILE);
  return products.filter(p =>
    p.name.toLowerCase().includes(name.toLowerCase()) &&
    p.price >= minPrice &&
    p.price <= maxPrice
  );
}

function deleteProduct(id) {
  let products = loadJSON(PRODUCTS_FILE);
  products = products.filter(p => p.id != id);
  saveJSON(PRODUCTS_FILE, products);
}

function updateProduct(id, field, value) {
  const products = loadJSON(PRODUCTS_FILE);
  const prod = products.find(p => p.id == id);
  if (prod) prod[field] = value;
  saveJSON(PRODUCTS_FILE, products);
}

// ==============================
// CURRENCIES HANDLER (auto-learn)
// ==============================
function getCurrencies() {
  return loadJSON(CURRENCIES_FILE);
}

function addCurrency(code, rate) {
  const currencies = loadJSON(CURRENCIES_FILE);
  const existing = currencies.find(c => c.code === code.toUpperCase());
  if (existing) {
    existing.rate = rate;
  } else {
    currencies.push({ code: code.toUpperCase(), rate });
  }
  saveJSON(CURRENCIES_FILE, currencies);
}

module.exports = {
  addProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  getCurrencies,
  addCurrency
};