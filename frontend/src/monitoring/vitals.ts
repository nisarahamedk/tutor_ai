import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { analyticsManager } from './analytics';

/**
 * Web Vitals monitoring and reporting
 */

export interface VitalsConfig {
  enableReporting: boolean;
  reportAllChanges: boolean;
  enableAnalytics: boolean;
  enableConsoleLogging: boolean;
  thresholds: {
    CLS: { good: number; poor: number };
    INP: { good: number; poor: number };
    FCP: { good: number; poor: number };
    LCP: { good: number; poor: number };
    TTFB: { good: number; poor: number };
  };
}

const DEFAULT_CONFIG: VitalsConfig = {
  enableReporting: true,
  reportAllChanges: true,
  enableAnalytics: true,
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  thresholds: {
    CLS: { good: 0.1, poor: 0.25 },
    INP: { good: 200, poor: 500 },
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    TTFB: { good: 800, poor: 1800 },
  },
};

/**
 * Web Vitals manager
 */
export class WebVitalsManager {
  private config: VitalsConfig;
  private metrics: Map<string, Metric> = new Map();
  private callbacks: Array<(metric: Metric) => void> = [];

  constructor(config: Partial<VitalsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    this.setupVitalsTracking();
  }

  /**
   * Setup Core Web Vitals tracking
   */
  private setupVitalsTracking(): void {
    const handleMetric = (metric: Metric) => {
      this.handleMetric(metric);
    };

    // Track all Core Web Vitals
    onCLS(handleMetric, { reportAllChanges: this.config.reportAllChanges });
    onINP(handleMetric, { reportAllChanges: this.config.reportAllChanges });
    onFCP(handleMetric, { reportAllChanges: this.config.reportAllChanges });
    onLCP(handleMetric, { reportAllChanges: this.config.reportAllChanges });
    onTTFB(handleMetric, { reportAllChanges: this.config.reportAllChanges });
  }

  /**
   * Handle incoming metrics
   */
  private handleMetric(metric: Metric): void {
    // Store the metric
    this.metrics.set(metric.name, metric);

    // Get performance rating
    const rating = this.getRating(metric.name, metric.value);

    // Log to console if enabled
    if (this.config.enableConsoleLogging) {
      console.log(`Web Vital ${metric.name}:`, {
        value: metric.value,
        rating,
        id: metric.id,
        navigationType: metric.navigationType,
      });
    }

    // Send to analytics if enabled
    if (this.config.enableAnalytics) {
      analyticsManager.trackPerformance(metric.name, metric.value, {
        rating,
        id: metric.id,
        navigationType: metric.navigationType,
        delta: metric.delta,
      });
    }

    // Call registered callbacks
    this.callbacks.forEach((callback) => {
      try {
        callback(metric);
      } catch (error) {
        console.error('Error in vitals callback:', error);
      }
    });

    // Report critical metrics immediately
    if (rating === 'poor' && this.config.enableReporting) {
      this.reportCriticalMetric(metric, rating);
    }
  }

  /**
   * Get performance rating for a metric
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.config.thresholds[name as keyof typeof this.config.thresholds];
    
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Report critical metrics that need immediate attention
   */
  private async reportCriticalMetric(metric: Metric, rating: string): Promise<void> {
    try {
      await fetch('/api/vitals/critical', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: metric.name,
          value: metric.value,
          rating,
          id: metric.id,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.warn('Failed to report critical metric:', error);
    }
  }

  /**
   * Register a callback for metric updates
   */
  onMetric(callback: (metric: Metric) => void): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): Map<string, Metric> {
    return new Map(this.metrics);
  }

  /**
   * Get specific metric
   */
  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    CLS?: { value: number; rating: string };
    FID?: { value: number; rating: string };
    FCP?: { value: number; rating: string };
    LCP?: { value: number; rating: string };
    TTFB?: { value: number; rating: string };
    overallScore: number;
    recommendations: string[];
  } {
    const summary: Record<string, { value: number; rating: string }> = {};
    let totalScore = 0;
    let metricCount = 0;
    const recommendations: string[] = [];

    ['CLS', 'INP', 'FCP', 'LCP', 'TTFB'].forEach((name) => {
      const metric = this.metrics.get(name);
      if (metric) {
        const rating = this.getRating(name, metric.value);
        summary[name] = { value: metric.value, rating };

        // Calculate score (good=100, needs-improvement=50, poor=0)
        const score = rating === 'good' ? 100 : rating === 'needs-improvement' ? 50 : 0;
        totalScore += score;
        metricCount++;

        // Add recommendations for poor metrics
        if (rating === 'poor') {
          recommendations.push(...this.getRecommendations(name));
        }
      }
    });

    const overallScore = metricCount > 0 ? Math.round(totalScore / metricCount) : 0;

    return {
      ...summary,
      overallScore,
      recommendations,
    };
  }

  /**
   * Get recommendations for improving specific metrics
   */
  private getRecommendations(metric: string): string[] {
    const recommendations: Record<string, string[]> = {
      CLS: [
        'Ensure images and videos have width and height attributes',
        'Avoid inserting content above existing content',
        'Use CSS transforms instead of changing layout properties',
        'Preload fonts to prevent font swapping',
      ],
      INP: [
        'Minimize JavaScript execution time',
        'Break up long tasks into smaller chunks',
        'Use web workers for heavy computations',
        'Optimize third-party scripts',
        'Reduce main thread blocking time',
      ],
      FCP: [
        'Optimize server response times',
        'Eliminate render-blocking resources',
        'Minify CSS and JavaScript',
        'Use efficient image formats',
      ],
      LCP: [
        'Optimize images and preload hero images',
        'Improve server response times',
        'Remove unused CSS and JavaScript',
        'Use a CDN for static assets',
      ],
      TTFB: [
        'Optimize server configuration',
        'Use a CDN',
        'Implement server-side caching',
        'Optimize database queries',
      ],
    };

    return recommendations[metric] || [];
  }

  /**
   * Export metrics data
   */
  exportMetrics(): string {
    const data = {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      metrics: Array.from(this.metrics.entries()).map(([name, metric]) => ({
        name,
        value: metric.value,
        rating: this.getRating(name, metric.value),
        id: metric.id,
        navigationType: metric.navigationType,
        delta: metric.delta,
      })),
      summary: this.getMetricsSummary(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Global Web Vitals manager instance
export const webVitalsManager = new WebVitalsManager();

/**
 * React hook for Web Vitals monitoring
 */
export function useWebVitals() {
  // Use dynamic access for React hooks but always call them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useState = (globalThis as any)?.React?.useState || (() => [null, () => {}]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useEffect = (globalThis as any)?.React?.useEffect || (() => {});
  
  // Always call hooks at the top level
  const [metrics, setMetrics] = useState(new Map());
  const [summary, setSummary] = useState({} as {
    CLS?: { value: number; rating: string };
    FID?: { value: number; rating: string };
    FCP?: { value: number; rating: string };
    LCP?: { value: number; rating: string };
    TTFB?: { value: number; rating: string };
    overallScore: number;
    recommendations: string[];
  });

  useEffect(() => {
    // Only set up monitoring if we're in the browser
    if (typeof window !== 'undefined') {
      const unsubscribe = webVitalsManager.onMetric(() => {
        setMetrics(new Map(webVitalsManager.getMetrics()));
        setSummary(webVitalsManager.getMetricsSummary());
      });

      // Initial state
      setMetrics(webVitalsManager.getMetrics());
      setSummary(webVitalsManager.getMetricsSummary());

      return unsubscribe;
    }
  }, []);

  return {
    metrics,
    summary,
    exportMetrics: () => {
      if (typeof window !== 'undefined') {
        return webVitalsManager.exportMetrics();
      }
      return '';
    },
    clearMetrics: () => {
      if (typeof window !== 'undefined') {
        webVitalsManager.clearMetrics();
      }
    },
  };
}

/**
 * Performance budget checker
 */
export class PerformanceBudget {
  private budgets: Record<string, number>;

  constructor(budgets: Record<string, number> = {}) {
    this.budgets = {
      CLS: 0.1,
      FID: 100,
      FCP: 1800,
      LCP: 2500,
      TTFB: 800,
      ...budgets,
    };
  }

  /**
   * Check if metrics meet the performance budget
   */
  checkBudget(metrics: Map<string, Metric>): {
    passed: boolean;
    violations: Array<{
      metric: string;
      actual: number;
      budget: number;
      overage: number;
    }>;
    score: number;
  } {
    const violations: Array<{
      metric: string;
      actual: number;
      budget: number;
      overage: number;
    }> = [];
    let passedCount = 0;

    Object.entries(this.budgets).forEach(([name, budget]) => {
      const metric = metrics.get(name);
      if (metric) {
        if (metric.value > budget) {
          violations.push({
            metric: name,
            actual: metric.value,
            budget,
            overage: metric.value - budget,
          });
        } else {
          passedCount++;
        }
      }
    });

    const totalMetrics = Object.keys(this.budgets).length;
    const score = Math.round((passedCount / totalMetrics) * 100);

    return {
      passed: violations.length === 0,
      violations,
      score,
    };
  }

  /**
   * Update performance budgets
   */
  updateBudgets(newBudgets: Record<string, number>): void {
    this.budgets = { ...this.budgets, ...newBudgets };
  }

  /**
   * Get current budgets
   */
  getBudgets(): Record<string, number> {
    return { ...this.budgets };
  }
}

/**
 * Initialize Web Vitals monitoring
 */
export function initializeWebVitals(config?: Partial<VitalsConfig>): WebVitalsManager {
  return new WebVitalsManager(config);
}

/**
 * Report Web Vitals to console
 */
export function reportWebVitals(): void {
  const manager = new WebVitalsManager({ enableConsoleLogging: true });
  
  setTimeout(() => {
    const summary = manager.getMetricsSummary();
    console.table(summary);
  }, 3000); // Wait 3 seconds for metrics to be collected
}