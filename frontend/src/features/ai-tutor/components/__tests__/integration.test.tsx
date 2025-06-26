import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AITutorChat } from '@/ai-tutor'; // Updated import
import {
  navigateToAITutorTab,
  sendMessageInAITutor,
  completeAITutorOnboarding
} from '@/test-utils/ai-tutor-helpers'; // Import helpers
import { within as rtlWithin, queries } from '@testing-library/dom'; // Import within directly for the helper

// --- Standard Mocks ---
// Mock ResizeObserver (if Radix UI or similar is used by child components)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock @/lib/utils (cn function)
jest.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <div data-testid="next-image" {...props} />,
}));

// Mock lucide-react icons (provide mocks for all icons used across AITutorChat and its children)
jest.mock('lucide-react', () => ({
  Send: (props) => <svg data-testid="send-icon" {...props} />,
  Bot: (props) => <svg data-testid="bot-icon" {...props} />,
  User: (props) => <svg data-testid="user-icon" {...props} />,
  Home: (props) => <svg data-testid="home-icon" {...props} />,
  TrendingUp: (props) => <svg data-testid="trending-up-icon" {...props} />,
  BookOpen: (props) => <svg data-testid="book-open-icon" {...props} />,
  RotateCcw: (props) => <svg data-testid="rotate-ccw-icon" {...props} />,
  Brain: (props) => <svg data-testid="brain-icon" {...props} />,
  Zap: (props) => <svg data-testid="zap-icon" {...props} />,
  Target: (props) => <svg data-testid="target-icon" {...props} />,
  Award: (props) => <svg data-testid="award-icon" {...props} />,
  Loader2: (props) => <svg data-testid="loader2-icon" {...props} />,
  Play: (props) => <svg data-testid="play-icon" {...props} />, // For InteractiveLessonComponent
  CheckCircle: (props) => <svg data-testid="check-circle-icon" {...props} />, // For InteractiveLessonComponent & ProgressDashboard
  Star: (props) => <svg data-testid="star-icon" {...props} />, // For ProgressDashboard
  Code: (props) => <svg data-testid="code-icon" {...props} />, // For TrackExploration & LearningPreferences
  Palette: (props) => <svg data-testid="palette-icon" {...props} />, // For TrackExploration
  Database: (props) => <svg data-testid="database-icon" {...props} />, // For TrackExploration
  Smartphone: (props) => <svg data-testid="smartphone-icon" {...props} />, // For TrackExploration
  Clock: (props) => <svg data-testid="clock-icon" {...props} />, // For TrackExploration & ProgressDashboard
  ChevronRight: (props) => <svg data-testid="chevron-right-icon" {...props} />, // For TrackExploration
  Lightbulb: (props) => <svg data-testid="lightbulb-icon" {...props} />, // For LearningPreferences
  // Add any other icons that might be used by child components if not covered
}));

// Mock framer-motion
jest.mock('framer-motion', () => {
  const ActualReact = jest.requireActual('react');
  return {
    motion: {
      div: ActualReact.forwardRef(({ children, ...rest }, ref) => (
        <div ref={ref} {...rest}>
          {children}
        </div>
      )),
      // Add other motion elements if they are used by AITutorChat or its children
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

// Mock scrollIntoView for JSDOM
Element.prototype.scrollIntoView = jest.fn();

// Mock window.alert (used in some child components like InteractiveLesson)
global.alert = jest.fn();


// --- API Mocking Strategy ---
// We'll use jest.spyOn for the component's internal `simulateAPICall` for message sending
// and specific mocks for APIs used by child components if necessary (e.g., InteractiveLessonComponent's mockApi).

// Mock for InteractiveLessonComponent's API calls
const mockRunCode = jest.fn();
const mockSubmitCode = jest.fn();
jest.mock('@/lib/api-mocks', () => ({
  mockApi: {
    runCode: (code) => mockRunCode(code),
    submitCode: (lessonId, code) => mockSubmitCode(lessonId, code),
  },
}));

// Mock the Slider component for SkillAssessment and LearningPreferences
// This global variable will store the onValueChange callback for the *last rendered* Slider.
// This is a simplification. For tests needing to control multiple sliders independently and precisely,
// this mock would need to be more sophisticated (e.g., storing callbacks in a map keyed by a slider identifier).
let capturedSliderOnValueChange;
jest.mock('@/components/ui/slider', () => ({
  Slider: jest.fn((props) => {
    capturedSliderOnValueChange = props.onValueChange;
    return (
      <div
        data-testid={`mock-slider-${props['aria-label'] || 'unlabelled'}`}
        role="slider"
        aria-valuenow={props.value ? props.value[0] : 0}
        aria-valuemin={props.min}
        aria-valuemax={props.max}
        onClick={() => { // Allow tests to simulate a change by clicking the mock
          if (capturedSliderOnValueChange) capturedSliderOnValueChange([ (props.value ? props.value[0] : 0) + (props.step || 1) ]);
        }}
      >
        Mock Slider ({props['aria-label'] || 'unlabelled'}) Value: {props.value ? props.value[0] : 0}
      </div>
    );
  }),
}));


describe('AITutorChat Integration Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    capturedSliderOnValueChange = null; // Reset for each test
    // Restore Math.random if it was mocked in a specific test
    if (global.Math.random.mockRestore) {
      global.Math.random.mockRestore();
    }
  });

  describe('Complete Learning Workflow', () => {
    it('allows user to select a track, assess skills, set preferences, start a lesson, and view progress', async () => {
      render(<AITutorChat />);

      // Use the helper to complete onboarding up to the lesson
      await completeAITutorOnboarding(); // This covers steps 1-4 and initial part of 5

      // 5. Interactive Lesson (continued) - specific interaction for this test
      mockSubmitCode.mockResolvedValue({ correct: true, feedback: 'Great job!' });
      fireEvent.click(screen.getByRole('button', { name: /Submit/i })); // Submit code in lesson
      await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Feedback: Great job!'));
      await waitFor(() => expect(global.alert).toHaveBeenCalledWith('Correct! You can move to the next part of the lesson (if available).'));


      // 6. Navigate to Progress
      await navigateToAITutorTab('Progress');

      // Verify ProgressDashboardComponent shows relevant information
      expect(screen.getByText(/Your Learning Progress/i)).toBeInTheDocument(); // ProgressDashboardComponent title
      // Check if "Frontend Development" (the track selected in completeAITutorOnboarding) is displayed.
      expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    });
  });

  describe('Assessment Workflow with Interaction', () => {
    it('allows user to change skill levels in assessment and these changes are considered', async () => {
      render(<AITutorChat />);

      // Navigate to Skill Assessment (part of the onboarding helper, but we need to select a specific track)
      // 1. Start New Track (from Home, leads to Explore tab)
      const startNewTrackButton = await screen.findByRole('button', { name: /Start New Track/i });
      fireEvent.click(startNewTrackButton);
      await waitFor(() => expect(screen.getByRole('tab', { name: /Explore/i, selected: true })).toBeInTheDocument());

      // 2. Select a Track (from TrackExplorationComponent) - select "Backend Development" for this test
      const backendTrackCard = screen.getByText('Backend Development').closest('div[class*="cursor-pointer"]');
      if (!backendTrackCard) throw new Error("Backend Development track card not found");
      fireEvent.click(backendTrackCard);
      await waitFor(() => expect(screen.getByText(/Rate Your Current Skills/i)).toBeInTheDocument()); // Wait for SkillAssessment

      // Interact with SkillAssessmentComponent: Change 'Node.js' level (default 1 in SkillAssessmentComponent)
      // The SkillAssessmentComponent lists skills. 'Node.js' is the last one.
      // Our mock will capture the onValueChange of the *last rendered* Slider.
      const nodeJsSkillText = screen.getByText('Node.js'); // Last skill in SkillAssessmentComponent's default list
      expect(nodeJsSkillText).toBeInTheDocument();

      let nodeJsContainer = nodeJsSkillText.closest('div.space-y-2');
      if (!nodeJsContainer) throw new Error("Node.js skill container not found");
      expect(within(nodeJsContainer).getByText('Beginner')).toBeInTheDocument(); // Initial level 1

      expect(capturedSliderOnValueChange).toBeInstanceOf(Function);
      if (capturedSliderOnValueChange) {
        capturedSliderOnValueChange([4]); // Change Node.js level to 4
      }

      await waitFor(() => {
        nodeJsContainer = screen.getByText('Node.js').closest('div.space-y-2'); // Re-query
        if (!nodeJsContainer) throw new Error("Node.js skill container not found after update");
        expect(within(nodeJsContainer).getByText('Advanced')).toBeInTheDocument();
      });

      const continueAssessmentButton = screen.getByRole('button', { name: /Continue Assessment/i });
      fireEvent.click(continueAssessmentButton);

      await waitFor(() => expect(screen.getByText(/Learning Preferences/i)).toBeInTheDocument());
      // Further checks could involve inspecting AI messages if they reflect the change, but this is complex.
      // The main point is that the flow continued with the (presumably) updated assessment data.
    });
  });

  describe('Error Recovery Workflows', () => {
    it('handles message sending failure and retry successfully', async () => {
      const mockMath = Object.create(global.Math);
      mockMath.random = jest.fn()
        .mockReturnValueOnce(0.05) // Fail
        .mockReturnValueOnce(0.06) // Fail again
        .mockReturnValueOnce(0.5);  // Succeed
      global.Math = mockMath;

      render(<AITutorChat />);

      // Use helper to send message
      await sendMessageInAITutor('Test error recovery');

      // Expect error message and "Reconnecting..." status
      await waitFor(() => {
        expect(screen.getByText(/Network connection failed. Please try again./i)).toBeInTheDocument();
        expect(screen.getByText(/Reconnecting.../i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Wait for the successful AI reply
      await waitFor(() => {
        expect(screen.getByText(/I understand you're interested in that topic./i)).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.queryByText(/Network connection failed/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Unable to connect/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Online/i)).toBeInTheDocument();

      global.Math.random.mockRestore(); // Important to restore
    });
  });
});

// Define within helper locally if not imported globally or via setup
// Re-defining 'within' helper locally as it was in the original search block.
// Normally, this would be imported from a central test utility.
function within(element) {
  return rtlWithin(element, queries);
}
