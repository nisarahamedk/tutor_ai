# TASK-013: Request/Response Validation (TDD)

## Task Overview
**Epic**: Server Actions & API Integration  
**Story Points**: 3  
**Priority**: Medium  
**Type**: Feature  
**Assignee**: TBD  
**Status**: 🔴 Not Started  

## Description
Implement comprehensive request/response validation for all API interactions using Zod schemas and TypeScript. This ensures data integrity, provides better error messages, and prevents runtime errors from malformed API responses.

## Business Value
- Prevents runtime errors from malformed API data
- Provides clear error messages for debugging
- Ensures type safety across API boundaries
- Improves developer experience with autocomplete
- Enables better error recovery and user feedback
- Reduces production bugs related to data validation

## Current State Analysis

### Current Validation Issues
```typescript
// No validation - runtime errors possible
async function sendMessage(message: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message })
  });
  
  const data = await response.json(); // Any type, no validation
  return data; // Could be malformed
}

// Manual type assertions without runtime checks
interface ChatResponse {
  message: string;
  timestamp: string;
}

const result = data as ChatResponse; // Unsafe assumption
```

### Problems to Address
- **No runtime validation**: Assumes API responses match TypeScript types
- **Weak error handling**: Generic error messages without context
- **Type safety gaps**: Manual type assertions without validation
- **Inconsistent validation**: Different validation patterns across codebase
- **Poor user feedback**: Technical errors exposed to users

## Target Architecture

### Comprehensive Validation Strategy
```typescript
// Zod schemas with runtime validation
const SendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  tab: z.enum(['home', 'practice', 'help']),
  metadata: z.object({
    timestamp: z.string().datetime().optional(),
    userId: z.string().uuid().optional()
  }).optional()
});

const ChatResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
  metadata: z.object({
    tokensUsed: z.number().optional(),
    responseTime: z.number().optional()
  }).optional()
});

// Type-safe API calls with validation
async function sendMessageAction(formData: FormData) {
  const input = validateInput(SendMessageSchema, formData);
  const response = await apiCall('/chat', input);
  return validateResponse(ChatResponseSchema, response);
}
```

## Acceptance Criteria

### Must Have
- [ ] Create Zod schemas for all API request/response types
- [ ] Implement validation utilities for Server Actions
- [ ] Add request validation middleware for FastAPI endpoints
- [ ] Create user-friendly error messages for validation failures
- [ ] Add comprehensive error handling with proper status codes
- [ ] Ensure all existing API calls use validation
- [ ] Maintain performance with efficient validation patterns

### Nice to Have
- [ ] Add validation caching for repeated schema validations
- [ ] Create development-only validation warnings
- [ ] Add API response mocking based on schemas
- [ ] Implement progressive validation for large forms
- [ ] Add validation metrics and monitoring
- [ ] Create validation documentation generator

## Technical Implementation

### Core Validation Schemas

#### API Request/Response Schemas
```typescript
// src/features/ai-tutor/schemas/api.ts
import { z } from 'zod';

// Chat Message Schemas
export const SendMessageRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long (max 2000 characters)')
    .refine(msg => msg.trim().length > 0, 'Message cannot be only whitespace'),
  tab: z.enum(['home', 'practice', 'help'], {
    errorMap: () => ({ message: 'Invalid chat tab selected' })
  }),
  context: z.object({
    previousMessages: z.array(z.string()).max(10).optional(),
    userPreferences: z.object({
      language: z.string().optional(),
      difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional()
    }).optional()
  }).optional()
});

export const ChatResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.string().datetime(),
  metadata: z.object({
    tokensUsed: z.number().positive().optional(),
    responseTime: z.number().positive().optional(),
    model: z.string().optional(),
    confidence: z.number().min(0).max(1).optional()
  }).optional()
});

// Learning Track Schemas
export const LearningTrackSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  category: z.string().min(1),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  estimatedHours: z.number().positive().max(1000),
  skills: z.array(z.string()).min(1).max(20),
  lessons: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().min(1),
    estimatedMinutes: z.number().positive()
  })),
  prerequisites: z.array(z.string().uuid()),
  rating: z.number().min(0).max(5),
  enrolledCount: z.number().nonnegative(),
  imageUrl: z.string().url().optional()
});

export const EnrollTrackRequestSchema = z.object({
  trackId: z.string().uuid(),
  preferences: z.object({
    studySchedule: z.object({
      daysPerWeek: z.number().min(1).max(7),
      hoursPerSession: z.number().min(0.25).max(8),
      preferredTimes: z.array(z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/))
    }).optional(),
    notifications: z.object({
      enabled: z.boolean(),
      frequency: z.enum(['daily', 'weekly', 'milestone'])
    }).optional()
  }).optional()
});

// Progress Tracking Schemas
export const UpdateProgressRequestSchema = z.object({
  trackId: z.string().uuid(),
  lessonId: z.string().uuid(),
  progress: z.number().min(0).max(100),
  timeSpent: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
  completed: z.boolean().optional()
});

export const ProgressResponseSchema = z.object({
  success: z.boolean(),
  progress: z.object({
    trackId: z.string().uuid(),
    lessonId: z.string().uuid(),
    progress: z.number().min(0).max(100),
    timeSpent: z.number().nonnegative(),
    lastUpdated: z.string().datetime(),
    achievements: z.array(z.object({
      id: z.string().uuid(),
      title: z.string(),
      unlockedAt: z.string().datetime()
    })).optional()
  }).optional(),
  error: z.string().optional()
});

// Assessment Schemas
export const SubmitAssessmentRequestSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.union([z.string(), z.number(), z.array(z.string())]),
    timeSpent: z.number().nonnegative(),
    confidence: z.number().min(1).max(5).optional()
  })),
  totalTime: z.number().nonnegative(),
  metadata: z.object({
    userAgent: z.string().optional(),
    timezone: z.string().optional()
  }).optional()
});

// Type exports
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type LearningTrack = z.infer<typeof LearningTrackSchema>;
export type EnrollTrackRequest = z.infer<typeof EnrollTrackRequestSchema>;
export type UpdateProgressRequest = z.infer<typeof UpdateProgressRequestSchema>;
export type ProgressResponse = z.infer<typeof ProgressResponseSchema>;
export type SubmitAssessmentRequest = z.infer<typeof SubmitAssessmentRequestSchema>;
```

#### Validation Utilities
```typescript
// src/lib/validation.ts
import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIValidationError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'APIValidationError';
  }
}

// Input validation for Server Actions
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData
): T {
  try {
    // Convert FormData to object
    const data: Record<string, any> = {};
    
    for (const [key, value] of formData.entries()) {
      if (key.includes('[') && key.includes(']')) {
        // Handle nested objects like preferences[studySchedule][daysPerWeek]
        const keys = key.replace(/\]/g, '').split('[');
        let current = data;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
      } else {
        data[key] = value;
      }
    }

    // Parse numbers and booleans
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        if (value === 'true') data[key] = true;
        else if (value === 'false') data[key] = false;
        else if (/^\d+(\.\d+)?$/.test(value)) data[key] = Number(value);
      }
    }

    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      throw new APIValidationError(
        'Validation failed',
        400,
        fieldErrors
      );
    }
    throw error;
  }
}

// Response validation with error handling
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  response: any,
  context?: string
): T {
  try {
    return schema.parse(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`Response validation failed${context ? ` for ${context}` : ''}:`, {
        errors: error.errors,
        response
      });
      
      throw new ValidationError(
        `Invalid response format${context ? ` from ${context}` : ''}`,
        undefined,
        'INVALID_RESPONSE'
      );
    }
    throw error;
  }
}

// User-friendly error formatting
export function formatValidationError(error: z.ZodError): string {
  const errors = error.errors.map(err => {
    const field = err.path.join('.');
    return `${field}: ${err.message}`;
  });
  
  return errors.join(', ');
}

// Show validation errors to user
export function showValidationError(error: unknown) {
  if (error instanceof APIValidationError) {
    const message = error.errors.length === 1 
      ? error.errors[0].message
      : `${error.errors.length} validation errors occurred`;
    
    toast({
      title: "Validation Error",
      description: message,
      variant: "destructive",
    });
  } else if (error instanceof ValidationError) {
    toast({
      title: "Invalid Data",
      description: error.message,
      variant: "destructive",
    });
  } else {
    toast({
      title: "Error",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  }
}

// Async validation with loading states
export async function validateAndExecute<TInput, TOutput>(
  input: TInput,
  inputSchema: z.ZodSchema<TInput>,
  action: (validInput: TInput) => Promise<TOutput>,
  outputSchema: z.ZodSchema<TOutput>,
  context?: string
): Promise<TOutput> {
  try {
    // Validate input
    const validInput = inputSchema.parse(input);
    
    // Execute action
    const result = await action(validInput);
    
    // Validate output
    return validateResponse(outputSchema, result, context);
  } catch (error) {
    if (error instanceof z.ZodError) {
      showValidationError(error);
    }
    throw error;
  }
}
```

#### Enhanced Server Actions with Validation
```typescript
// src/features/ai-tutor/actions/validated-actions.ts
import { 
  SendMessageRequestSchema, 
  ChatResponseSchema,
  EnrollTrackRequestSchema,
  UpdateProgressRequestSchema
} from '../schemas/api';
import { validateFormData, validateResponse, showValidationError } from '@/lib/validation';

export async function sendMessageAction(
  prevState: any,
  formData: FormData
): Promise<{ success: boolean; message?: string; error?: string; timestamp?: string }> {
  try {
    // Validate input
    const input = validateFormData(SendMessageRequestSchema, formData);
    
    // Call FastAPI backend
    const response = await fetch(`${process.env.FASTAPI_URL}/api/v1/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    // Validate response
    const validatedResponse = validateResponse(
      ChatResponseSchema, 
      data,
      'chat message API'
    );

    return validatedResponse;
  } catch (error) {
    console.error('Send message validation error:', error);
    showValidationError(error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}

export async function enrollInTrackAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const input = validateFormData(EnrollTrackRequestSchema, formData);
    
    const response = await fetch(`${process.env.FASTAPI_URL}/api/v1/learning/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail || 'Failed to enroll in track'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Enroll track validation error:', error);
    showValidationError(error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}

export async function updateProgressAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const input = validateFormData(UpdateProgressRequestSchema, formData);
    
    const response = await fetch(`${process.env.FASTAPI_URL}/api/v1/learning/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.detail || 'Failed to update progress'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Update progress validation error:', error);
    showValidationError(error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}
```

### Client-Side Form Validation

#### React Hook Form Integration
```typescript
// src/features/ai-tutor/hooks/useValidatedForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';

export function useValidatedForm<T extends z.ZodSchema>(
  schema: T,
  defaultValues?: Partial<z.infer<T>>
) {
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onChange' // Real-time validation
  });

  const handleSubmit = (
    action: (data: z.infer<T>) => Promise<{ success: boolean; error?: string }>
  ) => {
    return form.handleSubmit(async (data) => {
      setSubmitError(null);
      
      startTransition(async () => {
        try {
          const result = await action(data);
          
          if (!result.success) {
            setSubmitError(result.error || 'Submission failed');
          }
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : 'Unknown error');
        }
      });
    });
  };

  return {
    ...form,
    handleSubmit,
    isPending,
    submitError,
    clearSubmitError: () => setSubmitError(null)
  };
}
```

#### Validated Form Components
```typescript
// src/features/ai-tutor/components/forms/EnrollTrackForm.tsx
'use client';

import { useValidatedForm } from '../../hooks/useValidatedForm';
import { EnrollTrackRequestSchema } from '../../schemas/api';
import { enrollInTrackAction } from '../../actions/validated-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EnrollTrackFormProps {
  trackId: string;
  onSuccess?: () => void;
}

export function EnrollTrackForm({ trackId, onSuccess }: EnrollTrackFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    isPending,
    submitError,
    clearSubmitError
  } = useValidatedForm(EnrollTrackRequestSchema, {
    trackId
  });

  const onSubmit = handleSubmit(async (data) => {
    const formData = new FormData();
    formData.append('trackId', data.trackId);
    
    if (data.preferences) {
      formData.append('preferences', JSON.stringify(data.preferences));
    }

    const result = await enrollInTrackAction(formData);
    
    if (result.success) {
      onSuccess?.();
    }
    
    return result;
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="trackId">Track ID</Label>
        <Input
          id="trackId"
          {...register('trackId')}
          disabled
          className="bg-muted"
        />
        {errors.trackId && (
          <p className="text-sm text-destructive mt-1">
            {errors.trackId.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="daysPerWeek">Study Days Per Week</Label>
        <Input
          id="daysPerWeek"
          type="number"
          min="1"
          max="7"
          {...register('preferences.studySchedule.daysPerWeek', {
            valueAsNumber: true
          })}
          placeholder="5"
        />
        {errors.preferences?.studySchedule?.daysPerWeek && (
          <p className="text-sm text-destructive mt-1">
            {errors.preferences.studySchedule.daysPerWeek.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="hoursPerSession">Hours Per Session</Label>
        <Input
          id="hoursPerSession"
          type="number"
          step="0.25"
          min="0.25"
          max="8"
          {...register('preferences.studySchedule.hoursPerSession', {
            valueAsNumber: true
          })}
          placeholder="1"
        />
        {errors.preferences?.studySchedule?.hoursPerSession && (
          <p className="text-sm text-destructive mt-1">
            {errors.preferences.studySchedule.hoursPerSession.message}
          </p>
        )}
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!isValid || isPending}
        className="w-full"
      >
        {isPending ? 'Enrolling...' : 'Enroll in Track'}
      </Button>
    </form>
  );
}
```

## Testing Strategy

### Schema Validation Testing
```typescript
// src/features/ai-tutor/schemas/__tests__/api.test.ts
import { describe, it, expect } from 'vitest';
import {
  SendMessageRequestSchema,
  ChatResponseSchema,
  LearningTrackSchema,
  EnrollTrackRequestSchema
} from '../api';

describe('API Schema Validation', () => {
  describe('SendMessageRequestSchema', () => {
    it('should validate valid message request', () => {
      const validRequest = {
        message: 'Hello, how can I learn React?',
        tab: 'home' as const,
        context: {
          previousMessages: ['Hi'],
          userPreferences: {
            language: 'en',
            difficultyLevel: 'beginner' as const
          }
        }
      };

      const result = SendMessageRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const invalidRequest = {
        message: '',
        tab: 'home' as const
      };

      const result = SendMessageRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('empty');
    });

    it('should reject message over 2000 characters', () => {
      const invalidRequest = {
        message: 'a'.repeat(2001),
        tab: 'home' as const
      };

      const result = SendMessageRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('too long');
    });

    it('should reject invalid tab', () => {
      const invalidRequest = {
        message: 'Valid message',
        tab: 'invalid-tab'
      };

      const result = SendMessageRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Invalid chat tab');
    });

    it('should reject whitespace-only message', () => {
      const invalidRequest = {
        message: '   \n\t   ',
        tab: 'home' as const
      };

      const result = SendMessageRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('whitespace');
    });
  });

  describe('ChatResponseSchema', () => {
    it('should validate successful response', () => {
      const validResponse = {
        success: true,
        message: 'Here is how to learn React...',
        timestamp: '2024-01-01T10:00:00Z',
        metadata: {
          tokensUsed: 150,
          responseTime: 1200,
          model: 'gpt-4',
          confidence: 0.95
        }
      };

      const result = ChatResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate error response', () => {
      const validResponse = {
        success: false,
        error: 'Rate limit exceeded',
        timestamp: '2024-01-01T10:00:00Z'
      };

      const result = ChatResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject invalid timestamp', () => {
      const invalidResponse = {
        success: true,
        message: 'Response',
        timestamp: 'invalid-date'
      };

      const result = ChatResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should reject negative token count', () => {
      const invalidResponse = {
        success: true,
        message: 'Response',
        timestamp: '2024-01-01T10:00:00Z',
        metadata: {
          tokensUsed: -10
        }
      };

      const result = ChatResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('LearningTrackSchema', () => {
    it('should validate complete learning track', () => {
      const validTrack = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'React Fundamentals',
        description: 'Learn the basics of React development',
        category: 'Frontend',
        difficulty: 'Beginner' as const,
        estimatedHours: 20,
        skills: ['React', 'JavaScript', 'JSX'],
        lessons: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Introduction to React',
            estimatedMinutes: 45
          }
        ],
        prerequisites: [],
        rating: 4.5,
        enrolledCount: 1250,
        imageUrl: 'https://example.com/react-course.jpg'
      };

      const result = LearningTrackSchema.safeParse(validTrack);
      expect(result.success).toBe(true);
    });

    it('should reject track with no skills', () => {
      const invalidTrack = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'React Fundamentals',
        description: 'Learn React',
        category: 'Frontend',
        difficulty: 'Beginner' as const,
        estimatedHours: 20,
        skills: [],
        lessons: [],
        prerequisites: [],
        rating: 4.5,
        enrolledCount: 1250
      };

      const result = LearningTrackSchema.safeParse(invalidTrack);
      expect(result.success).toBe(false);
    });

    it('should reject invalid difficulty level', () => {
      const invalidTrack = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'React Fundamentals',
        description: 'Learn React',
        category: 'Frontend',
        difficulty: 'Expert',
        estimatedHours: 20,
        skills: ['React'],
        lessons: [],
        prerequisites: [],
        rating: 4.5,
        enrolledCount: 1250
      };

      const result = LearningTrackSchema.safeParse(invalidTrack);
      expect(result.success).toBe(false);
    });
  });
});
```

### Validation Utility Testing
```typescript
// src/lib/__tests__/validation.test.ts
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { 
  validateFormData, 
  validateResponse, 
  ValidationError, 
  APIValidationError,
  formatValidationError
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateFormData', () => {
    const TestSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
      active: z.boolean(),
      preferences: z.object({
        theme: z.string(),
        notifications: z.boolean()
      }).optional()
    });

    it('should validate simple form data', () => {
      const formData = new FormData();
      formData.append('name', 'John Doe');
      formData.append('age', '25');
      formData.append('active', 'true');

      const result = validateFormData(TestSchema, formData);
      
      expect(result).toEqual({
        name: 'John Doe',
        age: 25,
        active: true
      });
    });

    it('should handle nested objects in form data', () => {
      const formData = new FormData();
      formData.append('name', 'John Doe');
      formData.append('age', '25');
      formData.append('active', 'true');
      formData.append('preferences[theme]', 'dark');
      formData.append('preferences[notifications]', 'false');

      const result = validateFormData(TestSchema, formData);
      
      expect(result).toEqual({
        name: 'John Doe',
        age: 25,
        active: true,
        preferences: {
          theme: 'dark',
          notifications: false
        }
      });
    });

    it('should throw APIValidationError for invalid data', () => {
      const formData = new FormData();
      formData.append('name', ''); // Invalid - empty string
      formData.append('age', '-5'); // Invalid - negative number

      expect(() => validateFormData(TestSchema, formData))
        .toThrow(APIValidationError);
    });

    it('should provide detailed error messages', () => {
      const formData = new FormData();
      formData.append('name', '');
      formData.append('age', 'invalid');

      try {
        validateFormData(TestSchema, formData);
      } catch (error) {
        expect(error).toBeInstanceOf(APIValidationError);
        const apiError = error as APIValidationError;
        expect(apiError.errors).toHaveLength(2);
        expect(apiError.errors[0].field).toBe('name');
        expect(apiError.errors[1].field).toBe('age');
      }
    });
  });

  describe('validateResponse', () => {
    const ResponseSchema = z.object({
      success: z.boolean(),
      data: z.string().optional(),
      error: z.string().optional()
    });

    it('should validate correct response', () => {
      const response = {
        success: true,
        data: 'Success message'
      };

      const result = validateResponse(ResponseSchema, response);
      expect(result).toEqual(response);
    });

    it('should throw ValidationError for invalid response', () => {
      const response = {
        success: 'not-boolean',
        data: 123
      };

      expect(() => validateResponse(ResponseSchema, response))
        .toThrow(ValidationError);
    });

    it('should include context in error message', () => {
      const response = { invalid: 'response' };

      try {
        validateResponse(ResponseSchema, response, 'user API');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('user API');
      }
    });
  });

  describe('formatValidationError', () => {
    it('should format single error', () => {
      const schema = z.object({ name: z.string().min(1) });
      const result = schema.safeParse({ name: '' });
      
      if (!result.success) {
        const formatted = formatValidationError(result.error);
        expect(formatted).toContain('name:');
      }
    });

    it('should format multiple errors', () => {
      const schema = z.object({ 
        name: z.string().min(1),
        age: z.number().min(0)
      });
      const result = schema.safeParse({ name: '', age: -1 });
      
      if (!result.success) {
        const formatted = formatValidationError(result.error);
        expect(formatted).toContain('name:');
        expect(formatted).toContain('age:');
        expect(formatted).toContain(',');
      }
    });
  });
});
```

## Files to Create

### Schema Files
- `src/features/ai-tutor/schemas/api.ts`
- `src/features/ai-tutor/schemas/learning.ts`
- `src/features/ai-tutor/schemas/assessment.ts`

### Validation Files
- `src/lib/validation.ts`
- `src/features/ai-tutor/actions/validated-actions.ts`
- `src/features/ai-tutor/hooks/useValidatedForm.ts`

### Component Files
- `src/features/ai-tutor/components/forms/EnrollTrackForm.tsx`
- `src/features/ai-tutor/components/forms/UpdateProgressForm.tsx`
- `src/features/ai-tutor/components/forms/AssessmentForm.tsx`

### Test Files
- `src/features/ai-tutor/schemas/__tests__/api.test.ts`
- `src/lib/__tests__/validation.test.ts`
- `src/features/ai-tutor/actions/__tests__/validated-actions.test.ts`

## Files to Modify

### Existing Server Actions
- Update all existing Server Actions to use validation
- Add proper error handling and user feedback
- Ensure consistent validation patterns

### Form Components
- Update existing forms to use validated schemas
- Add real-time validation feedback
- Improve error messaging

## Dependencies
**Blocks**: TASK-015 (Performance optimization), TASK-018 (Documentation)  
**Blocked By**: TASK-012 (Server Actions)  
**Related**: TASK-008 (Server Components), TASK-014 (Caching)

## Definition of Done

### Technical Checklist
- [ ] All API requests/responses use Zod validation
- [ ] Comprehensive error handling with user-friendly messages
- [ ] Form validation working with real-time feedback
- [ ] Performance impact minimal (<5ms per validation)
- [ ] All existing functionality preserved
- [ ] TypeScript types correctly inferred from schemas

### Quality Checklist
- [ ] >90% test coverage for validation logic
- [ ] All edge cases tested (empty inputs, malformed data)
- [ ] Error message testing validates user experience
- [ ] Performance testing shows no regression
- [ ] Security validation prevents common attacks

### Developer Experience Checklist
- [ ] Clear error messages aid debugging
- [ ] TypeScript autocomplete works correctly
- [ ] Validation schemas are well-documented
- [ ] Form validation provides immediate feedback
- [ ] API errors are properly categorized and logged

## Estimated Timeline
- **Schema Design and Creation**: 6 hours
- **Validation Utility Implementation**: 4 hours
- **Server Action Integration**: 6 hours
- **Form Validation Setup**: 4 hours
- **Testing (Unit + Integration)**: 8 hours
- **Error Handling Polish**: 4 hours

**Total**: ~32 hours (3 story points)

## Success Metrics
- **Data Integrity**: 100% of API calls use validation
- **Error Prevention**: 90% reduction in runtime type errors
- **User Experience**: Clear error messages for all validation failures
- **Developer Experience**: TypeScript autocomplete accuracy >95%
- **Performance**: Validation overhead <5ms per request

## Risk Mitigation
- **Schema Complexity**: Start with simple schemas, iterate gradually
- **Performance Impact**: Use efficient validation patterns, cache where possible
- **Migration Complexity**: Gradual rollout with feature flags
- **Breaking Changes**: Careful versioning of schemas and APIs

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Upon completion of Server Actions task