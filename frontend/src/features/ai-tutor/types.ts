// src/features/ai-tutor/types.ts
// Base types for AI Tutor feature state management

export type TabType = 'home' | 'progress' | 'review' | 'explore';

export interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: string;
  metadata?: Record<string, unknown>;
  component?: React.ReactNode;
}

// Optimistic message types for TASK-009 integration
export type MessageStatus = 'pending' | 'sent' | 'failed';

export interface OptimisticMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  status: MessageStatus;
  tempId?: string; // Temporary ID for optimistic updates
  error?: string; // Error message if failed
  retrying?: boolean; // If message is being retried
  component?: React.ReactNode;
  metadata?: Record<string, unknown>;
}

export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  progress: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  skills: string[];
  icon?: React.ReactNode;
  duration?: string;
}

export interface ProgressData {
  trackId: string;
  lessonId: string;
  completion: number;
  timeSpent: number;
  lastAccessed: string;
  achievements?: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic';
  autoSave: boolean;
  soundEnabled: boolean;
}

export interface SkillAssessment {
  id: string;
  title: string;
  description: string;
  questions: AssessmentQuestion[];
  timeLimit: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
}

export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'code';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  track: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category?: string;
  tags?: string[];
  lastReviewed?: string;
  reviewCount: number;
  successRate: number;
}

export interface LearningSession {
  id: string;
  trackId: string;
  startTime: string;
  endTime?: string;
  progress: number;
  completed: boolean;
  notes?: string;
  score?: number;
}

// Store state interfaces
export interface ChatState {
  // State
  tabMessages: Record<TabType, Message[]>;
  activeTab: TabType;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  
  // Optimistic state
  optimisticMessages: Record<TabType, OptimisticMessage[]>;
  retryCount: number;
  
  // Actions
  addMessage: (tab: TabType, message: Message) => void;
  removeMessage: (tab: TabType, messageId: string) => void;
  clearMessages: (tab: TabType) => void;
  setActiveTab: (tab: TabType) => void;
  setLoading: (loading: boolean) => void;
  setTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;
  
  // Optimistic actions
  addOptimisticMessage: (tab: TabType, message: OptimisticMessage) => void;
  updateOptimisticMessage: (tab: TabType, tempId: string, updates: Partial<OptimisticMessage>) => void;
  removeOptimisticMessage: (tab: TabType, tempId: string) => void;
  clearOptimisticMessages: (tab: TabType) => void;
  
  // Combined actions (optimistic + regular)
  sendMessageWithOptimistic: (tab: TabType, content: string, component?: React.ReactNode) => Promise<void>;
  retryMessage: (tab: TabType, message: OptimisticMessage) => Promise<void>;
  
  // Selectors
  getTabMessages: (tab: TabType) => Message[];
  getOptimisticMessages: (tab: TabType) => OptimisticMessage[];
  getCombinedMessages: (tab: TabType) => (Message | OptimisticMessage)[];
  hasMessages: (tab: TabType) => boolean;
  getMessageCount: (tab: TabType) => number;
  getLastMessage: (tab: TabType) => Message | null;
  getPendingCount: (tab: TabType) => number;
  getFailedCount: (tab: TabType) => number;
}

export interface LearningState {
  // State
  tracks: LearningTrack[];
  currentTrack: LearningTrack | null;
  currentSession: LearningSession | null;
  progress: Record<string, ProgressData>;
  assessments: SkillAssessment[];
  flashcards: Flashcard[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTracks: (tracks: LearningTrack[]) => void;
  addTrack: (track: LearningTrack) => void;
  updateTrack: (trackId: string, updates: Partial<LearningTrack>) => void;
  setCurrentTrack: (track: LearningTrack | null) => void;
  startSession: (trackId: string) => void;
  endSession: (score?: number, notes?: string) => void;
  updateProgress: (trackId: string, progress: Partial<ProgressData>) => void;
  addAssessment: (assessment: SkillAssessment) => void;
  updateAssessment: (assessmentId: string, updates: Partial<SkillAssessment>) => void;
  addFlashcard: (flashcard: Flashcard) => void;
  updateFlashcard: (flashcardId: string, updates: Partial<Flashcard>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Selectors
  getTrackById: (trackId: string) => LearningTrack | undefined;
  getProgressByTrack: (trackId: string) => ProgressData | undefined;
  getCompletedTracks: () => LearningTrack[];
  getInProgressTracks: () => LearningTrack[];
  getFlashcardsByTrack: (trackId: string) => Flashcard[];
  getAssessmentsByDifficulty: (difficulty: string) => SkillAssessment[];
}

export interface UserState {
  // State
  preferences: UserPreferences;
  profile: {
    name: string;
    email: string;
    avatar?: string;
    joinDate: string;
    level: number;
    experience: number;
  } | null;
  achievements: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  updateProfile: (profile: Partial<UserState['profile']>) => void;
  addAchievement: (achievement: string) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  
  // Selectors
  getPreference: (key: keyof UserPreferences) => unknown;
  hasAchievement: (achievement: string) => boolean;
  getLevel: () => number;
  getExperience: () => number;
}

// Utility types for store creation
export type StateCreator<T> = (
  set: (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean | undefined,
    actionName?: string | undefined
  ) => void,
  get: () => T
) => T;

export type StoreMiddleware<T> = (
  f: StateCreator<T>
) => StateCreator<T>;