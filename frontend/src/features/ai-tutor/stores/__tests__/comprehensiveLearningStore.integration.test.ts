// src/features/ai-tutor/stores/__tests__/comprehensiveLearningStore.integration.test.ts
// Integration Tests for Comprehensive Learning Store (TASK-010)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import useComprehensiveLearningStore from '../comprehensiveLearningStore';

// Mock IndexedDB and other browser APIs
const mockIndexedDB = {
  open: vi.fn().mockResolvedValue({
    createObjectStore: vi.fn(),
    transaction: vi.fn().mockReturnValue({
      objectStore: vi.fn().mockReturnValue({
        add: vi.fn(),
        put: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        count: vi.fn(),
        createIndex: vi.fn(),
        index: vi.fn()
      })
    })
  }),
  deleteDatabase: vi.fn()
};

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: { onLine: true },
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock window for event listeners
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
});

describe('Comprehensive Learning Store Integration Tests (TASK-010)', () => {
  beforeEach(() => {
    // Reset store state completely
    useComprehensiveLearningStore.setState({
      enrolledTracks: [],
      currentTrack: null,
      progress: {},
      lessonProgress: {},
      assessmentResults: {},
      achievements: [],
      learningGoals: [],
      learningStreak: 0,
      totalLearningTime: 0,
      analytics: null,
      stats: null,
      selectedTrack: null,
      currentLesson: null,
      isLoading: false,
      error: null,
      offlineActions: []
    });
    vi.clearAllMocks();
  });

  describe('Track Enrollment Flow', () => {
    it('should enroll in track successfully', async () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      
      // Initial state
      expect(store.enrolledTracks).toHaveLength(0);
      expect(store.progress).toEqual({});
      
      // Enroll in track
      await act(async () => {
        await store.enrollInTrack(trackId);
      });
      
      const updatedState = useComprehensiveLearningStore.getState();
      
      // Verify enrollment
      expect(updatedState.enrolledTracks).toContain(trackId);
      expect(updatedState.progress[trackId]).toBeDefined();
      expect(updatedState.progress[trackId].status).toBe('not-started');
      expect(updatedState.currentTrack).toBe(trackId);
    });

    it('should prevent duplicate enrollments', async () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      
      // First enrollment
      await act(async () => {
        await store.enrollInTrack(trackId);
      });
      
      // Attempt duplicate enrollment
      await act(async () => {
        await expect(store.enrollInTrack(trackId)).rejects.toThrow('Already enrolled in this track');
      });
      
      const state = useComprehensiveLearningStore.getState();
      expect(state.enrolledTracks.filter(id => id === trackId)).toHaveLength(1);
    });

    it('should unenroll from track successfully', async () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      
      // First enroll
      await act(async () => {
        await store.enrollInTrack(trackId);
      });
      
      // Then unenroll
      await act(async () => {
        await store.unenrollFromTrack(trackId);
      });
      
      const state = useComprehensiveLearningStore.getState();
      expect(state.enrolledTracks).not.toContain(trackId);
      expect(state.progress[trackId]).toBeUndefined();
    });
  });

  describe('Progress Tracking', () => {
    it('should update lesson progress correctly', async () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      const lessonId = 'react-intro';
      
      // Enroll first
      await act(async () => {
        await store.enrollInTrack(trackId);
      });
      
      // Update lesson progress
      act(() => {
        store.updateLessonProgress(trackId, lessonId, 75);
      });
      
      const state = useComprehensiveLearningStore.getState();
      const lessonProgress = state.lessonProgress[lessonId];
      
      expect(lessonProgress).toBeDefined();
      expect(lessonProgress.progress).toBe(75);
      expect(lessonProgress.trackId).toBe(trackId);
      expect(lessonProgress.startedAt).toBeDefined();
    });

    it('should complete lesson and update track progress', async () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      const lessonId = 'react-intro';
      
      // Enroll first
      await act(async () => {
        await store.enrollInTrack(trackId);
      });
      
      // Complete lesson
      await act(async () => {
        await store.completeLesson(trackId, lessonId);
      });
      
      const state = useComprehensiveLearningStore.getState();
      const lessonProgress = state.lessonProgress[lessonId];
      const trackProgress = state.progress[trackId];
      
      expect(lessonProgress.progress).toBe(100);
      expect(lessonProgress.completedAt).toBeDefined();
      expect(trackProgress.completedLessons).toContain(lessonId);
      expect(trackProgress.status).toBe('in-progress');
    });

    it('should calculate track progress percentage', () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      
      const progress = store.getTrackProgress(trackId);
      expect(typeof progress).toBe('number');
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
    });
  });

  describe('Assessment Management', () => {
    it('should start assessment successfully', async () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      const assessmentId = 'react-fundamentals-quiz';
      
      // Enroll first
      await act(async () => {
        await store.enrollInTrack(trackId);
      });
      
      // Start assessment
      act(() => {
        store.startAssessment(assessmentId);
      });
      
      const state = useComprehensiveLearningStore.getState();
      const assessmentResult = state.assessmentResults[assessmentId];
      
      expect(assessmentResult).toBeDefined();
      expect(assessmentResult.trackId).toBe(trackId);
      expect(assessmentResult.startedAt).toBeDefined();
      expect(assessmentResult.completedAt).toBeUndefined();
    });

    it('should submit assessment with results', async () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      const assessmentId = 'react-fundamentals-quiz';
      
      // Enroll and start assessment
      await act(async () => {
        await store.enrollInTrack(trackId);
      });
      
      act(() => {
        store.startAssessment(assessmentId);
      });
      
      // Submit assessment
      const answers = [
        {
          questionId: 'q1',
          userAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeSpent: 30000
        },
        {
          questionId: 'q2',
          userAnswer: 'B',
          correctAnswer: 'C',
          isCorrect: false,
          timeSpent: 45000
        }
      ];
      
      await act(async () => {
        await store.submitAssessment(assessmentId, answers);
      });
      
      const state = useComprehensiveLearningStore.getState();
      const result = state.assessmentResults[assessmentId];
      
      expect(result.completedAt).toBeDefined();
      expect(result.score).toBe(50); // 1 out of 2 correct
      expect(result.totalQuestions).toBe(2);
      expect(result.correctAnswers).toBe(1);
      expect(result.passed).toBe(false); // Below 70%
    });
  });

  describe('Learning Preferences', () => {
    it('should update preferences correctly', () => {
      const store = useComprehensiveLearningStore.getState();
      
      const newPreferences = {
        learningStyle: 'auditory' as const,
        difficultyPreference: 'advanced' as const,
        sessionDuration: 60
      };
      
      act(() => {
        store.updatePreferences(newPreferences);
      });
      
      const state = useComprehensiveLearningStore.getState();
      expect(state.learningPreferences.learningStyle).toBe('auditory');
      expect(state.learningPreferences.difficultyPreference).toBe('advanced');
      expect(state.learningPreferences.sessionDuration).toBe(60);
    });
  });

  describe('Learning Goals', () => {
    it('should add learning goal', () => {
      const store = useComprehensiveLearningStore.getState();
      
      const goal = {
        type: 'lessons' as const,
        target: 10,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Complete 10 lessons this week'
      };
      
      act(() => {
        store.addLearningGoal(goal);
      });
      
      const state = useComprehensiveLearningStore.getState();
      expect(state.learningGoals).toHaveLength(1);
      expect(state.learningGoals[0].type).toBe('lessons');
      expect(state.learningGoals[0].target).toBe(10);
      expect(state.learningGoals[0].current).toBe(0);
      expect(state.learningGoals[0].achieved).toBe(false);
    });

    it('should update learning goal', () => {
      const store = useComprehensiveLearningStore.getState();
      
      // Add goal first
      const goal = {
        type: 'lessons' as const,
        target: 10,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Complete 10 lessons this week'
      };
      
      act(() => {
        store.addLearningGoal(goal);
      });
      
      const state = useComprehensiveLearningStore.getState();
      const goalId = state.learningGoals[0].id;
      
      // Update goal
      act(() => {
        store.updateLearningGoal(goalId, { current: 5 });
      });
      
      const updatedState = useComprehensiveLearningStore.getState();
      expect(updatedState.learningGoals[0].current).toBe(5);
    });
  });

  describe('Statistics and Analytics', () => {
    it('should provide learning statistics', () => {
      const store = useComprehensiveLearningStore.getState();
      const stats = store.getLearningStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalTracksEnrolled).toBe('number');
      expect(typeof stats.totalLessonsCompleted).toBe('number');
      expect(typeof stats.averageScore).toBe('number');
      expect(typeof stats.completionRate).toBe('number');
    });

    it('should provide streak information', () => {
      const store = useComprehensiveLearningStore.getState();
      const streakInfo = store.getStreakInfo();
      
      expect(streakInfo).toBeDefined();
      expect(typeof streakInfo.current).toBe('number');
      expect(typeof streakInfo.longest).toBe('number');
      expect(typeof streakInfo.isOnTrack).toBe('boolean');
    });

    it('should generate analytics', async () => {
      const store = useComprehensiveLearningStore.getState();
      
      await act(async () => {
        await store.generateAnalytics();
      });
      
      const state = useComprehensiveLearningStore.getState();
      expect(state.analytics).toBeDefined();
      expect(state.stats).toBeDefined();
    });
  });

  describe('Recommendations', () => {
    it('should provide track recommendations', () => {
      const store = useComprehensiveLearningStore.getState();
      const recommendations = store.getRecommendedTracks();
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter recommendations by preferences', () => {
      const store = useComprehensiveLearningStore.getState();
      
      // Set preference for beginner tracks
      act(() => {
        store.updatePreferences({ difficultyPreference: 'beginner' });
      });
      
      const recommendations = store.getRecommendedTracks();
      const beginnerTracks = recommendations.filter(track => track.difficulty === 'beginner');
      
      // Should prioritize beginner tracks when that's the preference
      expect(beginnerTracks.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle enrollment errors gracefully', async () => {
      const store = useComprehensiveLearningStore.getState();
      
      await act(async () => {
        await expect(store.enrollInTrack('non-existent-track')).rejects.toThrow('Track not found');
      });
      
      const state = useComprehensiveLearningStore.getState();
      expect(state.error).toBeDefined();
      expect(state.isLoading).toBe(false);
    });

    it('should handle lesson progress errors', () => {
      const store = useComprehensiveLearningStore.getState();
      
      act(() => {
        store.updateLessonProgress('non-existent-track', 'lesson-1', 50);
      });
      
      const state = useComprehensiveLearningStore.getState();
      expect(state.error).toBe('Not enrolled in this track');
    });
  });

  describe('Performance', () => {
    it('should handle multiple rapid operations', async () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      
      // Enroll first
      await act(async () => {
        await store.enrollInTrack(trackId);
      });
      
      const start = performance.now();
      
      // Perform multiple rapid progress updates
      act(() => {
        for (let i = 0; i < 100; i++) {
          store.updateLessonProgress(trackId, `lesson-${i}`, Math.random() * 100);
        }
      });
      
      const end = performance.now();
      
      // Should complete within reasonable time
      expect(end - start).toBeLessThan(100);
      
      const state = useComprehensiveLearningStore.getState();
      expect(Object.keys(state.lessonProgress)).toHaveLength(100);
    });

    it('should optimize storage efficiently', () => {
      const store = useComprehensiveLearningStore.getState();
      
      const start = performance.now();
      
      act(() => {
        store.optimizeStorage();
      });
      
      const end = performance.now();
      
      // Storage optimization should be fast
      expect(end - start).toBeLessThan(50);
    });

    it('should clear cache efficiently', () => {
      const store = useComprehensiveLearningStore.getState();
      
      act(() => {
        store.clearCache();
      });
      
      const state = useComprehensiveLearningStore.getState();
      expect(state.analytics).toBeNull();
      expect(state.stats).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe('Complex Workflows', () => {
    it('should handle complete learning workflow', async () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      const lessonId = 'react-intro';
      const assessmentId = 'react-fundamentals-quiz';
      
      // 1. Update preferences
      act(() => {
        store.updatePreferences({ difficultyPreference: 'beginner' });
      });
      
      // 2. Enroll in track
      await act(async () => {
        await store.enrollInTrack(trackId);
      });
      
      // 3. Complete lesson
      await act(async () => {
        await store.completeLesson(trackId, lessonId);
      });
      
      // 4. Take assessment
      act(() => {
        store.startAssessment(assessmentId);
      });
      
      const answers = [
        {
          questionId: 'q1',
          userAnswer: 'A',
          correctAnswer: 'A',
          isCorrect: true,
          timeSpent: 30000
        }
      ];
      
      await act(async () => {
        await store.submitAssessment(assessmentId, answers);
      });
      
      // 5. Add learning goal
      act(() => {
        store.addLearningGoal({
          type: 'tracks',
          target: 1,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Complete one track this month'
        });
      });
      
      // 6. Generate analytics
      await act(async () => {
        await store.generateAnalytics();
      });
      
      const finalState = useComprehensiveLearningStore.getState();
      
      // Verify complete workflow
      expect(finalState.enrolledTracks).toContain(trackId);
      expect(finalState.lessonProgress[lessonId]).toBeDefined();
      expect(finalState.assessmentResults[assessmentId]).toBeDefined();
      expect(finalState.learningGoals).toHaveLength(1);
      expect(finalState.analytics).toBeDefined();
      expect(finalState.stats).toBeDefined();
    });
  });

  describe('State Consistency', () => {
    it('should maintain referential equality for unchanged data', () => {
      const store = useComprehensiveLearningStore.getState();
      
      const initialTracks = store.tracks;
      const initialPreferences = store.learningPreferences;
      
      // Update unrelated state
      act(() => {
        store.clearCache();
      });
      
      const newState = useComprehensiveLearningStore.getState();
      
      // These should remain the same objects
      expect(newState.tracks).toBe(initialTracks);
      expect(newState.learningPreferences).toBe(initialPreferences);
    });

    it('should update only relevant state on progress changes', async () => {
      const store = useComprehensiveLearningStore.getState();
      const trackId = 'react-fundamentals';
      
      await act(async () => {
        await store.enrollInTrack(trackId);
      });
      
      const beforeUpdate = useComprehensiveLearningStore.getState();
      const initialTracks = beforeUpdate.tracks;
      const initialPreferences = beforeUpdate.learningPreferences;
      
      // Update lesson progress
      act(() => {
        store.updateLessonProgress(trackId, 'lesson-1', 50);
      });
      
      const afterUpdate = useComprehensiveLearningStore.getState();
      
      // These should remain unchanged
      expect(afterUpdate.tracks).toBe(initialTracks);
      expect(afterUpdate.learningPreferences).toBe(initialPreferences);
      
      // These should be updated
      expect(afterUpdate.lessonProgress).not.toBe(beforeUpdate.lessonProgress);
      expect(afterUpdate.progress).not.toBe(beforeUpdate.progress);
    });
  });
});