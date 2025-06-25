// src/features/ai-tutor/hooks/__tests__/integration.business.test.ts
// Integration test for business logic hooks

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Create mock implementations
const mockChatStore = {
  activeTab: 'home',
  isLoading: false,
  error: null,
  tabMessages: {
    home: [],
    progress: [],
    review: [],
    explore: []
  },
  setActiveTab: vi.fn(),
  sendMessageWithOptimistic: vi.fn(),
  setError: vi.fn(),
  getCombinedMessages: vi.fn(() => []),
  getMessageCount: vi.fn(() => 0),
  getPendingCount: vi.fn(() => 0),
  getFailedCount: vi.fn(() => 0),
  optimisticMessages: { home: [], progress: [], review: [], explore: [] },
  addMessage: vi.fn()
};

const mockLearningStore = {
  tracks: [],
  enrolledTracks: [],
  progress: {},
  achievements: [],
  learningStreak: 0,
  currentTrack: null,
  learningPreferences: {
    difficultyPreference: 'mixed',
    learningStyle: 'visual',
    pacePreference: 'normal'
  },
  enrollInTrack: vi.fn(),
  unenrollFromTrack: vi.fn(),
  getRecommendedTracks: vi.fn(() => [])
};

// Mock both stores
vi.mock('../../stores/chatStore', () => ({
  useChatStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockChatStore);
    }
    return mockChatStore;
  })
}));

vi.mock('../../stores/comprehensiveLearningStore', () => ({
  useComprehensiveLearningStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockLearningStore);
    }
    return mockLearningStore;
  })
}));

describe('Business Logic Hooks Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should integrate chat and learning hooks correctly', async () => {
    const { useChatManager } = await import('../business/useChatManager');
    const { useLearningTrackManager } = await import('../business/useLearningTrackManager');
    
    const { result: chatResult } = renderHook(() => useChatManager());
    const { result: learningResult } = renderHook(() => useLearningTrackManager());

    // Both hooks should initialize properly
    expect(chatResult.current.activeTab).toBe('home');
    expect(learningResult.current.tracks).toEqual([]);
    
    // Actions should be available
    expect(typeof chatResult.current.sendMessage).toBe('function');
    expect(typeof learningResult.current.enrollInTrack).toBe('function');
  });

  it('should handle cross-hook operations', async () => {
    const { useStoreIntegration } = await import('../utils/useStoreIntegration');
    
    const { result } = renderHook(() => useStoreIntegration());

    // Should provide combined state
    expect(result.current.combinedState).toBeDefined();
    expect(result.current.combinedState.activeTab).toBe('home');
    
    // Should provide cross-store actions
    expect(typeof result.current.syncStores).toBe('function');
    expect(typeof result.current.triggerLearningFromChat).toBe('function');
  });

  it('should handle error boundary correctly', async () => {
    const { useErrorBoundary } = await import('../utils/useErrorBoundary');
    
    const { result } = renderHook(() => useErrorBoundary());

    // Should initialize without errors
    expect(result.current.hasError).toBe(false);
    expect(result.current.error).toBe(null);
    
    // Should provide error handling methods
    expect(typeof result.current.reportError).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
    
    // Should handle error reporting
    act(() => {
      result.current.reportError(new Error('Test error'));
    });
    
    expect(result.current.hasError).toBe(true);
    expect(result.current.error?.message).toBe('Test error');
  });

  it('should provide performance optimization utilities', async () => {
    const { shallowEqual, deepEqual } = await import('../utils/useOptimizedSelector');
    
    // Test utility functions
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
    
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false);
  });

  it('should handle all hook exports correctly', async () => {
    // Test that all exports are available
    const businessHooks = await import('../business');
    const utilityHooks = await import('../utils');
    
    // Business hooks should be available
    expect(typeof businessHooks.useChatManager).toBe('function');
    expect(typeof businessHooks.useLearningTrackManager).toBe('function');
    expect(typeof businessHooks.useProgressTracker).toBe('function');
    expect(typeof businessHooks.useAssessmentManager).toBe('function');
    
    // Utility hooks should be available
    expect(typeof utilityHooks.useOptimizedSelector).toBe('function');
    expect(typeof utilityHooks.useErrorBoundary).toBe('function');
    expect(typeof utilityHooks.useStoreIntegration).toBe('function');
    
    // Helper functions should be available
    expect(typeof utilityHooks.shallowEqual).toBe('function');
    expect(typeof utilityHooks.deepEqual).toBe('function');
  });

  it('should maintain hook dependencies correctly', async () => {
    const { useChatManager } = await import('../business/useChatManager');
    
    const { result, rerender } = renderHook(() => useChatManager());
    
    // Get initial references
    const initialSendMessage = result.current.sendMessage;
    const initialSwitchTab = result.current.switchTab;
    
    // Re-render should maintain stable references (memoization working)
    rerender();
    
    expect(result.current.sendMessage).toBe(initialSendMessage);
    expect(result.current.switchTab).toBe(initialSwitchTab);
  });
});