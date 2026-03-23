const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
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

  /**
   * Initialize the bot
   */
  async start() {
    try {
      logger.info('🚀 Starting WhatsApp Business Bot...');
      logger.info(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);

      // Check required environment variables
      this.validateConfig();

      // Initialize WhatsApp connection
      await this.connect();

    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  /**
   * Validate configuration
   */
  validateConfig() {
    const required = ['OWNER_NUMBER'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      logger.warn(`⚠️ Missing environment variables: ${missing.join(', ')}`);
      logger.warn('Please copy .env.example to .env and fill in your details');
    }
  }

  /**
   * Connect to WhatsApp
   */
  async connect() {
    try {
      // Get latest Baileys version
      const { version, isLatest } = await fetchLatestBaileysVersion();
      logger.info(`📱 Using WhatsApp Web v${version.join('.')}, Latest: ${isLatest}`);

      // Load authentication state
      const { state, saveCreds } = await useMultiFileAuthState(
        path.join(authDir, process.env.SESSION_NAME || 'business_session')
      );

      // Create socket connection
      this.sock = makeWASocket({
        version,
        logger: logger.child({ level: 'silent' }), // Suppress Baileys internal logs
        printQRInTerminal: true,
        auth: state,
        browser: ['Business Bot', 'Chrome', '1.0.0'],
        generateHighQualityLinkPreview: true,
        syncFullHistory: false, // Don't load old messages
        markOnlineOnConnect: true,
        keepAliveIntervalMs: 30000,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        retryRequestDelayMs: 250
      });

      // Set socket in handlers
      messageHandler.sock = this.sock;

      // Handle connection events
      this.sock.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(update);
      });

      // Handle credentials update
      this.sock.ev.on('creds.update', saveCreds);

      // Handle incoming messages
      this.sock.ev.on('messages.upsert', async (m) => {
        if (m.type === 'notify') {
          for (const msg of m.messages) {
            messageHandler.sock = this.sock;
            await messageHandler.handleMessage(msg, this.sock);
          }
        }
      });

      // Handle errors
      this.sock.ev.on('error', (error) => {
        logger.error('Socket error:', error);
      });

    } catch (error) {
      logger.error('Connection error:', error);
      await this.handleReconnect();
    }
  }

  /**
   * Handle connection status updates
   */
  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    // Show QR code
    if (qr) {
      logger.info('📲 Scan the QR code above with WhatsApp on your phone');
      qrcode.generate(qr, { small: true });
    }

    // Connection established
    if (connection === 'open') {
      this.connectionAttempts = 0;
      this.isReconnecting = false;
      
      const userInfo = this.sock.user;
      logger.info(`✅ Bot connected successfully!`);
      logger.info(`📱 Number: ${userInfo.id.split(':')[0]}`);
      logger.info(`👤 Name: ${userInfo.name}`);
      
      // Notify owner that bot is online
      await notificationService.sendSystemStatus('🟢 ONLINE - Bot is ready to receive messages');
      
      logger.info('🤖 Bot is now listening for messages...');
    }

    // Connection closed
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn(`⚠️ Connection closed. Status: ${statusCode}`);

      if (statusCode === DisconnectReason.loggedOut) {
        logger.error('❌ Logged out. Please delete auth folder and scan QR again.');
        process.exit(0);
      }

      if (shouldReconnect) {
        await this.handleReconnect();
      }
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  async handleReconnect() {
    if (this.isReconnecting) return;
    
    this.isReconnecting = true;
    this.connectionAttempts++;

    if (this.connectionAttempts > this.maxRetries) {
      logger.error(`❌ Max reconnection attempts (${this.maxRetries}) reached. Exiting...`);
      process.exit(1);
    }

    const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 30000);
    logger.info(`🔄 Reconnecting in ${delay/1000}s... (Attempt ${this.connectionAttempts}/${this.maxRetries})`);

    setTimeout(async () => {
      this.isReconnecting = false;
      await this.connect();
    }, delay);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  logger.info('👋 Shutting down bot gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('👋 Shutting down bot gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the bot
const bot = new WhatsAppBot();
bot.start();