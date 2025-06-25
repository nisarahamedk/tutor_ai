import type { OptimisticMessage, MessageStatus } from '../components/chat/types';

// Timing utilities for performance measurement
export const performanceUtils = {
  // Measure perceived delay for optimistic updates
  measureOptimisticDelay: (startTime: number): number => {
    return performance.now() - startTime;
  },

  // Create performance mark for debugging
  markPerformance: (label: string): void => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(label);
    }
  },

  // Measure time between two performance marks
  measureBetweenMarks: (startMark: string, endMark: string): number => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(`${startMark}-to-${endMark}`, startMark, endMark);
        const measure = performance.getEntriesByName(`${startMark}-to-${endMark}`)[0];
        return measure?.duration || 0;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
        return 0;
      }
    }
    return 0;
  },
};

// Message validation utilities
export const messageValidation = {
  // Validate message content
  isValidContent: (content: string): boolean => {
    return typeof content === 'string' && content.trim().length > 0;
  },

  // Check if content exceeds max length
  exceedsMaxLength: (content: string, maxLength: number): boolean => {
    return content.length > maxLength;
  },

  // Sanitize message content
  sanitizeContent: (content: string): string => {
    return content.trim().replace(/\s+/g, ' ');
  },

  // Check if message is safe to send
  isSafeToSend: (content: string, maxLength: number = 2000): boolean => {
    const sanitized = messageValidation.sanitizeContent(content);
    return messageValidation.isValidContent(sanitized) && 
           !messageValidation.exceedsMaxLength(sanitized, maxLength);
  },
};

// Message state utilities
export const messageStateUtils = {
  // Check if message is in a temporary state
  isTemporary: (message: OptimisticMessage): boolean => {
    return Boolean(message.tempId) || message.status === 'pending';
  },

  // Check if message can be retried
  canRetry: (message: OptimisticMessage): boolean => {
    return message.status === 'failed' && !message.retrying;
  },

  // Check if message is successfully sent
  isSuccessful: (message: OptimisticMessage): boolean => {
    return message.status === 'sent' && !message.tempId;
  },

  // Get display status for UI
  getDisplayStatus: (message: OptimisticMessage): string => {
    if (message.status === 'pending') return 'Sending...';
    if (message.status === 'failed') return message.error || 'Failed to send';
    if (message.status === 'sent') return 'Sent';
    return '';
  },

  // Calculate message age in seconds
  getMessageAge: (message: OptimisticMessage): number => {
    return Math.floor((Date.now() - message.timestamp.getTime()) / 1000);
  },
};

// Rollback utilities
export const rollbackUtils = {
  // Create a rollback operation for failed optimistic update
  createRollback: (originalMessages: OptimisticMessage[], tempId: string) => {
    return (): OptimisticMessage[] => {
      return originalMessages.filter(msg => 
        msg.tempId !== tempId && msg.id !== tempId
      );
    };
  },

  // Batch rollback multiple failed messages
  batchRollback: (
    messages: OptimisticMessage[], 
    tempIds: string[]
  ): OptimisticMessage[] => {
    return messages.filter(msg => 
      !tempIds.includes(msg.tempId || msg.id)
    );
  },

  // Find messages that need rollback
  findRollbackCandidates: (
    messages: OptimisticMessage[],
    maxAge: number = 30000 // 30 seconds
  ): OptimisticMessage[] => {
    const now = Date.now();
    return messages.filter(msg => 
      msg.status === 'pending' && 
      (now - msg.timestamp.getTime()) > maxAge
    );
  },
};

// Order preservation utilities
export const orderUtils = {
  // Sort messages by timestamp
  sortByTimestamp: (messages: OptimisticMessage[]): OptimisticMessage[] => {
    return [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  },

  // Insert message while preserving order
  insertInOrder: (
    messages: OptimisticMessage[], 
    newMessage: OptimisticMessage
  ): OptimisticMessage[] => {
    const sorted = [...messages, newMessage];
    return orderUtils.sortByTimestamp(sorted);
  },

  // Check if messages are in correct chronological order
  isCorrectOrder: (messages: OptimisticMessage[]): boolean => {
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].timestamp.getTime() < messages[i - 1].timestamp.getTime()) {
        return false;
      }
    }
    return true;
  },

  // Reorder messages if needed
  ensureCorrectOrder: (messages: OptimisticMessage[]): OptimisticMessage[] => {
    return orderUtils.isCorrectOrder(messages) ? messages : orderUtils.sortByTimestamp(messages);
  },
};

// Error handling utilities
export const errorUtils = {
  // Categorize error types
  categorizeError: (error: Error | string): 'network' | 'validation' | 'server' | 'unknown' => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes('network') || lowerError.includes('fetch')) {
      return 'network';
    }
    if (lowerError.includes('validation') || lowerError.includes('invalid')) {
      return 'validation';
    }
    if (lowerError.includes('server') || lowerError.includes('500')) {
      return 'server';
    }
    return 'unknown';
  },

  // Get user-friendly error message
  getUserFriendlyError: (error: Error | string): string => {
    const category = errorUtils.categorizeError(error);
    
    switch (category) {
      case 'network':
        return 'Network connection issue. Please check your internet and try again.';
      case 'validation':
        return 'Message validation failed. Please check your input and try again.';
      case 'server':
        return 'Server error. Please try again in a moment.';
      default:
        return 'Something went wrong. Please try again.';
    }
  },

  // Check if error is retryable
  isRetryableError: (error: Error | string): boolean => {
    const category = errorUtils.categorizeError(error);
    return category === 'network' || category === 'server';
  },
};

// Performance monitoring utilities
export const monitoringUtils = {
  // Track optimistic update performance
  trackOptimisticPerformance: (operation: string, duration: number): void => {
    if (duration > 5) { // Log if operation takes longer than 5ms
      console.warn(`Slow optimistic operation: ${operation} took ${duration}ms`);
    }
  },

  // Monitor memory usage (simplified)
  checkMemoryUsage: (messageCount: number): void => {
    if (messageCount > 1000) {
      console.warn(`High message count: ${messageCount} messages in memory`);
    }
  },

  // Track error rates
  trackErrorRate: (errors: number, total: number): number => {
    const rate = total > 0 ? (errors / total) * 100 : 0;
    if (rate > 10) { // Warn if error rate exceeds 10%
      console.warn(`High error rate: ${rate.toFixed(1)}%`);
    }
    return rate;
  },
};

// Accessibility utilities
export const a11yUtils = {
  // Generate ARIA label for message
  generateMessageAriaLabel: (message: OptimisticMessage): string => {
    const type = message.type === 'user' ? 'Your message' : 'AI response';
    const status = message.status === 'pending' ? ', sending' : 
                   message.status === 'failed' ? ', failed to send' : '';
    const time = message.timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `${type} at ${time}${status}: ${message.content}`;
  },

  // Generate status announcement for screen readers
  generateStatusAnnouncement: (message: OptimisticMessage): string => {
    if (message.status === 'pending') {
      return 'Message is being sent';
    }
    if (message.status === 'failed') {
      return `Message failed to send: ${message.error || 'Unknown error'}`;
    }
    if (message.status === 'sent') {
      return 'Message sent successfully';
    }
    return '';
  },

  // Check if element needs focus management
  needsFocusManagement: (message: OptimisticMessage): boolean => {
    return message.status === 'failed' && errorUtils.isRetryableError(message.error || '');
  },
};

// Export all utilities as a single object for easier importing
export const optimisticHelpers = {
  performance: performanceUtils,
  validation: messageValidation,
  state: messageStateUtils,
  rollback: rollbackUtils,
  order: orderUtils,
  error: errorUtils,
  monitoring: monitoringUtils,
  a11y: a11yUtils,
};