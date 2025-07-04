// src/features/ai-tutor/stores/index.ts
// Zustand store exports for AI Tutor feature

// Chat store
export { 
  useChatStore, 
  useChatSelectors, 
  useChatActions 
} from './chatStore';

// Learning store
export { 
  useLearningStore, 
  useLearningSelectors, 
  useLearningActions 
} from './learningStore';

// User store
export { 
  useUserStore, 
  useUserSelectors, 
  useUserActions,
  ACHIEVEMENTS,
  ACHIEVEMENT_DESCRIPTIONS 
} from './userStore';

// Comprehensive Learning Store (TASK-010)
export { 
  default as useComprehensiveLearningStore 
} from './comprehensiveLearningStore';

export {
  useLearningSelectors as useComprehensiveLearningSelectors,
  useLearningActions as useComprehensiveLearningActions,
  useComputedLearningData,
  useLearningPerformanceMetrics
} from '../hooks/useLearningSelectors';

// Re-export types for convenience
export type {
  ChatState,
  LearningState,
  UserState,
  TabType,
  Message,
  LearningTrack,
  ProgressData,
  SkillAssessment,
  Flashcard,
  LearningSession,
  UserPreferences
} from '../types';

// Re-export comprehensive learning types
export type {
  ComprehensiveLearningState,
  TrackProgress,
  LessonProgress,
  AssessmentResult,
  LearningPreferences,
  Achievement,
  LearningGoal,
  LearningStats,
  StreakInfo,
  WeeklyProgress,
  LearningRecommendation,
  SkillProgression,
  LearningAnalytics,
  OfflineAction,
  SyncStatus
} from '../types/learning';
