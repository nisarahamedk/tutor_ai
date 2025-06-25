// src/features/ai-tutor/hooks/__tests__/useAssessmentManager.test.ts
// TDD Tests for Assessment Manager Business Logic Hook

import { renderHook, act } from '@testing-library/react';
import { useAssessmentManager } from '../business/useAssessmentManager';
import { useComprehensiveLearningStore } from '../../stores/comprehensiveLearningStore';
import type { 
  Assessment, 
  AssessmentResult, 
  AssessmentAnswer,
  AssessmentQuestion 
} from '../../types/learning';

// Mock the store
jest.mock('../../stores/comprehensiveLearningStore', () => ({
  useComprehensiveLearningStore: jest.fn()
}));

const mockUseComprehensiveLearningStore = useComprehensiveLearningStore as jest.MockedFunction<typeof useComprehensiveLearningStore>;

describe('useAssessmentManager', () => {
  const mockQuestions: AssessmentQuestion[] = [
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
      question: 'What is JSX?',
      type: 'multiple-choice',
      options: ['XML', 'JavaScript Extension', 'HTML', 'CSS'],
      correctAnswer: 'JavaScript Extension',
      explanation: 'JSX is a syntax extension for JavaScript',
      points: 10,
      difficulty: 'beginner',
      timeLimit: 60
    },
    {
      id: 'q3',
      question: 'Explain useState hook',
      type: 'short-answer',
      correctAnswer: 'useState is a Hook that lets you add React state to function components',
      points: 15,
      difficulty: 'intermediate',
      timeLimit: 120
    }
  ];

  const mockAssessment: Assessment = {
    id: 'react-basics-quiz',
    title: 'React Basics Quiz',
    description: 'Test your knowledge of React fundamentals',
    questions: mockQuestions,
    timeLimit: 1800, // 30 minutes
    difficulty: 'beginner',
    category: 'Frontend Development',
    trackId: 'react-fundamentals',
    passingScore: 70,
    maxAttempts: 3,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockAssessmentResult: AssessmentResult = {
    assessmentId: 'react-basics-quiz',
    trackId: 'react-fundamentals',
    startedAt: '2024-01-15T10:00:00.000Z',
    score: 0,
    totalQuestions: 3,
    correctAnswers: 0,
    timeSpent: 0,
    answers: [],
    passed: false,
    certificateEligible: false
  };

  const mockStore = {
    assessmentResults: {
      'react-basics-quiz': mockAssessmentResult
    },
    tracks: [
      {
        id: 'react-fundamentals',
        assessments: ['react-basics-quiz']
      }
    ],
    enrolledTracks: ['react-fundamentals'],
    startAssessment: jest.fn(),
    submitAssessment: jest.fn(),
    isLoading: false,
    error: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseComprehensiveLearningStore.mockReturnValue(mockStore);
    
    // Mock timer functions
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with no current assessment', () => {
      const { result } = renderHook(() => useAssessmentManager());

      expect(result.current.currentAssessment).toBeNull();
      expect(result.current.questions).toEqual([]);
      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.answers).toEqual({});
    });
  });

  describe('startAssessment action', () => {
    it('should start assessment successfully', async () => {
      mockStore.startAssessment.mockResolvedValue(undefined);
      
      // Mock assessment data (in real app, this would come from API)
      const { result } = renderHook(() => useAssessmentManager());

      await act(async () => {
        await result.current.startAssessment('react-basics-quiz');
      });

      expect(mockStore.startAssessment).toHaveBeenCalledWith('react-basics-quiz');
    });

    it('should handle assessment start failure', async () => {
      mockStore.startAssessment.mockRejectedValue(new Error('Failed to start assessment'));
      
      const { result } = renderHook(() => useAssessmentManager());

      await act(async () => {
        try {
          await result.current.startAssessment('react-basics-quiz');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    it('should prevent starting assessment if not enrolled in track', async () => {
      mockStore.enrolledTracks = [];
      
      const { result } = renderHook(() => useAssessmentManager());

      await act(async () => {
        try {
          await result.current.startAssessment('react-basics-quiz');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('not enrolled');
        }
      });
    });

    it('should load questions when assessment starts', async () => {
      mockStore.startAssessment.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAssessmentManager());

      // Mock the assessment data loading
      act(() => {
        // Simulate loading assessment data
        (result.current as any).setCurrentAssessment(mockAssessment);
      });

      expect(result.current.questions).toEqual(mockQuestions);
      expect(result.current.currentQuestionIndex).toBe(0);
    });
  });

  describe('answerQuestion action', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useAssessmentManager());
      
      // Setup assessment
      act(() => {
        (result.current as any).setCurrentAssessment(mockAssessment);
      });
    });

    it('should record answer for current question', () => {
      const { result } = renderHook(() => useAssessmentManager());

      act(() => {
        result.current.answerQuestion('q1', { 
          questionId: 'q1', 
          answer: 'Library', 
          isCorrect: true,
          timeSpent: 30000
        });
      });

      expect(result.current.answers['q1']).toBeDefined();
      expect(result.current.answers['q1'].answer).toBe('Library');
      expect(result.current.answers['q1'].isCorrect).toBe(true);
    });

    it('should update answer if question is answered again', () => {
      const { result } = renderHook(() => useAssessmentManager());

      act(() => {
        result.current.answerQuestion('q1', { 
          questionId: 'q1', 
          answer: 'Framework', 
          isCorrect: false,
          timeSpent: 30000
        });
      });

      act(() => {
        result.current.answerQuestion('q1', { 
          questionId: 'q1', 
          answer: 'Library', 
          isCorrect: true,
          timeSpent: 45000
        });
      });

      expect(result.current.answers['q1'].answer).toBe('Library');
      expect(result.current.answers['q1'].isCorrect).toBe(true);
    });
  });

  describe('navigation actions', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAssessmentManager());
      
      act(() => {
        (result.current as any).setCurrentAssessment(mockAssessment);
      });
    });

    it('should navigate to next question', () => {
      const { result } = renderHook(() => useAssessmentManager());

      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(1);
    });

    it('should not navigate past last question', () => {
      const { result } = renderHook(() => useAssessmentManager());

      act(() => {
        // Go to last question
        (result.current as any).setCurrentQuestionIndex(2);
        result.current.nextQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(2);
    });

    it('should navigate to previous question', () => {
      const { result } = renderHook(() => useAssessmentManager());

      act(() => {
        // Go to second question first
        (result.current as any).setCurrentQuestionIndex(1);
        result.current.previousQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('should not navigate before first question', () => {
      const { result } = renderHook(() => useAssessmentManager());

      act(() => {
        result.current.previousQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(0);
    });
  });

  describe('submitAssessment action', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAssessmentManager());
      
      act(() => {
        (result.current as any).setCurrentAssessment(mockAssessment);
        // Answer all questions
        result.current.answerQuestion('q1', { 
          questionId: 'q1', 
          answer: 'Library', 
          isCorrect: true,
          timeSpent: 30000
        });
        result.current.answerQuestion('q2', { 
          questionId: 'q2', 
          answer: 'JavaScript Extension', 
          isCorrect: true,
          timeSpent: 25000
        });
        result.current.answerQuestion('q3', { 
          questionId: 'q3', 
          answer: 'State management hook', 
          isCorrect: false,
          timeSpent: 60000
        });
      });
    });

    it('should submit assessment with correct score calculation', async () => {
      mockStore.submitAssessment.mockResolvedValue({
        ...mockAssessmentResult,
        completedAt: '2024-01-15T10:30:00.000Z',
        score: 67, // 2 out of 3 correct
        correctAnswers: 2,
        passed: false
      });

      const { result } = renderHook(() => useAssessmentManager());

      await act(async () => {
        const assessmentResult = await result.current.submitAssessment();
        expect(assessmentResult.score).toBe(67);
        expect(assessmentResult.passed).toBe(false); // Below 70% passing
      });
    });

    it('should handle submission failure', async () => {
      mockStore.submitAssessment.mockRejectedValue(new Error('Submission failed'));

      const { result } = renderHook(() => useAssessmentManager());

      await act(async () => {
        try {
          await result.current.submitAssessment();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    it('should prevent submission if not all questions answered', async () => {
      const { result } = renderHook(() => useAssessmentManager());

      // Clear some answers
      act(() => {
        (result.current as any).setAnswers({ q1: result.current.answers.q1 });
      });

      await act(async () => {
        try {
          await result.current.submitAssessment();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('all questions');
        }
      });
    });
  });

  describe('business logic methods', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAssessmentManager());
      
      act(() => {
        (result.current as any).setCurrentAssessment(mockAssessment);
      });
    });

    describe('calculateScore', () => {
      it('should calculate correct score percentage', () => {
        const { result } = renderHook(() => useAssessmentManager());

        // Answer 2 out of 3 correctly
        act(() => {
          (result.current as any).setAnswers({
            q1: { questionId: 'q1', isCorrect: true, timeSpent: 30000 },
            q2: { questionId: 'q2', isCorrect: true, timeSpent: 25000 },
            q3: { questionId: 'q3', isCorrect: false, timeSpent: 60000 }
          });
        });

        expect(result.current.calculateScore()).toBe(67); // Round(2/3 * 100)
      });

      it('should return 0 for no correct answers', () => {
        const { result } = renderHook(() => useAssessmentManager());

        act(() => {
          (result.current as any).setAnswers({
            q1: { questionId: 'q1', isCorrect: false },
            q2: { questionId: 'q2', isCorrect: false },
            q3: { questionId: 'q3', isCorrect: false }
          });
        });

        expect(result.current.calculateScore()).toBe(0);
      });
    });

    describe('getTimeRemaining', () => {
      it('should calculate remaining time correctly', () => {
        const { result } = renderHook(() => useAssessmentManager());

        // Mock start time 5 minutes ago
        const startTime = Date.now() - (5 * 60 * 1000);
        act(() => {
          (result.current as any).setStartTime(startTime);
        });

        const remaining = result.current.getTimeRemaining();
        expect(remaining).toBe(25 * 60); // 25 minutes remaining (in seconds)
      });

      it('should return 0 when time expired', () => {
        const { result } = renderHook(() => useAssessmentManager());

        // Mock start time 35 minutes ago (beyond 30 min limit)
        const startTime = Date.now() - (35 * 60 * 1000);
        act(() => {
          (result.current as any).setStartTime(startTime);
        });

        const remaining = result.current.getTimeRemaining();
        expect(remaining).toBe(0);
      });
    });

    describe('canSubmit', () => {
      it('should allow submission when all questions answered', () => {
        const { result } = renderHook(() => useAssessmentManager());

        act(() => {
          (result.current as any).setAnswers({
            q1: { questionId: 'q1', answer: 'Library' },
            q2: { questionId: 'q2', answer: 'JavaScript Extension' },
            q3: { questionId: 'q3', answer: 'State hook' }
          });
        });

        expect(result.current.canSubmit()).toBe(true);
      });

      it('should prevent submission when questions unanswered', () => {
        const { result } = renderHook(() => useAssessmentManager());

        act(() => {
          (result.current as any).setAnswers({
            q1: { questionId: 'q1', answer: 'Library' }
            // q2 and q3 not answered
          });
        });

        expect(result.current.canSubmit()).toBe(false);
      });

      it('should prevent submission when time expired', () => {
        const { result } = renderHook(() => useAssessmentManager());

        // Answer all questions but time expired
        act(() => {
          (result.current as any).setAnswers({
            q1: { questionId: 'q1', answer: 'Library' },
            q2: { questionId: 'q2', answer: 'JavaScript Extension' },
            q3: { questionId: 'q3', answer: 'State hook' }
          });
          (result.current as any).setStartTime(Date.now() - (35 * 60 * 1000));
        });

        expect(result.current.canSubmit()).toBe(false);
      });
    });

    describe('getRecommendations', () => {
      it('should provide study recommendations based on performance', () => {
        const { result } = renderHook(() => useAssessmentManager());

        act(() => {
          (result.current as any).setAnswers({
            q1: { questionId: 'q1', isCorrect: false }, // React basics
            q2: { questionId: 'q2', isCorrect: true },  // JSX
            q3: { questionId: 'q3', isCorrect: false }  // Hooks
          });
        });

        const recommendations = result.current.getRecommendations();
        expect(Array.isArray(recommendations)).toBe(true);
        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations.some(rec => rec.includes('React'))).toBe(true);
      });
    });
  });

  describe('progress tracking', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAssessmentManager());
      
      act(() => {
        (result.current as any).setCurrentAssessment(mockAssessment);
      });
    });

    it('should track completion percentage', () => {
      const { result } = renderHook(() => useAssessmentManager());

      act(() => {
        (result.current as any).setAnswers({
          q1: { questionId: 'q1', answer: 'Library' },
          q2: { questionId: 'q2', answer: 'JavaScript Extension' }
          // q3 not answered
        });
      });

      expect(result.current.getCompletionPercentage()).toBe(67); // 2/3 completed
    });

    it('should estimate time to complete', () => {
      const { result } = renderHook(() => useAssessmentManager());

      // Mock 2 questions answered in 5 minutes
      act(() => {
        (result.current as any).setAnswers({
          q1: { questionId: 'q1', timeSpent: 150000 }, // 2.5 min
          q2: { questionId: 'q2', timeSpent: 150000 }  // 2.5 min
        });
        (result.current as any).setStartTime(Date.now() - (5 * 60 * 1000));
      });

      const estimatedTime = result.current.getEstimatedTimeToComplete();
      expect(estimatedTime).toBeGreaterThan(0);
      expect(estimatedTime).toBeLessThan(10); // Should be reasonable estimate in minutes
    });
  });

  describe('auto-submission on time expiry', () => {
    it('should auto-submit when time runs out', async () => {
      mockStore.submitAssessment.mockResolvedValue(mockAssessmentResult);
      
      const { result } = renderHook(() => useAssessmentManager());

      act(() => {
        (result.current as any).setCurrentAssessment(mockAssessment);
        (result.current as any).setStartTime(Date.now() - (29 * 60 * 1000)); // 29 minutes ago
      });

      // Fast-forward time by 2 minutes to trigger auto-submit
      act(() => {
        jest.advanceTimersByTime(2 * 60 * 1000);
      });

      // Should have auto-submitted
      expect(mockStore.submitAssessment).toHaveBeenCalled();
    });
  });
});