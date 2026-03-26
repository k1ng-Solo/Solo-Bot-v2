const { getProduct, addProduct, deleteProduct, updateProduct } = require('../utils/memory'); // Memory system

// ==============================
// GLOBAL GREETINGS
// ==============================
const greetings = [
  "hi", "hello", "hey", "hiya", "yo", "wassup", "greetings",
  "hola", "bonjour", "ciao", "hallo", "namaste", "salut", "aloha",
  "konnichiwa", "olá", "merhaba", "salaam", "shalom", "hej", "god dag",
  "privet", "ni hao", "annyeong", "sawubona", "sup"
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

    const businessKeywords = ['pay', 'account', 'rate', 'tr', 'track', 'paid', 'proof', 'alert', 'done', '.menu', 'help', 'menu'];

    // ==============================
    // IGNORE GROUPS unless whitelisted
    // ==============================
    const allowedGroups = (process.env.ALLOWED_GROUPS || "").split(",");
    if (isGroup && !allowedGroups.includes(remoteJid)) return;

    // ==============================
    // SYSTEM ACTIVE MESSAGE (first text)
    // ==============================
    if (text.length > 0 && greetings.includes(text)) {
      await sock.sendMessage(remoteJid, {
        text: `*SYSTEM ACTIVE* 🟢\n\nWelcome to our official business assistant. Please state your name and how we can help you.\n\nType *.menu* for all commands.`
      });
      return;
    }

    // ==============================
    // GREETINGS (worldwide)
    // ==============================
    if (greetings.includes(text)) {
      await sock.sendMessage(remoteJid, {
        text: `🟢 Bot active\n\nType *.menu* to see commands\nType *help* for assistance`
      });
      return;
    }

    // ==============================
    // COMMAND MENU (.menu)
    // ==============================
    if (['.menu', 'menu'].includes(text)) {
      let menuMsg = `*🛠️ BUSINESS ASSISTANT v5.3*\n\n`;
      menuMsg += `*💰 FINANCE*\n• \`.pay\` - Bank info\n• \`.rate\` - USD/NGN Rate\n\n`;
      menuMsg += `*🌍 TOOLS*\n• \`.tr [lang] [text]\` - Translator (optional)\n• \`.track\` - Logistics\n\n`;
      menuMsg += `*🛒 PRODUCTS*\n• \`.add [name] [type] [file] [price]\` - Add product\n• \`.get [name] [minPrice] [maxPrice]\` - Get products\n• \`.delete [id]\` - Delete product\n• \`.update [id] [field] [value]\` - Update product\n\n`;
      menuMsg += `_Reliability first. We no go carry last!_`;
      return await sock.sendMessage(remoteJid, { text: menuMsg });
    }

    // ==============================
    // HELP MENU (help)
    // ==============================
    if (text === 'help') {
      let helpMsg = `*🆘 BOT HELP v5.3*\n\n`;
      helpMsg += `• Type *.menu* to see main commands\n`;
      helpMsg += `• Products: use .add to save items, .get to retrieve them\n`;
      helpMsg += `• Use .delete [id] to remove a product, .update [id] [field] [value] to edit\n`;
      helpMsg += `• Finance: .pay for bank info, .rate for USD/NGN rate\n`;
      helpMsg += `• Tools: .tr [lang] [text] for translation (optional), .track for logistics\n`;
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
    // DELETE PRODUCT (.delete)
    // ==============================
    if (text.startsWith('.delete')) {
      const args = body.split(' ');
      if (args.length < 2) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .delete [id]" });
      const success = deleteProduct(args[1]);
      return await sock.sendMessage(remoteJid, { text: success ? `✅ Product deleted successfully!` : `❌ Product not found.` });
    }

    // ==============================
    // UPDATE PRODUCT (.update)
    // ==============================
    if (text.startsWith('.update')) {
      const args = body.split(' ');
      if (args.length < 4) return await sock.sendMessage(remoteJid, { text: "❌ Usage: .update [id] [field] [value]" });
      const success = updateProduct(args[1], args[2], args.slice(3).join(' '));
      return await sock.sendMessage(remoteJid, { text: success ? `✅ Product updated successfully!` : `❌ Product not found.` });
    }

  } catch (err) {
    console.error("Handler Error:", err);
  }
}

module.exports = { handleMessage };