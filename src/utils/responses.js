const config = require('../config/business');

/**
 * Response Templates and Utilities
 */
class ResponseHandler {
  /**
   * Check if message is a greeting
   */
  isGreeting(message) {
    const lowerMsg = message.toLowerCase().trim();
    return config.messages.greetings.some(greeting => 
      lowerMsg.includes(greeting) || lowerMsg === greeting
    );
  }

  /**
   * Check if message is a number command (0, 1, 2, 3)
   */
  isCommand(message) {
    return /^[0-3]$/.test(message.trim());
  }

  /**
   * Get welcome message
   */
  getWelcomeMessage() {
    return config.formatMessage(config.messages.welcome);
  }

  /**
   * Get unknown command response
   */
  getUnknownResponse() {
    return config.messages.unknown;
  }

  /**
   * Get goodbye message
   */
  getGoodbyeMessage() {
    return config.formatMessage(config.messages.goodbye);
  }

  /**
   * Get services menu
   */
  getServicesMenu() {
    return config.getServicesMenu();
  }

  /**
   * Get contact info
   */
  getContactInfo() {
    return config.getContactInfo();
  }

  /**
   * Format order confirmation for customer
   */
  formatOrderConfirmation(customerName, customerNumber, orderData) {
    return config.formatMessage(config.order.confirmationTemplate, {
      customerName: customerName || 'Customer',
      customerNumber: customerNumber,
      items: orderData.items || 'Not specified',
      pickupTime: orderData.pickup || 'Not specified',
      notes: orderData.notes || 'None'
    });
  }

  /**
   * Get next order question based on current step
   */
  getOrderQuestion(step) {
    const questions = config.order.questions;
    if (step >= 0 && step < questions.length) {
      return questions[step];
    }
    return null;
  }

  /**
   * Format order summary for owner notification
   */
  formatOwnerNotification(customerNumber, customerName, orderData) {
    const timestamp = new Date().toLocaleString();
    
    const orderDetails = `
Items: ${orderData.items || 'N/A'}
Pickup: ${orderData.pickup || 'N/A'}
Notes: ${orderData.notes || 'None'}
    `.trim();

    return config.formatMessage(config.ownerNotifications.newOrder, {
      customerNumber,
      customerName: customerName || 'Unknown',
      orderDetails,
      timestamp
    });
  }

  /**
   * Format incoming message notification for owner
   */
  formatIncomingMessageNotification(customerNumber, message) {
    const timestamp = new Date().toLocaleString();
    
    return config.formatMessage(config.ownerNotifications.customerQuery, {
      customerNumber,
      message,
      timestamp
    });
  }
}

module.exports = new ResponseHandler();