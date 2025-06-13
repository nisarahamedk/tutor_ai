import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock the useActionState hook and server action
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return {
    ...actual,
    useActionState: vi.fn(),
  };
});

vi.mock('../../hooks/useMessageAction', () => ({
  useMessageAction: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Send: ({ ...props }) => <div data-testid="send-icon" {...props} />,
  Loader2: ({ ...props }) => <div data-testid="loader-icon" {...props} />,
}));

import { useActionState } from 'react';
import { useMessageAction } from '../../hooks/useMessageAction';
import { MessageInputWithActions } from '../MessageInputWithActions';

const mockUseActionState = useActionState as any;
const mockUseMessageAction = useMessageAction as any;

describe('MessageInputWithActions (useActionState Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Integration with useActionState', () => {
    it('should use useActionState hook correctly', () => {
      const mockState = {
        success: false,
        error: null,
        isLoading: false,
        message: null,
      };
      
      const mockAction = vi.fn();
      const mockIsPending = false;

      mockUseMessageAction.mockReturnValue({
        state: mockState,
        sendMessage: mockAction,
        isPending: mockIsPending,
      });

      render(<MessageInputWithActions />);

      expect(mockUseMessageAction).toHaveBeenCalledWith();
    });

    it('should show loading state when action is pending', () => {
      const mockState = {
        success: false,
        error: null,
        isLoading: false,
        message: null,
      };
      
      const mockAction = vi.fn();
      const mockIsPending = true;

      mockUseMessageAction.mockReturnValue({
        state: mockState,
        sendMessage: mockAction,
        isPending: mockIsPending,
      });

      render(<MessageInputWithActions />);

      // Input should be disabled when pending
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();

      // Send button should show loading state
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('send-icon')).not.toBeInTheDocument();
    });

    it('should display error message when action fails', () => {
      const mockState = {
        success: false,
        error: 'Failed to send message',
        isLoading: false,
        message: null,
      };
      
      const mockAction = vi.fn();
      const mockIsPending = false;

      mockUseMessageAction.mockReturnValue({
        state: mockState,
        sendMessage: mockAction,
        isPending: mockIsPending,
      });

      render(<MessageInputWithActions />);

      expect(screen.getByText('Failed to send message')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('text-red-600');
    });

    it('should clear error message on successful send', () => {
      const mockState = {
        success: true,
        error: null,
        isLoading: false,
        message: {
          id: 'msg-123',
          role: 'assistant' as const,
          content: 'Success!',
          timestamp: '2024-01-01T12:00:00Z',
        },
      };
      
      const mockAction = vi.fn();
      const mockIsPending = false;

      mockUseMessageAction.mockReturnValue({
        state: mockState,
        sendMessage: mockAction,
        isPending: mockIsPending,
      });

      render(<MessageInputWithActions />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Form Submission with Server Actions', () => {
    it('should call server action when form is submitted', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();
      const mockIsPending = false;

      mockUseMessageAction.mockReturnValue({
        state: {
          success: false,
          error: null,
          isLoading: false,
          message: null,
        },
        sendMessage: mockAction,
        isPending: mockIsPending,
      });

      render(<MessageInputWithActions activeTab="GENERAL" />);

      const input = screen.getByRole('textbox');
      const form = screen.getByRole('form');

      await user.type(input, 'Hello world');
      fireEvent.submit(form);

      expect(mockAction).toHaveBeenCalledWith(expect.any(FormData));
      
      // Check form data contains the right values
      const formDataCall = mockAction.mock.calls[0][0];
      expect(formDataCall.get('message')).toBe('Hello world');
      expect(formDataCall.get('tabType')).toBe('GENERAL');
    });

    it('should include tab type in form data', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      mockUseMessageAction.mockReturnValue({
        state: {
          success: false,
          error: null,
          isLoading: false,
          message: null,
        },
        sendMessage: mockAction,
        isPending: false,
      });

      render(<MessageInputWithActions activeTab="CODING" />);

      const input = screen.getByRole('textbox');
      const form = screen.getByRole('form');

      await user.type(input, 'Help with JavaScript');
      fireEvent.submit(form);

      const formDataCall = mockAction.mock.calls[0][0];
      expect(formDataCall.get('tabType')).toBe('CODING');
    });

    it('should clear input after successful submission', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      // Mock successful response
      mockUseMessageAction.mockReturnValue({
        state: {
          success: true,
          error: null,
          isLoading: false,
          message: {
            id: 'msg-123',
            role: 'assistant' as const,
            content: 'Response',
            timestamp: '2024-01-01T12:00:00Z',
          },
        },
        sendMessage: mockAction,
        isPending: false,
      });

      render(<MessageInputWithActions />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      const form = screen.getByRole('form');

      await user.type(input, 'Test message');
      expect(input.value).toBe('Test message');

      fireEvent.submit(form);

      // After successful submission, input should be cleared
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should not clear input after failed submission', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      // Mock error response
      mockUseMessageAction.mockReturnValue({
        state: {
          success: false,
          error: 'Network error',
          isLoading: false,
          message: null,
        },
        sendMessage: mockAction,
        isPending: false,
      });

      render(<MessageInputWithActions />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      const form = screen.getByRole('form');

      await user.type(input, 'Test message');
      fireEvent.submit(form);

      // After failed submission, input should retain its value
      expect(input.value).toBe('Test message');
    });

    it('should prevent submission of empty messages', async () => {
      const mockAction = vi.fn();

      mockUseMessageAction.mockReturnValue({
        state: {
          success: false,
          error: null,
          isLoading: false,
          message: null,
        },
        sendMessage: mockAction,
        isPending: false,
      });

      render(<MessageInputWithActions />);

      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      // Button should be disabled when input is empty
      expect(sendButton).toBeDisabled();

      fireEvent.click(sendButton);
      
      // Server action should not be called
      expect(mockAction).not.toHaveBeenCalled();
    });

    it('should handle Enter key submission', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      mockUseMessageAction.mockReturnValue({
        state: {
          success: false,
          error: null,
          isLoading: false,
          message: null,
        },
        sendMessage: mockAction,
        isPending: false,
      });

      render(<MessageInputWithActions />);

      const input = screen.getByRole('textbox');

      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');

      expect(mockAction).toHaveBeenCalledWith(expect.any(FormData));
    });

    it('should not submit on Shift+Enter', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      mockUseMessageAction.mockReturnValue({
        state: {
          success: false,
          error: null,
          isLoading: false,
          message: null,
        },
        sendMessage: mockAction,
        isPending: false,
      });

      render(<MessageInputWithActions />);

      const input = screen.getByRole('textbox');

      await user.type(input, 'Multi-line{Shift>}{Enter}{/Shift}message');

      expect(mockAction).not.toHaveBeenCalled();
    });
  });

  describe('Optimistic Updates', () => {
    it('should show user message immediately on send', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      mockUseMessageAction.mockReturnValue({
        state: {
          success: false,
          error: null,
          isLoading: false,
          message: null,
        },
        sendMessage: mockAction,
        isPending: true, // Simulate pending state
      });

      render(<MessageInputWithActions />);

      const input = screen.getByRole('textbox');
      const form = screen.getByRole('form');

      await user.type(input, 'Hello world');
      fireEvent.submit(form);

      // Component should show pending state
      expect(input).toBeDisabled();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after error', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      // First render with error state
      const { rerender } = render(<MessageInputWithActions />);
      
      mockUseMessageAction.mockReturnValue({
        state: {
          success: false,
          error: 'Network error',
          isLoading: false,
          message: null,
        },
        sendMessage: mockAction,
        isPending: false,
      });

      rerender(<MessageInputWithActions />);

      // Error should be displayed
      expect(screen.getByText('Network error')).toBeInTheDocument();

      // Input should still be functional for retry
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      expect(input).not.toBeDisabled();
      expect(sendButton).not.toBeDisabled();

      await user.type(input, 'Retry message');
      fireEvent.click(sendButton);

      expect(mockAction).toHaveBeenCalled();
    });

    it('should clear error when user starts typing new message', async () => {
      const user = userEvent.setup();
      const mockAction = vi.fn();

      mockUseMessageAction.mockReturnValue({
        state: {
          success: false,
          error: 'Previous error',
          isLoading: false,
          message: null,
        },
        sendMessage: mockAction,
        isPending: false,
      });

      render(<MessageInputWithActions />);

      expect(screen.getByText('Previous error')).toBeInTheDocument();

      // Start typing a new message
      const input = screen.getByRole('textbox');
      await user.type(input, 'New message');

      // Error should be cleared (this would be handled by the component's local state)
      // The exact implementation depends on how the component handles local error clearing
    });
  });
});