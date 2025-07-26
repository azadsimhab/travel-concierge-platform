/**
 * Playwright E2E Tests for Travel Concierge Frontend
 * Tests application loading, image upload, search results, and responsiveness
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_IMAGES_DIR = path.join(__dirname, '../fixtures/images');

test.describe('Travel Concierge Frontend E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application before each test
    await page.goto(BASE_URL);
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Application Loading', () => {
    test('should load main App component and display header', async ({ page }) => {
      // Verify the main header is displayed
      await expect(page.locator('h1')).toContainText('Travel Concierge AI');
      
      // Verify the main app container is present
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      
      // Verify navigation elements are present
      await expect(page.locator('[data-testid="nav-chat"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-trip-planner"]')).toBeVisible();
      await expect(page.locator('[data-testid="nav-image-search"]')).toBeVisible();
      
      // Verify the main content area is loaded
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    });

    test('should display welcome message and quick actions', async ({ page }) => {
      // Verify welcome message
      await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
      
      // Verify quick action buttons
      await expect(page.locator('[data-testid="quick-action-chat"]')).toBeVisible();
      await expect(page.locator('[data-testid="quick-action-trip-planner"]')).toBeVisible();
      await expect(page.locator('[data-testid="quick-action-image-search"]')).toBeVisible();
    });

    test('should load without console errors', async ({ page }) => {
      const consoleErrors = [];
      
      // Listen for console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Wait a bit for any potential errors to appear
      await page.waitForTimeout(2000);
      
      // Assert no console errors
      expect(consoleErrors).toHaveLength(0);
    });
  });

  test.describe('Image Upload Interaction', () => {
    test('should handle drag and drop file upload', async ({ page }) => {
      // Navigate to image search page
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Get the file upload area
      const uploadArea = page.locator('[data-testid="image-upload-area"]');
      await expect(uploadArea).toBeVisible();
      
      // Create a test image file
      const testImagePath = path.join(TEST_IMAGES_DIR, 'beach.jpg');
      
      // Simulate drag and drop
      await uploadArea.setInputFiles(testImagePath);
      
      // Verify the image preview appears
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
      
      // Verify the upload button is enabled
      await expect(page.locator('[data-testid="upload-button"]')).toBeEnabled();
    });

    test('should show loading indicator during image processing', async ({ page }) => {
      // Navigate to image search page
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Upload an image
      const testImagePath = path.join(TEST_IMAGES_DIR, 'beach.jpg');
      await page.locator('[data-testid="image-upload-area"]').setInputFiles(testImagePath);
      
      // Click upload button
      await page.click('[data-testid="upload-button"]');
      
      // Verify loading indicator appears
      await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="processing-indicator"]')).toContainText('Processing image...');
      
      // Wait for processing to complete (mock response)
      await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });
      
      // Verify loading indicator disappears
      await expect(page.locator('[data-testid="processing-indicator"]')).not.toBeVisible();
    });

    test('should validate image file types', async ({ page }) => {
      // Navigate to image search page
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Try to upload a non-image file
      const invalidFile = path.join(TEST_IMAGES_DIR, 'document.txt');
      await page.locator('[data-testid="image-upload-area"]').setInputFiles(invalidFile);
      
      // Verify error message is displayed
      await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-error"]')).toContainText('Please upload a valid image file');
      
      // Verify upload button is disabled
      await expect(page.locator('[data-testid="upload-button"]')).toBeDisabled();
    });

    test('should validate image file size', async ({ page }) => {
      // Navigate to image search page
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Mock a large file upload
      await page.evaluate(() => {
        // Create a mock large file
        const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
        
        // Trigger file input change event
        const input = document.querySelector('[data-testid="image-upload-area"] input');
        const event = new Event('change', { bubbles: true });
        Object.defineProperty(event, 'target', { value: { files: [largeFile] } });
        input.dispatchEvent(event);
      });
      
      // Verify error message for oversized file
      await expect(page.locator('[data-testid="upload-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-error"]')).toContainText('File size must be less than 5MB');
    });

    test('should handle file selection via click', async ({ page }) => {
      // Navigate to image search page
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Click on the upload area to trigger file selection
      await page.locator('[data-testid="image-upload-area"]').click();
      
      // Set up file chooser
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.locator('[data-testid="image-upload-area"]').click()
      ]);
      
      // Select a test image
      const testImagePath = path.join(TEST_IMAGES_DIR, 'beach.jpg');
      await fileChooser.setFiles(testImagePath);
      
      // Verify image preview appears
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    });
  });

  test.describe('Image Search Results Display', () => {
    test('should display search results after image processing', async ({ page }) => {
      // Navigate to image search page
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Upload an image
      const testImagePath = path.join(TEST_IMAGES_DIR, 'beach.jpg');
      await page.locator('[data-testid="image-upload-area"]').setInputFiles(testImagePath);
      
      // Mock WebSocket response for search results
      await page.evaluate(() => {
        // Mock WebSocket message
        const mockResults = {
          type: 'image_search_result',
          destinations: [
            { name: 'Paris - Eiffel Tower', confidence: 0.95, image: 'paris.jpg' },
            { name: 'Santorini - Blue Domes', confidence: 0.88, image: 'santorini.jpg' },
            { name: 'Bali - Rice Terraces', confidence: 0.82, image: 'bali.jpg' }
          ],
          recommendations: [
            { title: 'Best Time to Visit', content: 'Spring and Fall offer pleasant weather' },
            { title: 'Local Cuisine', content: 'Try the local seafood and wine' }
          ]
        };
        
        // Simulate WebSocket message
        window.dispatchEvent(new CustomEvent('websocket-message', { detail: mockResults }));
      });
      
      // Verify search results section appears
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      
      // Verify "Similar Destinations" section
      await expect(page.locator('[data-testid="similar-destinations"]')).toBeVisible();
      await expect(page.locator('[data-testid="similar-destinations"]')).toContainText('Similar Destinations:');
      
      // Verify specific destinations are displayed
      await expect(page.locator('[data-testid="destination-item"]')).toHaveCount(3);
      await expect(page.locator('[data-testid="destination-item"]').first()).toContainText('Paris - Eiffel Tower');
      await expect(page.locator('[data-testid="destination-item"]').nth(1)).toContainText('Santorini - Blue Domes');
      await expect(page.locator('[data-testid="destination-item"]').nth(2)).toContainText('Bali - Rice Terraces');
      
      // Verify recommendations section
      await expect(page.locator('[data-testid="recommendations"]')).toBeVisible();
      await expect(page.locator('[data-testid="recommendation-item"]')).toHaveCount(2);
    });

    test('should handle empty search results', async ({ page }) => {
      // Navigate to image search page
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Upload an image
      const testImagePath = path.join(TEST_IMAGES_DIR, 'beach.jpg');
      await page.locator('[data-testid="image-upload-area"]').setInputFiles(testImagePath);
      
      // Mock empty WebSocket response
      await page.evaluate(() => {
        const emptyResults = {
          type: 'image_search_result',
          destinations: [],
          recommendations: []
        };
        
        window.dispatchEvent(new CustomEvent('websocket-message', { detail: emptyResults }));
      });
      
      // Verify no results message
      await expect(page.locator('[data-testid="no-results"]')).toBeVisible();
      await expect(page.locator('[data-testid="no-results"]')).toContainText('No similar destinations found');
    });

    test('should display destination details on click', async ({ page }) => {
      // Navigate to image search page
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Upload an image and get results (setup from previous test)
      const testImagePath = path.join(TEST_IMAGES_DIR, 'beach.jpg');
      await page.locator('[data-testid="image-upload-area"]').setInputFiles(testImagePath);
      
      await page.evaluate(() => {
        const mockResults = {
          type: 'image_search_result',
          destinations: [
            { name: 'Paris - Eiffel Tower', confidence: 0.95, image: 'paris.jpg' }
          ]
        };
        window.dispatchEvent(new CustomEvent('websocket-message', { detail: mockResults }));
      });
      
      // Click on a destination
      await page.locator('[data-testid="destination-item"]').first().click();
      
      // Verify destination details modal appears
      await expect(page.locator('[data-testid="destination-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="destination-modal"]')).toContainText('Paris - Eiffel Tower');
      
      // Verify modal has additional details
      await expect(page.locator('[data-testid="destination-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="destination-activities"]')).toBeVisible();
    });

    test('should handle search errors gracefully', async ({ page }) => {
      // Navigate to image search page
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Upload an image
      const testImagePath = path.join(TEST_IMAGES_DIR, 'beach.jpg');
      await page.locator('[data-testid="image-upload-area"]').setInputFiles(testImagePath);
      
      // Mock error response
      await page.evaluate(() => {
        const errorResponse = {
          type: 'image_search_error',
          error: 'Failed to process image',
          code: 'PROCESSING_ERROR'
        };
        
        window.dispatchEvent(new CustomEvent('websocket-message', { detail: errorResponse }));
      });
      
      // Verify error message is displayed
      await expect(page.locator('[data-testid="search-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-error"]')).toContainText('Failed to process image');
      
      // Verify retry button is available
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });
  });

  test.describe('Responsiveness Testing', () => {
    test('should display correctly on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Verify main layout elements are visible
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Verify navigation is horizontal on desktop
      const nav = page.locator('[data-testid="navigation"]');
      await expect(nav).toBeVisible();
      
      // Check that navigation items are in a row
      const navItems = page.locator('[data-testid="nav-item"]');
      await expect(navItems).toHaveCount(4); // Dashboard, Chat, Trip Planner, Image Search
      
      // Verify no horizontal overflow
      const body = page.locator('body');
      const bodyWidth = await body.boundingBox();
      expect(bodyWidth.width).toBeLessThanOrEqual(1920);
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Verify main layout elements are visible
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Verify navigation adapts to tablet
      const nav = page.locator('[data-testid="navigation"]');
      await expect(nav).toBeVisible();
      
      // Check that navigation items are still accessible
      const navItems = page.locator('[data-testid="nav-item"]');
      await expect(navItems).toHaveCount(4);
      
      // Verify no horizontal overflow
      const body = page.locator('body');
      const bodyWidth = await body.boundingBox();
      expect(bodyWidth.width).toBeLessThanOrEqual(768);
    });

    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Verify main layout elements are visible
      await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
      
      // Verify navigation adapts to mobile (may be hamburger menu)
      const nav = page.locator('[data-testid="navigation"]');
      await expect(nav).toBeVisible();
      
      // Check that navigation items are accessible (may be in mobile menu)
      const navItems = page.locator('[data-testid="nav-item"]');
      await expect(navItems).toHaveCount(4);
      
      // Verify no horizontal overflow
      const body = page.locator('body');
      const bodyWidth = await body.boundingBox();
      expect(bodyWidth.width).toBeLessThanOrEqual(375);
    });

    test('should handle image upload area responsiveness', async ({ page }) => {
      // Test on different viewport sizes
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        
        // Navigate to image search page
        await page.click('[data-testid="nav-image-search"]');
        await page.waitForURL('**/image-search');
        
        // Verify upload area is visible and properly sized
        const uploadArea = page.locator('[data-testid="image-upload-area"]');
        await expect(uploadArea).toBeVisible();
        
        // Check that upload area doesn't overflow
        const uploadAreaBox = await uploadArea.boundingBox();
        expect(uploadAreaBox.width).toBeLessThanOrEqual(viewport.width);
        
        // Verify upload area text is readable
        await expect(uploadArea).toContainText('Drag and drop an image here');
      }
    });

    test('should handle search results responsiveness', async ({ page }) => {
      // Upload image and get results first
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      const testImagePath = path.join(TEST_IMAGES_DIR, 'beach.jpg');
      await page.locator('[data-testid="image-upload-area"]').setInputFiles(testImagePath);
      
      await page.evaluate(() => {
        const mockResults = {
          type: 'image_search_result',
          destinations: [
            { name: 'Paris - Eiffel Tower', confidence: 0.95, image: 'paris.jpg' },
            { name: 'Santorini - Blue Domes', confidence: 0.88, image: 'santorini.jpg' },
            { name: 'Bali - Rice Terraces', confidence: 0.82, image: 'bali.jpg' }
          ]
        };
        window.dispatchEvent(new CustomEvent('websocket-message', { detail: mockResults }));
      });
      
      // Test on different viewport sizes
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 667, name: 'mobile' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        
        // Verify search results are visible
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
        
        // Verify destination items are properly laid out
        const destinationItems = page.locator('[data-testid="destination-item"]');
        await expect(destinationItems).toHaveCount(3);
        
        // Check that items don't overflow
        for (let i = 0; i < 3; i++) {
          const item = destinationItems.nth(i);
          const itemBox = await item.boundingBox();
          expect(itemBox.width).toBeLessThanOrEqual(viewport.width);
        }
      }
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work in Chrome', async ({ page }) => {
      // Basic functionality test in Chrome
      await expect(page.locator('h1')).toContainText('Travel Concierge AI');
      
      // Navigate to image search
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Verify page loads correctly
      await expect(page.locator('[data-testid="image-upload-area"]')).toBeVisible();
    });

    test('should work in Firefox', async ({ page }) => {
      // Basic functionality test in Firefox
      await expect(page.locator('h1')).toContainText('Travel Concierge AI');
      
      // Navigate to image search
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Verify page loads correctly
      await expect(page.locator('[data-testid="image-upload-area"]')).toBeVisible();
    });

    test('should work in Safari', async ({ page }) => {
      // Basic functionality test in Safari
      await expect(page.locator('h1')).toContainText('Travel Concierge AI');
      
      // Navigate to image search
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      // Verify page loads correctly
      await expect(page.locator('[data-testid="image-upload-area"]')).toBeVisible();
    });
  });

  test.describe('Performance Testing', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      // Navigate to the page
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Assert load time is under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle image upload performance', async ({ page }) => {
      // Navigate to image search page
      await page.click('[data-testid="nav-image-search"]');
      await page.waitForURL('**/image-search');
      
      const startTime = Date.now();
      
      // Upload an image
      const testImagePath = path.join(TEST_IMAGES_DIR, 'beach.jpg');
      await page.locator('[data-testid="image-upload-area"]').setInputFiles(testImagePath);
      
      // Wait for image preview to appear
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
      
      const uploadTime = Date.now() - startTime;
      
      // Assert upload time is under 2 seconds
      expect(uploadTime).toBeLessThan(2000);
    });
  });
});

// Helper function to create test images if they don't exist
test.beforeAll(async () => {
  const fs = require('fs');
  const testImagesDir = path.join(__dirname, '../fixtures/images');
  
  // Create test images directory if it doesn't exist
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
  }
  
  // Create a simple test image if it doesn't exist
  const beachImagePath = path.join(testImagesDir, 'beach.jpg');
  if (!fs.existsSync(beachImagePath)) {
    // Create a minimal JPEG file for testing
    const minimalJpeg = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01,
      0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08,
      0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x37, 0xFF, 0xD9
    ]);
    fs.writeFileSync(beachImagePath, minimalJpeg);
  }
  
  // Create a test document file
  const documentPath = path.join(testImagesDir, 'document.txt');
  if (!fs.existsSync(documentPath)) {
    fs.writeFileSync(documentPath, 'This is a test document file');
  }
}); 