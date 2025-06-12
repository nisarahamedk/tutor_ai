# TASK-007: Implement useOptimistic for Chat Messages (TDD)

## Task Overview
**Epic**: Component Decomposition  
**Story Points**: 4  
**Priority**: Medium  
**Type**: Feature  
**Assignee**: TBD  
**Status**: 🔴 Not Started  

## Description
Add optimistic updates for chat messages using React 19's useOptimistic hook to provide instant user feedback while API calls are in progress. This improves perceived performance and user experience by showing messages immediately before server confirmation.

## Business Value
- Improves perceived performance with instant UI feedback
- Provides better user experience during network delays
- Reduces user frustration with slow API responses
- Demonstrates modern React 19 capabilities
- Enables graceful handling of network failures with rollback

## Current State Analysis

### Current Message Flow Issues
```typescript
// Current synchronous flow with loading states
const handleSend = async (message: string) => {
  setIsLoading(true);
  try {
    const response = await sendMessage(message);
    setMessages(prev => [...prev, userMessage, response]);
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### Problems to Address
- **Delayed feedback**: Users wait for API response to see their message
- **Poor perceived performance**: Loading states don't feel instant
- **Network dependency**: UI feels slow on poor connections
- **Error handling complexity**: Failed messages need special handling

## Target Architecture

### Modern useOptimistic Pattern
```typescript
// Optimistic updates with automatic rollback
function ChatMessages({ initialMessages }) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    initialMessages,
    (state, newMessage) => [...state, { ...newMessage, pending: true }]
  );

  async function sendMessage(message: string) {
    const optimisticMsg = { id: crypto.randomUUID(), content: message, type: 'user' };
    
    // Instantly add to UI
    addOptimisticMessage(optimisticMsg);
    
    try {
      // API call happens in background
      await sendMessageAction(message);
    } catch (error) {
      // Automatic rollback + error handling
      toast.error('Failed to send message');
    }
  }

  return (
    <div>
      {optimisticMessages.map(msg => (
        <MessageBubble key={msg.id} message={msg} isPending={msg.pending} />
      ))}
    </div>
  );
}
```

## Acceptance Criteria

### Must Have
- [ ] Implement useOptimistic for chat message sending
- [ ] Show instant message feedback with visual pending state
- [ ] Handle automatic rollback on API failures
- [ ] Maintain message order consistency during optimistic updates
- [ ] Add proper error handling with user-friendly notifications
- [ ] Test edge cases (rapid sending, network failures, concurrent updates)
- [ ] Preserve existing functionality without regressions

### Nice to Have
- [ ] Add typing indicators during message processing
- [ ] Implement optimistic updates for message editing
- [ ] Add optimistic reactions/likes to messages
- [ ] Create reusable optimistic update patterns
- [ ] Add analytics for optimistic update success rates

## Technical Implementation

### useOptimistic Integration with Zustand

#### Enhanced Message Types
```typescript
// src/features/ai-tutor/types.ts (enhanced)
export interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: string;
  metadata?: {
    optimistic?: boolean;
    pending?: boolean;
    failed?: boolean;
    retryCount?: number;
  };
}

export interface OptimisticMessage extends Omit<Message, 'id'> {
  id?: string;
  tempId?: string;
}
```

#### Optimistic Chat Component
```typescript
// src/features/ai-tutor/components/chat/OptimisticMessageList.tsx
'use client';

import React, { useOptimistic, useTransition } from 'react';
import { useChatMessages, useChatStore } from '../../stores/chatStore';
import { MessageBubble } from '../MessageBubble';
import { sendMessageAction } from '../../actions/message-actions';
import { toast } from '@/components/ui/use-toast';

interface OptimisticMessageListProps {
  tab: TabType;
}

export function OptimisticMessageList({ tab }: OptimisticMessageListProps) {
  const initialMessages = useChatMessages(tab);
  const { addMessage } = useChatStore();
  const [isPending, startTransition] = useTransition();

  // useOptimistic for instant UI updates
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    initialMessages,
    (state: Message[], optimisticMessage: OptimisticMessage) => {
      const newMessage: Message = {
        id: optimisticMessage.tempId || crypto.randomUUID(),
        content: optimisticMessage.content,
        type: optimisticMessage.type,
        timestamp: optimisticMessage.timestamp || new Date().toISOString(),
        metadata: {
          ...optimisticMessage.metadata,
          optimistic: true,
          pending: true
        }
      };
      
      return [...state, newMessage];
    }
  );

  const sendOptimisticMessage = async (content: string) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const timestamp = new Date().toISOString();

    // Instantly add optimistic message to UI
    addOptimisticMessage({
      tempId,
      content,
      type: 'user',
      timestamp,
      metadata: { optimistic: true, pending: true }
    });

    // Use transition for the async operation
    startTransition(async () => {
      try {
        // Create form data for Server Action
        const formData = new FormData();
        formData.append('message', content);
        formData.append('tab', tab);
        formData.append('tempId', tempId);

        // Call Server Action
        const result = await sendMessageAction(null, formData);

        if (result.success) {
          // Add confirmed user message to store
          const confirmedUserMessage: Message = {
            id: crypto.randomUUID(),
            content,
            type: 'user',
            timestamp,
            metadata: { optimistic: false }
          };
          addMessage(tab, confirmedUserMessage);

          // Add AI response if provided
          if (result.message) {
            const aiMessage: Message = {
              id: crypto.randomUUID(),
              content: result.message,
              type: 'ai',
              timestamp: result.timestamp || new Date().toISOString(),
              metadata: { optimistic: false }
            };
            addMessage(tab, aiMessage);
          }
        } else {
          // Handle error - optimistic update will be rolled back automatically
          toast({
            title: "Failed to send message",
            description: result.error || "Please try again",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Optimistic message failed:', error);
        toast({
          title: "Network error",
          description: "Please check your connection and try again",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {optimisticMessages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          isPending={message.metadata?.pending}
          isFailed={message.metadata?.failed}
          isOptimistic={message.metadata?.optimistic}
        />
      ))}
      
      {isPending && (
        <div className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            Processing message...
          </div>
        </div>
      )}
    </div>
  );
}
```

#### Enhanced Message Bubble Component
```typescript
// src/features/ai-tutor/components/MessageBubble.tsx (enhanced)
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertCircle, Check } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isPending?: boolean;
  isFailed?: boolean;
  isOptimistic?: boolean;
  onRetry?: () => void;
}

export const MessageBubble = React.memo<MessageBubbleProps>(({
  message,
  isPending = false,
  isFailed = false,
  isOptimistic = false,
  onRetry
}) => {
  const isUser = message.type === 'user';
  
  return (
    <div
      className={cn(
        'flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm',
        isUser
          ? 'ml-auto bg-primary text-primary-foreground'
          : 'bg-muted',
        isPending && 'opacity-70',
        isFailed && 'bg-destructive/10 border border-destructive'
      )}
      data-testid={`${message.type}-message`}
    >
      <div className="flex items-start gap-2">
        <div className="flex-1">
          {message.content}
        </div>
        
        {/* Status indicators */}
        <div className="flex items-center gap-1 mt-0.5">
          {isPending && (
            <div
              className="h-2 w-2 animate-spin rounded-full border border-current border-t-transparent"
              aria-label="Sending message"
            />
          )}
          
          {!isPending && !isFailed && isOptimistic && (
            <Check className="h-3 w-3 text-green-500" aria-label="Message sent" />
          )}
          
          {isFailed && (
            <AlertCircle className="h-3 w-3 text-destructive" aria-label="Failed to send" />
          )}
        </div>
      </div>

      {/* Retry button for failed messages */}
      {isFailed && onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="self-end mt-1"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}

      {/* Timestamp */}
      <div className="text-xs opacity-70 self-end">
        {new Date(message.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}
        {isOptimistic && !isPending && (
          <span className="ml-1 text-green-500">✓</span>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
```

#### Optimistic Message Input
```typescript
// src/features/ai-tutor/components/chat/OptimisticMessageInput.tsx
'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';

interface OptimisticMessageInputProps {
  onSendOptimistic: (message: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function OptimisticMessageInput({
  onSendOptimistic,
  disabled = false,
  placeholder = "Type your message..."
}: OptimisticMessageInputProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isProcessing || disabled) return;

    const messageContent = input.trim();
    setInput(''); // Clear immediately for instant feedback
    setIsProcessing(true);

    try {
      await onSendOptimistic(messageContent);
    } catch (error) {
      // On error, restore the message to input
      setInput(messageContent);
    } finally {
      setIsProcessing(false);
      textareaRef.current?.focus();
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
        disabled={disabled}
        className="flex-1 min-h-[44px] max-h-32 resize-none"
        rows={1}
        data-testid="message-input"
      />
      
      <Button 
        type="submit" 
        disabled={disabled || !input.trim() || isProcessing}
        className="self-end"
        data-testid="send-button"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}
```

### Advanced Optimistic Patterns

#### Retry Mechanism
```typescript
// src/features/ai-tutor/hooks/useOptimisticRetry.ts
import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export function useOptimisticRetry<T>(
  action: (data: T) => Promise<void>,
  maxRetries = 3
) {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async (data: T) => {
    let attempts = 0;
    
    while (attempts <= maxRetries) {
      try {
        await action(data);
        setRetryCount(0); // Reset on success
        return;
      } catch (error) {
        attempts++;
        setRetryCount(attempts);
        
        if (attempts <= maxRetries) {
          setIsRetrying(true);
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempts) * 1000)
          );
          setIsRetrying(false);
        } else {
          // Max retries exceeded
          toast({
            title: "Failed to send message",
            description: `Failed after ${maxRetries} attempts. Please try again.`,
            variant: "destructive",
          });
          throw error;
        }
      }
    }
  }, [action, maxRetries]);

  return {
    executeWithRetry,
    retryCount,
    isRetrying
  };
}
```

#### Batch Optimistic Updates
```typescript
// src/features/ai-tutor/hooks/useBatchOptimistic.ts
import { useOptimistic, useCallback } from 'react';

export function useBatchOptimistic<T>(
  initialData: T[],
  batchDelay = 100
) {
  const [optimisticData, addOptimisticItem] = useOptimistic(
    initialData,
    (state: T[], newItem: T) => [...state, newItem]
  );

  const [pendingBatch, setPendingBatch] = useState<T[]>([]);

  const addToBatch = useCallback((item: T) => {
    setPendingBatch(prev => [...prev, item]);
    
    // Process batch after delay
    setTimeout(() => {
      setPendingBatch(prev => {
        prev.forEach(batchItem => addOptimisticItem(batchItem));
        return [];
      });
    }, batchDelay);
  }, [addOptimisticItem, batchDelay]);

  return {
    optimisticData,
    addToBatch,
    pendingBatchCount: pendingBatch.length
  };
}
```

## Testing Strategy

### useOptimistic Testing
```typescript
// src/features/ai-tutor/components/chat/__tests__/OptimisticMessageList.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptimisticMessageList } from '../OptimisticMessageList';
import { sendMessageAction } from '../../../actions/message-actions';

// Mock Server Action
vi.mock('../../../actions/message-actions', () => ({
  sendMessageAction: vi.fn()
}));

describe('OptimisticMessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show optimistic message immediately', async () => {
    const user = userEvent.setup();
    
    // Mock successful response with delay
    vi.mocked(sendMessageAction).mockImplementation(
      () => new Promise(resolve => 
        setTimeout(() => resolve({ success: true, message: 'AI response' }), 1000)
      )
    );

    render(
      <div>
        <OptimisticMessageList tab="home" />
        <OptimisticMessageInput onSendOptimistic={async (msg) => {/* handled by component */}} />
      </div>
    );

    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    // Type and send message
    await user.type(input, 'Hello optimistic world');
    await user.click(sendButton);

    // Message should appear immediately (optimistic)
    expect(screen.getByText('Hello optimistic world')).toBeInTheDocument();
    
    // Should show pending state
    expect(screen.getByLabelText('Sending message')).toBeInTheDocument();

    // Wait for API response
    await waitFor(() => {
      expect(screen.getByText('AI response')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Pending state should be gone
    expect(screen.queryByLabelText('Sending message')).not.toBeInTheDocument();
  });

  it('should handle failed optimistic updates', async () => {
    const user = userEvent.setup();
    
    // Mock failed response
    vi.mocked(sendMessageAction).mockResolvedValue({
      success: false,
      error: 'Network error'
    });

    render(
      <div>
        <OptimisticMessageList tab="home" />
        <OptimisticMessageInput onSendOptimistic={async (msg) => {/* handled by component */}} />
      </div>
    );

    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    // Send message
    await user.type(input, 'This will fail');
    await user.click(sendButton);

    // Optimistic message appears
    expect(screen.getByText('This will fail')).toBeInTheDocument();

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
    });

    // Optimistic message should be rolled back automatically
    await waitFor(() => {
      expect(screen.queryByText('This will fail')).not.toBeInTheDocument();
    });
  });

  it('should handle rapid message sending', async () => {
    const user = userEvent.setup();
    
    // Mock responses with different delays
    vi.mocked(sendMessageAction)
      .mockResolvedValueOnce({ success: true, message: 'Response 1' })
      .mockResolvedValueOnce({ success: true, message: 'Response 2' })
      .mockResolvedValueOnce({ success: true, message: 'Response 3' });

    render(
      <div>
        <OptimisticMessageList tab="home" />
        <OptimisticMessageInput onSendOptimistic={async (msg) => {/* handled by component */}} />
      </div>
    );

    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    // Send multiple messages rapidly
    await user.type(input, 'Message 1');
    await user.click(sendButton);
    
    await user.type(input, 'Message 2');
    await user.click(sendButton);
    
    await user.type(input, 'Message 3');
    await user.click(sendButton);

    // All optimistic messages should appear immediately
    expect(screen.getByText('Message 1')).toBeInTheDocument();
    expect(screen.getByText('Message 2')).toBeInTheDocument();
    expect(screen.getByText('Message 3')).toBeInTheDocument();

    // All should show pending state
    expect(screen.getAllByLabelText('Sending message')).toHaveLength(3);

    // Wait for all responses
    await waitFor(() => {
      expect(screen.getByText('Response 1')).toBeInTheDocument();
      expect(screen.getByText('Response 2')).toBeInTheDocument();
      expect(screen.getByText('Response 3')).toBeInTheDocument();
    });

    // No pending states should remain
    expect(screen.queryAllByLabelText('Sending message')).toHaveLength(0);
  });

  it('should preserve message order during optimistic updates', async () => {
    const user = userEvent.setup();
    
    // Mock responses with reverse timing (later messages respond faster)
    vi.mocked(sendMessageAction)
      .mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => 
          resolve({ success: true, message: 'Slow response' }), 2000))
      )
      .mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => 
          resolve({ success: true, message: 'Fast response' }), 500))
      );

    render(
      <div>
        <OptimisticMessageList tab="home" />
        <OptimisticMessageInput onSendOptimistic={async (msg) => {/* handled by component */}} />
      </div>
    );

    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    // Send first message
    await user.type(input, 'First message');
    await user.click(sendButton);
    
    // Send second message
    await user.type(input, 'Second message');
    await user.click(sendButton);

    // Both optimistic messages appear in order
    const messages = screen.getAllByTestId(/.*-message/);
    expect(messages[0]).toHaveTextContent('First message');
    expect(messages[1]).toHaveTextContent('Second message');

    // Wait for fast response first
    await waitFor(() => {
      expect(screen.getByText('Fast response')).toBeInTheDocument();
    });

    // Then slow response
    await waitFor(() => {
      expect(screen.getByText('Slow response')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Verify final order is preserved
    const finalMessages = screen.getAllByTestId(/.*-message/);
    const messageTexts = finalMessages.map(msg => msg.textContent);
    
    expect(messageTexts).toEqual([
      expect.stringContaining('First message'),
      expect.stringContaining('Slow response'),
      expect.stringContaining('Second message'),
      expect.stringContaining('Fast response')
    ]);
  });
});
```

### Performance Testing
```typescript
// src/features/ai-tutor/components/chat/__tests__/optimistic-performance.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptimisticMessageList } from '../OptimisticMessageList';

describe('Optimistic Updates Performance', () => {
  it('should handle large number of optimistic updates efficiently', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <OptimisticMessageList tab="home" />
        <OptimisticMessageInput onSendOptimistic={async () => {}} />
      </div>
    );

    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    // Measure performance of rapid optimistic updates
    const start = performance.now();
    
    // Send 50 messages rapidly
    for (let i = 0; i < 50; i++) {
      await user.type(input, `Rapid message ${i}`);
      await user.click(sendButton);
    }
    
    const end = performance.now();
    const totalTime = end - start;
    
    // Should handle rapid updates efficiently
    expect(totalTime).toBeLessThan(5000); // 5 seconds max for 50 messages
    
    // All messages should be visible
    expect(screen.getAllByTestId('user-message')).toHaveLength(50);
  });

  it('should not cause memory leaks with many optimistic updates', async () => {
    // Monitor memory usage during optimistic updates
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    const { unmount } = render(
      <div>
        <OptimisticMessageList tab="home" />
        <OptimisticMessageInput onSendOptimistic={async () => {}} />
      </div>
    );

    // Simulate many updates
    const user = userEvent.setup();
    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    for (let i = 0; i < 100; i++) {
      await user.type(input, `Memory test ${i}`);
      await user.click(sendButton);
    }

    unmount();

    // Force garbage collection if available
    if (global.gc) global.gc();

    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB threshold
  });
});
```

## Files to Create

### Component Files
- `src/features/ai-tutor/components/chat/OptimisticMessageList.tsx`
- `src/features/ai-tutor/components/chat/OptimisticMessageInput.tsx`
- Update `src/features/ai-tutor/components/MessageBubble.tsx`

### Hook Files
- `src/features/ai-tutor/hooks/useOptimisticRetry.ts`
- `src/features/ai-tutor/hooks/useBatchOptimistic.ts`

### Test Files
- `src/features/ai-tutor/components/chat/__tests__/OptimisticMessageList.test.tsx`
- `src/features/ai-tutor/components/chat/__tests__/OptimisticMessageInput.test.tsx`
- `src/features/ai-tutor/components/chat/__tests__/optimistic-performance.test.tsx`

### Utility Files
- `src/features/ai-tutor/utils/optimistic-helpers.ts`

## Files to Modify

### Integration Updates
- `src/features/ai-tutor/components/AITutorChat.tsx` (integrate optimistic components)
- `src/features/ai-tutor/actions/message-actions.ts` (handle tempId)
- `src/features/ai-tutor/stores/chatStore.ts` (optimistic message handling)

### Type Updates
- `src/features/ai-tutor/types.ts` (add optimistic message types)

## Dependencies
**Blocks**: TASK-009 (Chat state migration), TASK-012 (Server Actions)  
**Blocked By**: TASK-006 (useActionState), TASK-005 (Component decomposition)  
**Related**: TASK-008 (Server Components), TASK-016 (E2E testing)

## Definition of Done

### Technical Checklist
- [ ] useOptimistic implemented for chat messages
- [ ] Instant message feedback working correctly
- [ ] Automatic rollback on API failures functional
- [ ] Message order consistency maintained
- [ ] Error handling comprehensive and user-friendly
- [ ] Performance benchmarks met (no regression)

### Quality Checklist
- [ ] >80% test coverage for optimistic update logic
- [ ] Edge cases tested (rapid sending, network failures)
- [ ] Performance tests validate efficiency
- [ ] Memory leak testing passed
- [ ] User experience improved measurably

### User Experience Checklist
- [ ] Messages appear instantly when sent
- [ ] Clear visual feedback for pending states
- [ ] Graceful error handling with retry options
- [ ] No perceived delay in message sending
- [ ] Consistent behavior across all chat tabs

## Estimated Timeline
- **useOptimistic Implementation**: 8 hours
- **Component Integration**: 6 hours
- **Error Handling & Retry Logic**: 6 hours
- **Testing (Unit + Performance)**: 8 hours
- **Polish & Edge Cases**: 4 hours

**Total**: ~32 hours (4 story points)

## Success Metrics
- **Perceived Performance**: 100% instant message feedback
- **Error Recovery**: Graceful handling of all failure scenarios  
- **Performance**: No regression in render times
- **User Satisfaction**: Improved responsiveness feedback
- **Reliability**: Consistent behavior under network stress

## Risk Mitigation
- **State Synchronization**: Comprehensive testing of optimistic/real state alignment
- **Memory Leaks**: Regular performance monitoring during development
- **Race Conditions**: Proper handling of concurrent optimistic updates
- **Rollback Complexity**: Simple, predictable rollback mechanisms

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Upon completion of TASK-006 (useActionState)