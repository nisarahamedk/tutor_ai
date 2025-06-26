'use server';

import { revalidatePath } from 'next/cache';
import { apiClient } from '../lib/api';
import { validateFormData, validateResponse, createValidationError } from '../validation';
import {
  UpdatePreferencesSchema,
  UpdatePreferencesResponseSchema,
  UserPreferencesSchema,
  PreferencesActionState,
  type UpdatePreferences,
  type UpdatePreferencesResponse,
  type UserPreferences,
} from '../validation/schemas';

// Common API response types
interface ApiErrorResponse extends Error {
  status?: number;
}

interface BasicApiResponse {
  [key: string]: unknown;
}

/**
 * Get user preferences
 */
export async function getUserPreferencesAction(): Promise<{
  success: boolean;
  preferences?: UserPreferences;
  error?: string;
}> {
  try {
    const response = await apiClient.get('/user/preferences') as BasicApiResponse;
    const validatedPreferences = validateResponse(UserPreferencesSchema, response);

    return {
      success: true,
      preferences: validatedPreferences,
    };
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    
    let errorMessage = 'Failed to load preferences';
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      if (status === 404) {
        errorMessage = 'Preferences not found - using defaults';
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferencesAction(
  prevState: PreferencesActionState | null,
  formData: FormData
): Promise<PreferencesActionState> {
  try {
    // Validate form data
    const validation = validateFormData(UpdatePreferencesSchema, formData);
    
    if (!validation.success) {
      return {
        ...createValidationError(
          validation.error || 'Invalid preferences data',
          validation.details
        ),
        preferences: null,
      };
    }

    const preferencesData: UpdatePreferences = validation.data!;

    // Send preferences update to FastAPI backend
    const response = await apiClient.put<UpdatePreferencesResponse>(
      '/user/preferences',
      preferencesData
    );
    
    // Validate response
    const validatedResponse = validateResponse(UpdatePreferencesResponseSchema, response);

    // Revalidate relevant pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/preferences');

    return {
      success: true,
      error: null,
      isLoading: false,
      preferences: validatedResponse.preferences,
    };
  } catch (error) {
    console.error('Failed to update preferences:', error);
    
    let errorMessage = 'Failed to update preferences. Please try again.';
    
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      switch (status) {
        case 400:
          errorMessage = 'Invalid preferences data. Please check your selections.';
          break;
        case 401:
          errorMessage = 'Please log in to update preferences.';
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
      preferences: null,
    };
  }
}

/**
 * Reset preferences to defaults
 */
export async function resetPreferencesAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  preferences?: UserPreferences;
  error?: string;
}> {
  try {
    const confirmReset = formData.get('confirm')?.toString() === 'true';
    
    if (!confirmReset) {
      return {
        success: false,
        error: 'Reset confirmation is required',
      };
    }

    const response = await apiClient.post<UpdatePreferencesResponse>(
      '/user/preferences/reset',
      {}
    );
    
    // Validate response
    const validatedResponse = validateResponse(UpdatePreferencesResponseSchema, response);

    // Revalidate relevant pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/preferences');

    return {
      success: true,
      preferences: validatedResponse.preferences,
    };
  } catch (error) {
    console.error('Failed to reset preferences:', error);
    
    return {
      success: false,
      error: 'Failed to reset preferences',
    };
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferencesAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  notifications?: UserPreferences['notifications'];
  error?: string;
}> {
  try {
    const email = formData.get('email') === 'on';
    const push = formData.get('push') === 'on';
    const reminders = formData.get('reminders') === 'on';

    const notificationData = {
      notifications: { email, push, reminders }
    };

    const response = await apiClient.patch('/user/preferences/notifications', notificationData) as BasicApiResponse;

    // Revalidate relevant pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/preferences');

    return {
      success: true,
      notifications: response.notifications as {
        push: boolean;
        email: boolean;
        reminders: boolean;
      },
    };
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    
    return {
      success: false,
      error: 'Failed to update notification preferences',
    };
  }
}

/**
 * Update accessibility preferences
 */
export async function updateAccessibilityPreferencesAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  accessibility?: UserPreferences['accessibility'];
  error?: string;
}> {
  try {
    const fontSize = formData.get('fontSize')?.toString() as 'small' | 'medium' | 'large';
    const highContrast = formData.get('highContrast') === 'on';
    const screenReader = formData.get('screenReader') === 'on';
    const reducedMotion = formData.get('reducedMotion') === 'on';

    const accessibilityData = {
      accessibility: { fontSize, highContrast, screenReader, reducedMotion }
    };

    const response = await apiClient.patch('/user/preferences/accessibility', accessibilityData) as BasicApiResponse;

    // Revalidate relevant pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/preferences');

    return {
      success: true,
      accessibility: response.accessibility as {
        fontSize: 'small' | 'medium' | 'large';
        highContrast: boolean;
        screenReader: boolean;
        reducedMotion: boolean;
      },
    };
  } catch (error) {
    console.error('Failed to update accessibility preferences:', error);
    
    return {
      success: false,
      error: 'Failed to update accessibility preferences',
    };
  }
}

/**
 * Export user preferences and data
 */
export async function exportUserDataAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    const format = formData.get('format')?.toString() || 'json';
    const includeProgress = formData.get('includeProgress') === 'on';
    const includeAssessments = formData.get('includeAssessments') === 'on';

    const response = await apiClient.get<string>(
      `/user/export?format=${format}&progress=${includeProgress}&assessments=${includeAssessments}`
    );

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Failed to export user data:', error);
    
    return {
      success: false,
      error: 'Failed to export user data',
    };
  }
}

/**
 * Delete user account and all data
 */
export async function deleteUserAccountAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const confirmDelete = formData.get('confirm')?.toString();
    const password = formData.get('password')?.toString();
    
    if (confirmDelete !== 'DELETE') {
      return {
        success: false,
        error: 'Please type "DELETE" to confirm account deletion',
      };
    }

    if (!password) {
      return {
        success: false,
        error: 'Password is required for account deletion',
      };
    }

    await apiClient.delete('/user/account', {
      password,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Failed to delete user account:', error);
    
    let errorMessage = 'Failed to delete account';
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      switch (status) {
        case 401:
          errorMessage = 'Invalid password';
          break;
        case 403:
          errorMessage = 'Account deletion not allowed';
          break;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get user's learning goals and update them
 */
export async function updateLearningGoalsAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  goals?: Array<{
    id: string;
    title: string;
    description: string;
    targetDate: string;
    progress: number;
    isCompleted: boolean;
  }>;
  error?: string;
}> {
  try {
    const goals = [];
    let i = 0;
    
    // Extract goals from form data
    while (formData.has(`goals[${i}].title`)) {
      goals.push({
        id: formData.get(`goals[${i}].id`)?.toString() || '',
        title: formData.get(`goals[${i}].title`)?.toString() || '',
        description: formData.get(`goals[${i}].description`)?.toString() || '',
        targetDate: formData.get(`goals[${i}].targetDate`)?.toString() || '',
      });
      i++;
    }

    const response = await apiClient.put('/user/goals', { goals }) as BasicApiResponse;

    // Revalidate relevant pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/progress');

    return {
      success: true,
      goals: response.goals as Array<{
        id: string;
        title: string;
        description: string;
        targetDate: string;
        progress: number;
        isCompleted: boolean;
      }>,
    };
  } catch (error) {
    console.error('Failed to update learning goals:', error);
    
    return {
      success: false,
      error: 'Failed to update learning goals',
    };
  }
}