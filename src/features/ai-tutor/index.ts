// src/features/ai-tutor/index.ts
export * from './components';
export type { 
  TabType, 
  Message, 
  OptimisticMessage, 
  MessageStatus,
  LearningTrack,
  ProgressData,
  UserPreferences,
  SkillAssessment,
  AssessmentQuestion,
  Flashcard,
  LearningSession,
  ChatState,
  LearningState,
  UserState,
  StateCreator,
  StoreMiddleware
} from './types';

// Re-export hooks without conflicts
export {
  useMessageAction,
  useRetryMessage,
  useOptimisticRetry,
  useBatchOptimistic,
  createOptimisticMessage,
  toOptimisticMessage,
  isOptimisticMessage,
  getPendingMessages,
  getFailedMessages,
  countMessagesByStatus,
  useLearningSelectors,
  useLearningActions,
  useComputedLearningData,
  useLearningPerformanceMetrics
} from './hooks';

// Re-export chat selectors from hooks
export {
  useChatMessages,
  useRegularMessages,
  useOptimisticMessages,
  useActiveTab,
  useChatLoading,
  useChatError,
  useChatTyping,
  useLastMessage,
  useMessageCounts,
  useTabStatus,
  useTabIndicators,
  useStatusDisplay,
  useGlobalPendingCount,
  useHasGlobalErrors,
  useRetryCount,
  useRetryableMessages,
  useMessageListData,
  useMessageInputData
} from './hooks/useChatSelectors';

// Re-export stores
export {
  useChatStore,
  useLearningStore,
  useUserStore,
  useComprehensiveLearningStore,
  ACHIEVEMENTS,
  ACHIEVEMENT_DESCRIPTIONS
} from './stores';

// Services
export { agUiService } from './services';

// Server Actions (React 19)
export * from './actions';

// The following are not exported as their corresponding files were not found:
// export * as aiTutorQueries from './queries';
