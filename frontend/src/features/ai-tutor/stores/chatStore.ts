// src/features/ai-tutor/stores/chatStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { ChatState, TabType, Message } from '../types';

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

// Store implementation with proper typing and middleware
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
        error: null,

        // Actions
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

        setError: (error: string | null) =>
          set({ error }, false, `setError/${error}`),

        // Selectors
        getTabMessages: (tab: TabType) => get().tabMessages[tab],
        
        hasMessages: (tab: TabType) => {
          const messages = get().tabMessages[tab];
          // Check if there are messages beyond the initial welcome message
          return messages.length > 1 || (messages.length === 1 && !messages[0].metadata?.isWelcome);
        },
        
        getMessageCount: (tab: TabType) => get().tabMessages[tab].length,
        
        getLastMessage: (tab: TabType) => {
          const messages = get().tabMessages[tab];
          return messages.length > 0 ? messages[messages.length - 1] : null;
        }
      }),
      {
        name: 'ai-tutor-chat-store',
        storage: createJSONStorage(() => localStorage),
        // Only persist messages and active tab, not loading states
        partialize: (state) => ({
          tabMessages: state.tabMessages,
          activeTab: state.activeTab
        }),
        // Handle storage migration if needed
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Migration from v0 to v1 if needed
            return {
              ...persistedState,
              tabMessages: persistedState.tabMessages || {
                home: getInitialMessages('home'),
                progress: getInitialMessages('progress'),
                review: getInitialMessages('review'),
                explore: getInitialMessages('explore')
              }
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

// Selectors for better performance (these can be used with shallow comparison)
export const useChatSelectors = {
  // Get messages for a specific tab
  useTabMessages: (tab: TabType) => useChatStore(state => state.tabMessages[tab]),
  
  // Get active tab
  useActiveTab: () => useChatStore(state => state.activeTab),
  
  // Get loading state
  useIsLoading: () => useChatStore(state => state.isLoading),
  
  // Get error state
  useError: () => useChatStore(state => state.error),
  
  // Get message count for a tab
  useMessageCount: (tab: TabType) => useChatStore(state => state.tabMessages[tab].length),
  
  // Get last message for a tab
  useLastMessage: (tab: TabType) => useChatStore(state => {
    const messages = state.tabMessages[tab];
    return messages.length > 0 ? messages[messages.length - 1] : null;
  }),
  
  // Check if tab has user messages (beyond welcome)
  useHasUserMessages: (tab: TabType) => useChatStore(state => {
    const messages = state.tabMessages[tab];
    return messages.some(msg => msg.type === 'user');
  })
};

// Action hooks for better organization
export const useChatActions = () => {
  const store = useChatStore();
  
  return {
    addMessage: store.addMessage,
    removeMessage: store.removeMessage,
    clearMessages: store.clearMessages,
    setActiveTab: store.setActiveTab,
    setLoading: store.setLoading,
    setError: store.setError,
    
    // Convenience methods
    sendUserMessage: (tab: TabType, content: string) => {
      const message: Message = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        type: 'user',
        timestamp: new Date().toISOString()
      };
      store.addMessage(tab, message);
      return message;
    },
    
    sendAIMessage: (tab: TabType, content: string, metadata?: Record<string, any>) => {
      const message: Message = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        type: 'ai',
        timestamp: new Date().toISOString(),
        metadata
      };
      store.addMessage(tab, message);
      return message;
    }
  };
};