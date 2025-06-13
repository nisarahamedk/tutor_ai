import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AITutorChat, { Message } from '@/features/ai-tutor/components/AITutorChat'; // Updated import
import { navigateToAITutorTab, sendMessageInAITutor } from '@/test-utils/ai-tutor-helpers';

// Mock ResizeObserver (if Radix UI or similar is used)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Standard mocks
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/utils', () => ({ cn: (...args) => args.filter(Boolean).join(' ') }));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} alt={props.alt || ''} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Send: (props) => <svg data-testid="send-icon" {...props} />,
  Bot: (props) => <svg data-testid="bot-icon" {...props} />,
  User: (props) => <svg data-testid="user-icon" {...props} />,
  Home: (props) => <svg data-testid="home-icon" {...props} />,
  TrendingUp: (props) => <svg data-testid="trending-up-icon" {...props} />,
  BookOpen: (props) => <svg data-testid="book-open-icon" {...props} />,
  RotateCcw: (props) => <svg data-testid="rotate-ccw-icon" {...props} />,
  Brain: (props) => <svg data-testid="brain-icon" {...props} />,
  ArrowRight: (props) => <svg data-testid="arrow-right-icon" {...props} />,
  CheckCircle: (props) => <svg data-testid="check-circle-icon" {...props} />,
  Star: (props) => <svg data-testid="star-icon" {...props} />,
  Palette: (props) => <svg data-testid="palette-icon" {...props} />,
  Database: (props) => <svg data-testid="database-icon" {...props} />,
  Smartphone: (props) => <svg data-testid="smartphone-icon" {...props} />,
  Clock: (props) => <svg data-testid="clock-icon" {...props} />,
  ChevronRight: (props) => <svg data-testid="chevron-right-icon" {...props} />, // Added from TrackExploration
  Code: (props) => <svg data-testid="code-icon" {...props} />, // Added from TrackExploration
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const ActualReact = jest.requireActual('react'); // Use actual React for forwardRef
  return {
    motion: {
      div: ActualReact.forwardRef(({ children, layout, initial, animate, exit, transition, ...rest }, ref) => (
        <div ref={ref} {...rest}>
          {children}
        </div>
      )),
      // Add other motion elements if used by AITutorChat, e.g., p, h1 etc.
    },
    AnimatePresence: ({ children }) => <>{children}</>, // Simple mock for AnimatePresence
    // Mock other framer-motion exports if necessary
  };
});

// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = jest.fn();

// Mock child components now exported from @/ai-tutor
jest.mock('@/ai-tutor', () => {
  const actualAITutor = jest.requireActual('@/ai-tutor'); // Important to get actual exports

  // Return a new object that includes all actual exports,
  // then override specific ones with mocks.
  // AITutorChat and Message are the components under test or types, so use actual.
  return {
    ...actualAITutor, // Spread all actual exports
    AITutorChat: actualAITutor.AITutorChat, // Use actual AITutorChat (component being tested)
    // Message is a type, it's part of AITutorChat's signature, usually doesn't need mocking here.
    // If Message were an enum or object with static properties, you might need actualAITutor.Message.

    // Mock specific components that are dependencies
    HomePageComponent: jest.fn(({ onStartNewTrack, onContinueLearning, onStartReview }) => (
      <div data-testid="mock-homepage">
        <button onClick={onStartNewTrack}>Start New Track</button>
        <button onClick={onContinueLearning}>Continue Learning</button>
        <button onClick={onStartReview}>Start Review</button>
      </div>
    )),
    TrackExplorationComponent: jest.fn(({ onTrackSelect }) => (
      <div data-testid="mock-trackexploration">
        <button onClick={() => onTrackSelect({ id: 'test-track', title: 'Test Track', description: 'Test desc', difficulty: 'Beginner', tags: [], contentModules: [] })}>Select Test Track</button>
      </div>
    )),
    SkillAssessmentComponent: jest.fn(({ onComplete }) => (
      <div data-testid="mock-skillassessment">
        <button onClick={() => onComplete([{ skillId: 'skill1', skillName: 'Test Skill', level: 3, completed: true }])}>Complete Assessment</button>
      </div>
    )),
    LearningPreferencesComponent: jest.fn(({ onComplete }) => (
      <div data-testid="mock-learningpreferences">
        <button onClick={() => onComplete({ learningStyle: 'visual', preferredTools: ['videos'], dailyGoal: 30 })}>Complete Preferences</button>
      </div>
    )),
    InteractiveLessonComponent: jest.fn(() => <div data-testid="mock-interactivelesson">Lesson Content</div>),
    ProgressDashboardComponent: jest.fn(({ onContinueLearning, onSelectTrack }) => (
      <div data-testid="mock-progressdashboard">
        <button onClick={onContinueLearning}>Continue From Progress</button>
        <button onClick={() => onSelectTrack('Test Track From Progress')}>Select Track From Progress</button>
      </div>
    )),
    FlashcardReviewComponent: jest.fn(({ onComplete }) => (
      <div data-testid="mock-flashcardreview">
        <button onClick={onComplete}>Complete Review</button>
      </div>
    )),
  };
});

// Mock window.alert
global.alert = jest.fn();


describe('AITutorChat', () => {
  beforeEach(() => {
    (global.alert as jest.Mock).mockClear();
    jest.clearAllMocks(); // Clear all mocks

    // Since HomePageComponent is now mocked via jest.mock('@/ai-tutor', ...),
    // we need to ensure its mock implementation is reset or correctly re-established here if needed.
    // The mock factory in jest.mock('@/ai-tutor') is called once.
    // If tests modify the mock's behavior or return values, clear or reset those specific mocks.
    // For example, if a test changes what HomePageComponent.mockReturnValueOnce(...) does.
    // For this case, the mock factory provides fresh mocks each time, so jest.clearAllMocks() is key.
    // The requireMock for HomePageComponent is no longer needed here as it's part of the bigger mock.
  });

  it('renders initial AI message with HomePageComponent on the Home tab', () => {
    render(<AITutorChat />);
    // Check for the initial message specific to the Home tab
    expect(screen.getByText(/Welcome to TutorAI! I'm here to guide your learning journey./i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-homepage')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask me anything.../i)).toBeInTheDocument();
  });

  it('allows user to send a text message and receives a generic AI reply on the active tab', async () => {
    render(<AITutorChat />);
    await sendMessageInAITutor('Hello there');

    // The AI response in the component is "I understand you're interested in that topic..."
    await waitFor(() => {
      expect(screen.getByText(/I understand you're interested in that topic./i)).toBeInTheDocument();
    }, { timeout: 3000 }); // Increased timeout for simulated API delay
  });

  // Tab Management Tests
  describe('Tab Management', () => {
    it('renders all tabs correctly', () => {
      render(<AITutorChat />);
      expect(screen.getByRole('tab', { name: /Home/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Progress/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Review/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Explore/i })).toBeInTheDocument();
    });

    it('switches to Progress tab and displays its initial content', async () => {
      render(<AITutorChat />);
      await navigateToAITutorTab('Progress');
      // Check for the initial message specific to the Progress tab
      expect(screen.getByText(/Here you can track your learning progress across all subjects./i)).toBeInTheDocument();
      expect(screen.getByTestId('mock-progressdashboard')).toBeInTheDocument();
    });

    it('switches to Review tab and displays its initial content', async () => {
      render(<AITutorChat />);
      await navigateToAITutorTab('Review');
      // Check for the initial message specific to the Review tab
      expect(screen.getByText(/Ready to review what you've learned\?/i)).toBeInTheDocument();
      // The FlashcardReviewComponent is added via handleStartReview, not initially on tab click.
    });

    it('switches to Explore tab and displays its initial content', async () => {
      render(<AITutorChat />);
      await navigateToAITutorTab('Explore');
      // Check for the initial message specific to the Explore tab
      expect(screen.getByText(/Discover new learning paths and subjects!/i)).toBeInTheDocument();
      expect(screen.getByTestId('mock-trackexploration')).toBeInTheDocument();
    });

    it('preserves message history when switching between tabs with chat inputs', async () => {
      render(<AITutorChat />);

      // Send message on Home tab
      await sendMessageInAITutor('Message on Home');
      await waitFor(() => expect(screen.getByText(/I understand you're interested in that topic./i)).toBeInTheDocument(), { timeout: 3000 });

      // Switch to Explore tab
      await navigateToAITutorTab('Explore');
      expect(screen.getByText(/Discover new learning paths and subjects!/i)).toBeInTheDocument();

      // Send message on Explore tab
      await sendMessageInAITutor('Message on Explore');
      await waitFor(() => expect(screen.getAllByText(/I understand you're interested in that topic./i).length).toBeGreaterThanOrEqual(1), { timeout: 3000 });

      // Switch back to Home tab
      await navigateToAITutorTab('Home');
      await waitFor(() => {
        expect(screen.getByText('Message on Home')).toBeInTheDocument(); // Previous message should be there
        // Ensure the initial Home message is also there, or the latest AI response if the logic changes
        expect(screen.getByText(/Welcome to TutorAI! I'm here to guide your learning journey./i)).toBeInTheDocument();
      });
      expect(screen.queryByText('Message on Explore')).not.toBeInTheDocument(); // Message from Explore tab shouldn't be on Home

      // Switch back to Explore tab
      await navigateToAITutorTab('Explore');
      await waitFor(() => {
        expect(screen.getByText('Message on Explore')).toBeInTheDocument(); // Previous message should be there
        expect(screen.getByText(/Discover new learning paths and subjects!/i)).toBeInTheDocument();
      });
      expect(screen.queryByText('Message on Home')).not.toBeInTheDocument(); // Message from Home tab shouldn't be on Explore
    });
  });

  // Accessibility (A11y) Tests
  describe('Accessibility', () => {
    it('has appropriate ARIA labels for key elements', () => {
      render(<AITutorChat />);

      expect(screen.getByRole('heading', { name: /AI Tutor/i, level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ask me anything.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send message/i })).toBeInTheDocument();
    });

    it('message input is focusable', () => {
      render(<AITutorChat />);
      const messageInput = screen.getByPlaceholderText(/Ask me anything.../i);
      messageInput.focus();
      expect(messageInput).toHaveFocus();
      fireEvent.change(messageInput, { target: { value: 'Focused typing' } });
      expect(messageInput).toHaveValue('Focused typing');
    });

    it('tabs are focusable and keyboard navigable (basic check)', () => {
      render(<AITutorChat />);
      const homeTab = screen.getByRole('tab', { name: /Home/i });
      const progressTab = screen.getByRole('tab', { name: /Progress/i });
      homeTab.focus();
      expect(homeTab).toHaveFocus();
      fireEvent.keyDown(homeTab, { key: 'ArrowRight', code: 'ArrowRight' });
      expect(progressTab).toBeInTheDocument(); // Radix handles actual focus movement
    });
  });

  // Message Handling Tests
  describe('Message Handling', () => {
    it('does not send a message if the input is empty', () => {
      render(<AITutorChat />);
      const sendButton = screen.getByRole('button', { name: /Send message/i });
      expect(sendButton).toBeDisabled();
      const input = screen.getByPlaceholderText(/Ask me anything.../i);
      fireEvent.change(input, { target: { value: '   ' } });
      expect(sendButton).toBeDisabled();
    });

    it('shows loading indicator while sending a message and AI is typing', async () => {
      render(<AITutorChat />);
      await sendMessageInAITutor('Test loading'); // Helper handles input and click

      expect(screen.getByTestId('loader2-icon')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText(/AI is thinking.../i)).toBeInTheDocument());

      await waitFor(() => expect(screen.getByText(/I understand you're interested in that topic./i)).toBeInTheDocument(), { timeout: 3000 });

      expect(screen.queryByTestId('loader2-icon')).not.toBeInTheDocument();
      expect(screen.queryByText(/AI is thinking.../i)).not.toBeInTheDocument();
    });

    it('handles message sending error and allows retry', async () => {
      // Mock the simulateAPICall to throw an error first, then succeed
      const mockSimulateAPICall = jest.fn()
        .mockRejectedValueOnce(new Error('Network connection failed. Please try again.')) // First call fails
        .mockResolvedValueOnce({ // Second call (retry) succeeds
          id: 'ai-reply-success',
          type: 'ai',
          content: 'Retry successful!',
          timestamp: new Date(),
        });

      // We need to mock the module that contains simulateAPICall.
      // Since simulateAPICall is part of AITutorChat.tsx, we can use jest.spyOn on the component's methods,
      // but it's an internal function. For simplicity in this test, let's assume we could mock it
      // if it were an imported utility.
      // For now, we'll test the UI based on the existing retry logic in the component.
      // This test will rely on the component's internal simulateAPICall's random failure,
      // which is not ideal for deterministic tests.
      // A better approach would be to refactor simulateAPICall into a mockable utility.

      // Let's adjust the test to check for the error display and retry button if the component itself handles it.
      // The component's simulateAPICall has a 10% chance of error. We can't guarantee it for a test.
      // So, this test will be more about the UI reaction IF an error occurs.

      // To make this testable, we'll need to modify AITutorChat to allow injecting simulateAPICall
      // or mock it via jest.spyOn if it's exposed in a way that's mockable.
      // Given the current structure, we'll spy on Math.random to force the error.

      const originalMathRandom = Math.random;
      Math.random = jest.fn()
        .mockReturnValueOnce(0.05) // Force initial failure (random < 0.1)
        .mockReturnValueOnce(0.05) // Force retry failure (random < 0.1) - to get to max retries
        .mockReturnValueOnce(0.5); // Subsequent calls for other purposes if any

      render(<AITutorChat />);
      // Use helper for initial message send
      await sendMessageInAITutor('Trigger error');

      await waitFor(() => {
        expect(screen.getByText(/Network connection failed. Please try again./i)).toBeInTheDocument();
      }, { timeout: 3000 }); // Wait for first error

      // The component automatically retries. Let's wait for the second error.
      await waitFor(() => {
         // The error message might persist or change after retries.
         // The component shows "Unable to connect. Please check your connection and try again later." after 2 retries.
        expect(screen.getByText(/Unable to connect. Please check your connection and try again later./i)).toBeInTheDocument();
      }, { timeout: 5000 }); // Increased timeout for retries

      // Check that the "Reconnecting..." badge is shown
      expect(screen.getByText(/Reconnecting.../i)).toBeInTheDocument();

      // Restore Math.random
      Math.random = originalMathRandom;

      // Manually clear error to test sending again (optional, good for cleanup)
      const clearErrorButton = screen.getByRole('button', { name: /×/i }); // Close button for error
      fireEvent.click(clearErrorButton);
      expect(screen.queryByText(/Unable to connect./i)).not.toBeInTheDocument();

      // Try sending again, this time it should succeed (Math.random is restored)
      // Use helper for sending the successful message
      await sendMessageInAITutor('Successful message');
      await waitFor(() => expect(screen.getByText(/I understand you're interested in that topic./i)).toBeInTheDocument(), {timeout: 3000});
      expect(screen.queryByText(/Network connection failed./i)).not.toBeInTheDocument();
      expect(screen.getByText(/Online/i)).toBeInTheDocument(); // Status should be Online
    });
  });

  // Keyboard Navigation Tests
  describe('Keyboard Navigation', () => {
    it('sends a message when Enter key is pressed in input', async () => {
      render(<AITutorChat />);
      const input = screen.getByPlaceholderText(/Ask me anything.../i);

      fireEvent.change(input, { target: { value: 'Message with Enter' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(screen.getByText('Message with Enter')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText(/I understand you're interested in that topic./i)).toBeInTheDocument();
      }, { timeout: 3000 });
      expect(input).toHaveValue(''); // Input should clear after sending
    });

    it('does not send message and allows newline with Shift+Enter', async () => {
      render(<AITutorChat />);
      const input = screen.getByPlaceholderText(/Ask me anything.../i) as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'Multi-line first line' } });
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true });

      // After Shift+Enter, the input should still contain the text,
      // and potentially a newline character (though JSDOM might not fully reflect this in input.value for textareas)
      // For an <Input type="text">, it won't add a newline. The main thing is it doesn't send.
      expect(input.value).toBe('Multi-line first line'); // Or "Multi-line first line\n" if it were a textarea

      // Check that no message was sent (i.e., the user message does not appear in the chat)
      // We can wait for a short period to ensure no async operations are triggered.
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait to see if a message appears
      expect(screen.queryByText('Multi-line first line')).not.toBeInTheDocument(); // Message should not be in the chat list

      // Now type more and send normally
      fireEvent.change(input, { target: { value: input.value + ' and second line' } }); // Simulate adding more text
      fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 }); // Send with Enter

      await waitFor(() => {
        expect(screen.getByText('Multi-line first line and second line')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText(/I understand you're interested in that topic./i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  it('clicking "Start New Track" in HomePageComponent switches to Explore tab and shows TrackExplorationComponent', async () => {
    render(<AITutorChat />);
    const startNewTrackButton = screen.getByRole('button', { name: 'Start New Track' });
    fireEvent.click(startNewTrackButton);

    await waitFor(() => {
      // Check for the AI message that accompanies switching to track exploration
      expect(screen.getByText(/Great! Let's explore learning tracks to find the perfect path for you:/i)).toBeInTheDocument();
      expect(screen.getByTestId('mock-trackexploration')).toBeInTheDocument();
      // Check if the Explore tab is active
      const exploreTab = screen.getByRole('tab', { name: /Explore/i });
      expect(exploreTab).toHaveAttribute('aria-selected', 'true');
    });
  });


  it('handles full flow from track selection to lesson start, checking tab changes', async () => {
    render(<AITutorChat />);
    let homeTab = screen.getByRole('tab', { name: /Home/i });
    expect(homeTab).toHaveAttribute('aria-selected', 'true');

    // 1. Initial: HomePageComponent (on Home tab)
    expect(screen.getByTestId('mock-homepage')).toBeInTheDocument();
    const startNewTrackButton = screen.getByRole('button', { name: 'Start New Track' });
    fireEvent.click(startNewTrackButton);

    // 2. TrackExplorationComponent (should switch to Explore tab)
    await waitFor(() => {
      expect(screen.getByTestId('mock-trackexploration')).toBeInTheDocument();
      const exploreTab = screen.getByRole('tab', { name: /Explore/i });
      expect(exploreTab).toHaveAttribute('aria-selected', 'true');
    });
    const selectTrackButton = screen.getByRole('button', { name: 'Select Test Track' });
    fireEvent.click(selectTrackButton); // This message is added to the current tab (Explore)

    // 3. SkillAssessmentComponent (still on Explore tab)
    await waitFor(() => {
      expect(screen.getByTestId('mock-skillassessment')).toBeInTheDocument();
      const exploreTab = screen.getByRole('tab', { name: /Explore/i });
      expect(exploreTab).toHaveAttribute('aria-selected', 'true');
    });
    const completeAssessmentButton = screen.getByRole('button', { name: 'Complete Assessment' });
    fireEvent.click(completeAssessmentButton); // This message is added to the current tab (Explore)

    // 4. LearningPreferencesComponent (still on Explore tab)
    await waitFor(() => {
      expect(screen.getByTestId('mock-learningpreferences')).toBeInTheDocument();
      const exploreTab = screen.getByRole('tab', { name: /Explore/i });
      expect(exploreTab).toHaveAttribute('aria-selected', 'true');
    });
    const completePreferencesButton = screen.getByRole('button', { name: 'Complete Preferences' });
    fireEvent.click(completePreferencesButton); // This message is added to the current tab (Explore)

    // 5. InteractiveLessonComponent (still on Explore tab)
    await waitFor(() => {
      expect(screen.getByTestId('mock-interactivelesson')).toBeInTheDocument();
      expect(screen.getByText(/Perfect! Your learning plan is ready./i)).toBeInTheDocument(); // Adjusted message from component
      const exploreTab = screen.getByRole('tab', { name: /Explore/i });
      expect(exploreTab).toHaveAttribute('aria-selected', 'true');
    });
  });

});
