# TASK-009: Migrate Chat State to Zustand (TDD)

## Task Overview
**Epic**: State Management Migration  
**Story Points**: 5  
**Priority**: High  
**Type**: Refactoring  
**Assignee**: TBD  
**Status**: 🔴 Not Started  

## Description
Replace complex local chat state management with Zustand store implementation. This task migrates all chat-related state from the monolithic AITutorChat component to the Zustand stores created in TASK-004, eliminating prop drilling and improving performance.

## Business Value
- Eliminates prop drilling through multiple component layers
- Improves performance through selective subscriptions
- Simplifies component logic by removing state management concerns
- Enables better testing through isolated state management
- Supports easier component decomposition and reuse
- Provides better debugging through centralized state

## Current State Analysis

### Current Chat State Problems
```typescript
// Current complex state in AITutorChat component
const [tabMessages, setTabMessages] = useState<Record<TabType, Message[]>>({
  home: getInitialMessages('home'),
  progress: getInitialMessages('progress'),
  review: getInitialMessages('review'),
  explore: getInitialMessages('explore'),
});

const [activeTab, setActiveTab] = useState<TabType>('home');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Complex prop passing
<MessageList 
  messages={tabMessages[activeTab]} 
  loading={isLoading}
  error={error}
  onRetry={() => setError(null)}
/>
<MessageInput 
  onSend={(msg) => {
    setTabMessages(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], msg]
    }));
  }}
  disabled={isLoading}
/>
```

### Issues to Address
- **Complex state updates**: Manual state management across multiple useState calls
- **Prop drilling**: State passed through 3-4 component layers
- **Performance issues**: Unnecessary re-renders due to state structure
- **Synchronization problems**: State can get out of sync between components
- **Testing complexity**: Hard to test state changes in isolation

## Target Architecture

### Clean Zustand Integration
```typescript
// Simple component using Zustand
function MessageList() {
  const { messages, isLoading, error } = useChatStore((state) => ({
    messages: state.getTabMessages(state.activeTab),
    isLoading: state.isLoading,
    error: state.error
  }));

  // Component logic without state management
  return (
    <div>
      {messages.map(message => <MessageBubble key={message.id} message={message} />)}
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
    </div>
  );
}

function MessageInput() {
  const { addMessage, activeTab, setLoading } = useChatStore();
  
  const handleSend = (message: string) => {
    const newMessage = createMessage(message, 'user');
    addMessage(activeTab, newMessage);
    // No complex state management needed
  };

  return <input onSubmit={handleSend} />;
}
```

## Acceptance Criteria

### Must Have
- [ ] All chat state moved from AITutorChat component to Zustand stores
- [ ] All chat components use Zustand instead of props for state access
- [ ] Remove all prop drilling related to chat state
- [ ] Implement proper selectors for optimal performance
- [ ] Add persistence for chat history across browser sessions
- [ ] Maintain all existing functionality without regressions
- [ ] Ensure performance improvements through selective subscriptions

### Nice to Have
- [ ] Add optimistic updates for better user experience
- [ ] Implement message search functionality using store
- [ ] Add message threading/conversation tracking
- [ ] Create store-based undo/redo functionality
- [ ] Add real-time synchronization hooks

## Technical Implementation

### Store Integration Strategy

#### Update Chat Store with Advanced Features
```typescript
// src/features/ai-tutor/stores/chatStore.ts (enhanced)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface ChatState {
  // Core state
  tabMessages: Record<TabType, Message[]>;
  activeTab: TabType;
  isLoading: boolean;
  error: string | null;
  
  // UI state
  typingUsers: Record<TabType, string[]>;
  scrollPosition: Record<TabType, number>;
  
  // Actions
  addMessage: (tab: TabType, message: Message) => void;
  addOptimisticMessage: (tab: TabType, message: Partial<Message>) => void;
  removeMessage: (tab: TabType, messageId: string) => void;
  updateMessage: (tab: TabType, messageId: string, updates: Partial<Message>) => void;
  clearMessages: (tab: TabType) => void;
  setActiveTab: (tab: TabType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTypingUsers: (tab: TabType, users: string[]) => void;
  saveScrollPosition: (tab: TabType, position: number) => void;
  
  // Selectors
  getTabMessages: (tab: TabType) => Message[];
  getActiveTabMessages: () => Message[];
  hasMessages: (tab: TabType) => boolean;
  getMessageCount: (tab: TabType) => number;
  getLastMessage: (tab: TabType) => Message | null;
  searchMessages: (query: string, tab?: TabType) => Message[];
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        tabMessages: {
          home: [],
          progress: [],
          review: [],
          explore: []
        },
        activeTab: 'home',
        isLoading: false,
        error: null,
        typingUsers: {
          home: [],
          progress: [],
          review: [],
          explore: []
        },
        scrollPosition: {
          home: 0,
          progress: 0,
          review: 0,
          explore: 0
        },

        // Actions with Immer for immutable updates
        addMessage: (tab, message) =>
          set((state) => {
            state.tabMessages[tab].push(message);
            state.error = null; // Clear error on successful message
          }),

        addOptimisticMessage: (tab, partialMessage) =>
          set((state) => {
            const optimisticMessage: Message = {
              id: `optimistic-${Date.now()}`,
              content: '',
              type: 'user',
              timestamp: new Date().toISOString(),
              ...partialMessage,
              metadata: { ...partialMessage.metadata, optimistic: true }
            };
            state.tabMessages[tab].push(optimisticMessage);
          }),

        removeMessage: (tab, messageId) =>
          set((state) => {
            state.tabMessages[tab] = state.tabMessages[tab].filter(
              msg => msg.id !== messageId
            );
          }),

        updateMessage: (tab, messageId, updates) =>
          set((state) => {
            const messageIndex = state.tabMessages[tab].findIndex(
              msg => msg.id === messageId
            );
            if (messageIndex >= 0) {
              Object.assign(state.tabMessages[tab][messageIndex], updates);
            }
          }),

        clearMessages: (tab) =>
          set((state) => {
            state.tabMessages[tab] = [];
          }),

        setActiveTab: (tab) =>
          set((state) => {
            state.activeTab = tab;
            state.error = null; // Clear error when switching tabs
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading;
          }),

        setError: (error) =>
          set((state) => {
            state.error = error;
            state.isLoading = false; // Stop loading on error
          }),

        setTypingUsers: (tab, users) =>
          set((state) => {
            state.typingUsers[tab] = users;
          }),

        saveScrollPosition: (tab, position) =>
          set((state) => {
            state.scrollPosition[tab] = position;
          }),

        // Selectors
        getTabMessages: (tab) => get().tabMessages[tab],
        
        getActiveTabMessages: () => {
          const state = get();
          return state.tabMessages[state.activeTab];
        },
        
        hasMessages: (tab) => get().tabMessages[tab].length > 0,
        
        getMessageCount: (tab) => get().tabMessages[tab].length,
        
        getLastMessage: (tab) => {
          const messages = get().tabMessages[tab];
          return messages.length > 0 ? messages[messages.length - 1] : null;
        },
        
        searchMessages: (query, tab) => {
          const state = get();
          const searchTabs = tab ? [tab] : Object.keys(state.tabMessages) as TabType[];
          const results: Message[] = [];
          
          searchTabs.forEach(tabKey => {
            const messages = state.tabMessages[tabKey];
            const matches = messages.filter(msg =>
              msg.content.toLowerCase().includes(query.toLowerCase())
            );
            results.push(...matches);
          });
          
          return results.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        }
      })),
      {
        name: 'ai-tutor-chat-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          tabMessages: state.tabMessages,
          activeTab: state.activeTab,
          scrollPosition: state.scrollPosition
        }),
        version: 1
      }
    ),
    { name: 'ai-tutor-chat-store' }
  )
);

// Optimized selectors for common use cases
export const useActiveTab = () => useChatStore(state => state.activeTab);
export const useActiveTabMessages = () => useChatStore(state => state.getActiveTabMessages());
export const useChatLoading = () => useChatStore(state => state.isLoading);
export const useChatError = () => useChatStore(state => state.error);

// Selector with tab parameter
export const useChatMessages = (tab: TabType) => 
  useChatStore(state => state.getTabMessages(tab));

export const useMessageCount = (tab: TabType) =>
  useChatStore(state => state.getMessageCount(tab));

export const useTypingUsers = (tab: TabType) =>
  useChatStore(state => state.typingUsers[tab]);
```

#### Optimized Component Implementations

```typescript
// src/features/ai-tutor/components/chat/MessageList.tsx (updated)
'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { useChatMessages, useChatLoading, useChatError } from '../../stores/chatStore';
import { MessageBubble } from '../MessageBubble';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';

interface MessageListProps {
  tab: TabType;
  className?: string;
}

// Memoized component for performance
export const MessageList = React.memo<MessageListProps>(({ tab, className }) => {
  const messages = useChatMessages(tab);
  const isLoading = useChatLoading();
  const error = useChatError();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { saveScrollPosition } = useChatStore();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Save scroll position on scroll
  const handleScroll = useMemo(
    () => throttle((e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = (e.target as HTMLDivElement).scrollTop;
      saveScrollPosition(tab, scrollTop);
    }, 100),
    [tab, saveScrollPosition]
  );

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <ErrorMessage 
          error={error} 
          onRetry={() => useChatStore.getState().setError(null)}
        />
      </div>
    );
  }

  return (
    <div 
      className={cn('flex-1 overflow-y-auto p-4 space-y-4', className)}
      onScroll={handleScroll}
    >
      {messages.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message}
            isOptimistic={message.metadata?.optimistic}
          />
        ))
      )}
      
      {isLoading && (
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';
```

```typescript
// src/features/ai-tutor/components/chat/MessageInput.tsx (updated)
'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatStore, useActiveTab } from '../../stores/chatStore';
import { createMessage } from '../../utils/message-utils';

interface MessageInputProps {
  placeholder?: string;
  disabled?: boolean;
  onMessageSent?: (message: Message) => void;
}

export function MessageInput({ 
  placeholder = "Type your message...",
  disabled = false,
  onMessageSent 
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use store directly without prop drilling
  const { addMessage, setLoading, setError } = useChatStore();
  const activeTab = useActiveTab();
  const isLoading = useChatStore(state => state.isLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    setInput(''); // Clear input immediately
    
    try {
      setLoading(true);
      setError(null);

      // Create and add user message
      const userMessage = createMessage(messageContent, 'user');
      addMessage(activeTab, userMessage);
      
      // Simulate AI response (replace with actual API call)
      const aiResponse = await simulateAIResponse(messageContent, activeTab);
      const aiMessage = createMessage(aiResponse, 'ai');
      addMessage(activeTab, aiMessage);
      
      onMessageSent?.(userMessage);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message');
      // Re-add the message to input on error
      setInput(messageContent);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        className="flex-1 min-h-[44px] max-h-32 resize-none"
        rows={1}
      />
      <Button 
        type="submit" 
        disabled={disabled || isLoading || !input.trim()}
        className="self-end"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </Button>
    </form>
  );
}
```

```typescript
// src/features/ai-tutor/components/chat/TabManager.tsx (updated)
'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useActiveTab, useMessageCount } from '../../stores/chatStore';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'home' as const, label: 'Home', icon: '🏠' },
  { id: 'progress' as const, label: 'Progress', icon: '📊' },
  { id: 'review' as const, label: 'Review', icon: '📚' },
  { id: 'explore' as const, label: 'Explore', icon: '🔍' }
];

export function TabManager() {
  const activeTab = useActiveTab();
  const { setActiveTab } = useChatStore();

  return (
    <div className="flex border-b">
      {TABS.map((tab) => {
        const messageCount = useMessageCount(tab.id);
        const isActive = activeTab === tab.id;
        
        return (
          <Button
            key={tab.id}
            variant={isActive ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-none border-b-2',
              isActive 
                ? 'border-primary' 
                : 'border-transparent hover:border-muted'
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {messageCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {messageCount}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}
```

### Migration Strategy

#### Phase 1: Component-by-Component Migration
```typescript
// Step 1: Update AITutorChat to use store
// Before: Complex state management
const AITutorChat = () => {
  const [tabMessages, setTabMessages] = useState(/* complex state */);
  // ... 50+ lines of state management
  
  return (
    <div>
      <TabManager activeTab={activeTab} onTabChange={setActiveTab} />
      <MessageList messages={tabMessages[activeTab]} />
      <MessageInput onSend={handleSend} />
    </div>
  );
};

// After: Simple orchestration
const AITutorChat = () => {
  return (
    <div className="flex flex-col h-full">
      <TabManager />
      <MessageList />
      <MessageInput />
    </div>
  );
};
```

#### Phase 2: Remove Prop Drilling
```typescript
// Remove all prop passing for state
// Components now get state directly from store
// Much cleaner component interfaces
```

#### Phase 3: Performance Optimization
```typescript
// Add selective subscriptions
const OptimizedComponent = () => {
  // Only re-render when specific state changes
  const { messages, isLoading } = useChatStore(
    state => ({
      messages: state.getActiveTabMessages(),
      isLoading: state.isLoading
    }),
    shallow // Shallow comparison for object selection
  );
  
  return /* render */;
};
```

## Testing Strategy

### Store Migration Testing
```typescript
// src/features/ai-tutor/stores/__tests__/chatStore.integration.test.ts
import { renderHook, act } from '@testing-library/react';
import { useChatStore } from '../chatStore';

describe('Chat Store Integration', () => {
  beforeEach(() => {
    // Reset store state
    const store = useChatStore.getState();
    store.clearMessages('home');
    store.clearMessages('progress');
    store.clearMessages('review');
    store.clearMessages('explore');
    store.setActiveTab('home');
    store.setError(null);
    store.setLoading(false);
  });

  it('should handle complete message workflow', () => {
    const { result } = renderHook(() => useChatStore());
    
    const userMessage = {
      id: '1',
      content: 'Hello',
      type: 'user' as const,
      timestamp: new Date().toISOString()
    };
    
    const aiMessage = {
      id: '2',
      content: 'Hi there!',
      type: 'ai' as const,
      timestamp: new Date().toISOString()
    };

    act(() => {
      // Add user message
      result.current.addMessage('home', userMessage);
      
      // Add AI response
      result.current.addMessage('home', aiMessage);
    });

    // Verify state
    const homeMessages = result.current.getTabMessages('home');
    expect(homeMessages).toHaveLength(2);
    expect(homeMessages[0]).toEqual(userMessage);
    expect(homeMessages[1]).toEqual(aiMessage);
  });

  it('should maintain tab isolation', () => {
    const { result } = renderHook(() => useChatStore());
    
    const homeMessage = {
      id: '1',
      content: 'Home message',
      type: 'user' as const,
      timestamp: new Date().toISOString()
    };
    
    const progressMessage = {
      id: '2',
      content: 'Progress message',
      type: 'user' as const,
      timestamp: new Date().toISOString()
    };

    act(() => {
      result.current.addMessage('home', homeMessage);
      result.current.addMessage('progress', progressMessage);
    });

    expect(result.current.getTabMessages('home')).toHaveLength(1);
    expect(result.current.getTabMessages('progress')).toHaveLength(1);
    expect(result.current.getTabMessages('review')).toHaveLength(0);
    expect(result.current.getTabMessages('explore')).toHaveLength(0);
  });

  it('should handle optimistic updates', () => {
    const { result } = renderHook(() => useChatStore());
    
    act(() => {
      result.current.addOptimisticMessage('home', {
        content: 'Optimistic message'
      });
    });

    const messages = result.current.getTabMessages('home');
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Optimistic message');
    expect(messages[0].metadata?.optimistic).toBe(true);
    expect(messages[0].id).toMatch(/^optimistic-/);
  });

  it('should search messages across tabs', () => {
    const { result } = renderHook(() => useChatStore());
    
    act(() => {
      result.current.addMessage('home', {
        id: '1',
        content: 'React tutorial',
        type: 'user',
        timestamp: new Date().toISOString()
      });
      
      result.current.addMessage('progress', {
        id: '2',
        content: 'React progress update',
        type: 'ai',
        timestamp: new Date().toISOString()
      });
      
      result.current.addMessage('explore', {
        id: '3',
        content: 'Vue tutorial',
        type: 'user',
        timestamp: new Date().toISOString()
      });
    });

    const reactMessages = result.current.searchMessages('React');
    expect(reactMessages).toHaveLength(2);
    expect(reactMessages.map(m => m.content)).toEqual([
      'React progress update', // Newer message first
      'React tutorial'
    ]);
  });
});
```

### Component Integration Testing
```typescript
// src/features/ai-tutor/components/__tests__/chat-integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AITutorChat } from '../AITutorChat';
import { useChatStore } from '../../stores/chatStore';

describe('Chat Integration with Zustand', () => {
  beforeEach(() => {
    // Reset store
    const store = useChatStore.getState();
    store.clearMessages('home');
    store.clearMessages('progress');
    store.clearMessages('review');
    store.clearMessages('explore');
    store.setActiveTab('home');
  });

  it('should integrate all components through store', async () => {
    const user = userEvent.setup();
    render(<AITutorChat />);
    
    // Send message in home tab
    const input = screen.getByPlaceholderText(/type.*message/i);
    await user.type(input, 'Hello in home tab');
    await user.click(screen.getByRole('button', { name: /send/i }));
    
    // Switch to progress tab
    await user.click(screen.getByRole('button', { name: /progress/i }));
    
    // Send message in progress tab
    await user.type(input, 'Hello in progress tab');
    await user.click(screen.getByRole('button', { name: /send/i }));
    
    // Switch back to home tab
    await user.click(screen.getByRole('button', { name: /home/i }));
    
    // Verify home tab message is still there
    expect(screen.getByText('Hello in home tab')).toBeInTheDocument();
    
    // Switch to progress tab
    await user.click(screen.getByRole('button', { name: /progress/i }));
    
    // Verify progress tab message is there
    expect(screen.getByText('Hello in progress tab')).toBeInTheDocument();
  });

  it('should show message counts in tab badges', async () => {
    const user = userEvent.setup();
    render(<AITutorChat />);
    
    // Send messages in different tabs
    const input = screen.getByPlaceholderText(/type.*message/i);
    
    // Home tab - 2 messages
    await user.type(input, 'Message 1');
    await user.click(screen.getByRole('button', { name: /send/i }));
    await user.type(input, 'Message 2');
    await user.click(screen.getByRole('button', { name: /send/i }));
    
    // Switch to progress tab - 1 message
    await user.click(screen.getByRole('button', { name: /progress/i }));
    await user.type(input, 'Progress message');
    await user.click(screen.getByRole('button', { name: /send/i }));
    
    // Check badges show correct counts
    expect(screen.getByText('2')).toBeInTheDocument(); // Home tab badge
    expect(screen.getByText('1')).toBeInTheDocument(); // Progress tab badge
  });
});
```

## Files to Create

### Enhanced Store Files
- Update `src/features/ai-tutor/stores/chatStore.ts` with advanced features
- `src/features/ai-tutor/utils/message-utils.ts` (message creation helpers)
- `src/features/ai-tutor/hooks/useChatOperations.ts` (complex operations)

### Test Files
- `src/features/ai-tutor/stores/__tests__/chatStore.integration.test.ts`
- `src/features/ai-tutor/components/__tests__/chat-integration.test.tsx`

## Files to Modify

### Component Updates
- `src/features/ai-tutor/components/AITutorChat.tsx` (remove state management)
- `src/features/ai-tutor/components/chat/MessageList.tsx` (use store)
- `src/features/ai-tutor/components/chat/MessageInput.tsx` (use store)
- `src/features/ai-tutor/components/chat/TabManager.tsx` (use store)
- `src/features/ai-tutor/components/chat/ChatHeader.tsx` (use store)

### Remove Prop Interfaces
- Remove props related to state passing
- Simplify component interfaces
- Update TypeScript types

## Dependencies
**Blocks**: TASK-011 (Custom hooks), TASK-016 (E2E testing)  
**Blocked By**: TASK-007 (useOptimistic), TASK-004 (Zustand setup)  
**Related**: TASK-010 (Learning store), TASK-005 (Component decomposition)

## Definition of Done

### Technical Checklist
- [ ] All chat state moved to Zustand store
- [ ] All prop drilling eliminated
- [ ] Component interfaces simplified
- [ ] Performance improvements through selective subscriptions
- [ ] Persistence working correctly
- [ ] All existing functionality preserved

### Quality Checklist
- [ ] Store integration tests >80% coverage
- [ ] Component integration tests passing
- [ ] Performance benchmarks improved
- [ ] No memory leaks in subscriptions
- [ ] Error handling working correctly

### User Experience Checklist
- [ ] No functionality regressions
- [ ] Tab switching works smoothly
- [ ] Message history persisted across sessions
- [ ] Error states handled gracefully
- [ ] Loading states responsive

## Estimated Timeline
- **Store Enhancement**: 6 hours
- **Component Migration**: 8 hours
- **Prop Drilling Removal**: 4 hours
- **Performance Optimization**: 4 hours
- **Testing**: 8 hours

**Total**: ~30 hours (5 story points)

## Success Metrics
- **Code Reduction**: 40-50% less state management code
- **Performance**: Reduced re-renders by 60%
- **Bundle Size**: No significant increase
- **Developer Experience**: Simplified component development
- **Maintainability**: Easier to add new chat features

## Risk Mitigation
- **State Synchronization**: Comprehensive testing of state updates
- **Performance Regression**: Benchmark before and after migration
- **Complex State Updates**: Use Immer for safe immutable updates
- **Subscription Leaks**: Proper cleanup in component unmounting

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Weekly progress during implementation