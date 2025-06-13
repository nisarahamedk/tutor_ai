'use server';

import { revalidatePath } from 'next/cache';
import { apiClient } from '../../../lib/api';
import type { MessageActionState, TabType, SendMessageRequest, SendMessageResponse } from './types';

const VALID_TAB_TYPES: TabType[] = ['home', 'progress', 'review', 'explore'];

export async function sendMessageAction(
  prevState: MessageActionState | null,
  formData: FormData
): Promise<MessageActionState> {
  try {
    // Extract and validate form data
    const message = formData.get('message')?.toString()?.trim();
    const tabType = formData.get('tabType')?.toString() as TabType;

    // Input validation
    if (!message) {
      return {
        success: false,
        error: 'Message cannot be empty',
        isLoading: false,
        message: null,
      };
    }

    if (!tabType || !VALID_TAB_TYPES.includes(tabType)) {
      return {
        success: false,
        error: 'Invalid tab type',
        isLoading: false,
        message: null,
      };
    }

    // Prepare request payload
    const requestData: SendMessageRequest = {
      message,
      tabType,
      timestamp: new Date().toISOString(),
    };

    // Send message to FastAPI backend
    const response = await apiClient.post<SendMessageResponse>('/chat/send', requestData);

    // Revalidate the AI tutor page to update server components
    revalidatePath('/ai-tutor');

    return {
      success: true,
      error: null,
      isLoading: false,
      message: {
        id: response.id,
        role: response.role,
        content: response.content,
        timestamp: response.timestamp,
      },
    };
  } catch (error) {
    console.error('Failed to send message:', error);
    
    return {
      success: false,
      error: 'Failed to send message. Please try again.',
      isLoading: false,
      message: null,
    };
  }
}