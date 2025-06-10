import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AITutorChat, { Message } from '../AITutorChat'; // Adjust path as needed

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

// Mock child components
jest.mock('@/components/ai-tutor/HomePageComponent', () => ({
  HomePageComponent: jest.fn(({ onStartNewTrack, onContinueLearning, onStartReview }) => (
    <div data-testid="mock-homepage">
      <button onClick={onStartNewTrack}>Start New Track</button>
      <button onClick={onContinueLearning}>Continue Learning</button>
      <button onClick={onStartReview}>Start Review</button>
    </div>
  )),
}));
jest.mock('@/components/ai-tutor/TrackExplorationComponent', () => ({
  TrackExplorationComponent: jest.fn(({ onTrackSelect }) => (
    <div data-testid="mock-trackexploration">
      <button onClick={() => onTrackSelect({ id: 'test-track', title: 'Test Track' })}>Select Test Track</button>
    </div>
  )),
}));
jest.mock('@/components/ai-tutor/SkillAssessmentComponent', () => ({
  SkillAssessmentComponent: jest.fn(({ onComplete }) => (
    <div data-testid="mock-skillassessment">
      <button onClick={() => onComplete([{ skill: 'test', level: 1 }])}>Complete Assessment</button>
    </div>
  )),
}));
jest.mock('@/components/ai-tutor/LearningPreferencesComponent', () => ({
  LearningPreferencesComponent: jest.fn(({ onComplete }) => (
    <div data-testid="mock-learningpreferences">
      <button onClick={() => onComplete({ style: 'visual' })}>Complete Preferences</button>
    </div>
  )),
}));
jest.mock('@/components/ai-tutor/InteractiveLessonComponent', () => ({
  InteractiveLessonComponent: jest.fn(() => <div data-testid="mock-interactivelesson">Lesson Content</div>),
}));
jest.mock('@/components/ai-tutor/ProgressDashboardComponent', () => ({
  ProgressDashboardComponent: jest.fn(({ onContinueLearning, onSelectTrack }) => (
    <div data-testid="mock-progressdashboard">
      <button onClick={onContinueLearning}>Continue From Progress</button>
      <button onClick={() => onSelectTrack('Test Track From Progress')}>Select Track From Progress</button>
    </div>
  )),
}));
jest.mock('@/components/ai-tutor/FlashcardReviewComponent', () => ({
  FlashcardReviewComponent: jest.fn(({ onComplete }) => (
    <div data-testid="mock-flashcardreview">
      <button onClick={onComplete}>Complete Review</button>
    </div>
  )),
}));

// Mock window.alert
global.alert = jest.fn();


describe('AITutorChat', () => {
  beforeEach(() => {
    (global.alert as jest.Mock).mockClear();
    // Clear mocks for imported components if they have internal state or mock functions
    jest.clearAllMocks();
  });

  it('renders initial AI message with HomePageComponent', () => {
    render(<AITutorChat />);
    expect(screen.getByText(/Hi! I'm your AI tutor./i)).toBeInTheDocument();
    expect(screen.getByTestId('mock-homepage')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask me anything.../i)).toBeInTheDocument(); // Changed from "Type your message..."
  });

  it('allows user to send a text message and receives a generic AI reply', async () => {
    render(<AITutorChat />);
    const input = screen.getByPlaceholderText(/Ask me anything.../i);
    const sendButton = screen.getByRole('button', { name: /Send message/i }); // aria-label

    fireEvent.change(input, { target: { value: 'Hello there' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Hello there')).toBeInTheDocument(); // User message
    });
    await waitFor(() => { // Wait for the simulated AI response (1s timeout in component)
      expect(screen.getByText(/I received your message: "Hello there"./i)).toBeInTheDocument();
    }, { timeout: 2000 }); // Increased timeout for simulated delay
  });

  it('clicking "Start New Track" in HomePageComponent shows TrackExplorationComponent', async () => {
    render(<AITutorChat />);
    // HomePageComponent is mocked and its onStartNewTrack can be triggered
    const startNewTrackButton = screen.getByRole('button', { name: 'Start New Track' });
    fireEvent.click(startNewTrackButton);

    await waitFor(() => {
      expect(screen.getByText(/Great! Let's find a new learning track for you./i)).toBeInTheDocument();
      expect(screen.getByTestId('mock-trackexploration')).toBeInTheDocument();
    });
  });

  it('navigates to Progress tab and shows ProgressDashboardComponent', async () => {
    render(<AITutorChat />);
    const progressTab = screen.getByRole('tab', { name: /Progress/i });
    fireEvent.click(progressTab);

    await waitFor(() => {
        expect(screen.getByText(/Welcome back! Here's your current progress./i)).toBeInTheDocument();
        expect(screen.getByTestId('mock-progressdashboard')).toBeInTheDocument();
    });
  });

  it('handles full flow from track selection to lesson start', async () => {
    render(<AITutorChat />);

    // 1. Initial: HomePageComponent
    expect(screen.getByTestId('mock-homepage')).toBeInTheDocument();
    const startNewTrackButton = screen.getByRole('button', { name: 'Start New Track' });
    fireEvent.click(startNewTrackButton);

    // 2. TrackExplorationComponent
    await waitFor(() => expect(screen.getByTestId('mock-trackexploration')).toBeInTheDocument());
    const selectTrackButton = screen.getByRole('button', { name: 'Select Test Track' });
    fireEvent.click(selectTrackButton);

    // 3. SkillAssessmentComponent
    await waitFor(() => expect(screen.getByTestId('mock-skillassessment')).toBeInTheDocument());
    const completeAssessmentButton = screen.getByRole('button', { name: 'Complete Assessment' });
    fireEvent.click(completeAssessmentButton);

    // 4. LearningPreferencesComponent
    await waitFor(() => expect(screen.getByTestId('mock-learningpreferences')).toBeInTheDocument());
    const completePreferencesButton = screen.getByRole('button', { name: 'Complete Preferences' });
    fireEvent.click(completePreferencesButton);

    // 5. InteractiveLessonComponent
    await waitFor(() => expect(screen.getByTestId('mock-interactivelesson')).toBeInTheDocument());
    expect(screen.getByText(/Excellent! I've created a personalized learning plan for you./i)).toBeInTheDocument();
  });

});
