import React from 'react'; // Needed for React.ReactNode type in LearningTrack
import { Message as AITutorMessage } from '@/features/ai-tutor/components/AITutorChat'; // For Message type
import { LearningTrack as ExplorationLearningTrack } from '@/features/ai-tutor/components/learning/TrackExplorationComponent';
import { SkillAssessment } from '@/features/ai-tutor/components/learning/SkillAssessmentComponent';
import { Flashcard } from '@/features/ai-tutor/components/learning/FlashcardReviewComponent'; // Assuming Flashcard interface is exported

// Consistent mock data factories

/**
 * Creates a mock AI Tutor message object.
 * Aligns with the Message interface from AITutorChat.
 */
export const createMockMessage = (overrides: Partial<AITutorMessage> = {}): AITutorMessage => ({
  id: `msg-${Math.random().toString(36).substr(2, 9)}`,
  content: 'Default test message content.',
  type: 'user',
  timestamp: new Date(),
  component: undefined, // Optional component
  ...overrides,
});

/**
 * Creates a mock Learning Track object.
 * Aligns with the LearningTrack interface from TrackExplorationComponent.
 */
export const createMockLearningTrack = (overrides: Partial<ExplorationLearningTrack> = {}): ExplorationLearningTrack => ({
  id: `track-${Math.random().toString(36).substr(2, 9)}`,
  title: 'Default Test Track',
  description: 'A comprehensive description for the default test track.',
  icon: React.createElement('svg', { 'data-testid': 'mock-track-icon' }), // Default mock icon
  progress: 0,
  difficulty: 'Beginner',
  duration: '4 weeks',
  skills: ['Skill 1', 'Skill 2', 'Skill 3'],
  ...overrides,
});

/**
 * Creates a mock Skill object for SkillAssessment.
 */
export const createMockSkillAssessmentItem = (overrides: Partial<SkillAssessment> = {}): SkillAssessment => ({
  skill: 'Default Skill',
  level: 3, // Intermediate by default
  ...overrides,
});

/**
 * Creates a mock Flashcard object.
 */
export const createMockFlashcard = (overrides: Partial<Flashcard> = {}): Flashcard => ({
  question: 'What is a default question?',
  answer: 'This is a default answer to the question.',
  track: 'Default Track',
  difficulty: 'Medium',
  ...overrides,
});

/**
 * Creates a mock Learning Preferences object.
 */
export interface MockLearningPreferences {
  timeAvailability: number;
  learningStyle: string;
  goals: string[];
}
export const createMockLearningPreference = (overrides: Partial<MockLearningPreferences> = {}): MockLearningPreferences => ({
  timeAvailability: 10, // hours per week
  learningStyle: 'visual', // Default style
  goals: ['Learn for fun'], // Default goal
  ...overrides,
});

/**
 * Creates a mock Achievement object (as used in ProgressDashboardComponent).
 */
export interface MockAchievement {
  id: string;
  text: string;
  iconTestId: string; // For referencing mocked icons in tests
  date: string;
}
export const createMockAchievement = (overrides: Partial<MockAchievement> = {}): MockAchievement => ({
  id: `ach-${Math.random().toString(36).substr(2, 9)}`,
  text: 'Default Achievement Text',
  iconTestId: 'mock-achievement-icon',
  date: '1 day ago',
  ...overrides,
});
