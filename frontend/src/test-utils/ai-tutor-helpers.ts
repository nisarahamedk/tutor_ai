import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Message as AITutorMessage } from '@/features/ai-tutor/components/AITutorChat'; // Updated path

// Example: Helper to navigate to a specific tab in AITutorChat
export const navigateToAITutorTab = async (tabName: 'Home' | 'Progress' | 'Review' | 'Explore') => {
  const tabRegex = new RegExp(tabName, "i");
  const tabElement = screen.getByRole('tab', { name: tabRegex });
  fireEvent.click(tabElement);
  await waitFor(() => {
    expect(screen.getByRole('tab', { name: tabRegex, selected: true })).toBeInTheDocument();
  });
};

// Example: Helper to send a message in AITutorChat
export const sendMessageInAITutor = async (messageText: string) => {
  const input = screen.getByPlaceholderText(/Ask me anything.../i);
  const sendButton = screen.getByRole('button', { name: /Send message/i });

  fireEvent.change(input, { target: { value: messageText } });
  fireEvent.click(sendButton);

  // Wait for the user message to appear
  await waitFor(() => {
    expect(screen.getByText(messageText)).toBeInTheDocument();
  });
  // Note: This helper doesn't wait for the AI's response by default,
  // as that can vary. Specific tests can add further waitFor conditions.
};


// Helper to simulate the full onboarding flow up to the InteractiveLessonComponent
export const completeAITutorOnboarding = async () => {
  // 1. Start New Track (from Home, leads to Explore tab)
  // Assuming HomePageComponent is rendered and the "Start New Track" button is available
  const startNewTrackButton = await screen.findByRole('button', { name: /Start New Track/i });
  fireEvent.click(startNewTrackButton);
  await waitFor(() => expect(screen.getByRole('tab', { name: /Explore/i, selected: true })).toBeInTheDocument());

  // 2. Select a Track (from TrackExplorationComponent)
  // Assuming "Frontend Development" track is available
  const frontendTrackCard = screen.getByText('Frontend Development').closest('div[class*="cursor-pointer"]');
  if (!frontendTrackCard) throw new Error("Frontend Development track card not found");
  fireEvent.click(frontendTrackCard);
  await waitFor(() => expect(screen.getByText(/Rate Your Current Skills/i)).toBeInTheDocument()); // Wait for SkillAssessment

  // 3. Complete Skill Assessment (SkillAssessmentComponent)
  // Assuming default skills are fine, just continue
  const continueAssessmentButton = screen.getByRole('button', { name: /Continue Assessment/i });
  fireEvent.click(continueAssessmentButton);
  await waitFor(() => expect(screen.getByText(/Learning Preferences/i)).toBeInTheDocument()); // Wait for LearningPreferences

  // 4. Complete Learning Preferences (LearningPreferencesComponent)
  // Select a style and a goal to enable submission
  const visualStyleCard = screen.getByText(/Visual Learner/i).closest('div[class*="cursor-pointer"]');
  if (!visualStyleCard) throw new Error("Visual Learner style card not found");
  fireEvent.click(visualStyleCard);

  const jobGoalButton = screen.getByRole('button', { name: /Get a job as a developer/i });
  fireEvent.click(jobGoalButton);

  const startJourneyButton = screen.getByRole('button', { name: /Start My Learning Journey/i });
  expect(startJourneyButton).toBeEnabled();
  fireEvent.click(startJourneyButton);

  // 5. Verify Interactive Lesson is shown
  await waitFor(() => {
    expect(screen.getByText(/Perfect! Your learning plan is ready./i)).toBeInTheDocument(); // AI Message
    expect(screen.getByText(/Interactive Lesson: JavaScript Functions/i)).toBeInTheDocument(); // InteractiveLessonComponent title
  });
};


// Add more helpers as identified.
// For example, a helper to simulate an API call for message sending if that becomes complex,
// or helpers to set up specific states in AITutorChat if it becomes possible without internal mocks.

// Note: When using these helpers, ensure that the AITutorChat component (or the relevant part of it)
// is already rendered in the test. These helpers perform actions on the rendered component.
// They also assume that child components (HomePageComponent, TrackExplorationComponent etc.)
// are implemented in a way that these interactions are possible (e.g., buttons are present).
// If child components are heavily mocked in a unit test, these helpers might not be suitable for that specific unit test.
// They are more geared towards integration-style tests or unit tests of AITutorChat where children are not fully mocked.
