# TASK-002: Baseline Testing for Existing Components

## Task Overview
**Epic**: Foundation & Setup  
**Story Points**: 5  
**Priority**: Critical  
**Type**: Testing  
**Assignee**: TBD  
**Status**: 🔴 Not Started  

## Description
Write comprehensive tests for current AITutorChat and related components before refactoring to establish a safety net and document existing behavior. This critical task ensures we don't introduce regressions during the architectural refactoring.

## Business Value
- Provides safety net for major refactoring work
- Documents current behavior and edge cases
- Establishes performance and functionality baselines
- Reduces risk of introducing bugs during component decomposition
- Enables confident refactoring with immediate feedback

## Current State Analysis

### Components Requiring Baseline Testing
1. **AITutorChat.tsx** (535+ lines) - Main monolithic component
2. **TrackExplorationComponent.tsx** - Learning track selection
3. **ProgressDashboardComponent.tsx** - Progress tracking display
4. **FlashcardReviewComponent.tsx** - Flashcard review functionality
5. **SkillAssessmentComponent.tsx** - Skill assessment workflows
6. **InteractiveLessonComponent.tsx** - Lesson interaction
7. **LearningPreferencesComponent.tsx** - User preferences
8. **HomePageComponent.tsx** - Home page functionality

### Current Testing Gaps
- No comprehensive integration tests for chat workflows
- Missing edge case testing for tab switching
- No performance baseline measurements
- Insufficient error scenario coverage
- Missing accessibility testing

## Acceptance Criteria

### Must Have
- [ ] Test existing AITutorChat component functionality completely
- [ ] Test all 7 ai-tutor components with >80% coverage
- [ ] Test existing hooks and utilities
- [ ] Create integration tests for complete chat workflows
- [ ] Document current behavior, edge cases, and limitations
- [ ] Achieve >80% test coverage for components to be refactored
- [ ] Establish performance baselines for critical user journeys
- [ ] Test error scenarios and failure modes

### Nice to Have
- [ ] Add visual regression tests for UI components
- [ ] Create accessibility baseline tests
- [ ] Add mobile responsiveness tests
- [ ] Performance profiling and bottleneck identification

## Technical Implementation

### Testing Strategy

#### 1. Unit Tests for Individual Components
```typescript
// src/components/ai-tutor/__tests__/AITutorChat.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AITutorChat } from '../AITutorChat';

describe('AITutorChat', () => {
  beforeEach(() => {
    // Setup common test state
    vi.clearAllMocks();
  });

  describe('Tab Management', () => {
    it('should render all tabs correctly', () => {
      render(<AITutorChat />);
      
      expect(screen.getByRole('tab', { name: /home/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /progress/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /review/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /explore/i })).toBeInTheDocument();
    });

    it('should switch tabs and maintain separate state', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      // Send message in home tab
      await user.type(screen.getByPlaceholderText(/type.*message/i), 'Hello in home');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      // Switch to progress tab
      await user.click(screen.getByRole('tab', { name: /progress/i }));
      expect(screen.getByTestId('progress-dashboard')).toBeVisible();
      
      // Switch back to home tab
      await user.click(screen.getByRole('tab', { name: /home/i }));
      expect(screen.getByText('Hello in home')).toBeInTheDocument();
    });

    it('should preserve message history when switching tabs', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      // Send messages in different tabs
      await user.type(screen.getByPlaceholderText(/type.*message/i), 'Message 1');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await user.click(screen.getByRole('tab', { name: /explore/i }));
      await user.type(screen.getByPlaceholderText(/type.*message/i), 'Message 2');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      // Verify messages are preserved
      await user.click(screen.getByRole('tab', { name: /home/i }));
      expect(screen.getByText('Message 1')).toBeInTheDocument();
      
      await user.click(screen.getByRole('tab', { name: /explore/i }));
      expect(screen.getByText('Message 2')).toBeInTheDocument();
    });
  });

  describe('Message Handling', () => {
    it('should send messages and display responses', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      const input = screen.getByPlaceholderText(/type.*message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Test message');
      await user.click(sendButton);
      
      // Check message appears
      expect(screen.getByText('Test message')).toBeInTheDocument();
      
      // Check for AI response (mocked)
      await waitFor(() => {
        expect(screen.getByText(/AI response/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('should handle empty messages', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);
      
      // Should not send empty message
      expect(screen.queryByText('')).not.toBeInTheDocument();
    });

    it('should show loading state during message sending', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      const input = screen.getByPlaceholderText(/type.*message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      await user.type(input, 'Test message');
      await user.click(sendButton);
      
      // Check loading indicator appears
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    it('should handle message sending errors', async () => {
      // Mock API failure
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));
      
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      await user.type(screen.getByPlaceholderText(/type.*message/i), 'Test message');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/error.*occurred/i)).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should send message on Enter key', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      const input = screen.getByPlaceholderText(/type.*message/i);
      await user.type(input, 'Test message{enter}');
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should not send on Shift+Enter', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      const input = screen.getByPlaceholderText(/type.*message/i);
      await user.type(input, 'Line 1{shift>}{enter}{/shift}Line 2');
      
      expect(input).toHaveValue('Line 1\nLine 2');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AITutorChat />);
      
      expect(screen.getByLabelText(/chat interface/i)).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAccessibleName(/message input/i);
    });

    it('should manage focus correctly', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      // Tab should focus message input
      await user.tab();
      expect(screen.getByPlaceholderText(/type.*message/i)).toHaveFocus();
    });
  });
});
```

#### 2. Integration Tests for Complete Workflows
```typescript
// src/components/ai-tutor/__tests__/integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AITutorChat } from '../AITutorChat';

describe('AI Tutor Integration Tests', () => {
  describe('Complete Learning Workflow', () => {
    it('should complete full learning track workflow', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      // 1. Start in home tab
      expect(screen.getByRole('tab', { name: /home/i })).toHaveAttribute('aria-selected', 'true');
      
      // 2. Navigate to explore tab
      await user.click(screen.getByRole('tab', { name: /explore/i }));
      
      // 3. Select a learning track
      await user.click(screen.getByTestId('track-frontend-development'));
      expect(screen.getByText(/frontend development/i)).toBeInTheDocument();
      
      // 4. Start lesson
      await user.click(screen.getByRole('button', { name: /start learning/i }));
      
      // 5. Check progress tab shows update
      await user.click(screen.getByRole('tab', { name: /progress/i }));
      expect(screen.getByTestId('progress-indicator')).toBeInTheDocument();
    });

    it('should handle assessment workflow', async () => {
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      // Navigate to assessment
      await user.click(screen.getByRole('tab', { name: /explore/i }));
      await user.click(screen.getByTestId('skill-assessment-button'));
      
      // Complete assessment questions
      const questions = screen.getAllByTestId(/question-\d+/);
      for (const question of questions) {
        const firstOption = question.querySelector('input[type="radio"]');
        if (firstOption) await user.click(firstOption);
      }
      
      // Submit assessment
      await user.click(screen.getByRole('button', { name: /submit assessment/i }));
      
      // Check results
      await waitFor(() => {
        expect(screen.getByTestId('assessment-results')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should recover from network errors', async () => {
      // Mock network failure then success
      let callCount = 0;
      vi.mocked(fetch).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve(new Response(JSON.stringify({ response: 'Success' })));
      });
      
      const user = userEvent.setup();
      render(<AITutorChat />);
      
      // Send message (will fail)
      await user.type(screen.getByPlaceholderText(/type.*message/i), 'Test message');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      // Check error appears
      await waitFor(() => {
        expect(screen.getByText(/error.*occurred/i)).toBeInTheDocument();
      });
      
      // Retry (should succeed)
      await user.click(screen.getByRole('button', { name: /retry/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });
    });
  });
});
```

#### 3. Component-Specific Tests
```typescript
// src/components/ai-tutor/__tests__/TrackExplorationComponent.test.tsx
describe('TrackExplorationComponent', () => {
  const mockTracks = [
    {
      id: '1',
      title: 'Frontend Development',
      description: 'Learn modern frontend',
      progress: 0,
      difficulty: 'Beginner'
    },
    {
      id: '2',
      title: 'Backend Development',
      description: 'Learn backend development',
      progress: 50,
      difficulty: 'Intermediate'
    }
  ];

  it('should display all learning tracks', () => {
    render(<TrackExplorationComponent tracks={mockTracks} onTrackSelect={vi.fn()} />);
    
    expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    expect(screen.getByText('Backend Development')).toBeInTheDocument();
  });

  it('should handle track selection', async () => {
    const onTrackSelect = vi.fn();
    const user = userEvent.setup();
    
    render(<TrackExplorationComponent tracks={mockTracks} onTrackSelect={onTrackSelect} />);
    
    await user.click(screen.getByTestId('track-1'));
    expect(onTrackSelect).toHaveBeenCalledWith(mockTracks[0]);
  });

  it('should filter tracks by difficulty', async () => {
    const user = userEvent.setup();
    render(<TrackExplorationComponent tracks={mockTracks} onTrackSelect={vi.fn()} />);
    
    await user.selectOptions(screen.getByLabelText(/difficulty filter/i), 'Beginner');
    
    expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    expect(screen.queryByText('Backend Development')).not.toBeInTheDocument();
  });

  it('should show progress indicators correctly', () => {
    render(<TrackExplorationComponent tracks={mockTracks} onTrackSelect={vi.fn()} />);
    
    // Check progress indicators
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars[0]).toHaveAttribute('value', '0');
    expect(progressBars[1]).toHaveAttribute('value', '50');
  });
});
```

#### 4. Performance Baseline Tests
```typescript
// src/components/ai-tutor/__tests__/performance.test.tsx
import { render, screen } from '@testing-library/react';
import { AITutorChat } from '../AITutorChat';

describe('AITutorChat Performance Baseline', () => {
  it('should render within performance budget', () => {
    const startTime = performance.now();
    
    render(<AITutorChat />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Baseline: Should render within 100ms
    expect(renderTime).toBeLessThan(100);
  });

  it('should handle large message history efficiently', () => {
    const largeMessageHistory = Array.from({ length: 1000 }, (_, i) => ({
      id: `msg-${i}`,
      content: `Message ${i}`,
      type: 'user' as const,
      timestamp: new Date().toISOString()
    }));

    const startTime = performance.now();
    
    render(<AITutorChat initialMessages={largeMessageHistory} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should handle large data sets reasonably
    expect(renderTime).toBeLessThan(500);
  });

  it('should not cause memory leaks', () => {
    const { unmount } = render(<AITutorChat />);
    
    // Check initial memory usage
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    // Mount and unmount multiple times
    for (let i = 0; i < 10; i++) {
      const { unmount: unmountInstance } = render(<AITutorChat />);
      unmountInstance();
    }
    
    // Force garbage collection if available
    if (global.gc) global.gc();
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024); // 5MB threshold
  });
});
```

## Files to Create

### Test Files
- `src/components/ai-tutor/__tests__/AITutorChat.test.tsx`
- `src/components/ai-tutor/__tests__/TrackExplorationComponent.test.tsx`
- `src/components/ai-tutor/__tests__/ProgressDashboardComponent.test.tsx`
- `src/components/ai-tutor/__tests__/FlashcardReviewComponent.test.tsx`
- `src/components/ai-tutor/__tests__/SkillAssessmentComponent.test.tsx`
- `src/components/ai-tutor/__tests__/InteractiveLessonComponent.test.tsx`
- `src/components/ai-tutor/__tests__/LearningPreferencesComponent.test.tsx`
- `src/components/ai-tutor/__tests__/HomePageComponent.test.tsx`
- `src/components/ai-tutor/__tests__/integration.test.tsx`
- `src/components/ai-tutor/__tests__/performance.test.tsx`

### Documentation Files
- `docs/testing/baseline-test-results.md`
- `docs/testing/current-behavior-documentation.md`
- `docs/testing/performance-baselines.md`

### Test Utilities
- `src/test-utils/ai-tutor-helpers.ts`
- `src/test-utils/mock-data.ts`
- `src/test-utils/performance-helpers.ts`

## TDD Process for This Task

### Red Phase (Document Current Behavior)
1. Analyze existing components and document expected behavior
2. Write tests that describe current functionality
3. Run tests to identify any immediate issues

### Green Phase (Make Tests Pass)
1. Fix any immediate test failures by understanding current implementation
2. Add missing test data and mocks
3. Ensure all baseline tests pass consistently

### Refactor Phase (Improve Test Quality)
1. Improve test readability and maintainability
2. Add edge case coverage
3. Optimize test performance

## Dependencies
**Blocks**: TASK-003, TASK-005 (Component decomposition needs baseline)  
**Blocked By**: TASK-001 (Testing infrastructure must be ready)  
**Related**: All refactoring tasks depend on this baseline

## Definition of Done

### Technical Checklist
- [ ] All 8 AI tutor components have comprehensive test coverage
- [ ] Integration tests cover complete user workflows
- [ ] Performance baselines established and documented
- [ ] Edge cases and error scenarios tested
- [ ] Accessibility testing baseline created
- [ ] All tests pass consistently in CI/CD

### Quality Checklist
- [ ] >80% test coverage achieved for all components
- [ ] Current behavior thoroughly documented
- [ ] Performance metrics captured and recorded
- [ ] Test code is maintainable and well-structured
- [ ] Mock data is realistic and comprehensive

### Documentation Checklist
- [ ] Current behavior documented for each component
- [ ] Known issues and limitations identified
- [ ] Performance baselines recorded
- [ ] Test strategy documented for future reference

## Estimated Timeline
- **Component Analysis and Planning**: 6 hours
- **AITutorChat Baseline Testing**: 8 hours
- **Individual Component Testing**: 12 hours (7 components × ~1.7 hours each)
- **Integration Testing**: 6 hours
- **Performance Testing**: 4 hours
- **Documentation**: 4 hours

**Total**: ~40 hours (5 story points)

## Success Metrics
- **Test Coverage**: >80% for all components to be refactored
- **Test Stability**: All tests pass consistently (>95% pass rate)
- **Performance Baseline**: Clear metrics for render time, memory usage
- **Documentation Quality**: Comprehensive behavior documentation
- **Confidence Level**: Team feels confident to start refactoring

## Notes and Considerations
- Focus on documenting actual behavior, not ideal behavior
- Include tests for quirks and edge cases that users might depend on
- Performance tests should run on standardized hardware for consistency
- Consider visual regression testing for UI components
- Tests should be fast enough to run frequently during refactoring

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Upon completion and before starting TASK-003