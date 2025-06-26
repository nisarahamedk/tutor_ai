// src/features/ai-tutor/hooks/business/index.ts
// Business Logic Hooks - Barrel Exports

// Chat Management
export { 
  useChatManager,
  useMessageComposer,
  type ChatManagerReturn,
  type MessageComposerReturn
} from './useChatManager';

// Learning Track Management
export {
  useLearningTrackManager,
  canEnrollInTrackLogic,
  calculateTrackDifficulty,
  calculateTrackSimilarity,
  type LearningTrackManagerReturn,
  type DifficultyScore
} from './useLearningTrackManager';

// Progress Tracking
export {
  useProgressTracker,
  type ProgressTrackerReturn,
  type Activity,
  type Milestone,
  type SkillAnalysis
} from './useProgressTracker';

// Assessment Management
export {
  useSkillAssessmentManager,
  type AssessmentManagerReturn,
  type AssessmentAnswers
} from './useAssessmentManager';

// Learning Preferences Management (Placeholder for future implementation)
export interface LearningPreferencesManagerReturn {
  preferences: Record<string, unknown>;
  updatePreference: (key: string, value: unknown) => void;
  validatePreferences: () => boolean;
  resetToDefaults: () => void;
  getRecommendedSettings: () => Record<string, unknown>;
  getOptimalLearningPath: () => string[];
  getPersonalizedContent: () => Record<string, unknown>[];
}

// Analytics and Insights (Placeholder for future implementation)
export interface LearningAnalyticsReturn {
  learningStats: Record<string, number | string>;
  performanceMetrics: Record<string, number>;
  engagementData: Record<string, unknown>;
  getPersonalizedInsights: () => Record<string, unknown>[];
  getImprovementSuggestions: () => string[];
  getLearningPatterns: () => Record<string, unknown>[];
  predictSuccess: (trackId: string) => number;
  estimateCompletionTime: (trackId: string) => number;
  getOptimalStudySchedule: () => Record<string, unknown>;
  trackEvent: (event: Record<string, unknown>) => void;
  generateReport: (type: string) => Promise<Record<string, unknown>>;
}

// Type exports for comprehensive business logic
export type {
  // From existing types
  TabType,
  Message,
  OptimisticMessage,
  LearningTrack,
  ProgressData,
  SkillAssessment,
  AssessmentQuestion,
  Flashcard,
  LearningSession
} from '../../types';

export type {
  LearningStats,
  WeeklyProgress,
  StreakInfo,
  LearningPreferences,
  LearningGoal,
  TrackProgress,
  LessonProgress,
  AssessmentResult,
  AssessmentAnswer,
  Achievement
} from '../../types/learning';