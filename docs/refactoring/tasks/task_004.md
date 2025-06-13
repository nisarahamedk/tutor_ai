# TASK-004: Install and Configure Zustand

## Task Overview
**Epic**: Foundation & Setup  
**Story Points**: 2  
**Priority**: High  
**Type**: Setup  
**Assignee**: TBD  
**Status**: ✅ Completed  

## Description
Setup Zustand for global state management to replace complex local state in the AI tutor application. This will provide a lightweight, performant alternative to prop drilling and complex useState patterns while preparing for the component decomposition phase.

## Business Value
- Eliminates prop drilling and complex state passing
- Improves performance through selective subscriptions
- Provides better developer experience with simpler state management
- Reduces component coupling and improves testability
- Enables easier debugging and state inspection
- Supports the upcoming component decomposition work

## Current State Analysis

### Current State Management Issues
- **Complex local state** in AITutorChat component (535+ lines)
- **Prop drilling** through multiple component layers
- **State duplication** across different components
- **Performance issues** due to unnecessary re-renders
- **Testing difficulty** due to complex state dependencies

### Current State Patterns
```typescript
// Current problematic pattern in AITutorChat
const [tabMessages, setTabMessages] = useState<Record<TabType, Message[]>>({
  home: getInitialMessages('home'),
  progress: getInitialMessages('progress'),
  review: getInitialMessages('review'),
  explore: getInitialMessages('explore'),
});

const [activeTab, setActiveTab] = useState<TabType>('home');
const [isLoading, setIsLoading] = useState(false);
const [currentTrack, setCurrentTrack] = useState<LearningTrack | null>(null);
// ... many more state variables
```

## Target Architecture

### Modern Zustand State Management
```typescript
// Clean, performant state management
const useChatStore = create<ChatStore>((set, get) => ({
  // State
  tabMessages: { home: [], progress: [], review: [], explore: [] },
  activeTab: 'home',
  isLoading: false,
  
  // Actions
  addMessage: (tab, message) => set((state) => ({
    tabMessages: {
      ...state.tabMessages,
      [tab]: [...state.tabMessages[tab], message]
    }
  })),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  // Selectors
  getTabMessages: (tab) => get().tabMessages[tab],
  hasMessages: (tab) => get().tabMessages[tab].length > 0
}));
```

## Acceptance Criteria

### Must Have
- [ ] Install Zustand with TypeScript support
- [ ] Create base store configuration with proper typing
- [ ] Setup development tools for state debugging
- [ ] Create store structure for AI tutor features (chat, learning, user)
- [ ] Add persistence for relevant state (chat history, user preferences)
- [ ] Document store patterns and usage guidelines
- [ ] Create typed selectors and hooks for components

### Nice to Have
- [ ] Setup Redux DevTools integration for debugging
- [ ] Add middleware for logging and debugging
- [ ] Create store performance monitoring
- [ ] Add state migration utilities for future updates
- [ ] Setup store testing utilities

## Technical Implementation

### Installation and Setup

#### Install Dependencies
```json
// package.json additions
{
  "dependencies": {
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/node": "^20"
  }
}
```

```bash
npm install zustand
npm install -D @types/node
```

### Store Structure Design

#### Base Store Types
```typescript
// src/features/ai-tutor/types.ts
export type TabType = 'home' | 'progress' | 'review' | 'explore';

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  progress: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  skills: string[];
}

export interface ProgressData {
  trackId: string;
  lessonId: string;
  completion: number;
  timeSpent: number;
  lastAccessed: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic';
}
```

#### Chat Store Implementation
```typescript
// src/features/ai-tutor/stores/chatStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { TabType, Message } from '../types';

interface ChatState {
  // State
  tabMessages: Record<TabType, Message[]>;
  activeTab: TabType;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addMessage: (tab: TabType, message: Message) => void;
  removeMessage: (tab: TabType, messageId: string) => void;
  clearMessages: (tab: TabType) => void;
  setActiveTab: (tab: TabType) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selectors
  getTabMessages: (tab: TabType) => Message[];
  hasMessages: (tab: TabType) => boolean;
  getMessageCount: (tab: TabType) => number;
  getLastMessage: (tab: TabType) => Message | null;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tabMessages: {
          home: [],
          progress: [],
          review: [],
          explore: []
        },
        activeTab: 'home',
        isLoading: false,
        error: null,

        // Actions
        addMessage: (tab, message) =>
          set(
            (state) => ({
              tabMessages: {
                ...state.tabMessages,
                [tab]: [...state.tabMessages[tab], message]
              }
            }),
            false,
            `addMessage/${tab}/${message.id}`
          ),

        removeMessage: (tab, messageId) =>
          set(
            (state) => ({
              tabMessages: {
                ...state.tabMessages,
                [tab]: state.tabMessages[tab].filter(msg => msg.id !== messageId)
              }
            }),
            false,
            `removeMessage/${tab}/${messageId}`
          ),

        clearMessages: (tab) =>
          set(
            (state) => ({
              tabMessages: {
                ...state.tabMessages,
                [tab]: []
              }
            }),
            false,
            `clearMessages/${tab}`
          ),

        setActiveTab: (tab) =>
          set({ activeTab: tab }, false, `setActiveTab/${tab}`),

        setLoading: (loading) =>
          set({ isLoading: loading }, false, `setLoading/${loading}`),

        setError: (error) =>
          set({ error }, false, `setError/${error}`),

        // Selectors
        getTabMessages: (tab) => get().tabMessages[tab],
        hasMessages: (tab) => get().tabMessages[tab].length > 0,
        getMessageCount: (tab) => get().tabMessages[tab].length,
        getLastMessage: (tab) => {
          const messages = get().tabMessages[tab];
          return messages.length > 0 ? messages[messages.length - 1] : null;
        }
      }),
      {
        name: 'ai-tutor-chat-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          tabMessages: state.tabMessages,
          activeTab: state.activeTab
        }),
        version: 1,
        migrate: (persistedState, version) => {
          // Handle state migrations for future versions
          return persistedState as ChatState;
        }
      }
    ),
    {
      name: 'ai-tutor-chat-store'
    }
  )
);

// Typed selectors for better performance
export const useChatMessages = (tab: TabType) =>
  useChatStore((state) => state.tabMessages[tab]);

export const useActiveTab = () =>
  useChatStore((state) => state.activeTab);

export const useChatLoading = () =>
  useChatStore((state) => state.isLoading);

export const useChatError = () =>
  useChatStore((state) => state.error);
```

#### Learning Store Implementation
```typescript
// src/features/ai-tutor/stores/learningStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { LearningTrack, ProgressData } from '../types';

interface LearningState {
  // State
  tracks: LearningTrack[];
  currentTrack: LearningTrack | null;
  progress: Record<string, ProgressData>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTracks: (tracks: LearningTrack[]) => void;
  selectTrack: (trackId: string) => void;
  updateProgress: (trackId: string, lessonId: string, progress: Partial<ProgressData>) => void;
  clearProgress: (trackId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selectors
  getTrackById: (trackId: string) => LearningTrack | undefined;
  getTrackProgress: (trackId: string) => number;
  getCompletedLessons: (trackId: string) => string[];
  getRecommendedTracks: () => LearningTrack[];
}

export const useLearningStore = create<LearningState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tracks: [],
        currentTrack: null,
        progress: {},
        isLoading: false,
        error: null,

        // Actions
        setTracks: (tracks) =>
          set({ tracks }, false, 'setTracks'),

        selectTrack: (trackId) =>
          set(
            (state) => ({
              currentTrack: state.tracks.find(track => track.id === trackId) || null
            }),
            false,
            `selectTrack/${trackId}`
          ),

        updateProgress: (trackId, lessonId, progressUpdate) =>
          set(
            (state) => {
              const progressKey = `${trackId}-${lessonId}`;
              return {
                progress: {
                  ...state.progress,
                  [progressKey]: {
                    ...state.progress[progressKey],
                    trackId,
                    lessonId,
                    ...progressUpdate,
                    lastAccessed: new Date().toISOString()
                  }
                }
              };
            },
            false,
            `updateProgress/${trackId}/${lessonId}`
          ),

        clearProgress: (trackId) =>
          set(
            (state) => {
              const newProgress = { ...state.progress };
              Object.keys(newProgress).forEach(key => {
                if (key.startsWith(`${trackId}-`)) {
                  delete newProgress[key];
                }
              });
              return { progress: newProgress };
            },
            false,
            `clearProgress/${trackId}`
          ),

        setLoading: (loading) =>
          set({ isLoading: loading }, false, `setLoading/${loading}`),

        setError: (error) =>
          set({ error }, false, `setError/${error}`),

        // Selectors
        getTrackById: (trackId) =>
          get().tracks.find(track => track.id === trackId),

        getTrackProgress: (trackId) => {
          const state = get();
          const trackProgress = Object.values(state.progress)
            .filter(p => p.trackId === trackId);
          
          if (trackProgress.length === 0) return 0;
          
          const avgCompletion = trackProgress.reduce((sum, p) => sum + p.completion, 0) / trackProgress.length;
          return Math.round(avgCompletion);
        },

        getCompletedLessons: (trackId) =>
          Object.values(get().progress)
            .filter(p => p.trackId === trackId && p.completion >= 100)
            .map(p => p.lessonId),

        getRecommendedTracks: () => {
          const { tracks, progress } = get();
          
          // Simple recommendation logic - can be enhanced
          return tracks
            .filter(track => {
              const trackProgress = Object.values(progress)
                .filter(p => p.trackId === track.id);
              return trackProgress.length === 0 || 
                     trackProgress.some(p => p.completion < 100);
            })
            .slice(0, 3);
        }
      }),
      {
        name: 'ai-tutor-learning-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          progress: state.progress,
          currentTrack: state.currentTrack
        }),
        version: 1
      }
    ),
    {
      name: 'ai-tutor-learning-store'
    }
  )
);

// Typed selectors
export const useLearningTracks = () =>
  useLearningStore((state) => state.tracks);

export const useCurrentTrack = () =>
  useLearningStore((state) => state.currentTrack);

export const useLearningProgress = (trackId?: string) =>
  useLearningStore((state) => 
    trackId ? state.getTrackProgress(trackId) : state.progress
  );
```

#### User Store Implementation
```typescript
// src/features/ai-tutor/stores/userStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { UserPreferences } from '../types';

interface UserState {
  // State
  preferences: UserPreferences;
  isAuthenticated: boolean;
  userId: string | null;
  
  // Actions
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  setAuthentication: (isAuthenticated: boolean, userId?: string) => void;
  resetUser: () => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  notifications: true,
  learningStyle: 'visual'
};

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        preferences: defaultPreferences,
        isAuthenticated: false,
        userId: null,

        // Actions
        setPreferences: (newPreferences) =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                ...newPreferences
              }
            }),
            false,
            'setPreferences'
          ),

        setAuthentication: (isAuthenticated, userId = null) =>
          set(
            { isAuthenticated, userId },
            false,
            `setAuthentication/${isAuthenticated}`
          ),

        resetUser: () =>
          set(
            {
              preferences: defaultPreferences,
              isAuthenticated: false,
              userId: null
            },
            false,
            'resetUser'
          )
      }),
      {
        name: 'ai-tutor-user-storage',
        storage: createJSONStorage(() => localStorage),
        version: 1
      }
    ),
    {
      name: 'ai-tutor-user-store'
    }
  )
);

// Typed selectors
export const useUserPreferences = () =>
  useUserStore((state) => state.preferences);

export const useAuthStatus = () =>
  useUserStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    userId: state.userId
  }));
```

### Store Index and Utilities

```typescript
// src/features/ai-tutor/stores/index.ts
export { useChatStore, useChatMessages, useActiveTab, useChatLoading, useChatError } from './chatStore';
export { useLearningStore, useLearningTracks, useCurrentTrack, useLearningProgress } from './learningStore';
export { useUserStore, useUserPreferences, useAuthStatus } from './userStore';

// Store utilities
export const resetAllStores = () => {
  useChatStore.getState().clearMessages('home');
  useChatStore.getState().clearMessages('progress');
  useChatStore.getState().clearMessages('review');
  useChatStore.getState().clearMessages('explore');
  useLearningStore.getState().setTracks([]);
  useUserStore.getState().resetUser();
};
```

### Development Tools and Debugging

```typescript
// src/lib/store-utils.ts
import { StateCreator } from 'zustand';

// Logger middleware for development
export const logger = <T>(
  f: StateCreator<T>,
  name?: string
) => (set: any, get: any, store: any) =>
  f(
    (...args) => {
      console.log(`[${name || 'Store'}] Previous state:`, get());
      set(...args);
      console.log(`[${name || 'Store'}] New state:`, get());
    },
    get,
    store
  );

// Performance monitor
export const performanceMonitor = <T>(
  f: StateCreator<T>
) => (set: any, get: any, store: any) =>
  f(
    (...args) => {
      const start = performance.now();
      set(...args);
      const end = performance.now();
      if (end - start > 10) {
        console.warn(`Store update took ${end - start}ms`);
      }
    },
    get,
    store
  );
```

## Testing Strategy

### Store Testing
```typescript
// src/features/ai-tutor/stores/__tests__/chatStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useChatStore } from '../chatStore';

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.getState().clearMessages('home');
    useChatStore.getState().clearMessages('progress');
    useChatStore.getState().clearMessages('review');
    useChatStore.getState().clearMessages('explore');
  });

  it('should add messages to correct tab', () => {
    const { result } = renderHook(() => useChatStore());
    
    const message = {
      id: '1',
      content: 'Test message',
      type: 'user' as const,
      timestamp: new Date().toISOString()
    };

    act(() => {
      result.current.addMessage('home', message);
    });

    expect(result.current.getTabMessages('home')).toHaveLength(1);
    expect(result.current.getTabMessages('home')[0]).toEqual(message);
    expect(result.current.getTabMessages('progress')).toHaveLength(0);
  });

  it('should switch active tab', () => {
    const { result } = renderHook(() => useChatStore());
    
    expect(result.current.activeTab).toBe('home');
    
    act(() => {
      result.current.setActiveTab('progress');
    });
    
    expect(result.current.activeTab).toBe('progress');
  });

  it('should maintain message history between tab switches', () => {
    const { result } = renderHook(() => useChatStore());
    
    const homeMessage = {
      id: '1',
      content: 'Home message',
      type: 'user' as const,
      timestamp: new Date().toISOString()
    };
    
    const progressMessage = {
      id: '2',
      content: 'Progress message',
      type: 'user' as const,
      timestamp: new Date().toISOString()
    };

    act(() => {
      result.current.addMessage('home', homeMessage);
      result.current.setActiveTab('progress');
      result.current.addMessage('progress', progressMessage);
      result.current.setActiveTab('home');
    });

    expect(result.current.getTabMessages('home')).toHaveLength(1);
    expect(result.current.getTabMessages('progress')).toHaveLength(1);
    expect(result.current.activeTab).toBe('home');
  });
});
```

## Files to Create

### Store Files
- `src/features/ai-tutor/stores/chatStore.ts`
- `src/features/ai-tutor/stores/learningStore.ts`
- `src/features/ai-tutor/stores/userStore.ts`
- `src/features/ai-tutor/stores/index.ts`

### Utility Files
- `src/lib/store-utils.ts`
- `src/features/ai-tutor/types.ts` (enhanced with store types)

### Test Files
- `src/features/ai-tutor/stores/__tests__/chatStore.test.ts`
- `src/features/ai-tutor/stores/__tests__/learningStore.test.ts`
- `src/features/ai-tutor/stores/__tests__/userStore.test.ts`

### Documentation
- `docs/architecture/state-management.md`
- `src/features/ai-tutor/stores/README.md`

## Dependencies
**Blocks**: TASK-005 (Component decomposition needs state management)  
**Blocked By**: TASK-003 (Need feature-based structure)  
**Related**: TASK-009 (Chat state migration), TASK-010 (Learning store usage)

## Definition of Done

### Technical Checklist
- [ ] Zustand installed and configured with TypeScript
- [ ] All three stores (chat, learning, user) implemented and tested
- [ ] Persistence working for relevant state
- [ ] Development tools (DevTools integration) working
- [ ] Store performance is acceptable
- [ ] Typed selectors created for optimal performance

### Quality Checklist
- [ ] >80% test coverage for all stores
- [ ] Store actions work correctly
- [ ] Persistence and hydration work properly
- [ ] No memory leaks in store subscriptions
- [ ] Store performance meets benchmarks

### Documentation Checklist
- [ ] Store patterns documented
- [ ] Usage examples provided
- [ ] Migration strategy from current state documented
- [ ] Team training materials created

## Estimated Timeline
- **Installation and Basic Setup**: 2 hours
- **Chat Store Implementation**: 4 hours
- **Learning Store Implementation**: 3 hours
- **User Store Implementation**: 2 hours
- **Testing**: 4 hours
- **Documentation**: 1 hour

**Total**: ~16 hours (2 story points)

## Success Metrics
- **Performance**: Store updates <5ms
- **Bundle Size**: Zustand adds <5KB to bundle
- **Developer Experience**: Simplified state management
- **Test Coverage**: >80% for all stores
- **Memory Usage**: No memory leaks detected

## Notes and Considerations
- Zustand chosen for its simplicity and performance
- Persistence only for user-relevant data (not all state)
- TypeScript integration ensures type safety
- Selectors optimize re-render performance
- DevTools integration helps with debugging
- Store structure aligns with feature-based architecture

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Upon completion and before component decomposition