const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'products.json');

// ==============================
// HELPER: Load products from JSON
// ==============================
function loadProducts() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([])); // create file if missing
      return [];
    }
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
  if (!['image', 'video', 'file'].includes(type.toLowerCase())) {
    type = 'file'; // default type if invalid
  }
  const products = loadProducts();
  const id = Date.now() + Math.floor(Math.random() * 1000); // unique ID
  const timestamp = new Date().toISOString();
  products.push({ id, name, type, file, price, timestamp });
  saveProducts(products);
  return id;
}

// ==============================
// GET PRODUCTS (filter by name, price, optional type)
// ==============================
function getProduct(name, minPrice = 0, maxPrice = Infinity, type = null) {
  const products = loadProducts();
  return products.filter(p =>
    p.name.toLowerCase().includes(name.toLowerCase()) &&
    p.price >= minPrice &&
    p.price <= maxPrice &&
    (type ? p.type === type.toLowerCase() : true)
  );
}

// ==============================
// DELETE PRODUCT (by ID)
// ==============================
function deleteProduct(id) {
  let products = loadProducts();
  const initialLength = products.length;
  products = products.filter(p => p.id !== id);
  saveProducts(products);
  return products.length < initialLength; // true if deleted
}

// ==============================
// UPDATE PRODUCT (by ID)
// ==============================
function updateProduct(id, data = {}) {
  const products = loadProducts();
  let updated = false;
  for (let p of products) {
    if (p.id === id) {
      Object.assign(p, data);
      updated = true;
      break;
    }
  }
  if (updated) saveProducts(products);
  return updated;
}

module.exports = { addProduct, getProduct, deleteProduct, updateProduct };