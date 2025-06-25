// src/features/ai-tutor/components/chat/types.ts
// Shared types for chat components

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  component?: React.ReactNode;
}

export type TabType = 'home' | 'progress' | 'review' | 'explore';

export interface QuickAction {
  icon: React.ComponentType;
  label: string;
  action: () => void;
  loading?: boolean;
}

export interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType;
  disabled?: boolean;
}

// Optimistic Message Types for TASK-007
export type MessageStatus = 'pending' | 'sent' | 'failed';

export interface OptimisticMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  status: MessageStatus;
  tempId?: string; // Temporary ID for optimistic updates
  error?: string; // Error message if failed
  retrying?: boolean; // If message is being retried
  component?: React.ReactNode;
  metadata?: Record<string, any>;
}

export interface OptimisticMessageState {
  messages: OptimisticMessage[];
  pendingCount: number;
  failedCount: number;
}

// Component Props Interfaces

export interface ChatContainerProps {
  children: React.ReactNode;
  isTyping?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
  className?: string;
}

export interface TabManagerProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  children: React.ReactNode;
  className?: string;
}

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isTyping?: boolean;
  onRetry?: () => void;
  className?: string;
}

export interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  quickActions?: QuickAction[];
  className?: string;
}

// Optimistic Component Props for TASK-007

export interface OptimisticMessageListProps {
  messages: OptimisticMessage[];
  onRetry?: (message: OptimisticMessage) => void;
  isTyping?: boolean;
  className?: string;
}

export interface OptimisticMessageInputProps {
  onSendMessage: (content: string, optimisticMessage: OptimisticMessage) => Promise<void>;
  activeTab: TabType;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  error?: string | null;
  multiline?: boolean;
  className?: string;
}

export interface MessageBubbleProps {
  message: OptimisticMessage;
  onRetry?: (message: OptimisticMessage) => void;
  className?: string;
}

// Hook return types

export interface UseOptimisticRetryResult {
  retryMessage: (message: OptimisticMessage) => Promise<void>;
  isRetrying: (messageId: string) => boolean;
  retryCount: (messageId: string) => number;
  clearRetryState: (messageId: string) => void;
}

export interface UseBatchOptimisticResult {
  optimisticMessages: OptimisticMessage[];
  addOptimisticMessage: (message: Omit<OptimisticMessage, 'id' | 'timestamp'>) => OptimisticMessage;
  updateMessageStatus: (tempId: string, status: MessageStatus, error?: string) => void;
  removeOptimisticMessage: (tempId: string) => void;
  batchUpdateMessages: (updates: Array<{ tempId: string; status: MessageStatus; error?: string }>) => void;
}