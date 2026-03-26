async function handleOrder(client, message) {
    const text = message.body.trim();
    const sender = message.from;

    if (text.startsWith('.order')) {
        await client.sendMessage(
            sender,
            "🛒 *ORDER RECEIVED*\n\nPlease proceed with payment using *.pay*"
        );
        return;
    }

    if (text === '.myorders') {
        await client.sendMessage(sender, "📦 You have no orders yet.");
        return;
    }
}

module.exports = { handleOrder };