const Responses = require('../utils/Responses');

async function handleCommand(client, message) {
    const text = message.body.trim();
    const sender = message.from;

    // ADD PRODUCT
    if (text.startsWith('.add')) {
        await client.sendMessage(sender, "✅ Product added successfully.");
        return;
    }

    // GET PRODUCT
    if (text.startsWith('.get')) {
        await client.sendMessage(sender, "📦 Fetching products...");
        return;
    }

    // DELETE PRODUCT
    if (text.startsWith('.delete')) {
        await client.sendMessage(sender, "🗑️ Product deleted.");
        return;
    }

    // UPDATE PRODUCT
    if (text.startsWith('.update')) {
        await client.sendMessage(sender, "♻️ Product updated.");
        return;
    }

    // DASHBOARD
    if (text === '.dashboard') {
        await client.sendMessage(sender, "📊 Opening dashboard...");
        return;
    }

    // BROADCAST
    if (text.startsWith('.broadcast')) {
        await client.sendMessage(sender, "📢 Broadcasting message...");
        return;
    }
}

module.exports = { handleCommand };