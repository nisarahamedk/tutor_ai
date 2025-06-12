# Performance Baselines - AI Tutor Components

This document records the initial performance baselines for the `AITutorChat` component, as measured by tests in `frontend/src/components/ai-tutor/__tests__/performance.test.tsx`.

**Important Disclaimer: JSDOM Performance Testing Limitations**

The following metrics were obtained using `@testing-library/react` in a JSDOM environment (typically via Jest). It's crucial to understand that:

-   **JSDOM is not a real browser**: It simulates a browser environment but does not include a rendering engine, layout engine, or a JavaScript engine with the same performance characteristics as those found in actual browsers (like V8, SpiderMonkey, JavaScriptCore).
-   **Indicative Metrics**: Performance numbers (render times, memory usage) from JSDOM are **indicative only**. They can help catch significant regressions or performance hotspots in the component's JavaScript logic and React rendering patterns but do not reflect true real-world performance.
-   **Variability**: Results can vary based on the machine running the tests and the overall load on the system.
-   **Focus on Relative Change**: These baselines are most useful for detecting *relative changes* in performance over time as the codebase evolves, rather than for their absolute values.

For accurate performance profiling and optimization, always use browser-based profiling tools (e.g., Chrome DevTools Performance tab, Firefox Profiler) with a production-like build of the application.

## `AITutorChat` Performance Metrics

### 1. Initial Render Time

-   **Description**: Time taken for the `AITutorChat` component to render its initial view (default Home tab, initial messages, no complex child components deeply rendered due to mocking in this specific test).
-   **Test Logic**: Measured from `performance.now()` before `render(<AITutorChat />)` to `performance.now()` after `screen.findByText(/Welcome to TutorAI!/i)` resolves.
-   **Baseline Value**: `~X.XX ms` (Actual value to be filled from test run output)
-   **Target Threshold**: `< 100 ms` (as suggested in `task_002.md`)
-   **Note**: This value should be updated with the actual average measured in the CI or a consistent test environment.

### 2. Render Time with Large Message History (1000 Messages)

-   **Description**: Time taken for `AITutorChat` to render when its internal state for home tab messages is pre-populated with 1000 messages.
-   **Test Logic**:
    -   A `jest.spyOn(React, 'useState')` was used to inject a large message array into the `tabMessages.home` state during component initialization. This is a workaround due to the component not having a direct prop for initial messages.
    -   Measured from `performance.now()` before `render(<AITutorChat />)` to `performance.now()` after `screen.findByText(/This is message number 999/i)` resolves (i.e., waiting for the last message to likely be in the DOM).
-   **Baseline Value**: `~Y.YY ms` (Actual value to be filled from test run output)
-   **Target Threshold**: `< 500 ms` (as suggested in `task_002.md`)
-   **Note**: This value should be updated. The `useState` spy adds some overhead and is not ideal but was used to simulate the condition. Performance in JSDOM with very large lists can be significantly different from a real browser due to lack of virtualization and optimized rendering paths.

### 3. Memory Usage Increase

-   **Description**: Measures the increase in JavaScript heap size after rendering and unmounting the `AITutorChat` component multiple times (10 iterations).
-   **Test Logic**: Uses `(performance as any).memory?.usedJSHeapSize` and `global.gc()` (if available).
-   **Baseline Value**: `~Z.ZZ MB` increase (Actual value to be filled from test run output)
-   **Target Threshold**: `< 5 MB` (as suggested in `task_002.md`)
-   **Environment Note**: This test includes a check for the availability of `performance.memory` and `global.gc`. If these are not available in the test environment (common with default JSDOM Jest setup without specific Node flags), the test is skipped, and this baseline cannot be established through this method. Actual memory profiling in a browser is more reliable.
-   **Observation from test setup**: The test was written to log a warning and skip if `performance.memory` or `global.gc` is unavailable. The actual measured value needs to be recorded here if the environment supports it.

---

These baseline figures should be periodically reviewed and updated, especially after significant changes to the `AITutorChat` component or its core dependencies.
