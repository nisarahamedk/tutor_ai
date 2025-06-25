// src/features/ai-tutor/hooks/utils/index.ts
// Utility Hooks - Barrel Exports

// Performance Optimization
export {
  useOptimizedSelector,
  useDebouncedUpdate,
  useStableCallback,
  useMemoizedValue,
  useBatchUpdates,
  usePerformanceMonitor,
  useThrottledCallback,
  useTrackChanges,
  shallowEqual,
  deepEqual,
  referenceEqual,
  arrayEqual
} from './useOptimizedSelector';

// Error Boundary and Recovery
export {
  useErrorBoundary,
  useAsyncError,
  useAsyncWrapper,
  useGlobalErrorHandler,
  useErrorHandler,
  isNetworkError,
  isValidationError,
  isPermissionError,
  formatErrorForUser,
  type ErrorInfo,
  type RecoveryOption,
  type ErrorBoundaryReturn
} from './useErrorBoundary';

// Store Integration
export {
  useStoreIntegration,
  useChatLearningIntegration,
  useProgressSync,
  type CombinedState,
  type SyncConfig,
  type StoreIntegrationReturn
} from './useStoreIntegration';

// Re-export from zustand for convenience
export { useShallow } from 'zustand/react/shallow';