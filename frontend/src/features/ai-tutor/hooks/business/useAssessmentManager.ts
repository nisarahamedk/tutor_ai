// src/features/ai-tutor/hooks/business/useAssessmentManager.ts
// Assessment Manager Business Logic Hook - Extracts assessment logic from components

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useComprehensiveLearningStore } from '../../stores/comprehensiveLearningStore';
import type { 
  Assessment, 
  AssessmentResult, 
  AssessmentAnswer,
  AssessmentQuestion 
} from '../../types/learning';

/**
 * Assessment answers mapping
 */
export interface AssessmentAnswers {
  [questionId: string]: AssessmentAnswer;
}

/**
 * Interface for the Assessment Manager return value
 */
export interface AssessmentManagerReturn {
  // State
  currentAssessment: Assessment | null;
  questions: AssessmentQuestion[];
  currentQuestionIndex: number;
  answers: AssessmentAnswers;
  
  // Actions
  startAssessment: (assessmentId: string) => Promise<void>;
  answerQuestion: (questionId: string, answer: AssessmentAnswer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitAssessment: () => Promise<AssessmentResult>;
  
  // Business Logic
  calculateScore: () => number;
  getTimeRemaining: () => number;
  canSubmit: () => boolean;
  getRecommendations: () => string[];
  
  // Progress
  getCompletionPercentage: () => number;
  getEstimatedTimeToComplete: () => number;
}

/**
 * Assessment Manager Hook - Handles all assessment-related business logic
 * 
 * Extracts business logic from SkillAssessmentComponent to improve:
 * - Testability: Assessment logic can be tested in isolation
 * - Reusability: Can be used across multiple assessment components
 * - State Management: Complex assessment state in one place
 * - Timer Management: Automatic time tracking and submission
 */
export const useAssessmentManager = (): AssessmentManagerReturn => {
  // Local state for assessment session
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Timer ref for auto-submission
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to store state
  const assessmentResults = useComprehensiveLearningStore(state => state.assessmentResults);
  const tracks = useComprehensiveLearningStore(state => state.tracks);
  const enrolledTracks = useComprehensiveLearningStore(state => state.enrolledTracks);
  
  // Store actions
  const startAssessmentAction = useComprehensiveLearningStore(state => state.startAssessment);
  const submitAssessmentAction = useComprehensiveLearningStore(state => state.submitAssessment);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Auto-submit when time expires
  useEffect(() => {
    if (currentAssessment && startTime) {
      const timeLimit = currentAssessment.timeLimit * 1000; // Convert to ms
      const elapsed = Date.now() - startTime;
      const remaining = timeLimit - elapsed;
      
      if (remaining <= 0) {
        // Time already expired, submit immediately
        handleAutoSubmit();
      } else {
        // Set timer for auto-submission
        timerRef.current = setTimeout(() => {
          handleAutoSubmit();
        }, remaining);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentAssessment, startTime]);

  // Actions

  /**
   * Start an assessment session
   */
  const startAssessment = useCallback(async (assessmentId: string): Promise<void> => {
    try {
      // Find the track for this assessment
      const track = tracks.find(track => 
        track.assessments.includes(assessmentId)
      );
      
      if (!track) {
        throw new Error('Assessment not found');
      }
      
      if (!enrolledTracks.includes(track.id)) {
        throw new Error('Must be enrolled in track to take assessment');
      }

      // Check if assessment is already in progress
      const existingResult = assessmentResults[assessmentId];
      if (existingResult && !existingResult.completedAt) {
        throw new Error('Assessment already in progress');
      }

      // Start assessment in store
      await startAssessmentAction(assessmentId);
      
      // Load assessment data (in real app, this would come from API)
      const mockAssessment: Assessment = {
        id: assessmentId,
        title: 'Mock Assessment',
        description: 'Assessment description',
        questions: generateMockQuestions(assessmentId),
        timeLimit: 1800, // 30 minutes
        difficulty: track.difficulty || 'beginner',
        category: track.category,
        trackId: track.id,
        passingScore: 70,
        maxAttempts: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setCurrentAssessment(mockAssessment);
      setQuestions(mockAssessment.questions);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setStartTime(Date.now());
      
    } catch (error) {
      console.error('Failed to start assessment:', error);
      throw error;
    }
  }, [tracks, enrolledTracks, assessmentResults, startAssessmentAction]);

  /**
   * Answer a question
   */
  const answerQuestion = useCallback((questionId: string, answer: AssessmentAnswer): void => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...answer,
        timeSpent: answer.timeSpent || Date.now() - (startTime || Date.now())
      }
    }));
  }, [startTime]);

  /**
   * Navigate to next question
   */
  const nextQuestion = useCallback((): void => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  /**
   * Navigate to previous question
   */
  const previousQuestion = useCallback((): void => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  /**
   * Submit the assessment
   */
  const submitAssessment = useCallback(async (): Promise<AssessmentResult> => {
    if (!currentAssessment) {
      throw new Error('No assessment in progress');
    }

    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.id]);
    if (unansweredQuestions.length > 0) {
      throw new Error(`Please answer all questions. ${unansweredQuestions.length} questions remaining.`);
    }

    // Convert answers to the format expected by the store
    const assessmentAnswers: AssessmentAnswer[] = questions.map(question => {
      const answer = answers[question.id];
      return {
        ...answer,
        questionId: question.id,
        isCorrect: checkAnswerCorrectness(question, answer.answer)
      };
    });

    try {
      const result = await submitAssessmentAction(currentAssessment.id, assessmentAnswers);
      
      // Clear assessment state
      setCurrentAssessment(null);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setStartTime(null);
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      return result;
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      throw error;
    }
  }, [currentAssessment, questions, answers, submitAssessmentAction]);

  // Business Logic Methods

  /**
   * Calculate current score based on answers
   */
  const calculateScore = useCallback((): number => {
    if (questions.length === 0) return 0;
    
    const correctAnswers = questions.filter(question => {
      const answer = answers[question.id];
      return answer && checkAnswerCorrectness(question, answer.answer);
    }).length;
    
    return Math.round((correctAnswers / questions.length) * 100);
  }, [questions, answers]);

  /**
   * Get remaining time in seconds
   */
  const getTimeRemaining = useCallback((): number => {
    if (!currentAssessment || !startTime) return 0;
    
    const timeLimit = currentAssessment.timeLimit * 1000; // Convert to ms
    const elapsed = Date.now() - startTime;
    const remaining = timeLimit - elapsed;
    
    return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
  }, [currentAssessment, startTime]);

  /**
   * Check if assessment can be submitted
   */
  const canSubmit = useCallback((): boolean => {
    if (!currentAssessment || questions.length === 0) return false;
    
    // Check if all questions are answered
    const allAnswered = questions.every(question => answers[question.id]);
    
    // Check if time hasn't expired
    const timeRemaining = getTimeRemaining();
    
    return allAnswered && timeRemaining > 0;
  }, [currentAssessment, questions, answers, getTimeRemaining]);

  /**
   * Get study recommendations based on performance
   */
  const getRecommendations = useCallback((): string[] => {
    if (questions.length === 0) return [];
    
    const recommendations: string[] = [];
    const incorrectQuestions = questions.filter(question => {
      const answer = answers[question.id];
      return answer && !checkAnswerCorrectness(question, answer.answer);
    });
    
    if (incorrectQuestions.length > 0) {
      // Analyze incorrect answers by topic
      const topics = new Set(incorrectQuestions.map(q => extractTopicFromQuestion(q)));
      
      topics.forEach(topic => {
        recommendations.push(`Review ${topic} concepts and practice more examples`);
      });
    }
    
    // General recommendations based on score
    const currentScore = calculateScore();
    if (currentScore < 60) {
      recommendations.push('Consider reviewing the fundamentals before retaking');
      recommendations.push('Practice with additional exercises and examples');
    } else if (currentScore < 80) {
      recommendations.push('Focus on the specific areas where you made mistakes');
      recommendations.push('Try some advanced practice problems');
    }
    
    return recommendations;
  }, [questions, answers, calculateScore]);

  // Progress Methods

  /**
   * Get completion percentage
   */
  const getCompletionPercentage = useCallback((): number => {
    if (questions.length === 0) return 0;
    
    const answeredQuestions = questions.filter(question => answers[question.id]).length;
    return Math.round((answeredQuestions / questions.length) * 100);
  }, [questions, answers]);

  /**
   * Estimate time to complete based on current pace
   */
  const getEstimatedTimeToComplete = useCallback((): number => {
    if (!startTime || questions.length === 0) return 0;
    
    const answeredQuestions = Object.keys(answers).length;
    if (answeredQuestions === 0) return 0;
    
    const timePerQuestion = (Date.now() - startTime) / answeredQuestions;
    const remainingQuestions = questions.length - answeredQuestions;
    
    return Math.round((remainingQuestions * timePerQuestion) / (1000 * 60)); // Return minutes
  }, [startTime, questions.length, answers]);

  // Helper function for auto-submission
  const handleAutoSubmit = useCallback(async () => {
    if (currentAssessment && Object.keys(answers).length > 0) {
      try {
        await submitAssessment();
      } catch (error) {
        console.error('Auto-submission failed:', error);
      }
    }
  }, [currentAssessment, answers, submitAssessment]);

  // Return memoized object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    currentAssessment,
    questions,
    currentQuestionIndex,
    answers,
    
    // Actions
    startAssessment,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitAssessment,
    
    // Business Logic
    calculateScore,
    getTimeRemaining,
    canSubmit,
    getRecommendations,
    
    // Progress
    getCompletionPercentage,
    getEstimatedTimeToComplete
  }), [
    // State dependencies
    currentAssessment,
    questions,
    currentQuestionIndex,
    answers,
    
    // Action dependencies
    startAssessment,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitAssessment,
    
    // Business logic dependencies
    calculateScore,
    getTimeRemaining,
    canSubmit,
    getRecommendations,
    
    // Progress dependencies
    getCompletionPercentage,
    getEstimatedTimeToComplete
  ]);
};

// Helper Functions

/**
 * Check if an answer is correct
 */
function checkAnswerCorrectness(question: AssessmentQuestion, answer: string | string[]): boolean {
  if (Array.isArray(question.correctAnswer)) {
    if (Array.isArray(answer)) {
      return question.correctAnswer.every(correct => answer.includes(correct)) &&
             answer.every(ans => question.correctAnswer.includes(ans));
    }
    return question.correctAnswer.includes(answer);
  }
  
  if (Array.isArray(answer)) {
    return answer.includes(question.correctAnswer);
  }
  
  return answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
}

/**
 * Extract topic from question for recommendations
 */
function extractTopicFromQuestion(question: AssessmentQuestion): string {
  // Simple topic extraction based on question content
  const content = question.question.toLowerCase();
  
  if (content.includes('react')) return 'React';
  if (content.includes('javascript') || content.includes('js')) return 'JavaScript';
  if (content.includes('typescript') || content.includes('ts')) return 'TypeScript';
  if (content.includes('css')) return 'CSS';
  if (content.includes('html')) return 'HTML';
  if (content.includes('api')) return 'APIs';
  if (content.includes('state')) return 'State Management';
  if (content.includes('component')) return 'Components';
  if (content.includes('hook')) return 'Hooks';
  
  return 'General Programming';
}

/**
 * Generate mock questions for testing
 */
function generateMockQuestions(assessmentId: string): AssessmentQuestion[] {
  return [
    {
      id: 'q1',
      question: 'What is React?',
      type: 'multiple-choice',
      options: ['Library', 'Framework', 'Language', 'Tool'],
      correctAnswer: 'Library',
      explanation: 'React is a JavaScript library for building user interfaces',
      points: 10,
      difficulty: 'beginner',
      timeLimit: 60
    },
    {
      id: 'q2',
      question: 'What does JSX stand for?',
      type: 'multiple-choice',
      options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extension'],
      correctAnswer: 'JavaScript XML',
      explanation: 'JSX stands for JavaScript XML',
      points: 10,
      difficulty: 'beginner',
      timeLimit: 60
    },
    {
      id: 'q3',
      question: 'Explain the useState hook',
      type: 'short-answer',
      correctAnswer: 'useState is a Hook that lets you add React state to function components',
      points: 15,
      difficulty: 'intermediate',
      timeLimit: 120
    }
  ];
}