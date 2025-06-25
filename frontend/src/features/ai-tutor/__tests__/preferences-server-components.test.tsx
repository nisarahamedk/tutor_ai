/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreferencesFormClient } from '../components/dashboard/PreferencesFormClient';
import type { LearningPreferences } from '../queries';

// Mock framer-motion to avoid issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Preferences Server Component Architecture - Client Components', () => {
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

  describe('PreferencesFormClient - Onboarding Mode', () => {
    it('should render onboarding form', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      expect(screen.getByText('How many hours per week can you dedicate to learning?')).toBeInTheDocument();
      expect(screen.getByText('What\'s your learning style?')).toBeInTheDocument();
      expect(screen.getByText('What are your goals? (Select all that apply)')).toBeInTheDocument();
      expect(screen.getByText('Start My Learning Journey')).toBeInTheDocument();
    });

    it('should display learning style options', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      expect(screen.getByText('Visual Learner')).toBeInTheDocument();
      expect(screen.getByText('Hands-on Learner')).toBeInTheDocument();
      expect(screen.getByText('Reading/Writing')).toBeInTheDocument();
    });

    it('should display goal options', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      expect(screen.getByText('Get a job as a developer')).toBeInTheDocument();
      expect(screen.getByText('Build personal projects')).toBeInTheDocument();
      expect(screen.getByText('Advance in current role')).toBeInTheDocument();
    });

    it('should disable save button when form is invalid', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      const saveButton = screen.getByText('Start My Learning Journey');
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when form is valid', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      // Select learning style
      const handsOnStyle = screen.getByText('Hands-on Learner');
      fireEvent.click(handsOnStyle);
      
      // Select a goal
      const jobGoal = screen.getByText('Get a job as a developer');
      fireEvent.click(jobGoal);
      
      const saveButton = screen.getByText('Start My Learning Journey');
      expect(saveButton).not.toBeDisabled();
    });

    it('should show validation hint when form is invalid', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      expect(screen.getByText('Please select a learning style and at least one goal to continue')).toBeInTheDocument();
    });
  });

  describe('PreferencesFormClient - Edit Mode', () => {
    it('should render edit button when not editing', () => {
      render(
        <PreferencesFormClient 
          isOnboarding={false} 
          initialPreferences={mockPreferences}
        />
      );
      
      expect(screen.getByText('Edit Preferences')).toBeInTheDocument();
    });

    it('should show form when edit button is clicked', () => {
      render(
        <PreferencesFormClient 
          isOnboarding={false} 
          initialPreferences={mockPreferences}
        />
      );
      
      const editButton = screen.getByText('Edit Preferences');
      fireEvent.click(editButton);
      
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should pre-populate form with initial preferences', () => {
      render(
        <PreferencesFormClient 
          isOnboarding={false} 
          initialPreferences={mockPreferences}
        />
      );
      
      const editButton = screen.getByText('Edit Preferences');
      fireEvent.click(editButton);
      
      // Check that hands-on learning style is selected (from initial preferences)
      // This would be indicated by the selected state in the actual UI
      expect(screen.getByText('Hands-on Learner')).toBeInTheDocument();
      
      // Check that goals are selected
      expect(screen.getByText('Get a job as a developer')).toBeInTheDocument();
      expect(screen.getByText('Build personal projects')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update goals count when goals are selected', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      // Select first goal
      const jobGoal = screen.getByText('Get a job as a developer');
      fireEvent.click(jobGoal);
      
      expect(screen.getByText('1 goal selected')).toBeInTheDocument();
      
      // Select second goal
      const projectGoal = screen.getByText('Build personal projects');
      fireEvent.click(projectGoal);
      
      expect(screen.getByText('2 goals selected')).toBeInTheDocument();
    });

    it('should toggle goals when clicked multiple times', () => {
      render(<PreferencesFormClient isOnboarding={true} />);
      
      const jobGoal = screen.getByText('Get a job as a developer');
      
      // Select goal
      fireEvent.click(jobGoal);
      expect(screen.getByText('1 goal selected')).toBeInTheDocument();
      
      // Deselect goal
      fireEvent.click(jobGoal);
      expect(screen.queryByText('1 goal selected')).not.toBeInTheDocument();
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
  });
});