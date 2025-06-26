// src/features/ai-tutor/hooks/__tests__/useSkillSkillAssessmentManager.test.ts
// TDD Tests for SkillAssessment Manager Business Logic Hook

import { renderHook, act } from '@testing-library/react';
import { useSkillSkillAssessmentManager, type AssessmentManagerReturn } from '../business/useSkillSkillAssessmentManager';
import { useComprehensiveLearningStore } from '../../stores/comprehensiveLearningStore';
import type { 
  SkillAssessmentResult, 
  SkillAssessmentAnswer
} from '../../types/learning';
import type {
  SkillSkillAssessment,
  SkillAssessmentQuestion
} from '../../types';

// Test interface that extends the public interface with internal methods for testing
interface TestAssessmentManagerReturn extends AssessmentManagerReturn {
  setCurrentSkillAssessment: (assessment: SkillSkillAssessment) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setAnswers: (answers: Record<string, SkillAssessmentAnswer>) => void;
  setStartTime: (time: number) => void;
}

// Mock the store
jest.mock('../../stores/comprehensiveLearningStore', () => ({
  useComprehensiveLearningStore: jest.fn()
}));

const mockUseComprehensiveLearningStore = useComprehensiveLearningStore as jest.MockedFunction<typeof useComprehensiveLearningStore>;

describe('useSkillSkillAssessmentManager', () => {
  const mockQuestions: SkillAssessmentQuestion[] = [
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

  const mockSkillAssessment: SkillAssessment = {
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

  const mockSkillAssessmentResult: SkillAssessmentResult = {
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
      'react-basics-quiz': mockSkillAssessmentResult
    },
    tracks: [
      {
        id: 'react-fundamentals',
        assessments: ['react-basics-quiz']
      }
    ],
    enrolledTracks: ['react-fundamentals'],
    startSkillAssessment: jest.fn(),
    submitSkillAssessment: jest.fn(),
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
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      expect(result.current.currentSkillAssessment).toBeNull();
      expect(result.current.questions).toEqual([]);
      expect(result.current.currentQuestionIndex).toBe(0);
      expect(result.current.answers).toEqual({});
    });
  });

  describe('startSkillAssessment action', () => {
    it('should start assessment successfully', async () => {
      mockStore.startSkillAssessment.mockResolvedValue(undefined);
      
      // Mock assessment data (in real app, this would come from API)
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      await act(async () => {
        await result.current.startSkillAssessment('react-basics-quiz');
      });

      expect(mockStore.startSkillAssessment).toHaveBeenCalledWith('react-basics-quiz');
    });

    it('should handle assessment start failure', async () => {
      mockStore.startSkillAssessment.mockRejectedValue(new Error('Failed to start assessment'));
      
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      await act(async () => {
        try {
          await result.current.startSkillAssessment('react-basics-quiz');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    it('should prevent starting assessment if not enrolled in track', async () => {
      mockStore.enrolledTracks = [];
      
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      await act(async () => {
        try {
          await result.current.startSkillAssessment('react-basics-quiz');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('not enrolled');
        }
      });
    });

    it('should load questions when assessment starts', async () => {
      mockStore.startSkillAssessment.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      // Mock the assessment data loading
      act(() => {
        // Simulate loading assessment data
        (result.current as TestAssessmentManagerReturn).setCurrentSkillAssessment(mockSkillAssessment);
      });

      expect(result.current.questions).toEqual(mockQuestions);
      expect(result.current.currentQuestionIndex).toBe(0);
    });
  });

  describe('answerQuestion action', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());
      
      // Setup assessment
      act(() => {
        (result.current as TestAssessmentManagerReturn).setCurrentSkillAssessment(mockSkillAssessment);
      });
    });

    it('should record answer for current question', () => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

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
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

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
      const { result } = renderHook(() => useSkillSkillAssessmentManager());
      
      act(() => {
        (result.current as TestAssessmentManagerReturn).setCurrentSkillAssessment(mockSkillAssessment);
      });
    });

    it('should navigate to next question', () => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      act(() => {
        result.current.nextQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(1);
    });

    it('should not navigate past last question', () => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      act(() => {
        // Go to last question
        (result.current as TestAssessmentManagerReturn).setCurrentQuestionIndex(2);
        result.current.nextQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(2);
    });

    it('should navigate to previous question', () => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      act(() => {
        // Go to second question first
        (result.current as TestAssessmentManagerReturn).setCurrentQuestionIndex(1);
        result.current.previousQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(0);
    });

    it('should not navigate before first question', () => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      act(() => {
        result.current.previousQuestion();
      });

      expect(result.current.currentQuestionIndex).toBe(0);
    });
  });

  describe('submitSkillAssessment action', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());
      
      act(() => {
        (result.current as TestAssessmentManagerReturn).setCurrentSkillAssessment(mockSkillAssessment);
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
      mockStore.submitSkillAssessment.mockResolvedValue({
        ...mockSkillAssessmentResult,
        completedAt: '2024-01-15T10:30:00.000Z',
        score: 67, // 2 out of 3 correct
        correctAnswers: 2,
        passed: false
      });

      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      await act(async () => {
        const assessmentResult = await result.current.submitSkillAssessment();
        expect(assessmentResult.score).toBe(67);
        expect(assessmentResult.passed).toBe(false); // Below 70% passing
      });
    });

    it('should handle submission failure', async () => {
      mockStore.submitSkillAssessment.mockRejectedValue(new Error('Submission failed'));

      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      await act(async () => {
        try {
          await result.current.submitSkillAssessment();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    it('should prevent submission if not all questions answered', async () => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      // Clear some answers
      act(() => {
        (result.current as TestAssessmentManagerReturn).setAnswers({ q1: result.current.answers.q1 });
      });

      await act(async () => {
        try {
          await result.current.submitSkillAssessment();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain('all questions');
        }
      });
    });
  });

  describe('business logic methods', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());
      
      act(() => {
        (result.current as TestAssessmentManagerReturn).setCurrentSkillAssessment(mockSkillAssessment);
      });
    });

    describe('calculateScore', () => {
      it('should calculate correct score percentage', () => {
        const { result } = renderHook(() => useSkillSkillAssessmentManager());

        // Answer 2 out of 3 correctly
        act(() => {
          (result.current as TestAssessmentManagerReturn).setAnswers({
            q1: { questionId: 'q1', isCorrect: true, timeSpent: 30000 },
            q2: { questionId: 'q2', isCorrect: true, timeSpent: 25000 },
            q3: { questionId: 'q3', isCorrect: false, timeSpent: 60000 }
          });
        });

        expect(result.current.calculateScore()).toBe(67); // Round(2/3 * 100)
      });

      it('should return 0 for no correct answers', () => {
        const { result } = renderHook(() => useSkillSkillAssessmentManager());

        act(() => {
          (result.current as TestAssessmentManagerReturn).setAnswers({
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
        const { result } = renderHook(() => useSkillSkillAssessmentManager());

        // Mock start time 5 minutes ago
        const startTime = Date.now() - (5 * 60 * 1000);
        act(() => {
          (result.current as TestAssessmentManagerReturn).setStartTime(startTime);
        });

        const remaining = result.current.getTimeRemaining();
        expect(remaining).toBe(25 * 60); // 25 minutes remaining (in seconds)
      });

      it('should return 0 when time expired', () => {
        const { result } = renderHook(() => useSkillSkillAssessmentManager());

        // Mock start time 35 minutes ago (beyond 30 min limit)
        const startTime = Date.now() - (35 * 60 * 1000);
        act(() => {
          (result.current as TestAssessmentManagerReturn).setStartTime(startTime);
        });

        const remaining = result.current.getTimeRemaining();
        expect(remaining).toBe(0);
      });
    });

    describe('canSubmit', () => {
      it('should allow submission when all questions answered', () => {
        const { result } = renderHook(() => useSkillSkillAssessmentManager());

        act(() => {
          (result.current as TestAssessmentManagerReturn).setAnswers({
            q1: { questionId: 'q1', answer: 'Library' },
            q2: { questionId: 'q2', answer: 'JavaScript Extension' },
            q3: { questionId: 'q3', answer: 'State hook' }
          });
        });

        expect(result.current.canSubmit()).toBe(true);
      });

      it('should prevent submission when questions unanswered', () => {
        const { result } = renderHook(() => useSkillSkillAssessmentManager());

        act(() => {
          (result.current as TestAssessmentManagerReturn).setAnswers({
            q1: { questionId: 'q1', answer: 'Library' }
            // q2 and q3 not answered
          });
        });

        expect(result.current.canSubmit()).toBe(false);
      });

      it('should prevent submission when time expired', () => {
        const { result } = renderHook(() => useSkillSkillAssessmentManager());

        // Answer all questions but time expired
        act(() => {
          (result.current as TestAssessmentManagerReturn).setAnswers({
            q1: { questionId: 'q1', answer: 'Library' },
            q2: { questionId: 'q2', answer: 'JavaScript Extension' },
            q3: { questionId: 'q3', answer: 'State hook' }
          });
          (result.current as TestAssessmentManagerReturn).setStartTime(Date.now() - (35 * 60 * 1000));
        });

        expect(result.current.canSubmit()).toBe(false);
      });
    });

    describe('getRecommendations', () => {
      it('should provide study recommendations based on performance', () => {
        const { result } = renderHook(() => useSkillSkillAssessmentManager());

        act(() => {
          (result.current as TestAssessmentManagerReturn).setAnswers({
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
      const { result } = renderHook(() => useSkillSkillAssessmentManager());
      
      act(() => {
        (result.current as TestAssessmentManagerReturn).setCurrentSkillAssessment(mockSkillAssessment);
      });
    });

    it('should track completion percentage', () => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      act(() => {
        (result.current as TestAssessmentManagerReturn).setAnswers({
          q1: { questionId: 'q1', answer: 'Library' },
          q2: { questionId: 'q2', answer: 'JavaScript Extension' }
          // q3 not answered
        });
      });

      expect(result.current.getCompletionPercentage()).toBe(67); // 2/3 completed
    });

    it('should estimate time to complete', () => {
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      // Mock 2 questions answered in 5 minutes
      act(() => {
        (result.current as TestAssessmentManagerReturn).setAnswers({
          q1: { questionId: 'q1', timeSpent: 150000 }, // 2.5 min
          q2: { questionId: 'q2', timeSpent: 150000 }  // 2.5 min
        });
        (result.current as TestAssessmentManagerReturn).setStartTime(Date.now() - (5 * 60 * 1000));
      });

      const estimatedTime = result.current.getEstimatedTimeToComplete();
      expect(estimatedTime).toBeGreaterThan(0);
      expect(estimatedTime).toBeLessThan(10); // Should be reasonable estimate in minutes
    });
  });

  describe('auto-submission on time expiry', () => {
    it('should auto-submit when time runs out', async () => {
      mockStore.submitSkillAssessment.mockResolvedValue(mockSkillAssessmentResult);
      
      const { result } = renderHook(() => useSkillSkillAssessmentManager());

      act(() => {
        (result.current as TestAssessmentManagerReturn).setCurrentSkillAssessment(mockSkillAssessment);
        (result.current as TestAssessmentManagerReturn).setStartTime(Date.now() - (29 * 60 * 1000)); // 29 minutes ago
      });

      // Fast-forward time by 2 minutes to trigger auto-submit
      act(() => {
        jest.advanceTimersByTime(2 * 60 * 1000);
      });

      // Should have auto-submitted
      expect(mockStore.submitSkillAssessment).toHaveBeenCalled();
    });
  });
});