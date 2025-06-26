// src/features/ai-tutor/hooks/__tests__/useChatManager.test.ts
// TDD Tests for Chat Manager Business Logic Hook

import { renderHook, act } from '@testing-library/react';
import { useChatManager } from '../business/useChatManager';
import { useChatStore } from '../../stores/chatStore';
import type { TabType } from '../../types';

// Mock the store
import { vi } from 'vitest';

vi.mock('../../stores/chatStore', () => ({
  useChatStore: vi.fn()
}));

const mockUseChatStore = useChatStore as jest.MockedFunction<typeof useChatStore>;

describe('useChatManager', () => {
  const mockStore = {
    activeTab: 'home' as TabType,
    tabMessages: {
      home: [],
      progress: [],
      review: [],
      explore: []
    },
    optimisticMessages: {
      home: [],
      progress: [],
      review: [],
      explore: []
    },
    isLoading: false,
    error: null,
    setActiveTab: vi.fn(),
    sendMessageWithOptimistic: vi.fn(),
    retryMessage: vi.fn(),
    setError: vi.fn(),
    getCombinedMessages: vi.fn(),
    getMessageCount: vi.fn(),
    getPendingCount: vi.fn(),
    getFailedCount: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChatStore.mockReturnValue(mockStore);
  });

  describe('state management', () => {
    it('should return current chat state', () => {
      const { result } = renderHook(() => useChatManager());

      expect(result.current.activeTab).toBe('home');
      expect(result.current.messages).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should update when store state changes', () => {
      const { rerender } = renderHook(() => useChatManager());

      // Update mock store
      mockUseChatStore.mockReturnValue({
        ...mockStore,
        activeTab: 'progress',
        isLoading: true
      });

      rerender();

      const { result } = renderHook(() => useChatManager());
      expect(result.current.activeTab).toBe('progress');
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('sendMessage action', () => {
    it('should send message with optimistic updates', async () => {
      mockStore.sendMessageWithOptimistic.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useChatManager());

      await act(async () => {
        await result.current.sendMessage('Hello, AI!');
      });

      expect(mockStore.sendMessageWithOptimistic).toHaveBeenCalledWith(
        'home',
        'Hello, AI!',
        undefined
      );
    });

    it('should send message with component', async () => {
      const component = '<div>Test Component</div>';
      mockStore.sendMessageWithOptimistic.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useChatManager());

      await act(async () => {
        await result.current.sendMessage('Hello!', component);
      });

      expect(mockStore.sendMessageWithOptimistic).toHaveBeenCalledWith(
        'home',
        'Hello!',
        component
      );
    });

    it('should handle send message errors', async () => {
      const error = new Error('Send failed');
      mockStore.sendMessageWithOptimistic.mockRejectedValue(error);
      
      const { result } = renderHook(() => useChatManager());

      await act(async () => {
        try {
          await result.current.sendMessage('Hello!');
        } catch (e) {
          expect(e).toBe(error);
        }
      });
    });
  });

  describe('switchTab action', () => {
    it('should switch active tab', () => {
      const { result } = renderHook(() => useChatManager());

      act(() => {
        result.current.switchTab('progress');
      });

      expect(mockStore.setActiveTab).toHaveBeenCalledWith('progress');
    });

    it('should clear error when switching tabs', () => {
      mockStore.error = 'Some error';
      
      const { result } = renderHook(() => useChatManager());

      act(() => {
        result.current.switchTab('review');
      });

      expect(mockStore.setError).toHaveBeenCalledWith(null);
    });
  });

  describe('retryFailedMessage action', () => {
    it('should retry failed message', async () => {
      const mockOptimisticMessage = {
        id: 'temp-123',
        tempId: 'temp-123',
        type: 'user' as const,
        content: 'Failed message',
        timestamp: new Date(),
        status: 'failed' as const,
        error: 'Network error'
      };

      mockStore.optimisticMessages.home = [mockOptimisticMessage];
      mockStore.retryMessage.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useChatManager());

      await act(async () => {
        await result.current.retryFailedMessage('temp-123');
      });

      expect(mockStore.retryMessage).toHaveBeenCalledWith('home', mockOptimisticMessage);
    });

    it('should handle retry errors', async () => {
      const mockOptimisticMessage = {
        id: 'temp-123',
        tempId: 'temp-123',
        type: 'user' as const,
        content: 'Failed message',
        timestamp: new Date(),
        status: 'failed' as const
      };

      mockStore.optimisticMessages.home = [mockOptimisticMessage];
      mockStore.retryMessage.mockRejectedValue(new Error('Retry failed'));
      
      const { result } = renderHook(() => useChatManager());

      await act(async () => {
        try {
          await result.current.retryFailedMessage('temp-123');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });
  });

  describe('clearError action', () => {
    it('should clear current error', () => {
      const { result } = renderHook(() => useChatManager());

      act(() => {
        result.current.clearError();
      });

      expect(mockStore.setError).toHaveBeenCalledWith(null);
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      mockStore.getCombinedMessages.mockReturnValue([
        { id: '1', type: 'ai', content: 'Hello', timestamp: '2024-01-01T00:00:00Z' },
        { id: '2', type: 'user', content: 'Hi there', timestamp: '2024-01-01T00:01:00Z' }
      ]);
      mockStore.getMessageCount.mockReturnValue(2);
    });

    it('should return correct message count', () => {
      const { result } = renderHook(() => useChatManager());

      expect(result.current.getMessageCount('home')).toBe(2);
      expect(mockStore.getMessageCount).toHaveBeenCalledWith('home');
    });

    it('should check for unread messages correctly', () => {
      mockStore.getPendingCount.mockReturnValue(1);
      mockStore.getFailedCount.mockReturnValue(0);
      
      const { result } = renderHook(() => useChatManager());

      expect(result.current.hasUnreadMessages('home')).toBe(true);
    });

    it('should return false when no unread messages', () => {
      mockStore.getPendingCount.mockReturnValue(0);
      mockStore.getFailedCount.mockReturnValue(0);
      
      const { result } = renderHook(() => useChatManager());

      expect(result.current.hasUnreadMessages('home')).toBe(false);
    });

    it('should consider failed messages as unread', () => {
      mockStore.getPendingCount.mockReturnValue(0);
      mockStore.getFailedCount.mockReturnValue(1);
      
      const { result } = renderHook(() => useChatManager());

      expect(result.current.hasUnreadMessages('progress')).toBe(true);
    });
  });

  describe('memoization and performance', () => {
    it('should memoize actions to prevent unnecessary re-renders', () => {
      const { result, rerender } = renderHook(() => useChatManager());
      
      const firstActions = {
        sendMessage: result.current.sendMessage,
        switchTab: result.current.switchTab,
        retryFailedMessage: result.current.retryFailedMessage,
        clearError: result.current.clearError
      };

      rerender();

      const secondActions = {
        sendMessage: result.current.sendMessage,
        switchTab: result.current.switchTab,
        retryFailedMessage: result.current.retryFailedMessage,
        clearError: result.current.clearError
      };

      // Actions should be memoized (same reference)
      expect(firstActions.sendMessage).toBe(secondActions.sendMessage);
      expect(firstActions.switchTab).toBe(secondActions.switchTab);
      expect(firstActions.retryFailedMessage).toBe(secondActions.retryFailedMessage);
      expect(firstActions.clearError).toBe(secondActions.clearError);
    });
  });

  describe('integration with optimistic updates', () => {
    it('should handle optimistic messages correctly', () => {
      const optimisticMessage = {
        id: 'temp-456',
        type: 'user' as const,
        content: 'Optimistic message',
        timestamp: new Date(),
        status: 'pending' as const
      };

      mockStore.optimisticMessages.home = [optimisticMessage];
      mockStore.getCombinedMessages.mockReturnValue([optimisticMessage]);
      
      const { result } = renderHook(() => useChatManager());

      expect(result.current.messages).toContain(optimisticMessage);
    });

    it('should provide correct unread counts including optimistic messages', () => {
      mockStore.getPendingCount.mockReturnValue(2);
      mockStore.getFailedCount.mockReturnValue(1);
      
      const { result } = renderHook(() => useChatManager());

      expect(result.current.hasUnreadMessages('explore')).toBe(true);
    });
  });
});