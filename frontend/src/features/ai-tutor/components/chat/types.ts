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