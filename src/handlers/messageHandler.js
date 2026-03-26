const fetch = require('node-fetch');
const translate = require('google-translate-api-x');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getProduct, addProduct } = require('../utils/memory'); // Memory system

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

    const businessKeywords = ['pay', 'account', 'rate', 'tr', 'track', 'paid', 'proof', 'alert', 'done', 'hi', 'hello', 'hey', '.menu', 'help', 'menu'];

    // ==============================
    // IGNORE GROUPS unless whitelisted
    // ==============================
    const allowedGroups = (process.env.ALLOWED_GROUPS || "").split(",");
    if (isGroup && !allowedGroups.includes(remoteJid)) return;

    const isBusiness = businessKeywords.some(word => text.includes(word));
    if (!isGroup && !isBusiness) return; // ignore non-business messages outside groups

    // ==============================
    // GREETING (Hi/Hello/Hey)
    // ==============================
    if (["hi", "hello", "hey"].includes(text)) {
      await sock.sendMessage(remoteJid, {
        text: `🟢 Bot active\n\nType *.menu* to see commands\nType *help* for assistance`
      });
      // no return here — allow AI to respond to other things
    }

    // ==============================
    // PAYMENT PROOF DETECTION
    // ==============================
    if (isImage && ['paid', 'proof', 'alert', 'done'].some(k => text.includes(k))) {
      await sock.sendMessage(remoteJid, {
        text: "✅ Payment proof received. Waiting for admin verification."
      });
      const ownerNum = process.env.OWNER_NUMBER + "@s.whatsapp.net";
      await sock.sendMessage(ownerNum, {
        text: `🚨 VERIFICATION ALERT: Customer (wa.me/${sender.split('@')[0]}) sent a payment screenshot.`
      });
      return;
    }

    // ==============================
    // COMMAND MENU (.menu)
    // ==============================
    if (['.menu', 'menu'].includes(text)) {
      let menuMsg = `*🛠️ BUSINESS ASSISTANT v5.2*\n\n`;
      menuMsg += `*💰 FINANCE*\n• \`.pay\` - Get Account Details\n• \`.rate\` - USD/NGN Rate\n\n`;
      menuMsg += `*🌍 TOOLS*\n• \`.tr [lang] [text]\` - Translator\n• \`.track\` - Logistics\n\n`;
      menuMsg += `*🛒 PRODUCTS*\n• \`.add [name] [type] [file] [price]\` - Add Product\n• \`.get [name] [minPrice] [maxPrice]\` - Get Products\n\n`;
      menuMsg += `*🤖 AI CHAT*\nJust send a message and I’ll respond intelligently.\n\n_Reliability first. We no go carry last!_`;
      return await sock.sendMessage(remoteJid, { text: menuMsg });
    }

    // ==============================
    // HELP MENU (help)
    // ==============================
    if (text === 'help') {
      let helpMsg = `*🆘 BOT HELP v5.2*\n\n`;
      helpMsg += `• Type *.menu* to see main commands\n`;
      helpMsg += `• Business words: paid, proof, alert, done, etc.\n`;
      helpMsg += `• AI Chat: just type anything not starting with '.'\n`;
      helpMsg += `• Products: use .add to save items, .get to retrieve them\n`;
      helpMsg += `• Translator: .tr [lang] [text]\n`;
      helpMsg += `• Bank info: .pay\n`;
      helpMsg += `• Dollar rate: .rate\n`;
      return await sock.sendMessage(remoteJid, { text: helpMsg });
    }

    // ==============================
    // BANK ACCOUNT INFO (.pay / .account)
    // ==============================
    if (['.pay', '.account'].includes(text)) {
      const payMsg = `*💳 PAYMENT INFO*\n\n🏦 Bank: [BANK NAME]\n🔢 Acc: [NUMBER]\n👤 Name: [NAME]`;
      return await sock.sendMessage(remoteJid, { text: payMsg });
    }

    // ==============================
    // DOLLAR RATE (.rate)
    // ==============================
    if (text === '.rate') {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const rate = (data.rates.NGN + 250).toFixed(2); // add your margin
      return await sock.sendMessage(remoteJid, { text: `*📊 CURRENT RATE*\n\n1 USD = ₦${rate}` });
    }

    // ==============================
    // TRANSLATOR (.tr)
    // ==============================
    if (text.startsWith('.tr')) {
      const args = body.split(' ');
      if (args.length < 3) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .tr [lang] [text]" });
      const res = await translate(args.slice(2).join(' '), { to: args[1].toLowerCase() });
      return await sock.sendMessage(remoteJid, { text: `*🌍 TRANSLATION*\n\n${res.text}` });
    }

    // ==============================
    // ADD PRODUCT (.add)
    // ==============================
    if (text.startsWith('.add')) {
      const args = body.split(' ');
      if (args.length < 5) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .add [name] [type:image|video] [filePath] [price]" });
      const [_, name, type, file, priceStr] = args;
      const price = parseInt(priceStr);
      addProduct(name, type, file, price);
      return await sock.sendMessage(remoteJid, { text: `✅ Product ${name} added successfully!` });
    }

    // ==============================
    // GET PRODUCT (.get)
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
    // AI "BRAIN" (catch-all)
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