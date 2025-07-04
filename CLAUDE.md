# Claude Development Guidelines for Tutor AI

## Project Overview
This is a modern Next.js 15 + React 19 application with TypeScript. The application serves as an AI-powered tutoring platform with interactive learning components.

## Technology Stack
- **Framework**: Next.js 15.3.3 with App Router
- **React**: 19.0.0 with latest hooks (useActionState, useOptimistic)
- **TypeScript**: Latest with strict configuration
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: Feature-based with Zustand for complex state
- **Testing**: Jest + Playwright for E2E
- **API Integration**: API mocks for development with future backend integration

## Architecture Principles

### 1. Feature-Based Organization
- Organize code by features, not by technical layers
- Each feature should be self-contained with its own components, hooks, and types
- Prefer colocation of related functionality

### 2. Server Components First
- Use Server Components by default for better performance
- Only use Client Components when interactivity is required
- Leverage Server Actions for data mutations
- Use native fetch with Next.js 15 caching strategies

### 3. Modern React 19 Patterns
- Use `useActionState` for form handling and state management
- Implement `useOptimistic` for instant UI feedback
- Prefer React 19 hooks over external state management libraries when possible
- Use Server Actions instead of API routes when appropriate

### 4. State Management Strategy
- **Local State**: useState, useReducer for component-specific state
- **Form State**: useActionState with Server Actions
- **Global State**: Zustand for complex application state
- **Server State**: Native fetch with Next.js caching and API mocks
- **UI State**: React Context for theme, auth status

## Directory Structure

```
project-root/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── ai-tutor/          # Feature routes
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── shared/            # Cross-feature shared components
│   ├── features/              # Feature-based modules
│   │   └── ai-tutor/
│   │       ├── components/    # Feature-specific components
│   │       ├── hooks/         # Custom hooks
│   │       ├── actions/       # Server Actions
│   │       ├── queries.ts     # Data fetching functions
│   │       ├── stores/        # Zustand stores
│   │       └── types.ts       # TypeScript definitions
│   ├── lib/
│   │   ├── api.ts            # API client utilities
│   │   └── utils.ts          # General utilities
│   ├── validation/           # Input validation and schemas
│   └── monitoring/           # Performance monitoring
├── tests/                    # Test files
├── public/                   # Static assets
├── CLAUDE.md                 # This file
└── package.json
```

## Development Guidelines

### Component Development
1. **Start with Server Components** unless client interactivity is needed
2. **Keep components focused** - single responsibility principle
3. **Use TypeScript strictly** - no `any` types allowed
4. **Implement proper error boundaries** for client components
5. **Follow naming conventions**: PascalCase for components, camelCase for functions

### State Management Rules
1. **Colocate state** as close to where it's used as possible
2. **Use Zustand** only for truly global state that multiple features need
3. **Prefer Server Actions** over client-side API calls for mutations
4. **Implement optimistic updates** with `useOptimistic` for better UX

### Testing Requirements
1. **Write tests first** (TDD approach) before implementing features
2. **Test business logic** in custom hooks and utility functions
3. **Use Playwright** for component and E2E testing
4. **Mock external dependencies** properly in tests
5. **Maintain high test coverage** (>80% for business logic)

### Performance Guidelines
1. **Lazy load heavy components** using dynamic imports
2. **Implement proper memoization** with React.memo, useMemo, useCallback
3. **Optimize bundle size** - avoid unnecessary dependencies
4. **Use Next.js Image component** for optimized images
5. **Implement proper caching** strategies for API calls

## Code Quality Standards

### TypeScript Usage
```typescript
// ✅ Good - Proper typing
interface LearningTrack {
  id: string;
  title: string;
  description: string;
  progress: number;
}

// ❌ Bad - Using any
const track: any = fetchTrack();
```

### Component Structure
```typescript
// ✅ Good - Server Component with proper typing
interface Props {
  trackId: string;
}

export default async function TrackDetail({ trackId }: Props) {
  const track = await fetchTrack(trackId);
  
  return (
    <div>
      <h1>{track.title}</h1>
      <TrackProgress progress={track.progress} />
    </div>
  );
}

// ✅ Good - Client Component when needed
'use client';

interface InteractiveProps {
  onUpdate: (progress: number) => void;
}

export function InteractiveProgress({ onUpdate }: InteractiveProps) {
  const [progress, setProgress] = useState(0);
  
  return (
    <Slider 
      value={progress} 
      onValueChange={(value) => {
        setProgress(value);
        onUpdate(value);
      }} 
    />
  );
}
```

### Server Actions Pattern
```typescript
// actions.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function updateLearningProgress(
  trackId: string,
  progress: number
) {
  // Validate input
  if (progress < 0 || progress > 100) {
    return { error: 'Invalid progress value' };
  }
  
  try {
    // Update via FastAPI
    await fetch(`${process.env.API_URL}/tracks/${trackId}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress })
    });
    
    revalidatePath('/ai-tutor');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update progress' };
  }
}
```

## API Integration

### API Client Pattern with Mocking
```typescript
// lib/api.ts
class APIClient {
  private baseURL = process.env.NEXT_PUBLIC_API_URL!;
  
  async get<T>(endpoint: string): Promise<T> {
    // Check for mock data first during development
    if (process.env.NODE_ENV === 'development') {
      const mockData = await import('./api-mocks').then(m => m.getMockData(endpoint));
      if (mockData) return mockData;
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    // Use mocks for development
    if (process.env.NODE_ENV === 'development') {
      const mockResponse = await import('./api-mocks').then(m => m.postMockData(endpoint, data));
      if (mockResponse) return mockResponse;
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
}

export const apiClient = new APIClient();
```

## Testing Patterns

### Component Testing
```typescript
// components/TrackCard.test.tsx
import { render, screen } from '@testing-library/react';
import { TrackCard } from './TrackCard';

describe('TrackCard', () => {
  const mockTrack = {
    id: '1',
    title: 'React Basics',
    description: 'Learn React fundamentals',
    progress: 50
  };

  it('displays track information correctly', () => {
    render(<TrackCard track={mockTrack} />);
    
    expect(screen.getByText('React Basics')).toBeInTheDocument();
    expect(screen.getByText('Learn React fundamentals')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
```

### Hook Testing
```typescript
// hooks/useLearningProgress.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLearningProgress } from './useLearningProgress';

describe('useLearningProgress', () => {
  it('updates progress correctly', async () => {
    const { result } = renderHook(() => useLearningProgress('track-1'));
    
    await act(async () => {
      await result.current.updateProgress(75);
    });
    
    expect(result.current.progress).toBe(75);
  });
});
```

## Common Patterns to Follow

### Error Handling
```typescript
// ✅ Good - Proper error handling with mock support
async function fetchTrackData(id: string) {
  try {
    const response = await apiClient.get(`/tracks/${id}`);
    return { data: response, error: null };
  } catch (error) {
    console.error('Failed to fetch track:', error);
    return { data: null, error: 'Failed to load track data' };
  }
}
```

### Loading States
```typescript
// ✅ Good - Proper loading states
function TrackList() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchTracks()
      .then(({ data, error }) => {
        if (error) {
          setError(error);
        } else {
          setTracks(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div>
      {tracks.map(track => (
        <TrackCard key={track.id} track={track} />
      ))}
    </div>
  );
}
```

## Refactoring Guidelines

When refactoring existing code:

1. **Write tests first** for the existing functionality
2. **Refactor incrementally** - don't change everything at once
3. **Maintain backward compatibility** during transitions
4. **Use feature flags** for gradual rollouts
5. **Monitor performance** before and after changes
6. **Update documentation** as you go

## Performance Optimization

1. **Bundle Analysis**: Run `npm run build` and analyze bundle sizes
2. **Code Splitting**: Use dynamic imports for large components
3. **Image Optimization**: Always use Next.js Image component
4. **Caching**: Implement proper caching strategies for API calls
5. **Lazy Loading**: Load components only when needed

## Security Considerations

1. **Input Validation**: Always validate user inputs
2. **XSS Prevention**: Sanitize user-generated content
3. **CSRF Protection**: Use Next.js built-in CSRF protection
4. **Environment Variables**: Never expose sensitive data to client
5. **Authentication**: Implement proper JWT token handling

## Commands to Remember

```bash
# Development
npm run dev --turbopack        # Start development server with Turbopack
npm run build                  # Build for production
npm run lint                   # Run ESLint
npm run test                   # Run Jest tests
npm run test:e2e              # Run Playwright E2E tests

# Testing specific components
npm test -- TrackCard         # Test specific component
npm test -- --watch          # Watch mode for tests

# Bundle analysis
npm run build && npm run analyze
```

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_API_URL`: API URL for future backend integration (exposed to client)
- `API_URL`: Internal API URL for Server Actions (server-only)
- `AUTH_SECRET`: JWT secret for authentication

## When to Ask for Help

Before implementing new features:
1. Check if similar patterns exist in the codebase
2. Consider if Server Components can be used instead of Client Components
3. Evaluate if new dependencies are really needed
4. Plan the testing strategy before writing code

Remember: **Server Components first, Client Components when necessary, Test-Driven Development always.**