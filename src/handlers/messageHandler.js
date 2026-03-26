const { loadProducts, saveProducts } = require('../utils/Products');
const { loadMemory, saveMemory } = require('../utils/Memory');
const { loadSellers } = require('../utils/Sellers.json');
const Responses = require('../utils/Responses');
const { createOrder, myOrders } = require('./OrderHandler');

const greetings = ['hi','hello','hey','hwfr','hw fa','hw fr','how far','wassup','wagwan','hyd'];

async function handleMessage(client, message) {
    const text = message.body.toLowerCase();
    const sender = message.from;

    // Only approved sellers/users
    if (!loadSellers().includes(sender)) return;

    // Greetings
    if (greetings.includes(text)) {
        client.sendMessage(sender, Responses.systemActive);
        return;
    }

    // Commands
    if (text.startsWith('.menu')) {
        client.sendMessage(sender, Responses.menu);
        return;
    }

    if (text.startsWith('help') || text.startsWith('.help')) {
        client.sendMessage(sender, Responses.help);
        return;
    }

    // Product & Order handling delegated
    if (text.startsWith('.add') || text.startsWith('.get') || text.startsWith('.delete') || text.startsWith('.update')) {
        require('./CommandHandler').handleCommand(client, message);
        return;
    }

    if (text.startsWith('.order') || text.startsWith('.myorders')) {
        require('./OrderHandler').handleOrder(client, message);
        return;
    }

    if (text.startsWith('.rate')) {
        const memory = loadMemory();
        const currencies = memory.currencies || [];
        const list = currencies.map(c => `• ${c.name} (${c.symbol}): ${c.rate}`).join('\n');
        client.sendMessage(sender, `*💱 Exchange Rates*\n\n${list}`);
        return;
    }
}

module.exports = { handleMessage };