// Test data factories for consistent test data
export const createMockMessage = (overrides = {}) => ({
  id: 'test-message-1',
  content: 'Test message content',
  type: 'user' as const, // Ensure 'type' is one of the literal string types if applicable
  timestamp: new Date().toISOString(),
  ...overrides
});

export const createMockLearningTrack = (overrides = {}) => ({
  id: 'track-1',
  title: 'Test Track',
  description: 'Test track description',
  progress: 0,
  lessons: [], // Assuming lessons is an array, can be customized via overrides
  ...overrides
});
