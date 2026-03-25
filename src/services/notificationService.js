const config = require('../config/business');
const logger = require('../utils/logger');

/**
 * Notification Service - Sends alerts to business owner
 */
class NotificationService {
  constructor() {
    this.sock = null;

    // Use env OR fallback to your correct number
    this.ownerNumber = process.env.OWNER_NUMBER || "2347076642500";

    // Format owner number for WhatsApp
    this.ownerJid = `${this.ownerNumber}@s.whatsapp.net`;

    logger.info(`📱 Owner notifications will be sent to: ${this.ownerNumber}`);
  }

  /**
   * Initialize with WhatsApp socket
   */
  setSocket(sock) {
    this.sock = sock;
  }

  /**
   * Send message to owner
   */
  async notifyOwner(message, priority = 'normal') {
    if (!this.sock) {
      logger.warn('Cannot send notification: Socket not ready');
      return false;
    }

    try {
      const prefix = priority === 'high' ? '🚨 ' : '📬 ';
      
      await this.sock.sendMessage(this.ownerJid, {
        text: prefix + message,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: false
        }
      });
      
      logger.info('Notification sent to owner', { priority });
      return true;
    } catch (error) {
      logger.error('Failed to send notification to owner:', error);
      return false;
    }
  }

  /**
   * Notify about new order
   */
  async notifyNewOrder(customerNumber, customerName, orderData) {
    const responses = require('../utils/responses');
    const message = responses.formatOwnerNotification(customerNumber, customerName, orderData);
    
    return await this.notifyOwner(message, 'high');
  }

  /**
   * Notify about customer message (for non-order queries)
   */
  async notifyCustomerMessage(customerNumber, messageText) {
    const responses = require('../utils/responses');
    const message = responses.formatIncomingMessageNotification(customerNumber, messageText);
    
    return await this.notifyOwner(message, 'normal');
  }

  /**
   * Send system status to owner
   */
  async sendSystemStatus(status) {
    const message = `🤖 *Bot Status Update*\n\nStatus: ${status}\nTime: ${new Date().toLocaleString()}`;
    return await this.notifyOwner(message);
  }
}

module.exports = new NotificationService();