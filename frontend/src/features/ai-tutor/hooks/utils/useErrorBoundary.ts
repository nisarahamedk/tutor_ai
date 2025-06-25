// src/features/ai-tutor/hooks/utils/useErrorBoundary.ts
// Error Boundary and Recovery Utility Hook

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Error information interface
 */
export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

/**
 * Recovery option for error handling
 */
export interface RecoveryOption {
  id: string;
  label: string;
  description: string;
  action: () => Promise<void> | void;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Error boundary return interface
 */
export interface ErrorBoundaryReturn {
  // State
  error: Error | null;
  hasError: boolean;
  errorInfo: ErrorInfo | null;
  
  // Actions
  clearError: () => void;
  reportError: (error: Error, errorInfo?: ErrorInfo) => void;
  retry: () => void;
  
  // Recovery
  getRecoveryOptions: () => RecoveryOption[];
  executeRecovery: (option: RecoveryOption) => Promise<void>;
}

/**
 * Error boundary hook for graceful error handling and recovery
 * 
 * Provides:
 * - Error state management
 * - Error reporting and analytics
 * - Recovery mechanisms
 * - User-friendly error handling
 */
export const useErrorBoundary = (): ErrorBoundaryReturn => {
  // Error state
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Recovery function ref
  const recoveryFunctionRef = useRef<(() => void) | null>(null);
  
  // Error reporting
  const reportError = useCallback((error: Error, info?: ErrorInfo): void => {
    setError(error);
    setErrorInfo(info || null);
    
    // Report to analytics/monitoring service
    if (process.env.NODE_ENV === 'production') {
      // In a real app, this would send to error tracking service
      console.error('Error reported:', {
        message: error.message,
        stack: error.stack,
        componentStack: info?.componentStack,
        timestamp: new Date().toISOString(),
        retryCount
      });
    } else {
      console.error('Development error:', error, info);
    }
  }, [retryCount]);

  // Clear error state
  const clearError = useCallback((): void => {
    setError(null);
    setErrorInfo(null);
    setRetryCount(0);
  }, []);

  // Retry functionality
  const retry = useCallback((): void => {
    if (retryCount >= 3) {
      reportError(
        new Error('Maximum retry attempts exceeded'),
        { componentStack: 'useErrorBoundary' }
      );
      return;
    }
    
    setRetryCount(prev => prev + 1);
    clearError();
    
    // Execute recovery function if available
    if (recoveryFunctionRef.current) {
      try {
        recoveryFunctionRef.current();
      } catch (retryError) {
        reportError(
          retryError instanceof Error ? retryError : new Error('Retry failed'),
          { componentStack: 'useErrorBoundary.retry' }
        );
      }
    }
  }, [retryCount, clearError, reportError]);

  // Get recovery options based on error type
  const getRecoveryOptions = useCallback((): RecoveryOption[] => {
    if (!error) return [];
    
    const options: RecoveryOption[] = [];
    
    // Basic retry option
    if (retryCount < 3) {
      options.push({
        id: 'retry',
        label: 'Try Again',
        description: 'Retry the operation that failed',
        action: retry,
        severity: 'low'
      });
    }
    
    // Refresh page option for critical errors
    if (error.message.includes('chunk') || error.message.includes('module')) {
      options.push({
        id: 'refresh',
        label: 'Refresh Page',
        description: 'Reload the page to get the latest version',
        action: () => window.location.reload(),
        severity: 'medium'
      });
    }
    
    // Clear cache option for persistent errors
    if (retryCount >= 2) {
      options.push({
        id: 'clear-cache',
        label: 'Clear Cache',
        description: 'Clear browser cache and reload',
        action: async () => {
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          localStorage.clear();
          sessionStorage.clear();
          window.location.reload();
        },
        severity: 'medium'
      });
    }
    
    // Reset to home option for navigation errors
    if (error.message.includes('navigation') || error.message.includes('route')) {
      options.push({
        id: 'go-home',
        label: 'Go to Home',
        description: 'Return to the home page',
        action: () => {
          window.location.href = '/';
        },
        severity: 'low'
      });
    }
    
    // Contact support option for unrecoverable errors
    options.push({
      id: 'contact-support',
      label: 'Contact Support',
      description: 'Report this issue to our support team',
      action: () => {
        // In a real app, this would open a support form or email
        const errorDetails = {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        };
        
        console.log('Support request:', errorDetails);
        alert('Error details have been logged. Please contact support if the issue persists.');
      },
      severity: 'high'
    });
    
    return options;
  }, [error, retryCount, retry]);

  // Execute recovery option
  const executeRecovery = useCallback(async (option: RecoveryOption): Promise<void> => {
    try {
      await option.action();
      
      // Log recovery action
      console.log(`Recovery action executed: ${option.id}`);
      
      // Clear error if recovery was successful and it's not a page reload action
      if (option.id !== 'refresh' && option.id !== 'clear-cache' && option.id !== 'go-home') {
        clearError();
      }
    } catch (recoveryError) {
      reportError(
        recoveryError instanceof Error 
          ? recoveryError 
          : new Error(`Recovery action failed: ${option.id}`),
        { componentStack: 'useErrorBoundary.executeRecovery' }
      );
    }
  }, [clearError, reportError]);

  // Computed properties
  const hasError = error !== null;

  return {
    // State
    error,
    hasError,
    errorInfo,
    
    // Actions
    clearError,
    reportError,
    retry,
    
    // Recovery
    getRecoveryOptions,
    executeRecovery
  };
};

/**
 * Hook to catch and handle async errors
 */
export const useAsyncError = () => {
  const { reportError } = useErrorBoundary();
  
  return useCallback((error: Error) => {
    reportError(error, {
      componentStack: 'async-error'
    });
  }, [reportError]);
};

/**
 * Hook to wrap async functions with error handling
 */
export const useAsyncWrapper = () => {
  const handleAsyncError = useAsyncError();
  
  return useCallback(<T extends (...args: any[]) => Promise<any>>(
    asyncFunction: T
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await asyncFunction(...args);
      } catch (error) {
        handleAsyncError(error instanceof Error ? error : new Error(String(error)));
        throw error; // Re-throw to allow local handling
      }
    }) as T;
  }, [handleAsyncError]);
};

/**
 * Hook for setting up global error handlers
 */
export const useGlobalErrorHandler = () => {
  const { reportError } = useErrorBoundary();
  
  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      reportError(
        new Error(`Unhandled promise rejection: ${event.reason}`),
        { componentStack: 'global-promise-rejection' }
      );
    };
    
    // Handle JavaScript errors
    const handleError = (event: ErrorEvent) => {
      reportError(
        new Error(`Global error: ${event.message}`),
        { componentStack: `${event.filename}:${event.lineno}:${event.colno}` }
      );
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [reportError]);
};

/**
 * Hook for error boundaries in React components
 */
export const useErrorHandler = () => {
  const { reportError } = useErrorBoundary();
  
  return useCallback((error: Error, errorInfo: { componentStack: string }) => {
    reportError(error, {
      componentStack: errorInfo.componentStack
    });
  }, [reportError]);
};

/**
 * Type guard to check if an error is a specific type
 */
export const isNetworkError = (error: Error): boolean => {
  return error.message.includes('fetch') || 
         error.message.includes('network') ||
         error.message.includes('timeout') ||
         error.name === 'NetworkError';
};

/**
 * Type guard to check if an error is a validation error
 */
export const isValidationError = (error: Error): boolean => {
  return error.message.includes('validation') ||
         error.message.includes('invalid') ||
         error.name === 'ValidationError';
};

/**
 * Type guard to check if an error is a permission error
 */
export const isPermissionError = (error: Error): boolean => {
  return error.message.includes('permission') ||
         error.message.includes('unauthorized') ||
         error.message.includes('forbidden') ||
         error.name === 'PermissionError';
};

/**
 * Utility function to format error messages for users
 */
export const formatErrorForUser = (error: Error): string => {
  if (isNetworkError(error)) {
    return 'Connection problem. Please check your internet connection and try again.';
  }
  
  if (isValidationError(error)) {
    return 'Please check your input and try again.';
  }
  
  if (isPermissionError(error)) {
    return 'You don\'t have permission to perform this action.';
  }
  
  // Generic user-friendly message
  return 'Something went wrong. Please try again or contact support if the problem persists.';
};