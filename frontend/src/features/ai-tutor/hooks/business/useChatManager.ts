// src/features/ai-tutor/hooks/business/useChatManager.ts
// Chat Manager Business Logic Hook - Extracts chat management from components

import { useCallback, useMemo } from 'react';
import { useChatStore } from '../../stores/chatStore';
import type { TabType, Message, OptimisticMessage } from '../../types';

/**
 * Interface for the Chat Manager return value
 */
export interface ChatManagerReturn {
  // State
  activeTab: TabType;
  messages: (Message | OptimisticMessage)[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (content: string, component?: React.ReactNode) => Promise<void>;
  switchTab: (tab: TabType) => void;
  retryFailedMessage: (messageId: string) => Promise<void>;
  clearError: () => void;
  
  // Computed
  hasUnreadMessages: (tab: TabType) => boolean;
  getMessageCount: (tab: TabType) => number;
}

/**
 * Chat Manager Hook - Handles all chat-related business logic
 * 
 * Extracts business logic from AITutorChat component to improve:
 * - Testability: Business logic can be tested in isolation
 * - Reusability: Can be used across multiple chat components
 * - Maintainability: Clear separation of concerns
 * - Performance: Optimized with memoization
 */
export const useChatManager = (): ChatManagerReturn => {
  // Subscribe to store state with optimized selectors
  const activeTab = useChatStore(state => state.activeTab);
  const isLoading = useChatStore(state => state.isLoading);
  const error = useChatStore(state => state.error);
  
  // Get current tab messages (memoized)
  const messages = useChatStore(
    useCallback(state => state.getCombinedMessages(activeTab), [activeTab])
  );
  
  // Store actions
  const setActiveTab = useChatStore(state => state.setActiveTab);
  const sendMessageWithOptimistic = useChatStore(state => state.sendMessageWithOptimistic);
  const retryMessage = useChatStore(state => state.retryMessage);
  const setError = useChatStore(state => state.setError);
  const getCombinedMessages = useChatStore(state => state.getCombinedMessages);
  const getMessageCount = useChatStore(state => state.getMessageCount);
  const getPendingCount = useChatStore(state => state.getPendingCount);
  const getFailedCount = useChatStore(state => state.getFailedCount);
  const optimisticMessages = useChatStore(state => state.optimisticMessages);

  // Business Logic Actions (memoized for performance)
  
  /**
   * Send a message with optimistic updates
   */
  const sendMessage = useCallback(async (content: string, component?: React.ReactNode): Promise<void> => {
    if (!content.trim()) {
      throw new Error('Message content cannot be empty');
    }

    try {
      await sendMessageWithOptimistic(activeTab, content, component);
    } catch (error) {
      // Error is already handled by the store, just re-throw for component handling
      throw error;
    }
  }, [activeTab, sendMessageWithOptimistic]);

  /**
   * Switch to a different tab and clear any existing errors
   */
  const switchTab = useCallback((tab: TabType): void => {
    if (tab === activeTab) return; // No-op if same tab
    
    setActiveTab(tab);
    
    // Clear any errors when switching tabs for better UX
    if (error) {
      setError(null);
    }
  }, [activeTab, setActiveTab, error, setError]);

  /**
   * Retry a failed message by finding it in optimistic messages
   */
  const retryFailedMessage = useCallback(async (messageId: string): Promise<void> => {
    // Find the failed message in optimistic messages
    const failedMessage = optimisticMessages[activeTab]?.find(
      msg => msg.id === messageId || msg.tempId === messageId
    );
    
    if (!failedMessage) {
      throw new Error('Failed message not found');
    }
    
    if (failedMessage.status !== 'failed') {
      throw new Error('Message is not in failed state');
    }

    try {
      await retryMessage(activeTab, failedMessage);
    } catch (error) {
      // Error handling is done in the store
      throw error;
    }
  }, [activeTab, optimisticMessages, retryMessage]);

  /**
   * Clear current error state
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, [setError]);

  // Computed Properties (memoized for performance)
  
  /**
   * Check if a tab has unread messages (pending or failed)
   */
  const hasUnreadMessages = useCallback((tab: TabType): boolean => {
    const pendingCount = getPendingCount(tab);
    const failedCount = getFailedCount(tab);
    return pendingCount > 0 || failedCount > 0;
  }, [getPendingCount, getFailedCount]);

  /**
   * Get total message count for a tab
   */
  const getMessageCountForTab = useCallback((tab: TabType): number => {
    return getMessageCount(tab);
  }, [getMessageCount]);

  // Return memoized object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    activeTab,
    messages,
    isLoading,
    error,
    
    // Actions
    sendMessage,
    switchTab,
    retryFailedMessage,
    clearError,
    
    // Computed
    hasUnreadMessages,
    getMessageCount: getMessageCountForTab
  }), [
    // State dependencies
    activeTab,
    messages,
    isLoading,
    error,
    
    // Action dependencies
    sendMessage,
    switchTab,
    retryFailedMessage,
    clearError,
    
    // Computed dependencies
    hasUnreadMessages,
    getMessageCountForTab
  ]);
};

/**
 * Specialized hook for message composition with validation
 */
export interface MessageComposerReturn {
  // State
  currentInput: string;
  isComposing: boolean;
  suggestions: string[];
  
  // Actions
  updateInput: (input: string) => void;
  sendMessage: () => Promise<void>;
  addQuickReply: (reply: string) => void;
  generateSuggestions: () => Promise<void>;
  
  // Validation
  canSend: boolean;
  inputErrors: string[];
  characterCount: number;
}

export const useMessageComposer = (tab: TabType): MessageComposerReturn => {
  // Implementation would go here - placeholder for now
  // This demonstrates the pattern for more specialized hooks
  
  return {
    currentInput: '',
    isComposing: false,
    suggestions: [],
    updateInput: () => {},
    sendMessage: async () => {},
    addQuickReply: () => {},
    generateSuggestions: async () => {},
    canSend: false,
    inputErrors: [],
    characterCount: 0
  };
};

// Export for testing
export { useChatStore };