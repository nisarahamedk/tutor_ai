'use server';

import { revalidatePath } from 'next/cache';
import { apiClient } from '../lib/api';

// Common API response types
interface ApiErrorResponse extends Error {
  status?: number;
}

interface BasicApiResponse {
  [key: string]: unknown;
}
import { validateFormData, validateResponse, createValidationError } from '../validation';
import {
  AssessmentSubmissionSchema,
  AssessmentResultSchema,
  AssessmentQuestionSchema,
  AssessmentActionState,
  type AssessmentSubmission,
  type AssessmentResult,
  type AssessmentQuestion,
} from '../validation/schemas';

/**
 * Get assessment questions for a specific track or skill
 */
export async function getAssessmentAction(
  assessmentId: string
): Promise<{
  success: boolean;
  assessment?: {
    id: string;
    title: string;
    description: string;
    timeLimit: number;
    questions: AssessmentQuestion[];
    passingScore: number;
    maxRetries: number;
  };
  error?: string;
}> {
  try {
    interface AssessmentResponse {
      id: string;
      title: string;
      description: string;
      timeLimit: number;
      questions: unknown[];
      passingScore: number;
      maxRetries: number;
    }
    const response = await apiClient.get(`/assessments/${assessmentId}`) as AssessmentResponse;
    
    // Validate questions in the response
    const validatedQuestions = response.questions.map((question: unknown) => 
      validateResponse(AssessmentQuestionSchema, question)
    );

    return {
      success: true,
      assessment: {
        id: response.id,
        title: response.title,
        description: response.description,
        timeLimit: response.timeLimit,
        questions: validatedQuestions,
        passingScore: response.passingScore,
        maxRetries: response.maxRetries,
      },
    };
  } catch (error) {
    console.error('Failed to get assessment:', error);
    
    let errorMessage = 'Failed to load assessment';
    if (error instanceof Error && 'status' in error) {
      const status = (error as Error & { status?: number }).status;
      if (status === 404) {
        errorMessage = 'Assessment not found';
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Submit assessment answers
 */
export async function submitAssessmentAction(
  prevState: AssessmentActionState | null,
  formData: FormData
): Promise<AssessmentActionState> {
  try {
    // Validate form data
    const validation = validateFormData(AssessmentSubmissionSchema, formData);
    
    if (!validation.success) {
      return {
        ...createValidationError(
          validation.error || 'Invalid assessment submission',
          validation.details
        ),
        result: null,
      };
    }

    const submissionData: AssessmentSubmission = validation.data!;

    // Submit assessment to FastAPI backend
    const response = await apiClient.post<AssessmentResult>(
      '/assessments/submit',
      submissionData
    );
    
    // Validate response
    const validatedResponse = validateResponse(AssessmentResultSchema, response);

    // Revalidate relevant pages
    revalidatePath('/ai-tutor');
    revalidatePath('/ai-tutor/progress');
    revalidatePath(`/ai-tutor/assessment/${submissionData.assessmentId}`);

    return {
      success: true,
      error: null,
      isLoading: false,
      result: validatedResponse,
    };
  } catch (error) {
    console.error('Failed to submit assessment:', error);
    
    let errorMessage = 'Failed to submit assessment. Please try again.';
    
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      switch (status) {
        case 400:
          errorMessage = 'Invalid assessment answers. Please check your responses.';
          break;
        case 401:
          errorMessage = 'Please log in to submit assessments.';
          break;
        case 404:
          errorMessage = 'Assessment not found.';
          break;
        case 409:
          errorMessage = 'Assessment has already been completed.';
          break;
        case 422:
          errorMessage = 'Assessment time limit exceeded.';
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
      result: null,
    };
  }
}

/**
 * Get assessment results and history
 */
export async function getAssessmentResultsAction(
  assessmentId?: string
): Promise<{
  success: boolean;
  results: Array<{
    assessment: {
      id: string;
      title: string;
      trackId?: string;
    };
    result: AssessmentResult;
    rank?: {
      percentile: number;
      totalParticipants: number;
    };
  }>;
  error?: string;
}> {
  try {
    const url = assessmentId 
      ? `/assessments/results/${assessmentId}` 
      : '/assessments/results';
    
    const response = await apiClient.get(url) as BasicApiResponse;

    // Validate results
    const validatedResults = Array.isArray(response) 
      ? response.map(item => ({
          ...item,
          result: validateResponse(AssessmentResultSchema, item.result),
        }))
      : [{
          assessment: response.assessment,
          result: validateResponse(AssessmentResultSchema, response.result),
          rank: response.rank,
        }];

    return {
      success: true,
      results: validatedResults,
    };
  } catch (error) {
    console.error('Failed to get assessment results:', error);
    
    return {
      success: false,
      results: [],
      error: 'Failed to load assessment results',
    };
  }
}

/**
 * Start a new assessment attempt
 */
export async function startAssessmentAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  sessionId?: string;
  startTime?: string;
  error?: string;
}> {
  try {
    const assessmentId = formData.get('assessmentId')?.toString();
    
    if (!assessmentId) {
      return {
        success: false,
        error: 'Assessment ID is required',
      };
    }

    const response = await apiClient.post(`/assessments/${assessmentId}/start`, {
      startTime: new Date().toISOString(),
    }) as BasicApiResponse;

    return {
      success: true,
      sessionId: response.sessionId as string,
      startTime: response.startTime as string,
    };
  } catch (error) {
    console.error('Failed to start assessment:', error);
    
    let errorMessage = 'Failed to start assessment';
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      switch (status) {
        case 404:
          errorMessage = 'Assessment not found';
          break;
        case 409:
          errorMessage = 'Assessment is already in progress';
          break;
        case 423:
          errorMessage = 'Maximum retries exceeded';
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
 * Get available assessments for a user
 */
export async function getAvailableAssessmentsAction(): Promise<{
  success: boolean;
  assessments: Array<{
    id: string;
    title: string;
    description: string;
    difficulty: string;
    estimatedTime: number;
    prerequisites: string[];
    isCompleted: boolean;
    bestScore?: number;
    attemptsUsed: number;
    maxAttempts: number;
    trackId?: string;
  }>;
  error?: string;
}> {
  try {
    const response = await apiClient.get('/assessments/available') as Array<{
      id: string;
      title: string;
      description: string;
      difficulty: string;
      estimatedTime: number;
      prerequisites: string[];
      isCompleted: boolean;
      bestScore?: number;
      attemptsUsed: number;
      maxAttempts: number;
      trackId?: string;
    }>;

    return {
      success: true,
      assessments: response,
    };
  } catch (error) {
    console.error('Failed to get available assessments:', error);
    
    return {
      success: false,
      assessments: [],
      error: 'Failed to load available assessments',
    };
  }
}

/**
 * Generate personalized assessment based on learning progress
 */
export async function generatePersonalizedAssessmentAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  assessmentId?: string;
  error?: string;
}> {
  try {
    const trackId = formData.get('trackId')?.toString();
    const difficulty = formData.get('difficulty')?.toString();
    const focusAreas = formData.getAll('focusAreas[]').map(area => area.toString());
    
    const response = await apiClient.post('/assessments/generate', {
      trackId,
      difficulty,
      focusAreas,
      generatedAt: new Date().toISOString(),
    }) as BasicApiResponse;

    return {
      success: true,
      assessmentId: response.assessmentId as string,
    };
  } catch (error) {
    console.error('Failed to generate personalized assessment:', error);
    
    return {
      success: false,
      error: 'Failed to generate personalized assessment',
    };
  }
}

/**
 * Get skill proficiency based on assessment results
 */
export async function getSkillProficiencyAction(): Promise<{
  success: boolean;
  proficiency: Array<{
    skill: string;
    level: string;
    score: number;
    assessments: number;
    lastAssessed: string;
    trend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
  }>;
  error?: string;
}> {
  try {
    const response = await apiClient.get('/assessments/proficiency') as Array<{
      skill: string;
      level: string;
      score: number;
      assessments: number;
      lastAssessed: string;
      trend: 'improving' | 'stable' | 'declining';
      recommendations: string[];
    }>;

    return {
      success: true,
      proficiency: response,
    };
  } catch (error) {
    console.error('Failed to get skill proficiency:', error);
    
    return {
      success: false,
      proficiency: [],
      error: 'Failed to load skill proficiency',
    };
  }
}

/**
 * Retake an assessment
 */
export async function retakeAssessmentAction(
  prevState: unknown,
  formData: FormData
): Promise<{
  success: boolean;
  canRetake?: boolean;
  retakesRemaining?: number;
  error?: string;
}> {
  try {
    const assessmentId = formData.get('assessmentId')?.toString();
    
    if (!assessmentId) {
      return {
        success: false,
        error: 'Assessment ID is required',
      };
    }

    const response = await apiClient.post(`/assessments/${assessmentId}/retake`, {}) as BasicApiResponse;

    // Revalidate assessment page
    revalidatePath(`/ai-tutor/assessment/${assessmentId}`);

    return {
      success: true,
      canRetake: response.canRetake as boolean,
      retakesRemaining: response.retakesRemaining as number,
    };
  } catch (error) {
    console.error('Failed to retake assessment:', error);
    
    let errorMessage = 'Failed to retake assessment';
    if (error instanceof Error && 'status' in error) {
      const status = (error as ApiErrorResponse).status;
      switch (status) {
        case 404:
          errorMessage = 'Assessment not found';
          break;
        case 423:
          errorMessage = 'Maximum retries exceeded';
          break;
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}