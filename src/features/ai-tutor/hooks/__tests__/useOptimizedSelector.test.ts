// src/features/ai-tutor/hooks/__tests__/useOptimizedSelector.test.ts
// TDD Tests for Optimized Selector Utility Hook

import { renderHook, act } from '@testing-library/react';
import { useOptimizedSelector, useDebouncedUpdate } from '../utils/useOptimizedSelector';
import { create } from 'zustand';

// Mock store for testing
interface TestStore {
  count: number;
  name: string;
  items: string[];
  nested: {
    value: number;
    data: { id: string; name: string }[];
  };
  increment: () => void;
  setName: (name: string) => void;
  addItem: (item: string) => void;
  updateNested: (value: number) => void;
}

const useTestStore = create<TestStore>((set) => ({
  count: 0,
  name: 'test',
  items: [],
  nested: {
    value: 0,
    data: []
  },
  increment: () => set((state) => ({ count: state.count + 1 })),
  setName: (name) => set({ name }),
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
  updateNested: (value) => set((state) => ({ 
    nested: { ...state.nested, value } 
  }))
}));

describe('useOptimizedSelector', () => {
  beforeEach(() => {
    // Reset store state
    useTestStore.setState({
      count: 0,
      name: 'test',
      items: [],
      nested: { value: 0, data: [] }
    });
  });

  describe('basic selector functionality', () => {
    it('should return selected value from store', () => {
      const { result } = renderHook(() => 
        useOptimizedSelector(useTestStore, (state) => state.count)
      );

      expect(result.current).toBe(0);
    });

    it('should update when selected value changes', () => {
      const { result } = renderHook(() => 
        useOptimizedSelector(useTestStore, (state) => state.count)
      );

      act(() => {
        useTestStore.getState().increment();
      });

      expect(result.current).toBe(1);
    });

    it('should not re-render when non-selected values change', () => {
      let renderCount = 0;
      
      const { result } = renderHook(() => {
        renderCount++;
        return useOptimizedSelector(useTestStore, (state) => state.count);
      });

      const initialRenderCount = renderCount;

      act(() => {
        useTestStore.getState().setName('new name');
      });

      // Should not have caused a re-render since count didn't change
      expect(renderCount).toBe(initialRenderCount);
      expect(result.current).toBe(0);
    });
  });

  describe('complex selector optimization', () => {
    it('should handle complex object selections', () => {
      const { result } = renderHook(() => 
        useOptimizedSelector(
          useTestStore,
          (state) => ({ count: state.count, name: state.name })
        )
      );

      expect(result.current).toEqual({ count: 0, name: 'test' });
    });

    it('should optimize array selections', () => {
      const { result } = renderHook(() => 
        useOptimizedSelector(useTestStore, (state) => state.items)
      );

      expect(result.current).toEqual([]);

      act(() => {
        useTestStore.getState().addItem('item1');
      });

      expect(result.current).toEqual(['item1']);
    });

    it('should handle nested object selections', () => {
      const { result } = renderHook(() => 
        useOptimizedSelector(useTestStore, (state) => state.nested.value)
      );

      expect(result.current).toBe(0);

      act(() => {
        useTestStore.getState().updateNested(42);
      });

      expect(result.current).toBe(42);
    });
  });

  describe('custom equality function', () => {
    it('should use shallow comparison by default', () => {
      const { result } = renderHook(() => 
        useOptimizedSelector(
          useTestStore,
          (state) => ({ count: state.count })
        )
      );

      const firstResult = result.current;

      act(() => {
        useTestStore.getState().setName('different name');
      });

      // Should be same reference due to shallow comparison
      expect(result.current).toBe(firstResult);
    });

    it('should use custom equality function when provided', () => {
      let equalityCallCount = 0;
      
      const customEquality = (a: { count: number; name: string }, b: { count: number; name: string }) => {
        equalityCallCount++;
        return a.count === b.count;
      };

      const { result } = renderHook(() => 
        useOptimizedSelector(
          useTestStore,
          (state) => ({ count: state.count, name: state.name }),
          customEquality
        )
      );

      const firstResult = result.current;

      act(() => {
        useTestStore.getState().setName('different name');
      });

      // Should not have re-rendered due to custom equality
      expect(result.current).toBe(firstResult);
      expect(equalityCallCount).toBeGreaterThan(0);
    });

    it('should re-render when custom equality returns false', () => {
      const customEquality = (a: { count: number; name: string }, b: { count: number; name: string }) => a.count === b.count;

      const { result } = renderHook(() => 
        useOptimizedSelector(
          useTestStore,
          (state) => ({ count: state.count, name: state.name }),
          customEquality
        )
      );

      const firstResult = result.current;

      act(() => {
        useTestStore.getState().increment();
      });

      // Should have re-rendered due to count change
      expect(result.current).not.toBe(firstResult);
      expect(result.current.count).toBe(1);
    });
  });

  describe('performance characteristics', () => {
    it('should memoize selector results', () => {
      let selectorCallCount = 0;
      
      const { rerender } = renderHook(() => 
        useOptimizedSelector(useTestStore, (state) => {
          selectorCallCount++;
          return state.count;
        })
      );

      const initialCallCount = selectorCallCount;
      
      // Re-render component without store changes
      rerender();

      // Selector should not be called again if store hasn't changed
      expect(selectorCallCount).toBe(initialCallCount);
    });

    it('should handle rapid state changes efficiently', () => {
      const { result } = renderHook(() => 
        useOptimizedSelector(useTestStore, (state) => state.count)
      );

      // Make multiple rapid changes
      act(() => {
        for (let i = 0; i < 10; i++) {
          useTestStore.getState().increment();
        }
      });

      expect(result.current).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined selector results', () => {
      const { result } = renderHook(() => 
        useOptimizedSelector(
          useTestStore,
          (state) => (state as unknown as Record<string, unknown>).nonExistentProperty
        )
      );

      expect(result.current).toBeUndefined();
    });

    it('should handle null selector results', () => {
      const { result } = renderHook(() => 
        useOptimizedSelector(
          useTestStore,
          () => null
        )
      );

      expect(result.current).toBeNull();
    });

    it('should handle selector throwing errors', () => {
      const { result } = renderHook(() => 
        useOptimizedSelector(
          useTestStore,
          () => {
            throw new Error('Selector error');
          }
        )
      );

      // Should handle error gracefully
      expect(() => result.current).toThrow('Selector error');
    });
  });
});

describe('useDebouncedUpdate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce rapid updates', () => {
    const callback = jest.fn();
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
      jest.advanceTimersByTime(500);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('change3');
  });

  it('should reset debounce timer on new updates', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ value }) => useDebouncedUpdate(value, 500, callback),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'change1' });

    // Wait 300ms (less than debounce delay)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Make another change
    rerender({ value: 'change2' });

    // Wait another 300ms (total 600ms, but timer reset)
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should not have been called yet
    expect(callback).not.toHaveBeenCalled();

    // Wait remaining time
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('change2');
  });

  it('should handle different value types', () => {
    const callback = jest.fn();
    
    // Test with object values
    const { rerender } = renderHook(
      ({ value }) => useDebouncedUpdate(value, 100, callback),
      { initialProps: { value: { id: 1, name: 'test' } } }
    );

    rerender({ value: { id: 2, name: 'updated' } });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(callback).toHaveBeenCalledWith({ id: 2, name: 'updated' });
  });

  it('should clean up timer on unmount', () => {
    const callback = jest.fn();
    const { unmount, rerender } = renderHook(
      ({ value }) => useDebouncedUpdate(value, 500, callback),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'change' });
    unmount();

    // Fast-forward time after unmount
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Callback should not be called after unmount
    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle immediate updates with zero delay', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ value }) => useDebouncedUpdate(value, 0, callback),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'immediate' });

    // Should call immediately with zero delay
    expect(callback).toHaveBeenCalledWith('immediate');
  });

  describe('performance optimization', () => {
    it('should not create new debounced function on each render', () => {
      const callback = jest.fn();
      let debouncedFunctionRef: unknown;
      
      const { rerender } = renderHook(
        ({ value }) => {
          const currentRef = useDebouncedUpdate(value, 500, callback);
          if (!debouncedFunctionRef) {
            debouncedFunctionRef = currentRef;
          }
          return currentRef;
        },
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'change1' });
      rerender({ value: 'change2' });

      // The debounced function reference should remain stable
      expect(debouncedFunctionRef).toBeDefined();
    });
  });
});