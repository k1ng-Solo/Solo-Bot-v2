const sessionManager = require('../utils/sessionManager');
const responses = require('../utils/responses');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * Order Handler - Manages the order flow conversation
 */
class OrderHandler {
  /**
   * Start order process
   */
  async startOrder(sock, userId, userName) {
    sessionManager.setState(userId, 'ORDERING', {
      step: 0,
      answers: {},
      userName: userName
    });

    const question = responses.getOrderQuestion(0);
    
    await sock.sendMessage(userId, {
      text: `🛒 *Let's place your order!*\n\n${question}`
    });

    logger.info(`Order started for user: ${userId}`);
  }

  /**
   * Process order answer
   */
  async processAnswer(sock, userId, messageText) {
    const session = sessionManager.getSession(userId);
    const currentStep = session.data.step || 0;
    const questions = require('../config/business').order.questions;

    // Store answer
    const answerKey = ['items', 'pickup', 'notes'][currentStep];
    session.data.answers[answerKey] = messageText;
    
    logger.debug(`Order answer received`, { userId, step: currentStep, answerKey });

    // Move to next step
    const nextStep = currentStep + 1;

    if (nextStep < questions.length) {
      // Ask next question
      session.data.step = nextStep;
      const nextQuestion = responses.getOrderQuestion(nextStep);
      
      await sock.sendMessage(userId, {
        text: nextQuestion
      });
    } else {
      // All questions answered, show confirmation
      await this.showConfirmation(sock, userId, session);
    }
  }

  /**
   * Show order confirmation
   */
  async showConfirmation(sock, userId, session) {
    const confirmation = responses.formatOrderConfirmation(
      session.data.userName,
      userId.split('@')[0],
      session.data.answers
    );

    sessionManager.setState(userId, 'AWAITING_CONFIRMATION', session.data);

    await sock.sendMessage(userId, {
      text: confirmation
    });
  }

  /**
   * Handle confirmation response (YES/NO)
   */
  async handleConfirmation(sock, userId, messageText) {
    const response = messageText.toUpperCase().trim();
    const session = sessionManager.getSession(userId);

    if (response === 'YES') {
      // Send order to owner
      const success = await notificationService.notifyNewOrder(
        userId.split('@')[0],
        session.data.userName,
        session.data.answers
      );

      if (success) {
        await sock.sendMessage(userId, {
          text: `✅ *Order Confirmed!*\n\nThank you! We've received your order and will contact you shortly at ${session.data.answers.pickup || 'the provided time'}.\n\nYour order ID: #${Date.now().toString().slice(-6)}\n\n⬅️ Type *menu* to place another order or see other options.`
        });
        
        logger.info(`Order confirmed and sent to owner`, { userId });
      } else {
        await sock.sendMessage(userId, {
          text: `⚠️ *Order Received*\n\nWe've saved your order but couldn't notify the owner immediately. Don't worry, we'll process it soon!\n\n⬅️ Type *menu* to go back.`
        });
      }

      // Clear session
      sessionManager.clearSession(userId);

    } else if (response === 'NO') {
      await sock.sendMessage(userId, {
        text: `❌ *Order Cancelled*\n\nNo problem! Your order has been cancelled.\n\n⬅️ Type *menu* to start over or *2* to place a new order.`
      });
      
      sessionManager.clearSession(userId);
      logger.info(`Order cancelled by user`, { userId });

    } else {
      await sock.sendMessage(userId, {
        text: `Please reply with *YES* to confirm your order or *NO* to cancel.`
      });
    }
  }

  /**
   * Cancel current order
   */
  async cancelOrder(sock, userId) {
    sessionManager.clearSession(userId);
    await sock.sendMessage(userId, {
      text: `🚫 Order cancelled. Type *menu* to start over.`
    });
  }
}

module.exports = new OrderHandler();