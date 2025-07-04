// src/features/ai-tutor/stores/learningStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { 
  LearningState, 
  LearningTrack, 
  LearningSession, 
  ProgressData, 
  SkillAssessment, 
  Flashcard 
} from '../types';

// Mock data for initial state
const getInitialTracks = (): LearningTrack[] => [
  {
    id: 'react-basics',
    title: 'React Fundamentals',
    description: 'Learn the basics of React including components, props, and state management.',
    progress: 25,
    difficulty: 'Beginner',
    estimatedHours: 8,
    skills: ['JavaScript', 'React', 'JSX', 'Components'],
    duration: '2 weeks'
  },
  {
    id: 'typescript-intro',
    title: 'TypeScript Introduction',
    description: 'Get started with TypeScript and learn how to add type safety to your JavaScript projects.',
    progress: 0,
    difficulty: 'Beginner',
    estimatedHours: 6,
    skills: ['TypeScript', 'Type Safety', 'JavaScript'],
    duration: '1 week'
  },
  {
    id: 'advanced-react',
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts including hooks, context, and performance optimization.',
    progress: 0,
    difficulty: 'Advanced',
    estimatedHours: 12,
    skills: ['React Hooks', 'Context API', 'Performance', 'Testing'],
    duration: '3 weeks'
  }
];

const getInitialFlashcards = (): Flashcard[] => [
  {
    id: 'react-component-1',
    question: 'What is a React component?',
    answer: 'A React component is a reusable piece of UI that can accept props and return JSX.',
    track: 'react-basics',
    difficulty: 'Easy',
    category: 'Components',
    tags: ['react', 'components', 'basics'],
    reviewCount: 0,
    successRate: 0
  },
  {
    id: 'typescript-type-1',
    question: 'What is the difference between `interface` and `type` in TypeScript?',
    answer: 'Both can define object shapes, but interfaces can be extended and merged, while types are more flexible for unions and primitives.',
    track: 'typescript-intro',
    difficulty: 'Medium',
    category: 'Types',
    tags: ['typescript', 'interface', 'type'],
    reviewCount: 0,
    successRate: 0
  }
];

// Store implementation
export const useLearningStore = create<LearningState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        tracks: getInitialTracks(),
        currentTrack: null,
        currentSession: null,
        progress: {},
        assessments: [],
        flashcards: getInitialFlashcards(),
        isLoading: false,
        error: null,

        // Actions
        setTracks: (tracks: LearningTrack[]) =>
          set({ tracks }, false, 'setTracks'),

        addTrack: (track: LearningTrack) =>
          set(
            (state) => ({
              tracks: [...state.tracks, track]
            }),
            false,
            `addTrack/${track.id}`
          ),

        updateTrack: (trackId: string, updates: Partial<LearningTrack>) =>
          set(
            (state) => ({
              tracks: state.tracks.map(track =>
                track.id === trackId ? { ...track, ...updates } : track
              )
            }),
            false,
            `updateTrack/${trackId}`
          ),

        setCurrentTrack: (track: LearningTrack | null) =>
          set({ currentTrack: track }, false, `setCurrentTrack/${track?.id || 'null'}`),

        startSession: (trackId: string) => {
          const track = get().getTrackById(trackId);
          if (track) {
            const session: LearningSession = {
              id: `session-${Date.now()}`,
              trackId,
              startTime: new Date().toISOString(),
              progress: track.progress,
              completed: false
            };
            set({ currentSession: session }, false, `startSession/${trackId}`);
          }
        },

        endSession: () => {
          const session = get().currentSession;
          if (session) {
            
            // Update progress for the track
            const progressUpdate: ProgressData = {
              trackId: session.trackId,
              lessonId: session.id,
              completion: session.progress,
              timeSpent: Date.now() - new Date(session.startTime).getTime(),
              lastAccessed: new Date().toISOString()
            };
            
            set(
              (state) => ({
                currentSession: null,
                progress: {
                  ...state.progress,
                  [session.trackId]: progressUpdate
                }
              }),
              false,
              `endSession/${session.trackId}`
            );
          }
        },

        updateProgress: (trackId: string, progress: Partial<ProgressData>) =>
          set(
            (state) => ({
              progress: {
                ...state.progress,
                [trackId]: {
                  ...state.progress[trackId],
                  ...progress,
                  trackId // Ensure trackId is always present
                } as ProgressData
              }
            }),
            false,
            `updateProgress/${trackId}`
          ),

        addAssessment: (assessment: SkillAssessment) =>
          set(
            (state) => ({
              assessments: [...state.assessments, assessment]
            }),
            false,
            `addAssessment/${assessment.id}`
          ),

        updateAssessment: (assessmentId: string, updates: Partial<SkillAssessment>) =>
          set(
            (state) => ({
              assessments: state.assessments.map(assessment =>
                assessment.id === assessmentId ? { ...assessment, ...updates } : assessment
              )
            }),
            false,
            `updateAssessment/${assessmentId}`
          ),

        addFlashcard: (flashcard: Flashcard) =>
          set(
            (state) => ({
              flashcards: [...state.flashcards, flashcard]
            }),
            false,
            `addFlashcard/${flashcard.id}`
          ),

        updateFlashcard: (flashcardId: string, updates: Partial<Flashcard>) =>
          set(
            (state) => ({
              flashcards: state.flashcards.map(flashcard =>
                flashcard.id === flashcardId ? { ...flashcard, ...updates } : flashcard
              )
            }),
            false,
            `updateFlashcard/${flashcardId}`
          ),

        setLoading: (loading: boolean) =>
          set({ isLoading: loading }, false, `setLoading/${loading}`),

        setError: (error: string | null) =>
          set({ error }, false, `setError/${error}`),

        // Selectors
        getTrackById: (trackId: string) => 
          get().tracks.find(track => track.id === trackId),

        getProgressByTrack: (trackId: string) => 
          get().progress[trackId],

        getCompletedTracks: () => 
          get().tracks.filter(track => track.progress >= 100),

        getInProgressTracks: () => 
          get().tracks.filter(track => track.progress > 0 && track.progress < 100),

        getFlashcardsByTrack: (trackId: string) => 
          get().flashcards.filter(flashcard => flashcard.track === trackId),

        getAssessmentsByDifficulty: (difficulty: string) => 
          get().assessments.filter(assessment => assessment.difficulty === difficulty)
      }),
      {
        name: 'ai-tutor-learning-store',
        storage: createJSONStorage(() => localStorage),
        // Persist all state except loading and error states
        partialize: (state) => ({
          tracks: state.tracks,
          currentTrack: state.currentTrack,
          progress: state.progress,
          assessments: state.assessments,
          flashcards: state.flashcards
        }),
        version: 1,
        migrate: (persistedState: unknown, version: number) => {
          if (version === 0) {
            const state = persistedState as Record<string, unknown>;
            return {
              ...state,
              tracks: state.tracks || getInitialTracks(),
              flashcards: state.flashcards || getInitialFlashcards()
            };
          }
          return persistedState;
        }
      }
    ),
    {
      name: 'ai-tutor-learning-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Selectors for better performance
export const useLearningSelectors = {
  // Get all tracks
  useTracks: () => useLearningStore(state => state.tracks),
  
  // Get current track
  useCurrentTrack: () => useLearningStore(state => state.currentTrack),
  
  // Get current session
  useCurrentSession: () => useLearningStore(state => state.currentSession),
  
  // Get tracks by difficulty
  useTracksByDifficulty: (difficulty: LearningTrack['difficulty']) => 
    useLearningStore(state => state.tracks.filter(track => track.difficulty === difficulty)),
  
  // Get in-progress tracks
  useInProgressTracks: () => 
    useLearningStore(state => state.tracks.filter(track => track.progress > 0 && track.progress < 100)),
  
  // Get completed tracks
  useCompletedTracks: () => 
    useLearningStore(state => state.tracks.filter(track => track.progress >= 100)),
  
  // Get track progress
  useTrackProgress: (trackId: string) => 
    useLearningStore(state => state.progress[trackId]),
  
  // Get flashcards for a track
  useTrackFlashcards: (trackId: string) => 
    useLearningStore(state => state.flashcards.filter(card => card.track === trackId)),
  
  // Get loading state
  useIsLoading: () => useLearningStore(state => state.isLoading),
  
  // Get error state
  useError: () => useLearningStore(state => state.error)
};

// Action hooks
export const useLearningActions = () => {
  const store = useLearningStore();
  
  return {
    setTracks: store.setTracks,
    addTrack: store.addTrack,
    updateTrack: store.updateTrack,
    setCurrentTrack: store.setCurrentTrack,
    startSession: store.startSession,
    endSession: store.endSession,
    updateProgress: store.updateProgress,
    addAssessment: store.addAssessment,
    updateAssessment: store.updateAssessment,
    addFlashcard: store.addFlashcard,
    updateFlashcard: store.updateFlashcard,
    setLoading: store.setLoading,
    setError: store.setError,
    
    // Convenience methods
    completeTrack: (trackId: string) => {
      store.updateTrack(trackId, { progress: 100 });
      store.updateProgress(trackId, {
        completion: 100,
        lastAccessed: new Date().toISOString()
      });
    },
    
    incrementTrackProgress: (trackId: string, increment: number = 10) => {
      const track = store.getTrackById(trackId);
      if (track) {
        const newProgress = Math.min(track.progress + increment, 100);
        store.updateTrack(trackId, { progress: newProgress });
        store.updateProgress(trackId, {
          completion: newProgress,
          lastAccessed: new Date().toISOString()
        });
      }
    },
    
    reviewFlashcard: (flashcardId: string, success: boolean) => {
      const flashcard = store.flashcards.find(card => card.id === flashcardId);
      if (flashcard) {
        const newReviewCount = flashcard.reviewCount + 1;
        const newSuccessRate = success 
          ? ((flashcard.successRate * flashcard.reviewCount) + 1) / newReviewCount
          : (flashcard.successRate * flashcard.reviewCount) / newReviewCount;
        
        store.updateFlashcard(flashcardId, {
          reviewCount: newReviewCount,
          successRate: newSuccessRate,
          lastReviewed: new Date().toISOString()
        });
      }
    }
  };
};