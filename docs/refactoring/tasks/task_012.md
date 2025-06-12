# TASK-012: Implement Server Actions for FastAPI Integration (TDD)

## Task Overview
**Epic**: Server Actions & API Integration  
**Story Points**: 7  
**Priority**: High  
**Type**: Feature  
**Assignee**: TBD  
**Status**: 🔴 Not Started  

## Description
Create Server Actions for seamless FastAPI integration using React 19 and Next.js 15 patterns. Replace client-side API calls with Server Actions to leverage React 19's useActionState and automatic form handling while maintaining type safety and error handling.

## Business Value
- Eliminates client-side API complexity through Server Actions
- Leverages React 19's automatic pending states and error handling  
- Improves security by keeping API credentials server-side
- Reduces bundle size by moving API logic to server
- Provides better SEO and performance through server-side execution
- Simplifies form handling with native React 19 patterns

## Current State Analysis

### Existing API Integration Issues
- **Client-side complexity**: API calls scattered throughout components
- **No unified error handling**: Each component handles errors differently
- **Security concerns**: API credentials exposed to client
- **State management overhead**: Manual loading/error states everywhere
- **Bundle size impact**: API client libraries increase bundle size

### Current API Patterns
```typescript
// Current client-side pattern (problematic)
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const sendMessage = async (message: string) => {
  setLoading(true);
  setError(null);
  try {
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!response.ok) throw new Error('Failed to send');
    const result = await response.json();
    // Handle success...
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

## Target Architecture

### Modern Server Actions Pattern
```typescript
// Target pattern with Server Actions
'use server';

async function sendChatMessage(prevState: any, formData: FormData) {
  // Server-side execution
  // Automatic error handling
  // Direct FastAPI integration
  // Type-safe responses
}

// Component usage
function ChatForm() {
  const [state, formAction, isPending] = useActionState(sendChatMessage, null);
  
  return (
    <form action={formAction}>
      <input name="message" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Sending...' : 'Send'}
      </button>
      {state?.error && <span>Error: {state.error}</span>}
    </form>
  );
}
```

## Acceptance Criteria

### Must Have
- [ ] Create Server Actions for all FastAPI endpoints used by AI Tutor
- [ ] Implement proper error handling and validation for all actions
- [ ] Add request/response type safety with TypeScript
- [ ] Implement retry logic for failed requests
- [ ] Add proper logging and monitoring capabilities
- [ ] Handle authentication and authorization properly
- [ ] Optimize for performance and implement caching where appropriate
- [ ] Replace all existing client-side API calls with Server Actions

### Nice to Have
- [ ] Add request rate limiting
- [ ] Implement request deduplication
- [ ] Add metrics and analytics tracking
- [ ] Create reusable action patterns
- [ ] Add request/response middleware
- [ ] Implement request queuing for offline scenarios

## Technical Implementation

### Server Actions to Implement

#### 1. Chat Message Actions
```typescript
// src/features/ai-tutor/actions/chat-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Type definitions
interface ChatActionState {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

// Input validation schema
const ChatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message too long')
    .transform(str => str.trim()),
  tab: z.enum(['home', 'progress', 'review', 'explore']),
  contextId: z.string().uuid().optional()
});

export async function sendChatMessage(
  prevState: ChatActionState | null,
  formData: FormData
): Promise<ChatActionState> {
  try {
    // Input validation
    const validationResult = ChatMessageSchema.safeParse({
      message: formData.get('message'),
      tab: formData.get('tab'),
      contextId: formData.get('contextId')
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ')
      };
    }

    const { message, tab, contextId } = validationResult.data;

    // Get server session for authentication
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    // Call FastAPI backend
    const response = await fetch(`${process.env.FASTAPI_URL}/api/v1/chat/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessToken}`,
        'X-Request-ID': crypto.randomUUID()
      },
      body: JSON.stringify({
        message,
        tab,
        contextId,
        userId: session.user.id
      }),
    });

    if (!response.ok) {
      // Handle different error types
      if (response.status === 401) {
        return { success: false, error: 'Session expired. Please log in again.' };
      }
      if (response.status === 429) {
        return { success: false, error: 'Too many requests. Please wait a moment.' };
      }
      if (response.status >= 500) {
        return { success: false, error: 'Server error. Please try again later.' };
      }
      
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.message || `Request failed with status ${response.status}` 
      };
    }

    const result = await response.json();

    // Validate response
    if (!result.response || !result.messageId) {
      return { success: false, error: 'Invalid response from server' };
    }

    // Revalidate relevant paths for cache invalidation
    revalidatePath('/ai-tutor');
    revalidatePath(`/ai-tutor/${tab}`);

    return {
      success: true,
      message: result.response,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Chat message action failed:', error);
    
    // Don't expose internal errors to client
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}

// Retry action for failed messages
export async function retryChatMessage(
  messageId: string,
  tab: string
): Promise<ChatActionState> {
  try {
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    const response = await fetch(
      `${process.env.FASTAPI_URL}/api/v1/chat/retry/${messageId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tab })
      }
    );

    if (!response.ok) {
      throw new Error(`Retry failed with status ${response.status}`);
    }

    const result = await response.json();
    
    revalidatePath('/ai-tutor');
    
    return {
      success: true,
      message: result.response,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Chat retry action failed:', error);
    return {
      success: false,
      error: 'Failed to retry message. Please try again.'
    };
  }
}
```

#### 2. Learning Progress Actions
```typescript
// src/features/ai-tutor/actions/learning-actions.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

interface ProgressActionState {
  success: boolean;
  progress?: number;
  error?: string;
}

const ProgressUpdateSchema = z.object({
  trackId: z.string().uuid('Invalid track ID'),
  lessonId: z.string().uuid('Invalid lesson ID'),
  progress: z.number()
    .min(0, 'Progress cannot be negative')
    .max(100, 'Progress cannot exceed 100'),
  timeSpent: z.number().min(0).optional(),
  notes: z.string().max(500).optional()
});

export async function updateLearningProgress(
  formData: FormData
): Promise<ProgressActionState> {
  try {
    const validationResult = ProgressUpdateSchema.safeParse({
      trackId: formData.get('trackId'),
      lessonId: formData.get('lessonId'),
      progress: Number(formData.get('progress')),
      timeSpent: formData.get('timeSpent') ? Number(formData.get('timeSpent')) : undefined,
      notes: formData.get('notes')
    });

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message
      };
    }

    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    const { trackId, lessonId, progress, timeSpent, notes } = validationResult.data;

    const response = await fetch(
      `${process.env.FASTAPI_URL}/api/v1/learning/tracks/${trackId}/lessons/${lessonId}/progress`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          progress,
          timeSpent,
          notes,
          userId: session.user.id,
          timestamp: new Date().toISOString()
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || 'Failed to update progress'
      };
    }

    const result = await response.json();

    // Invalidate relevant caches
    revalidateTag(`user-progress-${session.user.id}`);
    revalidateTag(`track-progress-${trackId}`);
    revalidatePath('/ai-tutor/progress');

    return {
      success: true,
      progress: result.progress
    };

  } catch (error) {
    console.error('Progress update action failed:', error);
    return {
      success: false,
      error: 'Failed to update progress. Please try again.'
    };
  }
}

export async function completeLesson(
  trackId: string,
  lessonId: string
): Promise<ProgressActionState> {
  try {
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    const response = await fetch(
      `${process.env.FASTAPI_URL}/api/v1/learning/tracks/${trackId}/lessons/${lessonId}/complete`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: session.user.id,
          completedAt: new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to complete lesson: ${response.status}`);
    }

    const result = await response.json();

    // Invalidate caches and trigger revalidation
    revalidateTag(`user-progress-${session.user.id}`);
    revalidateTag(`track-progress-${trackId}`);
    revalidatePath('/ai-tutor/progress');
    revalidatePath(`/ai-tutor/tracks/${trackId}`);

    return {
      success: true,
      progress: result.progress
    };

  } catch (error) {
    console.error('Complete lesson action failed:', error);
    return {
      success: false,
      error: 'Failed to complete lesson. Please try again.'
    };
  }
}
```

#### 3. Assessment Actions
```typescript
// src/features/ai-tutor/actions/assessment-actions.ts
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

interface AssessmentActionState {
  success: boolean;
  assessmentId?: string;
  score?: number;
  error?: string;
}

const AssessmentSubmissionSchema = z.object({
  trackId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.union([z.string(), z.number(), z.array(z.string())]),
    timeSpent: z.number().min(0)
  })),
  totalTime: z.number().min(0)
});

export async function submitSkillAssessment(
  formData: FormData
): Promise<AssessmentActionState> {
  try {
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    // Parse and validate assessment data
    const assessmentData = JSON.parse(formData.get('assessmentData') as string);
    const validationResult = AssessmentSubmissionSchema.safeParse(assessmentData);

    if (!validationResult.success) {
      return {
        success: false,
        error: 'Invalid assessment data'
      };
    }

    const { trackId, answers, totalTime } = validationResult.data;

    const response = await fetch(
      `${process.env.FASTAPI_URL}/api/v1/assessments/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          trackId,
          answers,
          totalTime,
          userId: session.user.id,
          submittedAt: new Date().toISOString()
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || 'Assessment submission failed'
      };
    }

    const result = await response.json();

    // Revalidate progress data
    revalidateTag(`user-progress-${session.user.id}`);
    revalidatePath('/ai-tutor/progress');

    // Redirect to results page
    redirect(`/ai-tutor/assessment/results/${result.assessmentId}`);

  } catch (error) {
    if (error.message === 'NEXT_REDIRECT') {
      throw error; // Re-throw redirect
    }
    
    console.error('Assessment submission failed:', error);
    return {
      success: false,
      error: 'Assessment submission failed. Please try again.'
    };
  }
}

export async function saveAssessmentProgress(
  assessmentId: string,
  currentAnswers: any[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getServerSession();
    if (!session) {
      return { success: false, error: 'Authentication required' };
    }

    await fetch(
      `${process.env.FASTAPI_URL}/api/v1/assessments/${assessmentId}/progress`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          answers: currentAnswers,
          lastSaved: new Date().toISOString()
        })
      }
    );

    return { success: true };

  } catch (error) {
    console.error('Failed to save assessment progress:', error);
    return { success: false, error: 'Failed to save progress' };
  }
}
```

## TDD Implementation Process

### Phase 1: Setup and Infrastructure

#### Test Environment Setup
```typescript
// src/test-utils/server-action-helpers.ts
import { expect } from 'vitest';

export async function testServerAction(
  action: Function,
  formData: FormData,
  expectedResult: any
) {
  const result = await action(null, formData);
  expect(result).toMatchObject(expectedResult);
  return result;
}

export function createMockFormData(data: Record<string, string>) {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    formData.append(key, value);
  });
  return formData;
}

// Mock FastAPI responses
export const mockFastAPIResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data)
  });
};
```

#### Server Action Tests
```typescript
// src/features/ai-tutor/actions/__tests__/chat-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendChatMessage } from '../chat-actions';
import { createMockFormData, mockFastAPIResponse } from '@/test-utils/server-action-helpers';

// Mock dependencies
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('@/lib/auth', () => ({
  getServerSession: vi.fn(() => ({
    user: { id: 'user-123' },
    accessToken: 'mock-token'
  }))
}));

global.fetch = vi.fn();

describe('sendChatMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send message successfully', async () => {
    // Arrange
    const mockResponse = {
      response: 'AI response to user message',
      messageId: 'msg-123'
    };
    
    (fetch as any).mockResolvedValueOnce(
      mockFastAPIResponse(mockResponse)
    );

    const formData = createMockFormData({
      message: 'Hello AI',
      tab: 'home'
    });

    // Act
    const result = await sendChatMessage(null, formData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.message).toBe('AI response to user message');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/chat/send'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );
  });

  it('should handle validation errors', async () => {
    // Arrange
    const formData = createMockFormData({
      message: '', // Empty message should fail validation
      tab: 'home'
    });

    // Act
    const result = await sendChatMessage(null, formData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('Message cannot be empty');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Internal server error' })
    });

    const formData = createMockFormData({
      message: 'Test message',
      tab: 'home'
    });

    // Act
    const result = await sendChatMessage(null, formData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Server error. Please try again later.');
  });

  it('should handle authentication errors', async () => {
    // Arrange
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({})
    });

    const formData = createMockFormData({
      message: 'Test message',
      tab: 'home'
    });

    // Act
    const result = await sendChatMessage(null, formData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Session expired. Please log in again.');
  });
});
```

### Phase 2: Component Integration

#### useActionState Integration Tests
```typescript
// src/features/ai-tutor/components/__tests__/ChatMessageForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatMessageForm } from '../ChatMessageForm';

describe('ChatMessageForm with Server Actions', () => {
  it('should handle successful message submission', async () => {
    render(<ChatMessageForm />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const submitButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.click(submitButton);

    // Check loading state
    expect(submitButton).toHaveTextContent('Sending...');
    expect(submitButton).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Send');
      expect(submitButton).not.toBeDisabled();
    });

    // Check success state
    expect(input).toHaveValue(''); // Input should be cleared
  });

  it('should display error messages', async () => {
    // Mock server action to return error
    render(<ChatMessageForm />);
    
    const input = screen.getByPlaceholderText('Type your message...');
    const submitButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: '' } }); // Empty message
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/message cannot be empty/i)).toBeInTheDocument();
    });
  });
});
```

## Files to Create

### Server Action Files
- `src/features/ai-tutor/actions/chat-actions.ts`
- `src/features/ai-tutor/actions/learning-actions.ts`
- `src/features/ai-tutor/actions/assessment-actions.ts`
- `src/features/ai-tutor/actions/index.ts` (exports)

### Supporting Files
- `src/lib/api-client.ts` (server-side API client)
- `src/lib/auth.ts` (server-side auth utilities)
- `src/lib/validation.ts` (Zod schemas and validation helpers)
- `src/types/api.ts` (API request/response types)
- `src/types/actions.ts` (Server Action types)

### Test Files
- `src/features/ai-tutor/actions/__tests__/chat-actions.test.ts`
- `src/features/ai-tutor/actions/__tests__/learning-actions.test.ts`
- `src/features/ai-tutor/actions/__tests__/assessment-actions.test.ts`
- `src/test-utils/server-action-helpers.ts`

### Component Integration Files
- `src/features/ai-tutor/components/ChatMessageForm.tsx` (using useActionState)
- `src/features/ai-tutor/components/ProgressUpdateForm.tsx`
- `src/features/ai-tutor/components/AssessmentForm.tsx`

## Files to Modify

### Remove Client-Side API Calls
- `src/features/ai-tutor/services/agUiService.ts` (remove or refactor)
- All components currently making direct API calls
- Remove API client dependencies from components

### Update Components to Use Server Actions
- `src/features/ai-tutor/components/MessageInput.tsx`
- `src/features/ai-tutor/components/TrackExplorationComponent.tsx`
- `src/features/ai-tutor/components/SkillAssessmentComponent.tsx`
- `src/features/ai-tutor/components/ProgressDashboardComponent.tsx`

### Environment Configuration
- `.env.local` (add FASTAPI_URL)
- `next.config.ts` (if needed for API configuration)

## Dependencies
**Blocks**: TASK-013, TASK-014  
**Blocked By**: TASK-011 (Custom hooks for business logic)  
**Related**: TASK-006 (React 19 useActionState), TASK-009 (Zustand migration)

## Definition of Done

### Technical Checklist
- [ ] All Server Actions implemented and tested
- [ ] Error handling comprehensive and user-friendly
- [ ] Type safety maintained throughout API integration
- [ ] Authentication and authorization working correctly
- [ ] Performance optimizations implemented
- [ ] Caching strategy integrated
- [ ] All client-side API calls replaced

### Quality Checklist
- [ ] >80% test coverage for all Server Actions
- [ ] Integration tests passing
- [ ] Error scenarios thoroughly tested
- [ ] Security review completed
- [ ] Performance benchmarks met

### User Experience Checklist
- [ ] Form submissions feel responsive
- [ ] Error messages are clear and actionable
- [ ] Loading states provide good feedback
- [ ] No functionality regressions

## Estimated Timeline
- **Server Action Implementation**: 16 hours
- **Validation and Error Handling**: 8 hours
- **Testing (Unit + Integration)**: 12 hours
- **Component Integration**: 8 hours
- **Performance Optimization**: 4 hours
- **Security Review**: 4 hours

**Total**: ~52 hours (7 story points)

## Success Metrics
- **Bundle Size**: Reduced client-side JavaScript
- **Performance**: Improved form submission response times
- **Error Rate**: Reduced API-related errors
- **Developer Experience**: Simplified component logic
- **Security**: No client-side API credential exposure

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Weekly progress check