// src/features/ai-tutor/components/index.ts
export { default as AITutorChat } from './AITutorChat';
export { default as AITutorChatWithActions } from './AITutorChatWithActions';
export type { Message } from './AITutorChat'; // Export the Message interface
export { default as HomePageComponent } from './HomePageComponent';

// Chat components - existing
export { ChatContainer } from './chat/ChatContainer';
export { MessageInput } from './chat/MessageInput';
export { MessageInputWithActions } from './chat/MessageInputWithActions';

// Chat components - TASK-007 Optimistic Updates
export { OptimisticMessageList } from './chat/OptimisticMessageList';
export { OptimisticMessageInput } from './chat/OptimisticMessageInput';
export { EnhancedMessageBubble } from './chat/EnhancedMessageBubble';

// Chat types
export type { 
  Message as ChatMessage,
  OptimisticMessage,
  MessageStatus,
  TabType,
  QuickAction,
  OptimisticMessageListProps,
  OptimisticMessageInputProps,
  MessageBubbleProps
} from './chat/types';

// Learning components
export { TrackExplorationComponent } from './learning/TrackExplorationComponent';
export { TrackExplorationWrapper } from './learning/TrackExplorationWrapper';
export { SkillAssessmentComponent } from './learning/SkillAssessmentComponent';
export { FlashcardReviewComponent } from './learning/FlashcardReviewComponent';
export { InteractiveLessonComponent } from './learning/InteractiveLessonComponent';

// Dashboard components
export { ProgressDashboardComponent } from './dashboard/ProgressDashboardComponent';
export { LearningPreferencesComponent } from './dashboard/LearningPreferencesComponent';
