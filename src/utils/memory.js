const fs = require('fs');
const path = require('path');

// ==============================
// FILE PATHS
// ==============================
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const CURRENCIES_FILE = path.join(__dirname, 'currencies.json');

// ==============================
// HELPER: Read JSON safely
// ==============================
function readJSON(filePath) {
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
// HELPER: Write JSON safely
// ==============================
function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// ==============================
// PRODUCT FUNCTIONS
// ==============================
function addProduct(name, type, file, price) {
  const products = readJSON(PRODUCTS_FILE);
  const id = products.length ? products[products.length - 1].id + 1 : 1;
  products.push({ id, name, type, file, price });
  writeJSON(PRODUCTS_FILE, products);
}

function getProduct(name = '', minPrice = 0, maxPrice = Infinity) {
  const products = readJSON(PRODUCTS_FILE);
  return products.filter(p =>
    p.name.toLowerCase().includes(name.toLowerCase()) &&
    p.price >= minPrice &&
    p.price <= maxPrice
  );
}

function deleteProduct(id) {
  let products = readJSON(PRODUCTS_FILE);
  products = products.filter(p => p.id != id);
  writeJSON(PRODUCTS_FILE, products);
}

function updateProduct(id, field, value) {
  const products = readJSON(PRODUCTS_FILE);
  const index = products.findIndex(p => p.id == id);
  if (index === -1) return;
  products[index][field] = field === 'price' ? parseInt(value) : value;
  writeJSON(PRODUCTS_FILE, products);
}

// ==============================
// CURRENCY / CRYPTO FUNCTIONS
// ==============================
function getCurrencies() {
  return readJSON(CURRENCIES_FILE);
}

function addCurrency(code, rate) {
  const currencies = readJSON(CURRENCIES_FILE);
  const existing = currencies.find(c => c.code === code);
  if (!existing) {
    currencies.push({ code, lastRate: rate });
    writeJSON(CURRENCIES_FILE, currencies);
  }
}

function updateCurrency(code, rate) {
  const currencies = readJSON(CURRENCIES_FILE);
  const index = currencies.findIndex(c => c.code === code);
  if (index !== -1) {
    currencies[index].lastRate = rate;
    writeJSON(CURRENCIES_FILE, currencies);
  } else {
    addCurrency(code, rate);
  }
}

module.exports = {
  addProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  getCurrencies,
  addCurrency,
  updateCurrency
};