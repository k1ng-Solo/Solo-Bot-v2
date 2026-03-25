const fs = require('fs');
const path = require('path');

// Memory file path
const memoryFile = path.join(__dirname, 'botMemory.json');

// Load memory or create empty if missing
let memory = {};
if (fs.existsSync(memoryFile)) {
  memory = JSON.parse(fs.readFileSync(memoryFile, 'utf-8'));
} else {
  fs.writeFileSync(memoryFile, JSON.stringify({ products: [] }, null, 2));
  memory = { products: [] };
}

// Save memory to disk
function saveMemory() {
  fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
}

// Add a product
function addProduct(name, type, file, price) {
  memory.products.push({ name, type, file, price });
  saveMemory();
}

// Get products by name and optional price range
function getProduct(name, minPrice = 0, maxPrice = Infinity) {
  return memory.products.filter(
    p => p.name.toLowerCase() === name.toLowerCase() && p.price >= minPrice && p.price <= maxPrice
  );
}

// Optional: delete product if needed
function deleteProduct(name) {
  memory.products = memory.products.filter(p => p.name.toLowerCase() !== name.toLowerCase());
  saveMemory();
}

module.exports = { addProduct, getProduct, deleteProduct, memory };