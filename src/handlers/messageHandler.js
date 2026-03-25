const fetch = require('node-fetch');
const translate = require('google-translate-api-x');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getProduct, addProduct } = require('../utils/memory');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "You are a helpful, street-smart business assistant. Speak professional English but understand Nigerian Pidgin."
});

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

    const businesskeywords = ['pay','account','rate','tr','track','paid','proof','alert','done','hi','hello','hey','.menu','help','menu'];
    const allowedGroups = (process.env.ALLOWED_GROUPS || "").split(","); 
    if (isGroup && !allowedGroups.includes(remoteJid)) return;
    if (!isGroup && !businesskeywords.some(word => text.includes(word))) return;

    // GREETING
    if (!isGroup && ['hi','hello','hey'].includes(text)) {
        return sock.sendMessage(remoteJid, { text: "*SYSTEM ACTIVE* 🟢\nWelcome to our official business assistant. Type *.menu* for commands!" });
    }

    // PAYMENT PROOF
    if (isImage && ['paid','proof','alert','done'].some(word => text.includes(word))) {
        await sock.sendMessage(remoteJid, { text: "✅ *Payment Proof Received.* Waiting for admin verification." });
        return sock.sendMessage(process.env.OWNER_NUMBER + "@s.whatsapp.net", { text: `🚨 Verification alert from wa.me/${sender.split('@')[0]}` });
    }

    // MENU
    if (['.menu','help','menu'].includes(text)) {
        let menuMsg = "*🛠️ BUSINESS ASSISTANT v5.1*\n\n";
        menuMsg += "💰 FINANCE\n• `.pay` - Account Details\n• `.rate` - USD/NGN Rate\n\n";
        menuMsg += "🌍 TOOLS\n• `.tr [lang] [text]` - Translator\n• `.track` - Logistics\n\n";
        menuMsg += "🛒 PRODUCTS\n• `.add [name] [type] [file] [price]` - Add Product\n• `.get [name] [minPrice] [maxPrice]` - Get Products\n\n";
        menuMsg += "🤖 AI CHAT\nSend any message to chat with AI.\n_Reliability first!_";
        return sock.sendMessage(remoteJid, { text: menuMsg });
    }

    // PAYMENT INFO
    if (['.pay','.account'].includes(text)) {
        return sock.sendMessage(remoteJid, { text: "💳 PAYMENT INFO\n🏦 Bank: [BANK NAME]\n🔢 Acc: [NUMBER]\n👤 Name: [NAME]" });
    }

    // RATE
    if (text === '.rate') {
        const data = await fetch('https://api.exchangerate-api.com/v4/latest/USD').then(res => res.json());
        const rate = (data.rates.NGN + 250).toFixed(2);
        return sock.sendMessage(remoteJid, { text: `📊 CURRENT RATE\n1 USD = ₦${rate}` });
    }

    // TRANSLATOR
    if (text.startsWith('.tr')) {
        const args = body.split(' ');
        if (args.length < 3) return sock.sendMessage(remoteJid, { text: "❌ Use: .tr igbo How are you?" });
        const res = await translate(args.slice(2).join(' '), { to: args[1].toLowerCase() });
        return sock.sendMessage(remoteJid, { text: `🌍 TRANSLATION\n${res.text}` });
    }

    // ADD PRODUCT
    if (text.startsWith('.add')) {
        const args = body.split(' ');
        if (args.length < 5) return sock.sendMessage(remoteJid, { text: "❌ Usage: .add [name] [type:image|video] [file] [price]" });
        addProduct(args[1], args[2], args[3], parseInt(args[4]));
        return sock.sendMessage(remoteJid, { text: `✅ Product ${args[1]} added!` });
    }

    // GET PRODUCT
    if (text.startsWith('.get')) {
        const args = body.split(' ');
        const name = args[1], min = args[2] ? parseInt(args[2]) : 0, max = args[3] ? parseInt(args[3]) : Infinity;
        const items = getProduct(name, min, max);
        if (!items.length) return sock.sendMessage(remoteJid, { text: `❌ No ${name} found in that price range.` });
        for (const i of items) {
            if (i.type === 'image') await sock.sendMessage(remoteJid, { image:{url:i.file}, caption:`${name} - ₦${i.price}` });
            if (i.type === 'video') await sock.sendMessage(remoteJid, { video:{url:i.file}, caption:`${name} - ₦${i.price}` });
        }
        return;
    }

    // AI CHAT
    if (body.length > 1 && !text.startsWith('.')) {
        const aiResponse = await chatWithAI(body);
        return sock.sendMessage(remoteJid, { text: aiResponse });
    }

  } catch (err) { console.error("Handler Error:", err); }
}

async function chatWithAI(text) {
  try {
    const result = await model.generateContent(text);
    return result.response.text();
  } catch (e) {
    console.log("GEMINI ERROR:", e.message);
    return `Glitch: ${e.message.slice(0,50)}`;
  }
}

module.exports = { handleMessage };