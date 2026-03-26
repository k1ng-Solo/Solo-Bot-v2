const { addProduct, getProduct, deleteProduct, updateProduct, getCurrencies, addCurrency } = require('../utils/memory');
const fetch = require('node-fetch');

// ==============================
// GLOBAL CONFIG
// ==============================
const OWNER = process.env.OWNER_NUMBER + '@s.whatsapp.net';

// Greetings worldwide
const GREETINGS = ['hi','hello','hey','hwfr','hw fa','hw fr','how far','wassup','wagwan','hyd'];

// ==============================
// MESSAGE HANDLER
// ==============================
async function handleMessage(msg, sock) {
  try {
    if (!msg.message) return;

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption || "";
    const text = body.toLowerCase().trim();
    const remoteJid = msg.key.remoteJid;
    const sender = msg.key.participant || remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    const isImage = !!msg.message.imageMessage;

    // ==============================
    // FIRST MESSAGE / GREETING
    // ==============================
    if (GREETINGS.includes(text)) {
      return await sock.sendMessage(remoteJid, {
        text: `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands. And *help* for guidance.`
      });
    }

    // ==============================
    // MAIN MENU
    // ==============================
    if (['.menu','menu'].includes(text)) {
      let menuMsg = `*🛠️ BUSINESS ASSISTANT v5.3*\n\n`;
      menuMsg += `*💰 FINANCE*\n• .pay - Bank info\n• .rate - Currency & Crypto Rates\n\n`;
      menuMsg += `*🛒 PRODUCTS*\n• .add [name] [type] [file] [price] - Add product (owner only)\n`;
      menuMsg += `• .get [name] [minPrice] [maxPrice] - Get products\n`;
      menuMsg += `• .delete [id] - Delete product (owner only)\n`;
      menuMsg += `• .update [id] [field] [value] - Update product (owner only)\n\n`;
      menuMsg += `Type *help* for guidance.`;
      return await sock.sendMessage(remoteJid, { text: menuMsg });
    }

    // ==============================
    // HELP
    // ==============================
    if (text === 'help') {
      let helpMsg = `*🆘 HELP MENU v5.3*\n\n`;
      helpMsg += `• Type *.menu* to see all commands\n`;
      helpMsg += `• Products: use .add, .get, .delete, .update\n`;
      helpMsg += `• Finance: .pay for bank info, .rate for currencies\n`;
      helpMsg += `• Owner-only commands: .add, .delete, .update\n`;
      helpMsg += `• Greetings: ${GREETINGS.join(', ')}\n`;
      return await sock.sendMessage(remoteJid, { text: helpMsg });
    }

    // ==============================
    // OWNER-ONLY CHECK
    // ==============================
    const isOwner = sender === OWNER;

    // ==============================
    // PRODUCT COMMANDS
    // ==============================
    if (text.startsWith('.add')) {
      if (!isOwner) return sock.sendMessage(remoteJid, { text: '❌ Only owner can add products.' });
      const args = body.split(' ');
      if (args.length < 5) return sock.sendMessage(remoteJid, { text: "❌ Usage: .add [name] [type] [file] [price]" });
      const [_, name, type, file, priceStr] = args;
      addProduct(name, type, file, parseInt(priceStr));
      return sock.sendMessage(remoteJid, { text: `✅ Product "${name}" added.` });
    }

    if (text.startsWith('.get')) {
      const args = body.split(' ');
      if (args.length < 2) return sock.sendMessage(remoteJid, { text: "❌ Usage: .get [name] [minPrice] [maxPrice]" });
      const name = args[1];
      const min = args[2] ? parseInt(args[2]) : 0;
      const max = args[3] ? parseInt(args[3]) : Infinity;
      const items = getProduct(name, min, max);
      if (!items.length) return sock.sendMessage(remoteJid, { text: `❌ No "${name}" found.` });
      for (const item of items) {
        if (item.type === 'image') await sock.sendMessage(remoteJid, { image: { url: item.file }, caption: `${item.name} - ₦${item.price}` });
        if (item.type === 'video') await sock.sendMessage(remoteJid, { video: { url: item.file }, caption: `${item.name} - ₦${item.price}` });
      }
      return;
    }

    if (text.startsWith('.delete')) {
      if (!isOwner) return sock.sendMessage(remoteJid, { text: '❌ Only owner can delete products.' });
      const id = body.split(' ')[1];
      deleteProduct(id);
      return sock.sendMessage(remoteJid, { text: `✅ Product deleted.` });
    }

    if (text.startsWith('.update')) {
      if (!isOwner) return sock.sendMessage(remoteJid, { text: '❌ Only owner can update products.' });
      const [_, id, field, ...rest] = body.split(' ');
      updateProduct(id, field, rest.join(' '));
      return sock.sendMessage(remoteJid, { text: `✅ Product updated.` });
    }

    // ==============================
    // CURRENCY / RATE
    // ==============================
    if (text === '.rate') {
      const currencies = getCurrencies();
      if (!currencies.length) return sock.sendMessage(remoteJid, { text: 'No currencies found yet.' });

      let msg = '*💱 Exchange Rates*\n';
      currencies.forEach(c => msg += `• ${c.code}: ${c.rate}\n`);
      return sock.sendMessage(remoteJid, { text: msg });
    }

  } catch (err) {
    console.error("Handler Error:", err);
  }
}

module.exports = { handleMessage };