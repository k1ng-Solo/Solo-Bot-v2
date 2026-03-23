const fetch = require('node-fetch'); 
const translate = require('google-translate-api-x');

/**
 * PROFESSIONAL BUSINESS ASSISTANT v4.0
 * Features: Payments, Logistics, Translation, and Rates
 */
async function handleMessage(msg, sock) {
  try {
    const body = msg.message?.conversation || 
                 msg.message?.extendedTextMessage?.text || 
                 msg.message?.imageMessage?.caption || "";
    const text = body.toLowerCase().trim();
    const isImage = !!msg.message?.imageMessage;
    const remoteJid = msg.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');
    const sender = msg.key.participant || remoteJid;

    // 1. AUTO-SAVE / GREETING (Neutral)
    if (!isGroup && (text === 'hi' || text === 'hello' || text === 'hey')) {
        await sock.sendMessage(remoteJid, { 
            text: `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands.` 
        });
        return;
    }

    // 2. PAYMENT PROOF DETECTION
    if (isImage && (text.includes('paid') || text.includes('proof') || text.includes('alert') || text.includes('done'))) {
        await sock.sendMessage(remoteJid, { text: "✅ *Payment Proof Received.*\n\nWaiting for manual verification by the admin. Please hold." });
        
        const ownerNum = process.env.OWNER_NUMBER + "@s.whatsapp.net";
        await sock.sendMessage(ownerNum, { 
            text: `🚨 *VERIFICATION ALERT:* A customer (wa.me/${sender.split('@')[0]}) has sent a payment screenshot. Please check.` 
        });
        return;
    }

    // 3. NAIJA SLANGS (Street-Smart Response)
    const wasSlang = await handleNaijaSlang(text, remoteJid, sock);
    if (wasSlang) return;

    // 4. THE COMMAND MENU (Professional Layout)
    if (text === '.menu' || text === 'help' || text === 'menu') {
      let menuMsg = `*🛠️ BUSINESS ASSISTANT v4.0*\n\n`;
      menuMsg += `*💰 FINANCE*\n• \`.pay\` - Get Account Details\n• \`.rate\` - Check USD/NGN Rate\n\n`;
      menuMsg += `*🌍 TOOLS*\n• \`.tr [lang] [text]\` - Universal Translator\n• \`.track\` - Delivery/Logistics Info\n\n`;
      
      if (isGroup) {
        menuMsg += `*🛡️ ADMIN TOOLS*\n• \`.tagall\` | \`.kick\` | \`.promote\`\n\n`;
      }
      
      menuMsg += `*📞 CONTACT*\n• \`.owner\` - Talk to the Boss\n\n`;
      menuMsg += `_Reliability first. We no go carry last!_ 🏃‍♂️`;
      return await sock.sendMessage(remoteJid, { text: menuMsg });
    }

    // 5. BANK ACCOUNT INFO (.pay)
    if (text === '.pay' || text === '.account' || text === 'payment') {
        let payMsg = `*💳 OFFICIAL PAYMENT INFO*\n\n`;
        payMsg += `🏦 *Bank:* [ENTER BANK NAME HERE]\n`;
        payMsg += `🔢 *Account:* [ENTER ACCOUNT NUMBER]\n`;
        payMsg += `👤 *Name:* [ENTER ACCOUNT NAME]\n\n`;
        payMsg += `_Once payment is made, send the screenshot/receipt here for confirmation._ ✅`;
        return await sock.sendMessage(remoteJid, { text: payMsg });
    }

    // 6. DELIVERY / LOGISTICS INFO
    if (text === '.track' || text === 'delivery') {
        return await sock.sendMessage(remoteJid, { 
            text: `🚚 *LOGISTICS STATUS*\n\nStandard Delivery: 1-5 working days depending on location.\n\nPlease provide your *Order ID* for a real-time update.` 
        });
    }

    // 7. UNIVERSAL TRANSLATOR (.tr [lang] [text])
    if (text.startsWith('.tr')) {
      const args = body.split(' '); 
      if (args.length < 3) return await sock.sendMessage(remoteJid, { text: "❌ Format: \`.tr [language] [text]\` \nExample: \`.tr igbo How are you?\`" });
      const targetLang = args[1].toLowerCase();
      const textToTranslate = args.slice(2).join(' ');
      try {
        const res = await translate(textToTranslate, { to: targetLang });
        return await sock.sendMessage(remoteJid, { text: `*🌍 TRANSLATION [${targetLang.toUpperCase()}]*\n\n${res.text}` });
      } catch (e) { return await sock.sendMessage(remoteJid, { text: "💔 Language error! Check spelling." }); }
    }

    // 8. DOLLAR RATE (.rate)
    if (text === '.rate') {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        const rate = (data.rates.NGN + 250).toFixed(2); 
        return await sock.sendMessage(remoteJid, { text: `*📊 CURRENT RATE*\n\n1 USD = ₦${rate} (Market Rate)` });
      } catch (e) { return await sock.sendMessage(remoteJid, { text: "Network error fetching rates." }); }
    }

  } catch (err) { console.error(err); }
}

async function handleNaijaSlang(text, remoteJid, sock) {
    if (text.includes('how far') || text.includes('wetin dey sup')) {
      await sock.sendMessage(remoteJid, { text: "Everything clear. How I fit help you today?" });
      return true;
    }
    if (text.includes('oshey') || text.includes('adupe')) {
      await sock.sendMessage(remoteJid, { text: "Respect! 🫡 We dey for you." });
      return true;
    }
    return false;
}

module.exports = { handleMessage };