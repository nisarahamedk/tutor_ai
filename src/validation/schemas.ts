import { z } from 'zod';

// Base schemas
export const MessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  timestamp: z.string().datetime(),
});

export const TabTypeSchema = z.enum(['home', 'progress', 'review', 'explore']);

// Chat schemas
export const SendMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  tabType: TabTypeSchema,
  timestamp: z.string().datetime(),
});

export const SendMessageResponseSchema = MessageSchema;

// Learning Track schemas
export const LearningTrackSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedTime: z.number().positive(),
  prerequisites: z.array(z.string().uuid()),
  skills: z.array(z.string()),
  category: z.string(),
  isActive: z.boolean(),
});

export const TrackEnrollmentSchema = z.object({
  trackId: z.string().uuid(),
  userPreferences: z.object({
    pace: z.enum(['slow', 'medium', 'fast']),
    focusAreas: z.array(z.string()),
    availableTime: z.number().positive(),
  }),
});

export const TrackEnrollmentResponseSchema = z.object({
  success: z.boolean(),
  enrollmentId: z.string().uuid(),
  trackId: z.string().uuid(),
  startDate: z.string().datetime(),
  estimatedCompletion: z.string().datetime(),
});

// Progress schemas
export const ProgressUpdateSchema = z.object({
  trackId: z.string().uuid(),
  lessonId: z.string().uuid(),
  progressPercentage: z.number().min(0).max(100),
  timeSpent: z.number().nonnegative(),
  isCompleted: z.boolean(),
  notes: z.string().optional(),
});

export const ProgressResponseSchema = z.object({
  success: z.boolean(),
  trackId: z.string().uuid(),
  lessonId: z.string().uuid(),
  currentProgress: z.number().min(0).max(100),
  totalTimeSpent: z.number().nonnegative(),
  completedLessons: z.array(z.string().uuid()),
  updatedAt: z.string().datetime(),
});

// Assessment schemas
export const AssessmentQuestionSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(1),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'code']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  skill: z.string(),
});

export const AssessmentSubmissionSchema = z.object({
  assessmentId: z.string().uuid(),
  answers: z.array(z.object({
    questionId: z.string().uuid(),
    answer: z.string(),
    timeSpent: z.number().nonnegative(),
  })),
  totalTimeSpent: z.number().nonnegative(),
});

export const AssessmentResultSchema = z.object({
  success: z.boolean(),
  assessmentId: z.string().uuid(),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  feedback: z.array(z.object({
    questionId: z.string().uuid(),
    isCorrect: z.boolean(),
    explanation: z.string(),
    suggestion: z.string().optional(),
  })),
  skillsAssessed: z.array(z.object({
    skill: z.string(),
    proficiency: z.enum(['novice', 'beginner', 'intermediate', 'advanced', 'expert']),
    score: z.number().min(0).max(100),
  })),
  recommendedActions: z.array(z.string()),
  completedAt: z.string().datetime(),
});

// User Preferences schemas
export const UserPreferencesSchema = z.object({
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'reading']),
  pace: z.enum(['slow', 'medium', 'fast']),
  focusAreas: z.array(z.string()),
  availableTime: z.number().positive(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    reminders: z.boolean(),
  }),
  accessibility: z.object({
    fontSize: z.enum(['small', 'medium', 'large']),
    highContrast: z.boolean(),
    screenReader: z.boolean(),
    reducedMotion: z.boolean(),
  }),
});

export const UpdatePreferencesSchema = z.object({
  preferences: UserPreferencesSchema,
});

export const UpdatePreferencesResponseSchema = z.object({
  success: z.boolean(),
  preferences: UserPreferencesSchema,
  updatedAt: z.string().datetime(),
});

// Error schemas
export const ApiErrorSchema = z.object({
  error: z.string(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
  code: z.string().optional(),
});

// Action State schemas
export const BaseActionStateSchema = z.object({
  success: z.boolean(),
  error: z.string().nullable(),
  isLoading: z.boolean(),
});

export const MessageActionStateSchema = BaseActionStateSchema.extend({
  message: MessageSchema.nullable(),
});

export const TrackActionStateSchema = BaseActionStateSchema.extend({
  track: LearningTrackSchema.nullable(),
  enrollment: TrackEnrollmentResponseSchema.nullable(),
});

export const ProgressActionStateSchema = BaseActionStateSchema.extend({
  progress: ProgressResponseSchema.nullable(),
});

export const AssessmentActionStateSchema = BaseActionStateSchema.extend({
  result: AssessmentResultSchema.nullable(),
});

export const PreferencesActionStateSchema = BaseActionStateSchema.extend({
  preferences: UserPreferencesSchema.nullable(),
});

// Type exports
export type Message = z.infer<typeof MessageSchema>;
export type TabType = z.infer<typeof TabTypeSchema>;
export type SendMessageRequest = z.infer<typeof SendMessageSchema>;
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;
export type LearningTrack = z.infer<typeof LearningTrackSchema>;
export type TrackEnrollment = z.infer<typeof TrackEnrollmentSchema>;
export type TrackEnrollmentResponse = z.infer<typeof TrackEnrollmentResponseSchema>;
export type ProgressUpdate = z.infer<typeof ProgressUpdateSchema>;
export type ProgressResponse = z.infer<typeof ProgressResponseSchema>;
export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;
export type AssessmentSubmission = z.infer<typeof AssessmentSubmissionSchema>;
export type AssessmentResult = z.infer<typeof AssessmentResultSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type UpdatePreferences = z.infer<typeof UpdatePreferencesSchema>;
export type UpdatePreferencesResponse = z.infer<typeof UpdatePreferencesResponseSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type MessageActionState = z.infer<typeof MessageActionStateSchema>;
export type TrackActionState = z.infer<typeof TrackActionStateSchema>;
export type ProgressActionState = z.infer<typeof ProgressActionStateSchema>;
export type AssessmentActionState = z.infer<typeof AssessmentActionStateSchema>;
export type PreferencesActionState = z.infer<typeof PreferencesActionStateSchema>;