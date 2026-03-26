const fetch = require('node-fetch');
const path = require('path');
const { getProduct, addProduct, deleteProduct, updateProduct, saveRate, getRate } = require('../utils/memory');

// ==============================
// GLOBAL CONFIG
// ==============================
const OWNER_NUMBER = process.env.OWNER_NUMBER + '@s.whatsapp.net';
const ALLOWED_GROUPS = (process.env.ALLOWED_GROUPS || "").split(",");

// ==============================
// GREETINGS LIST
// ==============================
const greetings = [
  "hi","hello","hey","hola","bonjour","ciao","hallo","namaste","salut","sawasdee","konnichiwa",
  "ola","marhaba","shalom","hej","ahoj","xin chào","sain baina uu","privet"
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
    if (isGroup && !ALLOWED_GROUPS.includes(remoteJid)) return;

    // ==============================
    // FIRST GREETING / SYSTEM ACTIVE
    // ==============================
    if (greetings.includes(text)) {
      await sock.sendMessage(remoteJid, {
        text: `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands. And .help for guidance.`
      });
      return;
    }

    // ==============================
    // COMMAND: .menu
    // ==============================
    if (text === '.menu') {
      const menuMsg = `*🛠️ BUSINESS ASSISTANT v5.3*\n\n` +
        `*💰 FINANCE*\n• .pay - Bank info\n• .rate - Currency / Crypto Rates\n\n` +
        `*🌍 TOOLS*\n• .track - Logistics\n\n` +
        `*🛒 PRODUCTS*\n• .add [name] [type:image|video] [file] [price] - Add product\n` +
        `• .get [name] [minPrice] [maxPrice] - Get products\n` +
        `• .delete [id] - Delete product\n` +
        `• .update [id] [field] [value] - Update product\n\n` +
        `_Reliability first. We no go carry last!_`;

      // optional logo
      const logoPath = path.join(__dirname, '../assets/logo.png');
      return await sock.sendMessage(remoteJid, { 
        image: { url: logoPath },
        caption: menuMsg
      });
    }

    // ==============================
    // COMMAND: .help
    // ==============================
    if (text === 'help') {
      const helpMsg = `*🆘 BOT HELP v5.3*\n\n` +
        `• Type *.menu* to see main commands\n` +
        `• Products: .add, .get, .delete, .update (owner-only)\n` +
        `• Bank info: .pay\n` +
        `• Currency/crypto rates: .rate\n` +
        `• Logistics: .track`;
      return await sock.sendMessage(remoteJid, { text: helpMsg });
    }

    // ==============================
    // OWNER-ONLY: ADD PRODUCT
    // ==============================
    if (text.startsWith('.add')) {
      if (sender !== OWNER_NUMBER) return;
      const args = body.split(' ');
      if (args.length < 5) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .add [name] [type:image|video] [file] [price]" });
      const [_, name, type, file, priceStr] = args;
      const price = parseInt(priceStr);
      addProduct(name, type, file, price);
      return await sock.sendMessage(remoteJid, { text: `✅ Product ${name} added successfully!` });
    }

    // ==============================
    // OWNER-ONLY: DELETE PRODUCT
    // ==============================
    if (text.startsWith('.delete')) {
      if (sender !== OWNER_NUMBER) return;
      const args = body.split(' ');
      if (args.length < 2) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .delete [id]" });
      const id = args[1];
      deleteProduct(id);
      return await sock.sendMessage(remoteJid, { text: `✅ Product ${id} deleted successfully!` });
    }

    // ==============================
    // OWNER-ONLY: UPDATE PRODUCT
    // ==============================
    if (text.startsWith('.update')) {
      if (sender !== OWNER_NUMBER) return;
      const args = body.split(' ');
      if (args.length < 4) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .update [id] [field] [value]" });
      const [_, id, field, ...valueParts] = args;
      const value = valueParts.join(' ');
      updateProduct(id, field, value);
      return await sock.sendMessage(remoteJid, { text: `✅ Product ${id} updated successfully!` });
    }

    // ==============================
    // BANK INFO
    // ==============================
    if (['.pay', '.account'].includes(text)) {
      const payMsg = `*💳 PAYMENT INFO*\n\n🏦 Bank: [BANK NAME]\n🔢 Acc: [NUMBER]\n👤 Name: [NAME]`;
      return await sock.sendMessage(remoteJid, { text: payMsg });
    }

    // ==============================
    // CURRENCY / CRYPTO RATE
    // ==============================
    if (text === '.rate') {
      const rates = await getRate(); // memory will auto-update
      let rateMsg = '*📊 RATES*\n\n';
      for (const [key, val] of Object.entries(rates)) {
        rateMsg += `1 ${key} = ${val}\n`;
      }
      return await sock.sendMessage(remoteJid, { text: rateMsg });
    }

    // ==============================
    // GET PRODUCTS
    // ==============================
    if (text.startsWith('.get')) {
      const args = body.split(' ');
      if (args.length < 2) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .get [name] [minPrice] [maxPrice]" });
      const name = args[1];
      const minPrice = args[2] ? parseInt(args[2]) : 0;
      const maxPrice = args[3] ? parseInt(args[3]) : Infinity;

      const items = getProduct(name, minPrice, maxPrice);
      if (!items.length) return await sock.sendMessage(remoteJid, { text: `❌ No ${name} found in that price range.` });

      for (const item of items) {
        if (item.type === 'image') await sock.sendMessage(remoteJid, { image: { url: item.file }, caption: `${name} - ₦${item.price}` });
        if (item.type === 'video') await sock.sendMessage(remoteJid, { video: { url: item.file }, caption: `${name} - ₦${item.price}` });
      }
      return;
    }

  } catch (err) {
    console.error("Handler Error:", err);
  }
}

module.exports = { handleMessage };