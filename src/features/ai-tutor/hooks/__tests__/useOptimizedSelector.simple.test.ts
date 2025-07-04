// src/features/ai-tutor/hooks/__tests__/useOptimizedSelector.simple.test.ts
// Simple test to verify the optimization utilities

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock zustand
const mockUseShallow = vi.fn();
vi.mock('zustand/react/shallow', () => ({
  useShallow: mockUseShallow
}));

// Import after mocking
const { 
  useOptimizedSelector, 
  useDebouncedUpdate,
  shallowEqual,
  deepEqual
} = await import('../utils/useOptimizedSelector');

describe('useOptimizedSelector', () => {
  const mockStore = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseShallow.mockImplementation((selector) => selector);
  });

  it('should use shallow comparison by default', () => {
    const selector = (state: Record<string, unknown>) => state.data;
    mockStore.mockReturnValue('test-data');

    const { result } = renderHook(() => 
      useOptimizedSelector(mockStore, selector)
    );

    expect(result.current).toBe('test-data');
    expect(mockStore).toHaveBeenCalledWith(mockUseShallow(selector));
  });

  it('should use custom equality function when provided', () => {
    const selector = (state: Record<string, unknown>) => state.data;
    const equalityFn = vi.fn();
    mockStore.mockReturnValue('test-data');

    const { result } = renderHook(() => 
      useOptimizedSelector(mockStore, selector, equalityFn)
    );

    expect(result.current).toBe('test-data');
    expect(mockStore).toHaveBeenCalledWith(selector, equalityFn);
  });
});

describe('useDebouncedUpdate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce rapid updates', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ value }) => useDebouncedUpdate(value, 500, callback),
      { initialProps: { value: 'initial' } }
    );

    // Make rapid changes
    rerender({ value: 'change1' });
    rerender({ value: 'change2' });
    rerender({ value: 'change3' });

    expect(callback).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('change3');
  });

  it('should handle immediate updates with zero delay', () => {
    const callback = vi.fn();
    const { rerender } = renderHook(
      ({ value }) => useDebouncedUpdate(value, 0, callback),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'immediate' });

    // Should call immediately with zero delay
    expect(callback).toHaveBeenCalledWith('immediate');
  });

  it('should clean up timer on unmount', () => {
    const callback = vi.fn();
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebouncedUpdate(value, 500, callback),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'change' });
    unmount();

    // Fast-forward time after unmount
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Callback should not be called after unmount
    expect(callback).not.toHaveBeenCalled();
  });
});

describe('Utility Functions', () => {
  describe('shallowEqual', () => {
    it('should return true for shallow equal objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 2 };
      
      expect(shallowEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for different objects', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };
      
      expect(shallowEqual(obj1, obj2)).toBe(false);
    });

    it('should return false for objects with different keys', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, c: 2 };
      
      expect(shallowEqual(obj1, obj2)).toBe(false);
    });
  });

  describe('deepEqual', () => {
    it('should return true for deeply equal objects', () => {
      const obj1 = { a: { b: { c: 1 } } };
      const obj2 = { a: { b: { c: 1 } } };
      
      expect(deepEqual(obj1, obj2)).toBe(true);
    });

    it('should return false for deeply different objects', () => {
      const obj1 = { a: { b: { c: 1 } } };
      const obj2 = { a: { b: { c: 2 } } };
      
      expect(deepEqual(obj1, obj2)).toBe(false);
    });

    it('should handle arrays', () => {
      const arr1 = [1, [2, 3], { a: 4 }];
      const arr2 = [1, [2, 3], { a: 4 }];
      
      expect(deepEqual(arr1, arr2)).toBe(true);
    });

    it('should handle primitives', () => {
      expect(deepEqual(1, 1)).toBe(true);
      expect(deepEqual('hello', 'hello')).toBe(true);
      expect(deepEqual(true, true)).toBe(true);
      expect(deepEqual(null, null)).toBe(true);
      expect(deepEqual(undefined, undefined)).toBe(true);
    });

    it('should return false for different types', () => {
      expect(deepEqual(1, '1')).toBe(false);
      expect(deepEqual({}, [])).toBe(false);
      expect(deepEqual(null, undefined)).toBe(false);
    });
  });
});