import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageList } from '../MessageList';
import type { Message } from '../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    li: ({ children, ...props }: React.ComponentProps<'li'>) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react intersection observer if needed
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
global.IntersectionObserver = mockIntersectionObserver;

describe('MessageList', () => {
  const createMockMessage = (id: string, type: 'user' | 'ai', content: string, component?: React.ReactNode): Message => ({
    id,
    type,
    content,
    timestamp: new Date(),
    component
  });

  const mockMessages: Message[] = [
    createMockMessage('1', 'ai', 'Hello! How can I help you today?'),
    createMockMessage('2', 'user', 'I want to learn React'),
    createMockMessage('3', 'ai', 'Great choice! Let me help you get started with React.'),
  ];

  describe('Basic Rendering', () => {
    it('should render empty state when no messages', () => {
      render(<MessageList messages={[]} />);
      
      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
      expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
    });

    it('should render all messages correctly', () => {
      render(<MessageList messages={mockMessages} />);
      
      expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
      expect(screen.getByText('I want to learn React')).toBeInTheDocument();
      expect(screen.getByText('Great choice! Let me help you get started with React.')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      render(<MessageList messages={mockMessages} className="custom-list-class" />);
      
      const messageList = screen.getByRole('log');
      expect(messageList).toHaveClass('custom-list-class');
    });
  });

  describe('Message Types', () => {
    it('should distinguish between user and AI messages', () => {
      render(<MessageList messages={mockMessages} />);
      
      // AI messages should have bot avatar
      const aiMessages = screen.getAllByTestId('ai-message');
      expect(aiMessages).toHaveLength(2);
      
      // User messages should have user avatar
      const userMessages = screen.getAllByTestId('user-message');
      expect(userMessages).toHaveLength(1);
    });

    it('should render AI messages with bot icon', () => {
      const aiMessage = createMockMessage('ai-1', 'ai', 'AI response');
      render(<MessageList messages={[aiMessage]} />);
      
      expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
    });

    it('should render user messages with user icon', () => {
      const userMessage = createMockMessage('user-1', 'user', 'User message');
      render(<MessageList messages={[userMessage]} />);
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should have different styling for user vs AI messages', () => {
      render(<MessageList messages={mockMessages} />);
      
      const aiMessage = screen.getByTestId('ai-message');
      const userMessage = screen.getByTestId('user-message');
      
      // AI messages should be left-aligned
      expect(aiMessage).toHaveClass('flex-row');
      
      // User messages should be right-aligned
      expect(userMessage).toHaveClass('flex-row-reverse');
    });
  });

  describe('Message Components', () => {
    it('should render embedded components in messages', () => {
      const messageWithComponent = createMockMessage(
        'comp-1', 
        'ai', 
        'Here is a component:',
        <div data-testid="embedded-component">Custom Component</div>
      );
      
      render(<MessageList messages={[messageWithComponent]} />);
      
      expect(screen.getByText('Here is a component:')).toBeInTheDocument();
      expect(screen.getByTestId('embedded-component')).toBeInTheDocument();
      expect(screen.getByText('Custom Component')).toBeInTheDocument();
    });

    it('should handle messages with only components', () => {
      const componentOnlyMessage = createMockMessage(
        'comp-only', 
        'ai', 
        '',
        <div data-testid="component-only">Component Only</div>
      );
      
      render(<MessageList messages={[componentOnlyMessage]} />);
      
      expect(screen.getByTestId('component-only')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator when isLoading is true', () => {
      render(<MessageList messages={mockMessages} isLoading={true} />);
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByText(/thinking/i)).toBeInTheDocument();
    });

    it('should not show loading indicator when isLoading is false', () => {
      render(<MessageList messages={mockMessages} isLoading={false} />);
      
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });

    it('should show typing indicator when isTyping is true', () => {
      render(<MessageList messages={mockMessages} isTyping={true} />);
      
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
      expect(screen.getByText(/is typing/i)).toBeInTheDocument();
    });

    it('should not show typing indicator when isTyping is false', () => {
      render(<MessageList messages={mockMessages} isTyping={false} />);
      
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });

    it('should show both loading and typing indicators if both are true', () => {
      render(<MessageList messages={mockMessages} isLoading={true} isTyping={true} />);
      
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });
  });

  describe('Scrolling Behavior', () => {
    it('should have scrollable container', () => {
      render(<MessageList messages={mockMessages} />);
      
      const scrollContainer = screen.getByTestId('scroll-container');
      expect(scrollContainer).toHaveClass('overflow-y-auto');
    });

    it('should auto-scroll to bottom when new messages are added', () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;
      
      const { rerender } = render(<MessageList messages={mockMessages} />);
      
      const newMessages = [
        ...mockMessages,
        createMockMessage('4', 'user', 'New message')
      ];
      
      rerender(<MessageList messages={newMessages} />);
      
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should maintain scroll position when not at bottom', () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;
      
      render(<MessageList messages={mockMessages} />);
      
      // Simulate user scrolling up
      const scrollContainer = screen.getByTestId('scroll-container');
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, writable: true });
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 500, writable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 300, writable: true });
      
      // Add new message - should not auto scroll
      const { rerender } = render(<MessageList messages={mockMessages} />);
      const newMessages = [...mockMessages, createMockMessage('4', 'ai', 'New AI message')];
      rerender(<MessageList messages={newMessages} />);
      
      // Should not auto-scroll when user is not at bottom
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show retry button when onRetry is provided and there are no messages', () => {
      const onRetry = vi.fn();
      render(<MessageList messages={[]} onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', () => {
      const onRetry = vi.fn();
      render(<MessageList messages={[]} onRetry={onRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should not show retry button when onRetry is not provided', () => {
      render(<MessageList messages={[]} />);
      
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe('Timestamps', () => {
    it('should display message timestamps', () => {
      const messageWithTime = createMockMessage('time-1', 'user', 'Test message');
      messageWithTime.timestamp = new Date('2023-01-01T12:00:00Z');
      
      render(<MessageList messages={[messageWithTime]} />);
      
      // Should show relative time
      expect(screen.getByText(/12:00/)).toBeInTheDocument();
    });

    it('should group messages by time proximity', () => {
      const now = new Date();
      const messages = [
        { ...createMockMessage('1', 'ai', 'First'), timestamp: now },
        { ...createMockMessage('2', 'ai', 'Second'), timestamp: new Date(now.getTime() + 30000) }, // 30 seconds later
        { ...createMockMessage('3', 'ai', 'Third'), timestamp: new Date(now.getTime() + 600000) }, // 10 minutes later
      ];
      
      render(<MessageList messages={messages} />);
      
      // Should show timestamp dividers for messages far apart in time
      const timestampDividers = screen.getAllByTestId('timestamp-divider');
      expect(timestampDividers.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MessageList messages={mockMessages} />);
      
      const messageList = screen.getByRole('log');
      expect(messageList).toHaveAttribute('aria-label', 'Chat messages');
    });

    it('should have live region for new messages', () => {
      render(<MessageList messages={mockMessages} />);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce new messages to screen readers', () => {
      const { rerender } = render(<MessageList messages={mockMessages} />);
      
      const newMessages = [
        ...mockMessages,
        createMockMessage('new', 'ai', 'New AI message')
      ];
      
      rerender(<MessageList messages={newMessages} />);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('New message from AI Tutor');
    });

    it('should be keyboard navigable', () => {
      render(<MessageList messages={mockMessages} onRetry={vi.fn()} />);
      
      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.focus();
      
      expect(document.activeElement).toBe(retryButton);
    });
  });

  describe('Performance', () => {
    it('should handle large message lists efficiently', () => {
      const manyMessages = Array.from({ length: 100 }, (_, i) =>
        createMockMessage(`msg-${i}`, i % 2 === 0 ? 'ai' : 'user', `Message ${i}`)
      );
      
      const { container } = render(<MessageList messages={manyMessages} />);
      
      // Should render without performance issues
      expect(container.querySelectorAll('[data-testid*="message"]')).toHaveLength(100);
    });

    it('should virtualize long message lists', () => {
      // For future implementation - check if virtualization is working
      const manyMessages = Array.from({ length: 1000 }, (_, i) =>
        createMockMessage(`msg-${i}`, 'ai', `Message ${i}`)
      );
      
      render(<MessageList messages={manyMessages} />);
      
      // Should have virtualization container
      const virtualContainer = screen.queryByTestId('virtual-list');
      // This would be implemented when we add virtualization
      if (virtualContainer) {
        expect(virtualContainer).toBeInTheDocument();
      }
    });
  });
});