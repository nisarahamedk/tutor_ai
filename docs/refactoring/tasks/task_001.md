# TASK-001: Setup Testing Infrastructure for TDD

## Task Overview
**Epic**: Foundation & Setup  
**Story Points**: 3  
**Priority**: Critical  
**Type**: Setup  
**Assignee**: TBD  
**Status**: 🟢 Completed  

## Description
Establish comprehensive testing setup to support Test-Driven Development (TDD) refactoring approach. This foundational task ensures we can safely refactor the monolithic AITutorChat component while maintaining functionality.

## Business Value
- Enables confident refactoring through comprehensive test coverage
- Establishes quality gates for all future development
- Reduces bug introduction during major architectural changes
- Provides safety net for team to make bold improvements

## Acceptance Criteria

### Must Have
- [ ] Install and configure Vitest for unit testing (replacing Jest)
- [ ] Setup React Testing Library with React 19 support
- [ ] Configure Playwright for component and E2E testing
- [ ] Create test utilities and setup files
- [ ] Add test coverage reporting with >80% target
- [ ] Setup CI/CD test automation in GitHub Actions
- [ ] Create testing guidelines documentation

### Nice to Have
- [ ] Setup visual regression testing with Playwright
- [ ] Configure parallel test execution
- [ ] Add performance testing benchmarks
- [ ] Setup test data factories and fixtures

## Technical Requirements

### Dependencies to Install
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "jsdom": "^23.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@playwright/test": "^1.40.0",
    "@playwright/experimental-ct-react": "^1.40.0",
    "happy-dom": "^12.0.0",
    "msw": "^2.0.0"
  }
}
```

### Configuration Files Needed

#### 1. Vitest Configuration (`vitest.config.ts`)
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-utils/setup.ts'],
    css: true,
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*'
      ],
      exclude: [
        'node_modules/',
        'src/test-utils/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### 2. Playwright Configuration (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Files to Create

### 1. Test Setup File (`src/test-utils/setup.ts`)
```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mock-server';

// Setup MSW
beforeAll(() => server.listen());
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

### 2. Test Utilities (`src/test-utils/render-helpers.tsx`)
```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### 3. Mock API Server (`src/test-utils/mock-server.ts`)
```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock FastAPI endpoints
  http.post('/api/chat/send', () => {
    return HttpResponse.json({
      response: 'This is a mock AI response',
      messageId: 'mock-message-id',
      timestamp: new Date().toISOString()
    });
  }),

  http.get('/api/learning/tracks', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Frontend Development',
        description: 'Learn modern frontend development',
        progress: 0
      }
    ]);
  }),

  http.put('/api/learning/tracks/:trackId/progress', () => {
    return HttpResponse.json({
      success: true,
      progress: 50
    });
  })
];

export const server = setupServer(...handlers);
```

### 4. Test Data Factories (`src/test-utils/factories.ts`)
```typescript
// Test data factories for consistent test data
export const createMockMessage = (overrides = {}) => ({
  id: 'test-message-1',
  content: 'Test message content',
  type: 'user' as const,
  timestamp: new Date().toISOString(),
  ...overrides
});

export const createMockLearningTrack = (overrides = {}) => ({
  id: 'track-1',
  title: 'Test Track',
  description: 'Test track description',
  progress: 0,
  lessons: [],
  ...overrides
});
```

### 5. Component Testing Guidelines (`docs/testing/component-testing.md`)
```markdown
# Component Testing Guidelines

## Testing Philosophy
- Test behavior, not implementation
- Use TDD approach: Red → Green → Refactor
- Focus on user interactions and outcomes
- Mock external dependencies

## Example Test Structure
```typescript
describe('ComponentName', () => {
  // Arrange
  const defaultProps = { ... };
  
  // Test happy path
  it('should render correctly with default props', () => {
    render(<ComponentName {...defaultProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  // Test user interactions
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<ComponentName {...defaultProps} onClick={handleClick} />);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  // Test error states
  it('should display error message when error occurs', () => {
    render(<ComponentName {...defaultProps} error="Test error" />);
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
});
```
```

## TDD Process for This Task

### Red Phase (Write Failing Tests)
1. Create basic test setup files
2. Write a simple test that fails (no implementation yet)
3. Run tests to confirm they fail

### Green Phase (Make Tests Pass)
1. Configure Vitest and Playwright
2. Install all dependencies
3. Create minimal implementations to make tests pass

### Refactor Phase (Improve Implementation)
1. Optimize test utilities
2. Add additional testing helpers
3. Improve configuration based on initial usage

## Definition of Done

### Technical Checklist
- [ ] All testing dependencies installed and working
- [ ] Vitest configuration complete and tests run successfully
- [ ] Playwright configuration complete and E2E tests can be executed
- [ ] Test utilities created and documented
- [ ] Coverage reporting working with >80% threshold
- [ ] CI/CD pipeline includes test execution
- [ ] Mock server setup for FastAPI integration testing

### Quality Checklist
- [ ] Sample tests written and passing
- [ ] Documentation clear and comprehensive
- [ ] Team can run tests locally without issues
- [ ] CI/CD tests pass consistently
- [ ] Performance benchmarks established

### Validation Steps
1. Run `npm run test` and verify all tests pass
2. Run `npm run test:e2e` and verify Playwright tests execute
3. Check coverage report shows >80% coverage
4. Verify CI/CD pipeline runs tests automatically
5. Confirm team members can run tests on their machines

## Dependencies
**Blocks**: None  
**Blocked By**: None  
**Related**: All subsequent tasks depend on this foundation

## Estimated Timeline
- **Setup and Configuration**: 4 hours
- **Test Utilities Creation**: 3 hours  
- **Documentation**: 2 hours
- **CI/CD Integration**: 3 hours
- **Testing and Validation**: 2 hours

**Total**: ~14 hours (3 story points)

## Notes and Considerations
- Vitest chosen over Jest for better performance and modern features
- MSW used for API mocking to simulate FastAPI integration
- Playwright provides both component and E2E testing capabilities
- Coverage thresholds set to enforce quality standards
- CI/CD integration ensures tests run on every PR

## Success Metrics
- All tests in CI/CD pipeline pass
- Test coverage reports generated successfully
- Team velocity increased through confident refactoring
- Zero test-related blockers for subsequent tasks

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Upon task completion