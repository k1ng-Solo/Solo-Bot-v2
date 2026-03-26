const fetch = require('node-fetch');
const { getProduct, addProduct, deleteProduct, updateProduct, saveRate, getRate } = require('./memory');

// ==============================
// GLOBAL CONFIG
// ==============================
const OWNER_NUMBER = process.env.OWNER_NUMBER + '@s.whatsapp.net';
const BUSINESS_NAME = process.env.BUSINESS_NAME || "Your Business";
const BANK_NAME = process.env.BANK_NAME || "[BANK NAME]";
const ACCOUNT_NUMBER = process.env.ACCOUNT_NUMBER || "[NUMBER]";
const ACCOUNT_NAME = process.env.ACCOUNT_NAME || "[NAME]";

// All greetings worldwide
const GREETINGS = [
  "hi", "hello", "hey", "hola", "bonjour", "hallo", "ciao", "namaste", "shalom",
  "salaam", "konichiwa", "annyeong", "hej", "ola", "merhaba", "xin chào", "yassas"
];

// ==============================
// HANDLE MESSAGES
// ==============================
async function handleMessage(msg, sock) {
  if (!msg.message) return;

  const body =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    msg.message.imageMessage?.caption ||
    "";
  const text = body.toLowerCase().trim();
  const remoteJid = msg.key.remoteJid;
  const sender = msg.key.participant || remoteJid;
  const isImage = !!msg.message.imageMessage;
  const isOwner = sender === OWNER_NUMBER;

  // ==============================
  // GREETING
  // ==============================
  if (GREETINGS.includes(text)) {
    return await sock.sendMessage(remoteJid, {
      text: `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands. And .help for guidance`
    });
  }

  // ==============================
  // COMMANDS
  // ==============================
  if (text === '.menu' || text === 'menu') {
    let menuMsg = `*🛠️ ${BUSINESS_NAME} Assistant*\n\n`;
    menuMsg += `*💰 FINANCE*\n• .pay - Bank info\n• .rate - Currency / Crypto Rates\n\n`;
    menuMsg += `*🛒 PRODUCTS*\n• .add [name] [type] [file] [price] - Add product (Owner only)\n`;
    menuMsg += `• .get [name] [minPrice] [maxPrice] - Get products\n`;
    menuMsg += `• .delete [id] - Delete product (Owner only)\n`;
    menuMsg += `• .update [id] [field] [value] - Update product (Owner only)\n\n`;
    menuMsg += `*ℹ️ HELP*\n• .help - Guidance & Commands`;
    return await sock.sendMessage(remoteJid, { text: menuMsg });
  }

  if (text === '.help' || text === 'help') {
    let helpMsg = `*🆘 HELP*\n\n`;
    helpMsg += `• Greetings: hi, hello, hey, etc.\n`;
    helpMsg += `• Products: .add, .get, .delete, .update\n`;
    helpMsg += `• Currency & Crypto Rates: .rate\n`;
    helpMsg += `• Bank Info: .pay\n`;
    return await sock.sendMessage(remoteJid, { text: helpMsg });
  }

  // ==============================
  // BANK INFO
  // ==============================
  if (text === '.pay') {
    return await sock.sendMessage(remoteJid, {
      text: `*💳 PAYMENT INFO*\n\n🏦 Bank: ${BANK_NAME}\n🔢 Acc: ${ACCOUNT_NUMBER}\n👤 Name: ${ACCOUNT_NAME}`
    });
  }

  // ==============================
  // MULTI-CURRENCY / CRYPTO RATE
  // ==============================
  if (text.startsWith('.rate')) {
    const args = body.split(' ');
    if (args.length < 2) return await sock.sendMessage(remoteJid, {
      text: "Usage: .rate [CURRENCY_CODE or CRYPTO] e.g. USD, EUR, BTC"
    });

    const currency = args[1].toUpperCase();
    let rate = getRate(currency);

    if (!rate) {
      try {
        // Fiat currencies
        if (currency !== 'BTC' && currency !== 'ETH') {
          const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          const data = await res.json();
          rate = data.rates[currency];
        } else {
          // Crypto
          const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${currency.toLowerCase()}&vs_currencies=usd`);
          const data = await res.json();
          rate = data[currency.toLowerCase()].usd;
        }
        if (rate) saveRate(currency, rate);
      } catch (e) {
        return await sock.sendMessage(remoteJid, { text: "Error fetching rate. Try again later." });
      }
    }

    return await sock.sendMessage(remoteJid, {
      text: `*📊 CURRENT RATE*\n1 ${currency} = $${rate}`
    });
  }

  // ==============================
  // PRODUCT MANAGEMENT
  // ==============================
  if (text.startsWith('.add') && isOwner) {
    const args = body.split(' ');
    if (args.length < 5) return await sock.sendMessage(remoteJid, { text: "Usage: .add [name] [type:image|video] [filePath] [price]" });
    const [_, name, type, file, priceStr] = args;
    const price = parseInt(priceStr);
    addProduct(name, type, file, price);
    return await sock.sendMessage(remoteJid, { text: `✅ Product ${name} added successfully!` });
  }

  if (text.startsWith('.get')) {
    const args = body.split(' ');
    if (args.length < 2) return await sock.sendMessage(remoteJid, { text: "Usage: .get [name] [minPrice] [maxPrice]" });
    const name = args[1];
    const minPrice = args[2] ? parseInt(args[2]) : 0;
    const maxPrice = args[3] ? parseInt(args[3]) : Infinity;
    const items = getProduct(name, minPrice, maxPrice);
    if (!items.length) return await sock.sendMessage(remoteJid, { text: `❌ No products found.` });

    for (const item of items) {
      if (item.type === 'image') await sock.sendMessage(remoteJid, { image: { url: item.file }, caption: `${item.name} - ₦${item.price}` });
      if (item.type === 'video') await sock.sendMessage(remoteJid, { video: { url: item.file }, caption: `${item.name} - ₦${item.price}` });
    }
    return;
  }

  if (text.startsWith('.delete') && isOwner) {
    const id = body.split(' ')[1];
    if (!id) return await sock.sendMessage(remoteJid, { text: "Usage: .delete [id]" });
    deleteProduct(id);
    return await sock.sendMessage(remoteJid, { text: `✅ Product ${id} deleted!` });
  }

  if (text.startsWith('.update') && isOwner) {
    const [_, id, field, ...valueArr] = body.split(' ');
    const value = valueArr.join(' ');
    if (!id || !field || !value) return await sock.sendMessage(remoteJid, { text: "Usage: .update [id] [field] [value]" });
    const ok = updateProduct(id, field, value);
    return await sock.sendMessage(remoteJid, { text: ok ? `✅ Product updated!` : `❌ Product not found.` });
  }
}

module.exports = { handleMessage };