const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');

const path = require('path');
const fs = require('fs-extra');

// Load environment variables
require('dotenv').config();

const logger = require('./utils/logger');
const messageHandler = require('./handlers/messageHandler');
const notificationService = require('./services/notificationService');

// Ensure auth directory exists
const authDir = path.join(process.cwd(), 'auth');
fs.ensureDirSync(authDir);

/**
 * Main Bot Class
 */
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
    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  validateConfig() {
    const required = ['OWNER_NUMBER'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      logger.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
      logger.warn('Please check your .env file');
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
        printQRInTerminal: false,
        auth: state,
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      // =========================
      // PAIRING CODE (NO QR)
      // =========================
      if (!state.creds.registered) {
        const phoneNumber = process.env.OWNER_NUMBER;

        setTimeout(async () => {
          try {
            const code = await this.sock.requestPairingCode(phoneNumber);

            console.log('\n' + '='.repeat(35));
            console.log(`🔑 YOUR PAIRING CODE: ${code}`);
            console.log('='.repeat(35) + '\n');

            logger.info('Enter this code on WhatsApp → Linked Devices → Link with phone number');
          } catch (err) {
            logger.error('Failed to request pairing code:', err);
          }
        }, 3000);
      }

      // Save creds
      this.sock.ev.on('creds.update', saveCreds);

      // Connection update
      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update);
      });

      // Message listener
      this.sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          try {
            messageHandler.sock = this.sock;
            await messageHandler.handleMessage(msg, this.sock);
          } catch (err) {
            logger.error('Message handling error:', err);
          }
        }
      });

    } catch (error) {
      logger.error('Connection error:', error);
      await this.handleReconnect();
    }
  }

  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      this.connectionAttempts = 0;
      this.isReconnecting = false;

      logger.info(`✅ Bot connected! Logged in as: ${this.sock.user?.name || "Unknown"}`);

      try {
        await notificationService.sendSystemStatus('🟢 ONLINE - Bot is ready');
      } catch (e) {}
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

    if (this.connectionAttempts > this.maxRetries) {
      logger.error('Max reconnect attempts reached.');
      process.exit(1);
    }

    const delay = Math.min(
      1000 * Math.pow(2, this.connectionAttempts),
      30000
    );

    logger.info(`Reconnecting in ${delay / 1000}s...`);

    setTimeout(async () => {
      this.isReconnecting = false;
      await this.connect();
    }, delay);
  }
}

const bot = new WhatsAppBot();
bot.start();