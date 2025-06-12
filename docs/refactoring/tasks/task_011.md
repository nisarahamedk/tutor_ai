# TASK-011: Implement Custom Hooks for Business Logic (TDD)

## Task Overview
**Epic**: State Management Migration  
**Story Points**: 6  
**Priority**: Medium  
**Type**: Refactoring  
**Assignee**: TBD  
**Status**: 🔴 Not Started  

## Description
Extract business logic from components into reusable custom hooks following modern React patterns. This creates a clean separation between UI and business logic, improves testability, and enables better code reuse across the application.

## Business Value
- Improves code reusability and maintainability
- Enables easier testing of business logic in isolation
- Creates cleaner, more focused components
- Provides consistent business logic patterns across the app
- Facilitates team collaboration with clear boundaries
- Enables better debugging and performance optimization

## Current State Analysis

### Current Business Logic Issues
```typescript
// Business logic mixed with UI in components
function TrackExplorationComponent() {
  const [tracks, setTracks] = useState([]);
  const [filters, setFilters] = useState({});
  const [selectedTrack, setSelectedTrack] = useState(null);
  
  // Complex business logic in component
  const handleTrackSelection = (track) => {
    if (userHasPrerequisites(track)) {
      if (userIsEligible(track)) {
        enrollUserInTrack(track);
        updateUserProgress(track);
        sendAnalyticsEvent('track_selected', track);
      }
    }
  };
  
  // More business logic...
  const calculateRecommendations = () => { /* complex logic */ };
  const handleProgressUpdate = () => { /* complex logic */ };
  
  return /* UI */;
}
```

### Problems to Address
- **Mixed concerns**: Business logic and UI logic in same component
- **Poor testability**: Hard to test business logic without rendering UI
- **Code duplication**: Same logic repeated across components
- **Large components**: Business logic makes components too large
- **Difficult debugging**: Hard to isolate business logic issues

## Target Architecture

### Clean Hook-Based Architecture
```typescript
// Business logic in custom hooks
function TrackExplorationComponent() {
  const { tracks, isLoading } = useLearningTracks();
  const { 
    selectedTrack, 
    selectTrack, 
    canEnrollInTrack 
  } = useTrackSelection();
  const { recommendations } = useTrackRecommendations();
  
  // Clean UI-focused component
  return (
    <div>
      {tracks.map(track => (
        <TrackCard 
          key={track.id}
          track={track}
          onSelect={selectTrack}
          canEnroll={canEnrollInTrack(track)}
        />
      ))}
    </div>
  );
}

// Testable business logic
function useTrackSelection() {
  // All business logic encapsulated
  const selectTrack = useCallback((track) => {
    // Business rules
  }, []);
  
  return { selectedTrack, selectTrack, canEnrollInTrack };
}
```

## Acceptance Criteria

### Must Have
- [ ] Create useLearningProgress hook for progress management
- [ ] Create useFlashcardReview hook for review functionality  
- [ ] Create useChatManager hook for chat operations
- [ ] Create useSkillAssessment hook for assessment logic
- [ ] Create useTrackSelection hook for track enrollment logic
- [ ] Add proper error handling and loading states in all hooks
- [ ] Ensure hooks are reusable across components
- [ ] Maintain all existing functionality

### Nice to Have
- [ ] Create useOfflineLearning hook for offline capabilities
- [ ] Add useLearningSocialFeatures hook for social learning
- [ ] Create useAdaptiveLearning hook for AI-powered adaptations
- [ ] Add useAnalytics hook for learning analytics
- [ ] Create useLearningScheduler hook for study scheduling
- [ ] Add performance optimization hooks

## Technical Implementation

### Core Learning Hooks

#### 1. Learning Progress Hook
```typescript
// src/features/ai-tutor/hooks/useLearningProgress.ts
import { useCallback, useMemo } from 'react';
import { useLearningStore } from '../stores/learningStore';
import { updateProgressAction } from '../actions/learning-actions';
import { toast } from '@/components/ui/use-toast';

export function useLearningProgress(trackId?: string) {
  const {
    trackProgress,
    lessonProgress,
    updateLessonProgress,
    completeLesson,
    learningStats
  } = useLearningStore();

  // Get progress for specific track or all tracks
  const progress = useMemo(() => {
    if (trackId) {
      const trackProg = trackProgress[trackId] || 0;
      const lessons = Object.entries(lessonProgress)
        .filter(([key]) => key.startsWith(`${trackId}-`))
        .map(([, progress]) => progress);
      
      return {
        trackProgress: trackProg,
        lessonsCompleted: lessons.filter(l => l.completedAt).length,
        totalLessons: lessons.length,
        averageTime: lessons.reduce((sum, l) => sum + l.timeSpent, 0) / lessons.length || 0,
        lastActivity: Math.max(...lessons.map(l => new Date(l.lastAccessedAt).getTime()))
      };
    }
    
    return {
      overallProgress: learningStats.completionRate,
      totalTimeSpent: learningStats.totalTimeSpent,
      tracksCompleted: learningStats.tracksCompleted,
      lessonsCompleted: learningStats.lessonsCompleted,
      currentStreak: learningStats.currentStreak
    };
  }, [trackId, trackProgress, lessonProgress, learningStats]);

  // Update lesson progress with server sync
  const updateProgress = useCallback(async (
    lessonId: string,
    progressData: {
      progress: number;
      timeSpent?: number;
      notes?: string;
    }
  ) => {
    if (!trackId) {
      throw new Error('Track ID required for progress update');
    }

    try {
      // Optimistic update
      updateLessonProgress(trackId, lessonId, {
        ...progressData,
        lastAccessedAt: new Date().toISOString()
      });

      // Sync with server
      const formData = new FormData();
      formData.append('trackId', trackId);
      formData.append('lessonId', lessonId);
      formData.append('progress', progressData.progress.toString());
      if (progressData.timeSpent) {
        formData.append('timeSpent', progressData.timeSpent.toString());
      }
      if (progressData.notes) {
        formData.append('notes', progressData.notes);
      }

      const result = await updateProgressAction(null, formData);
      
      if (!result.success) {
        // Rollback optimistic update on error
        throw new Error(result.error || 'Failed to update progress');
      }

      return result;
    } catch (error) {
      toast({
        title: "Failed to update progress",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      throw error;
    }
  }, [trackId, updateLessonProgress]);

  // Complete lesson with achievements check
  const markLessonComplete = useCallback(async (
    lessonId: string,
    completionData?: {
      timeSpent?: number;
      notes?: string;
      score?: number;
    }
  ) => {
    if (!trackId) {
      throw new Error('Track ID required for lesson completion');
    }

    try {
      // Mark as complete locally
      completeLesson(trackId, lessonId, {
        ...completionData,
        completedAt: new Date().toISOString(),
        progress: 100
      });

      // Sync with server
      const result = await updateProgress(lessonId, {
        progress: 100,
        ...completionData
      });

      // Check for achievements
      await checkForAchievements(trackId, lessonId);

      toast({
        title: "Lesson completed!",
        description: "Great job! Keep up the momentum.",
      });

      return result;
    } catch (error) {
      console.error('Failed to complete lesson:', error);
      throw error;
    }
  }, [trackId, completeLesson, updateProgress]);

  // Calculate next recommended lesson
  const getNextLesson = useCallback(() => {
    if (!trackId) return null;

    const track = useLearningStore.getState().getTrackById(trackId);
    if (!track) return null;

    // Find first incomplete lesson
    const nextLesson = track.lessons.find(lesson => {
      const progress = lessonProgress[`${trackId}-${lesson.id}`];
      return !progress?.completedAt;
    });

    return nextLesson || null;
  }, [trackId, lessonProgress]);

  // Get learning insights for track
  const getProgressInsights = useCallback(() => {
    if (!trackId) return null;

    const trackData = progress as any;
    const completionRate = trackData.trackProgress / 100;
    const avgSessionTime = trackData.averageTime;
    
    return {
      momentum: completionRate > 0.7 ? 'high' : completionRate > 0.3 ? 'medium' : 'low',
      suggestedSessionTime: Math.max(30, avgSessionTime * 1.2), // Suggest 20% more than average
      estimatedCompletion: calculateEstimatedCompletion(trackData),
      strengths: identifyStrengths(trackData),
      improvements: identifyImprovements(trackData)
    };
  }, [progress, trackId]);

  return {
    progress,
    updateProgress,
    markLessonComplete,
    getNextLesson,
    getProgressInsights,
    isLoading: false, // Could be derived from store state
    error: null // Could be derived from store state
  };
}

// Helper functions
async function checkForAchievements(trackId: string, lessonId: string) {
  // Implementation for achievement checking
  const store = useLearningStore.getState();
  const completedLessons = store.getCompletedLessons(trackId);
  
  // Check for milestones
  if (completedLessons.length === 1) {
    store.unlockAchievement('first-lesson-complete');
  }
  if (completedLessons.length === 5) {
    store.unlockAchievement('five-lessons-complete');
  }
  
  // Check for streak achievements
  if (store.learningStats.currentStreak >= 7) {
    store.unlockAchievement('week-streak');
  }
}

function calculateEstimatedCompletion(trackData: any) {
  const { trackProgress, averageTime, totalLessons, lessonsCompleted } = trackData;
  
  if (lessonsCompleted === 0 || averageTime === 0) {
    return 'Not enough data';
  }
  
  const remainingLessons = totalLessons - lessonsCompleted;
  const estimatedHours = (remainingLessons * averageTime) / 60;
  
  if (estimatedHours < 1) {
    return `${Math.round(estimatedHours * 60)} minutes`;
  }
  
  return `${Math.round(estimatedHours)} hours`;
}

function identifyStrengths(trackData: any) {
  const strengths = [];
  
  if (trackData.averageTime < 45) {
    strengths.push('Quick learner');
  }
  if (trackData.trackProgress > 50) {
    strengths.push('Consistent progress');
  }
  
  return strengths;
}

function identifyImprovements(trackData: any) {
  const improvements = [];
  
  if (trackData.averageTime > 90) {
    improvements.push('Consider shorter study sessions');
  }
  if (trackData.trackProgress < 20) {
    improvements.push('Try to establish a regular study routine');
  }
  
  return improvements;
}
```

#### 2. Flashcard Review Hook
```typescript
// src/features/ai-tutor/hooks/useFlashcardReview.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLearningStore } from '../stores/learningStore';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  lastReviewed?: string;
  nextReview?: string;
  reviewCount: number;
  easeFactor: number; // Spaced repetition factor
}

interface ReviewSession {
  cards: Flashcard[];
  currentIndex: number;
  reviewedCards: string[];
  correctAnswers: number;
  startTime: Date;
}

export function useFlashcardReview(trackId: string) {
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const { updateLessonProgress } = useLearningStore();

  // Calculate cards due for review using spaced repetition
  const dueCards = useMemo(() => {
    // This would typically fetch from the learning store or API
    const allCards = getFlashcardsForTrack(trackId);
    const now = new Date();
    
    return allCards.filter(card => {
      if (!card.nextReview) return true; // New cards
      return new Date(card.nextReview) <= now; // Due cards
    });
  }, [trackId]);

  // Start a new review session
  const startReview = useCallback((cards: Flashcard[] = dueCards) => {
    if (cards.length === 0) {
      throw new Error('No cards available for review');
    }

    // Shuffle cards for better learning
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    
    setSession({
      cards: shuffledCards,
      currentIndex: 0,
      reviewedCards: [],
      correctAnswers: 0,
      startTime: new Date()
    });
    setIsReviewMode(true);
  }, [dueCards]);

  // Get current card
  const currentCard = useMemo(() => {
    if (!session || session.currentIndex >= session.cards.length) {
      return null;
    }
    return session.cards[session.currentIndex];
  }, [session]);

  // Answer a card (correct/incorrect)
  const answerCard = useCallback((correct: boolean) => {
    if (!session || !currentCard) return;

    const updatedSession = { ...session };
    updatedSession.reviewedCards.push(currentCard.id);
    
    if (correct) {
      updatedSession.correctAnswers++;
    }

    // Update card using spaced repetition algorithm
    const updatedCard = updateCardWithSpacedRepetition(currentCard, correct);
    saveCardProgress(updatedCard);

    setSession(updatedSession);
  }, [session, currentCard]);

  // Move to next card
  const nextCard = useCallback(() => {
    if (!session) return;

    const newIndex = session.currentIndex + 1;
    
    if (newIndex >= session.cards.length) {
      // Review session complete
      completeReviewSession();
    } else {
      setSession(prev => prev ? { ...prev, currentIndex: newIndex } : null);
    }
  }, [session]);

  // Complete the review session
  const completeReviewSession = useCallback(async () => {
    if (!session) return;

    const duration = (new Date().getTime() - session.startTime.getTime()) / 1000 / 60; // minutes
    const accuracy = session.correctAnswers / session.cards.length;

    // Update learning progress
    try {
      await updateLessonProgress(trackId, 'flashcard-review', {
        progress: Math.round(accuracy * 100),
        timeSpent: duration,
        lastAccessedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to update review progress:', error);
    }

    // Generate session summary
    const summary = {
      cardsReviewed: session.cards.length,
      correctAnswers: session.correctAnswers,
      accuracy: Math.round(accuracy * 100),
      duration: Math.round(duration),
      nextReviewDate: calculateNextReviewDate()
    };

    setIsReviewMode(false);
    setSession(null);
    
    return summary;
  }, [session, trackId, updateLessonProgress]);

  // Skip current card (mark as difficult)
  const skipCard = useCallback(() => {
    if (!currentCard) return;

    // Mark as difficult and move to end of session
    const updatedCard = { 
      ...currentCard, 
      difficulty: 'hard' as const,
      easeFactor: Math.max(1.3, currentCard.easeFactor - 0.2)
    };
    
    saveCardProgress(updatedCard);
    nextCard();
  }, [currentCard, nextCard]);

  // Reset review session
  const resetReview = useCallback(() => {
    setSession(null);
    setIsReviewMode(false);
  }, []);

  // Get review statistics
  const getReviewStats = useCallback(() => {
    if (!session) return null;

    const progress = (session.reviewedCards.length / session.cards.length) * 100;
    const accuracy = session.reviewedCards.length > 0 
      ? (session.correctAnswers / session.reviewedCards.length) * 100 
      : 0;

    return {
      progress: Math.round(progress),
      accuracy: Math.round(accuracy),
      cardsRemaining: session.cards.length - session.reviewedCards.length,
      timeElapsed: Math.round((new Date().getTime() - session.startTime.getTime()) / 1000 / 60)
    };
  }, [session]);

  // Auto-save progress periodically
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const stats = getReviewStats();
      if (stats && stats.progress > 0) {
        updateLessonProgress(trackId, 'flashcard-review', {
          progress: stats.progress,
          timeSpent: stats.timeElapsed,
          lastAccessedAt: new Date().toISOString()
        }).catch(console.error);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [session, trackId, updateLessonProgress, getReviewStats]);

  return {
    // State
    dueCards,
    currentCard,
    session,
    isReviewMode,
    
    // Actions
    startReview,
    answerCard,
    nextCard,
    skipCard,
    completeReviewSession,
    resetReview,
    
    // Computed
    getReviewStats,
    
    // Derived state
    isSessionActive: !!session,
    hasMoreCards: session ? session.currentIndex < session.cards.length - 1 : false,
    sessionProgress: session ? (session.reviewedCards.length / session.cards.length) * 100 : 0
  };
}

// Helper functions
function getFlashcardsForTrack(trackId: string): Flashcard[] {
  // This would typically fetch from API or store
  // For now, return mock data
  return [
    {
      id: '1',
      question: 'What is React?',
      answer: 'A JavaScript library for building user interfaces',
      difficulty: 'easy',
      category: 'basics',
      reviewCount: 0,
      easeFactor: 2.5
    },
    // More cards...
  ];
}

function updateCardWithSpacedRepetition(card: Flashcard, correct: boolean): Flashcard {
  // SM-2 spaced repetition algorithm
  let newEaseFactor = card.easeFactor;
  let interval = 1;

  if (correct) {
    if (card.reviewCount === 0) {
      interval = 1;
    } else if (card.reviewCount === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * newEaseFactor);
    }
    newEaseFactor = newEaseFactor + (0.1 - (5 - 4) * (0.08 + (5 - 4) * 0.02));
  } else {
    interval = 1;
    newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...card,
    reviewCount: card.reviewCount + 1,
    easeFactor: Math.max(1.3, newEaseFactor),
    lastReviewed: new Date().toISOString(),
    nextReview: nextReview.toISOString()
  };
}

function saveCardProgress(card: Flashcard) {
  // Save to store or API
  console.log('Saving card progress:', card);
}

function calculateNextReviewDate(): string {
  // Calculate when next review session should be
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1); // Default to tomorrow
  return nextDate.toISOString();
}
```

#### 3. Chat Manager Hook
```typescript
// src/features/ai-tutor/hooks/useChatManager.ts
import { useCallback, useMemo, useRef } from 'react';
import { useChatStore, useActiveTab } from '../stores/chatStore';
import { sendMessageAction } from '../actions/message-actions';
import { toast } from '@/components/ui/use-toast';

export function useChatManager() {
  const {
    tabMessages,
    addMessage,
    setLoading,
    setError,
    addOptimisticMessage,
    removeMessage
  } = useChatStore();
  
  const activeTab = useActiveTab();
  const messageIdCounter = useRef(0);

  // Get messages for active tab
  const messages = useMemo(() => {
    return tabMessages[activeTab] || [];
  }, [tabMessages, activeTab]);

  // Send message with optimistic updates
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const tempId = `temp-${Date.now()}-${++messageIdCounter.current}`;
    const timestamp = new Date().toISOString();

    // Create optimistic user message
    const optimisticMessage = {
      id: tempId,
      content: content.trim(),
      type: 'user' as const,
      timestamp,
      metadata: { optimistic: true, pending: true }
    };

    try {
      // Add optimistic message immediately
      addOptimisticMessage(activeTab, optimisticMessage);
      setLoading(true);
      setError(null);

      // Prepare form data for server action
      const formData = new FormData();
      formData.append('message', content.trim());
      formData.append('tab', activeTab);
      formData.append('tempId', tempId);

      // Call server action
      const result = await sendMessageAction(null, formData);

      if (result.success) {
        // Remove optimistic message
        removeMessage(activeTab, tempId);

        // Add confirmed user message
        const confirmedUserMessage = {
          id: crypto.randomUUID(),
          content: content.trim(),
          type: 'user' as const,
          timestamp,
          metadata: { optimistic: false }
        };
        addMessage(activeTab, confirmedUserMessage);

        // Add AI response if provided
        if (result.message) {
          const aiMessage = {
            id: crypto.randomUUID(),
            content: result.message,
            type: 'ai' as const,
            timestamp: result.timestamp || new Date().toISOString(),
            metadata: { optimistic: false }
          };
          addMessage(activeTab, aiMessage);
        }

        return { success: true, message: result.message };
      } else {
        // Remove optimistic message on error
        removeMessage(activeTab, tempId);
        
        const errorMessage = result.error || 'Failed to send message';
        setError(errorMessage);
        
        toast({
          title: "Failed to send message",
          description: errorMessage,
          variant: "destructive",
        });

        return { success: false, error: errorMessage };
      }
    } catch (error) {
      // Remove optimistic message on error
      removeMessage(activeTab, tempId);
      
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      setError(errorMessage);
      
      toast({
        title: "Network error",
        description: "Please check your connection and try again",
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [activeTab, addOptimisticMessage, addMessage, removeMessage, setLoading, setError]);

  // Clear chat for current tab
  const clearChat = useCallback(() => {
    useChatStore.getState().clearMessages(activeTab);
    toast({
      title: "Chat cleared",
      description: `${activeTab} chat history has been cleared`,
    });
  }, [activeTab]);

  // Retry failed message
  const retryMessage = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || message.type !== 'user') return;

    return sendMessage(message.content);
  }, [messages, sendMessage]);

  // Get chat statistics
  const getChatStats = useCallback(() => {
    const allMessages = Object.values(tabMessages).flat();
    const userMessages = allMessages.filter(m => m.type === 'user');
    const aiMessages = allMessages.filter(m => m.type === 'ai');

    return {
      totalMessages: allMessages.length,
      userMessages: userMessages.length,
      aiMessages: aiMessages.length,
      currentTabMessages: messages.length,
      avgResponseTime: calculateAverageResponseTime(allMessages),
      mostActiveTab: getMostActiveTab(tabMessages)
    };
  }, [tabMessages, messages]);

  // Search messages across all tabs
  const searchMessages = useCallback((query: string) => {
    if (!query.trim()) return [];

    const allMessages = Object.entries(tabMessages).flatMap(([tab, messages]) =>
      messages.map(message => ({ ...message, tab }))
    );

    return allMessages.filter(message =>
      message.content.toLowerCase().includes(query.toLowerCase())
    );
  }, [tabMessages]);

  // Export chat history
  const exportChat = useCallback((format: 'json' | 'txt' = 'json') => {
    if (format === 'json') {
      return {
        exportedAt: new Date().toISOString(),
        activeTab,
        chats: tabMessages
      };
    } else {
      // Text format
      let output = `AI Tutor Chat Export - ${new Date().toLocaleDateString()}\n\n`;
      
      Object.entries(tabMessages).forEach(([tab, messages]) => {
        output += `=== ${tab.toUpperCase()} TAB ===\n`;
        messages.forEach(message => {
          const time = new Date(message.timestamp).toLocaleTimeString();
          output += `[${time}] ${message.type.toUpperCase()}: ${message.content}\n`;
        });
        output += '\n';
      });
      
      return output;
    }
  }, [tabMessages, activeTab]);

  // Get conversation context for AI
  const getConversationContext = useCallback((maxMessages: number = 10) => {
    const recentMessages = messages.slice(-maxMessages);
    
    return {
      tab: activeTab,
      messages: recentMessages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp
      })),
      messageCount: messages.length,
      sessionStarted: messages[0]?.timestamp || new Date().toISOString()
    };
  }, [messages, activeTab]);

  return {
    // State
    messages,
    isLoading: useChatStore(state => state.isLoading),
    error: useChatStore(state => state.error),
    
    // Actions
    sendMessage,
    clearChat,
    retryMessage,
    
    // Utilities
    getChatStats,
    searchMessages,
    exportChat,
    getConversationContext,
    
    // Computed values
    hasMessages: messages.length > 0,
    lastMessage: messages[messages.length - 1] || null,
    canSendMessage: !useChatStore(state => state.isLoading)
  };
}

// Helper functions
function calculateAverageResponseTime(messages: any[]): number {
  const conversationPairs = [];
  
  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];
    
    if (current.type === 'user' && next.type === 'ai') {
      const responseTime = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
      conversationPairs.push(responseTime);
    }
  }
  
  if (conversationPairs.length === 0) return 0;
  
  const avgMs = conversationPairs.reduce((sum, time) => sum + time, 0) / conversationPairs.length;
  return Math.round(avgMs / 1000); // Convert to seconds
}

function getMostActiveTab(tabMessages: Record<string, any[]>): string {
  let mostActiveTab = 'home';
  let maxMessages = 0;
  
  Object.entries(tabMessages).forEach(([tab, messages]) => {
    if (messages.length > maxMessages) {
      maxMessages = messages.length;
      mostActiveTab = tab;
    }
  });
  
  return mostActiveTab;
}
```

#### 4. Skill Assessment Hook
```typescript
// src/features/ai-tutor/hooks/useSkillAssessment.ts
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useLearningStore } from '../stores/learningStore';
import { submitAssessmentAction } from '../actions/assessment-actions';

interface AssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'coding' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number; // seconds
}

interface AssessmentAnswer {
  questionId: string;
  answer: string | number | string[];
  timeSpent: number;
  confidence?: number; // 1-5 scale
}

interface AssessmentSession {
  assessmentId: string;
  questions: AssessmentQuestion[];
  answers: Record<string, AssessmentAnswer>;
  currentQuestionIndex: number;
  startTime: Date;
  timeLimit?: number; // total time limit in seconds
  status: 'not-started' | 'in-progress' | 'completed' | 'submitted';
}

export function useSkillAssessment(trackId?: string) {
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { updateLearningProgress, unlockAchievement } = useLearningStore();

  // Start a new assessment
  const startAssessment = useCallback(async (assessmentConfig: {
    trackId?: string;
    skillArea?: string;
    difficulty?: 'adaptive' | 'easy' | 'medium' | 'hard';
    questionCount?: number;
    timeLimit?: number;
  } = {}) => {
    try {
      // Generate or fetch questions based on config
      const questions = await generateAssessmentQuestions(assessmentConfig);
      
      const newSession: AssessmentSession = {
        assessmentId: crypto.randomUUID(),
        questions,
        answers: {},
        currentQuestionIndex: 0,
        startTime: new Date(),
        timeLimit: assessmentConfig.timeLimit,
        status: 'in-progress'
      };

      setSession(newSession);
      
      if (assessmentConfig.timeLimit) {
        setTimeRemaining(assessmentConfig.timeLimit);
      }

      return newSession;
    } catch (error) {
      console.error('Failed to start assessment:', error);
      throw error;
    }
  }, []);

  // Answer current question
  const answerQuestion = useCallback((
    answer: string | number | string[],
    confidence?: number
  ) => {
    if (!session) return;

    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) return;

    const timeSpent = (new Date().getTime() - session.startTime.getTime()) / 1000;
    
    const assessmentAnswer: AssessmentAnswer = {
      questionId: currentQuestion.id,
      answer,
      timeSpent,
      confidence
    };

    setSession(prev => prev ? {
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: assessmentAnswer
      }
    } : null);
  }, [session]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    if (!session) return;

    const nextIndex = session.currentQuestionIndex + 1;
    
    if (nextIndex >= session.questions.length) {
      // Assessment complete
      setSession(prev => prev ? { ...prev, status: 'completed' } : null);
    } else {
      setSession(prev => prev ? { 
        ...prev, 
        currentQuestionIndex: nextIndex 
      } : null);
    }
  }, [session]);

  // Go to previous question
  const previousQuestion = useCallback(() => {
    if (!session || session.currentQuestionIndex === 0) return;

    setSession(prev => prev ? {
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex - 1
    } : null);
  }, [session]);

  // Jump to specific question
  const goToQuestion = useCallback((index: number) => {
    if (!session || index < 0 || index >= session.questions.length) return;

    setSession(prev => prev ? {
      ...prev,
      currentQuestionIndex: index
    } : null);
  }, [session]);

  // Submit assessment
  const submitAssessment = useCallback(async () => {
    if (!session || session.status !== 'completed') {
      throw new Error('Assessment not ready for submission');
    }

    try {
      // Calculate results
      const results = calculateAssessmentResults(session);
      
      // Prepare submission data
      const submissionData = {
        assessmentId: session.assessmentId,
        trackId: trackId || 'general',
        answers: Object.values(session.answers),
        totalTime: (new Date().getTime() - session.startTime.getTime()) / 1000,
        results
      };

      // Submit to server
      const formData = new FormData();
      formData.append('assessmentData', JSON.stringify(submissionData));
      
      const result = await submitAssessmentAction(formData);
      
      if (result.success) {
        // Update learning progress
        if (trackId) {
          await updateLearningProgress(trackId, `assessment-${session.assessmentId}`, {
            progress: 100,
            timeSpent: submissionData.totalTime / 60, // Convert to minutes
            lastAccessedAt: new Date().toISOString()
          });
        }

        // Check for achievements
        await checkAssessmentAchievements(results);

        setSession(prev => prev ? { ...prev, status: 'submitted' } : null);
        
        return {
          success: true,
          results,
          assessmentId: result.assessmentId
        };
      } else {
        throw new Error(result.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      throw error;
    }
  }, [session, trackId, updateLearningProgress, unlockAchievement]);

  // Save progress (for resuming later)
  const saveProgress = useCallback(async () => {
    if (!session) return;

    try {
      // Save current progress to local storage or server
      const progressData = {
        sessionId: session.assessmentId,
        answers: session.answers,
        currentQuestionIndex: session.currentQuestionIndex,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem(`assessment-progress-${session.assessmentId}`, JSON.stringify(progressData));
      
      return progressData;
    } catch (error) {
      console.error('Failed to save assessment progress:', error);
    }
  }, [session]);

  // Resume saved assessment
  const resumeAssessment = useCallback(async (sessionId: string) => {
    try {
      const savedData = localStorage.getItem(`assessment-progress-${sessionId}`);
      if (!savedData) {
        throw new Error('No saved progress found');
      }

      const progressData = JSON.parse(savedData);
      
      // Reconstruct session (would typically fetch questions from server)
      const questions = await generateAssessmentQuestions({ trackId });
      
      const resumedSession: AssessmentSession = {
        assessmentId: sessionId,
        questions,
        answers: progressData.answers,
        currentQuestionIndex: progressData.currentQuestionIndex,
        startTime: new Date(progressData.savedAt),
        status: 'in-progress'
      };

      setSession(resumedSession);
      return resumedSession;
    } catch (error) {
      console.error('Failed to resume assessment:', error);
      throw error;
    }
  }, [trackId]);

  // Get current question
  const currentQuestion = useMemo(() => {
    if (!session || session.currentQuestionIndex >= session.questions.length) {
      return null;
    }
    return session.questions[session.currentQuestionIndex];
  }, [session]);

  // Get assessment progress
  const progress = useMemo(() => {
    if (!session) return 0;
    
    const answeredQuestions = Object.keys(session.answers).length;
    return (answeredQuestions / session.questions.length) * 100;
  }, [session]);

  // Get assessment statistics
  const getAssessmentStats = useCallback(() => {
    if (!session) return null;

    const answeredQuestions = Object.keys(session.answers).length;
    const totalQuestions = session.questions.length;
    const timeElapsed = (new Date().getTime() - session.startTime.getTime()) / 1000;
    
    return {
      progress: Math.round((answeredQuestions / totalQuestions) * 100),
      questionsAnswered: answeredQuestions,
      totalQuestions,
      timeElapsed: Math.round(timeElapsed),
      averageTimePerQuestion: answeredQuestions > 0 ? Math.round(timeElapsed / answeredQuestions) : 0,
      questionsRemaining: totalQuestions - answeredQuestions
    };
  }, [session]);

  // Timer effect for timed assessments
  useEffect(() => {
    if (!session?.timeLimit || timeRemaining === null) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          // Time's up - auto-submit
          if (session.status === 'in-progress') {
            setSession(current => current ? { ...current, status: 'completed' } : null);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.timeLimit, timeRemaining, session?.status]);

  // Auto-save progress periodically
  useEffect(() => {
    if (!session || session.status !== 'in-progress') return;

    const interval = setInterval(() => {
      saveProgress();
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [session, saveProgress]);

  return {
    // State
    session,
    currentQuestion,
    timeRemaining,
    
    // Actions
    startAssessment,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    submitAssessment,
    saveProgress,
    resumeAssessment,
    
    // Computed
    progress,
    getAssessmentStats,
    
    // Derived state
    isActive: !!session && session.status === 'in-progress',
    isCompleted: session?.status === 'completed',
    isSubmitted: session?.status === 'submitted',
    canGoNext: session ? session.currentQuestionIndex < session.questions.length - 1 : false,
    canGoPrevious: session ? session.currentQuestionIndex > 0 : false,
    hasTimeLimit: !!session?.timeLimit,
    isCurrentQuestionAnswered: session && currentQuestion ? 
      !!session.answers[currentQuestion.id] : false
  };
}

// Helper functions
async function generateAssessmentQuestions(config: any): Promise<AssessmentQuestion[]> {
  // This would typically call an API to generate questions
  // For now, return mock questions
  return [
    {
      id: '1',
      type: 'multiple-choice',
      question: 'What is the primary purpose of React hooks?',
      options: [
        'To add styling to components',
        'To manage state and side effects in functional components',
        'To create class components',
        'To handle routing'
      ],
      correctAnswer: 1,
      points: 10,
      category: 'React',
      difficulty: 'medium'
    },
    // More questions would be generated based on config
  ];
}

function calculateAssessmentResults(session: AssessmentSession) {
  const answers = Object.values(session.answers);
  const questions = session.questions;
  
  let totalPoints = 0;
  let earnedPoints = 0;
  let correctAnswers = 0;

  questions.forEach(question => {
    totalPoints += question.points;
    const answer = session.answers[question.id];
    
    if (answer && question.correctAnswer !== undefined) {
      if (answer.answer === question.correctAnswer) {
        earnedPoints += question.points;
        correctAnswers++;
      }
    }
  });

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  
  return {
    totalQuestions: questions.length,
    correctAnswers,
    totalPoints,
    earnedPoints,
    percentage,
    grade: getGrade(percentage),
    timeSpent: (new Date().getTime() - session.startTime.getTime()) / 1000,
    categoryBreakdown: calculateCategoryBreakdown(questions, session.answers)
  };
}

function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

function calculateCategoryBreakdown(questions: AssessmentQuestion[], answers: Record<string, AssessmentAnswer>) {
  const categories: Record<string, { correct: number; total: number }> = {};
  
  questions.forEach(question => {
    if (!categories[question.category]) {
      categories[question.category] = { correct: 0, total: 0 };
    }
    
    categories[question.category].total++;
    
    const answer = answers[question.id];
    if (answer && answer.answer === question.correctAnswer) {
      categories[question.category].correct++;
    }
  });
  
  return Object.entries(categories).map(([category, stats]) => ({
    category,
    correct: stats.correct,
    total: stats.total,
    percentage: Math.round((stats.correct / stats.total) * 100)
  }));
}

async function checkAssessmentAchievements(results: any) {
  const store = useLearningStore.getState();
  
  // Check for various achievement criteria
  if (results.percentage >= 95) {
    store.unlockAchievement('perfect-score');
  }
  
  if (results.percentage >= 80) {
    store.unlockAchievement('high-achiever');
  }
  
  // First assessment completion
  if (store.learningStats.lessonsCompleted === 0) {
    store.unlockAchievement('first-assessment');
  }
}
```

## Testing Strategy

### Custom Hook Testing
```typescript
// src/features/ai-tutor/hooks/__tests__/useLearningProgress.test.ts
import { renderHook, act } from '@testing-library/react';
import { useLearningProgress } from '../useLearningProgress';
import { useLearningStore } from '../../stores/learningStore';
import { updateProgressAction } from '../../actions/learning-actions';

// Mock the store and actions
jest.mock('../../stores/learningStore');
jest.mock('../../actions/learning-actions');

const mockUseLearningStore = useLearningStore as jest.MockedFunction<typeof useLearningStore>;
const mockUpdateProgressAction = updateProgressAction as jest.MockedFunction<typeof updateProgressAction>;

describe('useLearningProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseLearningStore.mockReturnValue({
      trackProgress: { 'track-1': 50 },
      lessonProgress: {
        'track-1-lesson-1': {
          lessonId: 'lesson-1',
          trackId: 'track-1',
          userId: 'user-1',
          progress: 100,
          timeSpent: 30,
          startedAt: '2024-01-01T00:00:00Z',
          lastAccessedAt: '2024-01-01T00:30:00Z',
          completedAt: '2024-01-01T00:30:00Z',
          attempts: 1,
          bookmarked: false
        }
      },
      learningStats: {
        totalTimeSpent: 120,
        currentStreak: 5,
        longestStreak: 10,
        tracksCompleted: 2,
        lessonsCompleted: 15,
        skillsAcquired: ['React', 'JavaScript'],
        averageSessionTime: 45,
        preferredLearningTime: '18:00',
        completionRate: 75
      },
      updateLessonProgress: jest.fn(),
      completeLesson: jest.fn()
    } as any);
  });

  it('should return progress data for specific track', () => {
    const { result } = renderHook(() => useLearningProgress('track-1'));
    
    expect(result.current.progress).toEqual({
      trackProgress: 50,
      lessonsCompleted: 1,
      totalLessons: 1,
      averageTime: 30,
      lastActivity: expect.any(Number)
    });
  });

  it('should return overall progress when no track specified', () => {
    const { result } = renderHook(() => useLearningProgress());
    
    expect(result.current.progress).toEqual({
      overallProgress: 75,
      totalTimeSpent: 120,
      tracksCompleted: 2,
      lessonsCompleted: 15,
      currentStreak: 5
    });
  });

  it('should update lesson progress and sync with server', async () => {
    mockUpdateProgressAction.mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => useLearningProgress('track-1'));
    
    await act(async () => {
      await result.current.updateProgress('lesson-2', {
        progress: 75,
        timeSpent: 25,
        notes: 'Good lesson'
      });
    });

    expect(mockUseLearningStore().updateLessonProgress).toHaveBeenCalledWith(
      'track-1',
      'lesson-2',
      expect.objectContaining({
        progress: 75,
        timeSpent: 25,
        notes: 'Good lesson',
        lastAccessedAt: expect.any(String)
      })
    );

    expect(mockUpdateProgressAction).toHaveBeenCalledWith(
      null,
      expect.any(FormData)
    );
  });

  it('should handle progress update errors', async () => {
    mockUpdateProgressAction.mockResolvedValue({ 
      success: false, 
      error: 'Network error' 
    });
    
    const { result } = renderHook(() => useLearningProgress('track-1'));
    
    await act(async () => {
      await expect(
        result.current.updateProgress('lesson-2', { progress: 75 })
      ).rejects.toThrow('Network error');
    });
  });

  it('should complete lesson and trigger achievements check', async () => {
    mockUpdateProgressAction.mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => useLearningProgress('track-1'));
    
    await act(async () => {
      await result.current.markLessonComplete('lesson-2', {
        timeSpent: 35,
        notes: 'Completed successfully'
      });
    });

    expect(mockUseLearningStore().completeLesson).toHaveBeenCalledWith(
      'track-1',
      'lesson-2',
      expect.objectContaining({
        timeSpent: 35,
        notes: 'Completed successfully',
        completedAt: expect.any(String),
        progress: 100
      })
    );
  });

  it('should provide learning insights', () => {
    const { result } = renderHook(() => useLearningProgress('track-1'));
    
    const insights = result.current.getProgressInsights();
    
    expect(insights).toEqual({
      momentum: 'medium', // 50% progress
      suggestedSessionTime: 36, // 30 * 1.2
      estimatedCompletion: expect.any(String),
      strengths: expect.any(Array),
      improvements: expect.any(Array)
    });
  });

  it('should get next recommended lesson', () => {
    // Mock store to return track with lessons
    mockUseLearningStore.getState = jest.fn().mockReturnValue({
      getTrackById: jest.fn().mockReturnValue({
        id: 'track-1',
        lessons: [
          { id: 'lesson-1', title: 'Completed Lesson' },
          { id: 'lesson-2', title: 'Next Lesson' },
          { id: 'lesson-3', title: 'Future Lesson' }
        ]
      })
    });

    const { result } = renderHook(() => useLearningProgress('track-1'));
    
    const nextLesson = result.current.getNextLesson();
    
    expect(nextLesson).toEqual({
      id: 'lesson-2',
      title: 'Next Lesson'
    });
  });
});
```

### Business Logic Testing
```typescript
// src/features/ai-tutor/hooks/__tests__/useFlashcardReview.test.ts
import { renderHook, act } from '@testing-library/react';
import { useFlashcardReview } from '../useFlashcardReview';

describe('useFlashcardReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('should start review session with shuffled cards', () => {
    const { result } = renderHook(() => useFlashcardReview('track-1'));
    
    act(() => {
      result.current.startReview();
    });

    expect(result.current.isSessionActive).toBe(true);
    expect(result.current.currentCard).toBeDefined();
    expect(result.current.session?.cards).toHaveLength(expect.any(Number));
  });

  it('should answer cards and track progress', () => {
    const { result } = renderHook(() => useFlashcardReview('track-1'));
    
    act(() => {
      result.current.startReview();
    });

    const initialCard = result.current.currentCard;
    
    act(() => {
      result.current.answerCard(true); // Correct answer
    });

    expect(result.current.session?.reviewedCards).toContain(initialCard?.id);
    expect(result.current.session?.correctAnswers).toBe(1);
  });

  it('should move to next card after answering', () => {
    const { result } = renderHook(() => useFlashcardReview('track-1'));
    
    act(() => {
      result.current.startReview();
    });

    const firstCard = result.current.currentCard;
    
    act(() => {
      result.current.answerCard(true);
      result.current.nextCard();
    });

    const secondCard = result.current.currentCard;
    expect(secondCard?.id).not.toBe(firstCard?.id);
  });

  it('should complete session when all cards reviewed', async () => {
    const { result } = renderHook(() => useFlashcardReview('track-1'));
    
    act(() => {
      result.current.startReview();
    });

    const totalCards = result.current.session?.cards.length || 0;
    
    // Answer all cards
    for (let i = 0; i < totalCards; i++) {
      act(() => {
        result.current.answerCard(true);
        if (i < totalCards - 1) {
          result.current.nextCard();
        }
      });
    }

    // Complete session
    await act(async () => {
      const summary = await result.current.completeReviewSession();
      
      expect(summary).toEqual({
        cardsReviewed: totalCards,
        correctAnswers: totalCards,
        accuracy: 100,
        duration: expect.any(Number),
        nextReviewDate: expect.any(String)
      });
    });

    expect(result.current.isSessionActive).toBe(false);
  });

  it('should provide review statistics', () => {
    const { result } = renderHook(() => useFlashcardReview('track-1'));
    
    act(() => {
      result.current.startReview();
      result.current.answerCard(true);
    });

    const stats = result.current.getReviewStats();
    
    expect(stats).toEqual({
      progress: expect.any(Number),
      accuracy: expect.any(Number),
      cardsRemaining: expect.any(Number),
      timeElapsed: expect.any(Number)
    });
  });

  it('should implement spaced repetition algorithm', () => {
    const { result } = renderHook(() => useFlashcardReview('track-1'));
    
    // This would test the spaced repetition logic
    // More detailed testing would be needed for the algorithm
    expect(result.current.dueCards).toBeDefined();
  });
});
```

## Files to Create

### Hook Files
- `src/features/ai-tutor/hooks/useLearningProgress.ts`
- `src/features/ai-tutor/hooks/useFlashcardReview.ts`
- `src/features/ai-tutor/hooks/useChatManager.ts`
- `src/features/ai-tutor/hooks/useSkillAssessment.ts`
- `src/features/ai-tutor/hooks/useTrackSelection.ts`
- `src/features/ai-tutor/hooks/index.ts` (barrel export)

### Test Files
- `src/features/ai-tutor/hooks/__tests__/useLearningProgress.test.ts`
- `src/features/ai-tutor/hooks/__tests__/useFlashcardReview.test.ts`
- `src/features/ai-tutor/hooks/__tests__/useChatManager.test.ts`
- `src/features/ai-tutor/hooks/__tests__/useSkillAssessment.test.ts`

### Utility Files
- `src/features/ai-tutor/utils/spaced-repetition.ts`
- `src/features/ai-tutor/utils/assessment-scoring.ts`
- `src/features/ai-tutor/utils/learning-analytics.ts`

### Type Files
- `src/features/ai-tutor/types/assessment.ts`
- `src/features/ai-tutor/types/flashcard.ts`

## Files to Modify

### Component Updates
- Refactor components to use new custom hooks
- Remove business logic from components
- Simplify component interfaces

### Remove Business Logic
- Extract logic from all AI tutor components
- Move calculations and algorithms to hooks
- Centralize business rules

## Dependencies
**Blocks**: TASK-015 (Performance optimization), TASK-016 (E2E testing)  
**Blocked By**: TASK-009 (Chat store), TASK-010 (Learning store)  
**Related**: TASK-012 (Server Actions), TASK-017 (Accessibility)

## Definition of Done

### Technical Checklist
- [ ] All major business logic extracted to custom hooks
- [ ] Components simplified and focused on UI concerns
- [ ] Hooks are reusable across multiple components
- [ ] Proper error handling and loading states in all hooks
- [ ] Performance optimized with proper memoization
- [ ] All existing functionality preserved

### Quality Checklist
- [ ] >80% test coverage for all custom hooks
- [ ] Business logic thoroughly tested in isolation
- [ ] Hook integration tests validate component behavior
- [ ] Performance benchmarks show no regression
- [ ] Code review confirms clean separation of concerns

### Developer Experience Checklist
- [ ] Hooks have clear, intuitive APIs
- [ ] Comprehensive documentation for each hook
- [ ] Examples provided for common use cases
- [ ] TypeScript types are accurate and helpful
- [ ] Error messages are clear and actionable

## Estimated Timeline
- **Hook Design and Planning**: 4 hours
- **useLearningProgress Implementation**: 8 hours
- **useFlashcardReview Implementation**: 8 hours
- **useChatManager Implementation**: 6 hours
- **useSkillAssessment Implementation**: 10 hours
- **Testing (Unit + Integration)**: 10 hours
- **Component Refactoring**: 8 hours

**Total**: ~54 hours (6 story points)

## Success Metrics
- **Code Separation**: 90% of business logic moved to hooks
- **Component Size**: Average component size reduced by 40%
- **Reusability**: Hooks used in multiple components
- **Testability**: Business logic tested independently
- **Maintainability**: Easier to modify and extend features

## Risk Mitigation
- **Complex State Management**: Use proper memoization and optimization
- **Hook Dependencies**: Careful management of hook interdependencies
- **Performance Impact**: Monitor for unnecessary re-renders
- **API Changes**: Ensure hooks abstract API details properly

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Upon completion of state management migration tasks