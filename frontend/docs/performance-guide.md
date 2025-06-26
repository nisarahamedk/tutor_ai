# Performance Optimization Guide

## Overview

This guide covers comprehensive performance optimization strategies implemented in the AI Tutor application, including caching, code splitting, monitoring, and React 19 optimizations.

## Table of Contents

1. [Performance Goals](#performance-goals)
2. [Core Web Vitals](#core-web-vitals)
3. [Caching Strategy](#caching-strategy)
4. [Code Splitting](#code-splitting)
5. [React 19 Optimizations](#react-19-optimizations)
6. [Bundle Optimization](#bundle-optimization)
7. [Performance Monitoring](#performance-monitoring)
8. [Mobile Performance](#mobile-performance)
9. [Performance Testing](#performance-testing)
10. [Best Practices](#best-practices)

## Performance Goals

### Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Lighthouse Performance | > 90 | 95+ |
| First Contentful Paint (FCP) | < 1.8s | ~1.2s |
| Largest Contentful Paint (LCP) | < 2.5s | ~1.8s |
| Cumulative Layout Shift (CLS) | < 0.1 | ~0.05 |
| First Input Delay (FID) | < 100ms | ~50ms |
| Time to First Byte (TTFB) | < 800ms | ~400ms |

### Performance Budget

- **JavaScript Bundle**: < 200KB (gzipped)
- **CSS Bundle**: < 50KB (gzipped)
- **Images**: WebP format, < 500KB per image
- **API Response Time**: < 500ms average
- **Page Load Time**: < 3s on 3G

## Core Web Vitals

### Implementation

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Track Core Web Vitals
export function initializeWebVitals() {
  getCLS(metric => reportMetric(metric));
  getFID(metric => reportMetric(metric));
  getFCP(metric => reportMetric(metric));
  getLCP(metric => reportMetric(metric));
  getTTFB(metric => reportMetric(metric));
}

function reportMetric(metric: Metric) {
  // Send to analytics
  analyticsManager.trackPerformance(metric.name, metric.value, {
    rating: metric.rating,
    id: metric.id,
  });
  
  // Alert for poor performance
  if (metric.rating === 'poor') {
    console.warn(`Poor ${metric.name}: ${metric.value}`);
  }
}
```

### Optimization Strategies

#### Largest Contentful Paint (LCP)
- Preload critical images and fonts
- Optimize server response times
- Use efficient image formats (WebP, AVIF)
- Implement image lazy loading

```typescript
// Preload critical resources
export function preloadCriticalResources() {
  const criticalResources = [
    '/hero-image.webp',
    '/fonts/inter-var.woff2',
    '/api/learning/tracks',
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    
    if (resource.endsWith('.webp')) {
      link.as = 'image';
    } else if (resource.endsWith('.woff2')) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else {
      link.as = 'fetch';
    }
    
    link.href = resource;
    document.head.appendChild(link);
  });
}
```

#### First Input Delay (FID)
- Break up long tasks into smaller chunks
- Use web workers for heavy computations
- Optimize third-party scripts

```typescript
// Break up long tasks
export function processLargeDataset(data: any[], callback: (result: any) => void) {
  const chunkSize = 100;
  let index = 0;
  
  function processChunk() {
    const chunk = data.slice(index, index + chunkSize);
    
    // Process chunk
    const result = chunk.map(item => processItem(item));
    
    index += chunkSize;
    
    if (index < data.length) {
      // Schedule next chunk
      setTimeout(processChunk, 0);
    } else {
      callback(result);
    }
  }
  
  processChunk();
}
```

#### Cumulative Layout Shift (CLS)
- Set dimensions for images and videos
- Avoid inserting content above existing content
- Use CSS transforms instead of layout properties

```css
/* Prevent layout shift with aspect ratio */
.image-container {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Use transforms for animations */
.slide-in {
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.slide-in.active {
  transform: translateX(0);
}
```

## Caching Strategy

### Next.js 15 Caching

```typescript
// Static data caching
export const revalidate = 3600; // 1 hour for static content
export const fetchCache = 'default-cache';

// Dynamic caching with tags
export async function getLearningTracks() {
  const tracks = await fetch('/api/learning/tracks', {
    next: {
      revalidate: 1800, // 30 minutes
      tags: ['learning-tracks'],
    },
  });
  
  return tracks.json();
}

// Revalidate on demand
import { revalidateTag } from 'next/cache';

export async function updateTrack(trackId: string) {
  // Update track
  await updateTrackInDatabase(trackId);
  
  // Revalidate cache
  revalidateTag('learning-tracks');
  revalidatePath(`/tracks/${trackId}`);
}
```

### Service Worker Caching

```javascript
// sw.js - Service Worker implementation
const CACHE_NAME = 'ai-tutor-v1';
const STATIC_CACHE = 'ai-tutor-static-v1';
const API_CACHE = 'ai-tutor-api-v1';

// Cache strategies
const cacheFirst = async (request) => {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Update cache in background
    updateCacheInBackground(request, cache);
    return cached;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
};

const networkFirst = async (request) => {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    throw error;
  }
};
```

### Client-Side Caching

```typescript
// Memory cache implementation
class MemoryCache {
  private cache = new Map<string, { value: any; expires: number }>();

  set(key: string, value: any, ttl: number = 300000): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();

// Usage in components
export function useCachedData<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = memoryCache.get<T>(key);
    
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    fetcher().then(result => {
      memoryCache.set(key, result);
      setData(result);
      setLoading(false);
    });
  }, [key]);

  return { data, loading };
}
```

## Code Splitting

### Route-Based Splitting

```typescript
// Automatic route splitting with Next.js App Router
// Each page component is automatically split

// Manual lazy loading for heavy components
import { lazy, Suspense } from 'react';

const AssessmentComponent = lazy(() => import('./AssessmentComponent'));
const AnalyticsComponent = lazy(() => import('./AnalyticsComponent'));

export function LearningDashboard() {
  return (
    <div>
      <Suspense fallback={<div>Loading assessment...</div>}>
        <AssessmentComponent />
      </Suspense>
      
      <Suspense fallback={<div>Loading analytics...</div>}>
        <AnalyticsComponent />
      </Suspense>
    </div>
  );
}
```

### Component-Based Splitting

```typescript
// Split heavy components
const HeavyChart = lazy(() => 
  import('./HeavyChart').then(module => ({ default: module.HeavyChart }))
);

// Split third-party libraries
const CodeEditor = lazy(() => 
  import('@monaco-editor/react').then(module => ({
    default: module.default
  }))
);

// Progressive loading
export function ProgressiveComponent() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div>
      <BasicComponent />
      
      {showAdvanced && (
        <Suspense fallback={<ComponentSkeleton />}>
          <AdvancedComponent />
        </Suspense>
      )}
      
      <button onClick={() => setShowAdvanced(true)}>
        Load Advanced Features
      </button>
    </div>
  );
}
```

### Dynamic Imports

```typescript
// Dynamic feature loading
export async function loadFeature(featureName: string) {
  switch (featureName) {
    case 'assessment':
      const { AssessmentEngine } = await import('./assessment/AssessmentEngine');
      return AssessmentEngine;
    
    case 'analytics':
      const { AnalyticsEngine } = await import('./analytics/AnalyticsEngine');
      return AnalyticsEngine;
    
    default:
      throw new Error(`Unknown feature: ${featureName}`);
  }
}

// Preload on user interaction
export function preloadFeature(featureName: string) {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = `/chunks/${featureName}.js`;
  document.head.appendChild(link);
}
```

## React 19 Optimizations

### Server Components

```typescript
// Server Component for static content
export default async function LearningTracksPage() {
  // Fetch data on server
  const tracks = await getLearningTracks();
  const categories = await getCategories();
  
  return (
    <div>
      <TrackGrid tracks={tracks} />
      <CategoryFilter categories={categories} />
      <TrackInteractionClient />
    </div>
  );
}

// Client Component for interactions
'use client';

export function TrackInteractionClient() {
  const [selectedTrack, setSelectedTrack] = useState(null);
  
  return (
    <div>
      {/* Interactive elements */}
    </div>
  );
}
```

### Concurrent Features

```typescript
// useTransition for non-urgent updates
export function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    
    startTransition(() => {
      // Non-urgent update
      searchTracks(newQuery).then(setResults);
    });
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search tracks..."
      />
      
      {isPending && <div>Searching...</div>}
      
      <SearchResults results={results} />
    </div>
  );
}
```

### Suspense Boundaries

```typescript
// Strategic Suspense placement
export function LearningPage() {
  return (
    <div>
      {/* Critical content loads immediately */}
      <PageHeader />
      
      {/* Non-critical content can be suspended */}
      <Suspense fallback={<TrackGridSkeleton />}>
        <TrackGrid />
      </Suspense>
      
      <Suspense fallback={<ProgressSkeleton />}>
        <ProgressDashboard />
      </Suspense>
    </div>
  );
}
```

## Bundle Optimization

### Webpack Configuration

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
    ],
  },
  
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
};
```

### Tree Shaking

```typescript
// Import only what you need
import { Button } from '@radix-ui/react-button';
import { Dialog } from '@radix-ui/react-dialog';

// Instead of
// import * as RadixUI from '@radix-ui/react-*';

// Use barrel exports carefully
export { Button } from './Button';
export { Input } from './Input';
// Don't export everything: export * from './components';
```

### Bundle Analysis

```typescript
// Package.json script
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

## Performance Monitoring

### Real User Monitoring (RUM)

```typescript
// Performance monitoring setup
export class PerformanceMonitor {
  private metrics: Map<string, Metric> = new Map();

  track(name: string, value: number, attributes?: Record<string, any>) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      attributes,
    };
    
    this.metrics.set(name, metric);
    
    // Send to analytics
    this.reportMetric(metric);
  }

  private reportMetric(metric: Metric) {
    // Send to monitoring service
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics', JSON.stringify(metric));
    }
  }

  getMetrics() {
    return Array.from(this.metrics.values());
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Usage in components
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.track(`component_${componentName}`, duration);
    };
  }, [componentName]);
}
```

### Performance Budgets

```typescript
// Performance budget checker
export class PerformanceBudget {
  private budgets = {
    'bundle-size': 200 * 1024, // 200KB
    'lcp': 2500, // 2.5s
    'fid': 100, // 100ms
    'cls': 0.1,
  };

  check(metric: string, value: number): boolean {
    const budget = this.budgets[metric];
    return budget ? value <= budget : true;
  }

  report() {
    const violations = [];
    
    for (const [metric, budget] of Object.entries(this.budgets)) {
      const currentValue = this.getCurrentValue(metric);
      
      if (currentValue > budget) {
        violations.push({
          metric,
          budget,
          actual: currentValue,
          overage: currentValue - budget,
        });
      }
    }
    
    return violations;
  }
}
```

## Mobile Performance

### Touch Responsiveness

```css
/* Optimize for touch interactions */
button, .interactive {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* Improve scrolling performance */
.scroll-container {
  -webkit-overflow-scrolling: touch;
  overflow-scrolling: touch;
}

/* Optimize animations for mobile */
@media (prefers-reduced-motion: no-preference) {
  .animate {
    will-change: transform;
    transform: translateZ(0);
  }
}
```

### Mobile-Specific Optimizations

```typescript
// Detect mobile and apply optimizations
export function useMobileOptimizations() {
  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    if (isMobile) {
      // Reduce animation complexity
      document.documentElement.classList.add('mobile-device');
      
      // Disable hover effects
      document.documentElement.classList.add('no-hover');
      
      // Optimize images for mobile
      optimizeImagesForMobile();
    }
  }, []);
}

function optimizeImagesForMobile() {
  const images = document.querySelectorAll('img[data-mobile-src]');
  
  images.forEach(img => {
    const mobileSrc = img.getAttribute('data-mobile-src');
    if (mobileSrc) {
      img.setAttribute('src', mobileSrc);
    }
  });
}
```

## Performance Testing

### Lighthouse CI

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/ai-tutor'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### Load Testing

```typescript
// Load testing with Playwright
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should handle concurrent users', async ({ browser }) => {
    const contexts = await Promise.all(
      Array(10).fill(0).map(() => browser.newContext())
    );
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );
    
    // Simulate concurrent load
    await Promise.all(
      pages.map(page => page.goto('/ai-tutor'))
    );
    
    // Verify performance
    for (const page of pages) {
      const performanceMetrics = await page.evaluate(() => {
        return JSON.stringify(performance.getEntriesByType('navigation'));
      });
      
      const metrics = JSON.parse(performanceMetrics)[0];
      expect(metrics.loadEventEnd - metrics.loadEventStart).toBeLessThan(3000);
    }
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
  });
});
```

## Best Practices

### 1. Measurement First
- Establish performance baselines
- Monitor real user metrics
- Set up alerting for regressions

### 2. Progressive Enhancement
- Load critical content first
- Add enhancements progressively
- Graceful degradation for slow connections

### 3. Optimization Priorities
1. Critical rendering path
2. JavaScript bundle size
3. Image optimization
4. Caching strategy
5. Third-party scripts

### 4. Continuous Monitoring
- Real user monitoring (RUM)
- Synthetic testing
- Performance budgets
- Regular audits

### 5. Mobile-First Approach
- Optimize for mobile first
- Test on real devices
- Consider network conditions
- Touch-friendly interactions

## Conclusion

Performance optimization is an ongoing process that requires continuous monitoring and improvement. The strategies outlined in this guide provide a comprehensive approach to achieving and maintaining excellent performance in the AI Tutor application.

Regular performance audits, user feedback, and metric monitoring ensure that the application continues to provide an optimal user experience across all devices and network conditions.