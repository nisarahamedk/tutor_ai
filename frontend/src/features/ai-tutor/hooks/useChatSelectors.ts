// src/features/ai-tutor/hooks/useChatSelectors.ts
// Performance-optimized selective subscription hooks for chat store
// These hooks implement the requirements from TASK-009 for eliminating prop drilling
// and providing granular subscriptions to prevent unnecessary re-renders

import { useChatStore } from '../stores/chatStore';
import type { TabType, Message, OptimisticMessage } from '../types';
import { useCallback, useMemo } from 'react';

// Core selective subscription hooks

/**
 * Get messages for a specific tab with performance optimization
 * Only re-renders when messages for the specified tab change
 */
export const useChatMessages = (tab?: TabType) => {
  const activeTab = useChatStore(state => state.activeTab);
  const targetTab = tab || activeTab;
  
  return useChatStore(state => state.getCombinedMessages(targetTab));
};

/**
 * Get regular (non-optimistic) messages for a tab
 * Useful for components that don't need optimistic updates
 */
export const useRegularMessages = (tab?: TabType) => {
  const activeTab = useChatStore(state => state.activeTab);
  const targetTab = tab || activeTab;
  
  return useChatStore(state => state.tabMessages[targetTab]);
};

/**
 * Get only optimistic messages for a tab
 * Useful for debugging or specialized components
 */
export const useOptimisticMessages = (tab?: TabType) => {
  const activeTab = useChatStore(state => state.activeTab);
  const targetTab = tab || activeTab;
  
  return useChatStore(state => state.optimisticMessages[targetTab]);
};

/**
 * Get active tab with performance optimization
 * Only re-renders when active tab changes
 */
export const useActiveTab = () => {
  return useChatStore(state => state.activeTab);
};

/**
 * Get loading state
 * Only re-renders when loading state changes
 */
export const useChatLoading = () => {
  return useChatStore(state => state.isLoading);
};

/**
 * Get typing indicator state
 * Only re-renders when typing state changes
 */
export const useChatTyping = () => {
  return useChatStore(state => state.isTyping);
};

/**
 * Get error state
 * Only re-renders when error state changes
 */
export const useChatError = () => {
  return useChatStore(state => state.error);
};

/**
 * Get message counts for a specific tab
 * Returns total, pending, and failed counts
 */
export const useMessageCounts = (tab?: TabType) => {
  const activeTab = useChatStore(state => state.activeTab);
  const targetTab = tab || activeTab;
  
  return useChatStore(state => ({
    total: state.getMessageCount(targetTab),
    pending: state.getPendingCount(targetTab),
    failed: state.getFailedCount(targetTab),
    regular: state.tabMessages[targetTab].length,
    optimistic: state.optimisticMessages[targetTab].length,
  }));
};

/**
 * Get status indicators for a tab
 * Returns boolean flags for various states
 */
export const useTabStatus = (tab?: TabType) => {
  const activeTab = useChatStore(state => state.activeTab);
  const targetTab = tab || activeTab;
  
  return useChatStore(state => ({
    hasMessages: state.hasMessages(targetTab),
    hasPending: state.getPendingCount(targetTab) > 0,
    hasFailed: state.getFailedCount(targetTab) > 0,
    isEmpty: state.getMessageCount(targetTab) === 1 && // Only welcome message
      state.tabMessages[targetTab][0]?.metadata?.isWelcome,
  }));
};

/**
 * Get the last message for a tab
 * Useful for previews or notifications
 */
export const useLastMessage = (tab?: TabType) => {
  const activeTab = useChatStore(state => state.activeTab);
  const targetTab = tab || activeTab;
  
  return useChatStore(state => state.getLastMessage(targetTab));
};

/**
 * Get retry count for failed messages
 * Only re-renders when retry count changes
 */
export const useRetryCount = () => {
  return useChatStore(state => state.retryCount);
};

// Compound hooks for common use cases

/**
 * Hook for message list components
 * Provides all data needed for rendering message lists
 */
export const useMessageListData = (tab?: TabType) => {
  const activeTab = useChatStore(state => state.activeTab);
  const targetTab = tab || activeTab;
  
  const messages = useChatMessages(targetTab);
  const isTyping = useChatTyping();
  const error = useChatError();
  const counts = useMessageCounts(targetTab);
  
  return useMemo(() => ({
    messages,
    isTyping,
    error,
    counts,
    isEmpty: counts.total === 1 && messages[0]?.metadata?.isWelcome,
  }), [messages, isTyping, error, counts]);
};

/**
 * Hook for input components
 * Provides state and actions needed for message input
 */
export const useMessageInputData = () => {
  const activeTab = useActiveTab();
  const isLoading = useChatLoading();
  const isTyping = useChatTyping();
  const error = useChatError();
  
  return useMemo(() => ({
    activeTab,
    isLoading,
    isTyping,
    error,
    isDisabled: isLoading || isTyping,
  }), [activeTab, isLoading, isTyping, error]);
};

/**
 * Hook for tab indicators and badges
 * Provides counts and status for all tabs
 */
export const useTabIndicators = () => {
  return useChatStore(state => ({
    home: {
      count: state.getMessageCount('home'),
      pending: state.getPendingCount('home'),
      failed: state.getFailedCount('home'),
      hasNewMessages: state.hasMessages('home'),
    },
    progress: {
      count: state.getMessageCount('progress'),
      pending: state.getPendingCount('progress'),
      failed: state.getFailedCount('progress'),
      hasNewMessages: state.hasMessages('progress'),
    },
    review: {
      count: state.getMessageCount('review'),
      pending: state.getPendingCount('review'),
      failed: state.getFailedCount('review'),
      hasNewMessages: state.hasMessages('review'),
    },
    explore: {
      count: state.getMessageCount('explore'),
      pending: state.getPendingCount('explore'),
      failed: state.getFailedCount('explore'),
      hasNewMessages: state.hasMessages('explore'),
    },
  }));
};

/**
 * Hook for error and status displays
 * Provides aggregated error and status information
 */
export const useStatusDisplay = () => {
  const error = useChatError();
  const isLoading = useChatLoading();
  const isTyping = useChatTyping();
  const retryCount = useRetryCount();
  
  return useMemo(() => ({
    error,
    isLoading,
    isTyping,
    retryCount,
    isOnline: !error,
    statusText: error ? 'Reconnecting...' : 'Online',
    showSpinner: isLoading || isTyping,
  }), [error, isLoading, isTyping, retryCount]);
};

// Memoized selectors for expensive operations

/**
 * Get failed messages that can be retried
 * Only recalculates when optimistic messages change
 */
export const useRetryableMessages = (tab?: TabType) => {
  const activeTab = useChatStore(state => state.activeTab);
  const targetTab = tab || activeTab;
  
  return useChatStore(state => state.optimisticMessages[targetTab].filter(
    msg => msg.status === 'failed' && msg.tempId
  ));
};

/**
 * Get pending messages count across all tabs
 * Useful for global status indicators
 */
export const useGlobalPendingCount = () => {
  return useChatStore(state => (
    state.getPendingCount('home') +
    state.getPendingCount('progress') +
    state.getPendingCount('review') +
    state.getPendingCount('explore')
  ));
};

/**
 * Check if any tab has failed messages
 * Useful for global error indicators
 */
export const useHasGlobalErrors = () => {
  return useChatStore(state => (
    state.getFailedCount('home') > 0 ||
    state.getFailedCount('progress') > 0 ||
    state.getFailedCount('review') > 0 ||
    state.getFailedCount('explore') > 0 ||
    Boolean(state.error)
  ));
};