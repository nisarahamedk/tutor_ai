'use server';

import { revalidatePath } from 'next/cache';
import { apiClient } from '../lib/api';
import { validateFormData, validateResponse, createValidationError } from '../validation';
import {
  ProgressUpdateSchema,
  ProgressResponseSchema,
  ProgressActionState,
  type ProgressUpdate,
  type ProgressResponse,
} from '../validation/schemas';

// Common API response types
interface ApiErrorResponse extends Error {
  status?: number;
}


/**
 * Update learning progress for a lesson
 */
export async function updateProgressAction(
  prevState: ProgressActionState | null,
  formData: FormData
): Promise<ProgressActionState> {
  try {
    // Validate form data
    const validation = validateFormData(ProgressUpdateSchema, formData);
    
    if (!validation.success) {
      return {
        ...createValidationError(
          validation.error || 'Invalid progress data',
          validation.details
        ),
        progress: null,
      };
    }

    const progressData: ProgressUpdate = validation.data!;

    // Send progress update to Next.js API routes
    const response = await apiClient.post<ProgressResponse>(
      '/learning/progress',
      progressData
    );
    
    // Validate response
    const validatedResponse = validateResponse(ProgressResponseSchema, response);

    // Revalidate relevant pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/progress');
    revalidatePath(`/ai-tutor/tracks/${progressData.trackId}`);

    return {
      success: true,
      error: null,
      isLoading: false,
      progress: validatedResponse,
    };
  } catch (error) {
    console.error('Failed to update progress:', error);
    
    let errorMessage = 'Failed to update progress. Please try again.';
    
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      switch (status) {
        case 400:
          errorMessage = 'Invalid progress data. Please check your input.';
          break;
        case 401:
          errorMessage = 'Please log in to update progress.';
          break;
        case 404:
          errorMessage = 'Track or lesson not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
      }
    }

    return {
      success: false,
      error: errorMessage,
      isLoading: false,
      progress: null,
    };
  }
}

/**
 * Get overall progress summary for a user
 */
export async function getProgressSummaryAction(): Promise<{
  success: boolean;
  summary?: {
    totalTracks: number;
    completedTracks: number;
    totalLessons: number;
    completedLessons: number;
    totalTimeSpent: number;
    averageScore: number;
    streak: number;
    achievements: Array<{
      id: string;
      title: string;
      description: string;
      earnedAt: string;
      icon: string;
    }>;
  };
  error?: string;
}> {
  try {
    const response = await apiClient.get('/learning/progress/summary') as {
      totalTracks: number;
      completedTracks: number;
      totalLessons: number;
      completedLessons: number;
      totalTimeSpent: number;
      averageScore: number;
      streak: number;
      achievements: Array<{
        id: string;
        title: string;
        description: string;
        earnedAt: string;
        icon: string;
      }>;
    };

    return {
      success: true,
      summary: response,
    };
  } catch (error) {
    console.error('Failed to get progress summary:', error);
    
    return {
      success: false,
      error: 'Failed to load progress summary',
    };
  }
}

/**
 * Get detailed progress for a specific track
 */
export async function getTrackProgressAction(
  trackId: string
): Promise<{
  success: boolean;
  progress?: {
    trackId: string;
    enrollmentDate: string;
    lastActivity: string;
    overallProgress: number;
    estimatedCompletion: string;
    lessons: Array<{
      id: string;
      title: string;
      progress: number;
      isCompleted: boolean;
      timeSpent: number;
      lastAccessed: string;
      score?: number;
    }>;
    skillsProgress: Array<{
      skill: string;
      proficiency: string;
      progress: number;
    }>;
  };
  error?: string;
}> {
  try {
    const response = await apiClient.get(`/learning/progress/track/${trackId}`) as {
      trackId: string;
      enrollmentDate: string;
      lastActivity: string;
      overallProgress: number;
      estimatedCompletion: string;
      lessons: Array<{
        id: string;
        title: string;
        progress: number;
        isCompleted: boolean;
        timeSpent: number;
        lastAccessed: string;
        score?: number;
      }>;
      skillsProgress: Array<{
        skill: string;
        proficiency: string;
        progress: number;
      }>;
    };

    return {
      success: true,
      progress: response,
    };
  } catch (error) {
    console.error('Failed to get track progress:', error);
    
    let errorMessage = 'Failed to load track progress';
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      if (status === 404) {
        errorMessage = 'Track not found or not enrolled';
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get learning analytics and insights
 */
export async function getLearningAnalyticsAction(): Promise<{
  success: boolean;
  analytics?: {
    weeklyActivity: Array<{
      date: string;
      timeSpent: number;
      lessonsCompleted: number;
    }>;
    learningPatterns: {
      mostActiveTime: string;
      averageSessionLength: number;
      preferredTopics: string[];
      learningStreak: number;
    };
    performance: {
      averageScore: number;
      improvementRate: number;
      strongestSkills: string[];
      areasForImprovement: string[];
    };
    predictions: {
      nextMilestone: string;
      estimatedCompletionDate: string;
      recommendedStudyTime: number;
    };
  };
  error?: string;
}> {
  try {
    const response = await apiClient.get('/learning/analytics') as {
      weeklyActivity: Array<{
        date: string;
        timeSpent: number;
        lessonsCompleted: number;
      }>;
      learningPatterns: {
        mostActiveTime: string;
        averageSessionLength: number;
        preferredTopics: string[];
        learningStreak: number;
      };
      performance: {
        averageScore: number;
        improvementRate: number;
        strongestSkills: string[];
        areasForImprovement: string[];
      };
      predictions: {
        nextMilestone: string;
        estimatedCompletionDate: string;
        recommendedStudyTime: number;
      };
    };

    return {
      success: true,
      analytics: response,
    };
  } catch (error) {
    console.error('Failed to get learning analytics:', error);
    
    return {
      success: false,
      error: 'Failed to load learning analytics',
    };
  }
}

/**
 * Reset progress for a specific track (admin/debug feature)
 */
export async function resetTrackProgressAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const trackId = formData.get('trackId')?.toString();
    const confirmReset = formData.get('confirm')?.toString() === 'true';
    
    if (!trackId) {
      return {
        success: false,
        error: 'Track ID is required',
      };
    }

    if (!confirmReset) {
      return {
        success: false,
        error: 'Reset confirmation is required',
      };
    }

    await apiClient.delete(`/learning/progress/track/${trackId}/reset`);

    // Revalidate relevant pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/progress');
    revalidatePath(`/ai-tutor/tracks/${trackId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to reset track progress:', error);
    
    return {
      success: false,
      error: 'Failed to reset track progress',
    };
  }
}

/**
 * Export progress data as JSON
 */
export async function exportProgressAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const format = formData.get('format')?.toString() || 'json';
    const trackId = formData.get('trackId')?.toString();
    
    const url = trackId 
      ? `/learning/progress/export?format=${format}&trackId=${trackId}`
      : `/learning/progress/export?format=${format}`;

    const response = await apiClient.get<string>(url);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Failed to export progress:', error);
    
    return {
      success: false,
      error: 'Failed to export progress data',
    };
  }
}

/**
 * Update time spent on a lesson (for analytics)
 */
export async function updateTimeSpentAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const trackId = formData.get('trackId')?.toString();
    const lessonId = formData.get('lessonId')?.toString();
    const timeSpent = parseInt(formData.get('timeSpent')?.toString() || '0');
    
    if (!trackId || !lessonId || timeSpent <= 0) {
      return {
        success: false,
        error: 'Invalid time tracking data',
      };
    }

    await apiClient.post('/learning/progress/time', {
      trackId,
      lessonId,
      timeSpent,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to update time spent:', error);
    
    return {
      success: false,
      error: 'Failed to update time tracking',
    };
  }
}