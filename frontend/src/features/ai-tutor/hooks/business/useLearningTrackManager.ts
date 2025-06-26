// src/features/ai-tutor/hooks/business/useLearningTrackManager.ts
// Learning Track Manager Business Logic Hook - Extracts track management from components
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useComprehensiveLearningStore } from '../../stores/comprehensiveLearningStore';
import type { LearningTrack, TrackProgress } from '../../types/learning';

/**
 * Difficulty scoring system for tracks
 */
export interface DifficultyScore {
  level: LearningTrack['difficulty'];
  score: number; // 1-10 scale
  factors: {
    prerequisites: number;
    estimatedHours: number;
    skillComplexity: number;
    trackLength: number;
  };
}

/**
 * Interface for the Learning Track Manager return value
 */
export interface LearningTrackManagerReturn {
  // State
  tracks: LearningTrack[];
  selectedTrack: LearningTrack | null;
  enrolledTracks: LearningTrack[];
  
  // Actions
  selectTrack: (trackId: string) => void;
  enrollInTrack: (trackId: string) => Promise<boolean>;
  unenrollFromTrack: (trackId: string) => Promise<boolean>;
  
  // Business Logic
  canEnrollInTrack: (track: LearningTrack) => boolean;
  getPrerequisites: (track: LearningTrack) => LearningTrack[];
  calculateDifficulty: (track: LearningTrack) => DifficultyScore;
  
  // Recommendations
  getRecommendedTracks: () => LearningTrack[];
  getSimilarTracks: (trackId: string) => LearningTrack[];
}

/**
 * Learning Track Manager Hook - Handles all track-related business logic
 * 
 * Extracts business logic from TrackExplorationComponent to improve:
 * - Testability: Business logic can be tested in isolation
 * - Reusability: Can be used across multiple track components
 * - Performance: Optimized track filtering and recommendations
 * - Maintainability: Clear separation of UI and business logic
 */
export const useLearningTrackManager = (): LearningTrackManagerReturn => {
  // Local state for selected track
  const [selectedTrack, setSelectedTrack] = useState<LearningTrack | null>(null);

  // Subscribe to store state with optimized selectors
  const tracks = useComprehensiveLearningStore(state => state.tracks);
  const enrolledTrackIds = useComprehensiveLearningStore(state => state.enrolledTracks);
  const progress = useComprehensiveLearningStore(state => state.progress);
  
  // Store actions
  const enrollInTrack = useComprehensiveLearningStore(state => state.enrollInTrack);
  const unenrollFromTrack = useComprehensiveLearningStore(state => state.unenrollFromTrack);
  const getRecommendedTracks = useComprehensiveLearningStore(state => state.getRecommendedTracks);

  // Compute enrolled tracks (memoized)
  const enrolledTracks = useMemo(() => {
    return tracks.filter(track => enrolledTrackIds.includes(track.id));
  }, [tracks, enrolledTrackIds]);

  // Business Logic Actions

  /**
   * Select a track by ID
   */
  const selectTrack = useCallback((trackId: string): void => {
    const track = tracks.find(t => t.id === trackId);
    setSelectedTrack(track || null);
  }, [tracks]);

  /**
   * Enroll in a track with business logic validation
   */
  const enrollInTrackAction = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      const track = tracks.find(t => t.id === trackId);
      if (!track) {
        throw new Error('Track not found');
      }

      // Check if already enrolled
      if (enrolledTrackIds.includes(trackId)) {
        return false; // Already enrolled
      }

      // Check prerequisites
      if (!canEnrollInTrackLogic(track, tracks, progress)) {
        return false; // Prerequisites not met
      }

      await enrollInTrack(trackId);
      return true;
    } catch (error) {
      console.error('Failed to enroll in track:', error);
      return false;
    }
  }, [tracks, enrolledTrackIds, progress, enrollInTrack]);

  /**
   * Unenroll from a track
   */
  const unenrollFromTrackAction = useCallback(async (trackId: string): Promise<boolean> => {
    try {
      // Check if enrolled
      if (!enrolledTrackIds.includes(trackId)) {
        return false; // Not enrolled
      }

      await unenrollFromTrack(trackId);
      
      // Clear selection if unenrolling from selected track
      if (selectedTrack?.id === trackId) {
        setSelectedTrack(null);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to unenroll from track:', error);
      return false;
    }
  }, [enrolledTrackIds, unenrollFromTrack, selectedTrack]);

  // Business Logic Methods (memoized)

  /**
   * Check if user can enroll in a track
   */
  const canEnrollInTrack = useCallback((track: LearningTrack): boolean => {
    return canEnrollInTrackLogic(track, tracks, progress, enrolledTrackIds);
  }, [tracks, progress, enrolledTrackIds]);

  /**
   * Get prerequisite tracks for a given track
   */
  const getPrerequisites = useCallback((track: LearningTrack): LearningTrack[] => {
    if (!track.prerequisites) {
      return [];
    }
    
    return tracks.filter(t => track.prerequisites!.includes(t.id));
  }, [tracks]);

  /**
   * Calculate difficulty score for a track
   */
  const calculateDifficulty = useCallback((track: LearningTrack): DifficultyScore => {
    return calculateTrackDifficulty(track);
  }, []);

  // Recommendation Methods (memoized)

  /**
   * Get tracks recommended by the learning system
   */
  const getRecommendedTracksAction = useCallback((): LearningTrack[] => {
    return getRecommendedTracks();
  }, [getRecommendedTracks]);

  /**
   * Get tracks similar to the given track based on skills and category
   */
  const getSimilarTracks = useCallback((trackId: string): LearningTrack[] => {
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
      return [];
    }

    return tracks
      .filter(t => 
        t.id !== trackId && // Exclude the track itself
        !enrolledTrackIds.includes(t.id) && // Exclude already enrolled tracks
        t.published // Only published tracks
      )
      .map(t => ({
        track: t,
        similarity: calculateTrackSimilarity(track, t)
      }))
      .filter(({ similarity }) => similarity > 0.3) // Minimum similarity threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5) // Top 5 similar tracks
      .map(({ track }) => track);
  }, [tracks, enrolledTrackIds]);

  // Return memoized object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    tracks,
    selectedTrack,
    enrolledTracks,
    
    // Actions
    selectTrack,
    enrollInTrack: enrollInTrackAction,
    unenrollFromTrack: unenrollFromTrackAction,
    
    // Business Logic
    canEnrollInTrack,
    getPrerequisites,
    calculateDifficulty,
    
    // Recommendations
    getRecommendedTracks: getRecommendedTracksAction,
    getSimilarTracks
  }), [
    // State dependencies
    tracks,
    selectedTrack,
    enrolledTracks,
    
    // Action dependencies
    selectTrack,
    enrollInTrackAction,
    unenrollFromTrackAction,
    
    // Business logic dependencies
    canEnrollInTrack,
    getPrerequisites,
    calculateDifficulty,
    
    // Recommendation dependencies
    getRecommendedTracksAction,
    getSimilarTracks
  ]);
};

// Helper Functions (pure functions for better testability)

/**
 * Check if user can enroll in a track (pure function)
 */
function canEnrollInTrackLogic(
  track: LearningTrack,
  allTracks: LearningTrack[],
  progress: Record<string, TrackProgress>,
  enrolledTrackIds?: string[]
): boolean {
  // Check if already enrolled
  if (enrolledTrackIds && enrolledTrackIds.includes(track.id)) {
    return false;
  }

  // Check prerequisites
  if (track.prerequisites && track.prerequisites.length > 0) {
    return track.prerequisites.every(prereqId => {
      const prereqProgress = progress[prereqId];
      return prereqProgress && prereqProgress.status === 'completed';
    });
  }

  return true;
}

/**
 * Calculate track difficulty score (pure function)
 */
function calculateTrackDifficulty(
  track: LearningTrack
): DifficultyScore {
  // Base difficulty levels
  const baseDifficultyScores = {
    beginner: 2,
    intermediate: 5,
    advanced: 8
  };

  const baseScore = baseDifficultyScores[track.difficulty];

  // Factor calculations
  const prerequisites = track.prerequisites ? track.prerequisites.length * 0.5 : 0;
  const estimatedHours = Math.min(track.estimatedHours / 10, 2); // Cap at 2 points
  const skillComplexity = Math.min(track.skills.length * 0.2, 1.5); // Cap at 1.5 points
  const trackLength = track.lessons ? Math.min(track.lessons.length * 0.1, 1) : 0;

  const totalScore = Math.min(
    Math.max(
      baseScore + prerequisites + estimatedHours + skillComplexity + trackLength,
      1
    ),
    10
  );

  return {
    level: track.difficulty,
    score: Math.round(totalScore * 10) / 10, // Round to 1 decimal
    factors: {
      prerequisites,
      estimatedHours,
      skillComplexity,
      trackLength
    }
  };
}

/**
 * Calculate similarity between two tracks (pure function)
 */
function calculateTrackSimilarity(track1: LearningTrack, track2: LearningTrack): number {
  // Category match (high weight)
  const categoryMatch = track1.category === track2.category ? 0.4 : 0;

  // Skill overlap (medium weight)
  const commonSkills = track1.skills.filter(skill => track2.skills.includes(skill));
  const skillSimilarity = commonSkills.length / Math.max(track1.skills.length, track2.skills.length);
  const skillMatch = skillSimilarity * 0.3;

  // Tag overlap (low weight)
  const commonTags = track1.tags?.filter(tag => track2.tags?.includes(tag)) || [];
  const tagSimilarity = track1.tags && track2.tags 
    ? commonTags.length / Math.max(track1.tags.length, track2.tags.length)
    : 0;
  const tagMatch = tagSimilarity * 0.2;

  // Difficulty proximity (low weight)
  const difficultyLevels = { beginner: 1, intermediate: 2, advanced: 3 };
  const difficultyDiff = Math.abs(
    difficultyLevels[track1.difficulty] - difficultyLevels[track2.difficulty]
  );
  const difficultyMatch = Math.max(0, (3 - difficultyDiff) / 3) * 0.1;

  return categoryMatch + skillMatch + tagMatch + difficultyMatch;
}

// Export for testing
export { 
  canEnrollInTrackLogic, 
  calculateTrackDifficulty, 
  calculateTrackSimilarity 
};