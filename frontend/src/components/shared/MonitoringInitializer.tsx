'use client';

import { useEffect } from 'react';
import { analyticsManager } from '@/monitoring/analytics';
import { initializeServiceWorker } from '@/utils/service-worker';

/**
 * Component to initialize monitoring and analytics
 */
export function MonitoringInitializer() {
  useEffect(() => {
    // All monitoring services are auto-initialized when their instances are created
    // No need to call init() as it's private and already called in constructors
    
    // Initialize service worker for offline support
    initializeServiceWorker().catch(console.error);
    
    // Track page load completion
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        // Performance monitor tracks page load automatically through navigation timing
        analyticsManager.track?.('page_load', 'navigation', 'complete');
      });
    }
  }, []);

  return null; // This component doesn't render anything
}

/**
 * Hook for tracking component performance
 */
export function useComponentMonitoring(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    // Track component mount
    analyticsManager.track?.('component_mount', 'react', 'mount', componentName);
    
    return () => {
      const duration = performance.now() - startTime;
      
      // Component lifetime is tracked automatically through the performance monitor
      analyticsManager.track?.('component_unmount', 'react', 'unmount', componentName, {
        duration,
      });
    };
  }, [componentName]);
}

/**
 * Hook for tracking user interactions
 */
export function useInteractionTracking() {
  const trackClick = (elementId: string, elementType: string = 'button') => {
    analyticsManager.trackUserBehavior?.('click', {
      elementId,
      elementType,
    });
  };

  const trackFormSubmit = (formId: string) => {
    analyticsManager.trackUserBehavior?.('form_submit', {
      elementId: formId,
      elementType: 'form',
    });
  };

  const trackScroll = (position: number) => {
    analyticsManager.trackUserBehavior?.('scroll', {
      scrollPosition: position,
    });
  };

  return {
    trackClick,
    trackFormSubmit,
    trackScroll,
  };
}

/**
 * Hook for tracking learning events
 */
export function useLearningTracking() {
  const trackLessonStart = (trackId: string, lessonId: string) => {
    analyticsManager.trackLearning?.('lesson_start', {
      trackId,
      lessonId,
    });
  };

  const trackLessonComplete = (trackId: string, lessonId: string, timeSpent: number, score?: number) => {
    analyticsManager.trackLearning?.('lesson_complete', {
      trackId,
      lessonId,
      timeSpent,
      score,
    });
  };

  const trackAssessmentSubmit = (assessmentId: string, score: number, timeSpent: number) => {
    analyticsManager.trackLearning?.('assessment_submit', {
      assessmentId,
      score,
      timeSpent,
    });
  };

  const trackProgressUpdate = (trackId: string, progressPercentage: number) => {
    analyticsManager.trackLearning?.('progress_update', {
      trackId,
      progressPercentage,
    });
  };

  return {
    trackLessonStart,
    trackLessonComplete,
    trackAssessmentSubmit,
    trackProgressUpdate,
  };
}

/**
 * Hook for tracking errors
 */
export function useErrorTracking() {
  const trackError = (error: Error, context?: Record<string, unknown>) => {
    analyticsManager.trackError?.(error, context);
  };

  const trackApiError = (endpoint: string, status: number, message: string) => {
    analyticsManager.track?.('api_error', 'error', 'api_call', endpoint, {
      status,
      message,
    });
  };

  const trackValidationError = (field: string, message: string) => {
    analyticsManager.track?.('validation_error', 'error', 'validation', field, {
      message,
    });
  };

  return {
    trackError,
    trackApiError,
    trackValidationError,
  };
}