const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const fs = require("fs");
const path = require("path");
const { handleMessage } = require("./handlers/messageHandler");

require("dotenv").config();

const AUTH_FOLDER = path.join(__dirname, "../auth");

async function startBot() {
  // create auth folder if not exist
  if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"]
  });

  // 🔑 Generate pairing code if not registered
  if (!state.creds.registered) {
    const phoneNumber = process.env.OWNER_NUMBER;
    setTimeout(async () => {
      const code = await sock.requestPairingCode(phoneNumber);
      console.log("================================");
      console.log("PAIRING CODE:", code);
      console.log("================================");
    }, 3000);
  }

  // Save session
  sock.ev.on("creds.update", saveCreds);

  // Messages
  sock.ev.on("messages.upsert", async (m) => {
    if (m.type === "notify") {
      for (const msg of m.messages) {
        await handleMessage(msg, sock);
      }
    }
  });

  // Connection updates
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("🟢 Bot connected successfully");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        startBot();
      } else {
        console.log("❌ Logged out. Delete auth folder and restart.");
      }
    }
  });
}

startBot();

// keep Railway alive
setInterval(() => {
  console.log("🟢 Bot still alive");
}, 30000);