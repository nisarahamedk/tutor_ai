import { useState, useCallback, useOptimistic } from 'react';
import type { OptimisticMessage, MessageStatus, UseBatchOptimisticResult } from '../components/chat/types';

// Generate unique temporary ID
const generateTempId = (): string => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Optimistic reducer for batch operations
function batchOptimisticReducer(
  state: OptimisticMessage[],
  action: { type: 'add' | 'update' | 'remove' | 'batch_update'; payload: any }
): OptimisticMessage[] {
  switch (action.type) {
    case 'add':
      return [...state, action.payload];
    
    case 'update':
      return state.map(msg => 
        (msg.tempId === action.payload.tempId || msg.id === action.payload.tempId)
          ? { ...msg, ...action.payload.updates }
          : msg
      );
    
    case 'remove':
      return state.filter(msg => 
        msg.tempId !== action.payload.tempId && msg.id !== action.payload.tempId
      );
    
    case 'batch_update':
      return state.map(msg => {
        const update = action.payload.find((u: any) => 
          u.tempId === msg.tempId || u.tempId === msg.id
        );
        return update ? { ...msg, status: update.status, error: update.error } : msg;
      });
    
    default:
      return state;
  }
}

export function useBatchOptimistic(
  initialMessages: OptimisticMessage[] = []
): UseBatchOptimisticResult {
  // Use React 19's useOptimistic for optimistic updates
  const [optimisticMessages, dispatch] = useOptimistic(
    initialMessages,
    batchOptimisticReducer
  );

  // Add a new optimistic message
  const addOptimisticMessage = useCallback((
    messageData: Omit<OptimisticMessage, 'id' | 'timestamp'>
  ): OptimisticMessage => {
    const tempId = generateTempId();
    const message: OptimisticMessage = {
      id: tempId,
      timestamp: new Date(),
      tempId,
      ...messageData,
    };

    dispatch({ type: 'add', payload: message });
    return message;
  }, [dispatch]);

  // Update message status (for pending -> sent/failed transitions)
  const updateMessageStatus = useCallback((
    tempId: string,
    status: MessageStatus,
    error?: string
  ): void => {
    dispatch({
      type: 'update',
      payload: {
        tempId,
        updates: { status, error, retrying: false },
      },
    });
  }, [dispatch]);

  // Remove an optimistic message (useful for cleanup)
  const removeOptimisticMessage = useCallback((tempId: string): void => {
    dispatch({ type: 'remove', payload: { tempId } });
  }, [dispatch]);

  // Batch update multiple messages (for performance)
  const batchUpdateMessages = useCallback((
    updates: Array<{ tempId: string; status: MessageStatus; error?: string }>
  ): void => {
    dispatch({ type: 'batch_update', payload: updates });
  }, [dispatch]);

  return {
    optimisticMessages,
    addOptimisticMessage,
    updateMessageStatus,
    removeOptimisticMessage,
    batchUpdateMessages,
  };
}

// Utility function to create optimistic message from content
export function createOptimisticMessage(
  content: string,
  type: 'user' | 'ai' = 'user',
  status: MessageStatus = 'pending'
): Omit<OptimisticMessage, 'id' | 'timestamp'> {
  return {
    type,
    content: content.trim(),
    status,
  };
}

// Utility function to convert regular message to optimistic message
export function toOptimisticMessage(
  message: {
    id?: string;
    type: 'user' | 'ai';
    content: string;
    timestamp?: Date;
  },
  status: MessageStatus = 'sent'
): OptimisticMessage {
  return {
    id: message.id || generateTempId(),
    type: message.type,
    content: message.content,
    timestamp: message.timestamp || new Date(),
    status,
  };
}

// Utility function to check if message is optimistic (has tempId)
export function isOptimisticMessage(message: OptimisticMessage): boolean {
  return Boolean(message.tempId);
}

// Utility function to get pending messages
export function getPendingMessages(messages: OptimisticMessage[]): OptimisticMessage[] {
  return messages.filter(msg => msg.status === 'pending');
}

// Utility function to get failed messages
export function getFailedMessages(messages: OptimisticMessage[]): OptimisticMessage[] {
  return messages.filter(msg => msg.status === 'failed');
}

// Utility function to count messages by status
export function countMessagesByStatus(
  messages: OptimisticMessage[]
): Record<MessageStatus, number> {
  return messages.reduce(
    (acc, msg) => {
      acc[msg.status] = (acc[msg.status] || 0) + 1;
      return acc;
    },
    { pending: 0, sent: 0, failed: 0 } as Record<MessageStatus, number>
  );
}