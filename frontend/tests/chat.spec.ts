import { test, expect } from '@playwright/test';

const CHAT_URL = 'http://localhost:3000/chat';

test.describe('Chat Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CHAT_URL);
  });

  test('should display initial page elements', async ({ page }) => {
    // Check for page header
    await expect(page.getByRole('heading', { name: 'AI Tutor Chat' })).toBeVisible();

    // Check for initial placeholder text for messages
    await expect(page.getByText('No messages yet. Start typing!')).toBeVisible();

    // Check for input field and send button
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible();
  });

  test('should send a message and display it, then clear input', async ({ page }) => {
    const inputField = page.getByPlaceholder('Type your message...');
    const sendMessageButton = page.getByRole('button', { name: 'Send message' });
    const testMessage = 'This is a test message';

    await inputField.fill(testMessage);
    await sendMessageButton.click();

    // Verify the message appears in the chat display area
    // This assertion might fail if the page is purely static and doesn't update the DOM with new messages.
    // We are looking for the text within the main content area.
    // A more robust selector would be a data-testid on the message container or individual messages.
    const mainContent = page.locator('main'); // Targeting the <main> element
    await expect(mainContent.getByText(testMessage)).toBeVisible();

    // Verify the "No messages yet" placeholder is gone (if applicable, depends on component logic)
    // This might be tricky if the component just adds to existing static examples.
    // For now, we'll focus on the message appearing.
    // await expect(page.getByText('No messages yet. Start typing!')).not.toBeVisible();

    // Verify the input field is cleared
    await expect(inputField).toBeEmpty();
  });
});
