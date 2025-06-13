import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../MessageInput';
import type { QuickAction } from '../types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Send: ({ ...props }) => <div data-testid="send-icon" {...props} />,
  Loader2: ({ ...props }) => <div data-testid="loader-icon" {...props} />,
  Zap: ({ ...props }) => <div data-testid="zap-icon" {...props} />,
  BookOpen: ({ ...props }) => <div data-testid="book-icon" {...props} />,
  Target: ({ ...props }) => <div data-testid="target-icon" {...props} />,
}));

describe('MessageInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onSend: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render input field with placeholder', () => {
      render(<MessageInput {...defaultProps} placeholder="Type your message..." />);
      
      const input = screen.getByPlaceholderText('Type your message...');
      expect(input).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(<MessageInput {...defaultProps} />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeInTheDocument();
      expect(screen.getByTestId('send-icon')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      render(<MessageInput {...defaultProps} className="custom-input-class" />);
      
      const container = screen.getByRole('form');
      expect(container).toHaveClass('custom-input-class');
    });

    it('should have default placeholder when none provided', () => {
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByPlaceholderText(/ask me anything/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<MessageInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello');
      
      expect(onChange).toHaveBeenCalledWith('H');
      expect(onChange).toHaveBeenCalledWith('e');
      expect(onChange).toHaveBeenCalledWith('l');
      expect(onChange).toHaveBeenCalledWith('l');
      expect(onChange).toHaveBeenCalledWith('o');
    });

    it('should display current value', () => {
      render(<MessageInput {...defaultProps} value="Current message" />);
      
      const input = screen.getByDisplayValue('Current message');
      expect(input).toBeInTheDocument();
    });

    it('should respect maxLength when provided', () => {
      render(<MessageInput {...defaultProps} maxLength={50} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('maxLength', '50');
    });

    it('should show character count when maxLength is set', () => {
      render(<MessageInput {...defaultProps} value="Hello" maxLength={50} />);
      
      expect(screen.getByText('5/50')).toBeInTheDocument();
    });

    it('should warn when approaching character limit', () => {
      render(<MessageInput {...defaultProps} value="This is a long message" maxLength={25} />);
      
      const charCount = screen.getByText('23/25');
      expect(charCount).toHaveClass('text-orange-500');
    });

    it('should show error when character limit exceeded', () => {
      render(<MessageInput {...defaultProps} value="This message is too long" maxLength={20} />);
      
      const charCount = screen.getByText('25/20');
      expect(charCount).toHaveClass('text-red-500');
    });
  });

  describe('Send Functionality', () => {
    it('should call onSend when send button is clicked', () => {
      const onSend = vi.fn();
      render(<MessageInput {...defaultProps} onSend={onSend} />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);
      
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('should call onSend when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      
      render(<MessageInput {...defaultProps} onSend={onSend} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      await user.keyboard('{Enter}');
      
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('should not send when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      const onSend = vi.fn();
      
      render(<MessageInput {...defaultProps} onSend={onSend} />);
      
      const input = screen.getByRole('textbox');
      input.focus();
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      
      expect(onSend).not.toHaveBeenCalled();
    });

    it('should not send when input is empty', () => {
      const onSend = vi.fn();
      render(<MessageInput {...defaultProps} value="" onSend={onSend} />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('should not send when input contains only whitespace', () => {
      const onSend = vi.fn();
      render(<MessageInput {...defaultProps} value="   " onSend={onSend} />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has content', () => {
      render(<MessageInput {...defaultProps} value="Hello" />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Loading States', () => {
    it('should disable input when loading', () => {
      render(<MessageInput {...defaultProps} isLoading={true} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should disable send button when loading', () => {
      render(<MessageInput {...defaultProps} isLoading={true} />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('should show loading icon when loading', () => {
      render(<MessageInput {...defaultProps} isLoading={true} />);
      
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('send-icon')).not.toBeInTheDocument();
    });

    it('should disable everything when disabled prop is true', () => {
      render(<MessageInput {...defaultProps} disabled={true} />);
      
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Quick Actions', () => {
    const mockQuickActions: QuickAction[] = [
      {
        icon: () => <div data-testid="zap-icon" />,
        label: 'Quick Start',
        action: vi.fn(),
      },
      {
        icon: () => <div data-testid="book-icon" />,
        label: 'Learn More',
        action: vi.fn(),
        loading: false,
      },
      {
        icon: () => <div data-testid="target-icon" />,
        label: 'Set Goal',
        action: vi.fn(),
        loading: true,
      },
    ];

    it('should render quick action buttons', () => {
      render(<MessageInput {...defaultProps} quickActions={mockQuickActions} />);
      
      expect(screen.getByRole('button', { name: 'Quick Start' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Learn More' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Set Goal' })).toBeInTheDocument();
    });

    it('should call action when quick action button is clicked', () => {
      const action = vi.fn();
      const quickActions = [{ ...mockQuickActions[0], action }];
      
      render(<MessageInput {...defaultProps} quickActions={quickActions} />);
      
      const button = screen.getByRole('button', { name: 'Quick Start' });
      fireEvent.click(button);
      
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should disable quick action button when loading', () => {
      render(<MessageInput {...defaultProps} quickActions={mockQuickActions} />);
      
      const loadingButton = screen.getByRole('button', { name: 'Set Goal' });
      expect(loadingButton).toBeDisabled();
    });

    it('should not render quick actions container when no actions provided', () => {
      render(<MessageInput {...defaultProps} quickActions={[]} />);
      
      expect(screen.queryByTestId('quick-actions')).not.toBeInTheDocument();
    });

    it('should render quick actions in proper order', () => {
      render(<MessageInput {...defaultProps} quickActions={mockQuickActions} />);
      
      const buttons = screen.getAllByRole('button');
      const actionButtons = buttons.filter(btn => 
        btn.getAttribute('aria-label')?.includes('Quick') ||
        btn.getAttribute('aria-label')?.includes('Learn') ||
        btn.getAttribute('aria-label')?.includes('Set')
      );
      
      expect(actionButtons[0]).toHaveAttribute('aria-label', 'Quick Start');
      expect(actionButtons[1]).toHaveAttribute('aria-label', 'Learn More');
      expect(actionButtons[2]).toHaveAttribute('aria-label', 'Set Goal');
    });
  });

  describe('Form Behavior', () => {
    it('should have proper form structure', () => {
      render(<MessageInput {...defaultProps} />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should prevent default form submission', () => {
      const onSend = vi.fn();
      render(<MessageInput {...defaultProps} onSend={onSend} />);
      
      const form = screen.getByRole('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      
      fireEvent(form, submitEvent);
      
      expect(submitEvent.defaultPrevented).toBe(true);
      expect(onSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      expect(input).toHaveAttribute('aria-label', 'Type your message');
      expect(sendButton).toHaveAttribute('aria-label', 'Send message');
    });

    it('should have proper form labeling', () => {
      render(<MessageInput {...defaultProps} />);
      
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('aria-label', 'Send message form');
    });

    it('should indicate when input is required', () => {
      render(<MessageInput {...defaultProps} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MessageInput {...defaultProps} quickActions={[mockQuickActions[0]]} />);
      
      const input = screen.getByRole('textbox');
      const quickActionButton = screen.getByRole('button', { name: 'Quick Start' });
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      // Tab through elements
      await user.tab();
      expect(input).toHaveFocus();
      
      await user.tab();
      expect(quickActionButton).toHaveFocus();
      
      await user.tab();
      expect(sendButton).toHaveFocus();
    });

    it('should announce character count to screen readers', () => {
      render(<MessageInput {...defaultProps} value="Hello" maxLength={50} />);
      
      const charCount = screen.getByText('5/50');
      expect(charCount).toHaveAttribute('aria-live', 'polite');
      expect(charCount).toHaveAttribute('aria-label', '5 out of 50 characters used');
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile-friendly touch targets', () => {
      render(<MessageInput {...defaultProps} />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toHaveClass('h-10', 'w-10'); // Minimum 44px touch target
    });

    it('should stack quick actions on mobile', () => {
      render(<MessageInput {...defaultProps} quickActions={mockQuickActions} />);
      
      const quickActionsContainer = screen.getByTestId('quick-actions');
      expect(quickActionsContainer).toHaveClass('flex-wrap', 'sm:flex-nowrap');
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long input gracefully', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const longText = 'a'.repeat(1000);
      
      render(<MessageInput {...defaultProps} onChange={onChange} maxLength={500} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, longText);
      
      // Should respect maxLength
      expect(input).toHaveAttribute('maxLength', '500');
    });

    it('should handle rapid consecutive sends gracefully', async () => {
      const onSend = vi.fn();
      render(<MessageInput {...defaultProps} value="Test" onSend={onSend} />);
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      // Rapid clicks
      fireEvent.click(sendButton);
      fireEvent.click(sendButton);
      fireEvent.click(sendButton);
      
      expect(onSend).toHaveBeenCalledTimes(3);
    });

    it('should handle special characters correctly', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      
      render(<MessageInput {...defaultProps} onChange={onChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '🚀 Hello! @user #hashtag');
      
      // Should handle emojis and special characters
      expect(onChange).toHaveBeenCalledWith('🚀');
      expect(onChange).toHaveBeenCalledWith('@');
      expect(onChange).toHaveBeenCalledWith('#');
    });
  });
});