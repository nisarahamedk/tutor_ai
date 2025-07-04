import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendChatMessageAction, getChatHistoryAction, clearChatHistoryAction } from '../chat-actions';
import { apiClient } from '../../lib/api';

// API error type for testing
interface ApiErrorResponse extends Error {
  status?: number;
}

// Mock the API client
vi.mock('../../lib/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock Next.js functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('chat-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendChatMessageAction', () => {
    it('should send a chat message successfully', async () => {
      const mockResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: 'assistant',
        content: 'Hello! How can I help you?',
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('message', 'Hello');
      formData.append('tabType', 'home');
      formData.append('timestamp', '2023-01-01T00:00:00Z');

      const result = await sendChatMessageAction(null, formData);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
      expect(result.message).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/chat/send', {
        message: 'Hello',
        tabType: 'home',
        timestamp: '2023-01-01T00:00:00Z',
      });
    });

    it('should handle validation errors', async () => {
      const formData = new FormData();
      formData.append('message', ''); // Empty message
      formData.append('tabType', 'home');

      const result = await sendChatMessageAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.message).toBeUndefined();
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error: 500 Internal Server Error') as ApiErrorResponse;
      error.status = 500;
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const formData = new FormData();
      formData.append('message', 'Hello');
      formData.append('tabType', 'home');
      formData.append('timestamp', '2023-01-01T00:00:00Z');

      const result = await sendChatMessageAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Server error. Please try again later.');
      expect(result.message).toBeNull();
    });

    it('should handle rate limiting errors', async () => {
      const error = new Error('API Error: 429 Too Many Requests') as ApiErrorResponse;
      error.status = 429;
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const formData = new FormData();
      formData.append('message', 'Hello');
      formData.append('tabType', 'home');
      formData.append('timestamp', '2023-01-01T00:00:00Z');

      const result = await sendChatMessageAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded. Please wait before sending another message.');
    });
  });

  describe('getChatHistoryAction', () => {
    it('should get chat history successfully', async () => {
      const mockMessages = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          role: 'user',
          content: 'Hello',
          timestamp: '2023-01-01T00:00:00Z',
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: '2023-01-01T00:01:00Z',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue(mockMessages);

      const result = await getChatHistoryAction('home');

      expect(result.success).toBe(true);
      expect(result.messages).toEqual(mockMessages);
      expect(apiClient.get).toHaveBeenCalledWith('/chat/history?tab=home');
    });

    it('should handle API errors when getting history', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      const result = await getChatHistoryAction('home');

      expect(result.success).toBe(false);
      expect(result.messages).toEqual([]);
      expect(result.error).toBe('Failed to load chat history');
    });
  });

  describe('clearChatHistoryAction', () => {
    it('should clear chat history successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({});

      const formData = new FormData();
      formData.append('tabType', 'home');

      const result = await clearChatHistoryAction(null, formData);

      expect(result.success).toBe(true);
      expect(apiClient.delete).toHaveBeenCalledWith('/chat/history?tab=home');
    });

    it('should handle missing tab type', async () => {
      const formData = new FormData();

      const result = await clearChatHistoryAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tab type is required');
    });

    it('should handle API errors when clearing history', async () => {
      vi.mocked(apiClient.delete).mockRejectedValue(new Error('Network error'));

      const formData = new FormData();
      formData.append('tabType', 'home');

      const result = await clearChatHistoryAction(null, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to clear chat history');
    });
  });
});