const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs-extra');
const logger = require('./utils/logger');
const messageHandler = require('./handlers/messageHandler');
const notificationService = require('./services/notificationService');
require('dotenv').config();

const OWNER_NUMBER = process.env.OWNER_NUMBER || "2347076642500";

// ---------------- Persistent Auth ----------------
const authDir = path.join(process.cwd(), 'auth');
fs.ensureDirSync(authDir);

// ---------------- Bot Class ----------------
class WhatsAppBot {
  constructor() {
    this.sock = null;
    this.isReconnecting = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
  }

  async start() {
    try {
      logger.info('🚀 Starting WhatsApp Business Bot...');
      this.validateConfig();
      await this.connect();
    } catch (err) {
      logger.error('Failed to start bot:', err);
      process.exit(1);
    }
  }

  validateConfig() {
    const required = ['OWNER_NUMBER'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      logger.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
    }
  }

  async connect() {
    try {
      const { version } = await fetchLatestBaileysVersion();
      const { state, saveCreds } = await useMultiFileAuthState(
        path.join(authDir, process.env.SESSION_NAME || 'business_session')
      );

      this.sock = makeWASocket({
        version,
        logger: logger.child({ level: 'silent' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      // Message handling
      messageHandler.sock = this.sock;
      this.sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
          for (const msg of m.messages) {
            await messageHandler.handleMessage(msg, this.sock);
          }
        }
      });

      // Connection updates
      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update);
      });

      // Save credentials automatically
      this.sock.ev.on('creds.update', saveCreds);

    } catch (err) {
      logger.error('Connection error:', err);
      await this.handleReconnect();
    }
  }

  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (connection === 'open') {
      this.connectionAttempts = 0;
      this.isReconnecting = false;
      logger.info(`✅ Bot connected! Logged in as: ${this.sock.user.name}`);
      await notificationService.sendSystemStatus('🟢 ONLINE - Bot is ready');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        logger.error('❌ Logged out. Delete auth folder and restart.');
        process.exit(0);
      }
      await this.handleReconnect();
    }
  }

  async handleReconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    this.connectionAttempts++;
    if (this.connectionAttempts > this.maxRetries) process.exit(1);

    const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
    logger.warn(`⚠️ Attempting reconnect in ${delay / 1000}s...`);
    setTimeout(async () => {
      this.isReconnecting = false;
      await this.connect();
    }, delay);
  }
}

// ---------------- Start Bot ----------------
const bot = new WhatsAppBot();
bot.start();