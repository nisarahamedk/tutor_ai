'use server';

import { revalidatePath } from 'next/cache';
import { apiClient } from '../lib/api';

// Common API response types
interface ApiErrorResponse extends Error {
  status?: number;
}
import { validateFormData, validateResponse, createValidationError } from '../validation';
import {
  SendMessageSchema,
  SendMessageResponseSchema,
  MessageActionState,
  type SendMessageRequest,
  type SendMessageResponse,
} from '../validation/schemas';

/**
 * Send a chat message to the AI tutor
 */
export async function sendChatMessageAction(
  prevState: MessageActionState | null,
  formData: FormData
): Promise<MessageActionState> {
  try {
    // Validate form data
    const validation = validateFormData(SendMessageSchema, formData);
    
    if (!validation.success) {
      return {
        ...createValidationError(
          validation.error || 'Invalid message data',
          validation.details
        ),
        message: null,
      };
    }

    const requestData: SendMessageRequest = validation.data!;

    // Send message to FastAPI backend
    const response = await apiClient.post<SendMessageResponse>('/chat/send', requestData);
    
    // Validate response
    const validatedResponse = validateResponse(SendMessageResponseSchema, response);

    // Revalidate pages that depend on chat data
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/chat');

    return {
      success: true,
      error: null,
      isLoading: false,
      message: validatedResponse,
    };
  } catch (error) {
    console.error('Failed to send chat message:', error);
    
    let errorMessage = 'Failed to send message. Please try again.';
    
    if (error instanceof Error) {
      if ('status' in error) {
        const status = (error as ApiErrorResponse).status;
        switch (status) {
          case 400:
            errorMessage = 'Invalid message format. Please check your input.';
            break;
          case 401:
            errorMessage = 'Please log in to continue chatting.';
            break;
          case 429:
            errorMessage = 'Rate limit exceeded. Please wait before sending another message.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
        }
      }
    }

    return {
      success: false,
      error: errorMessage,
      isLoading: false,
      message: null,
    };
  }
}

/**
 * Get chat history for a specific tab
 */
export async function getChatHistoryAction(
  tabType: string
): Promise<{ messages: SendMessageResponse[]; success: boolean; error?: string }> {
  try {
    const response = await apiClient.get<SendMessageResponse[]>(`/chat/history?tab=${tabType}`);
    
    // Validate each message in the response
    const validatedMessages = response.map(message => 
      validateResponse(SendMessageResponseSchema, message)
    );

    return {
      success: true,
      messages: validatedMessages,
    };
  } catch (error) {
    console.error('Failed to get chat history:', error);
    
    return {
      success: false,
      messages: [],
      error: 'Failed to load chat history',
    };
  }
}

/**
 * Clear chat history for a specific tab
 */
export async function clearChatHistoryAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const tabType = formData.get('tabType')?.toString();
    
    if (!tabType) {
      return {
        success: false,
        error: 'Tab type is required',
      };
    }

    await apiClient.delete(`/chat/history?tab=${tabType}`);

    // Revalidate pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/chat');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to clear chat history:', error);
    
    return {
      success: false,
      error: 'Failed to clear chat history',
    };
  }
}

/**
 * Export chat history as JSON or text
 */
export async function exportChatHistoryAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const tabType = formData.get('tabType')?.toString();
    const format = formData.get('format')?.toString() || 'json';
    
    if (!tabType) {
      return {
        success: false,
        error: 'Tab type is required',
      };
    }

    const response = await apiClient.get<string>(`/chat/export?tab=${tabType}&format=${format}`);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Failed to export chat history:', error);
    
    return {
      success: false,
      error: 'Failed to export chat history',
    };
  }
}