/**
 * User analytics and learning insights tracking
 */

export interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  properties?: Record<string, unknown>;
}

export interface LearningEvent extends AnalyticsEvent {
  trackId?: string;
  lessonId?: string;
  assessmentId?: string;
  progressPercentage?: number;
  timeSpent?: number;
  score?: number;
}

export interface UserBehaviorEvent extends AnalyticsEvent {
  elementId?: string;
  elementType?: string;
  coordinates?: { x: number; y: number };
  scrollPosition?: number;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  enableTracking: boolean;
  enableConsoleLogging: boolean;
  trackingEndpoint?: string;
  batchSize: number;
  flushInterval: number;
  enableUserBehavior: boolean;
  enableLearningAnalytics: boolean;
  enablePerformanceTracking: boolean;
  privacyMode: boolean;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  enableTracking: true,
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  batchSize: 50,
  flushInterval: 30000, // 30 seconds
  enableUserBehavior: true,
  enableLearningAnalytics: true,
  enablePerformanceTracking: true,
  privacyMode: false,
};

/**
 * Analytics manager for tracking user interactions and learning progress
 */
export class AnalyticsManager {
  private config: AnalyticsConfig;
  private eventQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private userId?: string;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined' || !this.config.enableTracking) return;

    this.setupEventListeners();
    this.startFlushTimer();
    this.trackPageView();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup automatic event listeners
   */
  private setupEventListeners(): void {
    if (!this.config.enableUserBehavior) return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track('page_visibility', 'engagement', document.hidden ? 'hidden' : 'visible');
    });

    // Track clicks on interactive elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      this.trackUserBehavior('click', {
        elementId: target.id,
        elementType: target.tagName.toLowerCase(),
        coordinates: { x: event.clientX, y: event.clientY },
      });
    });

    // Track scroll behavior
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackUserBehavior('scroll', {
          scrollPosition: window.scrollY,
        });
      }, 100);
    });

    // Track form interactions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.trackUserBehavior('form_submit', {
        elementId: form.id,
        elementType: 'form',
      });
    });

    // Track input focus and blur
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        this.trackUserBehavior('input_focus', {
          elementId: target.id,
          elementType: target.tagName.toLowerCase(),
        });
      }
    });
  }

  /**
   * Start the flush timer for batched event sending
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.track('user_identified', 'auth', 'login', undefined, { userId });
  }

  /**
   * Clear user ID (logout)
   */
  clearUserId(): void {
    this.track('user_logout', 'auth', 'logout');
    this.userId = undefined;
  }

  /**
   * Track a generic event
   */
  track(
    event: string,
    category: string,
    action: string,
    label?: string,
    properties?: Record<string, unknown>
  ): void {
    if (!this.config.enableTracking) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      category,
      action,
      label,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      properties: this.config.privacyMode ? this.sanitizeProperties(properties) : properties,
    };

    this.addEvent(analyticsEvent);
  }

  /**
   * Track learning-specific events
   */
  trackLearning(
    action: string,
    data: {
      trackId?: string;
      lessonId?: string;
      assessmentId?: string;
      progressPercentage?: number;
      timeSpent?: number;
      score?: number;
      properties?: Record<string, unknown>;
    }
  ): void {
    if (!this.config.enableLearningAnalytics) return;

    const learningEvent: LearningEvent = {
      event: 'learning_action',
      category: 'learning',
      action,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      trackId: data.trackId,
      lessonId: data.lessonId,
      assessmentId: data.assessmentId,
      progressPercentage: data.progressPercentage,
      timeSpent: data.timeSpent,
      score: data.score,
      properties: this.config.privacyMode ? this.sanitizeProperties(data.properties) : data.properties,
    };

    this.addEvent(learningEvent);
  }

  /**
   * Track user behavior events
   */
  trackUserBehavior(
    action: string,
    data: {
      elementId?: string;
      elementType?: string;
      coordinates?: { x: number; y: number };
      scrollPosition?: number;
      properties?: Record<string, unknown>;
    }
  ): void {
    if (!this.config.enableUserBehavior) return;

    const behaviorEvent: UserBehaviorEvent = {
      event: 'user_behavior',
      category: 'interaction',
      action,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      elementId: data.elementId,
      elementType: data.elementType,
      coordinates: data.coordinates,
      scrollPosition: data.scrollPosition,
      properties: this.config.privacyMode ? this.sanitizeProperties(data.properties) : data.properties,
    };

    this.addEvent(behaviorEvent);
  }

  /**
   * Track page views
   */
  trackPageView(url?: string): void {
    this.track('page_view', 'navigation', 'view', url || (typeof window !== 'undefined' ? window.location.pathname : ''));
  }

  /**
   * Track errors
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.track('error', 'system', 'javascript_error', error.message, {
      stack: error.stack,
      context: this.config.privacyMode ? this.sanitizeProperties(context) : context,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, properties?: Record<string, unknown>): void {
    if (!this.config.enablePerformanceTracking) return;

    this.track('performance_metric', 'performance', metric, undefined, {
      value,
      ...properties,
    });
  }

  /**
   * Add event to queue
   */
  private addEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);

    if (this.config.enableConsoleLogging) {
      console.log('Analytics:', event);
    }

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Sanitize properties for privacy mode
   */
  private sanitizeProperties(properties?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!properties) return undefined;

    const sanitized: Record<string, unknown> = {};
    const allowedKeys = ['category', 'type', 'status', 'score', 'duration', 'count'];

    Object.keys(properties).forEach((key) => {
      if (allowedKeys.includes(key)) {
        sanitized[key] = properties[key];
      }
    });

    return sanitized;
  }

  /**
   * Flush events to analytics endpoint
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.config.trackingEndpoint) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch(this.config.trackingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (this.config.enableConsoleLogging) {
        console.log(`Analytics: Flushed ${events.length} events`);
      }
    } catch (error) {
      console.warn('Failed to send analytics events:', error);
      
      // Re-add events to queue if sending failed
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    totalEvents: number;
    queuedEvents: number;
    sessionId: string;
    userId?: string;
    categories: Record<string, number>;
    actions: Record<string, number>;
  } {
    const categories: Record<string, number> = {};
    const actions: Record<string, number> = {};

    this.eventQueue.forEach((event) => {
      categories[event.category] = (categories[event.category] || 0) + 1;
      actions[event.action] = (actions[event.action] || 0) + 1;
    });

    return {
      totalEvents: this.eventQueue.length,
      queuedEvents: this.eventQueue.length,
      sessionId: this.sessionId,
      userId: this.userId,
      categories,
      actions,
    };
  }

  /**
   * Clear all events from queue
   */
  clearEvents(): void {
    this.eventQueue = [];
  }

  /**
   * Destroy analytics manager
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush remaining events
    this.flush();
  }
}

// Global analytics manager instance
export const analyticsManager = new AnalyticsManager();

/**
 * React hook for analytics tracking
 */
export function useAnalytics() {
  // Import React hooks dynamically but always call them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useEffect = (globalThis as any)?.React?.useEffect || (() => {});
  const useCallback = (globalThis as typeof globalThis & { React?: { useCallback?: typeof import('react').useCallback } })?.React?.useCallback || ((fn: unknown) => fn);

  // Always call hooks at the top level
  useEffect(() => {
    // Only track if we're in the browser
    if (typeof window !== 'undefined') {
      // Track component mount
      analyticsManager.track('component_mount', 'react', 'mount');

      return () => {
        // Track component unmount
        analyticsManager.track('component_unmount', 'react', 'unmount');
      };
    }
  }, []);

  const track = useCallback((
    event: string,
    category: string,
    action: string,
    label?: string,
    properties?: Record<string, unknown>
  ) => {
    if (typeof window !== 'undefined') {
      analyticsManager.track(event, category, action, label, properties);
    }
  }, []);

  const trackLearning = useCallback((action: string, data: {
    trackId?: string;
    lessonId?: string;
    assessmentId?: string;
    progressPercentage?: number;
    timeSpent?: number;
    score?: number;
    properties?: Record<string, unknown>;
  }) => {
    if (typeof window !== 'undefined') {
      analyticsManager.trackLearning(action, data);
    }
  }, []);

  const trackError = useCallback((error: Error, context?: Record<string, unknown>) => {
    if (typeof window !== 'undefined') {
      analyticsManager.trackError(error, context);
    }
  }, []);

  // Return functions that handle server-side gracefully
  return {
    track,
    trackLearning,
    trackError,
    setUserId: (userId: string) => {
      if (typeof window !== 'undefined') {
        analyticsManager.setUserId(userId);
      }
    },
    clearUserId: () => {
      if (typeof window !== 'undefined') {
        analyticsManager.clearUserId();
      }
    },
    getSummary: () => {
      if (typeof window !== 'undefined') {
        return analyticsManager.getAnalyticsSummary();
      }
      return {};
    },
  };
}

/**
 * Learning analytics utilities
 */
export class LearningAnalytics {
  /**
   * Track lesson start
   */
  static trackLessonStart(trackId: string, lessonId: string): void {
    analyticsManager.trackLearning('lesson_start', {
      trackId,
      lessonId,
      properties: { timestamp: Date.now() },
    });
  }

  /**
   * Track lesson completion
   */
  static trackLessonComplete(trackId: string, lessonId: string, timeSpent: number, score?: number): void {
    analyticsManager.trackLearning('lesson_complete', {
      trackId,
      lessonId,
      timeSpent,
      score,
      properties: { timestamp: Date.now() },
    });
  }

  /**
   * Track assessment submission
   */
  static trackAssessmentSubmit(assessmentId: string, score: number, timeSpent: number): void {
    analyticsManager.trackLearning('assessment_submit', {
      assessmentId,
      score,
      timeSpent,
      properties: { timestamp: Date.now() },
    });
  }

  /**
   * Track progress update
   */
  static trackProgressUpdate(trackId: string, progressPercentage: number): void {
    analyticsManager.trackLearning('progress_update', {
      trackId,
      progressPercentage,
      properties: { timestamp: Date.now() },
    });
  }

  /**
   * Track track enrollment
   */
  static trackTrackEnrollment(trackId: string): void {
    analyticsManager.trackLearning('track_enroll', {
      trackId,
      properties: { timestamp: Date.now() },
    });
  }

  /**
   * Track study session
   */
  static trackStudySession(duration: number, activitiesCompleted: number): void {
    analyticsManager.trackLearning('study_session', {
      timeSpent: duration,
      properties: {
        activitiesCompleted,
        timestamp: Date.now(),
      },
    });
  }
}