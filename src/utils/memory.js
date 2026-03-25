const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/products.json');

// Ensure the data folder and file exist
if (!fs.existsSync(path.dirname(dataPath))) fs.mkdirSync(path.dirname(dataPath), { recursive: true });
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify([]));

/**
 * Add a product to memory
 * @param {string} name - Product name
 * @param {string} type - 'image' or 'video'
 * @param {string} file - URL or file path
 * @param {number} price - Product price in NGN
 */
function addProduct(name, type, file, price) {
  const products = getAllProducts();
  products.push({ name, type, file, price });
  fs.writeFileSync(dataPath, JSON.stringify(products, null, 2));
}

/**
 * Get products by name and optional price range
 * @param {string} name - Product name
 * @param {number} minPrice - Minimum price (default 0)
 * @param {number} maxPrice - Maximum price (default Infinity)
 * @returns Array of products
 */
function getProduct(name, minPrice = 0, maxPrice = Infinity) {
  const products = getAllProducts();
  return products.filter(p => 
    p.name.toLowerCase() === name.toLowerCase() &&
    p.price >= minPrice &&
    p.price <= maxPrice
  );
}

/**
 * Return all products
 */
function getAllProducts() {
  try {
    const raw = fs.readFileSync(dataPath);
    return JSON.parse(raw);
  } catch (err) {
    console.error('Memory Error:', err);
    return [];
  }
}

module.exports = { addProduct, getProduct, getAllProducts };