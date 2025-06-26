/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrackInteractionClient } from '../components/learning/TrackInteractionClient';
import type { LearningTrack } from '../components/learning/TrackExplorationComponent';

// Mock framer-motion to avoid issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Server Component Architecture - Client Components', () => {
  const mockTrack: LearningTrack = {
    id: '1',
    title: 'Frontend Development',
    description: 'Master React, TypeScript, and modern web development',
    icon: 'Code',
    progress: 25,
    difficulty: 'Beginner',
    duration: '12 weeks',
    skills: ['React', 'TypeScript', 'CSS', 'JavaScript']
  };

  describe('TrackInteractionClient', () => {
    it('should render track interaction client component', () => {
      render(<TrackInteractionClient track={mockTrack} />);
      
      expect(screen.getByText('Start Learning')).toBeInTheDocument();
    });

    it('should show progress when track has progress', () => {
      render(<TrackInteractionClient track={mockTrack} />);
      
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should not show progress for new tracks', () => {
      const newTrack = { ...mockTrack, progress: 0 };
      render(<TrackInteractionClient track={newTrack} />);
      
      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('should render track stats on hover', () => {
      render(<TrackInteractionClient track={mockTrack} />);
      
      // The stats should be rendered but initially hidden (opacity: 0)
      expect(screen.getByText('12 modules')).toBeInTheDocument();
      expect(screen.getByText('2.3k learners')).toBeInTheDocument();
      expect(screen.getByText('4.8 rating')).toBeInTheDocument();
    });
  });

  describe('Server Component Data Integration', () => {
    it('should handle track data structure correctly', () => {
      const track = mockTrack;
      
      expect(track).toHaveProperty('id');
      expect(track).toHaveProperty('title');
      expect(track).toHaveProperty('description');
      expect(track).toHaveProperty('difficulty');
      expect(track).toHaveProperty('duration');
      expect(track).toHaveProperty('skills');
      expect(Array.isArray(track.skills)).toBe(true);
    });
  });
});