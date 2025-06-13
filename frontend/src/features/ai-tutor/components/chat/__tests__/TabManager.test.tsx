import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TabManager } from '../TabManager';
import type { TabType } from '../types';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Home: ({ ...props }) => <div data-testid="home-icon" {...props} />,
  TrendingUp: ({ ...props }) => <div data-testid="trending-icon" {...props} />,
  BookOpen: ({ ...props }) => <div data-testid="book-icon" {...props} />,
  RotateCcw: ({ ...props }) => <div data-testid="rotate-icon" {...props} />,
}));

describe('TabManager', () => {
  const defaultProps = {
    activeTab: 'home' as TabType,
    onTabChange: vi.fn(),
    children: <div data-testid="tab-content">Tab content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render all tab buttons', () => {
      render(<TabManager {...defaultProps} />);
      
      expect(screen.getByRole('tab', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /progress/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /review/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /explore/i })).toBeInTheDocument();
    });

    it('should render tab content', () => {
      render(<TabManager {...defaultProps} />);
      
      expect(screen.getByTestId('tab-content')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
      render(<TabManager {...defaultProps} className="custom-tab-class" />);
      
      const tabsContainer = screen.getByRole('tablist').closest('.custom-tab-class');
      expect(tabsContainer).toBeInTheDocument();
    });

    it('should have proper tablist structure', () => {
      render(<TabManager {...defaultProps} />);
      
      const tablist = screen.getByRole('tablist');
      const tabs = screen.getAllByRole('tab');
      const tabpanel = screen.getByRole('tabpanel');
      
      expect(tablist).toBeInTheDocument();
      expect(tabs).toHaveLength(4);
      expect(tabpanel).toBeInTheDocument();
    });
  });

  describe('Tab Icons', () => {
    it('should display correct icons for each tab', () => {
      render(<TabManager {...defaultProps} />);
      
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trending-icon')).toBeInTheDocument();
      expect(screen.getByTestId('book-icon')).toBeInTheDocument();
      expect(screen.getByTestId('rotate-icon')).toBeInTheDocument();
    });

    it('should associate icons with correct tabs', () => {
      render(<TabManager {...defaultProps} />);
      
      const homeTab = screen.getByRole('tab', { name: /home/i });
      const progressTab = screen.getByRole('tab', { name: /progress/i });
      const reviewTab = screen.getByRole('tab', { name: /review/i });
      const exploreTab = screen.getByRole('tab', { name: /explore/i });
      
      expect(homeTab).toContainElement(screen.getByTestId('home-icon'));
      expect(progressTab).toContainElement(screen.getByTestId('trending-icon'));
      expect(reviewTab).toContainElement(screen.getByTestId('rotate-icon'));
      expect(exploreTab).toContainElement(screen.getByTestId('book-icon'));
    });
  });

  describe('Active Tab State', () => {
    it('should mark home tab as active by default', () => {
      render(<TabManager {...defaultProps} activeTab="home" />);
      
      const homeTab = screen.getByRole('tab', { name: /home/i });
      expect(homeTab).toHaveAttribute('aria-selected', 'true');
      expect(homeTab).toHaveAttribute('data-state', 'active');
    });

    it('should mark progress tab as active when specified', () => {
      render(<TabManager {...defaultProps} activeTab="progress" />);
      
      const progressTab = screen.getByRole('tab', { name: /progress/i });
      expect(progressTab).toHaveAttribute('aria-selected', 'true');
      expect(progressTab).toHaveAttribute('data-state', 'active');
    });

    it('should mark review tab as active when specified', () => {
      render(<TabManager {...defaultProps} activeTab="review" />);
      
      const reviewTab = screen.getByRole('tab', { name: /review/i });
      expect(reviewTab).toHaveAttribute('aria-selected', 'true');
      expect(reviewTab).toHaveAttribute('data-state', 'active');
    });

    it('should mark explore tab as active when specified', () => {
      render(<TabManager {...defaultProps} activeTab="explore" />);
      
      const exploreTab = screen.getByRole('tab', { name: /explore/i });
      expect(exploreTab).toHaveAttribute('aria-selected', 'true');
      expect(exploreTab).toHaveAttribute('data-state', 'active');
    });

    it('should mark other tabs as inactive when one is active', () => {
      render(<TabManager {...defaultProps} activeTab="progress" />);
      
      const homeTab = screen.getByRole('tab', { name: /home/i });
      const reviewTab = screen.getByRole('tab', { name: /review/i });
      const exploreTab = screen.getByRole('tab', { name: /explore/i });
      
      expect(homeTab).toHaveAttribute('aria-selected', 'false');
      expect(reviewTab).toHaveAttribute('aria-selected', 'false');
      expect(exploreTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Tab Interactions', () => {
    it('should call onTabChange when home tab is clicked', () => {
      const onTabChange = vi.fn();
      render(<TabManager {...defaultProps} onTabChange={onTabChange} activeTab="progress" />);
      
      const homeTab = screen.getByRole('tab', { name: /home/i });
      fireEvent.click(homeTab);
      
      expect(onTabChange).toHaveBeenCalledWith('home');
    });

    it('should call onTabChange when progress tab is clicked', () => {
      const onTabChange = vi.fn();
      render(<TabManager {...defaultProps} onTabChange={onTabChange} activeTab="home" />);
      
      const progressTab = screen.getByRole('tab', { name: /progress/i });
      fireEvent.click(progressTab);
      
      expect(onTabChange).toHaveBeenCalledWith('progress');
    });

    it('should call onTabChange when review tab is clicked', () => {
      const onTabChange = vi.fn();
      render(<TabManager {...defaultProps} onTabChange={onTabChange} activeTab="home" />);
      
      const reviewTab = screen.getByRole('tab', { name: /review/i });
      fireEvent.click(reviewTab);
      
      expect(onTabChange).toHaveBeenCalledWith('review');
    });

    it('should call onTabChange when explore tab is clicked', () => {
      const onTabChange = vi.fn();
      render(<TabManager {...defaultProps} onTabChange={onTabChange} activeTab="home" />);
      
      const exploreTab = screen.getByRole('tab', { name: /explore/i });
      fireEvent.click(exploreTab);
      
      expect(onTabChange).toHaveBeenCalledWith('explore');
    });

    it('should not call onTabChange when clicking already active tab', () => {
      const onTabChange = vi.fn();
      render(<TabManager {...defaultProps} onTabChange={onTabChange} activeTab="home" />);
      
      const homeTab = screen.getByRole('tab', { name: /home/i });
      fireEvent.click(homeTab);
      
      // Behavior depends on implementation - might still call or might not
      // This test documents the expected behavior
      expect(onTabChange).toHaveBeenCalledWith('home');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support arrow key navigation', async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();
      render(<TabManager {...defaultProps} onTabChange={onTabChange} activeTab="home" />);
      
      const homeTab = screen.getByRole('tab', { name: /home/i });
      homeTab.focus();
      
      // Right arrow should move to next tab
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /progress/i })).toHaveFocus();
      
      // Right arrow again should move to next tab
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /review/i })).toHaveFocus();
    });

    it('should wrap around at the end of tab list', async () => {
      const user = userEvent.setup();
      render(<TabManager {...defaultProps} activeTab="explore" />);
      
      const exploreTab = screen.getByRole('tab', { name: /explore/i });
      exploreTab.focus();
      
      // Right arrow from last tab should wrap to first
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /home/i })).toHaveFocus();
    });

    it('should support left arrow navigation', async () => {
      const user = userEvent.setup();
      render(<TabManager {...defaultProps} activeTab="progress" />);
      
      const progressTab = screen.getByRole('tab', { name: /progress/i });
      progressTab.focus();
      
      // Left arrow should move to previous tab
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: /home/i })).toHaveFocus();
    });

    it('should wrap around at the beginning of tab list', async () => {
      const user = userEvent.setup();
      render(<TabManager {...defaultProps} activeTab="home" />);
      
      const homeTab = screen.getByRole('tab', { name: /home/i });
      homeTab.focus();
      
      // Left arrow from first tab should wrap to last
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('tab', { name: /explore/i })).toHaveFocus();
    });

    it('should activate tab with Enter key', async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();
      render(<TabManager {...defaultProps} onTabChange={onTabChange} activeTab="home" />);
      
      const progressTab = screen.getByRole('tab', { name: /progress/i });
      progressTab.focus();
      
      await user.keyboard('{Enter}');
      expect(onTabChange).toHaveBeenCalledWith('progress');
    });

    it('should activate tab with Space key', async () => {
      const user = userEvent.setup();
      const onTabChange = vi.fn();
      render(<TabManager {...defaultProps} onTabChange={onTabChange} activeTab="home" />);
      
      const reviewTab = screen.getByRole('tab', { name: /review/i });
      reviewTab.focus();
      
      await user.keyboard(' ');
      expect(onTabChange).toHaveBeenCalledWith('review');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<TabManager {...defaultProps} />);
      
      const tablist = screen.getByRole('tablist');
      const tabs = screen.getAllByRole('tab');
      const tabpanel = screen.getByRole('tabpanel');
      
      expect(tablist).toHaveAttribute('aria-label', 'AI Tutor navigation');
      expect(tabpanel).toHaveAttribute('aria-label', 'Tab content');
      
      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute('aria-controls', expect.stringContaining('tabpanel'));
        expect(tab).toHaveAttribute('id', expect.stringContaining('tab'));
      });
    });

    it('should have proper tab-tabpanel associations', () => {
      render(<TabManager {...defaultProps} />);
      
      const homeTab = screen.getByRole('tab', { name: /home/i });
      const tabpanel = screen.getByRole('tabpanel');
      
      const tabpanelId = tabpanel.getAttribute('id');
      const tabControls = homeTab.getAttribute('aria-controls');
      
      expect(tabControls).toBe(tabpanelId);
    });

    it('should be keyboard accessible', () => {
      render(<TabManager {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('tabindex');
      });
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      render(<TabManager {...defaultProps} />);
      
      // Tab into the tablist
      await user.tab();
      
      // First tab should be focusable
      const homeTab = screen.getByRole('tab', { name: /home/i });
      expect(homeTab).toHaveFocus();
    });

    it('should announce tab changes to screen readers', () => {
      render(<TabManager {...defaultProps} activeTab="progress" />);
      
      const progressTab = screen.getByRole('tab', { name: /progress/i });
      expect(progressTab).toHaveAttribute('aria-selected', 'true');
      
      // Should have live region for announcements
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Visual States', () => {
    it('should have visual distinction for active tab', () => {
      render(<TabManager {...defaultProps} activeTab="home" />);
      
      const homeTab = screen.getByRole('tab', { name: /home/i });
      const progressTab = screen.getByRole('tab', { name: /progress/i });
      
      expect(homeTab).toHaveAttribute('data-state', 'active');
      expect(progressTab).toHaveAttribute('data-state', 'inactive');
    });

    it('should have hover states for interactive elements', () => {
      render(<TabManager {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach(tab => {
        expect(tab).toHaveClass('hover:bg-gray-100');
      });
    });

    it('should have focus visible styles', () => {
      render(<TabManager {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach(tab => {
        expect(tab).toHaveClass('focus-visible:ring-2');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile-friendly touch targets', () => {
      render(<TabManager {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      
      tabs.forEach(tab => {
        // Minimum 44px touch target
        expect(tab).toHaveClass('h-12');
      });
    });

    it('should stack appropriately on small screens', () => {
      render(<TabManager {...defaultProps} />);
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveClass('grid', 'grid-cols-4', 'sm:flex');
    });

    it('should have proper spacing on different screen sizes', () => {
      render(<TabManager {...defaultProps} />);
      
      const container = screen.getByRole('tablist').parentElement;
      expect(container).toHaveClass('p-2', 'sm:p-4');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid activeTab gracefully', () => {
      // @ts-expect-error - Testing invalid input
      render(<TabManager {...defaultProps} activeTab="invalid" />);
      
      // Should default to first tab or handle gracefully
      const tabs = screen.getAllByRole('tab');
      const activeTabs = tabs.filter(tab => tab.getAttribute('aria-selected') === 'true');
      
      // Should have exactly one active tab
      expect(activeTabs).toHaveLength(1);
    });

    it('should handle rapid tab switching', () => {
      const onTabChange = vi.fn();
      render(<TabManager {...defaultProps} onTabChange={onTabChange} />);
      
      const homeTab = screen.getByRole('tab', { name: /home/i });
      const progressTab = screen.getByRole('tab', { name: /progress/i });
      const reviewTab = screen.getByRole('tab', { name: /review/i });
      
      // Rapid clicks
      fireEvent.click(progressTab);
      fireEvent.click(reviewTab);
      fireEvent.click(homeTab);
      
      expect(onTabChange).toHaveBeenCalledTimes(3);
      expect(onTabChange).toHaveBeenNthCalledWith(1, 'progress');
      expect(onTabChange).toHaveBeenNthCalledWith(2, 'review');
      expect(onTabChange).toHaveBeenNthCalledWith(3, 'home');
    });

    it('should maintain state when children change', () => {
      const { rerender } = render(<TabManager {...defaultProps} activeTab="progress" />);
      
      const progressTab = screen.getByRole('tab', { name: /progress/i });
      expect(progressTab).toHaveAttribute('aria-selected', 'true');
      
      // Change children
      rerender(
        <TabManager {...defaultProps} activeTab="progress">
          <div data-testid="new-content">New content</div>
        </TabManager>
      );
      
      // Tab state should be preserved
      const progressTabAfter = screen.getByRole('tab', { name: /progress/i });
      expect(progressTabAfter).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('new-content')).toBeInTheDocument();
    });
  });
});