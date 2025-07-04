import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Performance monitoring and Core Web Vitals tracking
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id: string;
  url: string;
  userAgent: string;
}

export interface PerformanceConfig {
  enableReporting: boolean;
  reportingEndpoint?: string;
  sampleRate: number;
  enableConsoleLogging: boolean;
  enableUserTiming: boolean;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableReporting: true,
  sampleRate: 1.0,
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableUserTiming: true,
};

/**
 * Performance monitoring manager
 */
export class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;

    this.setupWebVitals();
    this.setupResourceTiming();
    this.setupNavigationTiming();
    this.setupUserTiming();
    this.setupCustomMetrics();
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  private setupWebVitals(): void {
    const handleMetric = (metric: Metric) => {
      this.recordMetric({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: Date.now(),
        id: metric.id,
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    };

    // Core Web Vitals
    onCLS(handleMetric, { reportAllChanges: this.config.enableReporting });
    onINP(handleMetric, { reportAllChanges: this.config.enableReporting });
    onFCP(handleMetric, { reportAllChanges: this.config.enableReporting });
    onLCP(handleMetric, { reportAllChanges: this.config.enableReporting });
    onTTFB(handleMetric, { reportAllChanges: this.config.enableReporting });
  }

  /**
   * Setup resource timing monitoring
   */
  private setupResourceTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.recordResourceMetric(entry as PerformanceResourceTiming);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  /**
   * Setup navigation timing monitoring
   */
  private setupNavigationTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          this.recordNavigationMetric(entry as PerformanceNavigationTiming);
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  /**
   * Setup user timing monitoring
   */
  private setupUserTiming(): void {
    if (!this.config.enableUserTiming || !('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          this.recordMetric({
            name: `user_timing_${entry.name}`,
            value: entry.duration,
            rating: this.getRating(entry.duration, 'user_timing'),
            timestamp: Date.now(),
            id: crypto.randomUUID(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });
    this.observers.push(observer);
  }

  /**
   * Setup custom performance metrics
   */
  private setupCustomMetrics(): void {
    // Monitor React hydration time
    this.measureReactHydration();
    
    // Monitor bundle loading times
    this.measureBundleLoading();
    
    // Monitor API response times
    this.measureAPIResponses();
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    if (this.config.enableConsoleLogging) {
      console.log(`Performance: ${metric.name} = ${metric.value}ms (${metric.rating})`);
    }

    if (this.config.enableReporting && Math.random() < this.config.sampleRate) {
      this.reportMetric(metric);
    }
  }

  /**
   * Record resource timing metrics
   */
  private recordResourceMetric(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.requestStart;
    
    this.recordMetric({
      name: `resource_${this.getResourceType(entry.name)}`,
      value: duration,
      rating: this.getRating(duration, 'resource'),
      timestamp: Date.now(),
      id: crypto.randomUUID(),
      url: entry.name,
      userAgent: navigator.userAgent,
    });
  }

  /**
   * Record navigation timing metrics
   */
  private recordNavigationMetric(entry: PerformanceNavigationTiming): void {
    const metrics = [
      { name: 'dns_lookup', value: entry.domainLookupEnd - entry.domainLookupStart },
      { name: 'tcp_connection', value: entry.connectEnd - entry.connectStart },
      { name: 'request_response', value: entry.responseEnd - entry.requestStart },
      { name: 'dom_processing', value: (entry as PerformanceNavigationTiming & { domComplete: number; domLoading: number }).domComplete - (entry as PerformanceNavigationTiming & { domComplete: number; domLoading: number }).domLoading },
      { name: 'page_load', value: entry.loadEventEnd - entry.loadEventStart },
    ];

    metrics.forEach((metric) => {
      if (metric.value > 0) {
        this.recordMetric({
          name: metric.name,
          value: metric.value,
          rating: this.getRating(metric.value, metric.name),
          timestamp: Date.now(),
          id: crypto.randomUUID(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        });
      }
    });
  }

  /**
   * Measure React hydration time
   */
  private measureReactHydration(): void {
    if (typeof window === 'undefined') return;

    performance.mark('react-hydration-start');
    
    // Wait for React to be ready
    const checkReactReady = () => {
      if (document.readyState === 'complete') {
        performance.mark('react-hydration-end');
        performance.measure('react-hydration', 'react-hydration-start', 'react-hydration-end');
      } else {
        setTimeout(checkReactReady, 10);
      }
    };

    checkReactReady();
  }

  /**
   * Measure bundle loading times
   */
  private measureBundleLoading(): void {
    if (typeof window === 'undefined') return;

    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      if (src.includes('/_next/') || src.includes('/static/')) {
        this.measureResourceLoad(src, 'bundle');
      }
    });
  }

  /**
   * Measure API response times
   */
  private measureAPIResponses(): void {
    if (typeof window === 'undefined') return;

    // Monkey patch fetch to measure API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        if (args[0] && typeof args[0] === 'string' && args[0].includes('/api/')) {
          this.recordMetric({
            name: 'api_response_time',
            value: duration,
            rating: this.getRating(duration, 'api'),
            timestamp: Date.now(),
            id: crypto.randomUUID(),
            url: args[0],
            userAgent: navigator.userAgent,
          });
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordMetric({
          name: 'api_error_time',
          value: duration,
          rating: 'poor',
          timestamp: Date.now(),
          id: crypto.randomUUID(),
          url: args[0] as string,
          userAgent: navigator.userAgent,
        });

        throw error;
      }
    };
  }

  /**
   * Measure resource loading time
   */
  private measureResourceLoad(url: string, type: string): void {
    const startTime = performance.now();
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.onload = () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.recordMetric({
        name: `${type}_load_time`,
        value: duration,
        rating: this.getRating(duration, type),
        timestamp: Date.now(),
        id: crypto.randomUUID(),
        url,
        userAgent: navigator.userAgent,
      });
    };
    
    document.head.appendChild(link);
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.endsWith('.js')) return 'script';
    if (url.endsWith('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  /**
   * Get performance rating based on metric type and value
   */
  private getRating(value: number, type: string): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      INP: { good: 200, poor: 500 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
      resource: { good: 1000, poor: 3000 },
      api: { good: 500, poor: 2000 },
      user_timing: { good: 100, poor: 500 },
      dns_lookup: { good: 50, poor: 200 },
      tcp_connection: { good: 100, poor: 500 },
      request_response: { good: 200, poor: 1000 },
      dom_processing: { good: 1000, poor: 3000 },
      page_load: { good: 500, poor: 2000 },
      bundle: { good: 1000, poor: 3000 },
      script: { good: 500, poor: 2000 },
      stylesheet: { good: 500, poor: 2000 },
      image: { good: 1000, poor: 3000 },
      font: { good: 1000, poor: 3000 },
      other: { good: 1000, poor: 3000 },
    };

    const threshold = thresholds[type as keyof typeof thresholds] || thresholds.other;
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Report metric to analytics endpoint
   */
  private async reportMetric(metric: PerformanceMetric): Promise<void> {
    if (!this.config.reportingEndpoint) return;

    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.warn('Failed to report performance metric:', error);
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): Record<string, {
    count: number;
    average: number;
    min: number;
    max: number;
    good: number;
    needsImprovement: number;
    poor: number;
  }> {
    const summary: Record<string, {
      values: number[];
      good: number;
      needsImprovement: number;
      poor: number;
    }> = {};

    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          values: [],
          good: 0,
          needsImprovement: 0,
          poor: 0,
        };
      }

      summary[metric.name].values.push(metric.value);
      summary[metric.name][metric.rating === 'needs-improvement' ? 'needsImprovement' : metric.rating]++;
    });

    const finalSummary: Record<string, {
      count: number;
      average: number;
      min: number;
      max: number;
      good: number;
      needsImprovement: number;
      poor: number;
    }> = {};

    Object.keys(summary).forEach((name) => {
      const values = summary[name].values;
      finalSummary[name] = {
        count: values.length,
        average: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        good: summary[name].good,
        needsImprovement: summary[name].needsImprovement,
        poor: summary[name].poor,
      };
    });

    return finalSummary;
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Disconnect all observers
   */
  disconnect(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitoring(componentName?: string) {
  // Use dynamic access for React hooks but always call them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useEffect = (globalThis as any)?.React?.useEffect || (() => {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const useRef = (globalThis as any)?.React?.useRef || (() => ({ current: undefined }));
  
  // Always call hooks at the top level
  const startTimeRef = useRef(undefined as number | undefined);

  useEffect(() => {
    // Only measure if we're in the browser and have a component name
    if (typeof window !== 'undefined' && componentName) {
      startTimeRef.current = performance.now();
      performance.mark(`${componentName}-start`);

      return () => {
        if (startTimeRef.current) {
          const endTime = performance.now();
          const duration = endTime - startTimeRef.current;
          
          performance.mark(`${componentName}-end`);
          performance.measure(componentName, `${componentName}-start`, `${componentName}-end`);

          // Record metric manually without using private method
          console.log(`Performance: component_${componentName} = ${duration}ms`);
        }
      };
    }
  }, [componentName]);

  return {
    startMeasure: (name: string) => {
      if (typeof window !== 'undefined') {
        performance.mark(`${name}-start`);
      }
    },
    endMeasure: (name: string) => {
      if (typeof window !== 'undefined') {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
    },
    getMetrics: () => {
      if (typeof window !== 'undefined') {
        return performanceMonitor.getMetrics();
      }
      return [];
    },
    getSummary: () => {
      if (typeof window !== 'undefined') {
        return performanceMonitor.getMetricsSummary();
      }
      return {};
    },
  };
}

/**
 * Performance optimization utilities
 */
export class PerformanceOptimizer {
  /**
   * Preload critical resources
   */
  static preloadResources(urls: string[]): void {
    if (typeof document === 'undefined') return;

    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      
      if (url.endsWith('.js')) {
        link.as = 'script';
      } else if (url.endsWith('.css')) {
        link.as = 'style';
      } else if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
        link.as = 'image';
      } else if (url.match(/\.(woff|woff2|ttf|eot)$/)) {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      }

      document.head.appendChild(link);
    });
  }

  /**
   * Prefetch next pages
   */
  static prefetchPages(paths: string[]): void {
    if (typeof document === 'undefined') return;

    paths.forEach((path) => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = path;
      document.head.appendChild(link);
    });
  }

  /**
   * Lazy load images with intersection observer
   */
  static setupLazyLoading(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }

  /**
   * Optimize bundle loading
   */
  static optimizeBundleLoading(): void {
    if (typeof document === 'undefined') return;

    // Add modulepreload for ES modules
    const scripts = document.querySelectorAll('script[type="module"]');
    scripts.forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      if (src) {
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = src;
        document.head.appendChild(link);
      }
    });
  }
}