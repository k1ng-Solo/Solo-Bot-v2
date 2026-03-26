const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'products.json');

// ==============================
// HELPER: Load products from JSON
// ==============================
function loadProducts() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE);
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error loading products:", e);
    return [];
  }
}

// ==============================
// HELPER: Save products to JSON
// ==============================
function saveProducts(products) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2));
  } catch (e) {
    console.error("Error saving products:", e);
  }
}

// ==============================
// ADD PRODUCT
// ==============================
function addProduct(name, type, file, price) {
  const products = loadProducts();
  products.push({ name, type, file, price });
  saveProducts(products);
}

// ==============================
// GET PRODUCTS (filter by name & price)
// ==============================
function getProduct(name, minPrice = 0, maxPrice = Infinity) {
  const products = loadProducts();
  return products.filter(p => 
    p.name.toLowerCase().includes(name.toLowerCase()) &&
    p.price >= minPrice &&
    p.price <= maxPrice
  );
}

module.exports = { addProduct, getProduct };