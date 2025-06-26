// src/features/ai-tutor/hooks/utils/useOptimizedSelector.ts
// Optimized Selector Utility Hook for Performance
'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

/**
 * High-performance selector hook with custom equality comparison
 * 
 * @param store - Zustand store hook
 * @param selector - Selector function to extract data from store
 * @param equalityFn - Optional custom equality function (defaults to shallow comparison)
 * @returns Selected value from store
 */
export const useOptimizedSelector = <T, R>(
  store: (selector?: (state: T) => R, equalityFn?: (a: R, b: R) => boolean) => R,
  selector: (state: T) => R,
  equalityFn?: (a: R, b: R) => boolean
): R => {
  // Always call useShallow at the top level to comply with hooks rules
  const shallowSelector = useShallow(selector);
  
  // Use custom equality function if provided, otherwise use shallow comparison
  if (equalityFn) {
    return store(selector, equalityFn);
  }
  
  // For complex objects, use shallow comparison
  return store(shallowSelector);
};

/**
 * Debounced update hook for performance optimization
 * 
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds
 * @param callback - Callback to execute after delay
 */
export const useDebouncedUpdate = <T>(
  value: T,
  delay: number,
  callback: (value: T) => void
): void => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  
  // Update callback ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Handle immediate execution for zero delay
    if (delay === 0) {
      callbackRef.current(value);
      return;
    }
    
    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(value);
    }, delay);
    
    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);
};

/**
 * Memoized callback hook with stable reference
 * 
 * @param callback - Callback function to memoize
 * @param deps - Dependencies array
 * @returns Memoized callback
 */
export const useStableCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: unknown[]
): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps);
};

/**
 * Memoized value hook with custom equality
 * 
 * @param factory - Factory function to create value
 * @param deps - Dependencies array
 * @param equalityFn - Optional custom equality function
 * @returns Memoized value
 */
export const useMemoizedValue = <T>(
  factory: () => T,
  deps: unknown[],
  equalityFn?: (a: T, b: T) => boolean
): T => {
  const prevValue = useRef<T | undefined>(undefined);
  const prevDeps = useRef<unknown[] | undefined>(undefined);
  
  // Check if dependencies have changed
  const depsChanged = !prevDeps.current || 
    deps.length !== prevDeps.current.length ||
    deps.some((dep, index) => dep !== prevDeps.current![index]);
  
  if (depsChanged) {
    const newValue = factory();
    
    // Use custom equality if provided
    if (equalityFn && prevValue.current !== undefined) {
      if (!equalityFn(prevValue.current, newValue)) {
        prevValue.current = newValue;
      }
    } else {
      prevValue.current = newValue;
    }
    
    prevDeps.current = deps;
  }
  
  return prevValue.current!;
};

/**
 * Batch updates hook for multiple state changes
 * 
 * @returns Batch function to execute multiple updates
 */
export const useBatchUpdates = () => {
  return useCallback((updates: (() => void)[]): void => {
    // React 18+ automatically batches updates, but we can ensure it
    updates.forEach(update => update());
  }, []);
};

/**
 * Performance monitoring hook for development
 * 
 * @param name - Name for the performance measurement
 * @param deps - Dependencies to monitor for changes
 */
export const usePerformanceMonitor = (
  name: string,
  deps: unknown[]
): void => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      renderCount.current++;
      const currentTime = performance.now();
      const timeDiff = currentTime - lastRenderTime.current;
      
      console.log(`[Performance] ${name}:`, {
        renderCount: renderCount.current,
        timeSinceLastRender: `${timeDiff.toFixed(2)}ms`,
        deps
      });
      
      lastRenderTime.current = currentTime;
    }
  }, [name, deps]);
};

/**
 * Throttled callback hook
 * 
 * @param callback - Callback to throttle
 * @param delay - Throttle delay in milliseconds
 * @returns Throttled callback
 */
export const useThrottledCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
    } else {
      // Clear existing timeout and set new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - (now - lastCall.current));
    }
  }, [callback, delay]) as T;
};

/**
 * Shallow equality comparison function
 */
export const shallowEqual = <T extends Record<string, unknown>>(a: T, b: T): boolean => {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  return keysA.every(key => a[key] === b[key]);
};

/**
 * Deep equality comparison function (use sparingly)
 */
export const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => deepEqual(objA[key], objB[key]));
};

/**
 * Reference equality comparison function
 */
export const referenceEqual = <T>(a: T, b: T): boolean => {
  return a === b;
};

/**
 * Array equality comparison function
 */
export const arrayEqual = <T>(a: T[], b: T[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item === b[index]);
};

/**
 * Custom hook to track value changes for debugging
 */
export const useTrackChanges = <T>(
  value: T,
  name: string
): void => {
  const prevValue = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && prevValue.current !== undefined) {
      if (prevValue.current !== value) {
        console.log(`[Change Tracker] ${name}:`, {
          from: prevValue.current,
          to: value
        });
      }
    }
    prevValue.current = value;
  }, [value, name]);
};

// Export all utility functions for use in other hooks
export {
  useShallow
};