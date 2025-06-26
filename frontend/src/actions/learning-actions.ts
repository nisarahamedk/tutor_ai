'use server';

import { revalidatePath } from 'next/cache';
import { apiClient } from '../lib/api';
import { validateFormData, validateResponse, createValidationError } from '../validation';
import {
  TrackEnrollmentSchema,
  TrackEnrollmentResponseSchema,
  LearningTrackSchema,
  TrackActionState,
  type TrackEnrollment,
  type TrackEnrollmentResponse,
  type LearningTrack,
} from '../validation/schemas';

// Common API response types
interface ApiErrorResponse extends Error {
  status?: number;
}

interface BasicApiResponse {
  [key: string]: unknown;
}

/**
 * Get all available learning tracks
 */
export async function getLearningTracksAction(): Promise<{
  success: boolean;
  tracks: LearningTrack[];
  error?: string;
}> {
  try {
    const response = await apiClient.get<LearningTrack[]>('/learning/tracks');
    
    // Validate each track in the response
    const validatedTracks = response.map(track => 
      validateResponse(LearningTrackSchema, track)
    );

    return {
      success: true,
      tracks: validatedTracks,
    };
  } catch (error) {
    console.error('Failed to get learning tracks:', error);
    
    return {
      success: false,
      tracks: [],
      error: 'Failed to load learning tracks',
    };
  }
}

/**
 * Get a specific learning track by ID
 */
export async function getLearningTrackAction(
  trackId: string
): Promise<{
  success: boolean;
  track?: LearningTrack;
  error?: string;
}> {
  try {
    const response = await apiClient.get<LearningTrack>(`/learning/tracks/${trackId}`);
    const validatedTrack = validateResponse(LearningTrackSchema, response);

    return {
      success: true,
      track: validatedTrack,
    };
  } catch (error) {
    console.error('Failed to get learning track:', error);
    
    let errorMessage = 'Failed to load learning track';
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      if (status === 404) {
        errorMessage = 'Learning track not found';
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Enroll in a learning track
 */
export async function enrollInTrackAction(
  prevState: TrackActionState | null,
  formData: FormData
): Promise<TrackActionState> {
  try {
    // Validate form data
    const validation = validateFormData(TrackEnrollmentSchema, formData);
    
    if (!validation.success) {
      return {
        ...createValidationError(
          validation.error || 'Invalid enrollment data',
          validation.details
        ),
        track: null,
        enrollment: null,
      };
    }

    const enrollmentData: TrackEnrollment = validation.data!;

    // Send enrollment request to FastAPI backend
    const response = await apiClient.post<TrackEnrollmentResponse>(
      '/learning/enroll',
      enrollmentData
    );
    
    // Validate response
    const validatedResponse = validateResponse(TrackEnrollmentResponseSchema, response);

    // Get the enrolled track details
    const trackResponse = await getLearningTrackAction(enrollmentData.trackId);

    // Revalidate relevant pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/tracks');
    revalidatePath('/ai-tutor/progress');
    revalidatePath(`/ai-tutor/tracks/${enrollmentData.trackId}`);

    return {
      success: true,
      error: null,
      isLoading: false,
      track: trackResponse.track || null,
      enrollment: validatedResponse,
    };
  } catch (error) {
    console.error('Failed to enroll in track:', error);
    
    let errorMessage = 'Failed to enroll in track. Please try again.';
    
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      switch (status) {
        case 400:
          errorMessage = 'Invalid enrollment data. Please check your preferences.';
          break;
        case 401:
          errorMessage = 'Please log in to enroll in tracks.';
          break;
        case 404:
          errorMessage = 'Learning track not found.';
          break;
        case 409:
          errorMessage = 'You are already enrolled in this track.';
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
      track: null,
      enrollment: null,
    };
  }
}

/**
 * Unenroll from a learning track
 */
export async function unenrollFromTrackAction(
  prevState: unknown,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const trackId = formData.get('trackId')?.toString();
    
    if (!trackId) {
      return {
        success: false,
        error: 'Track ID is required',
      };
    }

    await apiClient.delete(`/learning/enroll/${trackId}`);

    // Revalidate relevant pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/tracks');
    revalidatePath('/ai-tutor/progress');
    revalidatePath(`/ai-tutor/tracks/${trackId}`);

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to unenroll from track:', error);
    
    let errorMessage = 'Failed to unenroll from track';
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      if (status === 404) {
        errorMessage = 'Enrollment not found';
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get user's enrolled tracks
 */
export async function getEnrolledTracksAction(): Promise<{
  success: boolean;
  enrollments: Array<{
    track: LearningTrack;
    enrollment: TrackEnrollmentResponse;
    progress: {
      completedLessons: number;
      totalLessons: number;
      progressPercentage: number;
    };
  }>;
  error?: string;
}> {
  try {
    const response = await apiClient.get<BasicApiResponse[]>('/learning/enrollments');
    
    // Validate each enrollment in the response
    const validatedEnrollments = response.map(item => ({
      track: validateResponse(LearningTrackSchema, item.track),
      enrollment: validateResponse(TrackEnrollmentResponseSchema, item.enrollment),
      progress: item.progress as {
        completedLessons: number;
        totalLessons: number;
        progressPercentage: number;
      },
    }));

    return {
      success: true,
      enrollments: validatedEnrollments,
    };
  } catch (error) {
    console.error('Failed to get enrolled tracks:', error);
    
    return {
      success: false,
      enrollments: [],
      error: 'Failed to load enrolled tracks',
    };
  }
}

/**
 * Search learning tracks by query
 */
export async function searchTracksAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  tracks: LearningTrack[];
  error?: string;
}> {
  try {
    const query = formData.get('query')?.toString();
    const category = formData.get('category')?.toString();
    const difficulty = formData.get('difficulty')?.toString();
    
    if (!query || query.trim().length === 0) {
      return {
        success: false,
        tracks: [],
        error: 'Search query is required',
      };
    }

    const searchParams = new URLSearchParams({
      q: query.trim(),
      ...(category && { category }),
      ...(difficulty && { difficulty }),
    });

    const response = await apiClient.get<LearningTrack[]>(`/learning/search?${searchParams}`);
    
    // Validate each track in the response
    const validatedTracks = response.map(track => 
      validateResponse(LearningTrackSchema, track)
    );

    return {
      success: true,
      tracks: validatedTracks,
    };
  } catch (error) {
    console.error('Failed to search tracks:', error);
    
    return {
      success: false,
      tracks: [],
      error: 'Failed to search tracks',
    };
  }
}

/**
 * Get recommended tracks based on user preferences and progress
 */
export async function getRecommendedTracksAction(): Promise<{
  success: boolean;
  tracks: LearningTrack[];
  error?: string;
}> {
  try {
    const response = await apiClient.get<LearningTrack[]>('/learning/recommendations');
    
    // Validate each track in the response
    const validatedTracks = response.map(track => 
      validateResponse(LearningTrackSchema, track)
    );

    return {
      success: true,
      tracks: validatedTracks,
    };
  } catch (error) {
    console.error('Failed to get recommended tracks:', error);
    
    return {
      success: false,
      tracks: [],
      error: 'Failed to load recommendations',
    };
  }
}