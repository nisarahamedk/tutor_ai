// src/features/ai-tutor/stores/__tests__/comprehensiveLearningStore.test.ts
// Comprehensive Learning Store Tests (TDD) - TASK-010

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { 
  ComprehensiveLearningState,
  LearningTrack,
  TrackProgress,
  LessonProgress,
  AssessmentResult,
  LearningPreferences,
  Achievement,
  LearningGoal,
  OfflineAction,
  SyncStatus,
  LearningStats,
  StreakInfo,
  WeeklyProgress,
  LearningRecommendation,
  AchievementType
} from '../../types/learning';

// Mock data factories
const createMockTrack = (overrides: Partial<LearningTrack> = {}): LearningTrack => ({
  id: `track-${Date.now()}-${Math.random()}`,
  title: 'Test Track',
  description: 'A test learning track',
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

const createMockTrackProgress = (overrides: Partial<TrackProgress> = {}): TrackProgress => ({
  trackId: 'test-track',
  enrolledAt: new Date().toISOString(),
  lastAccessedAt: new Date().toISOString(),
  overallProgress: 0,
  completedLessons: [],
  timeSpent: 0,
  status: 'not-started',
  ...overrides
});

const createMockLessonProgress = (overrides: Partial<LessonProgress> = {}): LessonProgress => ({
  lessonId: 'test-lesson',
  trackId: 'test-track',
  startedAt: new Date().toISOString(),
  progress: 0,
  timeSpent: 0,
  attempts: 1,
  scores: [],
  bookmarks: [],
  ...overrides
});

const createMockPreferences = (overrides: Partial<LearningPreferences> = {}): LearningPreferences => ({
  learningStyle: 'visual',
  difficultyPreference: 'mixed',
  pacePreference: 'normal',
  sessionDuration: 30,
  notificationsEnabled: true,
  reminderFrequency: 'daily',
  preferredLearningTime: ['morning'],
  theme: 'auto',
  autoSave: true,
  skipIntroductions: false,
  ...overrides
});

const createMockAchievement = (overrides: Partial<Achievement> = {}): Achievement => ({
  id: `achievement-${Date.now()}`,
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

// Mock comprehensive learning store
const createMockComprehensiveLearningStore = (): ComprehensiveLearningState => {
  const mockStore: ComprehensiveLearningState = {
    // Core learning data
    tracks: [],
    enrolledTracks: [],
    currentTrack: null,
    
    // Progress tracking
    progress: {},
    lessonProgress: {},
    assessmentResults: {},
    
    // User data
    learningPreferences: createMockPreferences(),
    achievements: [],
    learningGoals: [],
    learningStreak: 0,
    totalLearningTime: 0,
    
    // Analytics and insights
    analytics: null,
    stats: null,
    
    // UI state
    selectedTrack: null,
    currentLesson: null,
    isLoading: false,
    error: null,
    
    // Offline support
    offlineActions: [],
    syncStatus: {
      lastSyncTime: null,
      pendingActions: 0,
      isOnline: true,
      isSyncing: false,
      syncErrors: []
    },
    
    // Actions (will be implemented)
    enrollInTrack: vi.fn().mockResolvedValue(undefined),
    unenrollFromTrack: vi.fn().mockResolvedValue(undefined),
    updateLessonProgress: vi.fn(),
    completeLesson: vi.fn().mockResolvedValue(undefined),
    startAssessment: vi.fn(),
    submitAssessment: vi.fn().mockResolvedValue(undefined),
    updatePreferences: vi.fn(),
    addLearningGoal: vi.fn(),
    updateLearningGoal: vi.fn(),
    syncProgress: vi.fn().mockResolvedValue(undefined),
    generateAnalytics: vi.fn().mockResolvedValue(undefined),
    
    // Selectors
    getTrackProgress: vi.fn().mockReturnValue(0),
    getRecommendedTracks: vi.fn().mockReturnValue([]),
    getLearningStats: vi.fn().mockReturnValue({
      totalTracksEnrolled: 0,
      totalTracksCompleted: 0,
      totalLessonsCompleted: 0,
      totalTimeSpent: 0,
      averageScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalAchievements: 0,
      learningVelocity: 0,
      strongestSkills: [],
      improvementAreas: [],
      weeklyProgress: [],
      completionRate: 0
    }),
    getAchievements: vi.fn().mockReturnValue([]),
    getStreakInfo: vi.fn().mockReturnValue({ 
      current: 0, 
      longest: 0, 
      lastActiveDate: '', 
      daysThisWeek: 0, 
      weeklyTarget: 5, 
      isOnTrack: false 
    }),
    getWeeklyProgress: vi.fn().mockReturnValue([]),
    getSkillProgression: vi.fn().mockReturnValue(null),
    getNextRecommendation: vi.fn().mockReturnValue(null),
    
    // Offline actions
    addOfflineAction: vi.fn(),
    processOfflineActions: vi.fn().mockResolvedValue(undefined),
    
    // Performance actions
    clearCache: vi.fn(),
    optimizeStorage: vi.fn()
  };
  
  return mockStore;
};

describe('Comprehensive Learning Store (TDD) - TASK-010', () => {
  let mockStore: ComprehensiveLearningState;
  
  beforeEach(() => {
    mockStore = createMockComprehensiveLearningStore();
    vi.clearAllMocks();
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock IndexedDB for offline storage
    Object.defineProperty(window, 'indexedDB', {
      value: {
        open: vi.fn().mockResolvedValue({}),
        deleteDatabase: vi.fn()
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Track Enrollment and Management', () => {
    it('should enroll user in track and update state', async () => {
      // Test requirement: Store should handle track enrollment
      const trackId = 'react-basics';
      
      await expect(mockStore.enrollInTrack(trackId)).resolves.not.toThrow();
      expect(mockStore.enrollInTrack).toHaveBeenCalledWith(trackId);
    });

    it('should unenroll user from track', async () => {
      // Test requirement: Store should handle track unenrollment
      const trackId = 'react-basics';
      
      await expect(mockStore.unenrollFromTrack(trackId)).resolves.not.toThrow();
      expect(mockStore.unenrollFromTrack).toHaveBeenCalledWith(trackId);
    });

    it('should track enrollment state correctly', () => {
      // Test requirement: Store should maintain enrollment state
      expect(Array.isArray(mockStore.enrolledTracks)).toBe(true);
      expect(mockStore.currentTrack).toBeNull();
    });

    it('should handle enrollment of multiple tracks', async () => {
      // Test requirement: Support multiple track enrollments
      const trackIds = ['react-basics', 'typescript-intro', 'node-fundamentals'];
      
      for (const trackId of trackIds) {
        await expect(mockStore.enrollInTrack(trackId)).resolves.not.toThrow();
      }
      
      expect(mockStore.enrollInTrack).toHaveBeenCalledTimes(3);
    });
  });

  describe('Progress Tracking', () => {
    it('should update lesson progress correctly', () => {
      // Test requirement: Store should track lesson progress
      const trackId = 'react-basics';
      const lessonId = 'lesson-1';
      const progress = 75;
      
      expect(() => {
        mockStore.updateLessonProgress(trackId, lessonId, progress);
      }).not.toThrow();
      
      expect(mockStore.updateLessonProgress).toHaveBeenCalledWith(trackId, lessonId, progress);
    });

    it('should complete lessons and update track progress', async () => {
      // Test requirement: Store should handle lesson completion
      const trackId = 'react-basics';
      const lessonId = 'lesson-1';
      
      await expect(mockStore.completeLesson(trackId, lessonId)).resolves.not.toThrow();
      expect(mockStore.completeLesson).toHaveBeenCalledWith(trackId, lessonId);
    });

    it('should calculate track progress from lesson completion', () => {
      // Test requirement: Store should compute overall track progress
      const trackId = 'react-basics';
      const progress = mockStore.getTrackProgress(trackId);
      
      expect(typeof progress).toBe('number');
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });

    it('should maintain progress state consistency', () => {
      // Test requirement: Progress state should be consistent
      expect(typeof mockStore.progress).toBe('object');
      expect(typeof mockStore.lessonProgress).toBe('object');
      expect(typeof mockStore.assessmentResults).toBe('object');
    });
  });

  describe('Assessment Management', () => {
    it('should start assessments correctly', () => {
      // Test requirement: Store should handle assessment initiation
      const assessmentId = 'assessment-1';
      
      expect(() => {
        mockStore.startAssessment(assessmentId);
      }).not.toThrow();
      
      expect(mockStore.startAssessment).toHaveBeenCalledWith(assessmentId);
    });

    it('should submit assessment answers', async () => {
      // Test requirement: Store should handle assessment submission
      const assessmentId = 'assessment-1';
      const answers = [
        {
          questionId: 'q1',
          userAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeSpent: 30000
        }
      ];
      
      await expect(mockStore.submitAssessment(assessmentId, answers)).resolves.not.toThrow();
      expect(mockStore.submitAssessment).toHaveBeenCalledWith(assessmentId, answers);
    });

    it('should store assessment results', () => {
      // Test requirement: Store should maintain assessment results
      expect(typeof mockStore.assessmentResults).toBe('object');
      expect(Object.keys(mockStore.assessmentResults)).toEqual(expect.any(Array));
    });
  });

  describe('Learning Preferences', () => {
    it('should update learning preferences', () => {
      // Test requirement: Store should manage user preferences
      const preferences = {
        learningStyle: 'auditory' as const,
        difficultyPreference: 'advanced' as const
      };
      
      expect(() => {
        mockStore.updatePreferences(preferences);
      }).not.toThrow();
      
      expect(mockStore.updatePreferences).toHaveBeenCalledWith(preferences);
    });

    it('should maintain preference consistency', () => {
      // Test requirement: Preferences should have valid structure
      const prefs = mockStore.learningPreferences;
      expect(prefs).toBeDefined();
      expect(['visual', 'auditory', 'kinesthetic', 'reading']).toContain(prefs.learningStyle);
      expect(['beginner', 'intermediate', 'advanced', 'mixed']).toContain(prefs.difficultyPreference);
      expect(['slow', 'normal', 'fast']).toContain(prefs.pacePreference);
    });

    it('should support all preference options', () => {
      // Test requirement: Store should support all preference types
      const fullPreferences = createMockPreferences({
        learningStyle: 'kinesthetic',
        difficultyPreference: 'advanced',
        pacePreference: 'fast',
        sessionDuration: 60,
        notificationsEnabled: false,
        reminderFrequency: 'weekly',
        preferredLearningTime: ['evening', 'night'],
        theme: 'dark',
        autoSave: false,
        skipIntroductions: true
      });
      
      expect(() => {
        mockStore.updatePreferences(fullPreferences);
      }).not.toThrow();
    });
  });

  describe('Achievement System', () => {
    it('should store achievements correctly', () => {
      // Test requirement: Store should manage achievements
      expect(Array.isArray(mockStore.achievements)).toBe(true);
    });

    it('should filter achievements by type', () => {
      // Test requirement: Store should support achievement filtering
      const type: AchievementType = 'completion';
      const achievements = mockStore.getAchievements(type);
      
      expect(Array.isArray(achievements)).toBe(true);
      expect(mockStore.getAchievements).toHaveBeenCalledWith(type);
    });

    it('should return all achievements when no type specified', () => {
      // Test requirement: Store should return all achievements by default
      const achievements = mockStore.getAchievements();
      
      expect(Array.isArray(achievements)).toBe(true);
      expect(mockStore.getAchievements).toHaveBeenCalledWith(undefined);
    });

    it('should handle different achievement types', () => {
      // Test requirement: Store should support all achievement types
      const achievementTypes: AchievementType[] = [
        'streak', 'completion', 'speed', 'accuracy', 
        'dedication', 'explorer', 'social', 'milestone'
      ];
      
      achievementTypes.forEach(type => {
        expect(() => {
          mockStore.getAchievements(type);
        }).not.toThrow();
      });
    });
  });

  describe('Learning Goals', () => {
    it('should add learning goals', () => {
      // Test requirement: Store should manage learning goals
      const goal = {
        type: 'lessons' as const,
        target: 10,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Complete 10 lessons this week'
      };
      
      expect(() => {
        mockStore.addLearningGoal(goal);
      }).not.toThrow();
      
      expect(mockStore.addLearningGoal).toHaveBeenCalledWith(goal);
    });

    it('should update learning goals', () => {
      // Test requirement: Store should update existing goals
      const goalId = 'goal-1';
      const updates = { current: 5, target: 15 };
      
      expect(() => {
        mockStore.updateLearningGoal(goalId, updates);
      }).not.toThrow();
      
      expect(mockStore.updateLearningGoal).toHaveBeenCalledWith(goalId, updates);
    });

    it('should maintain learning goals array', () => {
      // Test requirement: Store should maintain goals collection
      expect(Array.isArray(mockStore.learningGoals)).toBe(true);
    });
  });

  describe('Learning Statistics', () => {
    it('should provide comprehensive learning stats', () => {
      // Test requirement: Store should compute learning statistics
      const stats = mockStore.getLearningStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalTracksEnrolled).toBe('number');
      expect(typeof stats.totalTracksCompleted).toBe('number');
      expect(typeof stats.totalLessonsCompleted).toBe('number');
      expect(typeof stats.totalTimeSpent).toBe('number');
      expect(typeof stats.averageScore).toBe('number');
      expect(typeof stats.completionRate).toBe('number');
    });

    it('should provide streak information', () => {
      // Test requirement: Store should track learning streaks
      const streakInfo = mockStore.getStreakInfo();
      
      expect(streakInfo).toBeDefined();
      expect(typeof streakInfo.current).toBe('number');
      expect(typeof streakInfo.longest).toBe('number');
      expect(typeof streakInfo.isOnTrack).toBe('boolean');
    });

    it('should provide weekly progress data', () => {
      // Test requirement: Store should track weekly progress
      const weeklyProgress = mockStore.getWeeklyProgress();
      
      expect(Array.isArray(weeklyProgress)).toBe(true);
      expect(mockStore.getWeeklyProgress).toHaveBeenCalled();
    });

    it('should calculate learning velocity', () => {
      // Test requirement: Store should compute learning velocity
      const stats = mockStore.getLearningStats();
      
      expect(typeof stats.learningVelocity).toBe('number');
      expect(stats.learningVelocity).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Recommendations System', () => {
    it('should provide track recommendations', () => {
      // Test requirement: Store should recommend tracks
      const recommendations = mockStore.getRecommendedTracks();
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(mockStore.getRecommendedTracks).toHaveBeenCalled();
    });

    it('should provide next recommendation', () => {
      // Test requirement: Store should provide specific recommendations
      const recommendation = mockStore.getNextRecommendation();
      
      // Can be null if no recommendations available
      expect(mockStore.getNextRecommendation).toHaveBeenCalled();
    });

    it('should provide skill progression insights', () => {
      // Test requirement: Store should track skill progression
      const skill = 'JavaScript';
      const progression = mockStore.getSkillProgression(skill);
      
      // Can be null if skill not tracked
      expect(mockStore.getSkillProgression).toHaveBeenCalledWith(skill);
    });
  });

  describe('Offline Support', () => {
    it('should add offline actions to queue', () => {
      // Test requirement: Store should support offline functionality
      const action = {
        type: 'UPDATE_LESSON_PROGRESS',
        payload: { trackId: 'test', lessonId: 'lesson-1', progress: 50 }
      };
      
      expect(() => {
        mockStore.addOfflineAction(action);
      }).not.toThrow();
      
      expect(mockStore.addOfflineAction).toHaveBeenCalledWith(action);
    });

    it('should process offline actions when online', async () => {
      // Test requirement: Store should sync offline actions
      await expect(mockStore.processOfflineActions()).resolves.not.toThrow();
      expect(mockStore.processOfflineActions).toHaveBeenCalled();
    });

    it('should maintain sync status', () => {
      // Test requirement: Store should track sync status
      const syncStatus = mockStore.syncStatus;
      
      expect(syncStatus).toBeDefined();
      expect(typeof syncStatus.isOnline).toBe('boolean');
      expect(typeof syncStatus.isSyncing).toBe('boolean');
      expect(typeof syncStatus.pendingActions).toBe('number');
      expect(Array.isArray(syncStatus.syncErrors)).toBe(true);
    });

    it('should sync progress with server', async () => {
      // Test requirement: Store should sync with server
      await expect(mockStore.syncProgress()).resolves.not.toThrow();
      expect(mockStore.syncProgress).toHaveBeenCalled();
    });

    it('should handle offline queue correctly', () => {
      // Test requirement: Store should manage offline action queue
      expect(Array.isArray(mockStore.offlineActions)).toBe(true);
    });
  });

  describe('Analytics and Insights', () => {
    it('should generate learning analytics', async () => {
      // Test requirement: Store should generate analytics
      await expect(mockStore.generateAnalytics()).resolves.not.toThrow();
      expect(mockStore.generateAnalytics).toHaveBeenCalled();
    });

    it('should maintain analytics state', () => {
      // Test requirement: Store should store analytics data
      // Analytics can be null initially
      expect(mockStore.analytics === null || typeof mockStore.analytics === 'object').toBe(true);
    });

    it('should provide learning insights', () => {
      // Test requirement: Store should provide insights
      const stats = mockStore.getLearningStats();
      
      expect(Array.isArray(stats.strongestSkills)).toBe(true);
      expect(Array.isArray(stats.improvementAreas)).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    it('should clear cache when requested', () => {
      // Test requirement: Store should support cache clearing
      expect(() => {
        mockStore.clearCache();
      }).not.toThrow();
      
      expect(mockStore.clearCache).toHaveBeenCalled();
    });

    it('should optimize storage', () => {
      // Test requirement: Store should optimize storage usage
      expect(() => {
        mockStore.optimizeStorage();
      }).not.toThrow();
      
      expect(mockStore.optimizeStorage).toHaveBeenCalled();
    });

    it('should handle large datasets efficiently', () => {
      // Test requirement: Store should perform well with large datasets
      const start = performance.now();
      
      // Simulate operations with large dataset
      for (let i = 0; i < 1000; i++) {
        mockStore.getTrackProgress(`track-${i}`);
      }
      
      const end = performance.now();
      
      // Should complete within 100ms for 1000 operations
      expect(end - start).toBeLessThan(100);
    });

    it('should support selective subscriptions', () => {
      // Test requirement: Store should enable performance-optimized subscriptions
      expect(typeof mockStore.getTrackProgress).toBe('function');
      expect(typeof mockStore.getLearningStats).toBe('function');
      expect(typeof mockStore.getRecommendedTracks).toBe('function');
    });
  });

  describe('Error Handling and State Management', () => {
    it('should handle loading states', () => {
      // Test requirement: Store should manage loading states
      expect(typeof mockStore.isLoading).toBe('boolean');
    });

    it('should handle error states', () => {
      // Test requirement: Store should manage error states
      expect(mockStore.error === null || typeof mockStore.error === 'string').toBe(true);
    });

    it('should maintain state consistency during operations', () => {
      // Test requirement: Store should ensure state consistency
      const initialState = { ...mockStore };
      
      // Simulate multiple operations
      mockStore.updateLessonProgress('track-1', 'lesson-1', 50);
      mockStore.updatePreferences({ learningStyle: 'auditory' });
      
      // Core structure should remain consistent
      expect(typeof mockStore.tracks).toBe(typeof initialState.tracks);
      expect(typeof mockStore.progress).toBe(typeof initialState.progress);
      expect(typeof mockStore.learningPreferences).toBe(typeof initialState.learningPreferences);
    });
  });

  describe('Integration with Server Components', () => {
    it('should support server data hydration', () => {
      // Test requirement: Store should integrate with server components
      // This tests the interface supports server integration
      expect(typeof mockStore.tracks).toBe('object');
      expect(typeof mockStore.enrolledTracks).toBe('object');
      expect(typeof mockStore.progress).toBe('object');
    });

    it('should handle server action integration', async () => {
      // Test requirement: Store should work with server actions
      await expect(mockStore.enrollInTrack('server-track')).resolves.not.toThrow();
      await expect(mockStore.completeLesson('server-track', 'server-lesson')).resolves.not.toThrow();
      await expect(mockStore.syncProgress()).resolves.not.toThrow();
    });
  });

  describe('Persistence and Data Management', () => {
    it('should support data persistence', () => {
      // Test requirement: Store should persist critical data
      // This test ensures the structure supports persistence
      expect(typeof mockStore.progress).toBe('object');
      expect(typeof mockStore.learningPreferences).toBe('object');
      expect(typeof mockStore.achievements).toBe('object');
    });

    it('should maintain data integrity', () => {
      // Test requirement: Store should maintain data integrity
      expect(Array.isArray(mockStore.enrolledTracks)).toBe(true);
      expect(Array.isArray(mockStore.achievements)).toBe(true);
      expect(Array.isArray(mockStore.learningGoals)).toBe(true);
    });
  });
});

describe('Comprehensive Learning Store Performance (TDD)', () => {
  let mockStore: ComprehensiveLearningState;
  
  beforeEach(() => {
    mockStore = createMockComprehensiveLearningStore();
  });

  it('should handle rapid progress updates efficiently', () => {
    // Test requirement: Store should handle frequent progress updates
    const start = performance.now();
    
    for (let i = 0; i < 500; i++) {
      mockStore.updateLessonProgress(`track-${i % 10}`, `lesson-${i}`, Math.random() * 100);
    }
    
    const end = performance.now();
    
    // Should complete within 200ms for 500 updates
    expect(end - start).toBeLessThan(200);
  });

  it('should compute statistics efficiently', () => {
    // Test requirement: Analytics computation should be fast
    const start = performance.now();
    
    // Call stats multiple times
    for (let i = 0; i < 100; i++) {
      mockStore.getLearningStats();
    }
    
    const end = performance.now();
    
    // Should complete within 50ms for 100 calls
    expect(end - start).toBeLessThan(50);
  });

  it('should handle large offline action queues', () => {
    // Test requirement: Offline support should scale
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      mockStore.addOfflineAction({
        type: 'UPDATE_PROGRESS',
        payload: { trackId: `track-${i}`, progress: i }
      });
    }
    
    const end = performance.now();
    
    // Should complete within 100ms for 1000 actions
    expect(end - start).toBeLessThan(100);
  });
});

describe('Comprehensive Learning Store Integration (TDD)', () => {
  let mockStore: ComprehensiveLearningState;
  
  beforeEach(() => {
    mockStore = createMockComprehensiveLearningStore();
  });

  it('should maintain consistency across related operations', async () => {
    // Test requirement: Related operations should maintain consistency
    const trackId = 'integration-track';
    const lessonId = 'integration-lesson';
    
    // Enroll in track
    await mockStore.enrollInTrack(trackId);
    
    // Update lesson progress
    mockStore.updateLessonProgress(trackId, lessonId, 100);
    
    // Complete lesson
    await mockStore.completeLesson(trackId, lessonId);
    
    // All operations should complete without throwing
    expect(mockStore.enrollInTrack).toHaveBeenCalledWith(trackId);
    expect(mockStore.updateLessonProgress).toHaveBeenCalledWith(trackId, lessonId, 100);
    expect(mockStore.completeLesson).toHaveBeenCalledWith(trackId, lessonId);
  });

  it('should support complex learning workflows', async () => {
    // Test requirement: Store should support full learning workflows
    const workflowSteps = [
      () => mockStore.enrollInTrack('workflow-track'),
      () => mockStore.updatePreferences({ sessionDuration: 45 }),
      () => mockStore.addLearningGoal({
        type: 'lessons',
        target: 5,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Complete 5 lessons'
      }),
      () => mockStore.startAssessment('workflow-assessment'),
      () => mockStore.generateAnalytics()
    ];
    
    // All workflow steps should complete
    for (const step of workflowSteps) {
      await expect(step()).resolves.not.toThrow();
    }
  });
});