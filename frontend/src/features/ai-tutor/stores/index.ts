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
