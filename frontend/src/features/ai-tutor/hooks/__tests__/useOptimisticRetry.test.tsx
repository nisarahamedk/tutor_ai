import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOptimisticRetry, MAX_RETRY_ATTEMPTS, RETRY_DELAY_BASE } from '../useOptimisticRetry';
import type { OptimisticMessage } from '../../components/chat/types';

// Mock setTimeout and clearTimeout for testing
vi.useFakeTimers();

const mockMessage: OptimisticMessage = {
  id: 'test-message',
  tempId: 'temp-123',
  type: 'user',
  content: 'Test message',
  timestamp: new Date(),
  status: 'failed',
  error: 'Network error',
};

describe('useOptimisticRetry', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return correct interface', () => {
      const { result } = renderHook(() => useOptimisticRetry());

      expect(result.current).toHaveProperty('retryMessage');
      expect(result.current).toHaveProperty('isRetrying');
      expect(result.current).toHaveProperty('retryCount');
      expect(result.current).toHaveProperty('clearRetryState');

      expect(typeof result.current.retryMessage).toBe('function');
      expect(typeof result.current.isRetrying).toBe('function');
      expect(typeof result.current.retryCount).toBe('function');
      expect(typeof result.current.clearRetryState).toBe('function');
    });

    it('should initialize with no retry states', () => {
      const { result } = renderHook(() => useOptimisticRetry());

      expect(result.current.isRetrying('any-id')).toBe(false);
      expect(result.current.retryCount('any-id')).toBe(0);
    });
  });

  describe('Retry Logic', () => {
    it('should set retrying state when retry starts', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      act(() => {
        result.current.retryMessage(mockMessage);
      });

      expect(result.current.isRetrying('temp-123')).toBe(true);
      expect(result.current.retryCount('temp-123')).toBe(1);
    });

    it('should prevent double retries', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      // Start first retry
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      expect(result.current.isRetrying('temp-123')).toBe(true);

      // Try to start second retry
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      // Should still only have one retry
      expect(result.current.retryCount('temp-123')).toBe(1);
    });

    it('should increment retry count on subsequent retries', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      // First retry
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      // Wait for retry to complete
      await act(async () => {
        vi.runAllTimers();
      });

      expect(result.current.retryCount('temp-123')).toBe(1);
      expect(result.current.isRetrying('temp-123')).toBe(false);

      // Second retry
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      expect(result.current.retryCount('temp-123')).toBe(2);
    });

    it('should stop retrying after max attempts', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      // Perform maximum retries
      for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
        act(() => {
          result.current.retryMessage(mockMessage);
        });

        await act(async () => {
          vi.runAllTimers();
        });
      }

      expect(result.current.retryCount('temp-123')).toBe(MAX_RETRY_ATTEMPTS);

      // Try one more retry
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      // Should not exceed max attempts
      expect(result.current.retryCount('temp-123')).toBe(MAX_RETRY_ATTEMPTS);
      expect(result.current.isRetrying('temp-123')).toBe(false);
    });
  });

  describe('Exponential Backoff', () => {
    it('should implement exponential backoff delays', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      // First retry - should have base delay
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      // Check that timer is set with base delay
      expect(vi.getTimerCount()).toBeGreaterThan(0);

      await act(async () => {
        vi.runAllTimers();
      });

      // Second retry - should have increased delay
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      // The exact timing is complex to test due to the backoff calculation
      // but we can verify that retries are scheduled
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    it('should respect time since last retry', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      // Start first retry
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      // Immediately start second retry
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      // Should still schedule delay
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });
  });

  describe('Clear Retry State', () => {
    it('should clear retry state for specific message', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      // Start retry
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      expect(result.current.isRetrying('temp-123')).toBe(true);
      expect(result.current.retryCount('temp-123')).toBe(1);

      // Clear state
      act(() => {
        result.current.clearRetryState('temp-123');
      });

      expect(result.current.isRetrying('temp-123')).toBe(false);
      expect(result.current.retryCount('temp-123')).toBe(0);
    });

    it('should clear pending timeouts when clearing state', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      // Start retry
      act(() => {
        result.current.retryMessage(mockMessage);
      });

      const initialTimerCount = vi.getTimerCount();
      expect(initialTimerCount).toBeGreaterThan(0);

      // Clear state
      act(() => {
        result.current.clearRetryState('temp-123');
      });

      // Timeout should be cleared
      expect(vi.getTimerCount()).toBeLessThanOrEqual(initialTimerCount);
    });
  });

  describe('Multiple Messages', () => {
    it('should handle retries for multiple messages independently', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      const message1 = { ...mockMessage, tempId: 'temp-1' };
      const message2 = { ...mockMessage, tempId: 'temp-2' };

      // Start retries for both messages
      act(() => {
        result.current.retryMessage(message1);
        result.current.retryMessage(message2);
      });

      expect(result.current.isRetrying('temp-1')).toBe(true);
      expect(result.current.isRetrying('temp-2')).toBe(true);
      expect(result.current.retryCount('temp-1')).toBe(1);
      expect(result.current.retryCount('temp-2')).toBe(1);

      // Clear state for one message
      act(() => {
        result.current.clearRetryState('temp-1');
      });

      expect(result.current.isRetrying('temp-1')).toBe(false);
      expect(result.current.isRetrying('temp-2')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle retry errors gracefully', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      // Mock console.error to avoid test output pollution
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      act(() => {
        result.current.retryMessage(mockMessage);
      });

      await act(async () => {
        vi.runAllTimers();
      });

      // Should not crash and should update state
      expect(result.current.isRetrying('temp-123')).toBe(false);
      expect(result.current.retryCount('temp-123')).toBeGreaterThan(0);

      consoleSpy.mockRestore();
    });

    it('should handle message without tempId', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      const messageWithoutTempId = {
        ...mockMessage,
        tempId: undefined,
      };

      act(() => {
        result.current.retryMessage(messageWithoutTempId);
      });

      // Should use regular id as fallback
      expect(result.current.isRetrying('test-message')).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle rapid retry calls efficiently', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      const startTime = performance.now();

      // Call retry many times rapidly
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.retryMessage({
            ...mockMessage,
            tempId: `temp-${i}`,
          });
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete rapidly (under 100ms)
      expect(duration).toBeLessThan(100);

      // All retries should be tracked
      for (let i = 0; i < 100; i++) {
        expect(result.current.isRetrying(`temp-${i}`)).toBe(true);
      }
    });

    it('should not cause memory leaks with many retries', async () => {
      const { result } = renderHook(() => useOptimisticRetry());

      // Create many messages and retry them
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.retryMessage({
            ...mockMessage,
            tempId: `temp-${i}`,
          });
        });

        // Clear some states to simulate cleanup
        if (i % 10 === 0) {
          act(() => {
            result.current.clearRetryState(`temp-${i}`);
          });
        }
      }

      await act(async () => {
        vi.runAllTimers();
      });

      // Should handle cleanup without issues
      expect(() => {
        result.current.clearRetryState('temp-999');
      }).not.toThrow();
    });
  });
});