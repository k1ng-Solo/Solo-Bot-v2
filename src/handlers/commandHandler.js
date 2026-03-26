const { loadProducts, saveProducts } = require('../utils/Products');
const sellers = require('../utils/Sellers.json');

function handleCommand(client, message) {
    const text = message.body.toLowerCase();
    const sender = message.from;
    const args = message.body.split(' ');

    // Only owner can modify
    if (!sellers.includes(sender)) return client.sendMessage(sender, 'You are not authorized.');

    const cmd = args[0];
    if (cmd === '.add') {
        const [ , name, type, file, price ] = args;
        if (!name || !type || !file || !price) return client.sendMessage(sender, 'Invalid format! Use: .add [name] [type] [file] [price]');
        const products = loadProducts();
        products.push({ id: products.length + 1, name, type, file, price });
        saveProducts(products);
        client.sendMessage(sender, `Product *${name}* added successfully!`);
    }
    if (cmd === '.delete') {
        const [ , id ] = args;
        const products = loadProducts();
        const idx = products.findIndex(p => p.id == id);
        if (idx === -1) return client.sendMessage(sender, 'Product not found!');
        const removed = products.splice(idx, 1)[0];
        saveProducts(products);
        client.sendMessage(sender, `Product *${removed.name}* deleted successfully!`);
    }
    if (cmd === '.update') {
        const [ , id, field, value ] = args;
        const products = loadProducts();
        const product = products.find(p => p.id == id);
        if (!product) return client.sendMessage(sender, 'Product not found!');
        product[field] = value;
        saveProducts(products);
        client.sendMessage(sender, `Product *${product.name}* updated successfully!`);
    }
    if (cmd === '.get') {
        const [ , name ] = args;
        const products = loadProducts();
        const filtered = products.filter(p => p.name.toLowerCase().includes((name||'').toLowerCase()));
        if (!filtered.length) return client.sendMessage(sender, 'No products found.');
        const list = filtered.map(p => `• ${p.name} (${p.type}) - ₦${p.price}`).join('\n');
        client.sendMessage(sender, `*Available Products:*\n${list}`);
    }
}

module.exports = { handleCommand };