const fs = require('fs');
const path = require('path');
const productsFile = path.join(__dirname, 'Products.json');

function loadProducts() {
    if (!fs.existsSync(productsFile)) return [];
    return JSON.parse(fs.readFileSync(productsFile, 'utf-8'));
}

function saveProducts(products) {
    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
}

module.exports = { loadProducts, saveProducts };