import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { 
  useBatchOptimistic, 
  createOptimisticMessage, 
  toOptimisticMessage,
  isOptimisticMessage,
  getPendingMessages,
  getFailedMessages,
  countMessagesByStatus,
} from '../useBatchOptimistic';
import type { OptimisticMessage } from '../../components/chat/types';

// Mock React's useOptimistic hook
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return {
    ...actual,
    useOptimistic: vi.fn(),
  };
});

const mockUseOptimistic = React.useOptimistic as unknown as ReturnType<typeof vi.fn>;

const sampleMessage: OptimisticMessage = {
  id: 'test-1',
  tempId: 'temp-1',
  type: 'user',
  content: 'Test message',
  timestamp: new Date(),
  status: 'pending',
};

describe('useBatchOptimistic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize with empty messages by default', () => {
      const mockDispatch = vi.fn();
      mockUseOptimistic.mockReturnValue([[], mockDispatch]);

      const { result } = renderHook(() => useBatchOptimistic());

      expect(result.current.optimisticMessages).toEqual([]);
      expect(mockUseOptimistic).toHaveBeenCalledWith([], expect.any(Function));
    });

    it('should initialize with provided initial messages', () => {
      const initialMessages = [sampleMessage];
      const mockDispatch = vi.fn();
      mockUseOptimistic.mockReturnValue([initialMessages, mockDispatch]);

      const { result } = renderHook(() => useBatchOptimistic(initialMessages));

      expect(result.current.optimisticMessages).toEqual(initialMessages);
      expect(mockUseOptimistic).toHaveBeenCalledWith(initialMessages, expect.any(Function));
    });

    it('should return correct interface', () => {
      const mockDispatch = vi.fn();
      mockUseOptimistic.mockReturnValue([[], mockDispatch]);

      const { result } = renderHook(() => useBatchOptimistic());

      expect(result.current).toHaveProperty('optimisticMessages');
      expect(result.current).toHaveProperty('addOptimisticMessage');
      expect(result.current).toHaveProperty('updateMessageStatus');
      expect(result.current).toHaveProperty('removeOptimisticMessage');
      expect(result.current).toHaveProperty('batchUpdateMessages');

      expect(typeof result.current.addOptimisticMessage).toBe('function');
      expect(typeof result.current.updateMessageStatus).toBe('function');
      expect(typeof result.current.removeOptimisticMessage).toBe('function');
      expect(typeof result.current.batchUpdateMessages).toBe('function');
    });
  });

  describe('Add Optimistic Message', () => {
    it('should add message with generated ID and timestamp', () => {
      const mockDispatch = vi.fn();
      mockUseOptimistic.mockReturnValue([[], mockDispatch]);

      const { result } = renderHook(() => useBatchOptimistic());

      const messageData = {
        type: 'user' as const,
        content: 'Test message',
        status: 'pending' as const,
      };

      act(() => {
        const addedMessage = result.current.addOptimisticMessage(messageData);

        expect(addedMessage).toMatchObject({
          type: 'user',
          content: 'Test message',
          status: 'pending',
        });
        expect(addedMessage.id).toBeDefined();
        expect(addedMessage.tempId).toBeDefined();
        expect(addedMessage.timestamp).toBeInstanceOf(Date);
        expect(addedMessage.tempId).toMatch(/^temp-/);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'add',
        payload: expect.objectContaining({
          type: 'user',
          content: 'Test message',
          status: 'pending',
        }),
      });
    });

    it('should generate unique IDs for multiple messages', () => {
      const mockDispatch = vi.fn();
      mockUseOptimistic.mockReturnValue([[], mockDispatch]);

      const { result } = renderHook(() => useBatchOptimistic());

      const messageData = {
        type: 'user' as const,
        content: 'Test message',
        status: 'pending' as const,
      };

      let message1: OptimisticMessage;
      let message2: OptimisticMessage;

      act(() => {
        message1 = result.current.addOptimisticMessage(messageData);
        message2 = result.current.addOptimisticMessage(messageData);
      });

      expect(message1!.id).not.toBe(message2!.id);
      expect(message1!.tempId).not.toBe(message2!.tempId);
    });
  });

  describe('Update Message Status', () => {
    it('should update message status by tempId', () => {
      const mockDispatch = vi.fn();
      mockUseOptimistic.mockReturnValue([[], mockDispatch]);

      const { result } = renderHook(() => useBatchOptimistic());

      act(() => {
        result.current.updateMessageStatus('temp-123', 'sent');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'update',
        payload: {
          tempId: 'temp-123',
          updates: { status: 'sent', error: undefined, retrying: false },
        },
      });
    });

    it('should update message status with error', () => {
      const mockDispatch = vi.fn();
      mockUseOptimistic.mockReturnValue([[], mockDispatch]);

      const { result } = renderHook(() => useBatchOptimistic());

      act(() => {
        result.current.updateMessageStatus('temp-123', 'failed', 'Network error');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'update',
        payload: {
          tempId: 'temp-123',
          updates: { status: 'failed', error: 'Network error', retrying: false },
        },
      });
    });
  });

  describe('Remove Optimistic Message', () => {
    it('should remove message by tempId', () => {
      const mockDispatch = vi.fn();
      mockUseOptimistic.mockReturnValue([[], mockDispatch]);

      const { result } = renderHook(() => useBatchOptimistic());

      act(() => {
        result.current.removeOptimisticMessage('temp-123');
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'remove',
        payload: { tempId: 'temp-123' },
      });
    });
  });

  describe('Batch Update Messages', () => {
    it('should batch update multiple messages', () => {
      const mockDispatch = vi.fn();
      mockUseOptimistic.mockReturnValue([[], mockDispatch]);

      const { result } = renderHook(() => useBatchOptimistic());

      const updates = [
        { tempId: 'temp-1', status: 'sent' as const },
        { tempId: 'temp-2', status: 'failed' as const, error: 'Network error' },
      ];

      act(() => {
        result.current.batchUpdateMessages(updates);
      });

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'batch_update',
        payload: updates,
      });
    });
  });

  describe('Optimistic Reducer', () => {
    it('should handle add action correctly', () => {
      const mockDispatch = vi.fn();
      let currentState: OptimisticMessage[] = [];
      
      // Mock the reducer behavior
      mockUseOptimistic.mockImplementation((initialState, reducer) => {
        const dispatch = (action: unknown) => {
          currentState = reducer(currentState, action);
          mockDispatch(action);
        };
        return [currentState, dispatch];
      });

      const { result } = renderHook(() => useBatchOptimistic());

      act(() => {
        result.current.addOptimisticMessage({
          type: 'user',
          content: 'Test',
          status: 'pending',
        });
      });

      expect(result.current.optimisticMessages).toHaveLength(1);
      expect(result.current.optimisticMessages[0]).toMatchObject({
        type: 'user',
        content: 'Test',
        status: 'pending',
      });
    });

    it('should handle update action correctly', () => {
      const initialMessage = { ...sampleMessage };
      const mockDispatch = vi.fn();
      let currentState: OptimisticMessage[] = [initialMessage];
      
      mockUseOptimistic.mockImplementation((initialState, reducer) => {
        const dispatch = (action: unknown) => {
          currentState = reducer(currentState, action);
          mockDispatch(action);
        };
        return [currentState, dispatch];
      });

      const { result } = renderHook(() => useBatchOptimistic([initialMessage]));

      act(() => {
        result.current.updateMessageStatus('temp-1', 'sent');
      });

      expect(result.current.optimisticMessages[0].status).toBe('sent');
    });

    it('should handle remove action correctly', () => {
      const initialMessage = { ...sampleMessage };
      const mockDispatch = vi.fn();
      let currentState: OptimisticMessage[] = [initialMessage];
      
      mockUseOptimistic.mockImplementation((initialState, reducer) => {
        const dispatch = (action: unknown) => {
          currentState = reducer(currentState, action);
          mockDispatch(action);
        };
        return [currentState, dispatch];
      });

      const { result } = renderHook(() => useBatchOptimistic([initialMessage]));

      act(() => {
        result.current.removeOptimisticMessage('temp-1');
      });

      expect(result.current.optimisticMessages).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle batch operations efficiently', () => {
      const mockDispatch = vi.fn();
      mockUseOptimistic.mockReturnValue([[], mockDispatch]);

      const { result } = renderHook(() => useBatchOptimistic());

      const startTime = performance.now();

      act(() => {
        // Add multiple messages
        for (let i = 0; i < 100; i++) {
          result.current.addOptimisticMessage({
            type: 'user',
            content: `Message ${i}`,
            status: 'pending',
          });
        }

        // Batch update them
        const updates = Array.from({ length: 100 }, (_, i) => ({
          tempId: `temp-${i}`,
          status: 'sent' as const,
        }));
        
        result.current.batchUpdateMessages(updates);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete batch operations quickly (under 50ms)
      expect(duration).toBeLessThan(50);
      expect(mockDispatch).toHaveBeenCalledTimes(101); // 100 adds + 1 batch update
    });
  });
});

describe('Utility Functions', () => {
  describe('createOptimisticMessage', () => {
    it('should create optimistic message with defaults', () => {
      const message = createOptimisticMessage('Test content');

      expect(message).toEqual({
        type: 'user',
        content: 'Test content',
        status: 'pending',
      });
    });

    it('should create AI message when specified', () => {
      const message = createOptimisticMessage('AI response', 'ai', 'sent');

      expect(message).toEqual({
        type: 'ai',
        content: 'AI response',
        status: 'sent',
      });
    });

    it('should trim content', () => {
      const message = createOptimisticMessage('  spaced content  ');

      expect(message.content).toBe('spaced content');
    });
  });

  describe('toOptimisticMessage', () => {
    it('should convert regular message to optimistic message', () => {
      const regularMessage = {
        id: 'msg-1',
        type: 'user' as const,
        content: 'Regular message',
        timestamp: new Date('2024-01-01'),
      };

      const optimistic = toOptimisticMessage(regularMessage);

      expect(optimistic).toEqual({
        id: 'msg-1',
        type: 'user',
        content: 'Regular message',
        timestamp: new Date('2024-01-01'),
        status: 'sent',
      });
    });

    it('should generate ID if not provided', () => {
      const messageWithoutId = {
        type: 'user' as const,
        content: 'No ID message',
      };

      const optimistic = toOptimisticMessage(messageWithoutId);

      expect(optimistic.id).toBeDefined();
      expect(optimistic.id).toMatch(/^temp-/);
      expect(optimistic.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('isOptimisticMessage', () => {
    it('should identify optimistic messages by tempId', () => {
      const optimisticMsg = { ...sampleMessage, tempId: 'temp-123' };
      const regularMsg = { ...sampleMessage, tempId: undefined };

      expect(isOptimisticMessage(optimisticMsg)).toBe(true);
      expect(isOptimisticMessage(regularMsg)).toBe(false);
    });
  });

  describe('getPendingMessages', () => {
    it('should filter pending messages', () => {
      const messages: OptimisticMessage[] = [
        { ...sampleMessage, id: '1', status: 'pending' },
        { ...sampleMessage, id: '2', status: 'sent' },
        { ...sampleMessage, id: '3', status: 'pending' },
        { ...sampleMessage, id: '4', status: 'failed' },
      ];

      const pending = getPendingMessages(messages);

      expect(pending).toHaveLength(2);
      expect(pending.every(msg => msg.status === 'pending')).toBe(true);
    });
  });

  describe('getFailedMessages', () => {
    it('should filter failed messages', () => {
      const messages: OptimisticMessage[] = [
        { ...sampleMessage, id: '1', status: 'pending' },
        { ...sampleMessage, id: '2', status: 'sent' },
        { ...sampleMessage, id: '3', status: 'failed' },
        { ...sampleMessage, id: '4', status: 'failed' },
      ];

      const failed = getFailedMessages(messages);

      expect(failed).toHaveLength(2);
      expect(failed.every(msg => msg.status === 'failed')).toBe(true);
    });
  });

  describe('countMessagesByStatus', () => {
    it('should count messages by status correctly', () => {
      const messages: OptimisticMessage[] = [
        { ...sampleMessage, id: '1', status: 'pending' },
        { ...sampleMessage, id: '2', status: 'pending' },
        { ...sampleMessage, id: '3', status: 'sent' },
        { ...sampleMessage, id: '4', status: 'failed' },
      ];

      const counts = countMessagesByStatus(messages);

      expect(counts).toEqual({
        pending: 2,
        sent: 1,
        failed: 1,
      });
    });

    it('should handle empty message array', () => {
      const counts = countMessagesByStatus([]);

      expect(counts).toEqual({
        pending: 0,
        sent: 0,
        failed: 0,
      });
    });
  });
});