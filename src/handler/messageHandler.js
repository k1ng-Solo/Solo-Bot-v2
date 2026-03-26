const fs = require('fs');
const path = require('path');

const Responses = require('../utils/Responses');
const { handleCommand } = require('./CommandHandler');
const { handleOrder } = require('/OrderHandler');
const { loadMemory } = require('./utils/Memory');

// Load sellers
const sellersPath = path.join(__dirname, '../utils/Sellers.json');

function loadSellers() {
    if (!fs.existsSync(sellersPath)) return [];
    return JSON.parse(fs.readFileSync(sellersPath));
}

const greetings = [
    'hi','hello','hey','hwfr','hw fa','hw fr',
    'how far','wassup','wagwan','hyd'
];

async function handleMessage(client, message) {
    try {
        const text = message.body.toLowerCase();
        const sender = message.from;

        const sellers = loadSellers();

        // Only approved users
        if (!sellers.includes(sender)) return;

        // Greetings
        if (greetings.includes(text)) {
            await client.sendMessage(sender, Responses.systemActive);
            return;
        }

        // Menu
        if (text === '.menu') {
            await client.sendMessage(sender, Responses.menu);
            return;
        }

        // Help
        if (text === 'help' || text === '.help') {
            await client.sendMessage(sender, Responses.help);
            return;
        }

        // Currency rate
        if (text === '.rate') {
            const memory = loadMemory();
            const currencies = memory.currencies || [];

            if (!currencies.length) {
                await client.sendMessage(sender, "Rates not available yet.");
                return;
            }

            const list = currencies
                .map(c => `• ${c.name} (${c.symbol}): ${c.rate}`)
                .join('\n');

            await client.sendMessage(sender, `*💱 Exchange Rates*\n\n${list}`);
            return;
        }

        // Commands
        if (text.startsWith('.add') ||
            text.startsWith('.get') ||
            text.startsWith('.delete') ||
            text.startsWith('.update')) {

            await handleCommand(client, message);
            return;
        }

        // Orders
        if (text.startsWith('.order') ||
            text.startsWith('.myorders')) {

            await handleOrder(client, message);
            return;
        }

    } catch (error) {
        console.error("MessageHandler error:", error);
    }
}

module.exports = { handleMessage };