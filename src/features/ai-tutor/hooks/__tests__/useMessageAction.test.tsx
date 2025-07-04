import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessageAction } from '../useMessageAction';

// Mock the server action
vi.mock('../../actions/sendMessage', () => ({
  sendMessageAction: vi.fn(),
}));

import { sendMessageAction } from '../../actions/sendMessage';

const mockSendMessageAction = sendMessageAction as unknown as ReturnType<typeof vi.fn>;

describe('useMessageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useMessageAction());

      expect(result.current.state).toEqual({
        success: false,
        error: null,
        isLoading: false,
        message: null,
      });
      expect(result.current.isPending).toBe(false);
      expect(typeof result.current.sendMessage).toBe('function');
    });

    it('should accept custom initial state', () => {
      const customInitialState = {
        success: true,
        error: 'Previous error',
        isLoading: false,
        message: {
          id: 'prev-msg',
          role: 'user' as const,
          content: 'Previous message',
          timestamp: '2024-01-01T12:00:00Z',
        },
      };

      const { result } = renderHook(() => useMessageAction(customInitialState));

      expect(result.current.state).toEqual(customInitialState);
    });
  });

  describe('Message Sending', () => {
    it('should handle successful message sending', async () => {
      const mockResponse = {
        success: true,
        error: null,
        isLoading: false,
        message: {
          id: 'msg-123',
          role: 'assistant' as const,
          content: 'Hello! How can I help you?',
          timestamp: '2024-01-01T12:00:00Z',
        },
      };

      mockSendMessageAction.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useMessageAction());

      await act(async () => {
        const formData = new FormData();
        formData.set('message', 'Hello');
        formData.set('tabType', 'GENERAL');
        
        await result.current.sendMessage(formData);
      });

      expect(result.current.state).toEqual(mockResponse);
      expect(result.current.isPending).toBe(false);
    });

    it('should handle message sending errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Network error occurred',
        isLoading: false,
        message: null,
      };

      mockSendMessageAction.mockResolvedValueOnce(mockErrorResponse);

      const { result } = renderHook(() => useMessageAction());

      await act(async () => {
        const formData = new FormData();
        formData.set('message', 'Hello');
        formData.set('tabType', 'GENERAL');
        
        await result.current.sendMessage(formData);
      });

      expect(result.current.state).toEqual(mockErrorResponse);
      expect(result.current.isPending).toBe(false);
    });

    it('should set isPending to true during message sending', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockSendMessageAction.mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => useMessageAction());

      act(() => {
        const formData = new FormData();
        formData.set('message', 'Hello');
        formData.set('tabType', 'GENERAL');
        
        result.current.sendMessage(formData);
      });

      expect(result.current.isPending).toBe(true);

      await act(async () => {
        resolvePromise!({
          success: true,
          error: null,
          isLoading: false,
          message: null,
        });
      });

      expect(result.current.isPending).toBe(false);
    });

    it('should handle multiple consecutive sends correctly', async () => {
      const responses = [
        {
          success: true,
          error: null,
          isLoading: false,
          message: {
            id: 'msg-1',
            role: 'assistant' as const,
            content: 'First response',
            timestamp: '2024-01-01T12:00:00Z',
          },
        },
        {
          success: true,
          error: null,
          isLoading: false,
          message: {
            id: 'msg-2',
            role: 'assistant' as const,
            content: 'Second response',
            timestamp: '2024-01-01T12:01:00Z',
          },
        },
      ];

      mockSendMessageAction
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1]);

      const { result } = renderHook(() => useMessageAction());

      // Send first message
      await act(async () => {
        const formData1 = new FormData();
        formData1.set('message', 'First message');
        formData1.set('tabType', 'GENERAL');
        
        await result.current.sendMessage(formData1);
      });

      expect(result.current.state).toEqual(responses[0]);

      // Send second message
      await act(async () => {
        const formData2 = new FormData();
        formData2.set('message', 'Second message');
        formData2.set('tabType', 'GENERAL');
        
        await result.current.sendMessage(formData2);
      });

      expect(result.current.state).toEqual(responses[1]);
    });
  });

  describe('Form Data Handling', () => {
    it('should pass form data correctly to server action', async () => {
      mockSendMessageAction.mockResolvedValueOnce({
        success: true,
        error: null,
        isLoading: false,
        message: null,
      });

      const { result } = renderHook(() => useMessageAction());

      const formData = new FormData();
      formData.set('message', 'Test message');
      formData.set('tabType', 'CODING');

      await act(async () => {
        await result.current.sendMessage(formData);
      });

      expect(mockSendMessageAction).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: null,
          isLoading: false,
          message: null,
        }),
        formData
      );
    });

    it('should handle form data with additional fields', async () => {
      mockSendMessageAction.mockResolvedValueOnce({
        success: true,
        error: null,
        isLoading: false,
        message: null,
      });

      const { result } = renderHook(() => useMessageAction());

      const formData = new FormData();
      formData.set('message', 'Test message');
      formData.set('tabType', 'LEARNING');
      formData.set('context', 'lesson-123');

      await act(async () => {
        await result.current.sendMessage(formData);
      });

      expect(mockSendMessageAction).toHaveBeenCalledWith(
        expect.anything(),
        formData
      );
    });
  });

  describe('State Management', () => {
    it('should maintain state between re-renders', () => {
      const { result, rerender } = renderHook(() => useMessageAction());

      const initialState = result.current.state;

      rerender();

      expect(result.current.state).toBe(initialState);
    });

    it('should update state based on server action response', async () => {
      const mockResponse = {
        success: true,
        error: null,
        isLoading: false,
        message: {
          id: 'msg-456',
          role: 'assistant' as const,
          content: 'Updated response',
          timestamp: '2024-01-01T12:00:00Z',
        },
      };

      mockSendMessageAction.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useMessageAction());

      expect(result.current.state.message).toBeNull();

      await act(async () => {
        const formData = new FormData();
        formData.set('message', 'Hello');
        formData.set('tabType', 'GENERAL');
        
        await result.current.sendMessage(formData);
      });

      expect(result.current.state.message).toEqual(mockResponse.message);
    });

    it('should handle state transitions correctly', async () => {
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockSendMessageAction.mockReturnValueOnce(pendingPromise);

      const { result } = renderHook(() => useMessageAction());

      // Initial state
      expect(result.current.state.success).toBe(false);
      expect(result.current.isPending).toBe(false);

      // Start sending
      act(() => {
        const formData = new FormData();
        formData.set('message', 'Hello');
        formData.set('tabType', 'GENERAL');
        
        result.current.sendMessage(formData);
      });

      // Pending state
      expect(result.current.isPending).toBe(true);

      // Complete sending
      await act(async () => {
        resolvePromise!({
          success: true,
          error: null,
          isLoading: false,
          message: {
            id: 'msg-789',
            role: 'assistant' as const,
            content: 'Success response',
            timestamp: '2024-01-01T12:00:00Z',
          },
        });
      });

      // Final state
      expect(result.current.state.success).toBe(true);
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle server action throwing an error', async () => {
      mockSendMessageAction.mockRejectedValueOnce(new Error('Unexpected error'));

      const { result } = renderHook(() => useMessageAction());

      await act(async () => {
        const formData = new FormData();
        formData.set('message', 'Hello');
        formData.set('tabType', 'GENERAL');
        
        try {
          await result.current.sendMessage(formData);
        } catch {
          // Error should be handled by useActionState
        }
      });

      expect(result.current.isPending).toBe(false);
      // The actual error handling behavior depends on React 19's useActionState implementation
    });

    it('should reset error state on new successful send', async () => {
      // First, simulate an error
      mockSendMessageAction.mockResolvedValueOnce({
        success: false,
        error: 'First error',
        isLoading: false,
        message: null,
      });

      const { result } = renderHook(() => useMessageAction());

      await act(async () => {
        const formData = new FormData();
        formData.set('message', 'First message');
        formData.set('tabType', 'GENERAL');
        
        await result.current.sendMessage(formData);
      });

      expect(result.current.state.error).toBe('First error');

      // Then, simulate a success
      mockSendMessageAction.mockResolvedValueOnce({
        success: true,
        error: null,
        isLoading: false,
        message: {
          id: 'msg-success',
          role: 'assistant' as const,
          content: 'Success after error',
          timestamp: '2024-01-01T12:00:00Z',
        },
      });

      await act(async () => {
        const formData = new FormData();
        formData.set('message', 'Second message');
        formData.set('tabType', 'GENERAL');
        
        await result.current.sendMessage(formData);
      });

      expect(result.current.state.error).toBeNull();
      expect(result.current.state.success).toBe(true);
    });
  });
});