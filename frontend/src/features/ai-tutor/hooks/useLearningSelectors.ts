// src/features/ai-tutor/hooks/useLearningSelectors.ts
// Performance-optimized selectors for Learning Store (TASK-010)

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type {
  ComprehensiveLearningState,
  LearningTrack,
  TrackProgress,
  LessonProgress,
  LearningStats,
  StreakInfo,
  Achievement,
  AchievementType,
  LearningRecommendation,
  SkillProgression,
  WeeklyProgress,
  LearningPreferences,
  LearningGoal
} from '../types/learning';

// This will be imported from the actual store implementation
declare const useComprehensiveLearningStore: any;

// Optimized selectors with shallow comparison for performance
export const useLearningSelectors = {
  // Basic state selectors
  useTracks: (): LearningTrack[] =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => state.tracks)),

  useEnrolledTracks: (): string[] =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => state.enrolledTracks)),

  useCurrentTrack: (): string | null =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.currentTrack),

  useSelectedTrack: (): string | null =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.selectedTrack),

  useCurrentLesson: (): string | null =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.currentLesson),

  // Progress selectors
  useProgress: (): Record<string, TrackProgress> =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => state.progress)),

  useLessonProgress: (): Record<string, LessonProgress> =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => state.lessonProgress)),

  // Specific track progress with memoization
  useTrackProgress: (trackId: string): number =>
    useComprehensiveLearningStore(useMemo(() => 
      (state: ComprehensiveLearningState) => state.getTrackProgress(trackId),
      [trackId]
    )),

  // Specific track details with memoization
  useTrackDetails: (trackId: string): LearningTrack | undefined =>
    useComprehensiveLearningStore(useMemo(() =>
      (state: ComprehensiveLearningState) => state.tracks.find(track => track.id === trackId),
      [trackId]
    )),

  // Track progress details with memoization
  useTrackProgressDetails: (trackId: string): TrackProgress | undefined =>
    useComprehensiveLearningStore(useMemo(() =>
      (state: ComprehensiveLearningState) => state.progress[trackId],
      [trackId]
    )),

  // Lesson progress details with memoization
  useLessonProgressDetails: (lessonId: string): LessonProgress | undefined =>
    useComprehensiveLearningStore(useMemo(() =>
      (state: ComprehensiveLearningState) => state.lessonProgress[lessonId],
      [lessonId]
    )),

  // Filtered tracks with memoization
  useTracksByDifficulty: (difficulty: LearningTrack['difficulty']): LearningTrack[] =>
    useComprehensiveLearningStore(useMemo(() =>
      useShallow((state: ComprehensiveLearningState) => 
        state.tracks.filter(track => track.difficulty === difficulty)
      ),
      [difficulty]
    )),

  useTracksByCategory: (category: string): LearningTrack[] =>
    useComprehensiveLearningStore(useMemo(() =>
      useShallow((state: ComprehensiveLearningState) => 
        state.tracks.filter(track => track.category === category)
      ),
      [category]
    )),

  useTracksBySkill: (skill: string): LearningTrack[] =>
    useComprehensiveLearningStore(useMemo(() =>
      useShallow((state: ComprehensiveLearningState) => 
        state.tracks.filter(track => track.skills.includes(skill))
      ),
      [skill]
    )),

  // Progress-based selectors with memoization
  useInProgressTracks: (): LearningTrack[] =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => {
      const inProgressIds = Object.entries(state.progress)
        .filter(([, progress]) => progress.status === 'in-progress')
        .map(([trackId]) => trackId);
      
      return state.tracks.filter(track => inProgressIds.includes(track.id));
    })),

  useCompletedTracks: (): LearningTrack[] =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => {
      const completedIds = Object.entries(state.progress)
        .filter(([, progress]) => progress.status === 'completed')
        .map(([trackId]) => trackId);
      
      return state.tracks.filter(track => completedIds.includes(track.id));
    })),

  useAvailableTracks: (): LearningTrack[] =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => 
      state.tracks.filter(track => !state.enrolledTracks.includes(track.id))
    )),

  // User preferences
  useLearningPreferences: (): LearningPreferences =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => state.learningPreferences)),

  // Achievements and gamification
  useAchievements: (): Achievement[] =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => state.achievements)),

  useAchievementsByType: (type: AchievementType): Achievement[] =>
    useComprehensiveLearningStore(useMemo(() =>
      useShallow((state: ComprehensiveLearningState) => state.getAchievements(type)),
      [type]
    )),

  useLearningGoals: (): LearningGoal[] =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => state.learningGoals)),

  useLearningStreak: (): number =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.learningStreak),

  useTotalLearningTime: (): number =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.totalLearningTime),

  // Statistics and analytics
  useLearningStats: (): LearningStats =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.getLearningStats()),

  useStreakInfo: (): StreakInfo =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.getStreakInfo()),

  useWeeklyProgress: (): WeeklyProgress[] =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.getWeeklyProgress()),

  // Recommendations
  useRecommendedTracks: (): LearningTrack[] =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.getRecommendedTracks()),

  useNextRecommendation: (): LearningRecommendation | null =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.getNextRecommendation()),

  useSkillProgression: (skill: string): SkillProgression | null =>
    useComprehensiveLearningStore(useMemo(() =>
      (state: ComprehensiveLearningState) => state.getSkillProgression(skill),
      [skill]
    )),

  // UI state
  useIsLoading: (): boolean =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.isLoading),

  useError: (): string | null =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => state.error),

  // Offline and sync status
  useSyncStatus: () =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => state.syncStatus)),

  useOfflineActions: () =>
    useComprehensiveLearningStore(useShallow((state: ComprehensiveLearningState) => state.offlineActions)),

  // Computed selectors for complex operations
  useTrackCompletionPercentage: (): number =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => {
      const completed = Object.values(state.progress).filter(p => p.status === 'completed').length;
      const enrolled = state.enrolledTracks.length;
      return enrolled > 0 ? (completed / enrolled) * 100 : 0;
    }),

  useTotalPointsEarned: (): number =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => 
      state.achievements.reduce((total, achievement) => total + achievement.points, 0)
    ),

  useUserLevel: (): number =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => {
      const totalPoints = state.achievements.reduce((total, achievement) => total + achievement.points, 0);
      return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
    }),

  useActiveGoalsCount: (): number =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => 
      state.learningGoals.filter(goal => !goal.achieved).length
    ),

  // Performance metrics
  useAverageSessionTime: (): number =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => {
      const sessions = Object.values(state.lessonProgress);
      if (sessions.length === 0) return 0;
      const totalTime = sessions.reduce((sum, session) => sum + session.timeSpent, 0);
      return totalTime / sessions.length;
    }),

  useLearningVelocity: (): number =>
    useComprehensiveLearningStore((state: ComprehensiveLearningState) => {
      const stats = state.getLearningStats();
      return stats.learningVelocity;
    }),

  // Recent activity
  useRecentActivity: (days: number = 7): (TrackProgress | LessonProgress)[] =>
    useComprehensiveLearningStore(useMemo(() => 
      (state: ComprehensiveLearningState) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const recentTrackActivity = Object.values(state.progress)
          .filter(progress => new Date(progress.lastAccessedAt) >= cutoffDate);
        
        const recentLessonActivity = Object.values(state.lessonProgress)
          .filter(lesson => lesson.completedAt && new Date(lesson.completedAt) >= cutoffDate);
        
        return [...recentTrackActivity, ...recentLessonActivity]
          .sort((a, b) => {
            const dateA = 'lastAccessedAt' in a ? a.lastAccessedAt : a.completedAt!;
            const dateB = 'lastAccessedAt' in b ? b.lastAccessedAt : b.completedAt!;
            return new Date(dateB).getTime() - new Date(dateA).getTime();
          });
      },
      [days]
    ))
};

// Action hooks for performance
export const useLearningActions = () => {
  const store = useComprehensiveLearningStore();
  
  return useMemo(() => ({
    // Track management
    enrollInTrack: store.enrollInTrack,
    unenrollFromTrack: store.unenrollFromTrack,
    
    // Progress tracking
    updateLessonProgress: store.updateLessonProgress,
    completeLesson: store.completeLesson,
    
    // Assessment management
    startAssessment: store.startAssessment,
    submitAssessment: store.submitAssessment,
    
    // Preferences
    updatePreferences: store.updatePreferences,
    
    // Goals
    addLearningGoal: store.addLearningGoal,
    updateLearningGoal: store.updateLearningGoal,
    
    // Sync
    syncProgress: store.syncProgress,
    
    // Analytics
    generateAnalytics: store.generateAnalytics,
    
    // Offline
    addOfflineAction: store.addOfflineAction,
    processOfflineActions: store.processOfflineActions,
    
    // Performance
    clearCache: store.clearCache,
    optimizeStorage: store.optimizeStorage
  }), [store]);
};

// Computed hooks for complex derived state
export const useComputedLearningData = () => {
  const tracks = useLearningSelectors.useTracks();
  const progress = useLearningSelectors.useProgress();
  const achievements = useLearningSelectors.useAchievements();
  const preferences = useLearningSelectors.useLearningPreferences();
  
  return useMemo(() => {
    // Compute difficulty distribution
    const difficultyDistribution = tracks.reduce((acc, track) => {
      acc[track.difficulty] = (acc[track.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Compute skill coverage
    const allSkills = [...new Set(tracks.flatMap(track => track.skills))];
    const learningSkills = Object.values(progress)
      .flatMap(p => tracks.find(t => t.id === p.trackId)?.skills || []);
    const skillCoverage = [...new Set(learningSkills)];
    
    // Compute achievement breakdown
    const achievementsByRarity = achievements.reduce((acc, achievement) => {
      acc[achievement.rarity] = (acc[achievement.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      difficultyDistribution,
      skillCoverage: {
        total: allSkills.length,
        learning: skillCoverage.length,
        percentage: allSkills.length > 0 ? (skillCoverage.length / allSkills.length) * 100 : 0
      },
      achievementsByRarity,
      totalPoints: achievements.reduce((sum, a) => sum + a.points, 0),
      preferredDifficulty: preferences.difficultyPreference
    };
  }, [tracks, progress, achievements, preferences]);
};

// Performance monitoring hook
export const useLearningPerformanceMetrics = () => {
  const stats = useLearningSelectors.useLearningStats();
  const streakInfo = useLearningSelectors.useStreakInfo();
  const weeklyProgress = useLearningSelectors.useWeeklyProgress();
  
  return useMemo(() => {
    const recentWeeks = weeklyProgress.slice(-4);
    const avgWeeklyLessons = recentWeeks.length > 0 
      ? recentWeeks.reduce((sum, week) => sum + week.lessonsCompleted, 0) / recentWeeks.length
      : 0;
    
    const consistency = streakInfo.current / Math.max(streakInfo.longest, 1);
    
    const learningEfficiency = stats.averageScore > 0 
      ? (stats.totalLessonsCompleted / Math.max(stats.totalTimeSpent / (1000 * 60 * 60), 1)) * (stats.averageScore / 100)
      : 0;
    
    return {
      avgWeeklyLessons,
      consistency,
      learningEfficiency,
      streakHealth: streakInfo.isOnTrack,
      completionRate: stats.completionRate,
      velocityTrend: recentWeeks.length >= 2 
        ? recentWeeks[recentWeeks.length - 1].lessonsCompleted - recentWeeks[0].lessonsCompleted
        : 0
    };
  }, [stats, streakInfo, weeklyProgress]);
};