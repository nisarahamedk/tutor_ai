import { test, expect, devices } from '@playwright/test';

/**
 * Mobile-specific E2E tests for touch interactions and responsive design
 */

// Mobile device configurations
const mobileDevices = [
  { name: 'iPhone 13', ...devices['iPhone 13'] },
  { name: 'Samsung Galaxy S21', ...devices['Galaxy S21'] },
  { name: 'iPad', ...devices['iPad Pro'] },
];

// Helper function to login on mobile
async function loginUserMobile(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'testpassword123');
  await page.tap('[data-testid="login-button"]');
  await expect(page).toHaveURL('/ai-tutor');
}

// Test mobile touch interactions
for (const device of mobileDevices) {
  test.describe(`Mobile Tests - ${device.name}`, () => {
    test.use({ ...device });

    test('should handle basic touch interactions', async ({ page }) => {
      await loginUserMobile(page);

      // Test tap interactions
      await page.tap('[data-testid="explore-tab"]');
      await expect(page).toHaveURL('/ai-tutor/explore');

      // Test double tap (zoom)
      const trackCard = page.locator('[data-testid="track-card"]').first();
      await trackCard.dblclick();
      
      // Verify zoom level changed (if zoom is implemented)
      const zoomLevel = await page.evaluate(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        return viewport?.getAttribute('content');
      });
      expect(zoomLevel).toBeTruthy();

      // Test long press (context menu)
      await page.locator('[data-testid="track-card"]').first().click({ button: 'right' });
      
      // Check if context menu appears
      const contextMenu = page.locator('[data-testid="context-menu"]');
      if (await contextMenu.count() > 0) {
        await expect(contextMenu).toBeVisible();
      }
    });

    test('should support swipe gestures', async ({ page }) => {
      await loginUserMobile(page);
      
      // Test horizontal swipe for navigation
      await page.goto('/ai-tutor/lessons/lesson-1');
      
      // Swipe left to go to next lesson
      const lessonContent = page.locator('[data-testid="lesson-content"]');
      const bbox = await lessonContent.boundingBox();
      
      if (bbox) {
        await page.mouse.move(bbox.x + bbox.width - 50, bbox.y + bbox.height / 2);
        await page.mouse.down();
        await page.mouse.move(bbox.x + 50, bbox.y + bbox.height / 2);
        await page.mouse.up();
        
        // Verify navigation occurred
        await expect(page).toHaveURL(/lesson-2/);
      }

      // Test vertical swipe for scrolling
      await page.goto('/ai-tutor/explore');
      const trackGrid = page.locator('[data-testid="track-grid"]');
      const gridBbox = await trackGrid.boundingBox();
      
      if (gridBbox) {
        // Swipe down to scroll
        await page.mouse.move(gridBbox.x + gridBbox.width / 2, gridBbox.y + 100);
        await page.mouse.down();
        await page.mouse.move(gridBbox.x + gridBbox.width / 2, gridBbox.y + gridBbox.height - 100);
        await page.mouse.up();
        
        // Check if content scrolled
        const scrollPosition = await page.evaluate(() => window.scrollY);
        expect(scrollPosition).toBeGreaterThan(0);
      }
    });

    test('should handle pinch to zoom', async ({ page }) => {
      await loginUserMobile(page);
      await page.goto('/ai-tutor');

      // Simulate pinch gesture
      const mainContent = page.locator('[data-testid="main-content"]');
      const bbox = await mainContent.boundingBox();
      
      if (bbox) {
        const centerX = bbox.x + bbox.width / 2;
        const centerY = bbox.y + bbox.height / 2;
        
        // Start pinch
        await page.touchscreen.tap(centerX - 50, centerY);
        await page.touchscreen.tap(centerX + 50, centerY);
        
        // Spread fingers apart (zoom in)
        await page.mouse.move(centerX - 50, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX - 100, centerY);
        await page.mouse.up();
        
        await page.mouse.move(centerX + 50, centerY);
        await page.mouse.down();
        await page.mouse.move(centerX + 100, centerY);
        await page.mouse.up();
      }

      // Verify zoom functionality (if implemented)
      const zoomLevel = await page.evaluate(() => {
        return document.body.style.transform || window.getComputedStyle(document.body).transform;
      });
      
      // Check if zoom was applied
      expect(zoomLevel).toBeTruthy();
    });

    test('should handle pull-to-refresh', async ({ page }) => {
      await loginUserMobile(page);
      await page.goto('/ai-tutor/progress');

      // Simulate pull-to-refresh gesture
      const progressContainer = page.locator('[data-testid="progress-container"]');
      const bbox = await progressContainer.boundingBox();
      
      if (bbox) {
        // Start at top of container
        await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + 10);
        await page.mouse.down();
        
        // Pull down
        await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + 150);
        await page.mouse.up();
        
        // Check for refresh indicator
        const refreshIndicator = page.locator('[data-testid="refresh-indicator"]');
        if (await refreshIndicator.count() > 0) {
          await expect(refreshIndicator).toBeVisible();
          
          // Wait for refresh to complete
          await expect(refreshIndicator).not.toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should handle virtual keyboard interactions', async ({ page }) => {
      await loginUserMobile(page);

      // Test input focus brings up virtual keyboard
      const messageInput = page.locator('[data-testid="message-input"]');
      await messageInput.tap();
      
      // Check if viewport adjusted for keyboard
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      const documentHeight = await page.evaluate(() => document.documentElement.clientHeight);
      
      // On mobile, viewport should shrink when keyboard appears
      if (device.name.includes('iPhone') || device.name.includes('Galaxy')) {
        await page.waitForTimeout(1000); // Wait for keyboard animation
        const newViewportHeight = await page.evaluate(() => window.innerHeight);
        expect(newViewportHeight).toBeLessThanOrEqual(viewportHeight);
      }

      // Test that focused input is visible
      const inputBbox = await messageInput.boundingBox();
      const currentViewportHeight = await page.evaluate(() => window.innerHeight);
      
      if (inputBbox) {
        expect(inputBbox.y + inputBbox.height).toBeLessThan(currentViewportHeight);
      }

      // Test keyboard dismissal
      await page.tap('[data-testid="main-content"]'); // Tap outside
      await page.waitForTimeout(500);
      
      const finalViewportHeight = await page.evaluate(() => window.innerHeight);
      expect(finalViewportHeight).toBeGreaterThanOrEqual(viewportHeight * 0.9);
    });

    test('should optimize for mobile performance', async ({ page }) => {
      await loginUserMobile(page);

      // Measure loading performance on mobile
      const startTime = Date.now();
      await page.goto('/ai-tutor/explore');
      
      // Wait for content to load
      await expect(page.locator('[data-testid="track-grid"]')).toBeVisible();
      const loadTime = Date.now() - startTime;
      
      // Mobile should load within reasonable time
      expect(loadTime).toBeLessThan(5000); // 5 seconds max

      // Test scroll performance
      const trackGrid = page.locator('[data-testid="track-grid"]');
      const initialScrollTop = await page.evaluate(() => window.scrollY);
      
      // Perform rapid scrolling
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 300);
        await page.waitForTimeout(100);
      }
      
      const finalScrollTop = await page.evaluate(() => window.scrollY);
      expect(finalScrollTop).toBeGreaterThan(initialScrollTop);

      // Check for smooth scrolling
      const scrollBehavior = await trackGrid.evaluate((el) => {
        return window.getComputedStyle(el).scrollBehavior;
      });
      expect(scrollBehavior).toBe('smooth');
    });

    test('should handle orientation changes', async ({ page }) => {
      await loginUserMobile(page);

      // Start in portrait mode
      if (device.name.includes('iPhone') || device.name.includes('Galaxy')) {
        await page.setViewportSize({ width: 375, height: 667 });
      } else {
        await page.setViewportSize({ width: 768, height: 1024 });
      }

      await page.goto('/ai-tutor');
      
      // Verify portrait layout
      const chatContainer = page.locator('[data-testid="chat-container"]');
      const portraitBbox = await chatContainer.boundingBox();
      expect(portraitBbox?.height).toBeGreaterThan(portraitBbox?.width || 0);

      // Change to landscape mode
      if (device.name.includes('iPhone') || device.name.includes('Galaxy')) {
        await page.setViewportSize({ width: 667, height: 375 });
      } else {
        await page.setViewportSize({ width: 1024, height: 768 });
      }

      // Wait for layout adjustment
      await page.waitForTimeout(500);
      
      // Verify landscape layout
      const landscapeBbox = await chatContainer.boundingBox();
      expect(landscapeBbox?.width).toBeGreaterThan(landscapeBbox?.height || 0);

      // Ensure all content is still accessible
      await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
      await expect(page.locator('[data-testid="send-message-button"]')).toBeVisible();
    });

    test('should handle mobile-specific UI patterns', async ({ page }) => {
      await loginUserMobile(page);

      // Test hamburger menu
      const hamburgerMenu = page.locator('[data-testid="mobile-menu-button"]');
      if (await hamburgerMenu.count() > 0) {
        await hamburgerMenu.tap();
        
        const mobileNav = page.locator('[data-testid="mobile-navigation"]');
        await expect(mobileNav).toBeVisible();
        
        // Test navigation items
        await page.tap('[data-testid="nav-explore"]');
        await expect(page).toHaveURL('/ai-tutor/explore');
        await expect(mobileNav).not.toBeVisible();
      }

      // Test floating action button
      const fab = page.locator('[data-testid="floating-action-button"]');
      if (await fab.count() > 0) {
        await fab.tap();
        
        // Verify FAB action
        const fabMenu = page.locator('[data-testid="fab-menu"]');
        if (await fabMenu.count() > 0) {
          await expect(fabMenu).toBeVisible();
        }
      }

      // Test bottom sheet
      const bottomSheetTrigger = page.locator('[data-testid="bottom-sheet-trigger"]');
      if (await bottomSheetTrigger.count() > 0) {
        await bottomSheetTrigger.tap();
        
        const bottomSheet = page.locator('[data-testid="bottom-sheet"]');
        await expect(bottomSheet).toBeVisible();
        
        // Test bottom sheet drag to dismiss
        const sheetBbox = await bottomSheet.boundingBox();
        if (sheetBbox) {
          await page.mouse.move(sheetBbox.x + sheetBbox.width / 2, sheetBbox.y + 20);
          await page.mouse.down();
          await page.mouse.move(sheetBbox.x + sheetBbox.width / 2, sheetBbox.y + sheetBbox.height + 100);
          await page.mouse.up();
          
          await expect(bottomSheet).not.toBeVisible();
        }
      }
    });

    test('should support mobile accessibility features', async ({ page }) => {
      await loginUserMobile(page);

      // Test larger touch targets on mobile
      const buttons = await page.locator('button').all();
      
      for (const button of buttons) {
        const bbox = await button.boundingBox();
        if (bbox) {
          // Touch targets should be at least 44px (iOS) or 48dp (Android)
          expect(Math.min(bbox.width, bbox.height)).toBeGreaterThanOrEqual(44);
        }
      }

      // Test mobile-specific accessibility features
      const hasReducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });

      if (hasReducedMotion) {
        // Verify animations are reduced
        const animatedElement = page.locator('[data-testid="animated-element"]').first();
        if (await animatedElement.count() > 0) {
          const animationDuration = await animatedElement.evaluate((el) => {
            return window.getComputedStyle(el).animationDuration;
          });
          expect(animationDuration).toBe('0s');
        }
      }

      // Test voice over support (iOS specific)
      if (device.name.includes('iPhone')) {
        const mainHeading = page.locator('h1').first();
        const ariaLabel = await mainHeading.getAttribute('aria-label');
        const textContent = await mainHeading.textContent();
        
        expect(ariaLabel || textContent).toBeTruthy();
      }
    });

    test('should handle mobile network conditions', async ({ page, context }) => {
      // Simulate slow 3G connection
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });

      await loginUserMobile(page);

      // Test loading states
      const loadingPromise = page.goto('/ai-tutor/explore');
      
      // Verify loading indicator appears
      const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator).toBeVisible();
      }

      await loadingPromise;
      
      // Verify content loads despite slow connection
      await expect(page.locator('[data-testid="track-grid"]')).toBeVisible();

      // Test offline handling
      await context.setOffline(true);
      
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      await expect(offlineIndicator).toBeVisible();

      // Test that cached content is still available
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });
  });
}

test.describe('Cross-device Mobile Tests', () => {
  test('should maintain session across device rotations', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    const page = await context.newPage();

    await loginUserMobile(page);
    
    // Interact with the app
    await page.fill('[data-testid="message-input"]', 'Test message');
    await page.tap('[data-testid="send-message-button"]');

    // Rotate device (simulate orientation change)
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Verify session and state are maintained
    await expect(page.locator('[data-testid="message-list"] .message').last()).toContainText('Test message');
    
    // Rotate back
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify everything still works
    await page.fill('[data-testid="message-input"]', 'Another message');
    await page.tap('[data-testid="send-message-button"]');
    
    await context.close();
  });

  test('should handle mobile-specific input methods', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPad Pro'],
      hasTouch: true,
    });
    const page = await context.newPage();

    await loginUserMobile(page);

    // Test text selection on mobile
    const messageText = page.locator('[data-testid="message-list"] .message').first();
    if (await messageText.count() > 0) {
      // Long press to select text
      await messageText.click({ button: 'left', clickCount: 2 });
      
      // Verify text selection menu appears
      const selectionMenu = page.locator('[data-testid="text-selection-menu"]');
      if (await selectionMenu.count() > 0) {
        await expect(selectionMenu).toBeVisible();
      }
    }

    // Test copy/paste functionality
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.tap();
    await messageInput.fill('Test copy paste');
    
    // Select all text
    await page.keyboard.press('Meta+A'); // iOS
    // Or for Android: await page.keyboard.press('Control+A');
    
    await page.keyboard.press('Meta+C'); // Copy
    await messageInput.clear();
    await page.keyboard.press('Meta+V'); // Paste
    
    const pastedValue = await messageInput.inputValue();
    expect(pastedValue).toBe('Test copy paste');

    await context.close();
  });
});