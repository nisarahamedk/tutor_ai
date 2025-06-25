// src/features/ai-tutor/hooks/__tests__/useLearningTrackManager.simple.test.ts
// Simple test to verify the learning track manager implementation

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock implementation
const mockUseComprehensiveLearningStore = vi.fn();

vi.mock('../../stores/comprehensiveLearningStore', () => ({
  useComprehensiveLearningStore: mockUseComprehensiveLearningStore
}));

// Import after mocking
const { useLearningTrackManager } = await import('../business/useLearningTrackManager');

describe('useLearningTrackManager - Basic Functionality', () => {
  const mockTracks = [
    {
      id: 'react-fundamentals',
      title: 'React Fundamentals',
      description: 'Learn React basics',
      difficulty: 'beginner' as const,
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
      difficulty: 'advanced' as const,
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
      }
    },
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
    },
    enrollInTrack: vi.fn(),
    unenrollFromTrack: vi.fn(),
    getRecommendedTracks: vi.fn(() => [mockTracks[1]])
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

  it('should initialize with tracks from store', () => {
    const { result } = renderHook(() => useLearningTrackManager());

    expect(result.current.tracks).toEqual(mockTracks);
    expect(result.current.tracks).toHaveLength(2);
  });

  it('should return enrolled tracks', () => {
    const { result } = renderHook(() => useLearningTrackManager());

    expect(result.current.enrolledTracks).toEqual([mockTracks[0]]);
  });

  it('should select track by ID', () => {
    const { result } = renderHook(() => useLearningTrackManager());

    act(() => {
      result.current.selectTrack('advanced-react');
    });

    expect(result.current.selectedTrack).toEqual(mockTracks[1]);
  });

  it('should handle invalid track selection', () => {
    const { result } = renderHook(() => useLearningTrackManager());

    act(() => {
      result.current.selectTrack('non-existent');
    });

    expect(result.current.selectedTrack).toBeNull();
  });

  it('should check enrollment eligibility', () => {
    const { result } = renderHook(() => useLearningTrackManager());

    // Can't enroll in already enrolled track
    expect(result.current.canEnrollInTrack(mockTracks[0])).toBe(false);
    
    // Can enroll in track without prerequisites
    const trackWithoutPrereqs = { ...mockTracks[1], prerequisites: undefined };
    expect(result.current.canEnrollInTrack(trackWithoutPrereqs)).toBe(true);
  });

  it('should get track prerequisites', () => {
    const { result } = renderHook(() => useLearningTrackManager());

    const prerequisites = result.current.getPrerequisites(mockTracks[1]);
    expect(prerequisites).toEqual([mockTracks[0]]);
  });

  it('should calculate track difficulty', () => {
    const { result } = renderHook(() => useLearningTrackManager());

    const difficulty = result.current.calculateDifficulty(mockTracks[0]);
    expect(difficulty.level).toBe('beginner');
    expect(difficulty.score).toBeGreaterThan(0);
    expect(difficulty.score).toBeLessThanOrEqual(10);
  });

  it('should get recommended tracks', () => {
    const { result } = renderHook(() => useLearningTrackManager());

    const recommended = result.current.getRecommendedTracks();
    expect(recommended).toEqual([mockTracks[1]]);
  });

  it('should find similar tracks', () => {
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

  it('should provide enrollment actions', () => {
    const { result } = renderHook(() => useLearningTrackManager());

    expect(typeof result.current.enrollInTrack).toBe('function');
    expect(typeof result.current.unenrollFromTrack).toBe('function');
  });
});