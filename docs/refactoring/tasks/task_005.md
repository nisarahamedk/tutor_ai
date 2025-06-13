# TASK-005: Extract Chat Container Components (TDD)

## Task Overview
**Epic**: Component Decomposition  
**Story Points**: 8  
**Priority**: High  
**Type**: Refactoring  
**Assignee**: TBD  
**Status**: ✅ Completed  

## Description
Break down the monolithic AITutorChat component (535+ lines) into smaller, focused components using Test-Driven Development approach. This is the core refactoring task that addresses the Single Responsibility Principle violations.

## Business Value
- Reduces complexity and improves maintainability
- Enables parallel development on different chat features
- Improves testability of individual components
- Makes code more readable and easier to onboard new developers
- Reduces risk of bugs through smaller, focused components

## Current State Analysis

### AITutorChat Component Issues
- **535+ lines** violating SRP
- **Mixed concerns**: UI rendering, state management, business logic
- **Complex state**: Managing 4 different tabs with separate message arrays
- **Tight coupling**: Everything depends on everything else
- **Hard to test**: Monolithic structure makes unit testing difficult

### Current Component Structure
```typescript
// Current monolithic structure
AITutorChat.tsx (535+ lines)
├── Tab management logic
├── Message state management
├── API integration
├── UI rendering for all tabs
├── Input handling
├── Error handling
└── Loading states
```

## Target Architecture

### Proposed Component Breakdown
```typescript
// New component structure
ChatContainer.tsx (60-80 lines)
├── Layout and navigation
└── Tab coordination

MessageList.tsx (40-60 lines)
├── Message display
└── Scrolling behavior

MessageInput.tsx (30-50 lines)
├── Input handling
└── Form submission

TabManager.tsx (40-60 lines)
├── Tab state management
└── Tab switching logic

ChatHeader.tsx (30-50 lines)
├── Tab switching UI
└── Action buttons
```

## Acceptance Criteria

### Must Have
- [ ] Extract ChatContainer for layout and navigation
- [ ] Extract MessageList for message display
- [ ] Extract MessageInput for input handling  
- [ ] Extract TabManager for tab state management
- [ ] Extract ChatHeader for tab switching
- [ ] All existing functionality preserved exactly
- [ ] Components properly typed with TypeScript
- [ ] Performance maintained or improved
- [ ] Each component <100 lines
- [ ] All components have comprehensive tests

### Nice to Have
- [ ] Add loading skeletons for better UX
- [ ] Implement error boundaries for each component
- [ ] Add component composition patterns
- [ ] Optimize re-render performance

## Technical Implementation

### Component Interfaces

#### 1. ChatContainer Component
```typescript
interface ChatContainerProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

// Responsibilities:
// - Main layout container
// - Tab coordination
// - Child component orchestration
```

#### 2. MessageList Component
```typescript
interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

// Responsibilities:
// - Display messages in scrollable list
// - Handle loading and error states
// - Manage scroll behavior
// - Message virtualization (if needed)
```

#### 3. MessageInput Component
```typescript
interface MessageInputProps {
  onSend: (message: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

// Responsibilities:
// - Input field management
// - Form validation
// - Send button handling
// - Character counting
```

#### 4. TabManager Component
```typescript
interface TabManagerProps {
  tabs: TabConfig[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

interface TabConfig {
  id: TabType;
  label: string;
  icon?: React.ComponentType;
  disabled?: boolean;
  badge?: number;
}

// Responsibilities:
// - Tab state management
// - Tab configuration
// - Active tab tracking
```

#### 5. ChatHeader Component
```typescript
interface ChatHeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onClear?: () => void;
  onSettings?: () => void;
  className?: string;
}

// Responsibilities:
// - Tab switching UI
// - Header actions (clear, settings)
// - Title and status display
```

## TDD Implementation Process

### Phase 1: Test-First Development

#### Step 1: Write Tests for ChatContainer
```typescript
// src/features/ai-tutor/components/chat/__tests__/ChatContainer.test.tsx
describe('ChatContainer', () => {
  const defaultProps = {
    activeTab: 'home' as TabType,
    onTabChange: vi.fn(),
    children: <div>Test Children</div>
  };

  it('should render children correctly', () => {
    render(<ChatContainer {...defaultProps} />);
    expect(screen.getByText('Test Children')).toBeInTheDocument();
  });

  it('should handle tab changes', () => {
    const onTabChange = vi.fn();
    render(<ChatContainer {...defaultProps} onTabChange={onTabChange} />);
    
    // Test tab change logic
    fireEvent.click(screen.getByTestId('tab-progress'));
    expect(onTabChange).toHaveBeenCalledWith('progress');
  });

  it('should apply correct CSS classes', () => {
    render(<ChatContainer {...defaultProps} className="custom-class" />);
    expect(screen.getByTestId('chat-container')).toHaveClass('custom-class');
  });
});
```

#### Step 2: Create Minimal ChatContainer Implementation
```typescript
// src/features/ai-tutor/components/chat/ChatContainer.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ChatContainerProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  className?: string;
}

export function ChatContainer({ 
  children, 
  activeTab, 
  onTabChange, 
  className 
}: ChatContainerProps) {
  return (
    <div 
      data-testid="chat-container"
      className={cn(
        'flex flex-col h-full bg-background border rounded-lg',
        className
      )}
    >
      <ChatHeader 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
      />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

#### Step 3: Refactor and Optimize
- Add performance optimizations
- Improve accessibility
- Add error boundaries if needed

### Phase 2: Extract MessageList Component

#### Test Implementation
```typescript
describe('MessageList', () => {
  const mockMessages = [
    createMockMessage({ id: '1', content: 'Hello', type: 'user' }),
    createMockMessage({ id: '2', content: 'Hi there!', type: 'ai' })
  ];

  it('should display all messages', () => {
    render(<MessageList messages={mockMessages} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<MessageList messages={[]} loading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle empty messages', () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
  });

  it('should scroll to bottom on new messages', () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    const { rerender } = render(<MessageList messages={mockMessages} />);
    
    const newMessage = createMockMessage({ id: '3', content: 'New message' });
    rerender(<MessageList messages={[...mockMessages, newMessage]} />);
    
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});
```

#### Component Implementation
```typescript
// src/features/ai-tutor/components/chat/MessageList.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { MessageBubble } from '../MessageBubble';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function MessageList({ 
  messages, 
  loading, 
  error, 
  onRetry, 
  className 
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-destructive mb-4">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div 
      className={cn('flex flex-col gap-4 p-4 overflow-y-auto', className)}
      data-testid="message-list"
    >
      {messages.length === 0 && !loading ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No messages yet. Start a conversation!
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
          />
        ))
      )}
      
      {loading && (
        <div className="flex justify-center">
          <LoadingSpinner data-testid="loading-spinner" />
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
```

### Phase 3: Extract Remaining Components
Continue similar TDD process for:
- MessageInput
- TabManager  
- ChatHeader

## Files to Create

### Component Files
- `src/features/ai-tutor/components/chat/ChatContainer.tsx`
- `src/features/ai-tutor/components/chat/MessageList.tsx`
- `src/features/ai-tutor/components/chat/MessageInput.tsx`
- `src/features/ai-tutor/components/chat/TabManager.tsx`
- `src/features/ai-tutor/components/chat/ChatHeader.tsx`
- `src/features/ai-tutor/components/chat/index.ts` (exports)

### Test Files
- `src/features/ai-tutor/components/chat/__tests__/ChatContainer.test.tsx`
- `src/features/ai-tutor/components/chat/__tests__/MessageList.test.tsx`
- `src/features/ai-tutor/components/chat/__tests__/MessageInput.test.tsx`
- `src/features/ai-tutor/components/chat/__tests__/TabManager.test.tsx`
- `src/features/ai-tutor/components/chat/__tests__/ChatHeader.test.tsx`

### Supporting Files
- `src/components/shared/MessageBubble.tsx`
- `src/components/shared/LoadingSpinner.tsx`
- `src/types/chat.ts` (TypeScript interfaces)

## Files to Modify

### Primary Refactoring Target
- `src/features/ai-tutor/components/AITutorChat.tsx`
  - Remove extracted functionality
  - Use new components
  - Reduce from 535+ lines to ~100 lines

### Import Updates
- Update all imports to use new component locations
- Update test imports
- Update any external dependencies

## Performance Considerations

### Optimization Strategies
1. **React.memo** for pure components that re-render frequently
2. **useCallback** for event handlers passed to child components
3. **useMemo** for expensive calculations
4. **Virtual scrolling** for large message lists (if needed)

### Example Optimizations
```typescript
// Memoized MessageBubble to prevent unnecessary re-renders
export const MessageBubble = React.memo<MessageBubbleProps>(
  ({ message, className }) => {
    return (
      <div className={cn('message-bubble', className)}>
        {message.content}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.message.id === nextProps.message.id &&
           prevProps.message.content === nextProps.message.content;
  }
);

// Optimized MessageInput with useCallback
export function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState('');
  
  const handleSend = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  }, [message, onSend]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  }, []);

  return (
    <form onSubmit={handleSend}>
      <input 
        value={message}
        onChange={handleChange}
        placeholder="Type your message..."
      />
      <button type="submit">Send</button>
    </form>
  );
}
```

## Dependencies
**Blocks**: TASK-006, TASK-007, TASK-008  
**Blocked By**: TASK-004 (Zustand setup needed for state management)  
**Related**: TASK-009 (Chat state migration)

## Definition of Done

### Technical Checklist
- [ ] All 5 components extracted and implemented
- [ ] Original AITutorChat component refactored to use new components
- [ ] All functionality preserved (no regressions)
- [ ] Each component <100 lines of code
- [ ] TypeScript interfaces properly defined
- [ ] All components have comprehensive test coverage (>80%)
- [ ] Performance maintained or improved

### Quality Checklist
- [ ] All tests passing (unit + integration)
- [ ] Code review approved by team
- [ ] No accessibility regressions
- [ ] Bundle size impact acceptable
- [ ] No console errors or warnings

### User Experience Checklist
- [ ] All chat features work exactly as before
- [ ] No visual regressions
- [ ] Performance feels the same or better
- [ ] Mobile responsiveness maintained

## Estimated Timeline
- **Planning and Test Writing**: 8 hours
- **ChatContainer Implementation**: 4 hours
- **MessageList Implementation**: 6 hours
- **MessageInput Implementation**: 4 hours
- **TabManager Implementation**: 6 hours
- **ChatHeader Implementation**: 4 hours
- **Integration and Testing**: 8 hours
- **Performance Optimization**: 4 hours

**Total**: ~44 hours (8 story points)

## Risk Mitigation

### High Risk Areas
1. **State Management**: Complex state might break during extraction
2. **Event Handling**: Callback chains might introduce bugs
3. **Performance**: Multiple components might cause re-render issues

### Mitigation Strategies
1. **Incremental Extraction**: Extract one component at a time
2. **Comprehensive Testing**: Test after each component extraction
3. **Performance Monitoring**: Track metrics before and after
4. **Rollback Plan**: Maintain ability to revert changes

## Success Metrics
- **Code Complexity**: Reduced cyclomatic complexity
- **Component Size**: Average component size <100 lines
- **Test Coverage**: Maintained >80% coverage
- **Performance**: No degradation in Core Web Vitals
- **Developer Velocity**: Faster feature development post-refactor

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Upon completion of each component extraction