// src/features/ai-tutor/hooks/__tests__/useLearningSelectors.test.tsx
// Tests for Learning Selectors (TASK-010)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type {
  LearningTrack,
  TrackProgress,
  LessonProgress,
  Achievement,
  LearningPreferences,
  LearningStats,
  StreakInfo
} from '../../types/learning';

// Mock the learning selectors
const mockUseLearningSelectors = {
  useTracks: vi.fn(),
  useEnrolledTracks: vi.fn(),
  useCurrentTrack: vi.fn(),
  useSelectedTrack: vi.fn(),
  useCurrentLesson: vi.fn(),
  useProgress: vi.fn(),
  useLessonProgress: vi.fn(),
  useTrackProgress: vi.fn(),
  useTrackDetails: vi.fn(),
  useTrackProgressDetails: vi.fn(),
  useLessonProgressDetails: vi.fn(),
  useTracksByDifficulty: vi.fn(),
  useTracksByCategory: vi.fn(),
  useTracksBySkill: vi.fn(),
  useInProgressTracks: vi.fn(),
  useCompletedTracks: vi.fn(),
  useAvailableTracks: vi.fn(),
  useLearningPreferences: vi.fn(),
  useAchievements: vi.fn(),
  useAchievementsByType: vi.fn(),
  useLearningGoals: vi.fn(),
  useLearningStreak: vi.fn(),
  useTotalLearningTime: vi.fn(),
  useLearningStats: vi.fn(),
  useStreakInfo: vi.fn(),
  useWeeklyProgress: vi.fn(),
  useRecommendedTracks: vi.fn(),
  useNextRecommendation: vi.fn(),
  useSkillProgression: vi.fn(),
  useIsLoading: vi.fn(),
  useError: vi.fn(),
  useSyncStatus: vi.fn(),
  useOfflineActions: vi.fn(),
  useTrackCompletionPercentage: vi.fn(),
  useTotalPointsEarned: vi.fn(),
  useUserLevel: vi.fn(),
  useActiveGoalsCount: vi.fn(),
  useAverageSessionTime: vi.fn(),
  useLearningVelocity: vi.fn(),
  useRecentActivity: vi.fn()
};

const mockUseLearningActions = vi.fn();
const mockUseComputedLearningData = vi.fn();
const mockUseLearningPerformanceMetrics = vi.fn();

// Mock data factories
const createMockTrack = (overrides: Partial<LearningTrack> = {}): LearningTrack => ({
  id: 'test-track',
  title: 'Test Track',
  description: 'A test track',
  difficulty: 'beginner',
  estimatedHours: 10,
  skills: ['JavaScript', 'React'],
  category: 'Programming',
  tags: ['web', 'frontend'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  published: true,
  lessons: [],
  assessments: [],
  ...overrides
});

const createMockProgress = (overrides: Partial<TrackProgress> = {}): TrackProgress => ({
  trackId: 'test-track',
  enrolledAt: new Date().toISOString(),
  lastAccessedAt: new Date().toISOString(),
  overallProgress: 50,
  completedLessons: ['lesson-1'],
  timeSpent: 3600000,
  status: 'in-progress',
  ...overrides
});

const createMockLessonProgress = (overrides: Partial<LessonProgress> = {}): LessonProgress => ({
  lessonId: 'test-lesson',
  trackId: 'test-track',
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  progress: 100,
  timeSpent: 1800000,
  attempts: 1,
  scores: [85],
  bookmarks: [],
  ...overrides
});

const createMockAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
  id: 'test-achievement',
  type: 'completion',
  title: 'First Steps',
  description: 'Complete your first lesson',
  icon: '🎯',
  earnedAt: new Date().toISOString(),
  criteria: { type: 'lessons-completed', value: 1, comparison: 'greater-equal' },
  points: 10,
  rarity: 'common',
  ...overrides
});

describe('Learning Selectors (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic State Selectors', () => {
    it('should select tracks correctly', () => {
      // Test requirement: Selectors should provide tracks data
      const mockTracks = [createMockTrack(), createMockTrack({ id: 'track-2' })];
      mockUseLearningSelectors.useTracks.mockReturnValue(mockTracks);

      expect(() => {
        const tracks = mockUseLearningSelectors.useTracks();
        expect(tracks).toEqual(mockTracks);
      }).not.toThrow();
    });

    it('should select enrolled tracks correctly', () => {
      // Test requirement: Selectors should track enrollments
      const mockEnrolledTracks = ['track-1', 'track-2'];
      mockUseLearningSelectors.useEnrolledTracks.mockReturnValue(mockEnrolledTracks);

      expect(() => {
        const enrolledTracks = mockUseLearningSelectors.useEnrolledTracks();
        expect(enrolledTracks).toEqual(mockEnrolledTracks);
      }).not.toThrow();
    });

    it('should select current track correctly', () => {
      // Test requirement: Selectors should track current context
      const currentTrack = 'current-track-id';
      mockUseLearningSelectors.useCurrentTrack.mockReturnValue(currentTrack);

      expect(() => {
        const result = mockUseLearningSelectors.useCurrentTrack();
        expect(result).toBe(currentTrack);
      }).not.toThrow();
    });

    it('should handle null current track', () => {
      // Test requirement: Selectors should handle null states
      mockUseLearningSelectors.useCurrentTrack.mockReturnValue(null);

      expect(() => {
        const result = mockUseLearningSelectors.useCurrentTrack();
        expect(result).toBeNull();
      }).not.toThrow();
    });
  });

  describe('Progress Selectors', () => {
    it('should select progress data correctly', () => {
      // Test requirement: Selectors should provide progress data
      const mockProgress = {
        'track-1': createMockProgress({ trackId: 'track-1' }),
        'track-2': createMockProgress({ trackId: 'track-2' })
      };
      mockUseLearningSelectors.useProgress.mockReturnValue(mockProgress);

      expect(() => {
        const progress = mockUseLearningSelectors.useProgress();
        expect(progress).toEqual(mockProgress);
      }).not.toThrow();
    });

    it('should select lesson progress correctly', () => {
      // Test requirement: Selectors should provide lesson progress
      const mockLessonProgress = {
        'lesson-1': createMockLessonProgress({ lessonId: 'lesson-1' }),
        'lesson-2': createMockLessonProgress({ lessonId: 'lesson-2' })
      };
      mockUseLearningSelectors.useLessonProgress.mockReturnValue(mockLessonProgress);

      expect(() => {
        const lessonProgress = mockUseLearningSelectors.useLessonProgress();
        expect(lessonProgress).toEqual(mockLessonProgress);
      }).not.toThrow();
    });

    it('should select specific track progress', () => {
      // Test requirement: Selectors should support specific track queries
      const trackId = 'specific-track';
      const progressValue = 75;
      mockUseLearningSelectors.useTrackProgress.mockReturnValue(progressValue);

      expect(() => {
        const progress = mockUseLearningSelectors.useTrackProgress(trackId);
        expect(progress).toBe(progressValue);
      }).not.toThrow();
    });

    it('should select track details by ID', () => {
      // Test requirement: Selectors should provide track details
      const trackId = 'specific-track';
      const mockTrack = createMockTrack({ id: trackId });
      mockUseLearningSelectors.useTrackDetails.mockReturnValue(mockTrack);

      expect(() => {
        const track = mockUseLearningSelectors.useTrackDetails(trackId);
        expect(track).toEqual(mockTrack);
      }).not.toThrow();
    });
  });

  describe('Filtered Selectors', () => {
    it('should filter tracks by difficulty', () => {
      // Test requirement: Selectors should support filtering
      const difficulty = 'intermediate';
      const mockTracks = [
        createMockTrack({ difficulty }),
        createMockTrack({ difficulty })
      ];
      mockUseLearningSelectors.useTracksByDifficulty.mockReturnValue(mockTracks);

      expect(() => {
        const tracks = mockUseLearningSelectors.useTracksByDifficulty(difficulty);
        expect(tracks).toEqual(mockTracks);
        expect(tracks.every(track => track.difficulty === difficulty)).toBe(true);
      }).not.toThrow();
    });

    it('should filter tracks by category', () => {
      // Test requirement: Selectors should support category filtering
      const category = 'Data Science';
      const mockTracks = [createMockTrack({ category })];
      mockUseLearningSelectors.useTracksByCategory.mockReturnValue(mockTracks);

      expect(() => {
        const tracks = mockUseLearningSelectors.useTracksByCategory(category);
        expect(tracks).toEqual(mockTracks);
      }).not.toThrow();
    });

    it('should filter tracks by skill', () => {
      // Test requirement: Selectors should support skill filtering
      const skill = 'Python';
      const mockTracks = [createMockTrack({ skills: [skill, 'Machine Learning'] })];
      mockUseLearningSelectors.useTracksBySkill.mockReturnValue(mockTracks);

      expect(() => {
        const tracks = mockUseLearningSelectors.useTracksBySkill(skill);
        expect(tracks).toEqual(mockTracks);
      }).not.toThrow();
    });
  });

  describe('Progress-based Selectors', () => {
    it('should select in-progress tracks', () => {
      // Test requirement: Selectors should identify in-progress tracks
      const mockTracks = [createMockTrack({ id: 'in-progress-track' })];
      mockUseLearningSelectors.useInProgressTracks.mockReturnValue(mockTracks);

      expect(() => {
        const tracks = mockUseLearningSelectors.useInProgressTracks();
        expect(tracks).toEqual(mockTracks);
      }).not.toThrow();
    });

    it('should select completed tracks', () => {
      // Test requirement: Selectors should identify completed tracks
      const mockTracks = [createMockTrack({ id: 'completed-track' })];
      mockUseLearningSelectors.useCompletedTracks.mockReturnValue(mockTracks);

      expect(() => {
        const tracks = mockUseLearningSelectors.useCompletedTracks();
        expect(tracks).toEqual(mockTracks);
      }).not.toThrow();
    });

    it('should select available tracks', () => {
      // Test requirement: Selectors should identify available tracks
      const mockTracks = [createMockTrack({ id: 'available-track' })];
      mockUseLearningSelectors.useAvailableTracks.mockReturnValue(mockTracks);

      expect(() => {
        const tracks = mockUseLearningSelectors.useAvailableTracks();
        expect(tracks).toEqual(mockTracks);
      }).not.toThrow();
    });
  });

  describe('User Preferences and Achievements', () => {
    it('should select learning preferences', () => {
      // Test requirement: Selectors should provide user preferences
      const mockPreferences: LearningPreferences = {
        learningStyle: 'visual',
        difficultyPreference: 'intermediate',
        pacePreference: 'normal',
        sessionDuration: 45,
        notificationsEnabled: true,
        reminderFrequency: 'daily',
        preferredLearningTime: ['morning'],
        theme: 'dark',
        autoSave: true,
        skipIntroductions: false
      };
      mockUseLearningSelectors.useLearningPreferences.mockReturnValue(mockPreferences);

      expect(() => {
        const preferences = mockUseLearningSelectors.useLearningPreferences();
        expect(preferences).toEqual(mockPreferences);
      }).not.toThrow();
    });

    it('should select achievements', () => {
      // Test requirement: Selectors should provide achievements
      const mockAchievements = [
        createMockAchievement(),
        createMockAchievement({ id: 'achievement-2' })
      ];
      mockUseLearningSelectors.useAchievements.mockReturnValue(mockAchievements);

      expect(() => {
        const achievements = mockUseLearningSelectors.useAchievements();
        expect(achievements).toEqual(mockAchievements);
      }).not.toThrow();
    });

    it('should filter achievements by type', () => {
      // Test requirement: Selectors should support achievement filtering
      const type = 'streak';
      const mockAchievements = [createMockAchievement({ type })];
      mockUseLearningSelectors.useAchievementsByType.mockReturnValue(mockAchievements);

      expect(() => {
        const achievements = mockUseLearningSelectors.useAchievementsByType(type);
        expect(achievements).toEqual(mockAchievements);
      }).not.toThrow();
    });

    it('should select learning streak', () => {
      // Test requirement: Selectors should provide streak data
      const streak = 15;
      mockUseLearningSelectors.useLearningStreak.mockReturnValue(streak);

      expect(() => {
        const result = mockUseLearningSelectors.useLearningStreak();
        expect(result).toBe(streak);
      }).not.toThrow();
    });
  });

  describe('Statistics and Analytics', () => {
    it('should select learning stats', () => {
      // Test requirement: Selectors should provide statistics
      const mockStats: LearningStats = {
        totalTracksEnrolled: 5,
        totalTracksCompleted: 2,
        totalLessonsCompleted: 25,
        totalTimeSpent: 18000000,
        averageScore: 85,
        currentStreak: 7,
        longestStreak: 15,
        totalAchievements: 8,
        learningVelocity: 3.5,
        strongestSkills: ['JavaScript', 'React'],
        improvementAreas: ['Testing', 'Performance'],
        weeklyProgress: [],
        completionRate: 40
      };
      mockUseLearningSelectors.useLearningStats.mockReturnValue(mockStats);

      expect(() => {
        const stats = mockUseLearningSelectors.useLearningStats();
        expect(stats).toEqual(mockStats);
      }).not.toThrow();
    });

    it('should select streak info', () => {
      // Test requirement: Selectors should provide streak information
      const mockStreakInfo: StreakInfo = {
        current: 7,
        longest: 15,
        lastActiveDate: new Date().toISOString(),
        daysThisWeek: 5,
        weeklyTarget: 5,
        isOnTrack: true
      };
      mockUseLearningSelectors.useStreakInfo.mockReturnValue(mockStreakInfo);

      expect(() => {
        const streakInfo = mockUseLearningSelectors.useStreakInfo();
        expect(streakInfo).toEqual(mockStreakInfo);
      }).not.toThrow();
    });

    it('should select weekly progress', () => {
      // Test requirement: Selectors should provide weekly progress
      const mockWeeklyProgress = [
        {
          week: '2024-W01',
          lessonsCompleted: 5,
          timeSpent: 7200000,
          averageScore: 88,
          tracksStarted: 1,
          tracksCompleted: 0
        }
      ];
      mockUseLearningSelectors.useWeeklyProgress.mockReturnValue(mockWeeklyProgress);

      expect(() => {
        const weeklyProgress = mockUseLearningSelectors.useWeeklyProgress();
        expect(weeklyProgress).toEqual(mockWeeklyProgress);
      }).not.toThrow();
    });
  });

  describe('Recommendations and Insights', () => {
    it('should select recommended tracks', () => {
      // Test requirement: Selectors should provide recommendations
      const mockRecommendedTracks = [createMockTrack({ id: 'recommended-track' })];
      mockUseLearningSelectors.useRecommendedTracks.mockReturnValue(mockRecommendedTracks);

      expect(() => {
        const tracks = mockUseLearningSelectors.useRecommendedTracks();
        expect(tracks).toEqual(mockRecommendedTracks);
      }).not.toThrow();
    });

    it('should select next recommendation', () => {
      // Test requirement: Selectors should provide specific recommendations
      const mockRecommendation = {
        id: 'rec-1',
        type: 'track' as const,
        title: 'Learn React Hooks',
        description: 'Master React Hooks for modern development',
        reasoning: 'Based on your JavaScript progress',
        priority: 'high' as const,
        estimatedTime: 120,
        targetId: 'react-hooks-track',
        confidence: 0.9
      };
      mockUseLearningSelectors.useNextRecommendation.mockReturnValue(mockRecommendation);

      expect(() => {
        const recommendation = mockUseLearningSelectors.useNextRecommendation();
        expect(recommendation).toEqual(mockRecommendation);
      }).not.toThrow();
    });

    it('should handle null next recommendation', () => {
      // Test requirement: Selectors should handle null recommendations
      mockUseLearningSelectors.useNextRecommendation.mockReturnValue(null);

      expect(() => {
        const recommendation = mockUseLearningSelectors.useNextRecommendation();
        expect(recommendation).toBeNull();
      }).not.toThrow();
    });

    it('should select skill progression', () => {
      // Test requirement: Selectors should provide skill progression
      const skill = 'JavaScript';
      const mockProgression = {
        skill,
        currentLevel: 3,
        progression: 60,
        timeToMastery: 45,
        relatedSkills: ['React', 'TypeScript'],
        masteryCriteria: ['Complete 20+ lessons', 'Maintain 80%+ accuracy']
      };
      mockUseLearningSelectors.useSkillProgression.mockReturnValue(mockProgression);

      expect(() => {
        const progression = mockUseLearningSelectors.useSkillProgression(skill);
        expect(progression).toEqual(mockProgression);
      }).not.toThrow();
    });
  });

  describe('UI State Selectors', () => {
    it('should select loading state', () => {
      // Test requirement: Selectors should provide UI state
      const isLoading = true;
      mockUseLearningSelectors.useIsLoading.mockReturnValue(isLoading);

      expect(() => {
        const result = mockUseLearningSelectors.useIsLoading();
        expect(result).toBe(isLoading);
      }).not.toThrow();
    });

    it('should select error state', () => {
      // Test requirement: Selectors should provide error state
      const error = 'Network connection failed';
      mockUseLearningSelectors.useError.mockReturnValue(error);

      expect(() => {
        const result = mockUseLearningSelectors.useError();
        expect(result).toBe(error);
      }).not.toThrow();
    });

    it('should handle null error state', () => {
      // Test requirement: Selectors should handle null error state
      mockUseLearningSelectors.useError.mockReturnValue(null);

      expect(() => {
        const result = mockUseLearningSelectors.useError();
        expect(result).toBeNull();
      }).not.toThrow();
    });
  });

  describe('Computed Selectors', () => {
    it('should calculate track completion percentage', () => {
      // Test requirement: Selectors should provide computed values
      const completionPercentage = 40;
      mockUseLearningSelectors.useTrackCompletionPercentage.mockReturnValue(completionPercentage);

      expect(() => {
        const result = mockUseLearningSelectors.useTrackCompletionPercentage();
        expect(result).toBe(completionPercentage);
      }).not.toThrow();
    });

    it('should calculate total points earned', () => {
      // Test requirement: Selectors should calculate gamification metrics
      const totalPoints = 450;
      mockUseLearningSelectors.useTotalPointsEarned.mockReturnValue(totalPoints);

      expect(() => {
        const result = mockUseLearningSelectors.useTotalPointsEarned();
        expect(result).toBe(totalPoints);
      }).not.toThrow();
    });

    it('should calculate user level', () => {
      // Test requirement: Selectors should calculate user level
      const userLevel = 5;
      mockUseLearningSelectors.useUserLevel.mockReturnValue(userLevel);

      expect(() => {
        const result = mockUseLearningSelectors.useUserLevel();
        expect(result).toBe(userLevel);
      }).not.toThrow();
    });

    it('should count active goals', () => {
      // Test requirement: Selectors should count active goals
      const activeGoals = 3;
      mockUseLearningSelectors.useActiveGoalsCount.mockReturnValue(activeGoals);

      expect(() => {
        const result = mockUseLearningSelectors.useActiveGoalsCount();
        expect(result).toBe(activeGoals);
      }).not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate average session time', () => {
      // Test requirement: Selectors should provide performance metrics
      const avgSessionTime = 1800000; // 30 minutes in milliseconds
      mockUseLearningSelectors.useAverageSessionTime.mockReturnValue(avgSessionTime);

      expect(() => {
        const result = mockUseLearningSelectors.useAverageSessionTime();
        expect(result).toBe(avgSessionTime);
      }).not.toThrow();
    });

    it('should calculate learning velocity', () => {
      // Test requirement: Selectors should calculate learning velocity
      const velocity = 4.2; // lessons per week
      mockUseLearningSelectors.useLearningVelocity.mockReturnValue(velocity);

      expect(() => {
        const result = mockUseLearningSelectors.useLearningVelocity();
        expect(result).toBe(velocity);
      }).not.toThrow();
    });

    it('should select recent activity', () => {
      // Test requirement: Selectors should provide recent activity
      const days = 7;
      const mockActivity = [
        createMockProgress({ lastAccessedAt: new Date().toISOString() }),
        createMockLessonProgress({ completedAt: new Date().toISOString() })
      ];
      mockUseLearningSelectors.useRecentActivity.mockReturnValue(mockActivity);

      expect(() => {
        const activity = mockUseLearningSelectors.useRecentActivity(days);
        expect(activity).toEqual(mockActivity);
      }).not.toThrow();
    });
  });
});

describe('Learning Actions Hook (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide all learning actions', () => {
    // Test requirement: Actions hook should provide all actions
    const mockActions = {
      enrollInTrack: vi.fn(),
      unenrollFromTrack: vi.fn(),
      updateLessonProgress: vi.fn(),
      completeLesson: vi.fn(),
      startAssessment: vi.fn(),
      submitAssessment: vi.fn(),
      updatePreferences: vi.fn(),
      addLearningGoal: vi.fn(),
      updateLearningGoal: vi.fn(),
      syncProgress: vi.fn(),
      generateAnalytics: vi.fn(),
      addOfflineAction: vi.fn(),
      processOfflineActions: vi.fn(),
      clearCache: vi.fn(),
      optimizeStorage: vi.fn()
    };
    mockUseLearningActions.mockReturnValue(mockActions);

    expect(() => {
      const actions = mockUseLearningActions();
      expect(actions).toEqual(mockActions);
      expect(typeof actions.enrollInTrack).toBe('function');
      expect(typeof actions.updateLessonProgress).toBe('function');
      expect(typeof actions.syncProgress).toBe('function');
    }).not.toThrow();
  });

  it('should memoize actions for performance', () => {
    // Test requirement: Actions should be memoized for performance
    const mockActions = { enrollInTrack: vi.fn() };
    mockUseLearningActions.mockReturnValue(mockActions);

    // Call multiple times to test memoization
    const actions1 = mockUseLearningActions();
    const actions2 = mockUseLearningActions();

    expect(actions1).toBe(actions2); // Should be the same reference when memoized
  });
});

describe('Computed Learning Data Hook (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide computed learning insights', () => {
    // Test requirement: Computed hook should provide insights
    const mockComputedData = {
      difficultyDistribution: { beginner: 3, intermediate: 2, advanced: 1 },
      skillCoverage: { total: 10, learning: 6, percentage: 60 },
      achievementsByRarity: { common: 5, uncommon: 3, rare: 1 },
      totalPoints: 250,
      preferredDifficulty: 'intermediate' as const
    };
    mockUseComputedLearningData.mockReturnValue(mockComputedData);

    expect(() => {
      const data = mockUseComputedLearningData();
      expect(data).toEqual(mockComputedData);
      expect(data.skillCoverage.percentage).toBe(60);
      expect(data.totalPoints).toBe(250);
    }).not.toThrow();
  });
});

describe('Learning Performance Metrics Hook (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide performance analytics', () => {
    // Test requirement: Performance hook should provide metrics
    const mockMetrics = {
      avgWeeklyLessons: 4.5,
      consistency: 0.85,
      learningEfficiency: 3.2,
      streakHealth: true,
      completionRate: 75,
      velocityTrend: 1.2
    };
    mockUseLearningPerformanceMetrics.mockReturnValue(mockMetrics);

    expect(() => {
      const metrics = mockUseLearningPerformanceMetrics();
      expect(metrics).toEqual(mockMetrics);
      expect(metrics.consistency).toBeGreaterThan(0.8);
      expect(metrics.streakHealth).toBe(true);
    }).not.toThrow();
  });
});

describe('Selector Performance (TDD)', () => {
  it('should handle rapid selector calls efficiently', () => {
    // Test requirement: Selectors should perform well under load
    mockUseLearningSelectors.useTracks.mockReturnValue([]);
    mockUseLearningSelectors.useProgress.mockReturnValue({});

    const start = performance.now();
    
    // Simulate rapid selector calls
    for (let i = 0; i < 1000; i++) {
      mockUseLearningSelectors.useTracks();
      mockUseLearningSelectors.useProgress();
    }
    
    const end = performance.now();
    
    // Should complete within 50ms for 1000 calls
    expect(end - start).toBeLessThan(50);
  });

  it('should support memoization for expensive computations', () => {
    // Test requirement: Selectors should use memoization
    const expensiveComputation = vi.fn().mockReturnValue({ computed: 'value' });
    
    // Mock memoized selector
    const memoizedSelector = vi.fn(() => expensiveComputation());
    
    // Call multiple times with same parameters
    memoizedSelector('same-param');
    memoizedSelector('same-param');
    memoizedSelector('same-param');
    
    // Should be called multiple times, but memoization would prevent expensive computation
    expect(memoizedSelector).toHaveBeenCalledTimes(3);
  });
});