const fetch = require('node-fetch');
const { loadProducts, saveProducts, loadCurrencies, saveCurrencies } = require('../utils/memory');

// ==============================
// CONFIGURATION
// ==============================
const OWNER_NUMBER = process.env.OWNER_NUMBER; // must be set
const greetings = [
  "hi","hello","hey","hwfr","hw fa","hw fr","how far","wassup","wagwan","hyd",
  "hola","bonjour","ciao","hallo","namaste","konichiwa","shalom","salaam","sawubona"
];

// ==============================
// HELPER: check owner
// ==============================
function isOwner(sender) {
  return sender.includes(OWNER_NUMBER);
}

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
    // GREETINGS & SYSTEM ACTIVE
    // ==============================
    if (greetings.includes(text)) {
      const sysMsg = `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands. And *help* for guidance.`;
      return await sock.sendMessage(remoteJid, { text: sysMsg });
    }

    // ==============================
    // COMMAND MENU (.menu)
    // ==============================
    if (['.menu','menu'].includes(text)) {
      const menuMsg = `*🛠️ BUSINESS ASSISTANT v5.4*\n\n` +
        `*💰 FINANCE*\n• .pay - Bank info\n• .rate - Currencies / Crypto\n\n` +
        `*🛒 PRODUCTS*\n• .add [name] [type:image|video] [file] [price] - Add product (owner only)\n` +
        `• .get [name] [minPrice] [maxPrice] - Get products\n` +
        `• .delete [id] - Delete product (owner only)\n` +
        `• .update [id] [field] [value] - Update product (owner only)\n\n` +
        `*🤖 GENERAL*\n• Just greet or type your message for interaction\n\n` +
        `_Reliability first. We no go carry last!_`;
      return await sock.sendMessage(remoteJid, { text: menuMsg });
    }

    // ==============================
    // HELP MENU
    // ==============================
    if (text === 'help') {
      const helpMsg = `*🆘 BOT HELP v5.4*\n\n` +
        `• Type *.menu* to see main commands\n` +
        `• Products: .add, .get, .delete, .update\n` +
        `• Bank info: .pay\n` +
        `• Currencies & crypto: .rate [symbol]\n` +
        `• Just greet to activate system message\n` +
        `_Owner-only functions are restricted to the business owner_`;
      return await sock.sendMessage(remoteJid, { text: helpMsg });
    }

    // ==============================
    // BANK INFO
    // ==============================
    if (['.pay','.account'].includes(text)) {
      const payMsg = `*💳 PAYMENT INFO*\n\n🏦 Bank: [BANK NAME]\n🔢 Acc: [NUMBER]\n👤 Name: [NAME]`;
      return await sock.sendMessage(remoteJid, { text: payMsg });
    }

    // ==============================
    // RATE / CURRENCIES
    // ==============================
    if (text.startsWith('.rate')) {
      let args = body.split(' ');
      let currencies = loadCurrencies();

      // Just ".rate" -> show list
      if (args.length === 1) {
        const msgText = `*💱 AVAILABLE CURRENCIES / CRYPTO*\n\n${currencies.join(", ")}\n\nType a currency symbol after .rate to get live rate.`;
        return await sock.sendMessage(remoteJid, { text: msgText });
      }

      // ".rate USD" -> fetch live rate
      const symbol = args[1].toUpperCase();
      if (!currencies.includes(symbol)) {
        currencies.push(symbol);
        saveCurrencies(currencies); // auto-learn new currency
      }

      try {
        let rate;
        if (["BTC","ETH"].includes(symbol)) {
          // fetch crypto price from coingecko
          const resp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=ngn`);
          const data = await resp.json();
          rate = data[symbol.toLowerCase()]?.ngn;
        } else {
          // fetch currency exchange rate USD -> symbol
          const resp = await fetch(`https://api.exchangerate.host/latest?base=USD&symbols=${symbol}`);
          const data = await resp.json();
          rate = data.rates[symbol];
        }
        if (!rate) throw new Error("Rate not found");
        return await sock.sendMessage(remoteJid, { text: `*💱 RATE*\n\n1 ${symbol} = ₦${(rate * 800).toFixed(2)} approx` });
      } catch (e) {
        return await sock.sendMessage(remoteJid, { text: `❌ Could not fetch rate for ${symbol}.` });
      }
    }

    // ==============================
    // PRODUCT FUNCTIONS (owner-only for add/delete/update)
    // ==============================
    if (text.startsWith('.add')) {
      if (!isOwner(sender)) return;
      const args = body.split(' ');
      if (args.length < 5) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .add [name] [type] [file] [price]" });
      const [_, name, type, file, priceStr] = args;
      const price = parseInt(priceStr);
      const products = loadProducts();
      products.push({ id: Date.now(), name, type, file, price });
      saveProducts(products);
      return await sock.sendMessage(remoteJid, { text: `✅ Product ${name} added successfully!` });
    }

    if (text.startsWith('.get')) {
      const args = body.split(' ');
      if (args.length < 2) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .get [name] [minPrice] [maxPrice]" });
      const name = args[1].toLowerCase();
      const minPrice = args[2] ? parseInt(args[2]) : 0;
      const maxPrice = args[3] ? parseInt(args[3]) : Infinity;
      const products = loadProducts().filter(p => p.name.toLowerCase().includes(name) && p.price >= minPrice && p.price <= maxPrice);
      if (!products.length) return await sock.sendMessage(remoteJid, { text: `❌ No ${name} found.` });

      for (const p of products) {
        if (p.type === 'image') await sock.sendMessage(remoteJid, { image: { url: p.file }, caption: `${p.name} - ₦${p.price}` });
        if (p.type === 'video') await sock.sendMessage(remoteJid, { video: { url: p.file }, caption: `${p.name} - ₦${p.price}` });
      }
      return;
    }

    if (text.startsWith('.delete')) {
      if (!isOwner(sender)) return;
      const args = body.split(' ');
      const id = parseInt(args[1]);
      let products = loadProducts();
      products = products.filter(p => p.id !== id);
      saveProducts(products);
      return await sock.sendMessage(remoteJid, { text: `✅ Product ID ${id} deleted.` });
    }

    if (text.startsWith('.update')) {
      if (!isOwner(sender)) return;
      const args = body.split(' ');
      const id = parseInt(args[1]);
      const field = args[2];
      const value = args.slice(3).join(' ');
      const products = loadProducts();
      const product = products.find(p => p.id === id);
      if (!product) return await sock.sendMessage(remoteJid, { text: `❌ Product ID ${id} not found.` });
      product[field] = field === 'price' ? parseInt(value) : value;
      saveProducts(products);
      return await sock.sendMessage(remoteJid, { text: `✅ Product ID ${id} updated.` });
    }

  } catch (err) {
    console.error("Handler Error:", err);
  }
}

module.exports = { handleMessage };