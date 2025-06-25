// src/features/ai-tutor/hooks/__tests__/useLearningTrackManager.test.ts
// TDD Tests for Learning Track Manager Business Logic Hook

import { renderHook, act } from '@testing-library/react';
import { useLearningTrackManager } from '../business/useLearningTrackManager';
import { useComprehensiveLearningStore } from '../../stores/comprehensiveLearningStore';
import type { LearningTrack, TrackProgress } from '../../types/learning';

// Mock the store
jest.mock('../../stores/comprehensiveLearningStore', () => ({
  useComprehensiveLearningStore: jest.fn()
}));

const mockUseComprehensiveLearningStore = useComprehensiveLearningStore as jest.MockedFunction<typeof useComprehensiveLearningStore>;

describe('useLearningTrackManager', () => {
  const mockTracks: LearningTrack[] = [
    {
      id: 'react-fundamentals',
      title: 'React Fundamentals',
      description: 'Learn React basics',
      difficulty: 'beginner',
      estimatedHours: 10,
      skills: ['React', 'JavaScript'],
      category: 'Frontend',
      tags: ['react', 'web'],
      published: true,
      lessons: [],
      assessments: [],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'advanced-react',
      title: 'Advanced React',
      description: 'Advanced React patterns',
      difficulty: 'advanced',
      estimatedHours: 20,
      skills: ['React', 'Performance'],
      category: 'Frontend',
      tags: ['react', 'advanced'],
      published: true,
      lessons: [],
      assessments: [],
      prerequisites: ['react-fundamentals'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ];

  const mockStore = {
    tracks: mockTracks,
    enrolledTracks: ['react-fundamentals'],
    progress: {
      'react-fundamentals': {
        trackId: 'react-fundamentals',
        enrolledAt: '2024-01-01T00:00:00.000Z',
        lastAccessedAt: '2024-01-01T00:00:00.000Z',
        overallProgress: 50,
        completedLessons: [],
        timeSpent: 3600000,
        status: 'in-progress'
      } as TrackProgress
    },
    enrollInTrack: jest.fn(),
    unenrollFromTrack: jest.fn(),
    getRecommendedTracks: jest.fn(),
    getTrackProgress: jest.fn(),
    learningPreferences: {
      difficultyPreference: 'mixed' as const,
      learningStyle: 'visual' as const,
      pacePreference: 'normal' as const,
      sessionDuration: 30,
      notificationsEnabled: true,
      reminderFrequency: 'daily' as const,
      preferredLearningTime: ['morning'],
      theme: 'auto' as const,
      autoSave: true,
      skipIntroductions: false
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseComprehensiveLearningStore.mockReturnValue(mockStore);
  });

  describe('initialization', () => {
    it('should return available tracks', () => {
      const { result } = renderHook(() => useLearningTrackManager());

      expect(result.current.tracks).toEqual(mockTracks);
      expect(result.current.tracks).toHaveLength(2);
    });

    it('should return enrolled tracks', () => {
      const { result } = renderHook(() => useLearningTrackManager());

      expect(result.current.enrolledTracks).toEqual([mockTracks[0]]);
    });

    it('should return null for selected track initially', () => {
      const { result } = renderHook(() => useLearningTrackManager());

      expect(result.current.selectedTrack).toBeNull();
    });
  });

  describe('selectTrack action', () => {
    it('should select a track by ID', () => {
      const { result } = renderHook(() => useLearningTrackManager());

      act(() => {
        result.current.selectTrack('advanced-react');
      });

      expect(result.current.selectedTrack).toEqual(mockTracks[1]);
    });

    it('should handle invalid track ID', () => {
      const { result } = renderHook(() => useLearningTrackManager());

      act(() => {
        result.current.selectTrack('non-existent');
      });

      expect(result.current.selectedTrack).toBeNull();
    });
  });

  describe('enrollInTrack action', () => {
    it('should enroll in track successfully', async () => {
      mockStore.enrollInTrack.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useLearningTrackManager());

      await act(async () => {
        const success = await result.current.enrollInTrack('advanced-react');
        expect(success).toBe(true);
      });

      expect(mockStore.enrollInTrack).toHaveBeenCalledWith('advanced-react');
    });

    it('should handle enrollment failure', async () => {
      mockStore.enrollInTrack.mockRejectedValue(new Error('Enrollment failed'));
      
      const { result } = renderHook(() => useLearningTrackManager());

      await act(async () => {
        const success = await result.current.enrollInTrack('advanced-react');
        expect(success).toBe(false);
      });
    });

    it('should prevent enrolling in already enrolled track', async () => {
      const { result } = renderHook(() => useLearningTrackManager());

      await act(async () => {
        const success = await result.current.enrollInTrack('react-fundamentals');
        expect(success).toBe(false);
      });

      expect(mockStore.enrollInTrack).not.toHaveBeenCalled();
    });
  });

  describe('unenrollFromTrack action', () => {
    it('should unenroll from track successfully', async () => {
      mockStore.unenrollFromTrack.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useLearningTrackManager());

      await act(async () => {
        const success = await result.current.unenrollFromTrack('react-fundamentals');
        expect(success).toBe(true);
      });

      expect(mockStore.unenrollFromTrack).toHaveBeenCalledWith('react-fundamentals');
    });

    it('should handle unenrollment failure', async () => {
      mockStore.unenrollFromTrack.mockRejectedValue(new Error('Unenrollment failed'));
      
      const { result } = renderHook(() => useLearningTrackManager());

      await act(async () => {
        const success = await result.current.unenrollFromTrack('react-fundamentals');
        expect(success).toBe(false);
      });
    });

    it('should prevent unenrolling from track not enrolled in', async () => {
      const { result } = renderHook(() => useLearningTrackManager());

      await act(async () => {
        const success = await result.current.unenrollFromTrack('advanced-react');
        expect(success).toBe(false);
      });

      expect(mockStore.unenrollFromTrack).not.toHaveBeenCalled();
    });
  });

  describe('business logic methods', () => {
    describe('canEnrollInTrack', () => {
      it('should allow enrollment when prerequisites are met', () => {
        // Mock completed progress for prerequisite
        mockStore.progress['react-fundamentals'].status = 'completed';
        
        const { result } = renderHook(() => useLearningTrackManager());

        expect(result.current.canEnrollInTrack(mockTracks[1])).toBe(true);
      });

      it('should prevent enrollment when prerequisites are not met', () => {
        // Ensure prerequisite is not completed
        mockStore.progress['react-fundamentals'].status = 'in-progress';
        
        const { result } = renderHook(() => useLearningTrackManager());

        expect(result.current.canEnrollInTrack(mockTracks[1])).toBe(false);
      });

      it('should allow enrollment for tracks without prerequisites', () => {
        const { result } = renderHook(() => useLearningTrackManager());

        expect(result.current.canEnrollInTrack(mockTracks[0])).toBe(true);
      });

      it('should prevent enrollment in already enrolled track', () => {
        const { result } = renderHook(() => useLearningTrackManager());

        expect(result.current.canEnrollInTrack(mockTracks[0])).toBe(false);
      });
    });

    describe('getPrerequisites', () => {
      it('should return prerequisite tracks', () => {
        const { result } = renderHook(() => useLearningTrackManager());

        const prerequisites = result.current.getPrerequisites(mockTracks[1]);
        expect(prerequisites).toEqual([mockTracks[0]]);
      });

      it('should return empty array for tracks without prerequisites', () => {
        const { result } = renderHook(() => useLearningTrackManager());

        const prerequisites = result.current.getPrerequisites(mockTracks[0]);
        expect(prerequisites).toEqual([]);
      });
    });

    describe('calculateDifficulty', () => {
      it('should calculate difficulty score for beginner track', () => {
        const { result } = renderHook(() => useLearningTrackManager());

        const difficulty = result.current.calculateDifficulty(mockTracks[0]);
        expect(difficulty.level).toBe('beginner');
        expect(difficulty.score).toBeGreaterThan(0);
        expect(difficulty.score).toBeLessThanOrEqual(10);
      });

      it('should calculate higher difficulty score for advanced track', () => {
        const { result } = renderHook(() => useLearningTrackManager());

        const beginnerDifficulty = result.current.calculateDifficulty(mockTracks[0]);
        const advancedDifficulty = result.current.calculateDifficulty(mockTracks[1]);

        expect(advancedDifficulty.score).toBeGreaterThan(beginnerDifficulty.score);
      });
    });
  });

  describe('recommendation methods', () => {
    beforeEach(() => {
      mockStore.getRecommendedTracks.mockReturnValue([mockTracks[1]]);
    });

    it('should get recommended tracks', () => {
      const { result } = renderHook(() => useLearningTrackManager());

      const recommended = result.current.getRecommendedTracks();
      expect(recommended).toEqual([mockTracks[1]]);
      expect(mockStore.getRecommendedTracks).toHaveBeenCalled();
    });

    it('should get similar tracks based on skills', () => {
      const { result } = renderHook(() => useLearningTrackManager());

      const similar = result.current.getSimilarTracks('react-fundamentals');
      // Should find advanced-react since it shares React skill
      expect(similar).toEqual([mockTracks[1]]);
    });

    it('should exclude current track from similar tracks', () => {
      const { result } = renderHook(() => useLearningTrackManager());

      const similar = result.current.getSimilarTracks('advanced-react');
      // Should not include itself in similar tracks
      expect(similar).not.toContain(mockTracks[1]);
    });
  });

  describe('memoization and performance', () => {
    it('should memoize computed values', () => {
      const { result, rerender } = renderHook(() => useLearningTrackManager());

      const firstEnrolledTracks = result.current.enrolledTracks;
      const firstRecommended = result.current.getRecommendedTracks();

      rerender();

      // These should be memoized based on dependencies
      expect(result.current.enrolledTracks).toBe(firstEnrolledTracks);
      expect(result.current.getRecommendedTracks()).toBe(firstRecommended);
    });

    it('should update when underlying store data changes', () => {
      const { rerender } = renderHook(() => useLearningTrackManager());

      // Update mock store to simulate change
      mockUseComprehensiveLearningStore.mockReturnValue({
        ...mockStore,
        enrolledTracks: ['react-fundamentals', 'advanced-react']
      });

      rerender();

      const { result } = renderHook(() => useLearningTrackManager());
      expect(result.current.enrolledTracks).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('should handle store errors gracefully', () => {
      mockUseComprehensiveLearningStore.mockReturnValue({
        ...mockStore,
        tracks: [],
        enrolledTracks: []
      });

      const { result } = renderHook(() => useLearningTrackManager());

      expect(result.current.tracks).toEqual([]);
      expect(result.current.enrolledTracks).toEqual([]);
      expect(() => result.current.selectTrack('any-id')).not.toThrow();
    });
  });
});