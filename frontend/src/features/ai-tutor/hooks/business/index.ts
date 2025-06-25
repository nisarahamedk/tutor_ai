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
  useAssessmentManager,
  type AssessmentManagerReturn,
  type AssessmentAnswers
} from './useAssessmentManager';

// Learning Preferences Management (Placeholder for future implementation)
export interface LearningPreferencesManagerReturn {
  preferences: any;
  updatePreference: (key: string, value: any) => void;
  validatePreferences: () => boolean;
  resetToDefaults: () => void;
  getRecommendedSettings: () => any;
  getOptimalLearningPath: () => any;
  getPersonalizedContent: () => any;
}

// Analytics and Insights (Placeholder for future implementation)
export interface LearningAnalyticsReturn {
  learningStats: any;
  performanceMetrics: any;
  engagementData: any;
  getPersonalizedInsights: () => any[];
  getImprovementSuggestions: () => any[];
  getLearningPatterns: () => any[];
  predictSuccess: (trackId: string) => any;
  estimateCompletionTime: (trackId: string) => any;
  getOptimalStudySchedule: () => any;
  trackEvent: (event: any) => void;
  generateReport: (type: string) => Promise<any>;
}

// Type exports for comprehensive business logic
export type {
  // From existing types
  TabType,
  Message,
  OptimisticMessage,
  LearningTrack,
  TrackProgress,
  LessonProgress,
  Assessment,
  AssessmentResult,
  AssessmentAnswer,
  Achievement
} from '../../types';

export type {
  LearningStats,
  WeeklyProgress,
  StreakInfo,
  LearningPreferences,
  LearningGoal
} from '../../types/learning';