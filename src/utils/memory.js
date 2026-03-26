const fs = require('fs');
const path = require('path');

// ==============================
// FILE PATHS
// ==============================
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const RATES_FILE = path.join(__dirname, 'rates.json');

// ==============================
// HELPER: Load JSON
// ==============================
function loadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath);
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error loading ${filePath}:`, e);
    return {};
  }
}

// ==============================
// HELPER: Save JSON
// ==============================
function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error saving ${filePath}:`, e);
  }
}

// ==============================
// PRODUCT FUNCTIONS
// ==============================
function addProduct(name, type, file, price) {
  const products = loadJSON(PRODUCTS_FILE);
  const id = Date.now().toString();
  products[id] = { id, name, type, file, price };
  saveJSON(PRODUCTS_FILE, products);
  return id;
}

function getProduct(name, minPrice = 0, maxPrice = Infinity) {
  const products = loadJSON(PRODUCTS_FILE);
  return Object.values(products).filter(p =>
    p.name.toLowerCase().includes(name.toLowerCase()) &&
    p.price >= minPrice &&
    p.price <= maxPrice
  );
}

function deleteProduct(id) {
  const products = loadJSON(PRODUCTS_FILE);
  if (products[id]) {
    delete products[id];
    saveJSON(PRODUCTS_FILE, products);
  }
}

function updateProduct(id, field, value) {
  const products = loadJSON(PRODUCTS_FILE);
  if (products[id] && field in products[id]) {
    // Convert price to number if updating price
    products[id][field] = field === 'price' ? Number(value) : value;
    saveJSON(PRODUCTS_FILE, products);
  }
}

// ==============================
// EXCHANGE RATE FUNCTIONS
// ==============================
function saveRate(currency, value) {
  const rates = loadJSON(RATES_FILE);
  rates[currency] = value;
  saveJSON(RATES_FILE, rates);
}

function getRate(currency) {
  const rates = loadJSON(RATES_FILE);
  return rates[currency] || null;
}

// ==============================
// EXPORTS
// ==============================
module.exports = {
  addProduct,
  getProduct,
  deleteProduct,
  updateProduct,
  saveRate,
  getRate
};