import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock React's useOptimistic hook
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return {
    ...actual,
    useOptimistic: vi.fn(),
  };
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock scrollIntoView
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => <button {...props}>{children}</button>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  AvatarFallback: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined | null | boolean)[]) => args.filter(Boolean).join(' '),
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Bot: ({ ...props }) => <div data-testid="bot-icon" {...props} />,
  User: ({ ...props }) => <div data-testid="user-icon" {...props} />,
  Clock: ({ ...props }) => <div data-testid="clock-icon" {...props} />,
  CheckCircle: ({ ...props }) => <div data-testid="check-icon" {...props} />,
  XCircle: ({ ...props }) => <div data-testid="error-icon" {...props} />,
  RotateCcw: ({ ...props }) => <div data-testid="retry-icon" {...props} />,
  Loader2: ({ ...props }) => <div data-testid="spinner-icon" {...props} />,
}));

import { useOptimistic } from 'react';
import { OptimisticMessageList } from '../OptimisticMessageList';
import type { OptimisticMessage } from '../types';

const mockUseOptimistic = useOptimistic as unknown as ReturnType<typeof vi.fn>;

const mockMessages: OptimisticMessage[] = [
  {
    id: '1',
    content: 'Hello, how can I help you?',
    type: 'ai',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    status: 'sent',
  },
  {
    id: '2',
    content: 'Can you help me with React?',
    type: 'user',
    timestamp: new Date('2024-01-01T10:01:00Z'),
    status: 'sent',
  },
];

describe('OptimisticMessageList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render messages correctly', () => {
      mockUseOptimistic.mockReturnValue([mockMessages, vi.fn()]);

      render(
        <OptimisticMessageList
          messages={mockMessages}
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText('Hello, how can I help you?')).toBeInTheDocument();
      expect(screen.getByText('Can you help me with React?')).toBeInTheDocument();
    });

    it('should show correct message icons', () => {
      mockUseOptimistic.mockReturnValue([mockMessages, vi.fn()]);

      render(
        <OptimisticMessageList
          messages={mockMessages}
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should render empty state when no messages', () => {
      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[]}
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });
  });

  describe('Message Status Visual States', () => {
    it('should show pending state for optimistic messages', () => {
      const pendingMessage: OptimisticMessage = {
        id: 'temp-123',
        content: 'Sending message...',
        type: 'user',
        timestamp: new Date(),
        status: 'pending',
        tempId: 'temp-123',
      };

      mockUseOptimistic.mockReturnValue([[...mockMessages, pendingMessage], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[...mockMessages, pendingMessage]}
          onRetry={vi.fn()}
        />
      );

      // Should show spinner for pending message
      expect(screen.getByTestId('spinner-icon')).toBeInTheDocument();
      
      // Message should have pending visual state (opacity)
      const messageElement = screen.getByText('Sending message...');
      const messageContainer = messageElement.closest('[data-message-status]');
      expect(messageContainer).toHaveAttribute('data-message-status', 'pending');
    });

    it('should show failed state for failed messages', () => {
      const failedMessage: OptimisticMessage = {
        id: '3',
        content: 'Failed to send',
        type: 'user',
        timestamp: new Date(),
        status: 'failed',
        error: 'Network error',
      };

      mockUseOptimistic.mockReturnValue([[...mockMessages, failedMessage], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[...mockMessages, failedMessage]}
          onRetry={vi.fn()}
        />
      );

      // Should show error icon
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
      
      // Should show retry button
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      
      // Should show error message
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should show success state for sent messages', () => {
      const successMessage: OptimisticMessage = {
        id: '3',
        content: 'Successfully sent',
        type: 'user',
        timestamp: new Date(),
        status: 'sent',
      };

      mockUseOptimistic.mockReturnValue([[successMessage], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[successMessage]}
          onRetry={vi.fn()}
        />
      );

      // Should show success icon (only for this test message)
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
  });

  describe('useOptimistic Integration', () => {
    it('should call useOptimistic with correct parameters', () => {
      const mockAddOptimistic = vi.fn();
      mockUseOptimistic.mockReturnValue([mockMessages, mockAddOptimistic]);

      render(
        <OptimisticMessageList
          messages={mockMessages}
          onRetry={vi.fn()}
        />
      );

      expect(mockUseOptimistic).toHaveBeenCalledWith(
        mockMessages,
        expect.any(Function)
      );
    });

    it('should handle optimistic updates correctly', () => {
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockImplementation((initialState) => {
        return [initialState, mockAddOptimistic];
      });

      render(
        <OptimisticMessageList
          messages={mockMessages}
          onRetry={vi.fn()}
        />
      );

      // The reducer function should be passed to useOptimistic
      expect(mockUseOptimistic).toHaveBeenCalledWith(
        mockMessages,
        expect.any(Function)
      );
    });
  });

  describe('Retry Functionality', () => {
    it('should call onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnRetry = vi.fn();
      
      const failedMessage: OptimisticMessage = {
        id: 'failed-1',
        content: 'Failed message',
        type: 'user',
        timestamp: new Date(),
        status: 'failed',
        error: 'Network error',
      };

      mockUseOptimistic.mockReturnValue([[failedMessage], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[failedMessage]}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledWith(failedMessage);
    });

    it('should disable retry button when retrying', () => {
      const failedMessage: OptimisticMessage = {
        id: 'failed-1',
        content: 'Failed message',
        type: 'user',
        timestamp: new Date(),
        status: 'failed',
        error: 'Network error',
        retrying: true,
      };

      mockUseOptimistic.mockReturnValue([[failedMessage], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[failedMessage]}
          onRetry={vi.fn()}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeDisabled();
    });
  });

  describe('Message Order Consistency', () => {
    it('should maintain message order with optimistic updates', () => {
      const orderedMessages: OptimisticMessage[] = [
        {
          id: '1',
          content: 'First message',
          type: 'user',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          status: 'sent',
        },
        {
          id: 'temp-2',
          content: 'Optimistic message',
          type: 'user',
          timestamp: new Date('2024-01-01T10:01:00Z'),
          status: 'pending',
          tempId: 'temp-2',
        },
        {
          id: '3',
          content: 'Third message',
          type: 'ai',
          timestamp: new Date('2024-01-01T10:02:00Z'),
          status: 'sent',
        },
      ];

      mockUseOptimistic.mockReturnValue([orderedMessages, vi.fn()]);

      render(
        <OptimisticMessageList
          messages={orderedMessages}
          onRetry={vi.fn()}
        />
      );

      const messageElements = screen.getAllByRole('article');
      expect(messageElements).toHaveLength(3);
      
      // Check order is maintained
      expect(messageElements[0]).toHaveTextContent('First message');
      expect(messageElements[1]).toHaveTextContent('Optimistic message');
      expect(messageElements[2]).toHaveTextContent('Third message');
    });
  });

  describe('Performance', () => {
    it('should handle large number of messages efficiently', () => {
      const manyMessages: OptimisticMessage[] = Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        content: `Message ${i}`,
        type: i % 2 === 0 ? 'user' as const : 'ai' as const,
        timestamp: new Date(),
        status: 'sent' as const,
      }));

      mockUseOptimistic.mockReturnValue([manyMessages, vi.fn()]);

      const { container } = render(
        <OptimisticMessageList
          messages={manyMessages}
          onRetry={vi.fn()}
        />
      );

      // All messages should be rendered
      expect(container.querySelectorAll('[role="article"]')).toHaveLength(100);
    });

    it('should not cause memory leaks with rapid updates', async () => {
      const initialMessages: OptimisticMessage[] = [];
      let currentMessages = initialMessages;
      
      const mockAddOptimistic = vi.fn();
      mockUseOptimistic.mockImplementation(() => [currentMessages, mockAddOptimistic]);

      const { rerender } = render(
        <OptimisticMessageList
          messages={currentMessages}
          onRetry={vi.fn()}
        />
      );

      // Simulate rapid message updates
      for (let i = 0; i < 50; i++) {
        currentMessages = [
          ...currentMessages,
          {
            id: `msg-${i}`,
            content: `Message ${i}`,
            type: 'user',
            timestamp: new Date(),
            status: 'pending',
            tempId: `temp-${i}`,
          },
        ];

        rerender(
          <OptimisticMessageList
            messages={currentMessages}
            onRetry={vi.fn()}
          />
        );
      }

      // Should handle rapid updates without issues
      expect(screen.getAllByRole('article')).toHaveLength(50);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for screen readers', () => {
      const accessibleMessage: OptimisticMessage = {
        id: '1',
        content: 'Accessible message',
        type: 'user',
        timestamp: new Date(),
        status: 'pending',
      };

      mockUseOptimistic.mockReturnValue([[accessibleMessage], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[accessibleMessage]}
          onRetry={vi.fn()}
        />
      );

      // Message should have proper role
      const messageElement = screen.getByRole('article');
      expect(messageElement).toHaveAttribute('aria-label', expect.stringContaining('User message'));
      
      // Should have proper data attribute for status
      expect(messageElement).toHaveAttribute('data-message-status', 'pending');
    });

    it('should announce status changes to screen readers', () => {
      const statusMessage: OptimisticMessage = {
        id: '1',
        content: 'Status message',
        type: 'user',
        timestamp: new Date(),
        status: 'failed',
        error: 'Failed to send',
      };

      mockUseOptimistic.mockReturnValue([[statusMessage], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[statusMessage]}
          onRetry={vi.fn()}
        />
      );

      // Should have status region for screen readers
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Failed to send');
    });

    it('should support keyboard navigation for retry buttons', async () => {
      const user = userEvent.setup();
      const mockOnRetry = vi.fn();
      
      const failedMessage: OptimisticMessage = {
        id: '1',
        content: 'Failed message',
        type: 'user',
        timestamp: new Date(),
        status: 'failed',
        error: 'Network error',
      };

      mockUseOptimistic.mockReturnValue([[failedMessage], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[failedMessage]}
          onRetry={mockOnRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      // Should be focusable
      retryButton.focus();
      expect(retryButton).toHaveFocus();
      
      // Should work with Enter key
      await user.keyboard('{Enter}');
      expect(mockOnRetry).toHaveBeenCalledWith(failedMessage);
      
      // Should work with Space key
      await user.keyboard(' ');
      expect(mockOnRetry).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages with undefined content gracefully', () => {
      const invalidMessage: OptimisticMessage = {
        id: '1',
        content: '',
        type: 'user',
        timestamp: new Date(),
        status: 'sent',
      } as OptimisticMessage;

      mockUseOptimistic.mockReturnValue([[invalidMessage], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[invalidMessage]}
          onRetry={vi.fn()}
        />
      );

      // Should not crash and show placeholder
      expect(screen.getByText(/message content unavailable/i)).toBeInTheDocument();
    });

    it('should handle concurrent optimistic updates', () => {
      const message1: OptimisticMessage = {
        id: 'temp-1',
        content: 'First optimistic',
        type: 'user',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        status: 'pending',
        tempId: 'temp-1',
      };

      const message2: OptimisticMessage = {
        id: 'temp-2',
        content: 'Second optimistic',
        type: 'user',
        timestamp: new Date('2024-01-01T10:00:01Z'),
        status: 'pending',
        tempId: 'temp-2',
      };

      mockUseOptimistic.mockReturnValue([[message1, message2], vi.fn()]);

      render(
        <OptimisticMessageList
          messages={[message1, message2]}
          onRetry={vi.fn()}
        />
      );

      // Both messages should be shown with pending state
      expect(screen.getByText('First optimistic')).toBeInTheDocument();
      expect(screen.getByText('Second optimistic')).toBeInTheDocument();
      expect(screen.getAllByTestId('spinner-icon')).toHaveLength(2);
    });
  });
});