export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type TabType = 'home' | 'progress' | 'review' | 'explore';

export interface MessageActionState {
  success: boolean;
  error: string | null;
  isLoading: boolean;
  message: Message | null;
}

export interface SendMessageRequest {
  message: string;
  tabType: TabType;
  timestamp: string;
}

export interface SendMessageResponse extends Message {}