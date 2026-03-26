const fs = require('fs');
const path = require('path');
const { loadProducts, saveProducts } = require('../utils/Products');
const ordersFile = path.join(__dirname, '../utils/Orders.json');

function loadOrders() {
    if (!fs.existsSync(ordersFile)) return [];
    return JSON.parse(fs.readFileSync(ordersFile, 'utf-8'));
}

function saveOrders(orders) {
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

function createOrder(client, message) {
    const [cmd, productName] = message.body.split(' ');
    const products = loadProducts();
    const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
    if (!product) return client.sendMessage(message.from, 'Product not found!');
    
    const orders = loadOrders();
    const newOrder = { id: orders.length + 1, buyer: message.from, product: product.name, status: 'pending', timestamp: new Date() };
    orders.push(newOrder);
    saveOrders(orders);

    client.sendMessage(message.from, `Order for *${product.name}* created! Please proceed to payment using .pay`);
}

function myOrders(client, message) {
    const orders = loadOrders().filter(o => o.buyer === message.from);
    if (orders.length === 0) return client.sendMessage(message.from, 'No orders yet.');
    const list = orders.map(o => `• ${o.product} - ${o.status}`).join('\n');
    client.sendMessage(message.from, `*Your Orders:*\n${list}`);
}

module.exports = { handleOrder: (client, message) => {
    if (message.body.startsWith('.order')) return createOrder(client, message);
    if (message.body.startsWith('.myorders')) return myOrders(client, message);
}};