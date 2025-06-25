// src/features/ai-tutor/types/learning.ts
// Comprehensive types for Learning Progress Store (TASK-010)

export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  skills: string[];
  prerequisites?: string[];
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  published: boolean;
  lessons: Lesson[];
  assessments: string[];
}

export interface Lesson {
  id: string;
  trackId: string;
  title: string;
  description: string;
  content: LessonContent;
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  prerequisites?: string[];
  objectives: string[];
  resources: LessonResource[];
}

export interface LessonContent {
  type: 'text' | 'video' | 'interactive' | 'quiz' | 'code';
  data: Record<string, any>;
}

export interface LessonResource {
  type: 'link' | 'file' | 'reference';
  title: string;
  url: string;
  description?: string;
}

export interface TrackProgress {
  trackId: string;
  enrolledAt: string;
  lastAccessedAt: string;
  overallProgress: number; // 0-100
  completedLessons: string[];
  currentLessonId?: string;
  timeSpent: number; // milliseconds
  status: 'not-started' | 'in-progress' | 'completed' | 'paused';
  certificateEarned?: boolean;
}

export interface LessonProgress {
  lessonId: string;
  trackId: string;
  startedAt: string;
  completedAt?: string;
  progress: number; // 0-100
  timeSpent: number; // milliseconds
  attempts: number;
  scores: number[];
  lastAttemptScore?: number;
  notes?: string;
  bookmarks: string[];
}

export interface AssessmentResult {
  assessmentId: string;
  trackId: string;
  lessonId?: string;
  startedAt: string;
  completedAt?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  answers: AssessmentAnswer[];
  passed: boolean;
  certificateEligible: boolean;
  feedback?: string;
}

export interface AssessmentAnswer {
  questionId: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
  explanation?: string;
}

export interface LearningPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  pacePreference: 'slow' | 'normal' | 'fast';
  sessionDuration: number; // preferred minutes per session
  notificationsEnabled: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'never';
  preferredLearningTime: string[]; // ['morning', 'afternoon', 'evening']
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  skipIntroductions: boolean;
}

export interface Achievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  trackId?: string;
  criteria: AchievementCriteria;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export type AchievementType = 
  | 'streak' 
  | 'completion' 
  | 'speed' 
  | 'accuracy' 
  | 'dedication' 
  | 'explorer' 
  | 'social' 
  | 'milestone';

export interface AchievementCriteria {
  type: string;
  value: number;
  comparison: 'equal' | 'greater' | 'less' | 'greater-equal' | 'less-equal';
}

export interface LearningStats {
  totalTracksEnrolled: number;
  totalTracksCompleted: number;
  totalLessonsCompleted: number;
  totalTimeSpent: number; // milliseconds
  averageScore: number;
  currentStreak: number;
  longestStreak: number;
  totalAchievements: number;
  learningVelocity: number; // lessons per week
  strongestSkills: string[];
  improvementAreas: string[];
  weeklyProgress: WeeklyProgress[];
  monthlyGoal?: LearningGoal;
  completionRate: number; // percentage
}

export interface WeeklyProgress {
  week: string; // ISO week string
  lessonsCompleted: number;
  timeSpent: number;
  averageScore: number;
  tracksStarted: number;
  tracksCompleted: number;
}

export interface LearningGoal {
  id: string;
  type: 'lessons' | 'tracks' | 'time' | 'score';
  target: number;
  current: number;
  deadline: string;
  description: string;
  achieved: boolean;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastActiveDate: string;
  daysThisWeek: number;
  weeklyTarget: number;
  isOnTrack: boolean;
}

export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: string;
  synced: boolean;
  retries: number;
}

export interface SyncStatus {
  lastSyncTime: string | null;
  pendingActions: number;
  isOnline: boolean;
  isSyncing: boolean;
  syncErrors: string[];
}

export interface LearningAnalytics {
  learningPatterns: LearningPattern[];
  difficultyAnalysis: DifficultyAnalysis;
  timeAnalysis: TimeAnalysis;
  skillProgression: SkillProgression[];
  recommendations: LearningRecommendation[];
}

export interface LearningPattern {
  pattern: string;
  frequency: number;
  confidence: number;
  description: string;
  recommendations: string[];
}

export interface DifficultyAnalysis {
  preferredDifficulty: 'beginner' | 'intermediate' | 'advanced';
  completionRateByDifficulty: Record<string, number>;
  timeSpentByDifficulty: Record<string, number>;
  recommendedProgression: string;
}

export interface TimeAnalysis {
  averageSessionLength: number;
  mostProductiveTime: string;
  weeklyDistribution: Record<string, number>;
  optimalSessionLength: number;
  focusScore: number;
}

export interface SkillProgression {
  skill: string;
  currentLevel: number;
  progression: number; // 0-100
  timeToMastery: number; // estimated days
  relatedSkills: string[];
  masteryCriteria: string[];
}

export interface LearningRecommendation {
  id: string;
  type: 'track' | 'lesson' | 'review' | 'practice';
  title: string;
  description: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  targetId: string;
  confidence: number; // 0-1
}

// Store State Interface
export interface ComprehensiveLearningState {
  // Core learning data
  tracks: LearningTrack[];
  enrolledTracks: string[];
  currentTrack: string | null;
  
  // Progress tracking
  progress: Record<string, TrackProgress>;
  lessonProgress: Record<string, LessonProgress>;
  assessmentResults: Record<string, AssessmentResult>;
  
  // User data
  learningPreferences: LearningPreferences;
  achievements: Achievement[];
  learningGoals: LearningGoal[];
  learningStreak: number;
  totalLearningTime: number;
  
  // Analytics and insights
  analytics: LearningAnalytics | null;
  stats: LearningStats | null;
  
  // UI state
  selectedTrack: string | null;
  currentLesson: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Offline support
  offlineActions: OfflineAction[];
  syncStatus: SyncStatus;
  
  // Actions
  enrollInTrack: (trackId: string) => Promise<void>;
  unenrollFromTrack: (trackId: string) => Promise<void>;
  updateLessonProgress: (trackId: string, lessonId: string, progress: number) => void;
  completeLesson: (trackId: string, lessonId: string) => Promise<void>;
  startAssessment: (assessmentId: string) => void;
  submitAssessment: (assessmentId: string, answers: AssessmentAnswer[]) => Promise<void>;
  updatePreferences: (preferences: Partial<LearningPreferences>) => void;
  addLearningGoal: (goal: Omit<LearningGoal, 'id' | 'current' | 'achieved'>) => void;
  updateLearningGoal: (goalId: string, updates: Partial<LearningGoal>) => void;
  syncProgress: () => Promise<void>;
  generateAnalytics: () => Promise<void>;
  
  // Selectors
  getTrackProgress: (trackId: string) => number;
  getRecommendedTracks: () => LearningTrack[];
  getLearningStats: () => LearningStats;
  getAchievements: (type?: AchievementType) => Achievement[];
  getStreakInfo: () => StreakInfo;
  getWeeklyProgress: () => WeeklyProgress[];
  getSkillProgression: (skill: string) => SkillProgression | null;
  getNextRecommendation: () => LearningRecommendation | null;
  
  // Offline actions
  addOfflineAction: (action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retries'>) => void;
  processOfflineActions: () => Promise<void>;
  
  // Performance actions
  clearCache: () => void;
  optimizeStorage: () => void;
}

// Utility Types
export type LearningEventType = 
  | 'track-enrolled'
  | 'lesson-started'
  | 'lesson-completed'
  | 'assessment-started'
  | 'assessment-completed'
  | 'achievement-earned'
  | 'streak-updated'
  | 'goal-achieved';

export interface LearningEvent {
  type: LearningEventType;
  timestamp: string;
  data: Record<string, any>;
}

export type LearningSelector<T> = (state: ComprehensiveLearningState) => T;
export type LearningAction = (state: ComprehensiveLearningState) => ComprehensiveLearningState | void;