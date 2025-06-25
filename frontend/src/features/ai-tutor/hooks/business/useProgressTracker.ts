// src/features/ai-tutor/hooks/business/useProgressTracker.ts
// Progress Tracker Business Logic Hook - Extracts progress tracking from components

import { useCallback, useMemo } from 'react';
import { useComprehensiveLearningStore } from '../../stores/comprehensiveLearningStore';
import type { 
  TrackProgress, 
  LessonProgress, 
  Achievement, 
  LearningStats,
  WeeklyProgress,
  StreakInfo
} from '../../types/learning';

/**
 * Activity entry for recent activity tracking
 */
export interface Activity {
  id: string;
  type: 'lesson' | 'assessment' | 'track-complete' | 'achievement';
  title: string;
  description: string;
  timestamp: string;
  points?: number;
  trackId?: string;
  lessonId?: string;
}

/**
 * Milestone for achievement tracking
 */
export interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'lessons' | 'tracks' | 'hours' | 'streak' | 'points';
  reward: {
    points: number;
    badge?: string;
  };
}

/**
 * Skill analysis for strengths and weaknesses
 */
export interface SkillAnalysis {
  strengths: Array<{
    skill: string;
    score: number;
    evidence: string[];
  }>;
  weaknesses: Array<{
    skill: string;
    score: number;
    suggestions: string[];
  }>;
  recommendations: string[];
}

/**
 * Interface for the Progress Tracker return value
 */
export interface ProgressTrackerReturn {
  // Progress Data
  overallProgress: number;
  trackProgress: Record<string, number>;
  recentActivity: Activity[];
  learningStreak: number;
  totalLearningTime: number;
  
  // Actions
  updateLessonProgress: (lessonId: string, trackId: string, progress: number) => Promise<void>;
  completeLesson: (lessonId: string, trackId: string) => Promise<void>;
  recordStudyTime: (duration: number) => Promise<void>;
  
  // Analytics
  getWeeklyProgress: () => WeeklyProgress[];
  getPredictedCompletion: (trackId: string) => Date;
  getStrengthsAndWeaknesses: () => SkillAnalysis;
  
  // Achievements
  checkNewAchievements: () => Achievement[];
  getNextMilestone: () => Milestone | null;
}

/**
 * Progress Tracker Hook - Handles all progress-related business logic
 * 
 * Extracts business logic from ProgressDashboardComponent to improve:
 * - Testability: Progress calculations can be tested in isolation
 * - Reusability: Can be used across multiple progress components
 * - Performance: Optimized progress calculations with memoization
 * - Analytics: Rich insights and predictive capabilities
 */
export const useProgressTracker = (userId?: string): ProgressTrackerReturn => {
  // Subscribe to store state
  const progress = useComprehensiveLearningStore(state => state.progress);
  const lessonProgress = useComprehensiveLearningStore(state => state.lessonProgress);
  const achievements = useComprehensiveLearningStore(state => state.achievements);
  const learningStreak = useComprehensiveLearningStore(state => state.learningStreak);
  const totalLearningTime = useComprehensiveLearningStore(state => state.totalLearningTime);
  const tracks = useComprehensiveLearningStore(state => state.tracks);
  const enrolledTracks = useComprehensiveLearningStore(state => state.enrolledTracks);
  
  // Store actions
  const updateLessonProgressAction = useComprehensiveLearningStore(state => state.updateLessonProgress);
  const completeLessonAction = useComprehensiveLearningStore(state => state.completeLesson);
  const getWeeklyProgressAction = useComprehensiveLearningStore(state => state.getWeeklyProgress);
  const getStreakInfo = useComprehensiveLearningStore(state => state.getStreakInfo);

  // Computed Progress Data (memoized)

  /**
   * Calculate overall progress across all enrolled tracks
   */
  const overallProgress = useMemo(() => {
    if (enrolledTracks.length === 0) return 0;
    
    const totalProgress = enrolledTracks.reduce((sum, trackId) => {
      const trackProgress = progress[trackId];
      return sum + (trackProgress?.overallProgress || 0);
    }, 0);
    
    return Math.round(totalProgress / enrolledTracks.length);
  }, [progress, enrolledTracks]);

  /**
   * Create track progress mapping
   */
  const trackProgress = useMemo(() => {
    return Object.fromEntries(
      Object.entries(progress).map(([trackId, trackData]) => [
        trackId,
        trackData.overallProgress
      ])
    );
  }, [progress]);

  /**
   * Generate recent activity from various sources
   */
  const recentActivity = useMemo(() => {
    const activities: Activity[] = [];
    
    // Recent lesson completions
    Object.values(lessonProgress)
      .filter(lesson => lesson.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
      .slice(0, 10)
      .forEach(lesson => {
        const track = tracks.find(t => t.id === lesson.trackId);
        const lessonData = track?.lessons.find(l => l.id === lesson.lessonId);
        
        activities.push({
          id: `lesson-${lesson.lessonId}`,
          type: 'lesson',
          title: lessonData?.title || 'Lesson Completed',
          description: `Completed in ${track?.title || 'Unknown Track'}`,
          timestamp: lesson.completedAt!,
          points: 10,
          trackId: lesson.trackId,
          lessonId: lesson.lessonId
        });
      });

    // Recent achievements
    achievements
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
      .slice(0, 5)
      .forEach(achievement => {
        activities.push({
          id: `achievement-${achievement.id}`,
          type: 'achievement',
          title: achievement.title,
          description: achievement.description,
          timestamp: achievement.earnedAt,
          points: achievement.points
        });
      });

    // Recent track completions
    Object.values(progress)
      .filter(p => p.status === 'completed')
      .sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime())
      .slice(0, 3)
      .forEach(trackData => {
        const track = tracks.find(t => t.id === trackData.trackId);
        
        activities.push({
          id: `track-${trackData.trackId}`,
          type: 'track-complete',
          title: 'Track Completed',
          description: track?.title || 'Unknown Track',
          timestamp: trackData.lastAccessedAt,
          points: 50,
          trackId: trackData.trackId
        });
      });

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);
  }, [lessonProgress, achievements, progress, tracks]);

  // Action Methods

  /**
   * Update lesson progress with validation
   */
  const updateLessonProgress = useCallback(async (
    lessonId: string, 
    trackId: string, 
    progressValue: number
  ): Promise<void> => {
    // Validation
    if (progressValue < 0 || progressValue > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    
    if (!enrolledTracks.includes(trackId)) {
      throw new Error('Not enrolled in this track');
    }

    await updateLessonProgressAction(trackId, lessonId, progressValue);
  }, [enrolledTracks, updateLessonProgressAction]);

  /**
   * Complete a lesson (set to 100% progress)
   */
  const completeLesson = useCallback(async (
    lessonId: string, 
    trackId: string
  ): Promise<void> => {
    await completeLessonAction(trackId, lessonId);
  }, [completeLessonAction]);

  /**
   * Record additional study time
   */
  const recordStudyTime = useCallback(async (duration: number): Promise<void> => {
    if (duration <= 0) {
      throw new Error('Study time must be positive');
    }
    
    // This would typically update a separate study time tracker
    // For now, we'll just validate the input
    console.log(`Recorded ${duration}ms of study time`);
  }, []);

  // Analytics Methods

  /**
   * Get weekly progress data
   */
  const getWeeklyProgress = useCallback((): WeeklyProgress[] => {
    return getWeeklyProgressAction();
  }, [getWeeklyProgressAction]);

  /**
   * Predict track completion date based on current velocity
   */
  const getPredictedCompletion = useCallback((trackId: string): Date => {
    const trackData = progress[trackId];
    if (!trackData) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: 30 days
    }

    const remainingProgress = 100 - trackData.overallProgress;
    if (remainingProgress <= 0) {
      return new Date(); // Already completed
    }

    // Calculate velocity (progress per day)
    const enrolledDays = Math.max(
      (Date.now() - new Date(trackData.enrolledAt).getTime()) / (24 * 60 * 60 * 1000),
      1
    );
    const velocity = trackData.overallProgress / enrolledDays;
    
    if (velocity <= 0) {
      return new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // Default: 60 days
    }

    const daysToComplete = remainingProgress / velocity;
    return new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000);
  }, [progress]);

  /**
   * Analyze strengths and weaknesses based on performance
   */
  const getStrengthsAndWeaknesses = useCallback((): SkillAnalysis => {
    const skillScores: Record<string, { scores: number[], lessons: string[], tracks: string[] }> = {};
    
    // Analyze lesson scores by skill
    Object.values(lessonProgress).forEach(lesson => {
      const track = tracks.find(t => t.id === lesson.trackId);
      if (!track || lesson.scores.length === 0) return;
      
      track.skills.forEach(skill => {
        if (!skillScores[skill]) {
          skillScores[skill] = { scores: [], lessons: [], tracks: [] };
        }
        
        skillScores[skill].scores.push(...lesson.scores);
        skillScores[skill].lessons.push(lesson.lessonId);
        if (!skillScores[skill].tracks.includes(track.id)) {
          skillScores[skill].tracks.push(track.id);
        }
      });
    });

    // Calculate averages and categorize
    const strengths: SkillAnalysis['strengths'] = [];
    const weaknesses: SkillAnalysis['weaknesses'] = [];
    
    Object.entries(skillScores).forEach(([skill, data]) => {
      const avgScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
      
      if (avgScore >= 80) {
        strengths.push({
          skill,
          score: avgScore,
          evidence: [
            `Average score: ${avgScore.toFixed(1)}%`,
            `Completed ${data.lessons.length} lessons`,
            `Across ${data.tracks.length} tracks`
          ]
        });
      } else if (avgScore < 60) {
        weaknesses.push({
          skill,
          score: avgScore,
          suggestions: [
            `Practice more ${skill} exercises`,
            `Review fundamental concepts`,
            `Focus on hands-on projects`
          ]
        });
      }
    });

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (weaknesses.length > 0) {
      recommendations.push(`Focus on improving ${weaknesses[0].skill} skills`);
    }
    
    if (strengths.length > 0) {
      recommendations.push(`Leverage your strong ${strengths[0].skill} skills in advanced projects`);
    }
    
    if (learningStreak < 3) {
      recommendations.push('Build a consistent daily learning habit');
    }

    return { strengths, weaknesses, recommendations };
  }, [lessonProgress, tracks, learningStreak]);

  // Achievement Methods

  /**
   * Check for new achievements based on current progress
   */
  const checkNewAchievements = useCallback((): Achievement[] => {
    // This would typically check against achievement criteria
    // For now, return empty array as placeholder
    return [];
  }, []);

  /**
   * Get the next milestone the user is working towards
   */
  const getNextMilestone = useCallback((): Milestone | null => {
    const totalLessonsCompleted = Object.values(lessonProgress)
      .filter(lesson => lesson.progress === 100).length;
    
    const totalTracksCompleted = Object.values(progress)
      .filter(track => track.status === 'completed').length;
    
    const totalPoints = achievements.reduce((sum, achievement) => sum + achievement.points, 0);

    // Define milestones
    const milestones: Milestone[] = [
      {
        id: 'lessons-10',
        title: 'Lesson Master',
        description: 'Complete 10 lessons',
        target: 10,
        current: totalLessonsCompleted,
        type: 'lessons',
        reward: { points: 25 }
      },
      {
        id: 'lessons-25',
        title: 'Learning Machine',
        description: 'Complete 25 lessons',
        target: 25,
        current: totalLessonsCompleted,
        type: 'lessons',
        reward: { points: 50, badge: 'learning-machine' }
      },
      {
        id: 'tracks-3',
        title: 'Track Champion',
        description: 'Complete 3 learning tracks',
        target: 3,
        current: totalTracksCompleted,
        type: 'tracks',
        reward: { points: 100, badge: 'track-champion' }
      },
      {
        id: 'streak-7',
        title: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        target: 7,
        current: learningStreak,
        type: 'streak',
        reward: { points: 75, badge: 'week-warrior' }
      }
    ];

    // Find next uncompleted milestone
    return milestones.find(milestone => milestone.current < milestone.target) || null;
  }, [lessonProgress, progress, achievements, learningStreak]);

  // Return memoized object to prevent unnecessary re-renders
  return useMemo(() => ({
    // Progress Data
    overallProgress,
    trackProgress,
    recentActivity,
    learningStreak,
    totalLearningTime,
    
    // Actions
    updateLessonProgress,
    completeLesson,
    recordStudyTime,
    
    // Analytics
    getWeeklyProgress,
    getPredictedCompletion,
    getStrengthsAndWeaknesses,
    
    // Achievements
    checkNewAchievements,
    getNextMilestone
  }), [
    // Progress data dependencies
    overallProgress,
    trackProgress,
    recentActivity,
    learningStreak,
    totalLearningTime,
    
    // Action dependencies
    updateLessonProgress,
    completeLesson,
    recordStudyTime,
    
    // Analytics dependencies
    getWeeklyProgress,
    getPredictedCompletion,
    getStrengthsAndWeaknesses,
    
    // Achievement dependencies
    checkNewAchievements,
    getNextMilestone
  ]);
};