/**
 * Session Manager - Tracks user conversations and order states
 * In production, replace with Redis or database
 */

class SessionManager {
  constructor() {
    // In-memory storage (resets when bot restarts)
    this.sessions = new Map();
    
    // Session timeout: 30 minutes
    this.SESSION_TIMEOUT = 30 * 60 * 1000;
    
    // Cleanup old sessions every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  /**
   * Get or create user session
   */
  getSession(userId) {
    // Clean user ID (remove @s.whatsapp.net suffix if present)
    const cleanId = userId.split('@')[0];
    
    if (!this.sessions.has(cleanId)) {
      this.sessions.set(cleanId, {
        id: cleanId,
        state: 'IDLE', // IDLE, ORDERING, AWAITING_CONFIRMATION
        data: {},
        lastActivity: Date.now(),
        messageCount: 0
      });
    }
    
    const session = this.sessions.get(cleanId);
    session.lastActivity = Date.now();
    session.messageCount++;
    
    return session;
  }

  /**
   * Update session state
   */
  setState(userId, state, data = {}) {
    const session = this.getSession(userId);
    session.state = state;
    session.data = { ...session.data, ...data };
    return session;
  }

  /**
   * Clear session data
   */
  clearSession(userId) {
    const cleanId = userId.split('@')[0];
    this.sessions.delete(cleanId);
  }

  /**
   * Get session state
   */
  getState(userId) {
    const session = this.getSession(userId);
    return session.state;
  }

  /**
   * Check if user is in specific state
   */
  isInState(userId, state) {
    return this.getState(userId) === state;
  }

  /**
   * Cleanup old sessions
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [userId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessions.delete(userId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} inactive sessions`);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      states: Array.from(this.sessions.values()).reduce((acc, s) => {
        acc[s.state] = (acc[s.state] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

// Singleton instance
module.exports = new SessionManager();