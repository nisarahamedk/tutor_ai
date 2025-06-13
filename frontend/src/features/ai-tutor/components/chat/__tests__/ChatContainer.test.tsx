import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatContainer } from '../ChatContainer';

// Mock framer-motion to avoid test issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('ChatContainer', () => {
  const defaultProps = {
    children: <div data-testid="chat-content">Chat content</div>,
  };

  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      render(<ChatContainer {...defaultProps} />);
      
      expect(screen.getByTestId('chat-content')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      render(
        <ChatContainer {...defaultProps} className="custom-chat-class">
          <div data-testid="content">Content</div>
        </ChatContainer>
      );
      
      const container = screen.getByTestId('content').closest('.custom-chat-class');
      expect(container).toBeInTheDocument();
    });

    it('should have proper container structure', () => {
      render(<ChatContainer {...defaultProps} />);
      
      // Should have main container
      const container = screen.getByRole('main');
      expect(container).toBeInTheDocument();
      
      // Should have header
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Header Content', () => {
    it('should display AI Tutor title', () => {
      render(<ChatContainer {...defaultProps} />);
      
      expect(screen.getByText('AI Tutor')).toBeInTheDocument();
    });

    it('should display Brain icon', () => {
      render(<ChatContainer {...defaultProps} />);
      
      // Brain icon should be present
      const brainIcon = screen.getByTestId('brain-icon');
      expect(brainIcon).toBeInTheDocument();
    });

    it('should show typing indicator when isTyping is true', () => {
      render(<ChatContainer {...defaultProps} isTyping={true} />);
      
      expect(screen.getByText(/is typing/i)).toBeInTheDocument();
      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    });

    it('should not show typing indicator when isTyping is false', () => {
      render(<ChatContainer {...defaultProps} isTyping={false} />);
      
      expect(screen.queryByText(/is typing/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
    });

    it('should show online status by default', () => {
      render(<ChatContainer {...defaultProps} />);
      
      expect(screen.getByText(/online/i)).toBeInTheDocument();
      expect(screen.getByTestId('status-indicator')).toHaveClass('bg-green-500');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Something went wrong';
      render(<ChatContainer {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should show dismiss button when error is present', () => {
      const onErrorDismiss = vi.fn();
      render(
        <ChatContainer 
          {...defaultProps} 
          error="Test error" 
          onErrorDismiss={onErrorDismiss} 
        />
      );
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it('should call onErrorDismiss when dismiss button is clicked', () => {
      const onErrorDismiss = vi.fn();
      render(
        <ChatContainer 
          {...defaultProps} 
          error="Test error" 
          onErrorDismiss={onErrorDismiss} 
        />
      );
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);
      
      expect(onErrorDismiss).toHaveBeenCalledTimes(1);
    });

    it('should not display error UI when error is null', () => {
      render(<ChatContainer {...defaultProps} error={null} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should not display error UI when error is undefined', () => {
      render(<ChatContainer {...defaultProps} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should have proper flex layout', () => {
      render(<ChatContainer {...defaultProps} />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex', 'flex-col', 'h-full');
    });

    it('should have header at the top', () => {
      render(<ChatContainer {...defaultProps} />);
      
      const header = screen.getByRole('banner');
      const main = screen.getByRole('main');
      
      expect(header).toBeInTheDocument();
      expect(main.firstChild).toBe(header);
    });

    it('should have content area below header', () => {
      render(<ChatContainer {...defaultProps} />);
      
      const main = screen.getByRole('main');
      const contentArea = screen.getByTestId('chat-content').parentElement;
      
      expect(contentArea).toHaveClass('flex-1');
      expect(main).toContainElement(contentArea);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ChatContainer {...defaultProps} />);
      
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Chat interface');
      expect(screen.getByRole('banner')).toHaveAttribute('aria-label', 'Chat header');
    });

    it('should have proper heading hierarchy', () => {
      render(<ChatContainer {...defaultProps} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('AI Tutor');
    });

    it('should have keyboard navigation support', () => {
      const onErrorDismiss = vi.fn();
      render(
        <ChatContainer 
          {...defaultProps} 
          error="Test error" 
          onErrorDismiss={onErrorDismiss} 
        />
      );
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      
      // Should be focusable
      dismissButton.focus();
      expect(document.activeElement).toBe(dismissButton);
      
      // Should respond to Enter key
      fireEvent.keyDown(dismissButton, { key: 'Enter' });
      expect(onErrorDismiss).toHaveBeenCalled();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes', () => {
      render(<ChatContainer {...defaultProps} />);
      
      const main = screen.getByRole('main');
      expect(main).toHaveClass('max-w-4xl', 'mx-auto', 'w-full');
    });

    it('should have mobile-friendly spacing', () => {
      render(<ChatContainer {...defaultProps} />);
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('p-4', 'sm:p-6');
    });
  });

  describe('Animation States', () => {
    it('should have slide-in animation for error messages', () => {
      render(<ChatContainer {...defaultProps} error="Test error" />);
      
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert.parentElement).toHaveAttribute('data-animate', 'slide-down');
    });

    it('should have fade-in animation for typing indicator', () => {
      render(<ChatContainer {...defaultProps} isTyping={true} />);
      
      const typingIndicator = screen.getByTestId('typing-indicator');
      expect(typingIndicator).toHaveAttribute('data-animate', 'fade-in');
    });
  });
});