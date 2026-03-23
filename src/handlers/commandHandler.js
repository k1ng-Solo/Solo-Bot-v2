const orderHandler = require('./orderHandler');
const responses = require('../utils/responses');
const sessionManager = require('../utils/sessionManager');
const logger = require('../utils/logger');

/**
 * Command Handler - Processes menu commands (0, 1, 2, 3)
 */
class CommandHandler {
  /**
   * Handle numeric commands
   */
  async handleCommand(sock, userId, command, userName) {
    const cmd = command.trim();
    
    logger.info(`Command received`, { userId, command: cmd });

    switch (cmd) {
      case '0':
        return await this.handleBackToMenu(sock, userId);
      
      case '1':
        return await this.handlePrices(sock, userId);
      
      case '2':
        return await this.handleOrder(sock, userId, userName);
      
      case '3':
        return await this.handleContact(sock, userId);
      
      default:
        return await this.handleUnknown(sock, userId);
    }
  }

  /**
   * Handle back to menu (0)
   */
  async handleBackToMenu(sock, userId) {
    // Clear any ongoing order
    sessionManager.clearSession(userId);
    
    const welcomeMsg = responses.getWelcomeMessage();
    await sock.sendMessage(userId, { text: welcomeMsg });
    
    logger.debug(`User returned to main menu`, { userId });
  }

  /**
   * Handle prices/services (1)
   */
  async handlePrices(sock, userId) {
    const menu = responses.getServicesMenu();
    await sock.sendMessage(userId, { text: menu });
    
    logger.debug(`Prices menu sent`, { userId });
  }

  /**
   * Handle order placement (2)
   */
  async handleOrder(sock, userId, userName) {
    await orderHandler.startOrder(sock, userId, userName);
  }

  /**
   * Handle contact info (3)
   */
  async handleContact(sock, userId) {
    const contact = responses.getContactInfo();
    await sock.sendMessage(userId, { text: contact });
    
    logger.debug(`Contact info sent`, { userId });
  }

  /**
   * Handle unknown command
   */
  async handleUnknown(sock, userId) {
    const unknown = responses.getUnknownResponse();
    await sock.sendMessage(userId, { text: unknown });
  }
}

module.exports = new CommandHandler();