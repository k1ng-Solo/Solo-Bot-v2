const fs = require('fs');
const path = require('path');

// File to store products
const memoryFile = path.join(__dirname, 'products.json');

// Load existing memory or create empty
let products = [];
if (fs.existsSync(memoryFile)) {
    try {
        products = JSON.parse(fs.readFileSync(memoryFile));
    } catch (err) {
        console.error("Error reading memory file, starting fresh:", err);
        products = [];
    }
} else {
    fs.writeFileSync(memoryFile, JSON.stringify(products, null, 2));
}

/**
 * Add a product to memory
 * @param {string} name - Product name
 * @param {string} type - "image" or "video"
 * @param {string} file - File path or URL
 * @param {number} price - Price in Naira
 */
function addProduct(name, type, file, price) {
    const newProduct = { name, type, file, price };
    products.push(newProduct);
    saveMemory();
}

/**
 * Get products by name and optional price range
 * @param {string} name - Name to search
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @returns {Array} - Array of matching products
 */
function getProduct(name, minPrice = 0, maxPrice = Infinity) {
    return products.filter(p => 
        p.name.toLowerCase().includes(name.toLowerCase()) &&
        p.price >= minPrice &&
        p.price <= maxPrice
    );
}

/**
 * Save memory to file
 */
function saveMemory() {
    try {
        fs.writeFileSync(memoryFile, JSON.stringify(products, null, 2));
    } catch (err) {
        console.error("Error saving memory:", err);
    }
}

module.exports = { addProduct, getProduct };