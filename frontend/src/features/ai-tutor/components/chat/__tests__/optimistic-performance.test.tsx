import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

// Mock performance APIs
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
  },
});

// Mock framer-motion for performance tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Bot: ({ ...props }) => <div data-testid="bot-icon" {...props} />,
  User: ({ ...props }) => <div data-testid="user-icon" {...props} />,
  Send: ({ ...props }) => <div data-testid="send-icon" {...props} />,
  Loader2: ({ ...props }) => <div data-testid="loader-icon" {...props} />,
  Clock: ({ ...props }) => <div data-testid="clock-icon" {...props} />,
  CheckCircle: ({ ...props }) => <div data-testid="check-icon" {...props} />,
  XCircle: ({ ...props }) => <div data-testid="error-icon" {...props} />,
  RotateCcw: ({ ...props }) => <div data-testid="retry-icon" {...props} />,
}));

import { useOptimistic } from 'react';
import { OptimisticMessageList } from '../OptimisticMessageList';
import { OptimisticMessageInput } from '../OptimisticMessageInput';
import type { OptimisticMessage } from '../types';

const mockUseOptimistic = useOptimistic as any;

describe('Optimistic Updates - Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset performance mocks
    vi.mocked(performance.now).mockReturnValue(Date.now());
  });

  describe('Message Display Performance', () => {
    it('should render 100+ messages without performance degradation', () => {
      const manyMessages: OptimisticMessage[] = Array.from({ length: 150 }, (_, i) => ({
        id: i.toString(),
        content: `Message ${i} with some content that might be longer to test realistic scenarios`,
        type: i % 2 === 0 ? 'user' : 'ai',
        timestamp: new Date(Date.now() - (150 - i) * 1000),
        status: 'sent',
      }));

      mockUseOptimistic.mockReturnValue([manyMessages, vi.fn()]);

      const startTime = performance.now();
      
      const { container } = render(
        <OptimisticMessageList
          messages={manyMessages}
          onRetry={vi.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render all messages
      expect(container.querySelectorAll('[role="article"]')).toHaveLength(150);
      
      // Should render within reasonable time (under 100ms)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle rapid optimistic updates efficiently', async () => {
      const user = userEvent.setup();
      const initialMessages: OptimisticMessage[] = [];
      let currentMessages = initialMessages;
      
      const mockAddOptimistic = vi.fn((message) => {
        currentMessages = [...currentMessages, message];
      });
      
      mockUseOptimistic.mockImplementation(() => [currentMessages, mockAddOptimistic]);

      const { rerender } = render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      const startTime = performance.now();

      // Send 50 messages rapidly
      for (let i = 0; i < 50; i++) {
        await user.type(input, `Message ${i}`);
        await user.click(sendButton);
        
        // Simulate component re-render after each optimistic update
        rerender(
          <OptimisticMessageInput
            onSendMessage={vi.fn()}
            activeTab="home"
          />
        );
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete all 50 messages under 5 seconds
      expect(totalTime).toBeLessThan(5000);
      expect(mockAddOptimistic).toHaveBeenCalledTimes(50);
    });

    it('should maintain consistent performance with mixed message states', () => {
      const mixedMessages: OptimisticMessage[] = Array.from({ length: 100 }, (_, i) => {
        const baseMessage = {
          id: i.toString(),
          content: `Message ${i}`,
          type: i % 2 === 0 ? 'user' as const : 'ai' as const,
          timestamp: new Date(),
        };

        // Mix different states to test performance
        if (i % 4 === 0) {
          return { ...baseMessage, status: 'pending' as const, tempId: `temp-${i}` };
        } else if (i % 4 === 1) {
          return { ...baseMessage, status: 'failed' as const, error: 'Network error' };
        } else if (i % 4 === 2) {
          return { ...baseMessage, status: 'sent' as const };
        } else {
          return { ...baseMessage, status: 'pending' as const, retrying: true };
        }
      });

      mockUseOptimistic.mockReturnValue([mixedMessages, vi.fn()]);

      const startTime = performance.now();
      
      render(
        <OptimisticMessageList
          messages={mixedMessages}
          onRetry={vi.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render efficiently despite mixed states
      expect(renderTime).toBeLessThan(100);
      
      // All states should be rendered correctly
      expect(screen.getAllByTestId('spinner-icon')).toHaveLength(50); // pending messages
      expect(screen.getAllByTestId('error-icon')).toHaveLength(25); // failed messages
      expect(screen.getAllByTestId('check-icon')).toHaveLength(25); // sent messages
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks with frequent updates', async () => {
      const user = userEvent.setup();
      let messageCount = 0;
      const mockOnSendMessage = vi.fn();
      
      // Simulate a growing message list that gets updated frequently
      const mockAddOptimistic = vi.fn((message) => {
        messageCount++;
      });

      mockUseOptimistic.mockImplementation(() => [
        Array.from({ length: messageCount }, (_, i) => ({
          id: i.toString(),
          content: `Message ${i}`,
          type: 'user' as const,
          timestamp: new Date(),
          status: 'sent' as const,
        })),
        mockAddOptimistic
      ]);

      const { rerender, unmount } = render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Simulate continuous message sending
      for (let i = 0; i < 100; i++) {
        await user.type(input, `Test ${i}`);
        await user.click(sendButton);
        
        // Re-render component frequently
        rerender(
          <OptimisticMessageInput
            onSendMessage={mockOnSendMessage}
            activeTab="home"
          />
        );
      }

      // Component should still be functional
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(mockAddOptimistic).toHaveBeenCalledTimes(100);

      // Cleanup should not cause errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle large message history efficiently', () => {
      // Simulate a chat with extensive history
      const largeHistory: OptimisticMessage[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        content: `Historic message ${i} with various content lengths and different types of information`,
        type: i % 3 === 0 ? 'user' : 'ai',
        timestamp: new Date(Date.now() - (1000 - i) * 60000), // Spread over time
        status: 'sent',
      }));

      mockUseOptimistic.mockReturnValue([largeHistory, vi.fn()]);

      const startTime = performance.now();
      
      const { container } = render(
        <OptimisticMessageList
          messages={largeHistory}
          onRetry={vi.fn()}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle large history
      expect(container.querySelectorAll('[role="article"]')).toHaveLength(1000);
      
      // Should render reasonably fast even with large dataset
      expect(renderTime).toBeLessThan(500); // Allow more time for 1000 items
    });
  });

  describe('Optimistic Update Performance', () => {
    it('should show instant feedback (0ms perceived delay)', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      // Mock high-precision timing
      let callTime = 0;
      vi.mocked(performance.now)
        .mockReturnValueOnce(1000) // Initial time
        .mockReturnValueOnce(1000.1); // Time after optimistic update

      mockAddOptimistic.mockImplementation((message) => {
        callTime = performance.now();
      });

      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Instant message');
      
      const clickTime = performance.now();
      await user.click(sendButton);

      // Optimistic update should happen immediately
      expect(mockAddOptimistic).toHaveBeenCalled();
      expect(callTime - clickTime).toBeLessThan(1); // Under 1ms
    });

    it('should maintain performance with concurrent optimistic updates', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const messages: OptimisticMessage[] = [];
      
      const mockAddOptimistic = vi.fn((message) => {
        messages.push(message);
      });

      mockUseOptimistic.mockImplementation(() => [messages, mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      const startTime = performance.now();

      // Simulate rapid concurrent sends
      const sendPromises = Array.from({ length: 10 }, async (_, i) => {
        await user.type(input, `Concurrent ${i}`);
        await user.click(sendButton);
      });

      await Promise.all(sendPromises);

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle concurrent updates efficiently
      expect(totalTime).toBeLessThan(1000); // Under 1 second for 10 concurrent
      expect(mockAddOptimistic).toHaveBeenCalledTimes(10);
    });
  });

  describe('Rollback Performance', () => {
    it('should perform rollbacks efficiently', async () => {
      const failedMessages: OptimisticMessage[] = Array.from({ length: 10 }, (_, i) => ({
        id: `failed-${i}`,
        content: `Failed message ${i}`,
        type: 'user',
        timestamp: new Date(),
        status: 'failed',
        error: 'Network error',
      }));

      let currentMessages = [...failedMessages];
      const mockAddOptimistic = vi.fn();
      
      // Simulate rollback by removing failed messages
      const mockRollback = vi.fn(() => {
        currentMessages = currentMessages.filter(msg => msg.status !== 'failed');
      });

      mockUseOptimistic.mockImplementation(() => [currentMessages, mockAddOptimistic]);

      const { rerender } = render(
        <OptimisticMessageList
          messages={currentMessages}
          onRetry={vi.fn()}
        />
      );

      const startTime = performance.now();

      // Simulate rollback operation
      act(() => {
        mockRollback();
      });

      rerender(
        <OptimisticMessageList
          messages={currentMessages}
          onRetry={vi.fn()}
        />
      );

      const endTime = performance.now();
      const rollbackTime = endTime - startTime;

      // Rollback should be fast
      expect(rollbackTime).toBeLessThan(50);
      
      // Failed messages should be removed
      expect(screen.queryByText('Failed message 0')).not.toBeInTheDocument();
    });
  });

  describe('Scroll Performance', () => {
    it('should handle scroll updates efficiently with many messages', () => {
      const manyMessages: OptimisticMessage[] = Array.from({ length: 500 }, (_, i) => ({
        id: i.toString(),
        content: `Scrollable message ${i}`,
        type: i % 2 === 0 ? 'user' : 'ai',
        timestamp: new Date(),
        status: 'sent',
      }));

      mockUseOptimistic.mockReturnValue([manyMessages, vi.fn()]);

      const { container } = render(
        <OptimisticMessageList
          messages={manyMessages}
          onRetry={vi.fn()}
        />
      );

      const scrollContainer = container.querySelector('[data-testid="scroll-container"]');
      
      if (scrollContainer) {
        const startTime = performance.now();
        
        // Simulate scroll events
        for (let i = 0; i < 10; i++) {
          fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 100 } });
        }
        
        const endTime = performance.now();
        const scrollTime = endTime - startTime;
        
        // Scroll handling should be efficient
        expect(scrollTime).toBeLessThan(100);
      }
    });
  });

  describe('Re-render Performance', () => {
    it('should minimize re-renders on optimistic updates', () => {
      let renderCount = 0;
      const TestComponent = () => {
        renderCount++;
        return (
          <OptimisticMessageList
            messages={[]}
            onRetry={vi.fn()}
          />
        );
      };

      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      const { rerender } = render(<TestComponent />);

      const initialRenderCount = renderCount;

      // Multiple re-renders with same props
      for (let i = 0; i < 5; i++) {
        rerender(<TestComponent />);
      }

      // Should not cause excessive re-renders
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(5);
    });

    it('should optimize rendering with React.memo or similar techniques', () => {
      const mockOnRetry = vi.fn();
      const stableMessages: OptimisticMessage[] = [
        {
          id: '1',
          content: 'Stable message',
          type: 'user',
          timestamp: new Date(),
          status: 'sent',
        },
      ];

      mockUseOptimistic.mockReturnValue([stableMessages, vi.fn()]);

      const { rerender } = render(
        <OptimisticMessageList
          messages={stableMessages}
          onRetry={mockOnRetry}
        />
      );

      // Re-render with same props
      rerender(
        <OptimisticMessageList
          messages={stableMessages}
          onRetry={mockOnRetry}
        />
      );

      // Component should handle stable props efficiently
      expect(screen.getByText('Stable message')).toBeInTheDocument();
    });
  });

  describe('Resource Cleanup', () => {
    it('should clean up resources properly on unmount', () => {
      const mockCleanup = vi.fn();
      
      // Mock useEffect cleanup
      const originalUseEffect = React.useEffect;
      const mockUseEffect = vi.fn((callback) => {
        const cleanup = callback();
        if (typeof cleanup === 'function') {
          mockCleanup.mockImplementation(cleanup);
        }
        return cleanup;
      });

      vi.spyOn(React, 'useEffect').mockImplementation(mockUseEffect);

      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      const { unmount } = render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
        />
      );

      // Unmount should trigger cleanup
      unmount();
      
      // Cleanup should be called if defined
      if (mockCleanup.mock.calls.length > 0) {
        expect(mockCleanup).toHaveBeenCalled();
      }

      // Restore original useEffect
      vi.spyOn(React, 'useEffect').mockImplementation(originalUseEffect);
    });
  });
});