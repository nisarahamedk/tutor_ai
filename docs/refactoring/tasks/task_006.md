# TASK-006: Migrate to React 19 useActionState (TDD)

## Task Overview
**Epic**: Component Decomposition  
**Story Points**: 6  
**Priority**: High  
**Type**: Feature  
**Assignee**: TBD  
**Status**: 🔴 Not Started  

## Description
Replace complex local state management with React 19's useActionState pattern for form handling and message sending. This leverages React 19's built-in optimizations for form state, loading states, and error handling while simplifying component logic.

## Business Value
- Simplifies form state management using React 19 native patterns
- Provides automatic loading and error state handling
- Improves user experience with built-in optimistic updates
- Reduces bundle size by removing custom state management code
- Enables better accessibility with native form handling
- Prepares codebase for Server Actions integration

## Current State Analysis

### Current Form State Management Issues
```typescript
// Current complex pattern in components
const [message, setMessage] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);
  
  try {
    const response = await apiCall(message);
    // Handle success...
    setMessage(''); // Clear form
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### Problems with Current Approach
- **Boilerplate code**: Repetitive state management in every form
- **Manual error handling**: Inconsistent error handling patterns
- **Loading state management**: Manual loading states in every component
- **Form reset logic**: Manual form clearing after success
- **Poor accessibility**: Missing proper form validation states

## Target Architecture

### Modern React 19 useActionState Pattern
```typescript
// Clean React 19 pattern
import { useActionState } from 'react';

function MessageForm() {
  const [state, formAction, isPending] = useActionState(sendMessageAction, null);
  
  return (
    <form action={formAction}>
      <input 
        name="message" 
        disabled={isPending}
        aria-invalid={state?.error ? 'true' : 'false'}
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Sending...' : 'Send'}
      </button>
      {state?.error && (
        <div role="alert" aria-live="polite">
          {state.error}
        </div>
      )}
    </form>
  );
}
```

## Acceptance Criteria

### Must Have
- [ ] Replace all form state management with useActionState
- [ ] Create Server Actions for message sending and form handling
- [ ] Implement proper loading states with automatic pending handling
- [ ] Add comprehensive error handling with user-friendly messages
- [ ] Maintain existing user experience and functionality
- [ ] Add proper accessibility attributes for form states
- [ ] Ensure form validation works correctly

### Nice to Have
- [ ] Add form field validation with real-time feedback
- [ ] Implement auto-save functionality for long forms
- [ ] Add keyboard shortcuts for form submission
- [ ] Create reusable form components with useActionState
- [ ] Add analytics tracking for form interactions

## Technical Implementation

### Server Actions for Form Handling

#### Chat Message Action
```typescript
// src/features/ai-tutor/actions/message-actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

interface MessageActionState {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
}

const MessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long')
    .transform(str => str.trim()),
  tab: z.enum(['home', 'progress', 'review', 'explore']),
  contextId: z.string().optional()
});

export async function sendMessageAction(
  prevState: MessageActionState | null,
  formData: FormData
): Promise<MessageActionState> {
  try {
    // Validate input
    const result = MessageSchema.safeParse({
      message: formData.get('message'),
      tab: formData.get('tab'),
      contextId: formData.get('contextId')
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error.errors[0].message
      };
    }

    const { message, tab, contextId } = result.data;

    // Simulate AI response (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In real implementation, call FastAPI
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, tab, contextId })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const aiResponse = await response.json();

    // Revalidate the chat page to update UI
    revalidatePath('/ai-tutor');

    return {
      success: true,
      message: aiResponse.response,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Message action failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}
```

#### Learning Progress Action
```typescript
// src/features/ai-tutor/actions/progress-actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

interface ProgressActionState {
  success: boolean;
  progress?: number;
  error?: string;
}

const ProgressSchema = z.object({
  trackId: z.string().uuid('Invalid track ID'),
  lessonId: z.string().uuid('Invalid lesson ID'),
  progress: z.coerce.number().min(0).max(100),
  notes: z.string().max(500).optional()
});

export async function updateProgressAction(
  prevState: ProgressActionState | null,
  formData: FormData
): Promise<ProgressActionState> {
  try {
    const result = ProgressSchema.safeParse({
      trackId: formData.get('trackId'),
      lessonId: formData.get('lessonId'),
      progress: formData.get('progress'),
      notes: formData.get('notes')
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error.errors[0].message
      };
    }

    const { trackId, lessonId, progress, notes } = result.data;

    // Update progress via API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/learning/progress`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, lessonId, progress, notes })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update progress');
    }

    revalidatePath('/ai-tutor/progress');

    return {
      success: true,
      progress
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update progress'
    };
  }
}
```

### Component Implementations with useActionState

#### Message Input Component
```typescript
// src/features/ai-tutor/components/chat/MessageInput.tsx
'use client';

import { useActionState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendMessageAction } from '../../actions/message-actions';
import { useActiveTab } from '../../stores/chatStore';

interface MessageInputProps {
  onMessageSent?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MessageInput({ 
  onMessageSent, 
  placeholder = "Type your message...",
  disabled = false 
}: MessageInputProps) {
  const [state, formAction, isPending] = useActionState(sendMessageAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeTab = useActiveTab();

  // Reset form on successful submission
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      textareaRef.current?.focus();
      onMessageSent?.(state.message || '');
    }
  }, [state?.success, onMessageSent]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form 
      ref={formRef}
      action={formAction} 
      className="flex flex-col gap-2 p-4 border-t"
    >
      {/* Hidden field for current tab */}
      <input type="hidden" name="tab" value={activeTab} />
      
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          name="message"
          placeholder={placeholder}
          disabled={disabled || isPending}
          onKeyDown={handleKeyDown}
          className="flex-1 min-h-[44px] max-h-32 resize-none"
          aria-label="Chat message input"
          aria-invalid={state?.error ? 'true' : 'false'}
          aria-describedby={state?.error ? 'message-error' : undefined}
        />
        
        <Button 
          type="submit" 
          disabled={disabled || isPending}
          className="self-end"
        >
          {isPending ? 'Sending...' : 'Send'}
        </Button>
      </div>

      {/* Error display */}
      {state?.error && (
        <div 
          id="message-error"
          role="alert" 
          aria-live="polite"
          className="text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      {/* Success feedback */}
      {state?.success && (
        <div 
          role="status" 
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          Message sent successfully
        </div>
      )}
    </form>
  );
}
```

#### Progress Update Form
```typescript
// src/features/ai-tutor/components/learning/ProgressForm.tsx
'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { updateProgressAction } from '../../actions/progress-actions';

interface ProgressFormProps {
  trackId: string;
  lessonId: string;
  initialProgress?: number;
  onProgressUpdated?: (progress: number) => void;
}

export function ProgressForm({ 
  trackId, 
  lessonId, 
  initialProgress = 0,
  onProgressUpdated 
}: ProgressFormProps) {
  const [state, formAction, isPending] = useActionState(updateProgressAction, null);

  useEffect(() => {
    if (state?.success && state.progress !== undefined) {
      onProgressUpdated?.(state.progress);
    }
  }, [state?.success, state?.progress, onProgressUpdated]);

  return (
    <form action={formAction} className="space-y-4">
      {/* Hidden fields */}
      <input type="hidden" name="trackId" value={trackId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      
      {/* Progress slider */}
      <div className="space-y-2">
        <Label htmlFor="progress">
          Lesson Progress: {initialProgress}%
        </Label>
        <Slider
          id="progress"
          name="progress"
          min={0}
          max={100}
          step={5}
          defaultValue={[initialProgress]}
          disabled={isPending}
          className="w-full"
        />
      </div>

      {/* Notes textarea */}
      <div className="space-y-2">
        <Label htmlFor="notes">
          Notes (optional)
        </Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Add any notes about your progress..."
          disabled={isPending}
          maxLength={500}
        />
      </div>

      {/* Submit button */}
      <Button 
        type="submit" 
        disabled={isPending}
        className="w-full"
      >
        {isPending ? 'Updating...' : 'Update Progress'}
      </Button>

      {/* Error display */}
      {state?.error && (
        <div 
          role="alert" 
          aria-live="polite"
          className="text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      {/* Success feedback */}
      {state?.success && (
        <div 
          role="status" 
          aria-live="polite"
          className="text-sm text-green-600"
        >
          Progress updated successfully!
        </div>
      )}
    </form>
  );
}
```

#### Preference Settings Form
```typescript
// src/features/ai-tutor/components/settings/PreferencesForm.tsx
'use client';

import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { updatePreferencesAction } from '../../actions/preference-actions';
import { useUserPreferences } from '../../stores/userStore';

export function PreferencesForm() {
  const [state, formAction, isPending] = useActionState(updatePreferencesAction, null);
  const preferences = useUserPreferences();

  return (
    <form action={formAction} className="space-y-6">
      {/* Theme selection */}
      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <Select name="theme" defaultValue={preferences.theme}>
          <SelectTrigger id="theme">
            <SelectValue placeholder="Select theme" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Learning style */}
      <div className="space-y-2">
        <Label htmlFor="learningStyle">Learning Style</Label>
        <Select name="learningStyle" defaultValue={preferences.learningStyle}>
          <SelectTrigger id="learningStyle">
            <SelectValue placeholder="Select learning style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visual">Visual</SelectItem>
            <SelectItem value="auditory">Auditory</SelectItem>
            <SelectItem value="kinesthetic">Kinesthetic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications toggle */}
      <div className="flex items-center space-x-2">
        <Switch 
          id="notifications" 
          name="notifications"
          defaultChecked={preferences.notifications}
        />
        <Label htmlFor="notifications">Enable notifications</Label>
      </div>

      {/* Submit button */}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Saving...' : 'Save Preferences'}
      </Button>

      {/* Status messages */}
      {state?.error && (
        <div role="alert" className="text-sm text-destructive">
          {state.error}
        </div>
      )}
      
      {state?.success && (
        <div role="status" className="text-sm text-green-600">
          Preferences saved successfully!
        </div>
      )}
    </form>
  );
}
```

## Testing Strategy

### Server Action Testing
```typescript
// src/features/ai-tutor/actions/__tests__/message-actions.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessageAction } from '../message-actions';

// Mock Next.js functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

global.fetch = vi.fn();

describe('sendMessageAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate and send message successfully', async () => {
    // Mock successful API response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ response: 'AI response' })
    });

    const formData = new FormData();
    formData.append('message', 'Hello AI');
    formData.append('tab', 'home');

    const result = await sendMessageAction(null, formData);

    expect(result.success).toBe(true);
    expect(result.message).toBe('AI response');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/send'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('should handle validation errors', async () => {
    const formData = new FormData();
    formData.append('message', ''); // Empty message
    formData.append('tab', 'home');

    const result = await sendMessageAction(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Message cannot be empty');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const formData = new FormData();
    formData.append('message', 'Test message');
    formData.append('tab', 'home');

    const result = await sendMessageAction(null, formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to send message');
  });
});
```

### Component Testing with useActionState
```typescript
// src/features/ai-tutor/components/chat/__tests__/MessageInput.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../MessageInput';

// Mock the action
vi.mock('../../actions/message-actions', () => ({
  sendMessageAction: vi.fn()
}));

describe('MessageInput', () => {
  it('should submit message using useActionState', async () => {
    const user = userEvent.setup();
    const onMessageSent = vi.fn();
    
    render(<MessageInput onMessageSent={onMessageSent} />);
    
    const textarea = screen.getByLabelText(/chat message input/i);
    const submitButton = screen.getByRole('button', { name: /send/i });
    
    // Type message
    await user.type(textarea, 'Test message');
    
    // Submit form
    await user.click(submitButton);
    
    // Check loading state
    expect(submitButton).toHaveTextContent('Sending...');
    expect(submitButton).toBeDisabled();
    expect(textarea).toBeDisabled();
  });

  it('should handle Enter key submission', async () => {
    const user = userEvent.setup();
    render(<MessageInput />);
    
    const textarea = screen.getByLabelText(/chat message input/i);
    
    await user.type(textarea, 'Test message');
    await user.keyboard('{Enter}');
    
    // Form should be submitted (button shows loading state)
    expect(screen.getByRole('button')).toHaveTextContent('Sending...');
  });

  it('should not submit on Shift+Enter', async () => {
    const user = userEvent.setup();
    render(<MessageInput />);
    
    const textarea = screen.getByLabelText(/chat message input/i);
    
    await user.type(textarea, 'Line 1');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(textarea, 'Line 2');
    
    // Should create new line, not submit
    expect(textarea).toHaveValue('Line 1\nLine 2');
    expect(screen.getByRole('button')).toHaveTextContent('Send');
  });

  it('should display error messages', async () => {
    // Mock action to return error
    const mockAction = vi.fn().mockResolvedValue({
      success: false,
      error: 'Message too long'
    });
    
    vi.mocked(sendMessageAction).mockImplementation(mockAction);
    
    const user = userEvent.setup();
    render(<MessageInput />);
    
    await user.type(screen.getByLabelText(/chat message input/i), 'Test');
    await user.click(screen.getByRole('button', { name: /send/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Message too long');
    });
  });
});
```

## Files to Create

### Action Files
- `src/features/ai-tutor/actions/message-actions.ts`
- `src/features/ai-tutor/actions/progress-actions.ts`
- `src/features/ai-tutor/actions/preference-actions.ts`

### Component Files
- Update `src/features/ai-tutor/components/chat/MessageInput.tsx`
- `src/features/ai-tutor/components/learning/ProgressForm.tsx`
- `src/features/ai-tutor/components/settings/PreferencesForm.tsx`

### Test Files
- `src/features/ai-tutor/actions/__tests__/message-actions.test.ts`
- `src/features/ai-tutor/actions/__tests__/progress-actions.test.ts`
- `src/features/ai-tutor/components/chat/__tests__/MessageInput.test.tsx`

### Utility Files
- `src/lib/form-utils.ts` (form validation helpers)

## Files to Modify

### Remove Old State Management
- Update all components currently using manual form state
- Remove useState patterns for loading/error states
- Update components to use useActionState

### Update Parent Components
- `src/features/ai-tutor/components/AITutorChat.tsx`
- Any components that handle form submissions

## Dependencies
**Blocks**: TASK-007 (useOptimistic), TASK-012 (Server Actions)  
**Blocked By**: TASK-005 (Component decomposition)  
**Related**: TASK-009 (Zustand integration)

## Definition of Done

### Technical Checklist
- [ ] All form components use useActionState instead of manual state
- [ ] Server Actions implemented for all form submissions
- [ ] Proper validation and error handling in place
- [ ] Loading states automatically handled by React 19
- [ ] Form accessibility improved with proper ARIA attributes
- [ ] All existing functionality preserved

### Quality Checklist
- [ ] >80% test coverage for new Server Actions
- [ ] Form components thoroughly tested
- [ ] Error scenarios covered in tests
- [ ] Accessibility testing passed
- [ ] Performance benchmarks met

### User Experience Checklist
- [ ] Forms feel more responsive
- [ ] Error messages are clear and helpful
- [ ] Loading states provide good feedback
- [ ] Keyboard navigation works correctly
- [ ] No regressions in functionality

## Estimated Timeline
- **Server Actions Implementation**: 12 hours
- **Component Migration**: 10 hours
- **Form Validation**: 6 hours
- **Testing**: 8 hours
- **Accessibility Improvements**: 4 hours

**Total**: ~40 hours (6 story points)

## Success Metrics
- **Code Reduction**: 30-40% less form-related code
- **Performance**: Improved form submission performance
- **Accessibility**: Better ARIA support and keyboard navigation
- **Developer Experience**: Simplified form component creation
- **User Experience**: More responsive and reliable forms

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Weekly progress check during implementation