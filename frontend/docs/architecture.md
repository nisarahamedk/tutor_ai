# AI Tutor Architecture Guide

## Overview

The AI Tutor application is built using Next.js 15 with React 19, implementing modern patterns for optimal performance, accessibility, and user experience. This guide provides a comprehensive overview of the architecture and implementation decisions.

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Architecture Patterns](#architecture-patterns)
4. [State Management](#state-management)
5. [Server Components](#server-components)
6. [Server Actions](#server-actions)
7. [Performance Optimization](#performance-optimization)
8. [Accessibility](#accessibility)
9. [Testing Strategy](#testing-strategy)
10. [Deployment](#deployment)

## Technology Stack

### Core Technologies
- **Next.js 15**: Full-stack React framework with App Router
- **React 19**: Latest React with Suspense, Server Components, and new hooks
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management

### Development Tools
- **Vitest**: Fast unit testing framework
- **Playwright**: End-to-end testing
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Additional Libraries
- **Zod**: Schema validation
- **Web Vitals**: Performance monitoring
- **Framer Motion**: Animations
- **Radix UI**: Accessible component primitives

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── ai-tutor/          # AI Tutor feature pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── shared/           # Shared utilities
│   └── ui/               # UI components
├── features/             # Feature-based organization
│   └── ai-tutor/        # AI Tutor feature
│       ├── actions/      # Server Actions
│       ├── components/   # Feature components
│       ├── hooks/        # Business logic hooks
│       ├── stores/       # State management
│       └── types/        # Type definitions
├── lib/                 # Utility libraries
├── monitoring/          # Performance & analytics
├── utils/              # Helper functions
└── validation/         # Schema validation
```

## Architecture Patterns

### Feature-Based Organization

The application follows a feature-based architecture where related functionality is grouped together:

- **Components**: UI components specific to the feature
- **Hooks**: Business logic and state management
- **Actions**: Server Actions for data mutations
- **Stores**: Client-side state management
- **Types**: TypeScript type definitions

### Separation of Concerns

1. **Presentation Layer**: React components focused on UI rendering
2. **Business Logic Layer**: Custom hooks containing domain logic
3. **Data Layer**: Server Actions and API integration
4. **State Layer**: Zustand stores for client state

## State Management

### Zustand Stores

The application uses Zustand for client-side state management with multiple specialized stores:

#### Chat Store
```typescript
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
}
```

#### Learning Store
```typescript
interface LearningState {
  tracks: LearningTrack[];
  enrolledTracks: string[];
  progress: Record<string, number>;
  // ... actions
}
```

#### User Store
```typescript
interface UserState {
  preferences: UserPreferences;
  profile: UserProfile;
  // ... actions
}
```

### State Architecture Principles

1. **Single Responsibility**: Each store manages one domain
2. **Immutability**: All state updates are immutable
3. **Optimistic Updates**: UI updates immediately with rollback on error
4. **Persistence**: Critical state is persisted to localStorage

## Server Components

### Server Component Strategy

The application leverages React Server Components for:

1. **Static Content**: Course catalogs, learning tracks
2. **SEO-Critical Pages**: Landing pages, course descriptions
3. **Data Fetching**: Initial page loads with server-side data

### Example Server Component

```typescript
// Server Component for track listing
export default async function TracksPage() {
  const tracks = await getLearningTracks();
  
  return (
    <div>
      <TrackGrid tracks={tracks} />
      <TrackInteractionClient />
    </div>
  );
}
```

### Client Components

Interactive features use Client Components:

- Chat interface
- Progress tracking
- Assessment taking
- User preferences

## Server Actions

### Action Architecture

Server Actions handle all data mutations with comprehensive error handling and validation:

```typescript
'use server';

export async function sendChatMessageAction(
  prevState: MessageActionState | null,
  formData: FormData
): Promise<MessageActionState> {
  // 1. Validate input
  const validation = validateFormData(SendMessageSchema, formData);
  
  // 2. Process request
  const response = await apiClient.post('/chat/send', validation.data);
  
  // 3. Revalidate cache
  revalidatePath('/ai-tutor');
  
  // 4. Return result
  return { success: true, message: response };
}
```

### Action Categories

1. **Chat Actions**: Message sending, history management
2. **Learning Actions**: Track enrollment, progress updates
3. **Assessment Actions**: Submission, scoring
4. **Preference Actions**: User settings management

### Error Handling

All Server Actions implement consistent error handling:

- Input validation with Zod schemas
- Network error recovery
- User-friendly error messages
- Automatic retry mechanisms

## Performance Optimization

### Caching Strategy

#### Next.js 15 Caching

```typescript
// Static caching for learning tracks
export const revalidate = 3600; // 1 hour

// Dynamic caching for user data
export const fetchCache = 'force-cache';
```

#### Client-Side Caching

- **Memory Cache**: In-memory caching for session data
- **Storage Cache**: Persistent caching in localStorage
- **Service Worker**: Offline-first caching strategy

### Code Splitting

```typescript
// Lazy loading for non-critical components
const AssessmentComponent = lazy(() => import('./AssessmentComponent'));
```

### Performance Monitoring

- **Web Vitals**: Core Web Vitals tracking
- **Custom Metrics**: Application-specific performance metrics
- **Error Tracking**: Comprehensive error monitoring

## Accessibility

### WCAG 2.1 AA Compliance

The application implements comprehensive accessibility features:

#### Keyboard Navigation
- Full keyboard navigation support
- Focus trap in modals
- Skip links for screen readers

#### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic content

#### Visual Accessibility
- High contrast mode support
- Scalable font sizes
- Reduced motion preferences

### Accessibility Components

```typescript
// Accessible form field with proper labeling
<AccessibleFormField
  label="Message"
  error={error}
  description="Enter your question for the AI tutor"
  required
>
  <input type="text" />
</AccessibleFormField>
```

## Testing Strategy

### Test Types

1. **Unit Tests**: Component and hook testing with Vitest
2. **Integration Tests**: Feature workflow testing
3. **E2E Tests**: Complete user journey testing with Playwright

### Test Architecture

```typescript
// Component testing with React Testing Library
describe('ChatComponent', () => {
  it('should send message on form submission', async () => {
    render(<ChatComponent />);
    
    await user.type(screen.getByRole('textbox'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E Testing

Comprehensive E2E tests cover:

- Complete learning journeys
- Accessibility compliance
- Mobile responsiveness
- Performance benchmarks

## Deployment

### Build Optimization

```typescript
// Next.js configuration for production
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  compress: true,
  poweredByHeader: false,
};
```

### Environment Configuration

- **Development**: Hot reload, debug logging
- **Staging**: Production-like environment for testing
- **Production**: Optimized builds, monitoring enabled

### Monitoring

Production monitoring includes:

- Performance metrics collection
- Error tracking and alerting
- User analytics and insights
- System health monitoring

## Best Practices

### Component Design

1. **Single Responsibility**: Components have one clear purpose
2. **Composition Over Inheritance**: Use component composition
3. **Props Interface**: Well-defined TypeScript interfaces
4. **Error Boundaries**: Graceful error handling

### State Management

1. **Minimal State**: Keep only necessary state in stores
2. **Derived State**: Compute derived values in selectors
3. **Optimistic Updates**: Update UI immediately
4. **Error Recovery**: Handle and recover from errors

### Performance

1. **Lazy Loading**: Load components when needed
2. **Memoization**: Prevent unnecessary re-renders
3. **Bundle Optimization**: Split and optimize bundles
4. **Caching**: Implement comprehensive caching

### Security

1. **Input Validation**: Validate all user inputs
2. **CSRF Protection**: Use Next.js built-in protection
3. **Content Security Policy**: Implement CSP headers
4. **Authentication**: Secure authentication flow

## Contributing

### Development Workflow

1. Create feature branch from main
2. Implement changes with tests
3. Run linting and testing
4. Create pull request
5. Code review and merge

### Code Standards

- TypeScript for all code
- ESLint and Prettier configuration
- Test coverage requirements
- Documentation standards

### Performance Requirements

- Lighthouse score > 90
- Core Web Vitals in "Good" range
- Bundle size optimization
- Accessibility compliance

## Conclusion

This architecture provides a solid foundation for a modern, performant, and accessible web application. The combination of Next.js 15, React 19, and modern development practices ensures excellent user experience and maintainable code.

For more specific implementation details, refer to the individual component documentation and API guides.