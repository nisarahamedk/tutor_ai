import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => <button {...props}>{children}</button>,
}));

const MockInput = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(({ ...props }, ref) => <input ref={ref} {...props} />);
MockInput.displayName = 'MockInput';

vi.mock('@/components/ui/input', () => ({
  Input: MockInput,
}));

vi.mock('@/lib/utils', () => ({
  cn: (...args: (string | undefined | null | boolean)[]) => args.filter(Boolean).join(' '),
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Send: ({ ...props }) => <div data-testid="send-icon" {...props} />,
  Loader2: ({ ...props }) => <div data-testid="loader-icon" {...props} />,
  AlertCircle: ({ ...props }) => <div data-testid="alert-icon" {...props} />,
}));

import { useOptimistic } from 'react';
import { OptimisticMessageInput } from '../OptimisticMessageInput';

const mockUseOptimistic = useOptimistic as unknown as ReturnType<typeof vi.fn>;

describe('OptimisticMessageInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render input field and send button', () => {
      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
        />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should accept user input', async () => {
      const user = userEvent.setup();
      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello world');

      expect(input).toHaveValue('Hello world');
    });

    it('should have correct placeholder text', () => {
      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
          placeholder="Type your message..."
        />
      );

      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });
  });

  describe('Instant Feedback', () => {
    it('should show optimistic message immediately on send', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello world');
      await user.click(sendButton);

      // Should add optimistic message immediately
      expect(mockAddOptimistic).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Hello world',
          type: 'user',
          status: 'pending',
          tempId: expect.any(String),
        })
      );

      // Should call onSendMessage callback
      expect(mockOnSendMessage).toHaveBeenCalledWith(
        'Hello world',
        expect.objectContaining({
          content: 'Hello world',
          type: 'user',
          status: 'pending',
          tempId: expect.any(String),
        })
      );
    });

    it('should clear input immediately after send', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello world');
      expect(input).toHaveValue('Hello world');

      await user.click(sendButton);

      // Input should be cleared immediately
      expect(input).toHaveValue('');
    });

    it('should show zero perceived delay (0ms) for message appearance', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
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
      await user.click(sendButton);

      // Should add optimistic message immediately
      expect(mockAddOptimistic).toHaveBeenCalled();
      // The optimistic update should happen synchronously in the same tick
      expect(mockAddOptimistic).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Instant message',
          type: 'user',
          status: 'pending',
        })
      );
    });
  });

  describe('Form Validation', () => {
    it('should disable send button when input is empty', () => {
      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
        />
      );

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has content', async () => {
      const user = userEvent.setup();
      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello');
      expect(sendButton).not.toBeDisabled();
    });

    it('should not send empty or whitespace-only messages', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Try to send whitespace-only message
      await user.type(input, '   ');
      expect(sendButton).toBeDisabled();

      // Try to send empty message
      await user.clear(input);
      await user.click(sendButton);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
      expect(mockAddOptimistic).not.toHaveBeenCalled();
    });

    it('should enforce maximum message length', async () => {
      const user = userEvent.setup();
      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
          maxLength={10}
        />
      );

      const input = screen.getByRole('textbox');

      // Try to type more than max length
      await user.type(input, 'This is a very long message that exceeds the limit');

      // Should be truncated to max length
      expect(input).toHaveValue('This is a ');
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should send message on Enter key', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello world');
      await user.keyboard('{Enter}');

      expect(mockOnSendMessage).toHaveBeenCalledWith(
        'Hello world',
        expect.any(Object)
      );
    });

    it('should not send message on Shift+Enter', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello world');
      // Use keyDown and keyUp to properly simulate Shift+Enter
      await user.keyboard('[ShiftLeft>][Enter][/ShiftLeft]');

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should support multiline input with Shift+Enter', async () => {
      const user = userEvent.setup();
      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
          multiline
        />
      );

      const input = screen.getByRole('textbox');

      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      expect(input).toHaveValue('Line 1\nLine 2');
    });
  });

  describe('Error Handling', () => {
    it('should show error message when send fails', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello world');
      await user.click(sendButton);

      await waitFor(() => {
        // Check for the specific error message in the main error display
        const errorDisplay = screen.getByRole('alert');
        expect(errorDisplay).toHaveTextContent('Network error');
      });
    });

    it('should clear error message on successful send', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      const { rerender } = render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
          error="Previous error"
        />
      );

      expect(screen.getByText('Previous error')).toBeInTheDocument();

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello world');
      await user.click(sendButton);

      // Simulate successful send
      rerender(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
          error={null}
        />
      );

      expect(screen.queryByText('Previous error')).not.toBeInTheDocument();
    });
  });

  describe('Rapid Message Sending', () => {
    it('should handle rapid message sending correctly', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Send multiple messages rapidly
      for (let i = 0; i < 5; i++) {
        await user.type(input, `Message ${i}`);
        await user.click(sendButton);
        
        // Input should be cleared after each send
        expect(input).toHaveValue('');
      }

      expect(mockOnSendMessage).toHaveBeenCalledTimes(5);
      expect(mockAddOptimistic).toHaveBeenCalledTimes(5);
    });

    it('should prevent double-sends from rapid clicking', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello world');
      
      // Rapid clicks
      await user.click(sendButton);
      await user.click(sendButton);
      await user.click(sendButton);

      // Should only send once
      expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading States', () => {
    it('should show loading state while sending', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello world');
      await user.click(sendButton);

      // Should show loading icon
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('send-icon')).not.toBeInTheDocument();
      
      // Input should be disabled during send
      expect(input).toBeDisabled();
    });

    it('should restore normal state after send completes', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello world');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('send-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      expect(input).toHaveAttribute('aria-label', 'Type your message');
      expect(sendButton).toHaveAttribute('aria-label', expect.stringContaining('Send message'));
    });

    it('should announce error messages to screen readers', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn().mockRejectedValue(new Error('Network error'));
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello world');
      await user.click(sendButton);

      await waitFor(() => {
        const errorRegion = screen.getByRole('alert');
        expect(errorRegion).toBeInTheDocument();
        expect(errorRegion).toHaveTextContent('Network error');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      mockUseOptimistic.mockReturnValue([[], vi.fn()]);

      render(
        <OptimisticMessageInput
          onSendMessage={vi.fn()}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // Should be able to tab between elements
      await user.tab();
      expect(input).toHaveFocus();

      // Need to add content to enable the send button
      await user.type(input, 'test');
      
      await user.tab();
      expect(sendButton).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should not cause excessive re-renders', () => {
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      const { rerender } = render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      // Multiple re-renders should not cause issues
      for (let i = 0; i < 10; i++) {
        rerender(
          <OptimisticMessageInput
            onSendMessage={mockOnSendMessage}
            activeTab="home"
          />
        );
      }

      // Component should still be functional
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should handle 50+ rapid messages under 5 seconds', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
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
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete under 5 seconds (5000ms)
      expect(duration).toBeLessThan(5000);
      expect(mockOnSendMessage).toHaveBeenCalledTimes(50);
    });
  });

  describe('Integration with useOptimistic', () => {
    it('should use optimistic updates correctly', async () => {
      const user = userEvent.setup();
      const mockOnSendMessage = vi.fn();
      const mockAddOptimistic = vi.fn();
      
      mockUseOptimistic.mockReturnValue([[], mockAddOptimistic]);

      render(
        <OptimisticMessageInput
          onSendMessage={mockOnSendMessage}
          activeTab="home"
        />
      );

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test message');
      await user.click(sendButton);

      // Should add optimistic message with pending status
      expect(mockAddOptimistic).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Test message',
          type: 'user',
          status: 'pending',
          tempId: expect.any(String),
          timestamp: expect.any(Date),
        })
      );

      // Should generate unique tempId
      const tempId = mockAddOptimistic.mock.calls[0][0].tempId;
      expect(tempId).toMatch(/^temp-/);
    });
  });
});