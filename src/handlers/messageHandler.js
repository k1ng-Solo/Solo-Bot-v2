const fetch = require('node-fetch'); 
const translate = require('google-translate-api-x');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getProduct, addProduct } = require('../utils/memory'); // Memory system

// AI CONFIGURATION
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "You are a helpful, street-smart business assistant. Speak professional English but understand Nigerian Pidgin."
});

/**
 * PROFESSIONAL BUSINESS ASSISTANT v5.2 (AI + MEMORY + BUSINESS)
 */
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

    const businesskeywords = ['pay', 'account', 'rate', 'tr', 'track', 'paid', 'proof', 'alert', 'done','hi', 'hello', 'hey', '.menu', 'help', 'menu'];

    // IGNORE GROUPS unless whitelisted
    const allowedGroups = (process.env.ALLOWED_GROUPS || "").split(","); 
    if (isGroup && !allowedGroups.includes(remoteJid)) return;

    const isBusiness = businesskeywords.some(word => text.includes(word));
    if (!isGroup && !isBusiness) return;

    // 1. GREETING
    if (!isGroup && (text === 'hi' || text === 'hello' || text === 'hey')) {
        return await sock.sendMessage(remoteJid, { 
            text: `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Type *.menu* for all commands or just talk to me!` 
        });
    }

    // 2. PAYMENT PROOF DETECTION
    if (isImage && (text.includes('paid') || text.includes('proof') || text.includes('alert') || text.includes('done'))) {
        await sock.sendMessage(remoteJid, { text: "✅ *Payment Proof Received.*\n\nWaiting for manual verification by the admin." });
        const ownerNum = process.env.OWNER_NUMBER + "@s.whatsapp.net";
        return await sock.sendMessage(ownerNum, { 
            text: `🚨 *VERIFICATION ALERT:* A customer (wa.me/${sender.split('@')[0]}) sent a payment screenshot.` 
        });
    }

    // 3. COMMAND MENU
    if (text === '.menu' || text === 'help' || text === 'menu') {
      let menuMsg = `*🛠️ BUSINESS ASSISTANT v5.2*\n\n`;
      menuMsg += `*💰 FINANCE*\n• \`.pay\` - Get Account Details\n• \`.rate\` - USD/NGN Rate\n\n`;
      menuMsg += `*🌍 TOOLS*\n• \`.tr [lang] [text]\` - Translator\n• \`.track\` - Logistics\n\n`;
      menuMsg += `*🛒 PRODUCTS*\n• \`.add [name] [type] [file] [price]\` - Add Product\n• \`.get [name] [minPrice] [maxPrice]\` - Get Products\n\n`;
      menuMsg += `*🤖 AI CHAT*\nJust send any message to talk to me!\n\n_Reliability first. We no go carry last!_`;
      return await sock.sendMessage(remoteJid, { text: menuMsg });
    }

    // 4. BANK ACCOUNT INFO
    if (text === '.pay' || text === '.account') {
        let payMsg = `*💳 PAYMENT INFO*\n\n🏦 *Bank:* [BANK NAME]\n🔢 *Acc:* [NUMBER]\n👤 *Name:* [NAME]`;
        return await sock.sendMessage(remoteJid, { text: payMsg });
    }

    // 5. DOLLAR RATE
    if (text === '.rate') {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        const rate = (data.rates.NGN + 250).toFixed(2); 
        return await sock.sendMessage(remoteJid, { text: `*📊 CURRENT RATE*\n\n1 USD = ₦${rate}` });
    }

    // 6. UNIVERSAL TRANSLATOR
    if (text.startsWith('.tr')) {
      const args = body.split(' '); 
      if (args.length < 3) return await sock.sendMessage(remoteJid, { text: "❌ Use: .tr igbo How are you?" });
      const res = await translate(args.slice(2).join(' '), { to: args[1].toLowerCase() });
      return await sock.sendMessage(remoteJid, { text: `*🌍 TRANSLATION*\n\n${res.text}` });
    }

    // 7. ADD PRODUCT (.add)
    if (text.startsWith('.add')) {
      const args = body.split(' ');
      if (args.length < 5) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .add [name] [type:image|video] [filePath] [price]" });
      const [_, name, type, file, priceStr] = args;
      const price = parseInt(priceStr);
      addProduct(name, type, file, price);
      return await sock.sendMessage(remoteJid, { text: `✅ Product ${name} added successfully!` });
    }

    // 8. GET PRODUCT (.get)
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

    // 9. AI "BRAIN" for everything else
    if (body.length > 1 && !text.startsWith('.')) {
        const aiResponse = await chatWithAI(body);
        return await sock.sendMessage(remoteJid, { text: aiResponse });
    }

  } catch (err) { console.error("Handler Error:", err); }
}

async function chatWithAI(text) {
  try {
    const result = await model.generateMessage({ input: text }); // ✅ Fixed method
    return result.output_text || "🤖 Sorry, I couldn't process that.";
  } catch (e) {
    console.log("GEMINI ERROR:", e.message);
    return `Glitch: ${e.message.slice(0,50)}`;
  }
}

module.exports = { handleMessage };