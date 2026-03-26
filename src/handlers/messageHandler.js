const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { getProduct, addProduct, deleteProduct, updateProduct, saveRate, getRate } = require('../utils/memory');

// ==============================
// CONFIGURATION
// ==============================
const OWNER_NUMBER = process.env.OWNER_NUMBER || "2347076642500"; // Owner WhatsApp number
const allowedGroups = (process.env.ALLOWED_GROUPS || "").split(",");

// Global greetings
const greetings = [
  'hi','hello','hey','hola','bonjour','ciao','hallo','salut','namaste','konnichiwa','nǐ hǎo','annyeong','salaam','shalom'
];

// ==============================
// MESSAGE HANDLER
// ==============================
async function handleMessage(msg, sock) {
  try {
    if (!msg.message) return;

    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      "";

    const text = body.toLowerCase().trim();
    const remoteJid = msg.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    const sender = msg.key.participant || remoteJid;
    const isImage = !!msg.message?.imageMessage;

    // ==============================
    // IGNORE GROUPS unless whitelisted
    // ==============================
    if (isGroup && !allowedGroups.includes(remoteJid)) return;

    // ==============================
    // FIRST GREETING / GLOBAL GREETINGS
    // ==============================
    if (greetings.includes(text)) {
      await sock.sendMessage(remoteJid, {
        text: `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands.`
      });
      return;
    }

    // ==============================
    // COMMAND MENU (.menu)
    // ==============================
    if (['.menu','menu'].includes(text)) {
      const menuMsg = `
*🛠️ BUSINESS ASSISTANT v5.3*

*💰 FINANCE*
• .pay - Bank info
• .rate - Show exchange rates / crypto

*🌍 TOOLS*
• .track - Logistics / tracking

*🛒 PRODUCTS* (Owner only)
• .add [name] [type] [file] [price] - Add product
• .get [name] [minPrice] [maxPrice] - Get products
• .delete [id] - Delete product
• .update [id] [field] [value] - Update product

*ℹ️ HELP*
• Type .help for guidance

_Reliability first. We no go carry last!_`;

      return await sock.sendMessage(remoteJid, { text: menuMsg });
    }

    // ==============================
    // HELP COMMAND
    // ==============================
    if (text === 'help') {
      const helpMsg = `
*🆘 BOT HELP v5.3*

• Type *.menu* to see main commands
• Products management (.add, .delete, .update) only works for owner
• Get products: .get [name] [minPrice] [maxPrice]
• Bank info: .pay
• Exchange rates / crypto: .rate
• Logistics / tracking: .track
• Greetings automatically trigger SYSTEM ACTIVE 🟢 message
`;
      return await sock.sendMessage(remoteJid, { text: helpMsg });
    }

    // ==============================
    // BANK ACCOUNT INFO (.pay)
    // ==============================
    if (['.pay', '.account'].includes(text)) {
      const payMsg = `*💳 PAYMENT INFO*\n\n🏦 Bank: [BANK NAME]\n🔢 Acc: [ACCOUNT NUMBER]\n👤 Name: [ACCOUNT NAME]\n📞 Phone: ${OWNER_NUMBER}`;
      return await sock.sendMessage(remoteJid, { text: payMsg });
    }

    // ==============================
    // EXCHANGE RATES / CURRENCIES (.rate)
    // ==============================
    if (text.startsWith('.rate')) {
      const args = body.split(' ');
      const currency = args[1]?.toUpperCase() || "NGN";

      try {
        const response = await fetch('https://api.exchangerate.host/latest?base=USD');
        const data = await response.json();

        let rateValue = data.rates[currency];
        if (!rateValue) return sock.sendMessage(remoteJid, { text: `❌ Unknown currency: ${currency}` });

        // Save new rate to memory
        saveRate(currency, rateValue);

        return await sock.sendMessage(remoteJid, { text: `*📊 CURRENT RATE*\n\n1 USD = ${rateValue} ${currency}` });
      } catch (e) {
        return await sock.sendMessage(remoteJid, { text: `❌ Could not fetch rate for ${currency}` });
      }
    }

    // ==============================
    // PRODUCTS MANAGEMENT
    // ==============================
    if (text.startsWith('.add') && sender.includes(OWNER_NUMBER)) {
      const args = body.split(' ');
      if (args.length < 5) return sock.sendMessage(remoteJid, { text: "❌ Usage: .add [name] [type:image|video] [filePath] [price]" });

      const [_, name, type, file, priceStr] = args;
      const price = parseInt(priceStr);
      addProduct(name, type, file, price);
      return sock.sendMessage(remoteJid, { text: `✅ Product ${name} added successfully!` });
    }

    if (text.startsWith('.delete') && sender.includes(OWNER_NUMBER)) {
      const args = body.split(' ');
      if (!args[1]) return sock.sendMessage(remoteJid, { text: "❌ Usage: .delete [id]" });
      deleteProduct(args[1]);
      return sock.sendMessage(remoteJid, { text: `✅ Product ID ${args[1]} deleted.` });
    }

    if (text.startsWith('.update') && sender.includes(OWNER_NUMBER)) {
      const args = body.split(' ');
      if (args.length < 4) return sock.sendMessage(remoteJid, { text: "❌ Usage: .update [id] [field] [value]" });
      const [_, id, field, ...rest] = args;
      const value = rest.join(' ');
      updateProduct(id, field, value);
      return sock.sendMessage(remoteJid, { text: `✅ Product ID ${id} updated.` });
    }

    if (text.startsWith('.get')) {
      const args = body.split(' ');
      if (!args[1]) return sock.sendMessage(remoteJid, { text: "❌ Usage: .get [name] [minPrice] [maxPrice]" });

      const name = args[1];
      const minPrice = args[2] ? parseInt(args[2]) : 0;
      const maxPrice = args[3] ? parseInt(args[3]) : Infinity;

      const items = getProduct(name, minPrice, maxPrice);
      if (!items.length) return sock.sendMessage(remoteJid, { text: `❌ No products found for ${name} in that range.` });

      for (const item of items) {
        if (item.type === 'image') await sock.sendMessage(remoteJid, { image: { url: item.file }, caption: `${item.name} - ₦${item.price}` });
        if (item.type === 'video') await sock.sendMessage(remoteJid, { video: { url: item.file }, caption: `${item.name} - ₦${item.price}` });
      }
      return;
    }

  } catch (err) {
    console.error("Handler Error:", err);
  }
}

module.exports = { handleMessage };