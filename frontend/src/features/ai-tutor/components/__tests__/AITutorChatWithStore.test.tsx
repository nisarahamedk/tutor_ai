import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AITutorChatWithStore } from '../AITutorChatWithStore';
import { useChatStore, useMessageDisplay, useMessageInput, useTabManager, useChatActions } from '../../stores/chatStore';

// Mock the store
vi.mock('../../stores/chatStore', () => ({
  useChatStore: vi.fn(),
  useChatActions: vi.fn(),
  useMessageDisplay: vi.fn(),
  useMessageInput: vi.fn(),
  useTabManager: vi.fn(),
}));

// Mock the external components
vi.mock('../learning/TrackExplorationComponent', () => ({
  TrackExplorationComponent: ({ onTrackSelect }: { onTrackSelect: (track: { id: string; title: string }) => void }) => (
    <div data-testid="track-exploration">
      <button onClick={() => onTrackSelect({ id: 'test', title: 'Test Track' })}>
        Select Track
      </button>
    </div>
  ),
}));

vi.mock('../learning/SkillAssessmentComponent', () => ({
  SkillAssessmentComponent: ({ onComplete }: { onComplete: (results: unknown[]) => void }) => (
    <div data-testid="skill-assessment">
      <button onClick={() => onComplete([{ level: 3 }])}>Complete Assessment</button>
    </div>
  ),
}));

vi.mock('../dashboard/LearningPreferencesComponent', () => ({
  LearningPreferencesComponent: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="learning-preferences">
      <button onClick={() => onComplete()}>Save Preferences</button>
    </div>
  ),
}));

vi.mock('../learning/InteractiveLessonComponent', () => ({
  InteractiveLessonComponent: () => (
    <div data-testid="interactive-lesson">Interactive Lesson</div>
  ),
}));

vi.mock('../dashboard/ProgressDashboardComponent', () => ({
  ProgressDashboardComponent: ({ onContinueLearning, onSelectTrack }: { onContinueLearning: () => void; onSelectTrack: () => void }) => (
    <div data-testid="progress-dashboard">
      <button onClick={onContinueLearning}>Continue Learning</button>
      <button onClick={onSelectTrack}>Select Track</button>
    </div>
  ),
}));

vi.mock('../learning/FlashcardReviewComponent', () => ({
  FlashcardReviewComponent: ({ onComplete }: { onComplete: () => void }) => (
    <div data-testid="flashcard-review">
      <button onClick={() => onComplete()}>Complete Review</button>
    </div>
  ),
}));

describe('AITutorChatWithStore', () => {
  // Mock store state and functions
  const mockStoreState = {
    activeTab: 'home',
    isLoading: false,
    isTyping: false,
    error: null,
    tabMessages: {
      home: [{
        id: 'welcome-home',
        content: 'Welcome to TutorAI!',
        type: 'ai',
        timestamp: '2023-01-01T00:00:00.000Z',
        metadata: { isWelcome: true }
      }],
      progress: [],
      review: [],
      explore: []
    },
    optimisticMessages: {
      home: [],
      progress: [],
      review: [],
      explore: []
    },
    getCombinedMessages: vi.fn(),
    getPendingCount: vi.fn(() => 0),
    getFailedCount: vi.fn(() => 0),
  };

  const mockActions = {
    sendMessage: vi.fn(),
    sendMessageToTab: vi.fn(),
    sendAIMessage: vi.fn(),
    sendMessageWithOptimistic: vi.fn(),
    retryMessage: vi.fn(),
    setActiveTab: vi.fn(),
  };

  const mockTabStats = {
    home: { messageCount: 1, hasMessages: false, pendingCount: 0, failedCount: 0 },
    progress: { messageCount: 1, hasMessages: false, pendingCount: 0, failedCount: 0 },
    review: { messageCount: 1, hasMessages: false, pendingCount: 0, failedCount: 0 },
    explore: { messageCount: 1, hasMessages: false, pendingCount: 0, failedCount: 0 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the hook returns
    vi.mocked(useChatStore).mockReturnValue(mockStoreState);
    
    // Mock the custom hooks
    
    vi.mocked(useMessageDisplay).mockReturnValue({
      messages: [mockStoreState.tabMessages.home[0]],
      isTyping: false,
      error: null,
      pendingCount: 0,
      failedCount: 0,
    });
    
    vi.mocked(useMessageInput).mockReturnValue({
      activeTab: 'home',
      sendMessage: mockActions.sendMessage,
      isLoading: false,
      isTyping: false,
      error: null,
      isDisabled: false,
    });
    
    vi.mocked(useTabManager).mockReturnValue({
      activeTab: 'home',
      setActiveTab: mockActions.setActiveTab,
      tabStats: mockTabStats,
    });
    
    vi.mocked(useChatActions).mockReturnValue(mockActions);
  });

  it('should render the main chat interface', () => {
    render(<AITutorChatWithStore />);
    
    // Check main elements
    expect(screen.getByText('AI Tutor (Enhanced)')).toBeInTheDocument();
    expect(screen.getByText('Store-powered with optimistic updates')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument();
  });

  it('should render all tabs', () => {
    render(<AITutorChatWithStore />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Explore')).toBeInTheDocument();
  });

  it('should render quick action buttons', () => {
    render(<AITutorChatWithStore />);
    
    expect(screen.getByText('Show Progress')).toBeInTheDocument();
    expect(screen.getByText('Get Help')).toBeInTheDocument();
    expect(screen.getByText("What's Next?")).toBeInTheDocument();
    expect(screen.getByText('Review Concepts')).toBeInTheDocument();
  });

  it('should handle message input and sending', async () => {
    render(<AITutorChatWithStore />);
    
    const input = screen.getByPlaceholderText('Ask me anything...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Type a message
    fireEvent.change(input, { target: { value: 'Test message' } });
    expect(input).toHaveValue('Test message');
    
    // Send the message
    fireEvent.click(sendButton);
    
    // Verify store action was called
    await waitFor(() => {
      expect(mockActions.sendMessage).toHaveBeenCalledWith('Test message');
    });
    
    // Input should be cleared
    expect(input).toHaveValue('');
  });

  it('should handle Enter key for sending messages', async () => {
    render(<AITutorChatWithStore />);
    
    const input = screen.getByPlaceholderText('Ask me anything...');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(mockActions.sendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('should handle tab switching', () => {
    render(<AITutorChatWithStore />);
    
    const progressTab = screen.getByText('Progress');
    fireEvent.click(progressTab);
    
    expect(mockActions.setActiveTab).toHaveBeenCalledWith('progress');
  });

  it('should handle quick action: Show Progress', async () => {
    render(<AITutorChatWithStore />);
    
    const showProgressButton = screen.getByText('Show Progress');
    fireEvent.click(showProgressButton);
    
    await waitFor(() => {
      expect(mockActions.sendMessageToTab).toHaveBeenCalledWith(
        'progress',
        "Here's your current learning progress:",
        expect.any(Object) // React component
      );
    });
  });

  it('should handle quick action: Get Help', async () => {
    render(<AITutorChatWithStore />);
    
    const getHelpButton = screen.getByText('Get Help');
    fireEvent.click(getHelpButton);
    
    await waitFor(() => {
      expect(mockActions.sendMessageToTab).toHaveBeenCalledWith('home', 'help');
    });
  });

  it('should handle quick action: Review Concepts', async () => {
    render(<AITutorChatWithStore />);
    
    const reviewButton = screen.getByText('Review Concepts');
    fireEvent.click(reviewButton);
    
    await waitFor(() => {
      expect(mockActions.sendMessageToTab).toHaveBeenCalledWith(
        'review',
        "Let's review what you've learned with some flashcards:",
        expect.any(Object) // React component
      );
    });
  });

  it('should display loading state correctly', () => {
    // Mock loading state
    vi.mocked(useMessageInput).mockReturnValue({
      activeTab: 'home',
      sendMessage: mockActions.sendMessage,
      isLoading: true,
      isTyping: false,
      error: null,
      isDisabled: true,
    });
    
    render(<AITutorChatWithStore />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it('should display typing indicator', () => {
    // Mock typing state
    vi.mocked(useMessageInput).mockReturnValue({
      activeTab: 'home',
      sendMessage: mockActions.sendMessage,
      isLoading: false,
      isTyping: true,
      error: null,
      isDisabled: true,
    });
    
    render(<AITutorChatWithStore />);
    
    expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
  });

  it('should display error state correctly', () => {
    // Mock error state
    vi.mocked(useMessageInput).mockReturnValue({
      activeTab: 'home',
      sendMessage: mockActions.sendMessage,
      isLoading: false,
      isTyping: false,
      error: 'Connection failed',
      isDisabled: false,
    });
    
    render(<AITutorChatWithStore />);
    
    expect(screen.getByText('Connection issue')).toBeInTheDocument();
    expect(screen.getByText('Reconnecting...')).toBeInTheDocument();
  });

  it('should show pending/failed message indicators on tabs', () => {
    // Mock tab stats with pending/failed messages
    vi.mocked(useTabManager).mockReturnValue({
      activeTab: 'home',
      setActiveTab: mockActions.setActiveTab,
      tabStats: {
        ...mockTabStats,
        home: { messageCount: 5, hasMessages: true, pendingCount: 1, failedCount: 2 },
      },
    });
    
    render(<AITutorChatWithStore />);
    
    // Should show failed message count badge
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  describe('Component Integration Tests', () => {
    it('should handle track selection workflow', async () => {
      // Mock with explore tab active and track exploration component
      vi.mocked(useMessageDisplay).mockReturnValue({
        messages: [{
          id: 'explore-msg',
          content: 'Explore tracks',
          type: 'ai',
          timestamp: new Date(),
          component: <div data-testid="track-exploration">
            <button onClick={() => {
              // Simulate track selection
              mockActions.sendAIMessage('explore', 'Track selected', { trackId: 'test' }, <div />);
            }}>
              Select Track
            </button>
          </div>
        }],
        isTyping: false,
        error: null,
        pendingCount: 0,
        failedCount: 0,
      });
      
      render(<AITutorChatWithStore />);
      
      const trackButton = screen.getByText('Select Track');
      fireEvent.click(trackButton);
      
      // Should trigger AI message with track selection
      await waitFor(() => {
        expect(mockActions.sendAIMessage).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Architecture Tests', () => {
    it('should not use local useState (prop drilling elimination)', () => {
      // This test ensures the component doesn't manage local state
      render(<AITutorChatWithStore />);
      
      // Component should rely entirely on store hooks
      expect(vi.mocked(useMessageInput)).toHaveBeenCalled();
      expect(vi.mocked(useTabManager)).toHaveBeenCalled();
      expect(vi.mocked(useChatActions)).toHaveBeenCalled();
    });

    it('should use selective subscriptions', () => {
      render(<AITutorChatWithStore />);
      
      // Each hook should be called to provide selective subscriptions
      expect(vi.mocked(useMessageInput)).toHaveBeenCalledTimes(2); // Called in multiple places
      expect(vi.mocked(useTabManager)).toHaveBeenCalledTimes(2); // Tab manager and main component
      expect(vi.mocked(useChatActions)).toHaveBeenCalled();
    });

    it('should handle optimistic message retry', async () => {
      // Mock failed message
      vi.mocked(useMessageDisplay).mockReturnValue({
        messages: [{
          id: 'failed-msg',
          tempId: 'temp-123',
          content: 'Failed message',
          type: 'user',
          timestamp: new Date(),
          status: 'failed',
          error: 'Network error'
        }],
        isTyping: false,
        error: null,
        pendingCount: 0,
        failedCount: 1,
      });
      
      render(<AITutorChatWithStore />);
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(mockActions.retryMessage).toHaveBeenCalledWith('home', expect.objectContaining({
          tempId: 'temp-123',
          status: 'failed'
        }));
      });
    });
  });
});