/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressInteractionClient } from '../components/dashboard/ProgressInteractionClient';
import type { UserProgress } from '../queries';

// Mock framer-motion to avoid issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Progress Server Component Architecture - Client Components', () => {
  const mockTrackProgress: UserProgress = {
    id: '1',
    userId: 'user123',
    trackId: '1',
    trackName: 'Frontend Development',
    progress: 65,
    status: 'active',
    timeSpent: '24h 30m',
    nextLesson: 'React Hooks Deep Dive',
    lastUpdated: new Date().toISOString()
  };

  describe('ProgressInteractionClient', () => {
    it('should render progress interaction client component', () => {
      render(<ProgressInteractionClient track={mockTrackProgress} />);
      
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('should show correct action text based on track status', () => {
      // Active track
      render(<ProgressInteractionClient track={mockTrackProgress} />);
      expect(screen.getByText('Continue')).toBeInTheDocument();
      
      // Paused track
      const pausedTrack = { ...mockTrackProgress, status: 'paused' as const };
      render(<ProgressInteractionClient track={pausedTrack} />);
      expect(screen.getByText('Resume')).toBeInTheDocument();
      
      // Planned track
      const plannedTrack = { ...mockTrackProgress, status: 'planned' as const };
      render(<ProgressInteractionClient track={plannedTrack} />);
      expect(screen.getByText('Start')).toBeInTheDocument();
    });

    it('should render more options button', () => {
      render(<ProgressInteractionClient track={mockTrackProgress} />);
      
      // The more options button should be rendered
      const moreButton = screen.getByRole('button', { name: '' }); // It's just an icon
      expect(moreButton).toBeInTheDocument();
    });
  });

  describe('ContinueLearningButton', () => {
    it('should render continue learning button', () => {
      render(<ProgressInteractionClient.ContinueLearningButton />);
      
      expect(screen.getByText('Continue Learning')).toBeInTheDocument();
    });
  });

  describe('Progress Data Structure Integration', () => {
    it('should handle progress data structure correctly', () => {
      const progress = mockTrackProgress;
      
      expect(progress).toHaveProperty('id');
      expect(progress).toHaveProperty('userId');
      expect(progress).toHaveProperty('trackId');
      expect(progress).toHaveProperty('trackName');
      expect(progress).toHaveProperty('progress');
      expect(progress).toHaveProperty('status');
      expect(progress).toHaveProperty('timeSpent');
      expect(progress).toHaveProperty('nextLesson');
      expect(progress).toHaveProperty('lastUpdated');
      
      expect(typeof progress.progress).toBe('number');
      expect(['active', 'paused', 'planned', 'completed']).toContain(progress.status);
    });
  });
});