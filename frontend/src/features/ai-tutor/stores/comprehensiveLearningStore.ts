// src/features/ai-tutor/stores/comprehensiveLearningStore.ts
// Comprehensive Learning Store Implementation (TASK-010)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  ComprehensiveLearningState,
  LearningTrack,
  TrackProgress,
  LessonProgress,
  AssessmentResult,
  AssessmentAnswer,
  LearningPreferences,
  Achievement,
  LearningGoal,
  OfflineAction,
  SyncStatus,
  LearningStats,
  StreakInfo,
  WeeklyProgress,
  LearningRecommendation,
  SkillProgression,
  LearningAnalytics
} from '../types/learning';

import {
  computeLearningStats,
  calculateCurrentStreak,
  calculateLongestStreak,
  getStreakInfo,
  calculateWeeklyProgress,
  generateLearningAnalytics
} from '../utils/learningAnalytics';

import {
  checkForNewAchievements,
  createLearningGoal,
  updateGoalProgress,
  calculateTotalPoints
} from '../utils/gamification';

import {
  offlineSyncManager,
  scheduleOfflineAction,
  syncLessonProgress,
  syncTrackEnrollment,
  syncAssessmentResult,
  syncPreferencesUpdate
} from '../utils/offlineSync';

// Initial data
const getInitialTracks = (): LearningTrack[] => [
  {
    id: 'react-fundamentals',
    title: 'React Fundamentals',
    description: 'Master the core concepts of React including components, props, state, and hooks.',
    difficulty: 'beginner',
    estimatedHours: 12,
    skills: ['JavaScript', 'React', 'JSX', 'Components', 'Props', 'State'],
    category: 'Frontend Development',
    tags: ['react', 'frontend', 'javascript', 'web'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z',
    published: true,
    lessons: [
      {
        id: 'react-intro',
        trackId: 'react-fundamentals',
        title: 'Introduction to React',
        description: 'Learn what React is and why it\'s useful',
        content: { type: 'text', data: {} },
        duration: 30,
        difficulty: 'beginner',
        order: 1,
        objectives: ['Understand React basics', 'Set up development environment'],
        resources: []
      }
    ],
    assessments: ['react-fundamentals-quiz']
  },
  {
    id: 'typescript-essentials',
    title: 'TypeScript Essentials',
    description: 'Learn TypeScript fundamentals and how to add type safety to your JavaScript projects.',
    difficulty: 'intermediate',
    estimatedHours: 8,
    skills: ['TypeScript', 'JavaScript', 'Type Safety', 'Interfaces'],
    category: 'Programming Languages',
    tags: ['typescript', 'javascript', 'types', 'programming'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-10T00:00:00.000Z',
    published: true,
    lessons: [],
    assessments: []
  },
  {
    id: 'advanced-react-patterns',
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts including performance optimization, custom hooks, and architectural patterns.',
    difficulty: 'advanced',
    estimatedHours: 16,
    skills: ['React', 'Performance', 'Custom Hooks', 'Architecture', 'Testing'],
    category: 'Frontend Development',
    tags: ['react', 'advanced', 'performance', 'patterns'],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-20T00:00:00.000Z',
    published: true,
    lessons: [],
    assessments: []
  }
];

const getInitialPreferences = (): LearningPreferences => ({
  learningStyle: 'visual',
  difficultyPreference: 'mixed',
  pacePreference: 'normal',
  sessionDuration: 30,
  notificationsEnabled: true,
  reminderFrequency: 'daily',
  preferredLearningTime: ['morning'],
  theme: 'auto',
  autoSave: true,
  skipIntroductions: false
});

const getInitialSyncStatus = (): SyncStatus => ({
  lastSyncTime: null,
  pendingActions: 0,
  isOnline: navigator.onLine,
  isSyncing: false,
  syncErrors: []
});

// Store implementation
export const useComprehensiveLearningStore = create<ComprehensiveLearningState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Core learning data
          tracks: getInitialTracks(),
          enrolledTracks: [],
          currentTrack: null,
          
          // Progress tracking
          progress: {},
          lessonProgress: {},
          assessmentResults: {},
          
          // User data
          learningPreferences: getInitialPreferences(),
          achievements: [],
          learningGoals: [],
          learningStreak: 0,
          totalLearningTime: 0,
          
          // Analytics and insights
          analytics: null,
          stats: null,
          
          // UI state
          selectedTrack: null,
          currentLesson: null,
          isLoading: false,
          error: null,
          
          // Offline support
          offlineActions: [],
          syncStatus: getInitialSyncStatus(),

          // Actions
          enrollInTrack: async (trackId: string) => {
            set({ isLoading: true, error: null });
            
            try {
              const state = get();
              const track = state.tracks.find(t => t.id === trackId);
              
              if (!track) {
                throw new Error('Track not found');
              }
              
              if (state.enrolledTracks.includes(trackId)) {
                throw new Error('Already enrolled in this track');
              }
              
              // Check prerequisites
              if (track.prerequisites) {
                const missingPrereqs = track.prerequisites.filter(prereqId => {
                  const prereqProgress = state.progress[prereqId];
                  return !prereqProgress || prereqProgress.status !== 'completed';
                });
                
                if (missingPrereqs.length > 0) {
                  throw new Error(`Missing prerequisites: ${missingPrereqs.join(', ')}`);
                }
              }
              
              const enrollmentTime = new Date().toISOString();
              const newProgress: TrackProgress = {
                trackId,
                enrolledAt: enrollmentTime,
                lastAccessedAt: enrollmentTime,
                overallProgress: 0,
                completedLessons: [],
                timeSpent: 0,
                status: 'not-started'
              };
              
              set(state => ({
                enrolledTracks: [...state.enrolledTracks, trackId],
                progress: { ...state.progress, [trackId]: newProgress },
                currentTrack: trackId,
                isLoading: false
              }));
              
              // Sync with server
              if (state.syncStatus.isOnline) {
                try {
                  syncTrackEnrollment(trackId);
                } catch (syncError) {
                  console.warn('Failed to sync enrollment:', syncError);
                }
              } else {
                scheduleOfflineAction('ENROLL_IN_TRACK', { trackId });
              }
              
              // Check for new achievements
              const newAchievements = checkForNewAchievements(
                state.achievements,
                { ...state.progress, [trackId]: newProgress },
                state.lessonProgress,
                state.assessmentResults
              );
              
              if (newAchievements.length > 0) {
                set(state => ({
                  achievements: [...state.achievements, ...newAchievements]
                }));
              }
              
            } catch (error) {
              set({ 
                error: error instanceof Error ? error.message : 'Failed to enroll in track',
                isLoading: false 
              });
              throw error;
            }
          },

          unenrollFromTrack: async (trackId: string) => {
            set({ isLoading: true, error: null });
            
            try {
              const state = get();
              
              if (!state.enrolledTracks.includes(trackId)) {
                throw new Error('Not enrolled in this track');
              }
              
              set(state => {
                const newEnrolledTracks = state.enrolledTracks.filter(id => id !== trackId);
                const newProgress = { ...state.progress };
                delete newProgress[trackId];
                
                // Remove lesson progress for this track
                const newLessonProgress = { ...state.lessonProgress };
                Object.keys(newLessonProgress).forEach(lessonId => {
                  if (newLessonProgress[lessonId].trackId === trackId) {
                    delete newLessonProgress[lessonId];
                  }
                });
                
                return {
                  enrolledTracks: newEnrolledTracks,
                  progress: newProgress,
                  lessonProgress: newLessonProgress,
                  currentTrack: state.currentTrack === trackId ? null : state.currentTrack,
                  isLoading: false
                };
              });
              
              // Sync with server
              if (state.syncStatus.isOnline) {
                scheduleOfflineAction('UNENROLL_FROM_TRACK', { trackId });
              } else {
                scheduleOfflineAction('UNENROLL_FROM_TRACK', { trackId });
              }
              
            } catch (error) {
              set({ 
                error: error instanceof Error ? error.message : 'Failed to unenroll from track',
                isLoading: false 
              });
              throw error;
            }
          },

          updateLessonProgress: (trackId: string, lessonId: string, progress: number) => {
            const state = get();
            
            if (!state.enrolledTracks.includes(trackId)) {
              set({ error: 'Not enrolled in this track' });
              return;
            }
            
            const now = new Date().toISOString();
            const existingProgress = state.lessonProgress[lessonId];
            
            const updatedLessonProgress: LessonProgress = {
              ...existingProgress,
              lessonId,
              trackId,
              startedAt: existingProgress?.startedAt || now,
              progress: Math.max(0, Math.min(100, progress)),
              timeSpent: (existingProgress?.timeSpent || 0) + (1000 * 60), // Add 1 minute
              attempts: existingProgress?.attempts || 1,
              scores: existingProgress?.scores || [],
              bookmarks: existingProgress?.bookmarks || []
            };
            
            if (progress === 100 && !existingProgress?.completedAt) {
              updatedLessonProgress.completedAt = now;
            }
            
            // Update track progress
            const trackProgress = state.progress[trackId];
            if (trackProgress) {
              const track = state.tracks.find(t => t.id === trackId);
              const totalLessons = track?.lessons.length || 1;
              const completedLessons = Object.values(state.lessonProgress)
                .filter(lp => lp.trackId === trackId && lp.progress === 100).length;
              
              const overallProgress = Math.round((completedLessons / totalLessons) * 100);
              
              const updatedTrackProgress: TrackProgress = {
                ...trackProgress,
                lastAccessedAt: now,
                overallProgress,
                completedLessons: progress === 100 && !trackProgress.completedLessons.includes(lessonId)
                  ? [...trackProgress.completedLessons, lessonId]
                  : trackProgress.completedLessons,
                timeSpent: trackProgress.timeSpent + (1000 * 60),
                status: overallProgress === 100 ? 'completed' : 'in-progress'
              };
              
              set(state => ({
                lessonProgress: { ...state.lessonProgress, [lessonId]: updatedLessonProgress },
                progress: { ...state.progress, [trackId]: updatedTrackProgress },
                totalLearningTime: state.totalLearningTime + (1000 * 60),
                error: null
              }));
              
              // Update learning streak
              const newStreak = calculateCurrentStreak(
                { ...state.progress, [trackId]: updatedTrackProgress },
                { ...state.lessonProgress, [lessonId]: updatedLessonProgress }
              );
              
              if (newStreak !== state.learningStreak) {
                set(state => ({ learningStreak: newStreak }));
              }
              
              // Sync progress
              if (state.syncStatus.isOnline) {
                syncLessonProgress(trackId, lessonId, progress);
              } else {
                scheduleOfflineAction('UPDATE_LESSON_PROGRESS', {
                  trackId,
                  lessonId,
                  progress,
                  timestamp: now
                });
              }
              
              // Check for achievements
              const newAchievements = checkForNewAchievements(
                state.achievements,
                { ...state.progress, [trackId]: updatedTrackProgress },
                { ...state.lessonProgress, [lessonId]: updatedLessonProgress },
                state.assessmentResults
              );
              
              if (newAchievements.length > 0) {
                set(state => ({
                  achievements: [...state.achievements, ...newAchievements]
                }));
              }
            }
          },

          completeLesson: async (trackId: string, lessonId: string) => {
            const state = get();
            
            try {
              // Update to 100% progress
              get().updateLessonProgress(trackId, lessonId, 100);
              
              // Award completion points
              const lessonProgress = state.lessonProgress[lessonId];
              if (lessonProgress && !lessonProgress.completedAt) {
                // Lesson just completed, could trigger additional logic here
                console.log(`Lesson ${lessonId} completed in track ${trackId}`);
              }
              
            } catch (error) {
              set({ error: error instanceof Error ? error.message : 'Failed to complete lesson' });
              throw error;
            }
          },

          startAssessment: (assessmentId: string) => {
            const state = get();
            const now = new Date().toISOString();
            
            // Find the track for this assessment
            const track = state.tracks.find(track => 
              track.assessments.includes(assessmentId)
            );
            
            if (!track) {
              set({ error: 'Assessment not found' });
              return;
            }
            
            if (!state.enrolledTracks.includes(track.id)) {
              set({ error: 'Must be enrolled in track to take assessment' });
              return;
            }
            
            const existingResult = state.assessmentResults[assessmentId];
            if (existingResult && !existingResult.completedAt) {
              // Assessment already in progress
              return;
            }
            
            const newAssessmentResult: AssessmentResult = {
              assessmentId,
              trackId: track.id,
              startedAt: now,
              score: 0,
              totalQuestions: 0,
              correctAnswers: 0,
              timeSpent: 0,
              answers: [],
              passed: false,
              certificateEligible: false
            };
            
            set(state => ({
              assessmentResults: { ...state.assessmentResults, [assessmentId]: newAssessmentResult },
              error: null
            }));
          },

          submitAssessment: async (assessmentId: string, answers: AssessmentAnswer[]) => {
            set({ isLoading: true, error: null });
            
            try {
              const state = get();
              const existingResult = state.assessmentResults[assessmentId];
              
              if (!existingResult) {
                throw new Error('Assessment not started');
              }
              
              const correctAnswers = answers.filter(answer => answer.isCorrect).length;
              const score = Math.round((correctAnswers / answers.length) * 100);
              const passed = score >= 70; // 70% passing grade
              const now = new Date().toISOString();
              
              const updatedResult: AssessmentResult = {
                ...existingResult,
                completedAt: now,
                score,
                totalQuestions: answers.length,
                correctAnswers,
                timeSpent: Date.now() - new Date(existingResult.startedAt).getTime(),
                answers,
                passed,
                certificateEligible: passed && score >= 80 // 80% for certificate
              };
              
              set(state => ({
                assessmentResults: { ...state.assessmentResults, [assessmentId]: updatedResult },
                isLoading: false
              }));
              
              // Sync with server
              if (state.syncStatus.isOnline) {
                syncAssessmentResult(assessmentId, updatedResult);
              } else {
                scheduleOfflineAction('SUBMIT_ASSESSMENT', {
                  assessmentId,
                  result: updatedResult
                });
              }
              
              // Check for achievements
              const newAchievements = checkForNewAchievements(
                state.achievements,
                state.progress,
                state.lessonProgress,
                { ...state.assessmentResults, [assessmentId]: updatedResult }
              );
              
              if (newAchievements.length > 0) {
                set(state => ({
                  achievements: [...state.achievements, ...newAchievements]
                }));
              }
              
            } catch (error) {
              set({ 
                error: error instanceof Error ? error.message : 'Failed to submit assessment',
                isLoading: false 
              });
              throw error;
            }
          },

          updatePreferences: (preferences: Partial<LearningPreferences>) => {
            const state = get();
            const updatedPreferences = { ...state.learningPreferences, ...preferences };
            
            set({ learningPreferences: updatedPreferences, error: null });
            
            // Sync preferences
            if (state.syncStatus.isOnline) {
              syncPreferencesUpdate(updatedPreferences);
            } else {
              scheduleOfflineAction('UPDATE_PREFERENCES', {
                preferences: updatedPreferences
              });
            }
          },

          addLearningGoal: (goal: Omit<LearningGoal, 'id' | 'current' | 'achieved'>) => {
            const newGoal: LearningGoal = {
              ...goal,
              id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              current: 0,
              achieved: false
            };
            
            set(state => ({
              learningGoals: [...state.learningGoals, newGoal],
              error: null
            }));
          },

          updateLearningGoal: (goalId: string, updates: Partial<LearningGoal>) => {
            set(state => ({
              learningGoals: state.learningGoals.map(goal =>
                goal.id === goalId ? { ...goal, ...updates } : goal
              ),
              error: null
            }));
          },

          syncProgress: async () => {
            const state = get();
            
            if (!state.syncStatus.isOnline) {
              throw new Error('Cannot sync while offline');
            }
            
            set(state => ({
              syncStatus: { ...state.syncStatus, isSyncing: true }
            }));
            
            try {
              await offlineSyncManager.processOfflineActions();
              
              set(state => ({
                syncStatus: {
                  ...state.syncStatus,
                  isSyncing: false,
                  lastSyncTime: new Date().toISOString(),
                  syncErrors: []
                }
              }));
              
            } catch (error) {
              set(state => ({
                syncStatus: {
                  ...state.syncStatus,
                  isSyncing: false,
                  syncErrors: [error instanceof Error ? error.message : 'Sync failed']
                }
              }));
              throw error;
            }
          },

          generateAnalytics: async () => {
            set({ isLoading: true, error: null });
            
            try {
              const state = get();
              
              const analytics = generateLearningAnalytics(
                state.tracks,
                state.progress,
                state.lessonProgress,
                state.assessmentResults,
                state.learningPreferences
              );
              
              const stats = computeLearningStats(
                state.enrolledTracks,
                state.progress,
                state.lessonProgress,
                state.assessmentResults,
                state.achievements
              );
              
              set({
                analytics,
                stats,
                isLoading: false
              });
              
            } catch (error) {
              set({ 
                error: error instanceof Error ? error.message : 'Failed to generate analytics',
                isLoading: false 
              });
              throw error;
            }
          },

          // Selectors
          getTrackProgress: (trackId: string): number => {
            const progress = get().progress[trackId];
            return progress?.overallProgress || 0;
          },

          getRecommendedTracks: (): LearningTrack[] => {
            const state = get();
            
            // Simple recommendation logic based on preferences and progress
            const availableTracks = state.tracks.filter(track => 
              !state.enrolledTracks.includes(track.id) && track.published
            );
            
            const preferredDifficulty = state.learningPreferences.difficultyPreference;
            
            if (preferredDifficulty === 'mixed') {
              return availableTracks.slice(0, 5);
            }
            
            const matchingTracks = availableTracks.filter(track => 
              track.difficulty === preferredDifficulty
            );
            
            return matchingTracks.slice(0, 5);
          },

          getLearningStats: (): LearningStats => {
            const state = get();
            
            if (state.stats) {
              return state.stats;
            }
            
            // Compute stats on demand if not cached
            return computeLearningStats(
              state.enrolledTracks,
              state.progress,
              state.lessonProgress,
              state.assessmentResults,
              state.achievements
            );
          },

          getAchievements: (type?: Achievement['type']): Achievement[] => {
            const achievements = get().achievements;
            
            if (!type) {
              return achievements;
            }
            
            return achievements.filter(achievement => achievement.type === type);
          },

          getStreakInfo: (): StreakInfo => {
            const state = get();
            return getStreakInfo(state.progress, state.lessonProgress);
          },

          getWeeklyProgress: (): WeeklyProgress[] => {
            const state = get();
            return calculateWeeklyProgress(state.progress, state.lessonProgress);
          },

          getSkillProgression: (skill: string): SkillProgression | null => {
            const state = get();
            
            if (!state.analytics) {
              return null;
            }
            
            return state.analytics.skillProgression.find(sp => sp.skill === skill) || null;
          },

          getNextRecommendation: (): LearningRecommendation | null => {
            const state = get();
            
            if (!state.analytics) {
              return null;
            }
            
            const recommendations = state.analytics.recommendations
              .filter(rec => rec.priority === 'high')
              .sort((a, b) => b.confidence - a.confidence);
            
            return recommendations[0] || null;
          },

          // Offline actions
          addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retries'>) => {
            offlineSyncManager.addOfflineAction(action);
            
            set(state => ({
              syncStatus: {
                ...state.syncStatus,
                pendingActions: state.syncStatus.pendingActions + 1
              }
            }));
          },

          processOfflineActions: async () => {
            await offlineSyncManager.processOfflineActions();
          },

          // Performance actions
          clearCache: () => {
            set({
              analytics: null,
              stats: null,
              error: null
            });
          },

          optimizeStorage: () => {
            // Clean up old lesson progress and assessment results
            const state = get();
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - 6); // Keep 6 months of data
            
            const optimizedLessonProgress = Object.fromEntries(
              Object.entries(state.lessonProgress).filter(([, progress]) => {
                const lastActivity = new Date(progress.completedAt || progress.startedAt);
                return lastActivity >= cutoffDate;
              })
            );
            
            const optimizedAssessmentResults = Object.fromEntries(
              Object.entries(state.assessmentResults).filter(([, result]) => {
                const resultDate = new Date(result.completedAt || result.startedAt);
                return resultDate >= cutoffDate;
              })
            );
            
            set({
              lessonProgress: optimizedLessonProgress,
              assessmentResults: optimizedAssessmentResults
            });
          }
        }),
        {
          name: 'comprehensive-learning-store',
          storage: createJSONStorage(() => localStorage),
          partialize: (state) => ({
            // Persist critical data only
            enrolledTracks: state.enrolledTracks,
            progress: state.progress,
            lessonProgress: state.lessonProgress,
            assessmentResults: state.assessmentResults,
            learningPreferences: state.learningPreferences,
            achievements: state.achievements,
            learningGoals: state.learningGoals,
            learningStreak: state.learningStreak,
            totalLearningTime: state.totalLearningTime
          }),
          version: 1,
          migrate: (persistedState: any, version: number) => {
            if (version === 0) {
              // Migrate from v0 to v1
              return {
                ...persistedState,
                learningGoals: persistedState.learningGoals || [],
                syncStatus: getInitialSyncStatus()
              };
            }
            return persistedState;
          }
        }
      )
    ),
    {
      name: 'comprehensive-learning-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Setup online/offline listeners
if (typeof window !== 'undefined') {
  const updateOnlineStatus = () => {
    useComprehensiveLearningStore.setState(state => ({
      syncStatus: {
        ...state.syncStatus,
        isOnline: navigator.onLine
      }
    }));
    
    if (navigator.onLine) {
      // Auto-sync when coming back online
      const state = useComprehensiveLearningStore.getState();
      if (state.syncStatus.pendingActions > 0) {
        state.processOfflineActions().catch(console.error);
      }
    }
  };
  
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
}

// Auto-update learning goals when progress changes
useComprehensiveLearningStore.subscribe(
  (state) => ({
    progress: state.progress,
    lessonProgress: state.lessonProgress,
    assessmentResults: state.assessmentResults
  }),
  ({ progress, lessonProgress, assessmentResults }) => {
    const state = useComprehensiveLearningStore.getState();
    
    const updatedGoals = state.learningGoals.map(goal =>
      updateGoalProgress(goal, progress, lessonProgress, assessmentResults)
    );
    
    const hasChanges = updatedGoals.some((goal, index) => 
      goal.current !== state.learningGoals[index].current ||
      goal.achieved !== state.learningGoals[index].achieved
    );
    
    if (hasChanges) {
      useComprehensiveLearningStore.setState({ learningGoals: updatedGoals });
    }
  },
  { equalityFn: (a, b) => 
    JSON.stringify(a) === JSON.stringify(b)
  }
);

export default useComprehensiveLearningStore;