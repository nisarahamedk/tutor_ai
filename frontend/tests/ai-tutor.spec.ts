import { test, expect, Page } from '@playwright/test';

const AI_TUTOR_URL = 'http://localhost:3000/ai-tutor'; // Using full URL

test.describe('AI Tutor Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(AI_TUTOR_URL);
  });

  test('should display initial page elements', async ({ page }) => {
    // Check for page title (h1)
    await expect(page.getByRole('heading', { name: 'AI Tutor', level: 1 })).toBeVisible();
    // Check for introductory text
    await expect(page.getByText('Your personalized AI learning assistant. Start your journey below!')).toBeVisible();

    // Check for AI Tutor Chat component header
    await expect(page.getByRole('heading', { name: 'AI Tutor', level: 2 })).toBeVisible(); // Chat component's own header
    await expect(page.getByText('Your personal learning assistant')).toBeVisible(); // Sub-header in chat component

    // Check for initial AI message
    await expect(page.getByText("Hi! I'm your AI tutor. I'm here to help you learn and grow in tech. What would you like to explore today?")).toBeVisible();

    // Check for input field and send button
    await expect(page.getByPlaceholder('Ask me anything...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
  });

  test('should send a message and receive a basic response', async ({ page }) => {
    const inputField = page.getByPlaceholder('Ask me anything...');
    const sendMessageButton = page.getByRole('button', { name: 'Send message' });

    await inputField.fill('Hello AI');
    await sendMessageButton.click();

    // Check for user's message
    await expect(page.getByText('Hello AI').last()).toBeVisible(); // Use last() in case "Hello AI" appears elsewhere

    // Wait for and check AI's response (mocked with a timeout)
    // Need to ensure this text is unique enough for the default response
    await expect(page.getByText('I received your message: "Hello AI". How can I assist you further?')).toBeVisible({ timeout: 2000 }); // Increased timeout for simulated API call
  });

  test.describe('Tab Navigation', () => {
    test('should switch to Progress tab and display related content', async ({ page }) => {
      const progressTab = page.getByRole('tab', { name: 'Progress' });
      await progressTab.click();
      await expect(progressTab).toHaveAttribute('data-state', 'active');
      // Check for AI message related to progress
      await expect(page.getByText("Welcome back! Here's your current progress. Let's continue where you left off.")).toBeVisible({ timeout: 2000 });
      // Check if ProgressDashboardComponent might render a specific, identifiable element
      // For example, if it has a unique heading:
      // await expect(page.getByRole('heading', { name: 'Your Learning Progress' })).toBeVisible(); // This is an assumed element
    });

    test('should switch to Review tab and display related content', async ({ page }) => {
      const reviewTab = page.getByRole('tab', { name: 'Review' });
      await reviewTab.click();
      await expect(reviewTab).toHaveAttribute('data-state', 'active');
      await expect(page.getByText("Great choice! Let's review some key concepts with flashcards.")).toBeVisible({ timeout: 2000 });
      // Check for FlashcardReviewComponent's identifiable element
      // await expect(page.getByRole('button', { name: 'Show Answer' })).toBeVisible(); // Assumed element
    });

    test('should switch to Explore tab and display related content', async ({ page }) => {
      const exploreTab = page.getByRole('tab', { name: 'Explore' });
      await exploreTab.click();
      await expect(exploreTab).toHaveAttribute('data-state', 'active');
      await expect(page.getByText("Great! Let's find a new learning track for you.")).toBeVisible({ timeout: 2000 });
      // Check for TrackExplorationComponent's identifiable element
      // await expect(page.getByRole('heading', { name: 'Explore Learning Tracks' })).toBeVisible(); // Assumed element
    });

    test('should switch back to Home tab and display related content', async ({ page }) => {
      // First click another tab, then back to home
      await page.getByRole('tab', { name: 'Explore' }).click();
      // Ensure the tab content is loaded before clicking back
      await expect(page.getByText("Great! Let's find a new learning track for you.")).toBeVisible({ timeout: 2000 });

      const homeTab = page.getByRole('tab', { name: 'Home' });
      await homeTab.click();
      await expect(homeTab).toHaveAttribute('data-state', 'active');
      await expect(page.getByText("Welcome back to the Home screen! What would you like to do?")).toBeVisible({ timeout: 2000 });
      // Check for HomePageComponent's identifiable element (e.g., a button it renders)
      // await expect(page.getByRole('button', { name: 'Start a New Track' })).toBeVisible(); // Assumed element
    });
  });

  test.describe('Quick Action Buttons', () => {
    test('should populate input with "I need help with this lesson" when "Get Help" is clicked', async ({ page }) => {
      const getHelpButton = page.getByRole('button', { name: 'Get Help' });
      await getHelpButton.click();
      await expect(page.getByPlaceholder('Ask me anything...')).toHaveValue('I need help with this lesson');
    });

    test('should populate input with "What should I learn next?" when "What\'s Next?" is clicked', async ({ page }) => {
      const whatsNextButton = page.getByRole('button', { name: 'What\'s Next?' });
      await whatsNextButton.click();
      await expect(page.getByPlaceholder('Ask me anything...')).toHaveValue('What should I learn next?');
    });

    test('should trigger "Show Progress" flow when button is clicked', async ({ page }) => {
      const showProgressButton = page.getByRole('button', { name: 'Show Progress' });
      await showProgressButton.click();
      // Check for active tab
      await expect(page.getByRole('tab', { name: 'Progress' })).toHaveAttribute('data-state', 'active');
      // Check for AI message
      await expect(page.getByText("Welcome back! Here's your current progress. Let's continue where you left off.")).toBeVisible({ timeout: 2000 });
    });

    test('should trigger "Review Concepts" flow when button is clicked', async ({ page }) => {
      const reviewConceptsButton = page.getByRole('button', { name: 'Review Concepts' });
      await reviewConceptsButton.click();
      // Check for active tab
      await expect(page.getByRole('tab', { name: 'Review' })).toHaveAttribute('data-state', 'active');
      // Check for AI message
      await expect(page.getByText("Great choice! Let's review some key concepts with flashcards.")).toBeVisible({ timeout: 2000 });
    });
  });
});
