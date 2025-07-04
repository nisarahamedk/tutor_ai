/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssessmentClient } from '../components/learning/AssessmentClient';
import type { SkillAssessmentData } from '../queries';

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

describe('Assessment Server Component Architecture - Client Components', () => {
  const mockAssessment: SkillAssessmentData = {
    id: '1',
    title: 'Frontend Foundations Assessment',
    description: 'Evaluate your current knowledge of HTML, CSS, JavaScript, and React fundamentals',
    estimatedTime: '15-20 minutes',
    difficulty: 'Beginner',
    skills: [
      { skill: 'HTML/CSS', level: 3 },
      { skill: 'JavaScript', level: 2 },
      { skill: 'React', level: 1 },
      { skill: 'TypeScript', level: 1 }
    ]
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('AssessmentClient', () => {
    it('should render assessment client component', () => {
      render(<AssessmentClient assessment={mockAssessment} />);
      
      expect(screen.getByText('Start Assessment')).toBeInTheDocument();
    });

    it('should show loading state when starting assessment', async () => {
      render(<AssessmentClient assessment={mockAssessment} />);
      
      const startButton = screen.getByRole('button', { name: /start assessment/i });
      fireEvent.click(startButton);
      
      expect(screen.getByText('Starting...')).toBeInTheDocument();
      expect(startButton).toBeDisabled();
    });

    it('should navigate to assessment page when starting', async () => {
      render(<AssessmentClient assessment={mockAssessment} />);
      
      const startButton = screen.getByRole('button', { name: /start assessment/i });
      fireEvent.click(startButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/ai-tutor/assessment/1');
      }, { timeout: 1000 });
    });

    it('should render stats on hover', () => {
      render(<AssessmentClient assessment={mockAssessment} />);
      
      // The stats should be rendered but initially hidden (opacity: 0)
      expect(screen.getByText('1.2k taken')).toBeInTheDocument();
      expect(screen.getByText('4.9 rating')).toBeInTheDocument();
    });

    it('should render preview button', () => {
      render(<AssessmentClient assessment={mockAssessment} />);
      
      expect(screen.getByText('Preview Questions')).toBeInTheDocument();
    });
  });

  describe('Assessment Data Structure Integration', () => {
    it('should handle assessment data structure correctly', () => {
      const assessment = mockAssessment;
      
      expect(assessment).toHaveProperty('id');
      expect(assessment).toHaveProperty('title');
      expect(assessment).toHaveProperty('description');
      expect(assessment).toHaveProperty('estimatedTime');
      expect(assessment).toHaveProperty('difficulty');
      expect(assessment).toHaveProperty('skills');
      expect(Array.isArray(assessment.skills)).toBe(true);
      
      expect(['Beginner', 'Intermediate', 'Advanced']).toContain(assessment.difficulty);
      
      // Check skills structure
      assessment.skills.forEach(skill => {
        expect(skill).toHaveProperty('skill');
        expect(skill).toHaveProperty('level');
        expect(typeof skill.skill).toBe('string');
        expect(typeof skill.level).toBe('number');
        expect(skill.level).toBeGreaterThanOrEqual(1);
        expect(skill.level).toBeLessThanOrEqual(5);
      });
    });
  });
});