// src/features/ai-tutor/hooks/index.ts

// Existing hooks
export { useMessageAction } from './useMessageAction';
export { useRetryMessage } from './useRetryMessage';

// TASK-007 Optimistic hooks
export { useOptimisticRetry } from './useOptimisticRetry';
export { 
  useBatchOptimistic,
  createOptimisticMessage,
  toOptimisticMessage,
  isOptimisticMessage,
  getPendingMessages,
  getFailedMessages,
  countMessagesByStatus
} from './useBatchOptimistic';

// TASK-010 Learning store selectors
export { useLearningSelectors, useLearningActions, useComputedLearningData, useLearningPerformanceMetrics } from './useLearningSelectors';

// TASK-009 Chat store selectors (only export what exists)
export * from './useChatSelectors';

// TASK-011 Business Logic Hooks
export * from './business';
export * from './utils';

// Hook return types
export type { 
  UseOptimisticRetryResult,
  UseBatchOptimisticResult
} from '../components/chat/types';
