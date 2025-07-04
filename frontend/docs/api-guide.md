# API Integration Guide

## Overview

This guide covers the API integration patterns used in the AI Tutor application, including Server Actions, validation, error handling, and best practices.

## Table of Contents

1. [Server Actions](#server-actions)
2. [Validation Layer](#validation-layer)
3. [Error Handling](#error-handling)
4. [API Client](#api-client)
5. [Caching Strategy](#caching-strategy)
6. [Authentication](#authentication)
7. [Rate Limiting](#rate-limiting)
8. [Monitoring](#monitoring)

## Server Actions

### Overview

Server Actions provide a type-safe way to handle form submissions and data mutations in Next.js 15. They run on the server and can directly interact with databases and external APIs.

### Basic Server Action Structure

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { validateFormData, createValidationError } from '../validation';
import { apiClient } from '../lib/api';

export async function actionName(
  prevState: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  try {
    // 1. Validate input
    const validation = validateFormData(Schema, formData);
    if (!validation.success) {
      return createValidationError(validation.error, validation.details);
    }

    // 2. Process request
    const response = await apiClient.post('/endpoint', validation.data);
    
    // 3. Revalidate cache
    revalidatePath('/relevant-path');
    
    // 4. Return success state
    return {
      success: true,
      error: null,
      data: response,
    };
  } catch (error) {
    // 5. Handle errors
    return handleActionError(error);
  }
}
```

### Chat Actions

#### Send Message Action

```typescript
export async function sendChatMessageAction(
  prevState: MessageActionState | null,
  formData: FormData
): Promise<MessageActionState> {
  // Validate message content and tab type
  const validation = validateFormData(SendMessageSchema, formData);
  
  // Send to FastAPI backend
  const response = await apiClient.post<SendMessageResponse>('/chat/send', {
    message: validation.data.message,
    tabType: validation.data.tabType,
    timestamp: new Date().toISOString(),
  });
  
  // Revalidate chat pages
  revalidatePath('/ai-tutor');
  revalidatePath('/ai-tutor/chat');
  
  return {
    success: true,
    error: null,
    message: response,
  };
}
```

#### Get Chat History

```typescript
export async function getChatHistoryAction(
  tabType: string
): Promise<{ messages: Message[]; success: boolean; error?: string }> {
  const response = await apiClient.get<Message[]>(`/chat/history?tab=${tabType}`);
  
  // Validate each message
  const validatedMessages = response.map(message => 
    validateResponse(MessageSchema, message)
  );

  return {
    success: true,
    messages: validatedMessages,
  };
}
```

### Learning Actions

#### Enroll in Track

```typescript
export async function enrollInTrackAction(
  prevState: TrackActionState | null,
  formData: FormData
): Promise<TrackActionState> {
  const validation = validateFormData(TrackEnrollmentSchema, formData);
  
  const response = await apiClient.post<TrackEnrollmentResponse>(
    '/learning/enroll',
    validation.data
  );
  
  // Revalidate multiple paths
  revalidatePath('/ai-tutor/tracks');
  revalidatePath('/ai-tutor/progress');
  revalidatePath(`/ai-tutor/tracks/${validation.data.trackId}`);
  
  return {
    success: true,
    error: null,
    track: await getLearningTrackAction(validation.data.trackId),
    enrollment: response,
  };
}
```

#### Update Progress

```typescript
export async function updateProgressAction(
  prevState: ProgressActionState | null,
  formData: FormData
): Promise<ProgressActionState> {
  const validation = validateFormData(ProgressUpdateSchema, formData);
  
  const response = await apiClient.post<ProgressResponse>(
    '/learning/progress',
    validation.data
  );
  
  return {
    success: true,
    error: null,
    progress: response,
  };
}
```

### Assessment Actions

#### Submit Assessment

```typescript
export async function submitAssessmentAction(
  prevState: AssessmentActionState | null,
  formData: FormData
): Promise<AssessmentActionState> {
  const validation = validateFormData(AssessmentSubmissionSchema, formData);
  
  const response = await apiClient.post<AssessmentResult>(
    '/assessments/submit',
    validation.data
  );
  
  revalidatePath(`/ai-tutor/assessment/${validation.data.assessmentId}`);
  
  return {
    success: true,
    error: null,
    result: response,
  };
}
```

## Validation Layer

### Zod Schemas

All API requests and responses are validated using Zod schemas:

```typescript
// Message validation
export const SendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  tabType: z.enum(['home', 'progress', 'review', 'explore']),
  timestamp: z.string().datetime(),
});

// Track enrollment validation
export const TrackEnrollmentSchema = z.object({
  trackId: z.string().uuid(),
  userPreferences: z.object({
    pace: z.enum(['slow', 'medium', 'fast']),
    focusAreas: z.array(z.string()),
    availableTime: z.number().positive(),
  }),
});

// Assessment submission validation
export const AssessmentSubmissionSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.string(),
    timeSpent: z.number().nonnegative(),
  })),
  totalTimeSpent: z.number().nonnegative(),
});
```

### Validation Functions

```typescript
// Validate form data
export function validateFormData<T>(
  schema: ZodSchema<T>,
  formData: FormData
): ValidationResult<T> {
  const data: Record<string, any> = {};
  
  // Convert FormData to object
  for (const [key, value] of formData.entries()) {
    if (key.includes('.')) {
      // Handle nested objects
      const keys = key.split('.');
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
  
  return validateData(schema, data);
}

// Validate API responses
export function validateResponse<T>(
  schema: ZodSchema<T>,
  response: unknown
): T {
  const result = validateData(schema, response);
  
  if (!result.success) {
    throw new ValidationError(
      result.error || 'Response validation failed',
      result.details || []
    );
  }
  
  return result.data!;
}
```

## Error Handling

### Error Types

```typescript
export class ValidationError extends Error {
  constructor(
    message: string,
    public details: Array<{ field: string; message: string; }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}
```

### Error Handling in Server Actions

```typescript
function handleActionError(error: unknown): ActionState {
  console.error('Action error:', error);
  
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      details: error.details,
    };
  }
  
  if (error instanceof Error && 'status' in error) {
    const status = (error as any).status;
    
    switch (status) {
      case 400:
        return { success: false, error: 'Invalid request data' };
      case 401:
        return { success: false, error: 'Authentication required' };
      case 403:
        return { success: false, error: 'Access denied' };
      case 404:
        return { success: false, error: 'Resource not found' };
      case 429:
        return { success: false, error: 'Rate limit exceeded' };
      case 500:
        return { success: false, error: 'Server error' };
      default:
        return { success: false, error: 'An unexpected error occurred' };
    }
  }
  
  return { success: false, error: 'An unexpected error occurred' };
}
```

## API Client

### HTTP Client Implementation

```typescript
export class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = new APIError(
        `API Error: ${response.status} ${response.statusText}`,
        response.status
      );
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new APIClient();
```

### Request Interceptors

```typescript
// Add authentication headers
const addAuthHeaders = (config: RequestInit): RequestInit => {
  const token = getAuthToken();
  
  return {
    ...config,
    headers: {
      ...config.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

// Add retry logic
const withRetry = async <T>(
  request: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await request();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
};
```

## Caching Strategy

### Next.js Caching

```typescript
// Static data caching
export const revalidate = 3600; // 1 hour
export const fetchCache = 'default-cache';

// Dynamic revalidation
revalidatePath('/ai-tutor/tracks');
revalidateTag('learning-tracks');
```

### Client-Side Caching

```typescript
// Memory cache for frequently accessed data
const memoryCache = new Map<string, { data: any; expires: number }>();

export function getCachedData<T>(key: string): T | null {
  const cached = memoryCache.get(key);
  
  if (!cached || Date.now() > cached.expires) {
    memoryCache.delete(key);
    return null;
  }
  
  return cached.data;
}

export function setCachedData<T>(
  key: string,
  data: T,
  ttl: number = 300000 // 5 minutes
): void {
  memoryCache.set(key, {
    data,
    expires: Date.now() + ttl,
  });
}
```

## Authentication

### JWT Token Management

```typescript
// Token storage and retrieval
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('auth_token');
}

// Token validation
export function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
```

### Authentication Actions

```typescript
export async function loginAction(
  prevState: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const validation = validateFormData(LoginSchema, formData);
  
  const response = await apiClient.post<AuthResponse>('/auth/login', {
    email: validation.data.email,
    password: validation.data.password,
  });
  
  setAuthToken(response.token);
  
  return {
    success: true,
    error: null,
    user: response.user,
  };
}
```

## Rate Limiting

### Client-Side Rate Limiting

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, limit: number, window: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < window);
    
    if (validRequests.length >= limit) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
}

const rateLimiter = new RateLimiter();

// Usage in actions
export async function sendMessageAction(...args) {
  const key = `chat:${getUserId()}`;
  
  if (!rateLimiter.isAllowed(key, 10, 60000)) { // 10 messages per minute
    return {
      success: false,
      error: 'Rate limit exceeded. Please wait before sending another message.',
    };
  }
  
  // Continue with action...
}
```

## Monitoring

### Performance Monitoring

```typescript
// Track API response times
export async function monitoredApiCall<T>(
  endpoint: string,
  request: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await request();
    const duration = performance.now() - startTime;
    
    // Track successful requests
    trackMetric('api_response_time', duration, {
      endpoint,
      status: 'success',
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Track failed requests
    trackMetric('api_response_time', duration, {
      endpoint,
      status: 'error',
      error: error.message,
    });
    
    throw error;
  }
}
```

### Error Tracking

```typescript
// Centralized error tracking
export function trackError(error: Error, context?: Record<string, any>): void {
  console.error('API Error:', error, context);
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    analyticsManager.trackError(error, context);
  }
}
```

## Best Practices

### 1. Input Validation
- Always validate inputs with Zod schemas
- Sanitize user inputs to prevent XSS
- Validate file uploads and sizes

### 2. Error Handling
- Provide user-friendly error messages
- Log detailed errors for debugging
- Implement retry mechanisms for transient failures

### 3. Performance
- Cache frequently accessed data
- Implement request deduplication
- Use optimistic updates for better UX

### 4. Security
- Never expose sensitive data in client-side code
- Validate and sanitize all inputs
- Implement proper authentication and authorization

### 5. Testing
- Test all error scenarios
- Mock API responses in tests
- Test with different network conditions

## Conclusion

This API integration guide provides a comprehensive approach to handling API communication in the AI Tutor application. The combination of Server Actions, validation, error handling, and monitoring ensures a robust and reliable system.

For specific implementation examples, refer to the source code in the `src/actions/` directory.