// src/features/ai-tutor/stores/chatStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { ChatState, TabType, Message, OptimisticMessage, MessageStatus } from '../types';

// Helper function to generate initial messages for each tab
const getInitialMessages = (tab: TabType): Message[] => {
  const baseMessages: Record<TabType, Message[]> = {
    home: [
      {
        id: 'welcome-home',
        content: 'Welcome to your AI Tutor! I\'m here to help you learn and grow. What would you like to explore today?',
        type: 'ai',
        timestamp: new Date().toISOString(),
        metadata: { isWelcome: true }
      }
    ],
    progress: [
      {
        id: 'welcome-progress',
        content: 'Track your learning journey here! I can show you detailed progress reports, achievements, and recommend areas for improvement.',
        type: 'ai',
        timestamp: new Date().toISOString(),
        metadata: { isWelcome: true }
      }
    ],
    review: [
      {
        id: 'welcome-review',
        content: 'Ready to review and reinforce your knowledge? I can create custom flashcards and practice sessions based on your learning history.',
        type: 'ai',
        timestamp: new Date().toISOString(),
        metadata: { isWelcome: true }
      }
    ],
    explore: [
      {
        id: 'welcome-explore',
        content: 'Let\'s discover new learning tracks together! I can recommend personalized learning paths based on your interests and goals.',
        type: 'ai',
        timestamp: new Date().toISOString(),
        metadata: { isWelcome: true }
      }
    ]
  };
  
  return baseMessages[tab] || [];
};

// Helper functions for optimistic message management
const generateTempId = (): string => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const simulateAPICall = async (content: string): Promise<Message> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
  
  // Simulate 10% failure rate for testing
  if (Math.random() < 0.1) {
    throw new Error('Network connection failed. Please try again.');
  }
  
  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    content: `AI response to: "${content}"`,
    type: 'ai',
    timestamp: new Date().toISOString(),
  };
};

// Store implementation with optimistic updates and enhanced functionality
export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tabMessages: {
          home: getInitialMessages('home'),
          progress: getInitialMessages('progress'),
          review: getInitialMessages('review'),
          explore: getInitialMessages('explore')
        },
        activeTab: 'home',
        isLoading: false,
        isTyping: false,
        error: null,
        
        // Optimistic state
        optimisticMessages: {
          home: [],
          progress: [],
          review: [],
          explore: []
        },
        retryCount: 0,

        // Regular message actions
        addMessage: (tab: TabType, message: Message) =>
          set(
            (state) => ({
              tabMessages: {
                ...state.tabMessages,
                [tab]: [...state.tabMessages[tab], message]
              }
            }),
            false,
            `addMessage/${tab}/${message.id}`
          ),

        removeMessage: (tab: TabType, messageId: string) =>
          set(
            (state) => ({
              tabMessages: {
                ...state.tabMessages,
                [tab]: state.tabMessages[tab].filter(msg => msg.id !== messageId)
              }
            }),
            false,
            `removeMessage/${tab}/${messageId}`
          ),

        clearMessages: (tab: TabType) =>
          set(
            (state) => ({
              tabMessages: {
                ...state.tabMessages,
                [tab]: getInitialMessages(tab) // Reset to initial welcome message
              }
            }),
            false,
            `clearMessages/${tab}`
          ),

        setActiveTab: (tab: TabType) =>
          set({ activeTab: tab }, false, `setActiveTab/${tab}`),

        setLoading: (loading: boolean) =>
          set({ isLoading: loading }, false, `setLoading/${loading}`),

        setTyping: (typing: boolean) =>
          set({ isTyping: typing }, false, `setTyping/${typing}`),

        setError: (error: string | null) =>
          set({ error }, false, `setError/${error}`),

        // Optimistic message actions
        addOptimisticMessage: (tab: TabType, message: OptimisticMessage) =>
          set(
            (state) => ({
              optimisticMessages: {
                ...state.optimisticMessages,
                [tab]: [...state.optimisticMessages[tab], message]
              }
            }),
            false,
            `addOptimisticMessage/${tab}/${message.id}`
          ),

        updateOptimisticMessage: (tab: TabType, tempId: string, updates: Partial<OptimisticMessage>) =>
          set(
            (state) => ({
              optimisticMessages: {
                ...state.optimisticMessages,
                [tab]: state.optimisticMessages[tab].map(msg =>
                  (msg.tempId === tempId || msg.id === tempId)
                    ? { ...msg, ...updates }
                    : msg
                )
              }
            }),
            false,
            `updateOptimisticMessage/${tab}/${tempId}`
          ),

        removeOptimisticMessage: (tab: TabType, tempId: string) =>
          set(
            (state) => ({
              optimisticMessages: {
                ...state.optimisticMessages,
                [tab]: state.optimisticMessages[tab].filter(msg =>
                  msg.tempId !== tempId && msg.id !== tempId
                )
              }
            }),
            false,
            `removeOptimisticMessage/${tab}/${tempId}`
          ),

        clearOptimisticMessages: (tab: TabType) =>
          set(
            (state) => ({
              optimisticMessages: {
                ...state.optimisticMessages,
                [tab]: []
              }
            }),
            false,
            `clearOptimisticMessages/${tab}`
          ),

        // Combined optimistic actions
        sendMessageWithOptimistic: async (tab: TabType, content: string, component?: React.ReactNode) => {
          const { addOptimisticMessage, updateOptimisticMessage, addMessage, setTyping, setError } = get();
          
          // Create optimistic user message
          const tempId = generateTempId();
          const optimisticUserMessage: OptimisticMessage = {
            id: tempId,
            tempId,
            type: 'user',
            content,
            timestamp: new Date(),
            status: 'pending',
            component
          };
          
          // Add optimistic user message
          addOptimisticMessage(tab, optimisticUserMessage);
          
          try {
            setTyping(true);
            setError(null);
            
            // Update user message to sent
            updateOptimisticMessage(tab, tempId, { status: 'sent' });
            
            // Simulate AI response
            const aiResponse = await simulateAPICall(content);
            
            // Add AI response to regular messages
            addMessage(tab, aiResponse);
            
            // Remove optimistic user message (now that it's confirmed)
            get().removeOptimisticMessage(tab, tempId);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
            
            // Update optimistic message to failed
            updateOptimisticMessage(tab, tempId, { 
              status: 'failed', 
              error: errorMessage 
            });
            
            setError(errorMessage);
          } finally {
            setTyping(false);
          }
        },

        retryMessage: async (tab: TabType, message: OptimisticMessage) => {
          const { updateOptimisticMessage, addMessage, setTyping, setError } = get();
          
          if (!message.tempId) return;
          
          try {
            // Update to retrying state
            updateOptimisticMessage(tab, message.tempId, { 
              status: 'pending', 
              retrying: true,
              error: undefined 
            });
            
            setTyping(true);
            
            // Increment retry count
            set(state => ({ retryCount: state.retryCount + 1 }));
            
            // Retry the API call
            const aiResponse = await simulateAPICall(message.content);
            
            // Success - update to sent and add AI response
            updateOptimisticMessage(tab, message.tempId, { status: 'sent' });
            addMessage(tab, aiResponse);
            
            // Remove optimistic message
            get().removeOptimisticMessage(tab, message.tempId);
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Retry failed';
            
            // Update to failed state
            updateOptimisticMessage(tab, message.tempId, { 
              status: 'failed', 
              error: errorMessage,
              retrying: false 
            });
            
            setError(errorMessage);
          } finally {
            setTyping(false);
          }
        },

        // Enhanced selectors
        getTabMessages: (tab: TabType) => get().tabMessages[tab],
        
        getOptimisticMessages: (tab: TabType) => get().optimisticMessages[tab],
        
        getCombinedMessages: (tab: TabType) => {
          const regularMessages = get().tabMessages[tab];
          const optimisticMessages = get().optimisticMessages[tab];
          
          // Combine and sort by timestamp
          const combined = [
            ...regularMessages.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) })),
            ...optimisticMessages
          ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          
          return combined;
        },
        
        hasMessages: (tab: TabType) => {
          const regularMessages = get().tabMessages[tab];
          const optimisticMessages = get().optimisticMessages[tab];
          
          // Check if there are messages beyond the initial welcome message
          const hasRegular = regularMessages.length > 1 || 
            (regularMessages.length === 1 && !regularMessages[0].metadata?.isWelcome);
          const hasOptimistic = optimisticMessages.length > 0;
          
          return hasRegular || hasOptimistic;
        },
        
        getMessageCount: (tab: TabType) => {
          const regularCount = get().tabMessages[tab].length;
          const optimisticCount = get().optimisticMessages[tab].length;
          return regularCount + optimisticCount;
        },
        
        getLastMessage: (tab: TabType) => {
          const combined = get().getCombinedMessages(tab);
          return combined.length > 0 ? combined[combined.length - 1] : null;
        },
        
        getPendingCount: (tab: TabType) => {
          const optimisticMessages = get().optimisticMessages[tab];
          return optimisticMessages.filter(msg => msg.status === 'pending').length;
        },
        
        getFailedCount: (tab: TabType) => {
          const optimisticMessages = get().optimisticMessages[tab];
          return optimisticMessages.filter(msg => msg.status === 'failed').length;
        }
      }),
      {
        name: 'ai-tutor-chat-store',
        storage: createJSONStorage(() => localStorage),
        // Only persist messages and active tab, not loading/optimistic states
        partialize: (state) => ({
          tabMessages: state.tabMessages,
          activeTab: state.activeTab
        }),
        // Handle storage migration if needed
        version: 2,
        migrate: (persistedState: any, version: number) => {
          if (version === 0 || version === 1) {
            // Migration from v0/v1 to v2 - ensure optimistic state exists
            return {
              ...persistedState,
              tabMessages: persistedState.tabMessages || {
                home: getInitialMessages('home'),
                progress: getInitialMessages('progress'),
                review: getInitialMessages('review'),
                explore: getInitialMessages('explore')
              },
              optimisticMessages: {
                home: [],
                progress: [],
                review: [],
                explore: []
              },
              isTyping: false,
              retryCount: 0
            };
          }
          return persistedState;
        }
      }
    ),
    {
      name: 'ai-tutor-chat-store', // DevTools name
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Enhanced selectors for performance optimization (selective subscriptions)
export const useChatSelectors = {
  // Get messages for a specific tab (regular messages only)
  useTabMessages: (tab: TabType) => useChatStore(state => state.tabMessages[tab]),
  
  // Get optimistic messages for a tab
  useOptimisticMessages: (tab: TabType) => useChatStore(state => state.optimisticMessages[tab]),
  
  // Get combined messages (regular + optimistic) for a tab
  useCombinedMessages: (tab: TabType) => useChatStore(state => state.getCombinedMessages(tab)),
  
  // Get messages for current active tab
  useActiveTabMessages: () => useChatStore(state => state.getCombinedMessages(state.activeTab)),
  
  // Get active tab
  useActiveTab: () => useChatStore(state => state.activeTab),
  
  // Get loading states
  useIsLoading: () => useChatStore(state => state.isLoading),
  useIsTyping: () => useChatStore(state => state.isTyping),
  
  // Get error state
  useError: () => useChatStore(state => state.error),
  
  // Get counts for a tab
  useMessageCount: (tab: TabType) => useChatStore(state => state.getMessageCount(tab)),
  usePendingCount: (tab: TabType) => useChatStore(state => state.getPendingCount(tab)),
  useFailedCount: (tab: TabType) => useChatStore(state => state.getFailedCount(tab)),
  
  // Get last message for a tab
  useLastMessage: (tab: TabType) => useChatStore(state => state.getLastMessage(tab)),
  
  // Check if tab has user messages (beyond welcome)
  useHasUserMessages: (tab: TabType) => useChatStore(state => state.hasMessages(tab)),
  
  // Get retry count
  useRetryCount: () => useChatStore(state => state.retryCount),
  
  // Status indicators
  useHasPendingMessages: (tab: TabType) => useChatStore(state => state.getPendingCount(tab) > 0),
  useHasFailedMessages: (tab: TabType) => useChatStore(state => state.getFailedCount(tab) > 0),
};

// Enhanced action hooks for better organization and developer experience
export const useChatActions = () => {
  const store = useChatStore();
  
  return {
    // Regular message actions
    addMessage: store.addMessage,
    removeMessage: store.removeMessage,
    clearMessages: store.clearMessages,
    
    // State management actions
    setActiveTab: store.setActiveTab,
    setLoading: store.setLoading,
    setTyping: store.setTyping,
    setError: store.setError,
    
    // Optimistic message actions
    addOptimisticMessage: store.addOptimisticMessage,
    updateOptimisticMessage: store.updateOptimisticMessage,
    removeOptimisticMessage: store.removeOptimisticMessage,
    clearOptimisticMessages: store.clearOptimisticMessages,
    
    // Combined actions (recommended for components)
    sendMessageWithOptimistic: store.sendMessageWithOptimistic,
    retryMessage: store.retryMessage,
    
    // Convenience methods for quick message creation
    sendUserMessage: (tab: TabType, content: string, component?: React.ReactNode) => {
      const message: Message = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        type: 'user',
        timestamp: new Date().toISOString(),
        component
      };
      store.addMessage(tab, message);
      return message;
    },
    
    sendAIMessage: (tab: TabType, content: string, metadata?: Record<string, any>, component?: React.ReactNode) => {
      const message: Message = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        type: 'ai',
        timestamp: new Date().toISOString(),
        metadata,
        component
      };
      store.addMessage(tab, message);
      return message;
    },
    
    // Quick optimistic message sending (most common use case)
    sendMessage: async (content: string, component?: React.ReactNode) => {
      const activeTab = store.activeTab;
      return store.sendMessageWithOptimistic(activeTab, content, component);
    },
    
    // Switch tab and send message
    sendMessageToTab: async (tab: TabType, content: string, component?: React.ReactNode) => {
      store.setActiveTab(tab);
      return store.sendMessageWithOptimistic(tab, content, component);
    }
  };
};

// Specialized hooks for different use cases

// Hook for message display components (read-only, optimized for rendering)
export const useMessageDisplay = (tab?: TabType) => {
  const activeTab = useChatStore(state => state.activeTab);
  const targetTab = tab || activeTab;
  
  return {
    messages: useChatStore(state => state.getCombinedMessages(targetTab)),
    isTyping: useChatStore(state => state.isTyping),
    error: useChatStore(state => state.error),
    pendingCount: useChatStore(state => state.getPendingCount(targetTab)),
    failedCount: useChatStore(state => state.getFailedCount(targetTab)),
  };
};

// Hook for message input components (write operations)
export const useMessageInput = () => {
  const activeTab = useChatStore(state => state.activeTab);
  const sendMessage = useChatStore(state => state.sendMessageWithOptimistic);
  const isLoading = useChatStore(state => state.isLoading);
  const isTyping = useChatStore(state => state.isTyping);
  const error = useChatStore(state => state.error);
  
  return {
    activeTab,
    sendMessage: (content: string, component?: React.ReactNode) => 
      sendMessage(activeTab, content, component),
    isLoading,
    isTyping,
    error,
    isDisabled: isLoading || isTyping
  };
};

// Hook for tab management
export const useTabManager = () => {
  const activeTab = useChatStore(state => state.activeTab);
  const setActiveTab = useChatStore(state => state.setActiveTab);
  
  const tabStats = useChatStore(state => ({
    home: {
      messageCount: state.getMessageCount('home'),
      hasMessages: state.hasMessages('home'),
      pendingCount: state.getPendingCount('home'),
      failedCount: state.getFailedCount('home'),
    },
    progress: {
      messageCount: state.getMessageCount('progress'),
      hasMessages: state.hasMessages('progress'),
      pendingCount: state.getPendingCount('progress'),
      failedCount: state.getFailedCount('progress'),
    },
    review: {
      messageCount: state.getMessageCount('review'),
      hasMessages: state.hasMessages('review'),
      pendingCount: state.getPendingCount('review'),
      failedCount: state.getFailedCount('review'),
    },
    explore: {
      messageCount: state.getMessageCount('explore'),
      hasMessages: state.hasMessages('explore'),
      pendingCount: state.getPendingCount('explore'),
      failedCount: state.getFailedCount('explore'),
    },
  }));
  
  return {
    activeTab,
    setActiveTab,
    tabStats
  };
};