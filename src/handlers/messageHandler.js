const { addProduct, updateProduct, deleteProduct, getProduct, loadCurrencies, refreshRates } = require('../utils/memory');

// ==============================
// GREETINGS
// ==============================
const greetings = [
  'hi','hello','hey','hwfr','hw fa','hw fr','how far','wassup','wagwan','hyd'
];

// ==============================
// MESSAGE HANDLER
// ==============================
async function handleMessage(msg, sock) {
  if (!msg.message) return;
  const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  const text = body.toLowerCase().trim();
  const remoteJid = msg.key.remoteJid;
  const sender = msg.key.participant || remoteJid;
  const isGroup = remoteJid.endsWith('@g.us');

  // ==============================
  // FIRST GREETING / SYSTEM ACTIVE
  // ==============================
  if (greetings.includes(text) || text === body) {
    await sock.sendMessage(remoteJid, {
      text: `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands. And *help* for guidance.`
    });
    return;
  }

  // ==============================
  // MENU
  // ==============================
  if (['.menu','menu'].includes(text)) {
    const menu = `*🛠️ BUSINESS ASSISTANT v5.3*\n\n` +
                 `*💰 FINANCE*\n• .pay - Bank info\n• .rate - Currency & Crypto Rates\n\n` +
                 `*🛒 PRODUCTS*\n• .add [name] [type] [file] [price] - Add product (owner only)\n` +
                 `• .get [name] [minPrice] [maxPrice] - Get products\n` +
                 `• .delete [id] - Delete product (owner only)\n` +
                 `• .update [id] [field] [value] - Update product (owner only)\n\n` +
                 `Type *help* for guidance.`;
    return await sock.sendMessage(remoteJid, { text: menu });
  }

  // ==============================
  // HELP
  // ==============================
  if (text === 'help') {
    const help = `*🆘 HELP MENU v5.3*\n\n` +
                 `• Type *.menu* to see all commands\n` +
                 `• Products: use .add, .get, .delete, .update\n` +
                 `• Finance: .pay for bank info, .rate for currencies\n` +
                 `• Owner-only commands: .add, .delete, .update`;
    return await sock.sendMessage(remoteJid, { text: help });
  }

  // ==============================
  // BANK INFO
  // ==============================
  if (['.pay','.account'].includes(text)) {
    const bank = `*💳 PAYMENT INFO*\n\n🏦 Bank: [BANK NAME]\n🔢 Acc: [NUMBER]\n👤 Name: [NAME]`;
    return await sock.sendMessage(remoteJid, { text: bank });
  }

  // ==============================
  // CURRENCY & CRYPTO RATE
  // ==============================
  if (['.rate','rate'].includes(text)) {
    const currencies = loadCurrencies();
    if (!currencies || currencies.length === 0) return await sock.sendMessage(remoteJid, { text: '❌ No currency data available.' });

    let msgText = '*💱 Exchange Rates*\n';
    currencies.forEach(c => {
      msgText += `• ${c.code}: ${c.rate}\n`;
    });
    return await sock.sendMessage(remoteJid, { text: msgText });
  }

  // ==============================
  // PRODUCT MANAGEMENT
  // ==============================
  if (text.startsWith('.add')) {
    const args = body.split(' ');
    if (args.length < 5) return await sock.sendMessage(remoteJid, { text: '❌ Usage: .add [name] [type] [file] [price]' });
    const [_, name, type, file, price] = args;
    addProduct(name, type, file, parseInt(price));
    return await sock.sendMessage(remoteJid, { text: `✅ Product ${name} added!` });
  }

  if (text.startsWith('.get')) {
    const args = body.split(' ');
    if (args.length < 2) return await sock.sendMessage(remoteJid, { text: '❌ Usage: .get [name] [minPrice] [maxPrice]' });
    const name = args[1];
    const minPrice = args[2] ? parseInt(args[2]) : 0;
    const maxPrice = args[3] ? parseInt(args[3]) : Infinity;
    const items = getProduct(name, minPrice, maxPrice);
    if (!items || items.length === 0) return await sock.sendMessage(remoteJid, { text: `❌ No ${name} found.` });
    for (const item of items) {
      await sock.sendMessage(remoteJid, { 
        text: `${item.name} - ₦${item.price}` 
      });
    }
    return;
  }

  if (text.startsWith('.delete')) {
    const args = body.split(' ');
    if (args.length < 2) return await sock.sendMessage(remoteJid, { text: '❌ Usage: .delete [id]' });
    const ok = deleteProduct(args[1]);
    return await sock.sendMessage(remoteJid, { text: ok ? '✅ Deleted successfully' : '❌ Product not found' });
  }

  if (text.startsWith('.update')) {
    const args = body.split(' ');
    if (args.length < 4) return await sock.sendMessage(remoteJid, { text: '❌ Usage: .update [id] [field] [value]' });
    const ok = updateProduct(args[1], args[2], args[3]);
    return await sock.sendMessage(remoteJid, { text: ok ? '✅ Updated successfully' : '❌ Product not found' });
  }

  // ==============================
  // AUTO PAYMENT PROMPT & ORDER SYSTEM
  // ==============================
  if (text.startsWith('.order')) {
    // Example: prompt user to choose payment method
    const reply = `🛒 Order received! Please reply with payment method:\n1️⃣ Bank Transfer\n2️⃣ USSD\n3️⃣ Online Payment`;
    return await sock.sendMessage(remoteJid, { text: reply });
  }
}

module.exports = { handleMessage };