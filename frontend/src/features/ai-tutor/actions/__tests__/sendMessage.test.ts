import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessageAction, MessageActionState } from '../sendMessage';

// Mock the API client
vi.mock('../../../../lib/api', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

// Mock Next.js revalidation
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { apiClient } from '../../../../lib/api';
import { revalidatePath } from 'next/cache';

describe('sendMessageAction', () => {
  const mockApiPost = apiClient.post as any;
  const mockRevalidatePath = revalidatePath as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should return error for empty message', async () => {
      const formData = new FormData();
      formData.set('message', '');
      formData.set('tabType', 'home');

      const result = await sendMessageAction(null, formData);

      expect(result).toEqual({
        success: false,
        error: 'Message cannot be empty',
        isLoading: false,
        message: null,
      });
    });

    it('should return error for whitespace-only message', async () => {
      const formData = new FormData();
      formData.set('message', '   ');
      formData.set('tabType', 'home');

      const result = await sendMessageAction(null, formData);

      expect(result).toEqual({
        success: false,
        error: 'Message cannot be empty',
        isLoading: false,
        message: null,
      });
    });

    it('should return error for invalid tab type', async () => {
      const formData = new FormData();
      formData.set('message', 'Hello');
      formData.set('tabType', 'INVALID_TAB');

      const result = await sendMessageAction(null, formData);

      expect(result).toEqual({
        success: false,
        error: 'Invalid tab type',
        isLoading: false,
        message: null,
      });
    });

    it('should return error for missing message field', async () => {
      const formData = new FormData();
      formData.set('tabType', 'home');

      const result = await sendMessageAction(null, formData);

      expect(result).toEqual({
        success: false,
        error: 'Message cannot be empty',
        isLoading: false,
        message: null,
      });
    });

    it('should return error for missing tab type', async () => {
      const formData = new FormData();
      formData.set('message', 'Hello');

      const result = await sendMessageAction(null, formData);

      expect(result).toEqual({
        success: false,
        error: 'Invalid tab type',
        isLoading: false,
        message: null,
      });
    });
  });

  describe('Successful Message Sending', () => {
    it('should send message successfully and return response', async () => {
      const mockResponse = {
        id: 'msg-123',
        role: 'assistant',
        content: 'Hello! How can I help you?',
        timestamp: '2024-01-01T12:00:00Z',
      };

      mockApiPost.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.set('message', 'Hello');
      formData.set('tabType', 'home');

      const result = await sendMessageAction(null, formData);

      expect(result).toEqual({
        success: true,
        error: null,
        isLoading: false,
        message: mockResponse,
      });

      expect(mockApiPost).toHaveBeenCalledWith('/chat/send', {
        message: 'Hello',
        tabType: 'home',
        timestamp: expect.any(String),
      });

      expect(mockRevalidatePath).toHaveBeenCalledWith('/ai-tutor');
    });

    it('should handle different tab types correctly', async () => {
      const mockResponse = {
        id: 'msg-124',
        role: 'assistant',
        content: 'Let me help you with coding.',
        timestamp: '2024-01-01T12:00:00Z',
      };

      mockApiPost.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.set('message', 'Help me with JavaScript');
      formData.set('tabType', 'progress');

      const result = await sendMessageAction(null, formData);

      expect(result.success).toBe(true);
      expect(mockApiPost).toHaveBeenCalledWith('/chat/send', {
        message: 'Help me with JavaScript',
        tabType: 'progress',
        timestamp: expect.any(String),
      });
    });

    it('should preserve previous state when continuing conversation', async () => {
      const previousState: MessageActionState = {
        success: true,
        error: null,
        isLoading: false,
        message: {
          id: 'prev-msg',
          role: 'user',
          content: 'Previous message',
          timestamp: '2024-01-01T11:00:00Z',
        },
      };

      const mockResponse = {
        id: 'msg-125',
        role: 'assistant',
        content: 'Follow up response',
        timestamp: '2024-01-01T12:00:00Z',
      };

      mockApiPost.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.set('message', 'Follow up question');
      formData.set('tabType', 'home');

      const result = await sendMessageAction(previousState, formData);

      expect(result).toEqual({
        success: true,
        error: null,
        isLoading: false,
        message: mockResponse,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API network errors', async () => {
      mockApiPost.mockRejectedValueOnce(new Error('Network error'));

      const formData = new FormData();
      formData.set('message', 'Hello');
      formData.set('tabType', 'home');

      const result = await sendMessageAction(null, formData);

      expect(result).toEqual({
        success: false,
        error: 'Failed to send message. Please try again.',
        isLoading: false,
        message: null,
      });
    });

    it('should handle API validation errors from backend', async () => {
      const apiError = new Error('Validation failed');
      (apiError as any).status = 400;
      (apiError as any).message = 'Message too long';

      mockApiPost.mockRejectedValueOnce(apiError);

      const formData = new FormData();
      formData.set('message', 'Hello');
      formData.set('tabType', 'home');

      const result = await sendMessageAction(null, formData);

      expect(result).toEqual({
        success: false,
        error: 'Failed to send message. Please try again.',
        isLoading: false,
        message: null,
      });
    });

    it('should handle server errors (500)', async () => {
      const serverError = new Error('Internal server error');
      (serverError as any).status = 500;

      mockApiPost.mockRejectedValueOnce(serverError);

      const formData = new FormData();
      formData.set('message', 'Hello');
      formData.set('tabType', 'home');

      const result = await sendMessageAction(null, formData);

      expect(result).toEqual({
        success: false,
        error: 'Failed to send message. Please try again.',
        isLoading: false,
        message: null,
      });
    });

    it('should not revalidate path on error', async () => {
      mockApiPost.mockRejectedValueOnce(new Error('Network error'));

      const formData = new FormData();
      formData.set('message', 'Hello');
      formData.set('tabType', 'home');

      await sendMessageAction(null, formData);

      expect(mockRevalidatePath).not.toHaveBeenCalled();
    });
  });

  describe('Data Transformation', () => {
    it('should trim whitespace from message', async () => {
      const mockResponse = {
        id: 'msg-126',
        role: 'assistant',
        content: 'Response',
        timestamp: '2024-01-01T12:00:00Z',
      };

      mockApiPost.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.set('message', '  Hello World  ');
      formData.set('tabType', 'home');

      await sendMessageAction(null, formData);

      expect(mockApiPost).toHaveBeenCalledWith('/chat/send', {
        message: 'Hello World',
        tabType: 'home',
        timestamp: expect.any(String),
      });
    });

    it('should include timestamp in API call', async () => {
      const mockResponse = {
        id: 'msg-127',
        role: 'assistant',
        content: 'Response',
        timestamp: '2024-01-01T12:00:00Z',
      };

      mockApiPost.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.set('message', 'Hello');
      formData.set('tabType', 'home');

      await sendMessageAction(null, formData);

      expect(mockApiPost).toHaveBeenCalledWith('/chat/send', {
        message: 'Hello',
        tabType: 'home',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });
  });

  describe('Performance and Caching', () => {
    it('should revalidate the correct path after successful send', async () => {
      const mockResponse = {
        id: 'msg-128',
        role: 'assistant',
        content: 'Response',
        timestamp: '2024-01-01T12:00:00Z',
      };

      mockApiPost.mockResolvedValueOnce(mockResponse);

      const formData = new FormData();
      formData.set('message', 'Hello');
      formData.set('tabType', 'home');

      await sendMessageAction(null, formData);

      expect(mockRevalidatePath).toHaveBeenCalledWith('/ai-tutor');
      expect(mockRevalidatePath).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests properly', async () => {
      const mockResponse1 = {
        id: 'msg-129',
        role: 'assistant',
        content: 'Response 1',
        timestamp: '2024-01-01T12:00:00Z',
      };

      const mockResponse2 = {
        id: 'msg-130',
        role: 'assistant',
        content: 'Response 2',
        timestamp: '2024-01-01T12:01:00Z',
      };

      mockApiPost
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const formData1 = new FormData();
      formData1.set('message', 'First message');
      formData1.set('tabType', 'home');

      const formData2 = new FormData();
      formData2.set('message', 'Second message');
      formData2.set('tabType', 'progress');

      const [result1, result2] = await Promise.all([
        sendMessageAction(null, formData1),
        sendMessageAction(null, formData2),
      ]);

      expect(result1.success).toBe(true);
      expect(result1.message?.content).toBe('Response 1');
      expect(result2.success).toBe(true);
      expect(result2.message?.content).toBe('Response 2');
    });
  });
});