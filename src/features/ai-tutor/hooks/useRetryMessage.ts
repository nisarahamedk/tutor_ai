'use client';

import { useState, useCallback } from 'react';
import { useMessageAction } from './useMessageAction';
import type { TabType } from '../actions/types';

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastFailedMessage: string | null;
  lastFailedTab: TabType | null;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff

export function useRetryMessage() {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastFailedMessage: null,
    lastFailedTab: null,
  });

  const { sendMessage, isPending } = useMessageAction();

  const retryMessage = useCallback(async (
    message?: string,
    tabType?: TabType,
    onMessageSent?: (message: string) => void
  ) => {
    const messageToRetry = message || retryState.lastFailedMessage;
    const tabToRetry = tabType || retryState.lastFailedTab;

    if (!messageToRetry || !tabToRetry) {
      console.warn('No message to retry');
      return false;
    }

    if (retryState.retryCount >= MAX_RETRY_ATTEMPTS) {
      console.warn('Maximum retry attempts reached');
      return false;
    }

    setRetryState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      // Wait for exponential backoff delay
      const delay = RETRY_DELAYS[retryState.retryCount] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
      await new Promise(resolve => setTimeout(resolve, delay));

      // Add user message if callback provided
      onMessageSent?.(messageToRetry);

      // Retry the server action
      const formData = new FormData();
      formData.set('message', messageToRetry);
      formData.set('tabType', tabToRetry);
      
      await sendMessage(formData);

      // Reset retry state on success
      setRetryState({
        isRetrying: false,
        retryCount: 0,
        lastFailedMessage: null,
        lastFailedTab: null,
      });

      return true;
    } catch (error) {
      console.error('Retry failed:', error);
      setRetryState(prev => ({
        ...prev,
        isRetrying: false,
      }));
      return false;
    }
  }, [retryState, sendMessage]);

  const recordFailedMessage = useCallback((message: string, tabType: TabType) => {
    setRetryState(prev => ({
      ...prev,
      lastFailedMessage: message,
      lastFailedTab: tabType,
      retryCount: 0, // Reset count for new message
    }));
  }, []);

  const resetRetryState = useCallback(() => {
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      lastFailedMessage: null,
      lastFailedTab: null,
    });
  }, []);

  const canRetry = retryState.lastFailedMessage && 
                   retryState.lastFailedTab && 
                   retryState.retryCount < MAX_RETRY_ATTEMPTS &&
                   !retryState.isRetrying &&
                   !isPending;

  return {
    retryMessage,
    recordFailedMessage,
    resetRetryState,
    canRetry,
    isRetrying: retryState.isRetrying,
    retryCount: retryState.retryCount,
    maxRetries: MAX_RETRY_ATTEMPTS,
  };
}