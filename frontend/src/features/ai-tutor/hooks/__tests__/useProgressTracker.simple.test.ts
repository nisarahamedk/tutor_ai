// src/features/ai-tutor/hooks/__tests__/useProgressTracker.simple.test.ts
// Simple test to verify the progress tracker implementation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock implementation
const mockUseComprehensiveLearningStore = vi.fn();

vi.mock('../../stores/comprehensiveLearningStore', () => ({
  useComprehensiveLearningStore: mockUseComprehensiveLearningStore
}));

// Import after mocking
const { useProgressTracker } = await import('../business/useProgressTracker');

describe('useProgressTracker - Basic Functionality', () => {
  const mockProgress = {
    'react-fundamentals': {
      trackId: 'react-fundamentals',
      enrolledAt: '2024-01-01T00:00:00.000Z',
      lastAccessedAt: '2024-01-15T00:00:00.000Z',
      overallProgress: 75,
      completedLessons: ['lesson-1', 'lesson-2'],
      timeSpent: 7200000, // 2 hours
      status: 'in-progress'
    },
    'typescript-essentials': {
      trackId: 'typescript-essentials',
      enrolledAt: '2024-01-05T00:00:00.000Z',
      lastAccessedAt: '2024-01-20T00:00:00.000Z',
      overallProgress: 100,
      completedLessons: ['ts-lesson-1'],
      timeSpent: 3600000, // 1 hour
      status: 'completed'
    }
  };

  const mockLessonProgress = {
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
    }
  };

  const mockAchievements = [
    {
      id: 'first-lesson',
      type: 'lesson' as const,
      title: 'First Lesson Complete',
      description: 'Completed your first lesson',
      points: 10,
      rarity: 'common' as const,
      earnedAt: '2024-01-01T09:30:00.000Z'
    }
  ];

  const mockStore = {
    progress: mockProgress,
    lessonProgress: mockLessonProgress,
    achievements: mockAchievements,
    learningStreak: 5,
    totalLearningTime: 10800000, // 3 hours
    tracks: [
      {
        id: 'react-fundamentals',
        title: 'React Fundamentals',
        skills: ['React', 'JavaScript'],
        lessons: [
          { id: 'lesson-1', title: 'Introduction to React' },
          { id: 'lesson-2', title: 'Components and Props' }
        ]
      }
    ],
    enrolledTracks: ['react-fundamentals', 'typescript-essentials'],
    updateLessonProgress: vi.fn(),
    completeLesson: vi.fn(),
    getWeeklyProgress: vi.fn(() => [
      { week: '2024-W01', lessonsCompleted: 3, timeSpent: 7200000, averageScore: 85 }
    ]),
    getStreakInfo: vi.fn(() => ({
      current: 5,
      longest: 10,
      isOnTrack: true,
      daysUntilReset: 2
    }))
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseComprehensiveLearningStore.mockImplementation((selector) => {
      if (typeof selector === 'function') {
        return selector(mockStore);
      }
      return mockStore;
    });
  });

  it('should calculate overall progress correctly', () => {
    const { result } = renderHook(() => useProgressTracker());

    // Average of 75% and 100% = 87.5%
    expect(result.current.overallProgress).toBe(88); // Rounded
  });

  it('should return track progress mapping', () => {
    const { result } = renderHook(() => useProgressTracker());

    expect(result.current.trackProgress).toEqual({
      'react-fundamentals': 75,
      'typescript-essentials': 100
    });
  });

  it('should return learning streak', () => {
    const { result } = renderHook(() => useProgressTracker());

    expect(result.current.learningStreak).toBe(5);
  });

  it('should return total learning time', () => {
    const { result } = renderHook(() => useProgressTracker());

    expect(result.current.totalLearningTime).toBe(10800000);
  });

  it('should provide recent activity', () => {
    const { result } = renderHook(() => useProgressTracker());

    expect(Array.isArray(result.current.recentActivity)).toBe(true);
    expect(result.current.recentActivity.length).toBeGreaterThanOrEqual(0);
  });

  it('should provide action methods', () => {
    const { result } = renderHook(() => useProgressTracker());

    expect(typeof result.current.updateLessonProgress).toBe('function');
    expect(typeof result.current.completeLesson).toBe('function');
    expect(typeof result.current.recordStudyTime).toBe('function');
  });

  it('should provide analytics methods', () => {
    const { result } = renderHook(() => useProgressTracker());

    expect(typeof result.current.getWeeklyProgress).toBe('function');
    expect(typeof result.current.getPredictedCompletion).toBe('function');
    expect(typeof result.current.getStrengthsAndWeaknesses).toBe('function');
  });

  it('should provide achievement methods', () => {
    const { result } = renderHook(() => useProgressTracker());

    expect(typeof result.current.checkNewAchievements).toBe('function');
    expect(typeof result.current.getNextMilestone).toBe('function');
  });

  it('should get weekly progress data', () => {
    const { result } = renderHook(() => useProgressTracker());

    const weeklyProgress = result.current.getWeeklyProgress();
    expect(Array.isArray(weeklyProgress)).toBe(true);
    expect(weeklyProgress.length).toBeGreaterThan(0);
  });

  it('should predict completion date', () => {
    const { result } = renderHook(() => useProgressTracker());

    const prediction = result.current.getPredictedCompletion('react-fundamentals');
    expect(prediction).toBeInstanceOf(Date);
    expect(prediction.getTime()).toBeGreaterThan(Date.now());
  });

  it('should analyze strengths and weaknesses', () => {
    const { result } = renderHook(() => useProgressTracker());

    const analysis = result.current.getStrengthsAndWeaknesses();
    expect(analysis).toBeDefined();
    expect(Array.isArray(analysis.strengths)).toBe(true);
    expect(Array.isArray(analysis.weaknesses)).toBe(true);
    expect(Array.isArray(analysis.recommendations)).toBe(true);
  });

  it('should get next milestone', () => {
    const { result } = renderHook(() => useProgressTracker());

    const milestone = result.current.getNextMilestone();
    if (milestone) {
      expect(milestone.title).toBeDefined();
      expect(milestone.target).toBeDefined();
      expect(milestone.current).toBeDefined();
    }
  });

  it('should validate progress update inputs', async () => {
    const { result } = renderHook(() => useProgressTracker());

    await act(async () => {
      try {
        await result.current.updateLessonProgress('lesson-1', 'react-fundamentals', 150);
        expect.fail('Should have thrown an error for invalid progress value');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Progress must be between 0 and 100');
      }
    });
  });

  it('should validate study time inputs', async () => {
    const { result } = renderHook(() => useProgressTracker());

    await act(async () => {
      try {
        await result.current.recordStudyTime(-1000);
        expect.fail('Should have thrown an error for negative study time');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Study time must be positive');
      }
    });
  });
});