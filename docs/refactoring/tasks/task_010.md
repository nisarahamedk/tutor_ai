# TASK-010: Create Learning Progress Store (TDD)

## Task Overview
**Epic**: State Management Migration  
**Story Points**: 4  
**Priority**: High  
**Type**: Feature  
**Assignee**: TBD  
**Status**: 🔴 Not Started  

## Description
Implement Zustand store for learning progress and track management to centralize learning-related state management. This replaces scattered local state in learning components and provides a single source of truth for user progress, track enrollment, and learning analytics.

## Business Value
- Centralizes learning progress tracking across all components
- Enables better analytics and learning insights
- Provides consistent progress state across app
- Supports offline progress tracking with sync capabilities
- Improves performance through optimized state subscriptions
- Enables advanced features like learning streaks and achievements

## Current State Analysis

### Current Learning State Issues
```typescript
// Scattered state across multiple components
function TrackExplorationComponent() {
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [enrolledTracks, setEnrolledTracks] = useState([]);
  // ...
}

function ProgressDashboardComponent() {
  const [progress, setProgress] = useState({});
  const [achievements, setAchievements] = useState([]);
  // ...
}

function LessonComponent() {
  const [lessonProgress, setLessonProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState([]);
  // ...
}
```

### Problems to Address
- **State duplication**: Same progress data in multiple components
- **Inconsistent updates**: Progress updates don't reflect everywhere
- **No offline support**: Lost progress when network unavailable
- **Limited analytics**: Can't track learning patterns effectively
- **Performance issues**: Unnecessary re-renders and API calls

## Target Architecture

### Comprehensive Learning Store
```typescript
const useLearningStore = create<LearningState>((set, get) => ({
  // Centralized learning state
  tracks: [],
  enrolledTracks: [],
  currentTrack: null,
  progress: {},
  achievements: [],
  learningStreak: 0,
  
  // Actions
  enrollInTrack: (trackId) => /* update enrollment */,
  updateLessonProgress: (trackId, lessonId, progress) => /* track progress */,
  completeLesson: (trackId, lessonId) => /* mark complete */,
  
  // Computed values
  getTrackProgress: (trackId) => /* calculate overall progress */,
  getRecommendations: () => /* AI-based recommendations */,
  getLearningStats: () => /* analytics data */
}));
```

## Acceptance Criteria

### Must Have
- [ ] Create comprehensive learning store with Zustand
- [ ] Implement progress tracking for tracks, lessons, and assessments
- [ ] Add learning preferences and personalization state
- [ ] Support offline progress tracking with sync capabilities
- [ ] Provide computed values for analytics and insights
- [ ] Add persistence for critical learning data
- [ ] Integrate with existing learning components

### Nice to Have
- [ ] Implement learning streaks and gamification
- [ ] Add smart recommendations based on progress
- [ ] Create learning path optimization
- [ ] Add social learning features (shared progress)
- [ ] Implement adaptive learning algorithms
- [ ] Add export functionality for learning data

## Technical Implementation

### Learning Store Structure

#### Core Learning Types
```typescript
// src/features/ai-tutor/types/learning.ts
export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  skills: string[];
  lessons: Lesson[];
  prerequisites: string[];
  rating: number;
  enrolledCount: number;
  imageUrl?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'interactive' | 'quiz' | 'reading';
  estimatedMinutes: number;
  content: LessonContent;
  prerequisites: string[];
  learningObjectives: string[];
}

export interface LessonProgress {
  lessonId: string;
  trackId: string;
  userId: string;
  progress: number; // 0-100
  timeSpent: number; // minutes
  startedAt: string;
  lastAccessedAt: string;
  completedAt?: string;
  attempts: number;
  notes?: string;
  bookmarked: boolean;
}

export interface TrackEnrollment {
  trackId: string;
  userId: string;
  enrolledAt: string;
  targetCompletionDate?: string;
  studySchedule: StudySchedule;
  preferences: LearningPreferences;
  status: 'active' | 'paused' | 'completed' | 'dropped';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'progress' | 'streak' | 'skill' | 'social';
  criteria: AchievementCriteria;
  unlockedAt?: string;
  progress: number; // 0-100
}

export interface LearningStats {
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  tracksCompleted: number;
  lessonsCompleted: number;
  skillsAcquired: string[];
  averageSessionTime: number;
  preferredLearningTime: string;
  completionRate: number;
}

export interface StudySchedule {
  daysPerWeek: number;
  hoursPerSession: number;
  preferredTimes: string[];
  remindersEnabled: boolean;
  adaptiveScheduling: boolean;
}

export interface LearningPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  difficultyPreference: 'gradual' | 'challenging' | 'adaptive';
  contentTypes: ('video' | 'interactive' | 'reading' | 'quiz')[];
  language: string;
  autoPlay: boolean;
  captionsEnabled: boolean;
  darkMode: boolean;
  notifications: NotificationPreferences;
}
```

#### Main Learning Store Implementation
```typescript
// src/features/ai-tutor/stores/learningStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface LearningState {
  // Core state
  tracks: LearningTrack[];
  enrolledTracks: TrackEnrollment[];
  currentTrack: LearningTrack | null;
  currentLesson: Lesson | null;
  
  // Progress tracking
  lessonProgress: Record<string, LessonProgress>; // key: `${trackId}-${lessonId}`
  trackProgress: Record<string, number>; // key: trackId, value: percentage
  
  // User data
  achievements: Achievement[];
  learningStats: LearningStats;
  preferences: LearningPreferences;
  studySchedule: StudySchedule;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  lastSyncedAt: string | null;
  
  // Actions - Data Management
  setTracks: (tracks: LearningTrack[]) => void;
  setCurrentTrack: (track: LearningTrack | null) => void;
  setCurrentLesson: (lesson: Lesson | null) => void;
  
  // Actions - Enrollment
  enrollInTrack: (trackId: string, preferences?: Partial<LearningPreferences>) => void;
  unenrollFromTrack: (trackId: string) => void;
  updateEnrollmentPreferences: (trackId: string, preferences: Partial<LearningPreferences>) => void;
  
  // Actions - Progress Tracking
  updateLessonProgress: (trackId: string, lessonId: string, progress: Partial<LessonProgress>) => void;
  completeLesson: (trackId: string, lessonId: string, completionData?: Partial<LessonProgress>) => void;
  bookmarkLesson: (trackId: string, lessonId: string, bookmarked: boolean) => void;
  addLessonNote: (trackId: string, lessonId: string, note: string) => void;
  
  // Actions - Achievements
  unlockAchievement: (achievementId: string) => void;
  updateAchievementProgress: (achievementId: string, progress: number) => void;
  
  // Actions - Preferences
  updateLearningPreferences: (preferences: Partial<LearningPreferences>) => void;
  updateStudySchedule: (schedule: Partial<StudySchedule>) => void;
  
  // Actions - Sync
  syncWithServer: () => Promise<void>;
  markForSync: (dataType: 'progress' | 'preferences' | 'enrollment') => void;
  
  // Selectors
  getTrackById: (trackId: string) => LearningTrack | undefined;
  getLessonById: (trackId: string, lessonId: string) => Lesson | undefined;
  getTrackProgress: (trackId: string) => number;
  getLessonProgress: (trackId: string, lessonId: string) => LessonProgress | undefined;
  getCompletedLessons: (trackId: string) => string[];
  getBookmarkedLessons: () => { trackId: string; lessonId: string; lesson: Lesson }[];
  getRecommendedTracks: () => LearningTrack[];
  getLearningInsights: () => LearningInsights;
  getUpcomingLessons: () => { trackId: string; lesson: Lesson; progress?: LessonProgress }[];
}

export const useLearningStore = create<LearningState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        tracks: [],
        enrolledTracks: [],
        currentTrack: null,
        currentLesson: null,
        lessonProgress: {},
        trackProgress: {},
        achievements: [],
        learningStats: {
          totalTimeSpent: 0,
          currentStreak: 0,
          longestStreak: 0,
          tracksCompleted: 0,
          lessonsCompleted: 0,
          skillsAcquired: [],
          averageSessionTime: 0,
          preferredLearningTime: '18:00',
          completionRate: 0
        },
        preferences: {
          learningStyle: 'visual',
          difficultyPreference: 'adaptive',
          contentTypes: ['video', 'interactive'],
          language: 'en',
          autoPlay: false,
          captionsEnabled: true,
          darkMode: false,
          notifications: {
            studyReminders: true,
            achievementNotifications: true,
            progressUpdates: false
          }
        },
        studySchedule: {
          daysPerWeek: 5,
          hoursPerSession: 1,
          preferredTimes: ['18:00'],
          remindersEnabled: true,
          adaptiveScheduling: false
        },
        isLoading: false,
        error: null,
        lastSyncedAt: null,

        // Data Management Actions
        setTracks: (tracks) =>
          set((state) => {
            state.tracks = tracks;
          }),

        setCurrentTrack: (track) =>
          set((state) => {
            state.currentTrack = track;
            state.currentLesson = null; // Reset current lesson
          }),

        setCurrentLesson: (lesson) =>
          set((state) => {
            state.currentLesson = lesson;
          }),

        // Enrollment Actions
        enrollInTrack: (trackId, preferences = {}) =>
          set((state) => {
            const track = state.tracks.find(t => t.id === trackId);
            if (!track) return;

            const existingEnrollment = state.enrolledTracks.find(e => e.trackId === trackId);
            if (existingEnrollment) return; // Already enrolled

            const enrollment: TrackEnrollment = {
              trackId,
              userId: 'current-user', // Replace with actual user ID
              enrolledAt: new Date().toISOString(),
              studySchedule: { ...state.studySchedule },
              preferences: { ...state.preferences, ...preferences },
              status: 'active'
            };

            state.enrolledTracks.push(enrollment);
            state.trackProgress[trackId] = 0;
            
            // Set as current track if none selected
            if (!state.currentTrack) {
              state.currentTrack = track;
            }
          }),

        unenrollFromTrack: (trackId) =>
          set((state) => {
            state.enrolledTracks = state.enrolledTracks.filter(e => e.trackId !== trackId);
            delete state.trackProgress[trackId];
            
            // Remove lesson progress for this track
            Object.keys(state.lessonProgress).forEach(key => {
              if (key.startsWith(`${trackId}-`)) {
                delete state.lessonProgress[key];
              }
            });

            // Clear current track if it was unenrolled
            if (state.currentTrack?.id === trackId) {
              state.currentTrack = null;
              state.currentLesson = null;
            }
          }),

        updateEnrollmentPreferences: (trackId, preferences) =>
          set((state) => {
            const enrollment = state.enrolledTracks.find(e => e.trackId === trackId);
            if (enrollment) {
              enrollment.preferences = { ...enrollment.preferences, ...preferences };
            }
          }),

        // Progress Tracking Actions
        updateLessonProgress: (trackId, lessonId, progressUpdate) =>
          set((state) => {
            const progressKey = `${trackId}-${lessonId}`;
            const existing = state.lessonProgress[progressKey];
            
            const updated: LessonProgress = {
              lessonId,
              trackId,
              userId: 'current-user',
              progress: 0,
              timeSpent: 0,
              startedAt: new Date().toISOString(),
              lastAccessedAt: new Date().toISOString(),
              attempts: 1,
              bookmarked: false,
              ...existing,
              ...progressUpdate,
              lastAccessedAt: new Date().toISOString()
            };

            state.lessonProgress[progressKey] = updated;

            // Update track progress
            const track = state.tracks.find(t => t.id === trackId);
            if (track) {
              const trackLessonProgress = track.lessons.map(lesson => 
                state.lessonProgress[`${trackId}-${lesson.id}`]?.progress || 0
              );
              const avgProgress = trackLessonProgress.reduce((sum, p) => sum + p, 0) / track.lessons.length;
              state.trackProgress[trackId] = Math.round(avgProgress);
            }

            // Update learning stats
            if (progressUpdate.timeSpent) {
              state.learningStats.totalTimeSpent += progressUpdate.timeSpent;
            }
          }),

        completeLesson: (trackId, lessonId, completionData = {}) =>
          set((state) => {
            const progressKey = `${trackId}-${lessonId}`;
            const existing = state.lessonProgress[progressKey];
            
            const completed: LessonProgress = {
              ...existing,
              ...completionData,
              progress: 100,
              completedAt: new Date().toISOString(),
              lastAccessedAt: new Date().toISOString()
            };

            state.lessonProgress[progressKey] = completed;

            // Update stats
            state.learningStats.lessonsCompleted += 1;
            
            // Update track progress
            const track = state.tracks.find(t => t.id === trackId);
            if (track) {
              const completedLessons = track.lessons.filter(lesson =>
                state.lessonProgress[`${trackId}-${lesson.id}`]?.completedAt
              ).length;
              
              const trackProgressPercent = Math.round((completedLessons / track.lessons.length) * 100);
              state.trackProgress[trackId] = trackProgressPercent;

              // Check if track is completed
              if (trackProgressPercent === 100) {
                state.learningStats.tracksCompleted += 1;
                
                // Update enrollment status
                const enrollment = state.enrolledTracks.find(e => e.trackId === trackId);
                if (enrollment) {
                  enrollment.status = 'completed';
                }
              }
            }
          }),

        bookmarkLesson: (trackId, lessonId, bookmarked) =>
          set((state) => {
            const progressKey = `${trackId}-${lessonId}`;
            if (state.lessonProgress[progressKey]) {
              state.lessonProgress[progressKey].bookmarked = bookmarked;
            } else {
              // Create progress entry for bookmark
              state.lessonProgress[progressKey] = {
                lessonId,
                trackId,
                userId: 'current-user',
                progress: 0,
                timeSpent: 0,
                startedAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
                attempts: 0,
                bookmarked
              };
            }
          }),

        addLessonNote: (trackId, lessonId, note) =>
          set((state) => {
            const progressKey = `${trackId}-${lessonId}`;
            if (state.lessonProgress[progressKey]) {
              state.lessonProgress[progressKey].notes = note;
            }
          }),

        // Achievement Actions
        unlockAchievement: (achievementId) =>
          set((state) => {
            const achievement = state.achievements.find(a => a.id === achievementId);
            if (achievement && !achievement.unlockedAt) {
              achievement.unlockedAt = new Date().toISOString();
              achievement.progress = 100;
            }
          }),

        updateAchievementProgress: (achievementId, progress) =>
          set((state) => {
            const achievement = state.achievements.find(a => a.id === achievementId);
            if (achievement) {
              achievement.progress = Math.min(progress, 100);
              
              // Auto-unlock if reached 100%
              if (progress >= 100 && !achievement.unlockedAt) {
                achievement.unlockedAt = new Date().toISOString();
              }
            }
          }),

        // Preferences Actions
        updateLearningPreferences: (preferences) =>
          set((state) => {
            state.preferences = { ...state.preferences, ...preferences };
          }),

        updateStudySchedule: (schedule) =>
          set((state) => {
            state.studySchedule = { ...state.studySchedule, ...schedule };
          }),

        // Sync Actions
        syncWithServer: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            // Implement server sync logic
            await new Promise(resolve => setTimeout(resolve, 1000)); // Placeholder
            
            set((state) => {
              state.lastSyncedAt = new Date().toISOString();
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Sync failed';
              state.isLoading = false;
            });
          }
        },

        markForSync: (dataType) => {
          // Mark data for sync when online
          console.log(`Marked ${dataType} for sync`);
        },

        // Selectors
        getTrackById: (trackId) => get().tracks.find(t => t.id === trackId),

        getLessonById: (trackId, lessonId) => {
          const track = get().tracks.find(t => t.id === trackId);
          return track?.lessons.find(l => l.id === lessonId);
        },

        getTrackProgress: (trackId) => get().trackProgress[trackId] || 0,

        getLessonProgress: (trackId, lessonId) => {
          const progressKey = `${trackId}-${lessonId}`;
          return get().lessonProgress[progressKey];
        },

        getCompletedLessons: (trackId) => {
          const state = get();
          const track = state.tracks.find(t => t.id === trackId);
          if (!track) return [];

          return track.lessons
            .filter(lesson => state.lessonProgress[`${trackId}-${lesson.id}`]?.completedAt)
            .map(lesson => lesson.id);
        },

        getBookmarkedLessons: () => {
          const state = get();
          const bookmarked: { trackId: string; lessonId: string; lesson: Lesson }[] = [];

          Object.entries(state.lessonProgress).forEach(([key, progress]) => {
            if (progress.bookmarked) {
              const [trackId, lessonId] = key.split('-');
              const lesson = state.getLessonById(trackId, lessonId);
              if (lesson) {
                bookmarked.push({ trackId, lessonId, lesson });
              }
            }
          });

          return bookmarked;
        },

        getRecommendedTracks: () => {
          const state = get();
          const { preferences, enrolledTracks, learningStats } = state;
          
          // Simple recommendation algorithm
          return state.tracks
            .filter(track => !enrolledTracks.some(e => e.trackId === track.id))
            .filter(track => {
              // Match difficulty preference
              if (preferences.difficultyPreference === 'gradual') {
                return track.difficulty === 'Beginner';
              }
              if (preferences.difficultyPreference === 'challenging') {
                return track.difficulty === 'Advanced';
              }
              return true; // adaptive
            })
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5);
        },

        getLearningInsights: () => {
          const state = get();
          const { learningStats, lessonProgress, enrolledTracks } = state;

          const insights = {
            ...learningStats,
            weeklyProgress: 0, // Calculate from recent progress
            strongestSkills: [] as string[],
            suggestedFocus: [] as string[],
            streakData: {
              current: learningStats.currentStreak,
              longest: learningStats.longestStreak,
              lastActivity: '' // From progress data
            }
          };

          return insights;
        },

        getUpcomingLessons: () => {
          const state = get();
          const upcoming: { trackId: string; lesson: Lesson; progress?: LessonProgress }[] = [];

          state.enrolledTracks.forEach(enrollment => {
            if (enrollment.status !== 'active') return;

            const track = state.getTrackById(enrollment.trackId);
            if (!track) return;

            // Find next incomplete lesson
            const nextLesson = track.lessons.find(lesson => {
              const progress = state.getLessonProgress(track.id, lesson.id);
              return !progress?.completedAt;
            });

            if (nextLesson) {
              upcoming.push({
                trackId: track.id,
                lesson: nextLesson,
                progress: state.getLessonProgress(track.id, nextLesson.id)
              });
            }
          });

          return upcoming.slice(0, 5); // Limit to 5 upcoming lessons
        }
      })),
      {
        name: 'ai-tutor-learning-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Persist important learning data
          enrolledTracks: state.enrolledTracks,
          lessonProgress: state.lessonProgress,
          trackProgress: state.trackProgress,
          achievements: state.achievements,
          learningStats: state.learningStats,
          preferences: state.preferences,
          studySchedule: state.studySchedule,
          currentTrack: state.currentTrack
        }),
        version: 1,
        migrate: (persistedState, version) => {
          // Handle state migrations for future versions
          if (version === 0) {
            // Migration from v0 to v1
            return {
              ...persistedState,
              achievements: [],
              learningStats: {
                totalTimeSpent: 0,
                currentStreak: 0,
                longestStreak: 0,
                tracksCompleted: 0,
                lessonsCompleted: 0,
                skillsAcquired: [],
                averageSessionTime: 0,
                preferredLearningTime: '18:00',
                completionRate: 0
              }
            };
          }
          return persistedState as LearningState;
        }
      }
    ),
    {
      name: 'ai-tutor-learning-store'
    }
  )
);

// Typed selectors for optimal performance
export const useEnrolledTracks = () => 
  useLearningStore(state => state.enrolledTracks);

export const useCurrentTrack = () => 
  useLearningStore(state => state.currentTrack);

export const useCurrentLesson = () => 
  useLearningStore(state => state.currentLesson);

export const useLearningStats = () => 
  useLearningStore(state => state.learningStats);

export const useLearningPreferences = () => 
  useLearningStore(state => state.preferences);

export const useTrackProgress = (trackId: string) =>
  useLearningStore(state => state.getTrackProgress(trackId));

export const useLessonProgress = (trackId: string, lessonId: string) =>
  useLearningStore(state => state.getLessonProgress(trackId, lessonId));

export const useBookmarkedLessons = () =>
  useLearningStore(state => state.getBookmarkedLessons());

export const useRecommendedTracks = () =>
  useLearningStore(state => state.getRecommendedTracks());

export const useUpcomingLessons = () =>
  useLearningStore(state => state.getUpcomingLessons());
```

### Advanced Learning Features

#### Learning Analytics Hook
```typescript
// src/features/ai-tutor/hooks/useLearningAnalytics.ts
import { useMemo } from 'react';
import { useLearningStore } from '../stores/learningStore';

export function useLearningAnalytics() {
  const store = useLearningStore();

  const analytics = useMemo(() => {
    const { lessonProgress, enrolledTracks, learningStats } = store;
    
    // Calculate weekly progress
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentProgress = Object.values(lessonProgress).filter(
      progress => new Date(progress.lastAccessedAt) >= oneWeekAgo
    );

    const weeklyTimeSpent = recentProgress.reduce(
      (total, progress) => total + progress.timeSpent, 0
    );

    const weeklyLessonsCompleted = recentProgress.filter(
      progress => progress.completedAt && new Date(progress.completedAt) >= oneWeekAgo
    ).length;

    // Calculate completion velocity
    const completionVelocity = weeklyLessonsCompleted > 0 ? 
      weeklyTimeSpent / weeklyLessonsCompleted : 0;

    // Learning pattern analysis
    const learningTimes = recentProgress.map(p => 
      new Date(p.lastAccessedAt).getHours()
    );
    
    const preferredHour = learningTimes.length > 0 ?
      Math.round(learningTimes.reduce((a, b) => a + b) / learningTimes.length) : 18;

    // Skill progression
    const skillsInProgress = enrolledTracks.flatMap(enrollment => {
      const track = store.getTrackById(enrollment.trackId);
      return track ? track.skills : [];
    });

    const uniqueSkills = [...new Set(skillsInProgress)];

    return {
      weeklyStats: {
        timeSpent: weeklyTimeSpent,
        lessonsCompleted: weeklyLessonsCompleted,
        avgSessionTime: recentProgress.length > 0 ? 
          weeklyTimeSpent / recentProgress.length : 0
      },
      learningVelocity: {
        completionRate: completionVelocity,
        trend: 'stable', // Could be calculated based on historical data
        projection: weeklyLessonsCompleted * 4 // Monthly projection
      },
      learningPatterns: {
        preferredHour,
        mostActiveDay: 'Monday', // Could be calculated from progress timestamps
        consistencyScore: learningStats.currentStreak * 10 // Simple metric
      },
      skillProgression: {
        totalSkills: uniqueSkills.length,
        completedSkills: learningStats.skillsAcquired.length,
        inProgressSkills: uniqueSkills.filter(
          skill => !learningStats.skillsAcquired.includes(skill)
        )
      },
      recommendations: {
        suggestedStudyTime: Math.max(30, weeklyTimeSpent / 7), // Daily suggestion
        focusAreas: uniqueSkills.slice(0, 3), // Top 3 skills to focus on
        nextMilestone: calculateNextMilestone(store)
      }
    };
  }, [store]);

  return analytics;
}

function calculateNextMilestone(store: any) {
  const { enrolledTracks, trackProgress } = store;
  
  // Find closest track to completion
  const trackCompletion = enrolledTracks.map(enrollment => ({
    trackId: enrollment.trackId,
    progress: trackProgress[enrollment.trackId] || 0
  }));

  const closestToCompletion = trackCompletion
    .filter(tc => tc.progress < 100)
    .sort((a, b) => b.progress - a.progress)[0];

  if (closestToCompletion) {
    const track = store.getTrackById(closestToCompletion.trackId);
    return {
      type: 'track_completion',
      title: `Complete ${track?.title}`,
      progress: closestToCompletion.progress,
      description: `${100 - closestToCompletion.progress}% remaining`
    };
  }

  return {
    type: 'first_track',
    title: 'Start your first track',
    progress: 0,
    description: 'Begin your learning journey'
  };
}
```

#### Offline Sync Hook
```typescript
// src/features/ai-tutor/hooks/useOfflineSync.ts
import { useEffect, useState } from 'react';
import { useLearningStore } from '../stores/learningStore';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<string[]>([]);
  const syncWithServer = useLearningStore(state => state.syncWithServer);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      if (pendingSync.length > 0) {
        syncWithServer();
        setPendingSync([]);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingSync, syncWithServer]);

  const queueForSync = (dataType: string) => {
    if (!isOnline) {
      setPendingSync(prev => [...new Set([...prev, dataType])]);
    }
  };

  return {
    isOnline,
    pendingSync: pendingSync.length,
    queueForSync,
    forcSync: syncWithServer
  };
}
```

## Testing Strategy

### Learning Store Testing
```typescript
// src/features/ai-tutor/stores/__tests__/learningStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLearningStore } from '../learningStore';

describe('Learning Store', () => {
  beforeEach(() => {
    // Reset store state
    const store = useLearningStore.getState();
    // Reset all arrays and objects
    store.setTracks([]);
    store.setCurrentTrack(null);
    // Clear persisted data for clean tests
    localStorage.clear();
  });

  describe('Track Enrollment', () => {
    it('should enroll user in a track', () => {
      const { result } = renderHook(() => useLearningStore());
      
      const mockTrack = {
        id: 'track-1',
        title: 'React Basics',
        description: 'Learn React',
        category: 'Frontend',
        difficulty: 'Beginner' as const,
        estimatedHours: 10,
        skills: ['React', 'JavaScript'],
        lessons: [],
        prerequisites: [],
        rating: 4.5,
        enrolledCount: 100
      };

      act(() => {
        result.current.setTracks([mockTrack]);
        result.current.enrollInTrack('track-1');
      });

      expect(result.current.enrolledTracks).toHaveLength(1);
      expect(result.current.enrolledTracks[0].trackId).toBe('track-1');
      expect(result.current.enrolledTracks[0].status).toBe('active');
      expect(result.current.trackProgress['track-1']).toBe(0);
    });

    it('should not allow duplicate enrollment', () => {
      const { result } = renderHook(() => useLearningStore());
      
      const mockTrack = {
        id: 'track-1',
        title: 'React Basics',
        description: 'Learn React',
        category: 'Frontend',
        difficulty: 'Beginner' as const,
        estimatedHours: 10,
        skills: ['React'],
        lessons: [],
        prerequisites: [],
        rating: 4.5,
        enrolledCount: 100
      };

      act(() => {
        result.current.setTracks([mockTrack]);
        result.current.enrollInTrack('track-1');
        result.current.enrollInTrack('track-1'); // Duplicate
      });

      expect(result.current.enrolledTracks).toHaveLength(1);
    });

    it('should unenroll from track and clean up data', () => {
      const { result } = renderHook(() => useLearningStore());
      
      const mockTrack = {
        id: 'track-1',
        title: 'React Basics',
        description: 'Learn React',
        category: 'Frontend',
        difficulty: 'Beginner' as const,
        estimatedHours: 10,
        skills: ['React'],
        lessons: [{ id: 'lesson-1', title: 'Intro', description: '', type: 'video' as const, estimatedMinutes: 30, content: {}, prerequisites: [], learningObjectives: [] }],
        prerequisites: [],
        rating: 4.5,
        enrolledCount: 100
      };

      act(() => {
        result.current.setTracks([mockTrack]);
        result.current.enrollInTrack('track-1');
        result.current.updateLessonProgress('track-1', 'lesson-1', { progress: 50 });
        result.current.unenrollFromTrack('track-1');
      });

      expect(result.current.enrolledTracks).toHaveLength(0);
      expect(result.current.trackProgress['track-1']).toBeUndefined();
      expect(result.current.lessonProgress['track-1-lesson-1']).toBeUndefined();
    });
  });

  describe('Progress Tracking', () => {
    it('should update lesson progress and recalculate track progress', () => {
      const { result } = renderHook(() => useLearningStore());
      
      const mockTrack = {
        id: 'track-1',
        title: 'React Basics',
        description: 'Learn React',
        category: 'Frontend',
        difficulty: 'Beginner' as const,
        estimatedHours: 10,
        skills: ['React'],
        lessons: [
          { id: 'lesson-1', title: 'Intro', description: '', type: 'video' as const, estimatedMinutes: 30, content: {}, prerequisites: [], learningObjectives: [] },
          { id: 'lesson-2', title: 'Components', description: '', type: 'interactive' as const, estimatedMinutes: 45, content: {}, prerequisites: [], learningObjectives: [] }
        ],
        prerequisites: [],
        rating: 4.5,
        enrolledCount: 100
      };

      act(() => {
        result.current.setTracks([mockTrack]);
        result.current.enrollInTrack('track-1');
        
        // Update progress for both lessons
        result.current.updateLessonProgress('track-1', 'lesson-1', { 
          progress: 100, 
          timeSpent: 30 
        });
        result.current.updateLessonProgress('track-1', 'lesson-2', { 
          progress: 50, 
          timeSpent: 20 
        });
      });

      // Check lesson progress
      expect(result.current.getLessonProgress('track-1', 'lesson-1')?.progress).toBe(100);
      expect(result.current.getLessonProgress('track-1', 'lesson-2')?.progress).toBe(50);
      
      // Check track progress (average of lessons)
      expect(result.current.getTrackProgress('track-1')).toBe(75); // (100 + 50) / 2
      
      // Check learning stats update
      expect(result.current.learningStats.totalTimeSpent).toBe(50); // 30 + 20
    });

    it('should complete lesson and update stats', () => {
      const { result } = renderHook(() => useLearningStore());
      
      const mockTrack = {
        id: 'track-1',
        title: 'React Basics',
        description: 'Learn React',
        category: 'Frontend',
        difficulty: 'Beginner' as const,
        estimatedHours: 10,
        skills: ['React'],
        lessons: [
          { id: 'lesson-1', title: 'Intro', description: '', type: 'video' as const, estimatedMinutes: 30, content: {}, prerequisites: [], learningObjectives: [] }
        ],
        prerequisites: [],
        rating: 4.5,
        enrolledCount: 100
      };

      const initialLessonsCompleted = result.current.learningStats.lessonsCompleted;

      act(() => {
        result.current.setTracks([mockTrack]);
        result.current.enrollInTrack('track-1');
        result.current.completeLesson('track-1', 'lesson-1', { timeSpent: 35 });
      });

      const lessonProgress = result.current.getLessonProgress('track-1', 'lesson-1');
      expect(lessonProgress?.progress).toBe(100);
      expect(lessonProgress?.completedAt).toBeDefined();
      expect(result.current.learningStats.lessonsCompleted).toBe(initialLessonsCompleted + 1);
      expect(result.current.getTrackProgress('track-1')).toBe(100);
    });

    it('should track completed lessons correctly', () => {
      const { result } = renderHook(() => useLearningStore());
      
      const mockTrack = {
        id: 'track-1',
        title: 'React Basics',
        description: 'Learn React',
        category: 'Frontend',
        difficulty: 'Beginner' as const,
        estimatedHours: 10,
        skills: ['React'],
        lessons: [
          { id: 'lesson-1', title: 'Intro', description: '', type: 'video' as const, estimatedMinutes: 30, content: {}, prerequisites: [], learningObjectives: [] },
          { id: 'lesson-2', title: 'Components', description: '', type: 'interactive' as const, estimatedMinutes: 45, content: {}, prerequisites: [], learningObjectives: [] },
          { id: 'lesson-3', title: 'State', description: '', type: 'quiz' as const, estimatedMinutes: 20, content: {}, prerequisites: [], learningObjectives: [] }
        ],
        prerequisites: [],
        rating: 4.5,
        enrolledCount: 100
      };

      act(() => {
        result.current.setTracks([mockTrack]);
        result.current.enrollInTrack('track-1');
        
        // Complete first two lessons
        result.current.completeLesson('track-1', 'lesson-1');
        result.current.completeLesson('track-1', 'lesson-2');
      });

      const completedLessons = result.current.getCompletedLessons('track-1');
      expect(completedLessons).toEqual(['lesson-1', 'lesson-2']);
      expect(completedLessons).not.toContain('lesson-3');
    });
  });

  describe('Bookmarks and Notes', () => {
    it('should bookmark and unbookmark lessons', () => {
      const { result } = renderHook(() => useLearningStore());
      
      const mockTrack = {
        id: 'track-1',
        title: 'React Basics',
        description: 'Learn React',
        category: 'Frontend',
        difficulty: 'Beginner' as const,
        estimatedHours: 10,
        skills: ['React'],
        lessons: [
          { id: 'lesson-1', title: 'Intro', description: '', type: 'video' as const, estimatedMinutes: 30, content: {}, prerequisites: [], learningObjectives: [] }
        ],
        prerequisites: [],
        rating: 4.5,
        enrolledCount: 100
      };

      act(() => {
        result.current.setTracks([mockTrack]);
        result.current.bookmarkLesson('track-1', 'lesson-1', true);
      });

      expect(result.current.getLessonProgress('track-1', 'lesson-1')?.bookmarked).toBe(true);
      
      const bookmarkedLessons = result.current.getBookmarkedLessons();
      expect(bookmarkedLessons).toHaveLength(1);
      expect(bookmarkedLessons[0].lessonId).toBe('lesson-1');

      act(() => {
        result.current.bookmarkLesson('track-1', 'lesson-1', false);
      });

      expect(result.current.getLessonProgress('track-1', 'lesson-1')?.bookmarked).toBe(false);
      expect(result.current.getBookmarkedLessons()).toHaveLength(0);
    });

    it('should add and update lesson notes', () => {
      const { result } = renderHook(() => useLearningStore());
      
      act(() => {
        result.current.updateLessonProgress('track-1', 'lesson-1', { progress: 50 });
        result.current.addLessonNote('track-1', 'lesson-1', 'Important concept about hooks');
      });

      expect(result.current.getLessonProgress('track-1', 'lesson-1')?.notes).toBe('Important concept about hooks');
    });
  });

  describe('Recommendations', () => {
    it('should recommend tracks based on preferences', () => {
      const { result } = renderHook(() => useLearningStore());
      
      const mockTracks = [
        {
          id: 'track-1',
          title: 'Beginner React',
          description: 'Easy React',
          category: 'Frontend',
          difficulty: 'Beginner' as const,
          estimatedHours: 5,
          skills: ['React'],
          lessons: [],
          prerequisites: [],
          rating: 4.8,
          enrolledCount: 200
        },
        {
          id: 'track-2',
          title: 'Advanced React',
          description: 'Hard React',
          category: 'Frontend',
          difficulty: 'Advanced' as const,
          estimatedHours: 15,
          skills: ['React'],
          lessons: [],
          prerequisites: [],
          rating: 4.5,
          enrolledCount: 50
        },
        {
          id: 'track-3',
          title: 'Python Basics',
          description: 'Learn Python',
          category: 'Backend',
          difficulty: 'Beginner' as const,
          estimatedHours: 8,
          skills: ['Python'],
          lessons: [],
          prerequisites: [],
          rating: 4.7,
          enrolledCount: 150
        }
      ];

      act(() => {
        result.current.setTracks(mockTracks);
        result.current.updateLearningPreferences({ 
          difficultyPreference: 'gradual' 
        });
      });

      const recommendations = result.current.getRecommendedTracks();
      
      // Should only recommend Beginner tracks, sorted by rating
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].title).toBe('Beginner React'); // Higher rating
      expect(recommendations[1].title).toBe('Python Basics');
      expect(recommendations.every(track => track.difficulty === 'Beginner')).toBe(true);
    });
  });

  describe('Persistence', () => {
    it('should persist and restore learning data', () => {
      const { result: result1 } = renderHook(() => useLearningStore());
      
      // Add some data
      act(() => {
        result1.current.enrollInTrack('track-1');
        result1.current.updateLessonProgress('track-1', 'lesson-1', { progress: 75 });
      });

      // Create new hook instance (simulating app restart)
      const { result: result2 } = renderHook(() => useLearningStore());
      
      // Data should be restored from persistence
      expect(result2.current.enrolledTracks).toHaveLength(1);
      expect(result2.current.enrolledTracks[0].trackId).toBe('track-1');
      expect(result2.current.getLessonProgress('track-1', 'lesson-1')?.progress).toBe(75);
    });
  });
});
```

### Learning Analytics Testing
```typescript
// src/features/ai-tutor/hooks/__tests__/useLearningAnalytics.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLearningAnalytics } from '../useLearningAnalytics';
import { useLearningStore } from '../../stores/learningStore';

describe('useLearningAnalytics', () => {
  beforeEach(() => {
    const store = useLearningStore.getState();
    store.setTracks([]);
    localStorage.clear();
  });

  it('should calculate weekly progress stats', () => {
    const { result: storeResult } = renderHook(() => useLearningStore());
    
    // Add recent progress data
    act(() => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      storeResult.current.updateLessonProgress('track-1', 'lesson-1', {
        progress: 100,
        timeSpent: 45,
        lastAccessedAt: threeDaysAgo.toISOString(),
        completedAt: threeDaysAgo.toISOString()
      });
      
      storeResult.current.updateLessonProgress('track-1', 'lesson-2', {
        progress: 50,
        timeSpent: 30,
        lastAccessedAt: now.toISOString()
      });
    });

    const { result: analyticsResult } = renderHook(() => useLearningAnalytics());
    
    expect(analyticsResult.current.weeklyStats.timeSpent).toBe(75); // 45 + 30
    expect(analyticsResult.current.weeklyStats.lessonsCompleted).toBe(1);
    expect(analyticsResult.current.weeklyStats.avgSessionTime).toBe(37.5); // 75 / 2
  });

  it('should provide learning velocity insights', () => {
    const { result: storeResult } = renderHook(() => useLearningStore());
    
    act(() => {
      // Complete multiple lessons this week
      for (let i = 1; i <= 3; i++) {
        storeResult.current.updateLessonProgress('track-1', `lesson-${i}`, {
          progress: 100,
          timeSpent: 30,
          lastAccessedAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        });
      }
    });

    const { result: analyticsResult } = renderHook(() => useLearningAnalytics());
    
    expect(analyticsResult.current.learningVelocity.completionRate).toBe(30); // 90 timeSpent / 3 lessons
    expect(analyticsResult.current.learningVelocity.projection).toBe(12); // 3 * 4 weeks
  });

  it('should identify preferred learning patterns', () => {
    const { result: storeResult } = renderHook(() => useLearningStore());
    
    act(() => {
      // Create progress entries at specific times (e.g., 9 AM)
      const morningTime = new Date();
      morningTime.setHours(9, 0, 0, 0);
      
      storeResult.current.updateLessonProgress('track-1', 'lesson-1', {
        progress: 50,
        timeSpent: 30,
        lastAccessedAt: morningTime.toISOString()
      });
      
      storeResult.current.updateLessonProgress('track-1', 'lesson-2', {
        progress: 75,
        timeSpent: 45,
        lastAccessedAt: morningTime.toISOString()
      });
    });

    const { result: analyticsResult } = renderHook(() => useLearningAnalytics());
    
    expect(analyticsResult.current.learningPatterns.preferredHour).toBe(9);
  });

  it('should track skill progression', () => {
    const { result: storeResult } = renderHook(() => useLearningStore());
    
    const mockTrack = {
      id: 'track-1',
      title: 'React Basics',
      description: 'Learn React',
      category: 'Frontend',
      difficulty: 'Beginner' as const,
      estimatedHours: 10,
      skills: ['React', 'JavaScript', 'HTML'],
      lessons: [],
      prerequisites: [],
      rating: 4.5,
      enrolledCount: 100
    };

    act(() => {
      storeResult.current.setTracks([mockTrack]);
      storeResult.current.enrollInTrack('track-1');
    });

    const { result: analyticsResult } = renderHook(() => useLearningAnalytics());
    
    expect(analyticsResult.current.skillProgression.totalSkills).toBe(3);
    expect(analyticsResult.current.skillProgression.inProgressSkills).toEqual(['React', 'JavaScript', 'HTML']);
  });

  it('should provide personalized recommendations', () => {
    const { result: storeResult } = renderHook(() => useLearningStore());
    
    act(() => {
      // Simulate some learning activity
      storeResult.current.updateLessonProgress('track-1', 'lesson-1', {
        progress: 100,
        timeSpent: 60,
        lastAccessedAt: new Date().toISOString()
      });
    });

    const { result: analyticsResult } = renderHook(() => useLearningAnalytics());
    
    expect(analyticsResult.current.recommendations.suggestedStudyTime).toBeGreaterThan(0);
    expect(analyticsResult.current.recommendations.nextMilestone).toBeDefined();
  });
});
```

## Files to Create

### Store Files
- `src/features/ai-tutor/stores/learningStore.ts`
- `src/features/ai-tutor/types/learning.ts`

### Hook Files
- `src/features/ai-tutor/hooks/useLearningAnalytics.ts`
- `src/features/ai-tutor/hooks/useOfflineSync.ts`
- `src/features/ai-tutor/hooks/useLearningRecommendations.ts`

### Test Files
- `src/features/ai-tutor/stores/__tests__/learningStore.test.ts`
- `src/features/ai-tutor/hooks/__tests__/useLearningAnalytics.test.ts`
- `src/features/ai-tutor/hooks/__tests__/useOfflineSync.test.ts`

### Utility Files
- `src/features/ai-tutor/utils/learning-calculations.ts`
- `src/features/ai-tutor/utils/achievement-engine.ts`

## Files to Modify

### Component Integration
- Update learning components to use new store
- Remove local state management from components
- Connect components to appropriate store selectors

### Remove Hardcoded Data
- Replace hardcoded track data with store data
- Update mock data to work with store structure

## Dependencies
**Blocks**: TASK-011 (Custom hooks), TASK-015 (Performance optimization)  
**Blocked By**: TASK-008 (Server Components), TASK-004 (Zustand setup)  
**Related**: TASK-009 (Chat store), TASK-012 (Server Actions)

## Definition of Done

### Technical Checklist
- [ ] Learning store implemented with comprehensive functionality
- [ ] Progress tracking working accurately across all components
- [ ] Offline sync capabilities functional
- [ ] Learning analytics providing meaningful insights
- [ ] Achievement system operational
- [ ] Persistence working correctly for all learning data

### Quality Checklist
- [ ] >80% test coverage for learning store and hooks
- [ ] Performance benchmarks met for large data sets
- [ ] Data integrity maintained across all operations
- [ ] Offline/online sync working reliably
- [ ] Analytics calculations accurate and performant

### User Experience Checklist
- [ ] Progress tracking feels instant and accurate
- [ ] Recommendations are relevant and helpful
- [ ] Offline learning works seamlessly
- [ ] Achievement notifications are engaging
- [ ] Learning insights provide value to users

## Estimated Timeline
- **Core Store Implementation**: 8 hours
- **Progress Tracking Logic**: 6 hours
- **Analytics and Insights**: 6 hours
- **Offline Sync Implementation**: 4 hours
- **Testing (Unit + Integration)**: 8 hours
- **Component Integration**: 4 hours

**Total**: ~36 hours (4 story points)

## Success Metrics
- **State Consistency**: 100% data integrity across components
- **Performance**: Store operations <5ms for typical data sets
- **Analytics Accuracy**: Insights match actual user behavior
- **Offline Reliability**: >95% sync success rate
- **User Engagement**: Increased learning session duration

## Risk Mitigation
- **Data Complexity**: Comprehensive testing of state calculations
- **Performance**: Optimize selectors and memoization
- **Sync Conflicts**: Robust conflict resolution strategies
- **Migration**: Careful data migration from existing patterns

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Upon completion of Server Components task