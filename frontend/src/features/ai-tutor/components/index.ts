// src/features/ai-tutor/components/index.ts
export { default as AITutorChat } from './AITutorChat';
export type { Message } from './AITutorChat'; // Export the Message interface
export { default as HomePageComponent } from './HomePageComponent';

// Learning components
export { TrackExplorationComponent } from './learning/TrackExplorationComponent';
export { SkillAssessmentComponent } from './learning/SkillAssessmentComponent';
export { FlashcardReviewComponent } from './learning/FlashcardReviewComponent';
export { InteractiveLessonComponent } from './learning/InteractiveLessonComponent';

// Dashboard components
export { ProgressDashboardComponent } from './dashboard/ProgressDashboardComponent';
export { LearningPreferencesComponent } from './dashboard/LearningPreferencesComponent';
