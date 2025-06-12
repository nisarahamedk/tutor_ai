# TASK-008: Refactor Learning Components to Server Components (TDD)

## Task Overview
**Epic**: Component Decomposition  
**Story Points**: 6  
**Priority**: High  
**Type**: Refactoring  
**Assignee**: TBD  
**Status**: 🔴 Not Started  

## Description
Convert appropriate learning components to Server Components for better performance and leverage Next.js 15 patterns. This task identifies which components can benefit from server-side rendering and data fetching while maintaining necessary client-side interactivity.

## Business Value
- Improves initial page load performance through Server Components
- Reduces JavaScript bundle size sent to client
- Enables better SEO for learning content
- Leverages Next.js 15 optimizations and caching
- Provides faster Time to First Contentful Paint (TTFCP)
- Enables better data fetching patterns

## Current State Analysis

### Current Client Component Issues
```typescript
// All components are currently Client Components
'use client';

function TrackExplorationComponent() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Client-side data fetching
    fetchTracks().then(setTracks).finally(() => setLoading(false));
  }, []);
  
  return (
    <div>
      {loading ? <Spinner /> : <TrackList tracks={tracks} />}
    </div>
  );
}
```

### Problems to Address
- **Client-side data fetching**: Slower initial load
- **Larger bundle size**: All components sent to client
- **SEO limitations**: Content not available for crawlers
- **Waterfall requests**: Sequential loading patterns
- **Missing caching**: No server-side cache optimization

## Target Architecture

### Server/Client Component Separation
```typescript
// Server Component - Data fetching and static content
async function TrackExplorationPage() {
  // Server-side data fetching
  const tracks = await getLearningTracks();
  const userProgress = await getUserProgress();
  
  return (
    <div>
      <TrackHeader />
      <TrackList tracks={tracks} />
      <TrackSelectionClient initialProgress={userProgress} />
    </div>
  );
}

// Client Component - Interactive parts only
'use client';
function TrackSelectionClient({ initialProgress }) {
  const [selectedTrack, setSelectedTrack] = useState(null);
  
  return (
    <InteractiveTrackSelector 
      onSelect={setSelectedTrack}
      progress={initialProgress}
    />
  );
}
```

## Acceptance Criteria

### Must Have
- [ ] Identify components suitable for Server Component conversion
- [ ] Convert TrackExplorationComponent to Server/Client hybrid
- [ ] Convert ProgressDashboardComponent to leverage server rendering
- [ ] Implement proper data fetching in Server Components
- [ ] Create Client Components only for interactive parts
- [ ] Maintain all existing functionality and user interactions
- [ ] Improve initial page load performance measurably

### Nice to Have
- [ ] Implement Suspense boundaries for streaming
- [ ] Add error boundaries for Server Component failures
- [ ] Create reusable Server/Client component patterns
- [ ] Add static generation for learning content where possible
- [ ] Implement incremental static regeneration (ISR)

## Technical Implementation

### Component Analysis and Conversion Strategy

#### 1. TrackExploration Server/Client Split
```typescript
// src/app/ai-tutor/explore/page.tsx (Server Component)
import { Suspense } from 'react';
import { getLearningTracks, getUserProgress } from '@/features/ai-tutor/queries';
import { TrackGrid } from '@/features/ai-tutor/components/learning/TrackGrid';
import { TrackFilters } from '@/features/ai-tutor/components/learning/TrackFilters';
import { TrackInteractionClient } from '@/features/ai-tutor/components/learning/TrackInteractionClient';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface Props {
  searchParams: { difficulty?: string; category?: string };
}

export default async function TrackExplorationPage({ searchParams }: Props) {
  // Server-side data fetching with proper error handling
  const tracksPromise = getLearningTracks({
    difficulty: searchParams.difficulty,
    category: searchParams.category
  });
  
  const userProgressPromise = getUserProgress();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Explore Learning Tracks</h1>
        <p className="text-muted-foreground">
          Discover new skills and advance your learning journey
        </p>
      </div>

      {/* Client Component for filtering */}
      <TrackFilters />

      <Suspense fallback={<TrackGridSkeleton />}>
        <TrackContent 
          tracksPromise={tracksPromise}
          userProgressPromise={userProgressPromise}
        />
      </Suspense>
    </div>
  );
}

// Server Component for track content
async function TrackContent({ 
  tracksPromise, 
  userProgressPromise 
}: {
  tracksPromise: Promise<LearningTrack[]>;
  userProgressPromise: Promise<UserProgress>;
}) {
  // Parallel data fetching
  const [tracks, userProgress] = await Promise.all([
    tracksPromise,
    userProgressPromise
  ]);

  return (
    <div className="grid gap-6">
      {/* Server-rendered track grid */}
      <TrackGrid tracks={tracks} />
      
      {/* Client Component for interactions */}
      <TrackInteractionClient 
        tracks={tracks}
        initialProgress={userProgress}
      />
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ searchParams }: Props) {
  const difficulty = searchParams.difficulty;
  const category = searchParams.category;
  
  let title = 'Explore Learning Tracks';
  if (difficulty) title += ` - ${difficulty} Level`;
  if (category) title += ` - ${category}`;
  
  return {
    title,
    description: 'Discover and start learning with our curated tracks',
    openGraph: {
      title,
      description: 'Advance your skills with interactive learning tracks'
    }
  };
}
```

#### 2. Server-Side Data Fetching Functions
```typescript
// src/features/ai-tutor/queries.ts
import { cache } from 'react';
import { notFound } from 'next/navigation';

// Cache function for the request lifecycle
export const getLearningTracks = cache(async (filters?: {
  difficulty?: string;
  category?: string;
}) => {
  try {
    const searchParams = new URLSearchParams();
    if (filters?.difficulty) searchParams.set('difficulty', filters.difficulty);
    if (filters?.category) searchParams.set('category', filters.category);
    
    const response = await fetch(
      `${process.env.FASTAPI_URL}/api/v1/learning/tracks?${searchParams}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        // Cache for 5 minutes, revalidate every hour
        next: { 
          revalidate: 3600,
          tags: ['learning-tracks']
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error(`Failed to fetch tracks: ${response.status}`);
    }

    const tracks = await response.json();
    return tracks as LearningTrack[];
  } catch (error) {
    console.error('Error fetching learning tracks:', error);
    throw new Error('Failed to load learning tracks');
  }
});

export const getUserProgress = cache(async (userId?: string) => {
  try {
    // Get user from session or context
    const sessionUserId = userId || await getCurrentUserId();
    
    if (!sessionUserId) {
      return { tracks: {}, overallProgress: 0 };
    }

    const response = await fetch(
      `${process.env.FASTAPI_URL}/api/v1/users/${sessionUserId}/progress`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { 
          revalidate: 300, // 5 minutes
          tags: [`user-progress-${sessionUserId}`]
        }
      }
    );

    if (!response.ok) {
      console.warn(`Failed to fetch user progress: ${response.status}`);
      return { tracks: {}, overallProgress: 0 };
    }

    return await response.json() as UserProgress;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return { tracks: {}, overallProgress: 0 };
  }
});

export const getLearningTrackDetails = cache(async (trackId: string) => {
  try {
    const response = await fetch(
      `${process.env.FASTAPI_URL}/api/v1/learning/tracks/${trackId}`,
      {
        next: { 
          revalidate: 1800, // 30 minutes
          tags: [`track-${trackId}`]
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error(`Failed to fetch track: ${response.status}`);
    }

    return await response.json() as LearningTrackDetails;
  } catch (error) {
    console.error(`Error fetching track ${trackId}:`, error);
    throw error;
  }
});
```

#### 3. Static Track Grid Component (Server)
```typescript
// src/features/ai-tutor/components/learning/TrackGrid.tsx (Server Component)
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Star } from 'lucide-react';

interface TrackGridProps {
  tracks: LearningTrack[];
}

// Server Component - no 'use client' directive
export function TrackGrid({ tracks }: TrackGridProps) {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No tracks found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} />
      ))}
    </div>
  );
}

// Server Component - Track card
function TrackCard({ track }: { track: LearningTrack }) {
  const difficultyColor = {
    Beginner: 'bg-green-100 text-green-800',
    Intermediate: 'bg-yellow-100 text-yellow-800',
    Advanced: 'bg-red-100 text-red-800'
  }[track.difficulty] || 'bg-gray-100 text-gray-800';

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{track.title}</CardTitle>
          <Badge className={difficultyColor}>
            {track.difficulty}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {track.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{track.progress}%</span>
            </div>
            <Progress value={track.progress} className="h-2" />
          </div>

          {/* Track metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {track.estimatedHours}h
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {track.enrolledCount}
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1" />
              {track.rating}
            </div>
          </div>

          {/* Skills tags */}
          <div className="flex flex-wrap gap-1">
            {track.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
            {track.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{track.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 4. Interactive Client Component
```typescript
// src/features/ai-tutor/components/learning/TrackInteractionClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { startLearningTrackAction } from '../../actions/learning-actions';
import { toast } from '@/components/ui/use-toast';

interface TrackInteractionClientProps {
  tracks: LearningTrack[];
  initialProgress: UserProgress;
}

export function TrackInteractionClient({ 
  tracks, 
  initialProgress 
}: TrackInteractionClientProps) {
  const [selectedTrack, setSelectedTrack] = useState<LearningTrack | null>(null);
  const [isStarting, startTransition] = useTransition();

  const handleStartTrack = (track: LearningTrack) => {
    setSelectedTrack(track);
  };

  const handleConfirmStart = () => {
    if (!selectedTrack) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('trackId', selectedTrack.id);
        
        const result = await startLearningTrackAction(formData);
        
        if (result.success) {
          toast({
            title: "Track started!",
            description: `You've enrolled in ${selectedTrack.title}`,
          });
          setSelectedTrack(null);
        } else {
          toast({
            title: "Failed to start track",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <>
      {/* Invisible interaction overlay for track cards */}
      <div className="relative">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className="absolute inset-0 cursor-pointer"
            style={{
              // Position over corresponding track card
              gridColumn: `${(index % 3) + 1}`,
              gridRow: `${Math.floor(index / 3) + 1}`
            }}
            onClick={() => handleStartTrack(track)}
          />
        ))}
      </div>

      {/* Confirmation dialog */}
      <Dialog open={!!selectedTrack} onOpenChange={() => setSelectedTrack(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Learning Track</DialogTitle>
            <DialogDescription>
              Are you ready to begin "{selectedTrack?.title}"?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedTrack && (
              <div className="rounded-lg border p-4">
                <h4 className="font-medium">{selectedTrack.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTrack.description}
                </p>
                <div className="flex items-center gap-4 mt-3 text-sm">
                  <span>📚 {selectedTrack.lessonCount} lessons</span>
                  <span>⏱️ {selectedTrack.estimatedHours} hours</span>
                  <span>📊 {selectedTrack.difficulty}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedTrack(null)}
                disabled={isStarting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStart}
                disabled={isStarting}
              >
                {isStarting ? 'Starting...' : 'Start Learning'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

#### 5. Progress Dashboard Server Component
```typescript
// src/app/ai-tutor/progress/page.tsx (Server Component)
import { Suspense } from 'react';
import { getUserProgress, getUserAchievements } from '@/features/ai-tutor/queries';
import { ProgressOverview } from '@/features/ai-tutor/components/dashboard/ProgressOverview';
import { AchievementsBanner } from '@/features/ai-tutor/components/dashboard/AchievementsBanner';
import { LearningStreakCard } from '@/features/ai-tutor/components/dashboard/LearningStreakCard';
import { RecentActivityFeed } from '@/features/ai-tutor/components/dashboard/RecentActivityFeed';
import { ProgressInteractionClient } from '@/features/ai-tutor/components/dashboard/ProgressInteractionClient';

export default async function ProgressDashboardPage() {
  // Parallel data fetching
  const progressPromise = getUserProgress();
  const achievementsPromise = getUserAchievements();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your learning journey and celebrate achievements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main progress content */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<ProgressOverviewSkeleton />}>
            <ProgressContent progressPromise={progressPromise} />
          </Suspense>
          
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <ActivityContent />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Suspense fallback={<AchievementsSkeleton />}>
            <AchievementsContent achievementsPromise={achievementsPromise} />
          </Suspense>
          
          <LearningStreakCard />
        </div>
      </div>

      {/* Client component for interactions */}
      <Suspense>
        <ProgressInteractionClient />
      </Suspense>
    </div>
  );
}

// Server Component for progress content
async function ProgressContent({ 
  progressPromise 
}: { 
  progressPromise: Promise<UserProgress> 
}) {
  const progress = await progressPromise;
  
  return <ProgressOverview progress={progress} />;
}

// Server Component for achievements
async function AchievementsContent({ 
  achievementsPromise 
}: { 
  achievementsPromise: Promise<Achievement[]> 
}) {
  const achievements = await achievementsPromise;
  
  return <AchievementsBanner achievements={achievements} />;
}

// Server Component for activity feed
async function ActivityContent() {
  const activities = await getRecentActivity();
  
  return <RecentActivityFeed activities={activities} />;
}

// Metadata for SEO
export const metadata = {
  title: 'Learning Progress - AI Tutor',
  description: 'Track your learning progress and achievements',
  robots: 'noindex', // Private user data
};
```

### Server Component Patterns

#### Error Handling
```typescript
// src/features/ai-tutor/components/ErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary';

function LearningErrorFallback({ error, resetErrorBoundary }: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="text-center py-12">
      <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">
        We couldn't load the learning content. Please try again.
      </p>
      <Button onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  );
}

export function withLearningErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary
        FallbackComponent={LearningErrorFallback}
        onReset={() => window.location.reload()}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
```

#### Loading Skeletons
```typescript
// src/features/ai-tutor/components/loading/TrackGridSkeleton.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TrackGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-2 w-full" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-18" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Testing Strategy

### Server Component Testing
```typescript
// src/app/ai-tutor/explore/__tests__/page.test.tsx
/**
 * @jest-environment node
 */
import { render } from '@testing-library/react';
import TrackExplorationPage from '../page';
import { getLearningTracks, getUserProgress } from '@/features/ai-tutor/queries';

// Mock the queries
jest.mock('@/features/ai-tutor/queries');

const mockGetLearningTracks = getLearningTracks as jest.MockedFunction<typeof getLearningTracks>;
const mockGetUserProgress = getUserProgress as jest.MockedFunction<typeof getUserProgress>;

describe('TrackExplorationPage (Server Component)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render tracks from server-side data', async () => {
    const mockTracks = [
      {
        id: '1',
        title: 'React Fundamentals',
        description: 'Learn React basics',
        difficulty: 'Beginner' as const,
        progress: 0
      }
    ];

    const mockProgress = {
      tracks: {},
      overallProgress: 0
    };

    mockGetLearningTracks.mockResolvedValue(mockTracks);
    mockGetUserProgress.mockResolvedValue(mockProgress);

    const { container } = render(
      await TrackExplorationPage({ 
        searchParams: {} 
      })
    );

    expect(container).toMatchSnapshot();
    expect(mockGetLearningTracks).toHaveBeenCalledWith({});
    expect(mockGetUserProgress).toHaveBeenCalled();
  });

  it('should pass search params to track query', async () => {
    mockGetLearningTracks.mockResolvedValue([]);
    mockGetUserProgress.mockResolvedValue({ tracks: {}, overallProgress: 0 });

    await TrackExplorationPage({ 
      searchParams: { 
        difficulty: 'Intermediate',
        category: 'Frontend'
      } 
    });

    expect(mockGetLearningTracks).toHaveBeenCalledWith({
      difficulty: 'Intermediate',
      category: 'Frontend'
    });
  });

  it('should handle data fetching errors gracefully', async () => {
    mockGetLearningTracks.mockRejectedValue(new Error('API Error'));
    mockGetUserProgress.mockResolvedValue({ tracks: {}, overallProgress: 0 });

    await expect(TrackExplorationPage({ searchParams: {} })).rejects.toThrow('API Error');
  });
});
```

### Data Fetching Testing
```typescript
// src/features/ai-tutor/__tests__/queries.test.ts
/**
 * @jest-environment node
 */
import { getLearningTracks, getUserProgress } from '../queries';

// Mock fetch
global.fetch = jest.fn();

describe('Server-side Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FASTAPI_URL = 'http://localhost:8000';
  });

  describe('getLearningTracks', () => {
    it('should fetch tracks with correct parameters', async () => {
      const mockTracks = [{ id: '1', title: 'Test Track' }];
      
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockTracks
      } as Response);

      const result = await getLearningTracks({ 
        difficulty: 'Beginner',
        category: 'Frontend'
      });

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/learning/tracks?difficulty=Beginner&category=Frontend',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
          next: { revalidate: 3600, tags: ['learning-tracks'] }
        })
      );

      expect(result).toEqual(mockTracks);
    });

    it('should handle 404 responses', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 404
      } as Response);

      await expect(getLearningTracks()).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

      await expect(getLearningTracks()).rejects.toThrow('Failed to load learning tracks');
    });
  });

  describe('getUserProgress', () => {
    it('should return default progress when user not found', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        status: 404
      } as Response);

      const result = await getUserProgress();

      expect(result).toEqual({
        tracks: {},
        overallProgress: 0
      });
    });

    it('should cache results for same user', async () => {
      const mockProgress = { tracks: { '1': 50 }, overallProgress: 25 };
      
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: true,
        json: async () => mockProgress
      } as Response);

      // First call
      await getUserProgress('user-123');
      
      // Second call should use cache
      await getUserProgress('user-123');

      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});
```

### Integration Testing
```typescript
// tests/e2e/server-components.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Server Components Integration', () => {
  test('should render server-side content without client hydration delay', async ({ page }) => {
    // Navigate to explore page
    await page.goto('/ai-tutor/explore');

    // Content should be available immediately (server-rendered)
    await expect(page.getByText('Explore Learning Tracks')).toBeVisible();
    
    // Check that tracks are rendered server-side
    const trackCards = page.locator('[data-testid="track-card"]');
    await expect(trackCards.first()).toBeVisible();

    // Verify no loading spinner for server content
    await expect(page.getByTestId('track-grid-skeleton')).not.toBeVisible();
  });

  test('should handle server-side filtering', async ({ page }) => {
    // Navigate with search params
    await page.goto('/ai-tutor/explore?difficulty=Beginner&category=Frontend');

    // Server should have filtered results
    await expect(page.getByText('Frontend Development')).toBeVisible();
    
    // Verify URL reflects filters
    expect(page.url()).toContain('difficulty=Beginner');
    expect(page.url()).toContain('category=Frontend');
  });

  test('should maintain SEO benefits', async ({ page }) => {
    await page.goto('/ai-tutor/explore');

    // Check meta tags are properly set
    const title = await page.title();
    expect(title).toBe('Explore Learning Tracks');

    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toContain('Discover and start learning');
  });

  test('should handle server component errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/v1/learning/tracks', route => {
      route.fulfill({ status: 500, body: 'Server Error' });
    });

    await page.goto('/ai-tutor/explore');

    // Error boundary should show fallback
    await expect(page.getByText('Something went wrong')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });
});
```

## Files to Create

### Server Component Pages
- `src/app/ai-tutor/explore/page.tsx`
- `src/app/ai-tutor/progress/page.tsx`
- `src/app/ai-tutor/tracks/[id]/page.tsx`

### Server Components
- `src/features/ai-tutor/components/learning/TrackGrid.tsx`
- `src/features/ai-tutor/components/dashboard/ProgressOverview.tsx`
- `src/features/ai-tutor/components/dashboard/AchievementsBanner.tsx`

### Client Components
- `src/features/ai-tutor/components/learning/TrackInteractionClient.tsx`
- `src/features/ai-tutor/components/learning/TrackFilters.tsx`
- `src/features/ai-tutor/components/dashboard/ProgressInteractionClient.tsx`

### Data Fetching
- `src/features/ai-tutor/queries.ts`
- `src/lib/server-utils.ts`

### Loading Components
- `src/features/ai-tutor/components/loading/TrackGridSkeleton.tsx`
- `src/features/ai-tutor/components/loading/ProgressOverviewSkeleton.tsx`

### Test Files
- `src/app/ai-tutor/explore/__tests__/page.test.tsx`
- `src/features/ai-tutor/__tests__/queries.test.ts`
- `tests/e2e/server-components.spec.ts`

## Files to Modify

### Remove Client-Side Data Fetching
- Update existing components to remove useEffect data fetching
- Convert appropriate components to Server Components
- Move interactive parts to separate Client Components

### Update Routing
- Modify app router structure for new Server Component pages
- Update navigation to use new routes

## Dependencies
**Blocks**: TASK-010 (Learning store), TASK-012 (Server Actions)  
**Blocked By**: TASK-005 (Component decomposition)  
**Related**: TASK-006 (useActionState), TASK-014 (Caching)

## Definition of Done

### Technical Checklist
- [ ] Learning components converted to Server/Client hybrid pattern
- [ ] Server-side data fetching implemented with proper caching
- [ ] Performance improved measurably (TTFCP, LCP)
- [ ] SEO metadata properly implemented
- [ ] All existing functionality preserved
- [ ] Error boundaries and loading states implemented

### Quality Checklist
- [ ] Server Components tested with appropriate testing strategies
- [ ] Data fetching functions have comprehensive test coverage
- [ ] E2E tests validate server rendering behavior
- [ ] Performance benchmarks show improvement
- [ ] SEO validation passes

### Performance Checklist
- [ ] Initial page load improved by >20%
- [ ] JavaScript bundle size reduced for learning pages
- [ ] Time to First Contentful Paint improved
- [ ] Core Web Vitals scores maintained or improved
- [ ] Server-side caching working effectively

## Estimated Timeline
- **Component Analysis**: 4 hours
- **Server Component Conversion**: 12 hours
- **Data Fetching Implementation**: 8 hours
- **Client Component Extraction**: 8 hours
- **Testing (Unit + E2E)**: 10 hours
- **Performance Optimization**: 6 hours

**Total**: ~48 hours (6 story points)

## Success Metrics
- **Performance**: 20-30% improvement in initial page load
- **Bundle Size**: Reduced JavaScript for learning pages
- **SEO**: Improved search engine indexing
- **User Experience**: Faster perceived performance
- **Cache Hit Rate**: >80% for learning content

## Risk Mitigation
- **Hydration Mismatches**: Careful separation of server/client state
- **SEO Regression**: Comprehensive testing of meta tags and structure
- **Performance Regression**: Continuous monitoring and benchmarking
- **Complexity**: Clear patterns for server/client component boundaries

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Upon completion of component decomposition tasks