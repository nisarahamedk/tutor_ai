// src/features/ai-tutor/hooks/__tests__/useChatManager.simple.test.ts
// Simple test to verify the hook implementation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock implementation
const mockUseChatStore = vi.fn();

vi.mock('../../stores/chatStore', () => ({
  useChatStore: mockUseChatStore
}));

// Import after mocking
const { useChatManager } = await import('../business/useChatManager');

describe('useChatManager - Basic Functionality', () => {
  const mockStore = {
    activeTab: 'home',
    isLoading: false,
    error: null,
    setActiveTab: vi.fn(),
    sendMessageWithOptimistic: vi.fn(),
    retryMessage: vi.fn(),
    setError: vi.fn(),
    getCombinedMessages: vi.fn(() => []),
    getMessageCount: vi.fn(() => 0),
    getPendingCount: vi.fn(() => 0),
    getFailedCount: vi.fn(() => 0),
    optimisticMessages: { home: [], progress: [], review: [], explore: [] }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChatStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useChatManager());

    expect(result.current.activeTab).toBe('home');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.messages).toEqual([]);
  });

  it('should provide sendMessage action', () => {
    const { result } = renderHook(() => useChatManager());

    expect(typeof result.current.sendMessage).toBe('function');
    expect(typeof result.current.switchTab).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should provide computed properties', () => {
    const { result } = renderHook(() => useChatManager());

    expect(typeof result.current.hasUnreadMessages).toBe('function');
    expect(typeof result.current.getMessageCount).toBe('function');
  });

  it('should handle switchTab action', () => {
    const { result } = renderHook(() => useChatManager());

    act(() => {
      result.current.switchTab('progress');
    });

    expect(mockStore.setActiveTab).toHaveBeenCalledWith('progress');
  });

  it('should handle clearError action', () => {
    const { result } = renderHook(() => useChatManager());

    act(() => {
      result.current.clearError();
    });

    expect(mockStore.setError).toHaveBeenCalledWith(null);
  });

  it('should calculate unread messages correctly', () => {
    mockStore.getPendingCount.mockReturnValue(2);
    mockStore.getFailedCount.mockReturnValue(1);

    const { result } = renderHook(() => useChatManager());

    expect(result.current.hasUnreadMessages('home')).toBe(true);
  });

  it('should return message count', () => {
    mockStore.getMessageCount.mockReturnValue(5);

    const { result } = renderHook(() => useChatManager());

    expect(result.current.getMessageCount('progress')).toBe(5);
  });
});