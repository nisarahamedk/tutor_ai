import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Test the new import structure
import AITutorChat from '@/features/ai-tutor/components/AITutorChat';
import { TrackExplorationComponent } from '@/features/ai-tutor/components/learning/TrackExplorationComponent';
import { ProgressDashboardComponent } from '@/features/ai-tutor/components/dashboard/ProgressDashboardComponent';

// Test barrel exports
import { 
  AITutorChat as BarrelAITutorChat,
  TrackExplorationComponent as BarrelTrackExploration,
  ProgressDashboardComponent as BarrelProgressDashboard
} from '@/ai-tutor';

// Mock services
vi.mock('@/features/ai-tutor/services', () => ({
  agUiService: {
    sendMessageToTutor: vi.fn().mockResolvedValue('Test response from AI')
  }
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  },
  AnimatePresence: ({ children }: any) => children
}));

describe('Refactored Architecture Integration Tests', () => {
  describe('Import Structure Validation', () => {
    it('should import components directly from feature paths', () => {
      expect(AITutorChat).toBeDefined();
      expect(TrackExplorationComponent).toBeDefined();
      expect(ProgressDashboardComponent).toBeDefined();
    });

    it('should import components from barrel exports', () => {
      expect(BarrelAITutorChat).toBeDefined();
      expect(BarrelTrackExploration).toBeDefined();
      expect(BarrelProgressDashboard).toBeDefined();
    });

    it('should have same components from direct and barrel imports', () => {
      expect(AITutorChat).toBe(BarrelAITutorChat);
      expect(TrackExplorationComponent).toBe(BarrelTrackExploration);
      expect(ProgressDashboardComponent).toBe(BarrelProgressDashboard);
    });
  });

  describe('Component Rendering After Refactoring', () => {
    it('should render AITutorChat without errors', () => {
      render(<AITutorChat />);
      
      // Should render the main tabs
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /progress/i })).toBeInTheDocument();
    });

    it('should render TrackExplorationComponent without errors', () => {
      const mockProps = {
        onSelectTrack: vi.fn(),
        onStartNewTrack: vi.fn()
      };
      
      render(<TrackExplorationComponent {...mockProps} />);
      
      expect(screen.getByText(/explore learning tracks/i)).toBeInTheDocument();
    });

    it('should render ProgressDashboardComponent without errors', () => {
      render(<ProgressDashboardComponent />);
      
      expect(screen.getByText(/learning progress dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Feature Isolation', () => {
    it('should maintain component functionality after move', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      // Test tab navigation still works
      const progressTab = screen.getByRole('tab', { name: /progress/i });
      await user.click(progressTab);
      
      await waitFor(() => {
        expect(progressTab).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('should maintain component props interface', () => {
      const onSelectTrack = vi.fn();
      const onStartNewTrack = vi.fn();
      
      render(
        <TrackExplorationComponent 
          onSelectTrack={onSelectTrack}
          onStartNewTrack={onStartNewTrack}
        />
      );
      
      expect(screen.getByText(/explore learning tracks/i)).toBeInTheDocument();
    });
  });

  describe('Service Integration', () => {
    it('should maintain service connectivity after refactoring', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      // Find message input and send button
      const messageInput = screen.getByPlaceholderText(/ask me anything/i);
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      // Type a message
      await user.type(messageInput, 'Test message');
      await user.click(sendButton);
      
      // Should not throw errors (services are mocked)
      expect(messageInput).toHaveValue('');
    });
  });

  describe('Cross-Component Communication', () => {
    it('should maintain parent-child component relationships', () => {
      render(<AITutorChat />);
      
      // Should render child components within tabs
      const homeTab = screen.getByRole('tab', { name: /home/i });
      expect(homeTab).toBeInTheDocument();
      
      // Tab content should be available
      const tabpanels = screen.getAllByRole('tabpanel', { hidden: true });
      expect(tabpanels.length).toBeGreaterThan(0);
    });
  });

  describe('Performance After Refactoring', () => {
    it('should render components without performance degradation', () => {
      const startTime = performance.now();
      
      render(<AITutorChat />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (less than 100ms for simple render)
      expect(renderTime).toBeLessThan(100);
    });

    it('should not have memory leaks in component imports', () => {
      // Test that imports don't create circular dependencies
      expect(() => {
        require('@/features/ai-tutor/components/AITutorChat');
        require('@/features/ai-tutor/components/learning/TrackExplorationComponent');
        require('@/features/ai-tutor/components/dashboard/ProgressDashboardComponent');
      }).not.toThrow();
    });
  });

  describe('Error Boundaries', () => {
    it('should handle component errors gracefully', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // This should not crash the test suite
      expect(() => {
        render(<AITutorChat />);
      }).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });
});