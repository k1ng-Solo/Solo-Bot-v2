const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { getProduct, addProduct, deleteProduct, updateProduct, getCurrencies, addCurrency } = require('../utils/memory');

// ==============================
// CONFIGURATION
// ==============================
const OWNER_NUMBER = process.env.OWNER_NUMBER + "@s.whatsapp.net";

// ==============================
// GLOBAL GREETINGS
// ==============================
const greetings = [
  "hi", "hello", "hey", "hwfr", "hw fa", "hw fr", "how far", "wassup", "wagwan", "hyd",
  "hola", "bonjour", "ciao", "hallo", "salaam", "namaste", "konnichiwa", "olá", "shalom"
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
    const sender = msg.key.participant || remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    const isImage = !!msg.message?.imageMessage;

    // ==============================
    // FIRST-TIME GREETING / SYSTEM ACTIVE
    // ==============================
    if (greetings.includes(text)) {
      const greetMsg = `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands. And *.help* for guidance.`;
      await sock.sendMessage(remoteJid, { text: greetMsg });
      return;
    }

    // ==============================
    // COMMAND MENU
    // ==============================
    if (text === '.menu' || text === 'menu') {
      let menuMsg = `*🛠️ BUSINESS ASSISTANT v5.3*\n\n`;

      menuMsg += `*💰 FINANCE*\n• .pay - Bank info\n• .rate - Exchange rates (All currencies & crypto)\n\n`;
      menuMsg += `*🛒 PRODUCTS*\n• .add [name] [type:image|video] [file] [price] - Add product (Owner only)\n`;
      menuMsg += `• .get [name] [minPrice] [maxPrice] - Get products\n`;
      menuMsg += `• .delete [id] - Delete product (Owner only)\n`;
      menuMsg += `• .update [id] [field] [value] - Update product (Owner only)\n\n`;
      menuMsg += `Type *.help* for guidance`;

      // Optional: send business logo image first if you have one saved in memory
      const logoPath = path.join(__dirname, '../utils/logo.jpg');
      if (fs.existsSync(logoPath)) {
        await sock.sendMessage(remoteJid, { image: { url: logoPath }, caption: menuMsg });
      } else {
        await sock.sendMessage(remoteJid, { text: menuMsg });
      }
      return;
    }

    // ==============================
    // HELP MENU
    // ==============================
    if (text === 'help' || text === '.help') {
      const helpMsg = `*🆘 BOT HELP v5.3*\n\n` +
        `• Type *.menu* to see main commands\n` +
        `• Product commands (.add, .get, .delete, .update) are owner-only for security\n` +
        `• Use *.rate* to see exchange rates or crypto rates\n` +
        `• Greeting triggers SYSTEM ACTIVE message\n` +
        `• Payments: .pay\n` +
        `• Contact admin for any assistance`;
      await sock.sendMessage(remoteJid, { text: helpMsg });
      return;
    }

    // ==============================
    // BANK ACCOUNT INFO
    // ==============================
    if (text === '.pay' || text === '.account') {
      const payMsg = `*💳 PAYMENT INFO*\n\n🏦 Bank: [BANK NAME]\n🔢 Acc: [NUMBER]\n👤 Name: [NAME]\n📞 Phone: [NUMBER]`;
      return await sock.sendMessage(remoteJid, { text: payMsg });
    }

    // ==============================
    // ADD PRODUCT (Owner only)
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
    // DELETE PRODUCT (Owner only)
    // ==============================
    if (text.startsWith('.delete')) {
      if (sender !== OWNER_NUMBER) return;
      const args = body.split(' ');
      if (args.length < 2) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .delete [id]" });
      const id = args[1];
      deleteProduct(id);
      return await sock.sendMessage(remoteJid, { text: `✅ Product ${id} deleted.` });
    }

    // ==============================
    // UPDATE PRODUCT (Owner only)
    // ==============================
    if (text.startsWith('.update')) {
      if (sender !== OWNER_NUMBER) return;
      const args = body.split(' ');
      if (args.length < 4) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .update [id] [field] [value]" });
      const [_, id, field, ...value] = args;
      updateProduct(id, field, value.join(' '));
      return await sock.sendMessage(remoteJid, { text: `✅ Product ${id} updated.` });
    }

    // ==============================
    // GET PRODUCT
    // ==============================
    if (text.startsWith('.get')) {
      const args = body.split(' ');
      if (args.length < 2) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .get [name] [minPrice] [maxPrice]" });
      const name = args[1];
      const minPrice = args[2] ? parseInt(args[2]) : 0;
      const maxPrice = args[3] ? parseInt(args[3]) : Infinity;

      const items = getProduct(name, minPrice, maxPrice);
      if (items.length === 0) return await sock.sendMessage(remoteJid, { text: `❌ No ${name} found in that price range.` });

      for (const item of items) {
        if (item.type === 'image') await sock.sendMessage(remoteJid, { image: { url: item.file }, caption: `${name} - ₦${item.price}` });
        if (item.type === 'video') await sock.sendMessage(remoteJid, { video: { url: item.file }, caption: `${name} - ₦${item.price}` });
      }
      return;
    }

    // ==============================
    // CURRENCY / CRYPTO RATE (.rate)
    // ==============================
    if (text.startsWith('.rate')) {
      // Load known currencies from memory
      let currencies = getCurrencies(); // returns array of { code, name, lastRate }

      // Fetch latest rates (USD base)
      const response = await fetch('https://api.exchangerate.host/latest');
      const data = await response.json();
      for (const code in data.rates) {
        if (!currencies.find(c => c.code === code)) addCurrency(code, data.rates[code]);
      }
      currencies = getCurrencies();

      // Send numbered list to user
      let rateMsg = '*Select currency/crypto to see rate:*\n';
      currencies.forEach((c, i) => rateMsg += `${i+1}️⃣ ${c.code}\n`);
      await sock.sendMessage(remoteJid, { text: rateMsg });

      // You would add next steps: wait for reply, choose payment method, then show rate
      return;
    }

  } catch (err) {
    console.error("Handler Error:", err);
  }
}

module.exports = { handleMessage };