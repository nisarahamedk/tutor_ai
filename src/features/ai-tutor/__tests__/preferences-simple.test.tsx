/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

import { PreferencesFormClient } from '../components/dashboard/PreferencesFormClient';
import type { LearningPreferences } from '../queries';

// Mock framer-motion to avoid issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Preferences Server Component Architecture - Basic Tests', () => {
  const mockPreferences: LearningPreferences = {
    id: '1',
    userId: 'user123',
    timeAvailability: 15,
    learningStyle: 'hands-on',
    goals: ['Get a job as a developer', 'Build personal projects'],
    lastUpdated: new Date().toISOString()
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('PreferencesFormClient - Basic Rendering', () => {
    it('should render edit button when not in onboarding mode', () => {
      render(
        <PreferencesFormClient 
          isOnboarding={false} 
          initialPreferences={mockPreferences}
        />
      );
      
      expect(screen.getByText('Edit Preferences')).toBeInTheDocument();
    });

    it('should render learning style options in onboarding mode', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      expect(screen.getByText('Visual Learner')).toBeInTheDocument();
      expect(screen.getByText('Hands-on Learner')).toBeInTheDocument();
      expect(screen.getByText('Reading/Writing')).toBeInTheDocument();
    });

    it('should render goal options in onboarding mode', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      expect(screen.getByText('Get a job as a developer')).toBeInTheDocument();
      expect(screen.getByText('Build personal projects')).toBeInTheDocument();
      expect(screen.getByText('Advance in current role')).toBeInTheDocument();
    });

    it('should render save button in onboarding mode', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      expect(screen.getByText('Start My Learning Journey')).toBeInTheDocument();
    });
  });

  describe('Preferences Data Structure Integration', () => {
    it('should handle preferences data structure correctly', () => {
      const preferences = mockPreferences;
      
      expect(preferences).toHaveProperty('id');
      expect(preferences).toHaveProperty('userId');
      expect(preferences).toHaveProperty('timeAvailability');
      expect(preferences).toHaveProperty('learningStyle');
      expect(preferences).toHaveProperty('goals');
      expect(preferences).toHaveProperty('lastUpdated');
      
      expect(typeof preferences.timeAvailability).toBe('number');
      expect(preferences.timeAvailability).toBeGreaterThan(0);
      expect(['visual', 'hands-on', 'reading']).toContain(preferences.learningStyle);
      expect(Array.isArray(preferences.goals)).toBe(true);
      expect(preferences.goals.length).toBeGreaterThan(0);
    });

    it('should validate learning style options', () => {
      const validStyles = ['visual', 'hands-on', 'reading'];
      expect(validStyles).toContain(mockPreferences.learningStyle);
    });

    it('should validate goals structure', () => {
      expect(mockPreferences.goals).toBeInstanceOf(Array);
      mockPreferences.goals.forEach(goal => {
        expect(typeof goal).toBe('string');
        expect(goal.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component Props Validation', () => {
    it('should handle onboarding mode correctly', () => {
      const { rerender } = render(<PreferencesFormClient isOnboarding={true} />);
      
      // Should not show edit button in onboarding mode
      expect(screen.queryByText('Edit Preferences')).not.toBeInTheDocument();
      
      // Should show onboarding save button
      expect(screen.getByText('Start My Learning Journey')).toBeInTheDocument();
      
      // Test non-onboarding mode
      rerender(
        <PreferencesFormClient 
          isOnboarding={false} 
          initialPreferences={mockPreferences}
        />
      );
      
      expect(screen.getByText('Edit Preferences')).toBeInTheDocument();
      expect(screen.queryByText('Start My Learning Journey')).not.toBeInTheDocument();
    });
  });
});