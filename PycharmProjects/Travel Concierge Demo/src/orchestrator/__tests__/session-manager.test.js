// src/orchestrator/__tests__/session-manager.test.js
const SessionManager = require('../session-manager');

// Mock Firestore
jest.mock('@google-cloud/firestore', () => {
  const mockCollection = {
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
  };
  
  const mockFirestore = {
    collection: jest.fn().mockReturnValue(mockCollection),
  };
  
  return { Firestore: jest.fn().mockImplementation(() => mockFirestore) };
});

describe('SessionManager', () => {
  let sessionManager;
  let mockFirestore;
  let mockCollection;
  let mockDocRef;
  let config;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup config
    config = {
      FIRESTORE_SESSIONS_COLLECTION: 'sessions'
    };
    
    // Get mocked Firestore instance
    const { Firestore } = require('@google-cloud/firestore');
    mockFirestore = new Firestore();
    mockCollection = mockFirestore.collection();
    mockDocRef = mockCollection.doc();
    
    // Create SessionManager instance
    sessionManager = new SessionManager(mockFirestore, config);
  });

  describe('constructor', () => {
    it('should initialize with Firestore and config', () => {
      expect(sessionManager.firestore).toBe(mockFirestore);
      expect(sessionManager.collection).toBe(mockCollection);
    });

    it('should use correct collection name from config', () => {
      expect(mockFirestore.collection).toHaveBeenCalledWith('sessions');
    });
  });

  describe('getSessionContext', () => {
    const sessionId = 'test-session-123';
    const userId = 'user-456';

    it('should return existing session context when session exists', async () => {
      const existingContext = {
        userId: 'user-456',
        createdAt: Date.now(),
        history: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' }
        ]
      };

      // Mock existing document
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({ context: existingContext })
      });

      const result = await sessionManager.getSessionContext(sessionId, userId);

      expect(mockCollection.doc).toHaveBeenCalledWith(sessionId);
      expect(mockDocRef.get).toHaveBeenCalled();
      expect(result).toEqual(existingContext);
    });

    it('should create new session context when session does not exist', async () => {
      // Mock non-existing document
      mockDocRef.get.mockResolvedValue({
        exists: false
      });

      const result = await sessionManager.getSessionContext(sessionId, userId);

      expect(mockDocRef.get).toHaveBeenCalled();
      expect(mockDocRef.set).toHaveBeenCalledWith({
        context: expect.objectContaining({
          userId: userId,
          createdAt: expect.any(Number),
          history: []
        })
      });
      expect(result).toEqual(expect.objectContaining({
        userId: userId,
        createdAt: expect.any(Number),
        history: []
      }));
    });

    it('should return empty object when session exists but has no context', async () => {
      // Mock document with no context
      mockDocRef.get.mockResolvedValue({
        exists: true,
        data: () => ({})
      });

      const result = await sessionManager.getSessionContext(sessionId, userId);

      expect(result).toEqual({});
    });

    it('should throw error when Firestore operation fails', async () => {
      const error = new Error('Firestore connection failed');
      mockDocRef.get.mockRejectedValue(error);

      await expect(sessionManager.getSessionContext(sessionId, userId))
        .rejects.toThrow('Failed to get session context: Firestore connection failed');
    });
  });

  describe('updateSessionContext', () => {
    const sessionId = 'test-session-123';
    const context = {
      userId: 'user-456',
      lastIntent: 'booking',
      lastInput: 'I want to book a flight',
      history: [
        { role: 'user', content: 'I want to book a flight' }
      ]
    };

    it('should update session context successfully', async () => {
      await sessionManager.updateSessionContext(sessionId, context);

      expect(mockCollection.doc).toHaveBeenCalledWith(sessionId);
      expect(mockDocRef.set).toHaveBeenCalledWith(
        { context },
        { merge: true }
      );
    });

    it('should throw error when update operation fails', async () => {
      const error = new Error('Update failed');
      mockDocRef.set.mockRejectedValue(error);

      await expect(sessionManager.updateSessionContext(sessionId, context))
        .rejects.toThrow('Failed to update session context: Update failed');
    });
  });

  describe('integration scenarios', () => {
    it('should handle session lifecycle: create, update, retrieve', async () => {
      const sessionId = 'lifecycle-session';
      const userId = 'user-789';

      // First call - create new session
      mockDocRef.get.mockResolvedValueOnce({
        exists: false
      });

      const initialContext = await sessionManager.getSessionContext(sessionId, userId);
      expect(initialContext).toEqual(expect.objectContaining({
        userId: userId,
        history: []
      }));

      // Update session
      const updatedContext = {
        ...initialContext,
        lastIntent: 'planning',
        lastInput: 'Plan my trip to Paris'
      };

      await sessionManager.updateSessionContext(sessionId, updatedContext);

      // Retrieve updated session
      mockDocRef.get.mockResolvedValueOnce({
        exists: true,
        data: () => ({ context: updatedContext })
      });

      const retrievedContext = await sessionManager.getSessionContext(sessionId, userId);
      expect(retrievedContext).toEqual(updatedContext);
    });
  });
}); 