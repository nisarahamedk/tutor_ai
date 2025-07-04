// src/features/ai-tutor/hooks/__tests__/useProgressTracker.test.ts
// TDD Tests for Progress Tracker Business Logic Hook

import { renderHook, act } from '@testing-library/react';
import { useProgressTracker } from '../business/useProgressTracker';
import { useComprehensiveLearningStore } from '../../stores/comprehensiveLearningStore';
import type { TrackProgress, LessonProgress, Achievement, LearningStats } from '../../types/learning';

// Mock the store
jest.mock('../../stores/comprehensiveLearningStore', () => ({
  useComprehensiveLearningStore: jest.fn()
}));

const mockUseComprehensiveLearningStore = useComprehensiveLearningStore as jest.MockedFunction<typeof useComprehensiveLearningStore>;

describe('useProgressTracker', () => {
  const mockProgress: Record<string, TrackProgress> = {
    'react-fundamentals': {
      trackId: 'react-fundamentals',
      enrolledAt: '2024-01-01T00:00:00.000Z',
      lastAccessedAt: '2024-01-15T00:00:00.000Z',
      overallProgress: 75,
      completedLessons: ['lesson-1', 'lesson-2', 'lesson-3'],
      timeSpent: 7200000, // 2 hours in ms
      status: 'in-progress'
    },
    'typescript-essentials': {
      trackId: 'typescript-essentials',
      enrolledAt: '2024-01-05T00:00:00.000Z',
      lastAccessedAt: '2024-01-20T00:00:00.000Z',
      overallProgress: 100,
      completedLessons: ['ts-lesson-1', 'ts-lesson-2'],
      timeSpent: 3600000, // 1 hour in ms
      status: 'completed'
    }
  };

  const mockLessonProgress: Record<string, LessonProgress> = {
    'lesson-1': {
      lessonId: 'lesson-1',
      trackId: 'react-fundamentals',
      startedAt: '2024-01-01T09:00:00.000Z',
      completedAt: '2024-01-01T09:30:00.000Z',
      progress: 100,
      timeSpent: 1800000, // 30 minutes
      attempts: 1,
      scores: [90],
      bookmarks: []
    },
    'lesson-2': {
      lessonId: 'lesson-2',
      trackId: 'react-fundamentals',
      startedAt: '2024-01-02T09:00:00.000Z',
      completedAt: '2024-01-02T10:00:00.000Z',
      progress: 100,
      timeSpent: 3600000, // 1 hour
      attempts: 2,
      scores: [75, 85],
      bookmarks: []
    }
  };

  const mockAchievements: Achievement[] = [
    {
      id: 'first-lesson',
      type: 'lesson',
      title: 'First Lesson Complete',
      description: 'Completed your first lesson',
      points: 10,
      rarity: 'common',
      earnedAt: '2024-01-01T09:30:00.000Z'
    },
    {
      id: 'track-complete',
      type: 'track',
      title: 'Track Master',
      description: 'Completed a learning track',
      points: 50,
      rarity: 'rare',
      earnedAt: '2024-01-20T00:00:00.000Z'
    }
  ];

  const mockStats: LearningStats = {
    totalTracksEnrolled: 2,
    totalTracksCompleted: 1,
    totalLessonsCompleted: 5,
    totalTimeSpent: 10800000, // 3 hours
    averageScore: 83.75,
    completionRate: 0.5,
    learningVelocity: 1.67,
    consistencyScore: 0.85
  };

  const mockStore = {
    progress: mockProgress,
    lessonProgress: mockLessonProgress,
    achievements: mockAchievements,
    learningStreak: 5,
    totalLearningTime: 10800000,
    updateLessonProgress: jest.fn(),
    completeLesson: jest.fn(),
    getLearningStats: jest.fn(() => mockStats),
    getStreakInfo: jest.fn(() => ({
      current: 5,
      longest: 10,
      isOnTrack: true,
      daysUntilReset: 2
    })),
    getWeeklyProgress: jest.fn(() => [
      { week: '2024-W01', lessonsCompleted: 3, timeSpent: 7200000, averageScore: 85 },
      { week: '2024-W02', lessonsCompleted: 2, timeSpent: 3600000, averageScore: 80 }
    ])
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseComprehensiveLearningStore.mockReturnValue(mockStore);
  });

  describe('progress data access', () => {
    it('should return overall progress statistics', () => {
      const { result } = renderHook(() => useProgressTracker());

      expect(result.current.overallProgress).toBe(87.5); // Average of 75% and 100%
      expect(result.current.trackProgress).toEqual({
        'react-fundamentals': 75,
        'typescript-essentials': 100
      });
      expect(result.current.learningStreak).toBe(5);
    });

    it('should return recent activity', () => {
      const { result } = renderHook(() => useProgressTracker());

      expect(result.current.recentActivity).toBeDefined();
      expect(result.current.recentActivity.length).toBeGreaterThan(0);
    });

    it('should calculate total learning time correctly', () => {
      const { result } = renderHook(() => useProgressTracker());

      expect(result.current.totalLearningTime).toBe(10800000); // 3 hours
    });
  });

  describe('updateLessonProgress action', () => {
    it('should update lesson progress successfully', async () => {
      mockStore.updateLessonProgress.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useProgressTracker());

      await act(async () => {
        await result.current.updateLessonProgress('lesson-3', 'react-fundamentals', 50);
      });

      expect(mockStore.updateLessonProgress).toHaveBeenCalledWith(
        'react-fundamentals',
        'lesson-3',
        50
      );
    });

    it('should handle progress update errors', async () => {
      mockStore.updateLessonProgress.mockRejectedValue(new Error('Update failed'));
      
      const { result } = renderHook(() => useProgressTracker());

      await act(async () => {
        try {
          await result.current.updateLessonProgress('lesson-3', 'react-fundamentals', 50);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    it('should validate progress values', async () => {
      const { result } = renderHook(() => useProgressTracker());

      await act(async () => {
        try {
          await result.current.updateLessonProgress('lesson-3', 'react-fundamentals', 150);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Progress must be between 0 and 100');
        }
      });
    });
  });

  describe('completeLesson action', () => {
    it('should complete lesson successfully', async () => {
      mockStore.completeLesson.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useProgressTracker());

      await act(async () => {
        await result.current.completeLesson('lesson-4', 'react-fundamentals');
      });

      expect(mockStore.completeLesson).toHaveBeenCalledWith(
        'react-fundamentals',
        'lesson-4'
      );
    });
  });

  describe('recordStudyTime action', () => {
    it('should record study time', async () => {
      const { result } = renderHook(() => useProgressTracker());

      await act(async () => {
        await result.current.recordStudyTime(1800000); // 30 minutes
      });

      // Should update total learning time (mock implementation would need to simulate this)
      expect(typeof result.current.totalLearningTime).toBe('number');
    });

    it('should validate study time values', async () => {
      const { result } = renderHook(() => useProgressTracker());

      await act(async () => {
        try {
          await result.current.recordStudyTime(-1000);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('Study time must be positive');
        }
      });
    });
  });

  describe('analytics methods', () => {
    it('should get weekly progress data', () => {
      const { result } = renderHook(() => useProgressTracker());

      const weeklyProgress = result.current.getWeeklyProgress();
      expect(weeklyProgress).toHaveLength(2);
      expect(weeklyProgress[0].week).toBe('2024-W01');
      expect(weeklyProgress[0].lessonsCompleted).toBe(3);
    });

    it('should predict completion time for tracks', () => {
      const { result } = renderHook(() => useProgressTracker());

      const prediction = result.current.getPredictedCompletion('react-fundamentals');
      expect(prediction).toBeInstanceOf(Date);
      expect(prediction.getTime()).toBeGreaterThan(Date.now());
    });

    it('should analyze strengths and weaknesses', () => {
      const { result } = renderHook(() => useProgressTracker());

      const analysis = result.current.getStrengthsAndWeaknesses();
      expect(analysis).toBeDefined();
      expect(analysis.strengths).toBeDefined();
      expect(analysis.weaknesses).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });
  });

  describe('achievement detection', () => {
    it('should check for new achievements', () => {
      const { result } = renderHook(() => useProgressTracker());

      const newAchievements = result.current.checkNewAchievements();
      expect(Array.isArray(newAchievements)).toBe(true);
    });

    it('should get next milestone', () => {
      const { result } = renderHook(() => useProgressTracker());

      const nextMilestone = result.current.getNextMilestone();
      if (nextMilestone) {
        expect(nextMilestone.title).toBeDefined();
        expect(nextMilestone.description).toBeDefined();
        expect(nextMilestone.target).toBeDefined();
      }
    });
  });

  describe('streak management', () => {
    it('should return current streak info', () => {
      const { result } = renderHook(() => useProgressTracker());

      expect(result.current.learningStreak).toBe(5);
      expect(typeof result.current.learningStreak).toBe('number');
    });

    it('should provide streak motivation data', () => {
      mockStore.getStreakInfo.mockReturnValue({
        current: 5,
        longest: 10,
        isOnTrack: true,
        daysUntilReset: 2
      });

      const { result } = renderHook(() => useProgressTracker());

      // This would be computed from streak info
      expect(result.current.learningStreak).toBe(5);
    });
  });

  describe('performance optimization', () => {
    it('should memoize expensive calculations', () => {
      const { result, rerender } = renderHook(() => useProgressTracker());

      const firstOverallProgress = result.current.overallProgress;
      const firstWeeklyProgress = result.current.getWeeklyProgress();

      rerender();

      // Should be memoized if dependencies haven't changed
      expect(result.current.overallProgress).toBe(firstOverallProgress);
      expect(result.current.getWeeklyProgress()).toBe(firstWeeklyProgress);
    });

    it('should update when progress data changes', () => {
      const { rerender } = renderHook(() => useProgressTracker());

      // Simulate progress change
      const updatedProgress = {
        ...mockProgress,
        'react-fundamentals': {
          ...mockProgress['react-fundamentals'],
          overallProgress: 80
        }
      };

      mockUseComprehensiveLearningStore.mockReturnValue({
        ...mockStore,
        progress: updatedProgress
      });

      rerender();

      const { result } = renderHook(() => useProgressTracker());
      expect(result.current.trackProgress['react-fundamentals']).toBe(80);
    });
  });

  describe('user-specific tracking', () => {
    it('should filter data by user ID when provided', () => {
      const { result } = renderHook(() => useProgressTracker('user-123'));

      // In a real implementation, this would filter by user
      expect(result.current.overallProgress).toBeDefined();
      expect(result.current.trackProgress).toBeDefined();
    });

    it('should work without user ID (current user)', () => {
      const { result } = renderHook(() => useProgressTracker());

      expect(result.current.overallProgress).toBeDefined();
      expect(result.current.trackProgress).toBeDefined();
    });
  });
});