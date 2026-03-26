const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const translate = require('google-translate-api-x');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getProduct, addProduct, deleteProduct, updateProduct } = require('../utils/memory'); // Smart memory

// ==============================
// CONFIGURATION
// ==============================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: "You are a helpful, street-smart business assistant. Speak professional English but understand Nigerian Pidgin."
});

// ==============================
// MESSAGE HANDLER
// ==============================
async function handleMessage(msg, sock) {
  try {
    if (!msg.message) return;

    const body = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text || 
                 msg.message?.imageMessage?.caption || "";
    const text = body.toLowerCase().trim();
    const remoteJid = msg.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    const sender = msg.key.participant || remoteJid;
    const isImage = !!msg.message?.imageMessage;

    const businessKeywords = ['pay','account','rate','tr','track','paid','proof','alert','done','hi','hello','hey','.menu','help','menu'];

    // ==============================
    // IGNORE GROUPS unless whitelisted
    // ==============================
    const allowedGroups = (process.env.ALLOWED_GROUPS || "").split(",");
    if (isGroup && !allowedGroups.includes(remoteJid)) return;

    const isBusiness = businessKeywords.some(word => text.includes(word));
    if (!isGroup && !isBusiness) return;

    // ==============================
    // GREETING
    // ==============================
    if (["hi","hello","hey"].includes(text)) {
      await sock.sendMessage(remoteJid, {
        text: `🟢 Bot active\n\nType *.menu* to see commands\nType *help* for guidance`
      });
    }

    // ==============================
    // PAYMENT PROOF DETECTION
    // ==============================
    if (isImage && ['paid','proof','alert','done'].some(k => text.includes(k))) {
      await sock.sendMessage(remoteJid, { text: "✅ Payment proof received. Waiting for admin verification." });
      const ownerNum = process.env.OWNER_NUMBER + "@s.whatsapp.net";
      await sock.sendMessage(ownerNum, { text: `🚨 VERIFICATION ALERT: Customer (wa.me/${sender.split('@')[0]}) sent a payment screenshot.` });
      return;
    }

    // ==============================
    // COMMAND MENU
    // ==============================
    if (['.menu','menu'].includes(text)) {
      let menuMsg = `*🛠️ BUSINESS ASSISTANT v5.3*\n\n`;
      menuMsg += `*💰 FINANCE*\n• .pay - Bank info\n• .rate - USD/NGN Rate\n\n`;
      menuMsg += `*🌍 TOOLS*\n• .tr [lang] [text] - Translator\n• .track - Logistics\n\n`;
      menuMsg += `*🛒 PRODUCTS*\n• .add [name] [type] [file] [price] - Add product\n• .get [name] [minPrice] [maxPrice] - Get products\n• .delete [id] - Delete product\n• .update [id] [field] [value] - Update product\n\n`;
      menuMsg += `*🤖 AI CHAT*\nJust type anything (not starting with '.') for AI response\n\n_Reliability first. We no go carry last!_`;
      return await sock.sendMessage(remoteJid, { text: menuMsg });
    }

    // ==============================
    // HELP MENU
    // ==============================
    if (text === 'help') {
      let helpMsg = `*🆘 BOT HELP v5.3*\n\n`;
      helpMsg += `• .menu - Show main commands\n`;
      helpMsg += `• AI Chat: Type normal text (not starting with '.')\n`;
      helpMsg += `• Payment words: paid, proof, alert, done\n`;
      helpMsg += `• Products: .add, .get, .update, .delete\n`;
      helpMsg += `• Translator: .tr [lang] [text]\n`;
      helpMsg += `• Bank info: .pay\n`;
      helpMsg += `• Dollar rate: .rate\n`;
      return await sock.sendMessage(remoteJid, { text: helpMsg });
    }

    // ==============================
    // BANK ACCOUNT INFO
    // ==============================
    if (['.pay','.account'].includes(text)) {
      const payMsg = `*💳 PAYMENT INFO*\n\n🏦 Bank: [BANK NAME]\n🔢 Acc: [NUMBER]\n👤 Name: [NAME]`;
      return await sock.sendMessage(remoteJid, { text: payMsg });
    }

    // ==============================
    // DOLLAR RATE
    // ==============================
    if (text === '.rate') {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const rate = (data.rates.NGN + 250).toFixed(2);
      return await sock.sendMessage(remoteJid, { text: `*📊 CURRENT RATE*\n\n1 USD = ₦${rate}` });
    }

    // ==============================
    // TRANSLATOR
    // ==============================
    if (text.startsWith('.tr')) {
      const args = body.split(' ');
      if (args.length < 3) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .tr [lang] [text]" });
      const res = await translate(args.slice(2).join(' '), { to: args[1].toLowerCase() });
      return await sock.sendMessage(remoteJid, { text: `*🌍 TRANSLATION*\n\n${res.text}` });
    }

    // ==============================
    // ADD PRODUCT
    // ==============================
    if (text.startsWith('.add')) {
      const args = body.split(' ');
      if (args.length < 5) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .add [name] [type:image|video] [filePath] [price]" });
      const [_, name, type, file, priceStr] = args;
      const price = parseInt(priceStr);
      const id = addProduct(name, type, file, price);
      return await sock.sendMessage(remoteJid, { text: `✅ Product ${name} added successfully with ID: ${id}` });
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
      if (!items.length) return await sock.sendMessage(remoteJid, { text: `❌ No ${name} found in that range.` });

      for (const item of items) {
        if (item.type === 'image') await sock.sendMessage(remoteJid, { image: { url: item.file }, caption: `${name} - ₦${item.price} (ID:${item.id})` });
        if (item.type === 'video') await sock.sendMessage(remoteJid, { video: { url: item.file }, caption: `${name} - ₦${item.price} (ID:${item.id})` });
      }
      return;
    }

    // ==============================
    // DELETE PRODUCT
    // ==============================
    if (text.startsWith('.delete')) {
      const args = body.split(' ');
      if (args.length < 2) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .delete [id]" });
      const id = parseInt(args[1]);
      const deleted = deleteProduct(id);
      return await sock.sendMessage(remoteJid, { text: deleted ? `✅ Product ID ${id} deleted.` : `❌ No product with ID ${id}` });
    }

    // ==============================
    // UPDATE PRODUCT
    // ==============================
    if (text.startsWith('.update')) {
      const args = body.split(' ');
      if (args.length < 4) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .update [id] [field] [value]" });
      const id = parseInt(args[1]);
      const field = args[2];
      const value = args.slice(3).join(' ');
      const updated = updateProduct(id, { [field]: field === 'price' ? parseInt(value) : value });
      return await sock.sendMessage(remoteJid, { text: updated ? `✅ Product ID ${id} updated.` : `❌ No product with ID ${id}` });
    }

    // ==============================
    // AI "BRAIN"
    // ==============================
    if (!text.startsWith('.') && body.length > 1) {
      try {
        const result = await model.generateContent(body);
        const reply = result.response.text();
        return await sock.sendMessage(remoteJid, { text: reply });
      } catch (e) {
        console.log("GEMINI ERROR:", e.message);
        return await sock.sendMessage(remoteJid, { text: `Glitch: ${e.message.slice(0,50)}` });
      }
    }

  } catch (err) {
    console.error("Handler Error:", err);
  }
}

module.exports = { handleMessage };