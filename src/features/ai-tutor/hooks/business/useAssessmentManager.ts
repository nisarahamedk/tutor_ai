// src/features/ai-tutor/hooks/business/useSkillAssessmentManager.ts
// SkillAssessment Manager Business Logic Hook - Extracts assessment logic from components
'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useComprehensiveLearningStore } from '../../stores/comprehensiveLearningStore';
import type { 
  AssessmentResult, 
  AssessmentAnswer
} from '../../types/learning';
import type {
  SkillAssessment,
  AssessmentQuestion
} from '../../types';

/**
 * SkillAssessment answers mapping
 */
export interface AssessmentAnswers {
  [questionId: string]: AssessmentAnswer;
}

/**
 * Interface for the SkillAssessment Manager return value
 */
export interface AssessmentManagerReturn {
  // State
  currentSkillAssessment: SkillAssessment | null;
  questions: AssessmentQuestion[];
  currentQuestionIndex: number;
  answers: AssessmentAnswers;
  
  // Actions
  startSkillAssessment: (assessmentId: string) => Promise<void>;
  answerQuestion: (questionId: string, answer: AssessmentAnswer) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitSkillAssessment: () => Promise<AssessmentResult>;
  
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
 * SkillAssessment Manager Hook - Handles all assessment-related business logic
 * 
 * Extracts business logic from SkillAssessmentComponent to improve:
 * - Testability: SkillAssessment logic can be tested in isolation
 * - Reusability: Can be used across multiple assessment components
 * - State Management: Complex assessment state in one place
 * - Timer Management: Automatic time tracking and submission
 */
export const useSkillAssessmentManager = (): AssessmentManagerReturn => {
  // Local state for assessment session
  const [currentSkillAssessment, setCurrentSkillAssessment] = useState<SkillAssessment | null>(null);
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

  // Actions

  /**
   * Submit the assessment
   */
  const submitSkillAssessment = useCallback(async (): Promise<AssessmentResult> => {
    if (!currentSkillAssessment) {
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
        isCorrect: checkAnswerCorrectness(question, answer.userAnswer)
      };
    });

    try {
      await submitAssessmentAction(currentSkillAssessment.id, assessmentAnswers);
      
      // Create result
      const correctAnswers = assessmentAnswers.filter(answer => answer.isCorrect).length;
      const score = Math.round((correctAnswers / assessmentAnswers.length) * 100);
      
      const result: AssessmentResult = {
        assessmentId: currentSkillAssessment.id,
        trackId: '',
        startedAt: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        completedAt: new Date().toISOString(),
        score,
        totalQuestions: assessmentAnswers.length,
        correctAnswers,
        timeSpent: startTime ? Date.now() - startTime : 0,
        answers: assessmentAnswers,
        passed: score >= 70,
        certificateEligible: score >= 80,
        feedback: score >= 80 ? 'Excellent work!' : score >= 70 ? 'Good job!' : 'Keep practicing!'
      };
      
      // Clear assessment state
      setCurrentSkillAssessment(null);
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
  }, [currentSkillAssessment, questions, answers, startTime, submitAssessmentAction]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Helper function for auto-submission
  const handleAutoSubmit = useCallback(async () => {
    if (currentSkillAssessment && Object.keys(answers).length > 0) {
      try {
        await submitSkillAssessment();
      } catch (error) {
        console.error('Auto-submission failed:', error);
      }
    }
  }, [currentSkillAssessment, answers, submitSkillAssessment]);

  // Auto-submit when time expires
  useEffect(() => {
    if (currentSkillAssessment && startTime) {
      const timeLimit = currentSkillAssessment.timeLimit * 1000; // Convert to ms
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
  }, [currentSkillAssessment, startTime, handleAutoSubmit]);

  /**
   * Start an assessment session
   */
  const startSkillAssessment = useCallback(async (assessmentId: string): Promise<void> => {
    try {
      // Find the track for this assessment
      const track = tracks.find(track => 
        track.assessments.includes(assessmentId)
      );
      
      if (!track) {
        throw new Error('SkillAssessment not found');
      }
      
      if (!enrolledTracks.includes(track.id)) {
        throw new Error('Must be enrolled in track to take assessment');
      }

      // Check if assessment is already in progress
      const existingResult = assessmentResults[assessmentId];
      if (existingResult && !existingResult.completedAt) {
        throw new Error('SkillAssessment already in progress');
      }

      // Start assessment in store
      await startAssessmentAction(assessmentId);
      
      // Load assessment data (in real app, this would come from API)
      const mockSkillAssessment: SkillAssessment = {
        id: assessmentId,
        title: 'Mock SkillAssessment',
        description: 'SkillAssessment description',
        questions: generateMockQuestions(),
        timeLimit: 1800, // 30 minutes
        difficulty: (track.difficulty || 'beginner').charAt(0).toUpperCase() + (track.difficulty || 'beginner').slice(1) as 'Beginner' | 'Intermediate' | 'Advanced',
        category: track.category || 'General'
      };
      
      setCurrentSkillAssessment(mockSkillAssessment);
      setQuestions(mockSkillAssessment.questions);
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

  // Business Logic Methods

  /**
   * Calculate current score based on answers
   */
  const calculateScore = useCallback((): number => {
    if (questions.length === 0) return 0;
    
    const correctAnswers = questions.filter(question => {
      const answer = answers[question.id];
      return answer && checkAnswerCorrectness(question, answer.userAnswer);
    }).length;
    
    return Math.round((correctAnswers / questions.length) * 100);
  }, [questions, answers]);

  /**
   * Get remaining time in seconds
   */
  const getTimeRemaining = useCallback((): number => {
    if (!currentSkillAssessment || !startTime) return 0;
    
    const timeLimit = currentSkillAssessment.timeLimit * 1000; // Convert to ms
    const elapsed = Date.now() - startTime;
    const remaining = timeLimit - elapsed;
    
    return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
  }, [currentSkillAssessment, startTime]);

  /**
   * Check if assessment can be submitted
   */
  const canSubmit = useCallback((): boolean => {
    if (!currentSkillAssessment || questions.length === 0) return false;
    
    // Check if all questions are answered
    const allAnswered = questions.every(question => answers[question.id]);
    
    // Check if time hasn't expired
    const timeRemaining = getTimeRemaining();
    
    return allAnswered && timeRemaining > 0;
  }, [currentSkillAssessment, questions, answers, getTimeRemaining]);

  /**
   * Get study recommendations based on performance
   */
  const getRecommendations = useCallback((): string[] => {
    if (questions.length === 0) return [];
    
    const recommendations: string[] = [];
    const incorrectQuestions = questions.filter(question => {
      const answer = answers[question.id];
      return answer && !checkAnswerCorrectness(question, answer.userAnswer);
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


  // Return memoized object to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    currentSkillAssessment,
    questions,
    currentQuestionIndex,
    answers,
    
    // Actions
    startSkillAssessment,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitSkillAssessment,
    
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
    currentSkillAssessment,
    questions,
    currentQuestionIndex,
    answers,
    
    // Action dependencies
    startSkillAssessment,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitSkillAssessment,
    
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
function generateMockQuestions(): AssessmentQuestion[] {
  return [
    {
      id: 'q1',
      question: 'What is React?',
      type: 'multiple-choice',
      options: ['Library', 'Framework', 'Language', 'Tool'],
      correctAnswer: 'Library',
      explanation: 'React is a JavaScript library for building user interfaces',
      points: 10
    },
    {
      id: 'q2',
      question: 'What does JSX stand for?',
      type: 'multiple-choice',
      options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extension'],
      correctAnswer: 'JavaScript XML',
      explanation: 'JSX stands for JavaScript XML',
      points: 10
    },
    {
      id: 'q3',
      question: 'Explain the useState hook',
      type: 'short-answer',
      correctAnswer: 'useState is a Hook that lets you add React state to function components',
      points: 15
    }
  ];
}