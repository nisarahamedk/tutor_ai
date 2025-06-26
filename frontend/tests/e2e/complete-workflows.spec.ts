import { test, expect, Page } from '@playwright/test';

/**
 * Complete user workflows E2E tests
 */

// Test data
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
};

const TEST_TRACK = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'JavaScript Fundamentals',
  difficulty: 'beginner',
};

// Helper functions
async function loginUser(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', TEST_USER.email);
  await page.fill('[data-testid="password-input"]', TEST_USER.password);
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/ai-tutor');
}

async function enrollInTrack(page: Page, trackId: string) {
  await page.goto('/ai-tutor/explore');
  await page.click(`[data-testid="track-${trackId}"]`);
  await page.click('[data-testid="enroll-button"]');
  await expect(page.locator('[data-testid="enrollment-success"]')).toBeVisible();
}

async function sendChatMessage(page: Page, message: string) {
  await page.fill('[data-testid="message-input"]', message);
  await page.click('[data-testid="send-message-button"]');
  await expect(page.locator('[data-testid="message-list"] .message').last()).toContainText(message);
}

test.describe('Complete Learning Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('/auth/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'user-123', email: TEST_USER.email, name: TEST_USER.name },
            token: 'mock-jwt-token',
          }),
        });
      } else if (url.includes('/learning/tracks')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: TEST_TRACK.id,
              title: TEST_TRACK.title,
              description: 'Learn the fundamentals of JavaScript programming',
              difficulty: TEST_TRACK.difficulty,
              estimatedTime: 40,
              prerequisites: [],
              skills: ['Variables', 'Functions', 'Objects', 'Arrays'],
              category: 'Programming',
              isActive: true,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('should complete full learning journey from login to assessment', async ({ page }) => {
    // Step 1: Login
    await loginUser(page);
    
    // Step 2: Explore tracks
    await page.goto('/ai-tutor/explore');
    await expect(page.locator('[data-testid="track-grid"]')).toBeVisible();
    await expect(page.locator(`[data-testid="track-${TEST_TRACK.id}"]`)).toBeVisible();

    // Step 3: Enroll in track
    await enrollInTrack(page, TEST_TRACK.id);

    // Step 4: Start learning
    await page.goto(`/ai-tutor/tracks/${TEST_TRACK.id}`);
    await expect(page.locator('[data-testid="track-overview"]')).toBeVisible();
    await page.click('[data-testid="start-lesson-button"]');

    // Step 5: Complete lessons
    await expect(page.locator('[data-testid="lesson-content"]')).toBeVisible();
    await page.click('[data-testid="mark-complete-button"]');
    await expect(page.locator('[data-testid="lesson-completed"]')).toBeVisible();

    // Step 6: Take assessment
    await page.goto('/ai-tutor/assessment');
    await page.click('[data-testid="start-assessment-button"]');
    
    // Answer assessment questions
    await page.click('[data-testid="answer-option-1"]');
    await page.click('[data-testid="next-question-button"]');
    await page.click('[data-testid="answer-option-2"]');
    await page.click('[data-testid="submit-assessment-button"]');

    // Step 7: View results
    await expect(page.locator('[data-testid="assessment-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="assessment-score"]')).toContainText(/\d+%/);

    // Step 8: Check progress
    await page.goto('/ai-tutor/progress');
    await expect(page.locator('[data-testid="progress-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="completed-tracks"]')).toContainText('1');
  });

  test('should handle chat interactions throughout learning', async ({ page }) => {
    await loginUser(page);

    // Test chat in different tabs
    const tabs = ['home', 'progress', 'review', 'explore'];
    
    for (const tab of tabs) {
      await page.goto(`/ai-tutor${tab === 'home' ? '' : `/${tab}`}`);
      
      // Send a message
      const message = `Hello from ${tab} tab`;
      await sendChatMessage(page, message);
      
      // Verify AI response
      await expect(page.locator('[data-testid="message-list"] .message.assistant').last())
        .toBeVisible({ timeout: 10000 });
    }

    // Test chat history persistence
    await page.goto('/ai-tutor/chat');
    await expect(page.locator('[data-testid="message-list"] .message')).toHaveCount(8); // 4 user + 4 AI messages
  });

  test('should handle offline functionality', async ({ page, context }) => {
    await loginUser(page);

    // Go offline
    await context.setOffline(true);

    // Try to send a message while offline
    await page.goto('/ai-tutor');
    await sendChatMessage(page, 'This is an offline message');
    
    // Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

    // Go back online
    await context.setOffline(false);
    
    // Verify message is synced
    await expect(page.locator('[data-testid="sync-success"]')).toBeVisible({ timeout: 5000 });
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/chat/send', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await loginUser(page);
    
    // Try to send a message
    await page.fill('[data-testid="message-input"]', 'This will fail');
    await page.click('[data-testid="send-message-button"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    
    // Test retry functionality
    await page.route('**/api/chat/send', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'msg-123',
          role: 'assistant',
          content: 'Hello! How can I help you?',
          timestamp: new Date().toISOString(),
        }),
      });
    });
    
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="message-list"] .message.assistant').last()).toBeVisible();
  });
});

test.describe('Advanced User Interactions', () => {
  test('should handle complex assessment scenarios', async ({ page }) => {
    await loginUser(page);

    // Navigate to assessment
    await page.goto('/ai-tutor/assessment');
    
    // Test different question types
    await page.click('[data-testid="start-assessment-button"]');

    // Multiple choice question
    await page.click('[data-testid="answer-option-1"]');
    await page.click('[data-testid="next-question-button"]');

    // True/false question
    await page.click('[data-testid="true-option"]');
    await page.click('[data-testid="next-question-button"]');

    // Short answer question
    await page.fill('[data-testid="short-answer-input"]', 'JavaScript is a programming language');
    await page.click('[data-testid="next-question-button"]');

    // Code question
    await page.fill('[data-testid="code-editor"]', 'function hello() { return "Hello World"; }');
    await page.click('[data-testid="submit-assessment-button"]');

    // Verify submission
    await expect(page.locator('[data-testid="assessment-submitted"]')).toBeVisible();
  });

  test('should handle preferences and customization', async ({ page }) => {
    await loginUser(page);

    // Navigate to preferences
    await page.goto('/ai-tutor/preferences');

    // Update learning preferences
    await page.selectOption('[data-testid="learning-style-select"]', 'visual');
    await page.selectOption('[data-testid="pace-select"]', 'fast');
    await page.fill('[data-testid="available-time-input"]', '2');

    // Update accessibility preferences
    await page.check('[data-testid="high-contrast-toggle"]');
    await page.selectOption('[data-testid="font-size-select"]', 'large');

    // Save preferences
    await page.click('[data-testid="save-preferences-button"]');
    await expect(page.locator('[data-testid="preferences-saved"]')).toBeVisible();

    // Verify preferences are applied
    await page.goto('/ai-tutor');
    await expect(page.locator('body')).toHaveClass(/high-contrast/);
    await expect(page.locator('body')).toHaveClass(/large-font/);
  });

  test('should handle data export and privacy', async ({ page }) => {
    await loginUser(page);

    // Navigate to data export
    await page.goto('/ai-tutor/preferences');
    await page.click('[data-testid="data-export-tab"]');

    // Export learning progress
    await page.check('[data-testid="include-progress-checkbox"]');
    await page.check('[data-testid="include-assessments-checkbox"]');
    await page.click('[data-testid="export-data-button"]');

    // Verify export
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;

    // Test account deletion flow
    await page.click('[data-testid="delete-account-tab"]');
    await page.fill('[data-testid="delete-confirmation-input"]', 'DELETE');
    await page.fill('[data-testid="password-confirmation-input"]', TEST_USER.password);
    await page.click('[data-testid="delete-account-button"]');

    // Verify deletion warning
    await expect(page.locator('[data-testid="deletion-warning"]')).toBeVisible();
  });
});

test.describe('Performance and Load Testing', () => {
  test('should handle multiple concurrent chat messages', async ({ page }) => {
    await loginUser(page);

    // Send multiple messages rapidly
    const messages = [
      'First message',
      'Second message',
      'Third message',
      'Fourth message',
      'Fifth message',
    ];

    for (const message of messages) {
      await page.fill('[data-testid="message-input"]', message);
      await page.click('[data-testid="send-message-button"]');
      // Small delay to simulate realistic typing
      await page.waitForTimeout(100);
    }

    // Verify all messages are displayed
    await expect(page.locator('[data-testid="message-list"] .message.user')).toHaveCount(5);
  });

  test('should handle large datasets gracefully', async ({ page }) => {
    // Mock large dataset
    await page.route('**/api/learning/tracks', async (route) => {
      const largeTracks = Array.from({ length: 100 }, (_, i) => ({
        id: `track-${i}`,
        title: `Track ${i}`,
        description: `Description for track ${i}`,
        difficulty: ['beginner', 'intermediate', 'advanced'][i % 3],
        estimatedTime: 40 + (i % 20),
        prerequisites: [],
        skills: [`Skill ${i}`, `Skill ${i + 1}`],
        category: ['Programming', 'Data Science', 'Design'][i % 3],
        isActive: true,
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeTracks),
      });
    });

    await loginUser(page);
    await page.goto('/ai-tutor/explore');

    // Verify virtual scrolling works
    await expect(page.locator('[data-testid="track-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="track-item"]')).toHaveCount(20); // Assuming 20 items per page

    // Test search with large dataset
    await page.fill('[data-testid="search-input"]', 'Track 5');
    await expect(page.locator('[data-testid="track-item"]')).toHaveCount(11); // Track 5, 15, 25, etc.
  });
});

test.describe('Mobile and Responsive Testing', () => {
  test('should work correctly on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await loginUser(page);

    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

    // Test chat on mobile
    await page.click('[data-testid="chat-tab-mobile"]');
    await sendChatMessage(page, 'Mobile test message');

    // Test touch interactions
    await page.goto('/ai-tutor/explore');
    await page.locator('[data-testid="track-card"]').first().tap();
    await expect(page.locator('[data-testid="track-details"]')).toBeVisible();

    // Test swipe gestures (if implemented)
    await page.goto('/ai-tutor/lessons/lesson-1');
    // Simulate swipe
    await page.mouse.move(200, 300);
    await page.mouse.down();
    await page.mouse.move(50, 300);
    await page.mouse.up();
    
    // Verify next lesson loaded
    await expect(page).toHaveURL(/lesson-2/);
  });

  test('should handle orientation changes', async ({ page }) => {
    await loginUser(page);

    // Portrait mode
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ai-tutor');
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();

    // Landscape mode
    await page.setViewportSize({ width: 667, height: 375 });
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    
    // Verify layout adjusts correctly
    const chatContainer = page.locator('[data-testid="chat-container"]');
    const boundingBox = await chatContainer.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(400);
  });
});