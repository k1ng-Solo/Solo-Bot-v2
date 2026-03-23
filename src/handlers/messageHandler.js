const fetch = require('node-fetch'); 
const translate = require('google-translate-api-x');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// AI CONFIGURATION
// Add your key in Railway Variables as GEMINI_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: "You are a helpful, street-smart business assistant. You speak professional English but understand and can reply in Nigerian Pidgin/Slang when appropriate (like 'how far', 'wetin dey sup'). Be concise."
});

/**
 * PROFESSIONAL BUSINESS ASSISTANT v5.0 (AI ENHANCED)
 */
async function handleMessage(msg, sock) {
  try {
    if (!msg.message) return;
    const body = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text || 
                 msg.message?.imageMessage?.caption || "";
    const text = body.toLowerCase().trim();
    const isImage = !!msg.message?.imageMessage;
    const remoteJid = msg.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    const sender = msg.key.participant || remoteJid;

    // 1. GREETING (Neutral)
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

    // 3. THE COMMAND MENU
    if (text === '.menu' || text === 'help' || text === 'menu') {
      let menuMsg = `*🛠️ BUSINESS ASSISTANT v5.0*\n\n`;
      menuMsg += `*💰 FINANCE*\n• \`.pay\` - Get Account Details\n• \`.rate\` - USD/NGN Rate\n\n`;
      menuMsg += `*🌍 TOOLS*\n• \`.tr [lang] [text]\` - Translator\n• \`.track\` - Logistics\n\n`;
      menuMsg += `*🤖 AI CHAT*\nJust send any message to talk to me!\n\n_Reliability first. We no go carry last!_`;
      return await sock.sendMessage(remoteJid, { text: menuMsg });
    }

    // 4. BANK ACCOUNT INFO (.pay)
    if (text === '.pay' || text === '.account') {
        let payMsg = `*💳 PAYMENT INFO*\n\n🏦 *Bank:* [BANK NAME]\n🔢 *Acc:* [NUMBER]\n👤 *Name:* [NAME]`;
        return await sock.sendMessage(remoteJid, { text: payMsg });
    }

    // 5. DOLLAR RATE (.rate)
    if (text === '.rate') {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        const rate = (data.rates.NGN + 250).toFixed(2); 
        return await sock.sendMessage(remoteJid, { text: `*📊 CURRENT RATE*\n\n1 USD = ₦${rate}` });
    }

    // 6. UNIVERSAL TRANSLATOR (.tr)
    if (text.startsWith('.tr')) {
      const args = body.split(' '); 
      if (args.length < 3) return await sock.sendMessage(remoteJid, { text: "❌ Use: .tr igbo How are you?" });
      const res = await translate(args.slice(2).join(' '), { to: args[1].toLowerCase() });
      return await sock.sendMessage(remoteJid, { text: `*🌍 TRANSLATION*\n\n${res.text}` });
    }

    // ==========================================
    // 7. THE AI "BRAIN" (CATCH-ALL)
    // ==========================================
    // If no command above matched, and it's not a group (or bot is tagged)
    if (body.length > 1 && !text.startsWith('.')) {
        const aiResponse = await chatWithAI(body);
        return await sock.sendMessage(remoteJid, { text: aiResponse });
    }

  } catch (err) { console.error("Handler Error:", err); }
}

async function chatWithAI(text) {
  try {
    const result = await model.generateContent(text);
    return result.response.text();
  } catch (e) {
    console.log("GEMINI ERROR:", e.message);//This shows the Real error in railway logs
    return'Glitch: ${e.message.slice(0,50)}';//This sends the error to ur whatsapp
  }
}

module.exports = { handleMessage };