import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChatStore, useMessageDisplay, useMessageInput, useTabManager } from '../../stores/chatStore';
import type { TabType } from '../../types';

// Integration tests for TASK-009 store migration
// These tests verify that we've successfully eliminated prop drilling
// and implemented performance-optimized state management

describe('TASK-009 Store Integration Tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useChatStore.getState();
    
    // Clear all messages and optimistic state
    ['home', 'progress', 'review', 'explore'].forEach(tab => {
      store.clearMessages(tab as TabType);
      store.clearOptimisticMessages(tab as TabType);
    });
    
    store.setActiveTab('home');
    store.setLoading(false);
    store.setTyping(false);
    store.setError(null);
  });

  describe('Prop Drilling Elimination', () => {
    it('should access store state directly without props', () => {
      // Before TASK-009: Components needed props for state
      // After TASK-009: Components access store directly
      
      const { result: displayResult } = renderHook(() => useMessageDisplay('home'));
      const { result: inputResult } = renderHook(() => useMessageInput());
      const { result: tabResult } = renderHook(() => useTabManager());
      
      // Components can access state directly without any props
      expect(displayResult.current.messages).toBeDefined();
      expect(inputResult.current.sendMessage).toBeDefined();
      expect(tabResult.current.activeTab).toBeDefined();
      
      // No prop drilling needed - components are self-sufficient
      expect(typeof displayResult.current.messages).toBe('object');
      expect(typeof inputResult.current.sendMessage).toBe('function');
      expect(typeof tabResult.current.setActiveTab).toBe('function');
    });

    it('should provide independent hook subscriptions', () => {
      // Test that hooks can be used independently in different components
      // This was not possible with prop drilling approach
      
      const { result: hook1 } = renderHook(() => useMessageDisplay('home'));
      const { result: hook2 } = renderHook(() => useMessageDisplay('progress'));
      const { result: hook3 } = renderHook(() => useMessageInput());
      
      // Each hook provides independent access to store
      expect(hook1.current.messages).not.toBe(hook2.current.messages);
      expect(hook3.current.activeTab).toBeDefined();
      
      // Components can subscribe to different parts of state
      expect(Array.isArray(hook1.current.messages)).toBe(true);
      expect(Array.isArray(hook2.current.messages)).toBe(true);
    });
  });

  describe('Optimistic Updates Integration', () => {
    it('should handle optimistic message flow', async () => {
      const store = useChatStore.getState();
      
      // Test the complete optimistic update flow
      await act(async () => {
        await store.sendMessageWithOptimistic('home', 'Test optimistic message');
      });
      
      // Should work seamlessly with store
      const state = useChatStore.getState();
      expect(state.getCombinedMessages('home').length).toBeGreaterThan(1);
    });

    it('should integrate with existing optimistic patterns from TASK-007', () => {
      const store = useChatStore.getState();
      
      // Test that optimistic state is properly managed
      const mockOptimisticMessage = {
        id: 'test-opt',
        tempId: 'temp-123',
        type: 'user' as const,
        content: 'Optimistic test',
        timestamp: new Date(),
        status: 'pending' as const,
      };
      
      act(() => {
        store.addOptimisticMessage('home', mockOptimisticMessage);
      });
      
      const optimisticMessages = store.getOptimisticMessages('home');
      expect(optimisticMessages).toContain(mockOptimisticMessage);
      expect(store.getPendingCount('home')).toBe(1);
    });
  });

  describe('Performance Optimization', () => {
    it('should provide selective subscriptions for different data', () => {
      // Test that hooks only subscribe to specific parts of state
      const { result: messagesHook } = renderHook(() => useMessageDisplay('home'));
      const { result: inputHook } = renderHook(() => useMessageInput());
      const { result: tabHook } = renderHook(() => useTabManager());
      
      // Each hook should provide different, focused data
      expect('messages' in messagesHook.current).toBe(true);
      expect('isTyping' in messagesHook.current).toBe(true);
      expect('sendMessage' in inputHook.current).toBe(true);
      expect('activeTab' in inputHook.current).toBe(true);
      expect('tabStats' in tabHook.current).toBe(true);
      
      // Verify hooks provide focused, non-overlapping data sets
      expect(messagesHook.current).not.toHaveProperty('sendMessage');
      expect(inputHook.current).not.toHaveProperty('tabStats');
    });

    it('should handle large message counts efficiently', () => {
      const store = useChatStore.getState();
      
      const start = performance.now();
      
      // Add many messages to test performance
      for (let i = 0; i < 100; i++) {
        store.addMessage('home', {
          id: `msg-${i}`,
          content: `Message ${i}`,
          type: 'user',
          timestamp: new Date().toISOString(),
        });
      }
      
      const end = performance.now();
      
      // Should handle 100 messages quickly
      expect(end - start).toBeLessThan(100);
      expect(store.getMessageCount('home')).toBe(101); // 100 + welcome message
    });
  });

  describe('State Management Centralization', () => {
    it('should centralize all chat state in store', () => {
      const store = useChatStore.getState();
      
      // Verify all state is accessible from store
      expect(store).toHaveProperty('tabMessages');
      expect(store).toHaveProperty('optimisticMessages');
      expect(store).toHaveProperty('activeTab');
      expect(store).toHaveProperty('isLoading');
      expect(store).toHaveProperty('isTyping');
      expect(store).toHaveProperty('error');
      expect(store).toHaveProperty('retryCount');
    });

    it('should provide unified actions for state updates', () => {
      const store = useChatStore.getState();
      
      // Verify all actions are available
      expect(typeof store.sendMessageWithOptimistic).toBe('function');
      expect(typeof store.retryMessage).toBe('function');
      expect(typeof store.addOptimisticMessage).toBe('function');
      expect(typeof store.setActiveTab).toBe('function');
      expect(typeof store.setLoading).toBe('function');
      expect(typeof store.setTyping).toBe('function');
      expect(typeof store.setError).toBe('function');
    });

    it('should maintain state consistency across tabs', () => {
      const store = useChatStore.getState();
      
      // Test that tab state is independent but consistent
      act(() => {
        store.addMessage('home', {
          id: 'home-msg',
          content: 'Home message',
          type: 'user',
          timestamp: new Date().toISOString(),
        });
        
        store.addMessage('progress', {
          id: 'progress-msg',
          content: 'Progress message',
          type: 'user',
          timestamp: new Date().toISOString(),
        });
      });
      
      // Each tab should have its own messages
      expect(store.getTabMessages('home')).toHaveLength(2); // welcome + new
      expect(store.getTabMessages('progress')).toHaveLength(2); // welcome + new
      
      // Messages should be isolated per tab
      const homeMessages = store.getTabMessages('home');
      const progressMessages = store.getTabMessages('progress');
      expect(homeMessages[1].content).toBe('Home message');
      expect(progressMessages[1].content).toBe('Progress message');
    });
  });

  describe('Error Handling and Retry', () => {
    it('should handle failed messages with retry capability', () => {
      const store = useChatStore.getState();
      
      const failedMessage = {
        id: 'failed-msg',
        tempId: 'temp-failed',
        type: 'user' as const,
        content: 'Failed message',
        timestamp: new Date(),
        status: 'failed' as const,
        error: 'Network error',
      };
      
      act(() => {
        store.addOptimisticMessage('home', failedMessage);
      });
      
      // Should track failed messages
      expect(store.getFailedCount('home')).toBe(1);
      
      // Should be able to retry
      expect(typeof store.retryMessage).toBe('function');
    });

    it('should provide error state management', () => {
      const store = useChatStore.getState();
      
      act(() => {
        store.setError('Test error');
      });
      
      expect(useChatStore.getState().error).toBe('Test error');
      
      act(() => {
        store.setError(null);
      });
      
      expect(useChatStore.getState().error).toBe(null);
    });
  });

  describe('Integration with React 19 Patterns', () => {
    it('should work with hooks and components', () => {
      // Test that store integrates well with React patterns
      const { result } = renderHook(() => {
        const { messages, isTyping } = useMessageDisplay('home');
        const { sendMessage, isDisabled } = useMessageInput();
        return { messages, isTyping, sendMessage, isDisabled };
      });
      
      // Should provide reactive data
      expect(Array.isArray(result.current.messages)).toBe(true);
      expect(typeof result.current.isTyping).toBe('boolean');
      expect(typeof result.current.sendMessage).toBe('function');
      expect(typeof result.current.isDisabled).toBe('boolean');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain all existing functionality', () => {
      const store = useChatStore.getState();
      
      // All original functionality should still work
      const tabs: TabType[] = ['home', 'progress', 'review', 'explore'];
      
      tabs.forEach(tab => {
        // Should have initial welcome messages
        expect(store.getTabMessages(tab).length).toBeGreaterThan(0);
        
        // Should support message operations
        expect(typeof store.addMessage).toBe('function');
        expect(typeof store.getTabMessages).toBe('function');
        expect(typeof store.clearMessages).toBe('function');
      });
    });
  });
});