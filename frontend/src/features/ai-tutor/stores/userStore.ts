// src/features/ai-tutor/stores/userStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { UserState, UserPreferences } from '../types';

// Default preferences
const getDefaultPreferences = (): UserPreferences => ({
  theme: 'system',
  language: 'en',
  notifications: true,
  learningStyle: 'visual',
  autoSave: true,
  soundEnabled: true
});

// Store implementation
export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        preferences: getDefaultPreferences(),
        profile: null,
        achievements: [],
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        setPreferences: (preferences: Partial<UserPreferences>) =>
          set(
            (state) => ({
              preferences: {
                ...state.preferences,
                ...preferences
              }
            }),
            false,
            'setPreferences'
          ),

        updateProfile: (profileUpdates: Partial<UserState['profile']>) =>
          set(
            (state) => ({
              profile: state.profile 
                ? { ...state.profile, ...profileUpdates }
                : {
                    name: profileUpdates.name || '',
                    email: profileUpdates.email || '',
                    joinDate: new Date().toISOString(),
                    level: 1,
                    experience: 0,
                    ...profileUpdates
                  }
            }),
            false,
            'updateProfile'
          ),

        addAchievement: (achievement: string) =>
          set(
            (state) => ({
              achievements: state.achievements.includes(achievement)
                ? state.achievements
                : [...state.achievements, achievement]
            }),
            false,
            `addAchievement/${achievement}`
          ),

        setAuthenticated: (authenticated: boolean) =>
          set({ isAuthenticated: authenticated }, false, `setAuthenticated/${authenticated}`),

        setLoading: (loading: boolean) =>
          set({ isLoading: loading }, false, `setLoading/${loading}`),

        setError: (error: string | null) =>
          set({ error }, false, `setError/${error}`),

        reset: () =>
          set(
            {
              preferences: getDefaultPreferences(),
              profile: null,
              achievements: [],
              isAuthenticated: false,
              isLoading: false,
              error: null
            },
            false,
            'reset'
          ),

        // Selectors
        getPreference: (key: keyof UserPreferences) => get().preferences[key],
        
        hasAchievement: (achievement: string) => get().achievements.includes(achievement),
        
        getLevel: () => get().profile?.level || 1,
        
        getExperience: () => get().profile?.experience || 0
      }),
      {
        name: 'ai-tutor-user-store',
        storage: createJSONStorage(() => localStorage),
        // Persist all state except loading and error states
        partialize: (state) => ({
          preferences: state.preferences,
          profile: state.profile,
          achievements: state.achievements,
          isAuthenticated: state.isAuthenticated
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            return {
              ...persistedState,
              preferences: {
                ...getDefaultPreferences(),
                ...persistedState.preferences
              }
            };
          }
          return persistedState;
        }
      }
    ),
    {
      name: 'ai-tutor-user-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// Selectors for better performance
export const useUserSelectors = {
  // Get user preferences
  usePreferences: () => useUserStore(state => state.preferences),
  
  // Get specific preference
  usePreference: <K extends keyof UserPreferences>(key: K) => 
    useUserStore(state => state.preferences[key]),
  
  // Get user profile
  useProfile: () => useUserStore(state => state.profile),
  
  // Get achievements
  useAchievements: () => useUserStore(state => state.achievements),
  
  // Get authentication status
  useIsAuthenticated: () => useUserStore(state => state.isAuthenticated),
  
  // Get loading state
  useIsLoading: () => useUserStore(state => state.isLoading),
  
  // Get error state
  useError: () => useUserStore(state => state.error),
  
  // Get user level
  useLevel: () => useUserStore(state => state.profile?.level || 1),
  
  // Get user experience
  useExperience: () => useUserStore(state => state.profile?.experience || 0),
  
  // Check if user has specific achievement
  useHasAchievement: (achievement: string) => 
    useUserStore(state => state.achievements.includes(achievement))
};

// Action hooks
export const useUserActions = () => {
  const store = useUserStore();
  
  return {
    setPreferences: store.setPreferences,
    updateProfile: store.updateProfile,
    addAchievement: store.addAchievement,
    setAuthenticated: store.setAuthenticated,
    setLoading: store.setLoading,
    setError: store.setError,
    reset: store.reset,
    
    // Convenience methods
    updateSinglePreference: <K extends keyof UserPreferences>(
      key: K, 
      value: UserPreferences[K]
    ) => {
      store.setPreferences({ [key]: value } as Partial<UserPreferences>);
    },
    
    addExperience: (points: number) => {
      const currentProfile = store.profile;
      if (currentProfile) {
        const newExperience = currentProfile.experience + points;
        const newLevel = Math.floor(newExperience / 100) + 1; // 100 XP per level
        
        store.updateProfile({
          experience: newExperience,
          level: newLevel
        });
        
        // Add level up achievement if level increased
        if (newLevel > currentProfile.level) {
          store.addAchievement(`level-${newLevel}`);
        }
      }
    },
    
    initializeProfile: (name: string, email: string) => {
      store.updateProfile({
        name,
        email,
        joinDate: new Date().toISOString(),
        level: 1,
        experience: 0
      });
      store.setAuthenticated(true);
      store.addAchievement('welcome');
    },
    
    updateTheme: (theme: UserPreferences['theme']) => {
      store.setPreferences({ theme });
    },
    
    toggleNotifications: () => {
      const currentPrefs = store.preferences;
      store.setPreferences({ notifications: !currentPrefs.notifications });
    },
    
    updateLearningStyle: (learningStyle: UserPreferences['learningStyle']) => {
      store.setPreferences({ learningStyle });
    }
  };
};

// Achievement system helpers
export const ACHIEVEMENTS = {
  WELCOME: 'welcome',
  FIRST_LESSON: 'first-lesson',
  FIRST_TRACK_COMPLETE: 'first-track-complete',
  STREAK_7_DAYS: 'streak-7-days',
  STREAK_30_DAYS: 'streak-30-days',
  FLASHCARD_MASTER: 'flashcard-master',
  ASSESSMENT_ACE: 'assessment-ace',
  LEVEL_5: 'level-5',
  LEVEL_10: 'level-10',
  LEVEL_25: 'level-25',
  EARLY_BIRD: 'early-bird',
  NIGHT_OWL: 'night-owl'
} as const;

export const ACHIEVEMENT_DESCRIPTIONS = {
  [ACHIEVEMENTS.WELCOME]: 'Welcome to AI Tutor!',
  [ACHIEVEMENTS.FIRST_LESSON]: 'Completed your first lesson',
  [ACHIEVEMENTS.FIRST_TRACK_COMPLETE]: 'Completed your first learning track',
  [ACHIEVEMENTS.STREAK_7_DAYS]: '7-day learning streak',
  [ACHIEVEMENTS.STREAK_30_DAYS]: '30-day learning streak',
  [ACHIEVEMENTS.FLASHCARD_MASTER]: 'Reviewed 100 flashcards',
  [ACHIEVEMENTS.ASSESSMENT_ACE]: 'Scored 100% on an assessment',
  [ACHIEVEMENTS.LEVEL_5]: 'Reached level 5',
  [ACHIEVEMENTS.LEVEL_10]: 'Reached level 10',
  [ACHIEVEMENTS.LEVEL_25]: 'Reached level 25',
  [ACHIEVEMENTS.EARLY_BIRD]: 'Studied before 8 AM',
  [ACHIEVEMENTS.NIGHT_OWL]: 'Studied after 10 PM'
} as const;