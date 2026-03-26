const fetch = require('node-fetch');
const translate = require('google-translate-api-x');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getProduct, addProduct } = require('../utils/memory');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction:
    "You are a professional business assistant. Speak clean English but understand Nigerian Pidgin."
});

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
    const isGroup = remoteJid.endsWith("@g.us");
    const sender = msg.key.participant || remoteJid;
    const isImage = !!msg.message?.imageMessage;

    const allowedGroups = (process.env.ALLOWED_GROUPS || "").split(",");

    if (isGroup && !allowedGroups.includes(remoteJid)) return;

    const isCommand = text.startsWith(".");

    /* ================= GREETING ================= */
    if (["hi", "hello", "hey"].includes(text)) {
      return sock.sendMessage(remoteJid, {
        text:
          "🟢 Bot active\n\nType *.menu* to see commands\nType *help* if you're new"
      });
    }

    /* ================= HELP MENU ================= */
    if (text === "help") {
      return sock.sendMessage(remoteJid, {
        text:
          "*📘 BOT HELP GUIDE*\n\n" +
          "How to use this bot:\n\n" +
          "1️⃣ To see commands\nType: .menu\n\n" +
          "2️⃣ To make payment\nType: .pay\n\n" +
          "3️⃣ After payment\nSend screenshot with caption:\npaid / proof / done\n\n" +
          "4️⃣ To translate\n.tr igbo Hello\n\n" +
          "5️⃣ To talk to AI\nJust send message\n\n" +
          "6️⃣ To get dollar rate\n.rate\n\n" +
          "This bot handles orders automatically."
      });
    }

    /* ================= COMMAND MENU ================= */
    if (text === ".menu") {
      return sock.sendMessage(remoteJid, {
        text:
          "*🛠️ BUSINESS COMMANDS*\n\n" +
          "💰 Finance\n" +
          "• .pay\n" +
          "• .rate\n\n" +
          "🌍 Tools\n" +
          "• .tr [lang] [text]\n\n" +
          "🛒 Products\n" +
          "• .get name\n\n" +
          "📘 Help\n" +
          "• help"
      });
    }

    /* ================= PAYMENT REQUEST ================= */
    if (text === "paid") {
      return sock.sendMessage(remoteJid, {
        text:
          "Please send your payment screenshot with caption *paid* for verification."
      });
    }

    /* ================= PAYMENT PROOF ================= */
    if (
      isImage &&
      ["paid", "proof", "done", "alert"].some(word => text.includes(word))
    ) {
      await sock.sendMessage(remoteJid, {
        text: "✅ Payment proof received. Awaiting confirmation."
      });

      const owner = process.env.OWNER_NUMBER + "@s.whatsapp.net";

      return sock.sendMessage(owner, {
        text: `🚨 Payment alert from:\nwa.me/${sender.split("@")[0]}`
      });
    }

    /* ================= PAYMENT INFO ================= */
    if (text === ".pay") {
      return sock.sendMessage(remoteJid, {
        text:
          "*💳 PAYMENT INFO*\n\n" +
          "Bank: YOUR BANK\n" +
          "Account: 0000000000\n" +
          "Name: YOUR NAME"
      });
    }

    /* ================= RATE ================= */
    if (text === ".rate") {
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      const data = await response.json();
      const rate = (data.rates.NGN + 250).toFixed(2);

      return sock.sendMessage(remoteJid, {
        text: `📊 1 USD = ₦${rate}`
      });
    }

    /* ================= TRANSLATOR ================= */
    if (text.startsWith(".tr")) {
      const parts = body.split(" ");
      const lang = parts[1];
      const message = parts.slice(2).join(" ");

      if (!lang || !message) {
        return sock.sendMessage(remoteJid, {
          text: "Usage: .tr igbo How are you?"
        });
      }

      const res = await translate(message, { to: lang });

      return sock.sendMessage(remoteJid, {
        text: `🌍 Translation:\n${res.text}`
      });
    }

    /* ================= ADD PRODUCT ================= */
    if (text.startsWith(".add")) {
      const args = body.split(" ");

      if (args.length < 5) {
        return sock.sendMessage(remoteJid, {
          text: "Usage: .add name type file price"
        });
      }

      const [, name, type, file, price] = args;
      addProduct(name, type, file, parseInt(price));

      return sock.sendMessage(remoteJid, {
        text: `✅ Product ${name} added`
      });
    }

    /* ================= GET PRODUCT ================= */
    if (text.startsWith(".get")) {
      const args = body.split(" ");
      const name = args[1];

      const items = getProduct(name);

      if (!items.length) {
        return sock.sendMessage(remoteJid, {
          text: "No product found"
        });
      }

      for (const item of items) {
        if (item.type === "image") {
          await sock.sendMessage(remoteJid, {
            image: { url: item.file },
            caption: `${item.name} - ₦${item.price}`
          });
        }

        if (item.type === "video") {
          await sock.sendMessage(remoteJid, {
            video: { url: item.file },
            caption: `${item.name} - ₦${item.price}`
          });
        }
      }

      return;
    }

    /* ================= AI CHAT ================= */
    if (!isCommand) {
      const result = await model.generateContent(body);
      const reply = result.response.text();

      return sock.sendMessage(remoteJid, { text: reply });
    }
  } catch (err) {
    console.error("Handler Error:", err);
  }
}

module.exports = { handleMessage };