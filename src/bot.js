const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs-extra');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const logger = require('./utils/logger');
const messageHandler = require('./handlers/messageHandler');
const notificationService = require('./services/notificationService');
const { addProduct, getProduct } = require('./utils/memory');

// Ensure auth directory exists
const authDir = path.join(process.cwd(), 'auth');
fs.ensureDirSync(authDir);

// Allowed groups from .env (comma separated)
const ALLOWED_GROUPS = process.env.ALLOWED_GROUPS?.split(',') || [];

class WhatsAppBot {
  constructor() {
    this.sock = null;
    this.isReconnecting = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
  }

  async start() {
    try {
      logger.info('🚀 Starting WhatsApp Bot...');
      this.validateConfig();
      await this.connect();
    } catch (err) {
      logger.error('Failed to start bot:', err);
      process.exit(1);
    }
  }

  validateConfig() {
    if (!process.env.OWNER_NUMBER) {
      logger.warn('⚠️ OWNER_NUMBER missing in .env');
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
        browser: ['Ubuntu','Chrome','20.0.04'],
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      // Request pairing code if not logged in
      if (!this.sock.authState.creds.registered) {
        const phoneNumber = process.env.OWNER_NUMBER;
        setTimeout(async () => {
          try {
            const code = await this.sock.requestPairingCode(phoneNumber);
            console.log('\n' + '='.repeat(30));
            console.log(`YOUR PAIRING CODE: ${code}`);
            console.log('='.repeat(30));
            logger.info(`🔑 Enter this code on your phone (Linked Devices > Link with Phone Number)`);
          } catch (err) {
            logger.error('Failed to request pairing code:', err);
          }
        }, 3000);
      }

      messageHandler.sock = this.sock;

      // Connection updates
      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update);
      });

      // Save credentials automatically
      this.sock.ev.on('creds.update', saveCreds);

      // Message handler
      this.sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
          for (const msg of m.messages) {
            const remoteJid = msg.key.remoteJid;
            const isGroup = remoteJid.endsWith('@g.us');
            // Check allowed groups or private
            if (isGroup && !ALLOWED_GROUPS.includes(remoteJid)) continue;
            messageHandler.sock = this.sock;
            await messageHandler.handleMessage(msg, this.sock);
          }
        }
      });

      logger.info('✅ Bot initialized, waiting for messages...');

    } catch (err) {
      logger.error('Connection error:', err);
      await this.handleReconnect();
    }
  }

  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      this.connectionAttempts = 0;
      this.isReconnecting = false;
      logger.info(`✅ Bot connected! Logged in as: ${this.sock.user.name}`);
      await notificationService.sendSystemStatus('🟢 ONLINE - Bot ready');
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
    logger.info(`🔄 Reconnecting in ${delay / 1000}s...`);
    setTimeout(async () => {
      this.isReconnecting = false;
      await this.connect();
    }, delay);
  }
}

const bot = new WhatsAppBot();
bot.start();