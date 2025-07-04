import { test, expect, Page } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

/**
 * Accessibility E2E tests for WCAG 2.1 AA compliance
 */

// Helper function to login
async function loginUser(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'testpassword123');
  await page.click('[data-testid="login-button"]');
  await expect(page).toHaveURL('/ai-tutor');
}

// Helper function to setup axe
async function setupAxe(page: Page) {
  await injectAxe(page);
}

test.describe('Accessibility Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await setupAxe(page);
  });

  test('should have no accessibility violations on main pages', async ({ page }) => {
    const pages = [
      '/',
      '/ai-tutor',
      '/ai-tutor/explore',
      '/ai-tutor/progress',
      '/ai-tutor/assessment',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await checkA11y(page, undefined, {
        detailedReport: true,
        detailedReportOptions: { html: true },
      });
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/ai-tutor');

    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    // Navigate through all interactive elements
    const interactiveElements = await page.locator('button, a, input, textarea, select').count();
    
    for (let i = 0; i < interactiveElements; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Verify focus indicator is visible
      const outline = await focusedElement.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.outline !== 'none' || styles.boxShadow !== 'none';
      });
      expect(outline).toBe(true);
    }

    // Test reverse tab navigation
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should support screen readers with proper ARIA labels', async ({ page }) => {
    await page.goto('/ai-tutor');

    // Check for proper headings structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);

    // Verify heading hierarchy
    let previousLevel = 0;
    for (const heading of headings) {
      const tagName = await heading.evaluate((el) => el.tagName);
      const level = parseInt(tagName.charAt(1));
      
      if (previousLevel !== 0) {
        expect(level).toBeLessThanOrEqual(previousLevel + 1);
      }
      previousLevel = level;
    }

    // Check for alt text on images
    const images = await page.locator('img').all();
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      expect(alt).not.toBeNull();
    }

    // Check for form labels
    const inputs = await page.locator('input, textarea, select').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }

    // Check for button accessible names
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      
      expect(text?.trim() || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Enable high contrast mode
    await page.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' });
    await page.goto('/ai-tutor');

    // Check contrast ratios
    await checkA11y(page, undefined, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },
      },
    });

    // Verify custom high contrast settings
    await page.goto('/ai-tutor/preferences');
    await page.check('[data-testid="high-contrast-toggle"]');
    await page.click('[data-testid="save-preferences-button"]');

    await page.goto('/ai-tutor');
    const bodyClass = await page.locator('body').getAttribute('class');
    expect(bodyClass).toContain('high-contrast');
  });

  test('should support different font sizes', async ({ page }) => {
    await page.goto('/ai-tutor/preferences');

    const fontSizes = ['small', 'medium', 'large'];
    
    for (const size of fontSizes) {
      await page.selectOption('[data-testid="font-size-select"]', size);
      await page.click('[data-testid="save-preferences-button"]');
      
      await page.goto('/ai-tutor');
      const bodyClass = await page.locator('body').getAttribute('class');
      expect(bodyClass).toContain(`font-${size}`);
      
      // Verify text is readable at different sizes
      const sampleText = page.locator('[data-testid="main-content"] p').first();
      const fontSize = await sampleText.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });
      
      const fontSizeValue = parseFloat(fontSize);
      expect(fontSizeValue).toBeGreaterThan(12); // Minimum readable size
    }
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/ai-tutor');

    // Check that animations are disabled or reduced
    const animatedElements = await page.locator('[class*="animate"], [class*="transition"]').all();
    
    for (const element of animatedElements) {
      const animationDuration = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.animationDuration;
      });
      
      // Animations should be very short or disabled
      expect(animationDuration === '0s' || animationDuration === '0.01s').toBeTruthy();
    }

    // Test user preference setting
    await page.goto('/ai-tutor/preferences');
    await page.check('[data-testid="reduced-motion-toggle"]');
    await page.click('[data-testid="save-preferences-button"]');

    await page.goto('/ai-tutor');
    const bodyClass = await page.locator('body').getAttribute('class');
    expect(bodyClass).toContain('reduce-motion');
  });

  test('should be operable with voice commands simulation', async ({ page }) => {
    await page.goto('/ai-tutor');

    // Simulate voice commands by triggering click events with keyboard
    
    // "Click send button"
    await page.keyboard.press('Tab'); // Navigate to send button
    await page.keyboard.press('Enter'); // Activate button
    
    // "Select first option"
    await page.goto('/ai-tutor/assessment');
    await page.click('[data-testid="start-assessment-button"]');
    await page.keyboard.press('Space'); // Select first radio button
    
    // "Go to next page"
    await page.keyboard.press('Tab'); // Navigate to next button
    await page.keyboard.press('Enter'); // Activate next button
  });

  test('should provide clear error messages and instructions', async ({ page }) => {
    await page.goto('/ai-tutor');

    // Test form validation
    await page.click('[data-testid="send-message-button"]'); // Try to send empty message
    
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveAttribute('role', 'alert');
    
    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText!.length).toBeGreaterThan(10); // Ensure meaningful error message

    // Test that error is associated with the input
    const messageInput = page.locator('[data-testid="message-input"]');
    const ariaDescribedBy = await messageInput.getAttribute('aria-describedby');
    const errorId = await errorMessage.getAttribute('id');
    
    expect(ariaDescribedBy).toBe(errorId);
  });

  test('should handle focus management correctly', async ({ page }) => {
    await page.goto('/ai-tutor');

    // Test modal focus trap
    await page.click('[data-testid="settings-button"]');
    const modal = page.locator('[data-testid="settings-modal"]');
    await expect(modal).toBeVisible();

    // Focus should be trapped within modal
    const modalElements = await modal.locator('button, input, select, textarea, a').count();
    
    for (let i = 0; i < modalElements + 2; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const isWithinModal = await focusedElement.evaluate((el, modalEl) => {
        return modalEl.contains(el);
      }, await modal.elementHandle());
      
      expect(isWithinModal).toBe(true);
    }

    // Test focus restoration after modal close
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
    
    const focusedElement = page.locator(':focus');
    const settingsButton = page.locator('[data-testid="settings-button"]');
    expect(await focusedElement.evaluate((el) => el)).toBe(await settingsButton.elementHandle());
  });

  test('should provide skip links for keyboard users', async ({ page }) => {
    await page.goto('/ai-tutor');

    // Test skip to main content link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('[data-testid="skip-to-main"], a[href="#main-content"]').first();
    
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeFocused();
      await page.keyboard.press('Enter');
      
      const mainContent = page.locator('#main-content, [data-testid="main-content"]');
      await expect(mainContent).toBeFocused();
    }

    // Test skip to navigation link if present
    const skipToNav = page.locator('a[href="#navigation"]');
    if (await skipToNav.count() > 0) {
      await skipToNav.click();
      const navigation = page.locator('#navigation');
      await expect(navigation).toBeFocused();
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/ai-tutor');

    // Send a message and verify announcement
    await page.fill('[data-testid="message-input"]', 'Test message');
    await page.click('[data-testid="send-message-button"]');

    // Check for live regions
    const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();
    expect(liveRegions.length).toBeGreaterThan(0);

    // Verify that new messages are announced
    const messageList = page.locator('[data-testid="message-list"]');
    const ariaLive = await messageList.getAttribute('aria-live');
    expect(ariaLive).toBe('polite');
  });

  test('should support multiple languages and RTL text', async ({ page }) => {
    // Test RTL language support (Arabic simulation)
    await page.addInitScript(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    });

    await page.goto('/ai-tutor');

    // Verify RTL layout
    const body = page.locator('body');
    const direction = await body.evaluate((el) => window.getComputedStyle(el).direction);
    expect(direction).toBe('rtl');

    // Check that layout doesn't break with RTL
    await checkA11y(page);

    // Test language switching if available
    const languageSelector = page.locator('[data-testid="language-selector"]');
    if (await languageSelector.count() > 0) {
      await languageSelector.selectOption('es'); // Spanish
      await page.waitForLoadState('networkidle');
      
      const lang = await page.getAttribute('html', 'lang');
      expect(lang).toBe('es');
    }
  });
});

test.describe('Accessibility Edge Cases', () => {
  test('should handle complex interactive components', async ({ page }) => {
    await setupAxe(page);
    await page.goto('/ai-tutor/assessment');

    // Test assessment component accessibility
    await page.click('[data-testid="start-assessment-button"]');
    
    // Check accessibility of question components
    await checkA11y(page, '[data-testid="question-container"]');

    // Test radio button groups
    const radioGroup = page.locator('[role="radiogroup"]');
    if (await radioGroup.count() > 0) {
      const groupLabel = await radioGroup.getAttribute('aria-labelledby');
      expect(groupLabel).toBeTruthy();
      
      const radios = await radioGroup.locator('input[type="radio"]').all();
      for (const radio of radios) {
        const name = await radio.getAttribute('name');
        expect(name).toBeTruthy();
      }
    }

    // Test progress indicators
    const progressBar = page.locator('[role="progressbar"]');
    if (await progressBar.count() > 0) {
      const ariaValueNow = await progressBar.getAttribute('aria-valuenow');
      const ariaValueMin = await progressBar.getAttribute('aria-valuemin');
      const ariaValueMax = await progressBar.getAttribute('aria-valuemax');
      
      expect(ariaValueNow).toBeTruthy();
      expect(ariaValueMin).toBeTruthy();
      expect(ariaValueMax).toBeTruthy();
    }
  });

  test('should handle data tables correctly', async ({ page }) => {
    await setupAxe(page);
    await page.goto('/ai-tutor/progress');

    // Check data table accessibility
    const tables = await page.locator('table').all();
    
    for (const table of tables) {
      // Check for table headers
      const headers = await table.locator('th').count();
      expect(headers).toBeGreaterThan(0);

      // Check for proper scope attributes
      const columnHeaders = await table.locator('th[scope="col"]').count();
      const rowHeaders = await table.locator('th[scope="row"]').count();
      expect(columnHeaders + rowHeaders).toBeGreaterThan(0);

      // Check for table caption or aria-label
      const caption = await table.locator('caption').count();
      const ariaLabel = await table.getAttribute('aria-label');
      const ariaLabelledBy = await table.getAttribute('aria-labelledby');
      
      expect(caption > 0 || ariaLabel || ariaLabelledBy).toBeTruthy();
    }

    await checkA11y(page, 'table');
  });

  test('should handle error states accessibly', async ({ page }) => {
    await setupAxe(page);

    // Mock API error
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    await page.goto('/ai-tutor');
    await page.fill('[data-testid="message-input"]', 'Test message');
    await page.click('[data-testid="send-message-button"]');

    // Verify error is announced
    const errorRegion = page.locator('[role="alert"], [aria-live="assertive"]');
    await expect(errorRegion).toBeVisible();

    // Check error accessibility
    await checkA11y(page, '[data-testid="error-container"]');

    // Verify error recovery flow
    const retryButton = page.locator('[data-testid="retry-button"]');
    if (await retryButton.count() > 0) {
      await expect(retryButton).toBeFocused();
      
      const ariaDescribedBy = await retryButton.getAttribute('aria-describedby');
      if (ariaDescribedBy) {
        const description = page.locator(`#${ariaDescribedBy}`);
        await expect(description).toBeVisible();
      }
    }
  });
});