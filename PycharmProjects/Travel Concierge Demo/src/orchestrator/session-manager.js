// src/orchestrator/session-manager.js
class SessionManager {
  constructor(firestore, config) {
    this.firestore = firestore;
    this.collection = firestore.collection(config.FIRESTORE_SESSIONS_COLLECTION);
  }

  async getSessionContext(sessionId, userId) {
    try {
      const docRef = this.collection.doc(sessionId);
      const doc = await docRef.get();
      if (doc.exists) {
        return doc.data().context || {};
      } else {
        // Create new session context
        const context = { userId, createdAt: Date.now(), history: [] };
        await docRef.set({ context });
        return context;
      }
    } catch (err) {
      throw new Error(`Failed to get session context: ${err.message}`);
    }
  }

  async updateSessionContext(sessionId, context) {
    try {
      const docRef = this.collection.doc(sessionId);
      await docRef.set({ context }, { merge: true });
    } catch (err) {
      throw new Error(`Failed to update session context: ${err.message}`);
    }
  }
}

module.exports = SessionManager; 