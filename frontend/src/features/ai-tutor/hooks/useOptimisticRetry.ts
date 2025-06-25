import { useState, useCallback, useRef } from 'react';
import type { OptimisticMessage, UseOptimisticRetryResult } from '../components/chat/types';

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastRetryTime: number;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // Base delay in ms
const RETRY_DELAY_MULTIPLIER = 2; // Exponential backoff multiplier

export function useOptimisticRetry(): UseOptimisticRetryResult {
  const [retryStates, setRetryStates] = useState<Record<string, RetryState>>({});
  const retryTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Retry a failed message with exponential backoff
  const retryMessage = useCallback(async (message: OptimisticMessage): Promise<void> => {
    const messageId = message.tempId || message.id;
    const currentState = retryStates[messageId] || { isRetrying: false, retryCount: 0, lastRetryTime: 0 };

    // Check if already retrying or max attempts reached
    if (currentState.isRetrying) {
      console.warn(`Message ${messageId} is already being retried`);
      return;
    }

    if (currentState.retryCount >= MAX_RETRY_ATTEMPTS) {
      console.warn(`Message ${messageId} has reached maximum retry attempts`);
      return;
    }

    // Calculate delay with exponential backoff
    const delay = RETRY_DELAY_BASE * Math.pow(RETRY_DELAY_MULTIPLIER, currentState.retryCount);
    const timeSinceLastRetry = Date.now() - currentState.lastRetryTime;
    const remainingDelay = Math.max(0, delay - timeSinceLastRetry);

    // Update retry state
    setRetryStates(prev => ({
      ...prev,
      [messageId]: {
        ...currentState,
        isRetrying: true,
        retryCount: currentState.retryCount + 1,
        lastRetryTime: Date.now(),
      },
    }));

    try {
      // Wait for backoff delay if needed
      if (remainingDelay > 0) {
        await new Promise(resolve => {
          retryTimeouts.current[messageId] = setTimeout(resolve, remainingDelay);
        });
      }

      // TODO: This should be connected to the actual message sending logic
      // For now, we'll simulate the retry with a Promise
      const success = await simulateRetry(message, currentState.retryCount);

      if (success) {
        // Clear retry state on success
        setRetryStates(prev => {
          const newState = { ...prev };
          delete newState[messageId];
          return newState;
        });
      } else {
        // Update retry state to not retrying, but keep count
        setRetryStates(prev => ({
          ...prev,
          [messageId]: {
            ...prev[messageId],
            isRetrying: false,
          },
        }));
      }
    } catch (error) {
      console.error(`Retry failed for message ${messageId}:`, error);
      
      // Update retry state to not retrying
      setRetryStates(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          isRetrying: false,
        },
      }));
    } finally {
      // Clean up timeout
      if (retryTimeouts.current[messageId]) {
        clearTimeout(retryTimeouts.current[messageId]);
        delete retryTimeouts.current[messageId];
      }
    }
  }, [retryStates]);

  // Check if a message is currently being retried
  const isRetrying = useCallback((messageId: string): boolean => {
    return retryStates[messageId]?.isRetrying || false;
  }, [retryStates]);

  // Get retry count for a message
  const retryCount = useCallback((messageId: string): number => {
    return retryStates[messageId]?.retryCount || 0;
  }, [retryStates]);

  // Clear retry state for a message
  const clearRetryState = useCallback((messageId: string): void => {
    setRetryStates(prev => {
      const newState = { ...prev };
      delete newState[messageId];
      return newState;
    });

    // Clear any pending timeout
    if (retryTimeouts.current[messageId]) {
      clearTimeout(retryTimeouts.current[messageId]);
      delete retryTimeouts.current[messageId];
    }
  }, []);

  return {
    retryMessage,
    isRetrying,
    retryCount,
    clearRetryState,
  };
}

// Simulate retry logic (replace with actual implementation)
async function simulateRetry(message: OptimisticMessage, retryCount: number): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // Simulate increasing success rate with retries
  const successRate = Math.min(0.3 + (retryCount * 0.3), 0.9);
  const success = Math.random() < successRate;
  
  if (!success) {
    throw new Error(`Retry ${retryCount} failed for message: ${message.content}`);
  }
  
  return true;
}

// Export for testing
export { MAX_RETRY_ATTEMPTS, RETRY_DELAY_BASE, RETRY_DELAY_MULTIPLIER };