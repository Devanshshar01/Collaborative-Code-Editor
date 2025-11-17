import {test, expect, chromium, Browser, BrowserContext, Page} from '@playwright/test';

test.describe('Collaborative Editing - E2E Tests', () => {
    let browser1: Browser;
    let browser2: Browser;
    let context1: BrowserContext;
    let context2: BrowserContext;
    let page1: Page;
    let page2: Page;

    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    const ROOM_ID = `test-room-${Date.now()}`;

    test.beforeAll(async () => {
        // Launch two separate browsers to simulate two different users
        browser1 = await chromium.launch();
        browser2 = await chromium.launch();

        context1 = await browser1.newContext({
            permissions: ['microphone', 'camera']
        });
        context2 = await browser2.newContext({
            permissions: ['microphone', 'camera']
        });

        page1 = await context1.newPage();
        page2 = await context2.newPage();
    });

    test.afterAll(async () => {
        await context1.close();
        await context2.close();
        await browser1.close();
        await browser2.close();
    });

    test('Two users join the same room', async () => {
        // User 1 joins room
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page1.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});

        // Verify user 1 is connected
        await expect(page1.locator('[data-testid="user-list"]')).toBeVisible();

        // User 2 joins same room
        await page2.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page2.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});

        // Verify both users see each other
        await page1.waitForSelector('[data-testid="user-count"]');
        const userCount1 = await page1.locator('[data-testid="user-count"]').textContent();
        expect(parseInt(userCount1 || '0')).toBeGreaterThanOrEqual(2);

        const userCount2 = await page2.locator('[data-testid="user-count"]').textContent();
        expect(parseInt(userCount2 || '0')).toBeGreaterThanOrEqual(2);
    });

    test('User 1 types code and User 2 sees changes in real-time', async () => {
        // User 1 joins room
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page1.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});

        // User 2 joins room
        await page2.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page2.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});

        // Wait for both to be connected
        await page1.waitForTimeout(2000);

        // User 1 types code
        const testCode = '// Test collaborative editing\nconsole.log("Hello from User 1");';
        const editor1 = page1.locator('[data-testid="code-editor"]').first();
        await editor1.click();
        await page1.keyboard.type(testCode, {delay: 50});

        // Wait for synchronization
        await page1.waitForTimeout(1000);

        // Verify User 2 sees the changes
        const editor2 = page2.locator('[data-testid="code-editor"]').first();
        const editor2Text = await editor2.textContent();
        expect(editor2Text).toContain('Test collaborative editing');
        expect(editor2Text).toContain('Hello from User 1');
    });

    test('Bidirectional editing works correctly', async () => {
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page2.goto(`${BASE_URL}/room/${ROOM_ID}`);

        await page1.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});
        await page2.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});

        await page1.waitForTimeout(2000);

        // User 1 types
        const editor1 = page1.locator('[data-testid="code-editor"]').first();
        await editor1.click();
        await page1.keyboard.type('function user1() {\n', {delay: 50});

        await page1.waitForTimeout(500);

        // User 2 types
        const editor2 = page2.locator('[data-testid="code-editor"]').first();
        await editor2.click();
        await page2.keyboard.press('End');
        await page2.keyboard.type('  return "from user 1";\n}\n', {delay: 50});

        await page2.waitForTimeout(500);

        // User 1 adds more
        await page1.keyboard.press('End');
        await page1.keyboard.type('\nfunction user2() {\n  return "from user 2";\n}', {delay: 50});

        await page1.waitForTimeout(1000);

        // Verify both see complete code
        const text1 = await editor1.textContent();
        const text2 = await editor2.textContent();

        expect(text1).toContain('user1');
        expect(text1).toContain('user2');
        expect(text2).toContain('user1');
        expect(text2).toContain('user2');
    });

    test('Cursor synchronization between users', async () => {
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page2.goto(`${BASE_URL}/room/${ROOM_ID}`);

        await page1.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});
        await page2.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});

        await page1.waitForTimeout(2000);

        // User 1 moves cursor
        const editor1 = page1.locator('[data-testid="code-editor"]').first();
        await editor1.click({position: {x: 100, y: 50}});

        await page1.waitForTimeout(1000);

        // Verify User 2 sees User 1's cursor
        const remoteCursor = page2.locator('[data-testid="remote-cursor"]').first();
        await expect(remoteCursor).toBeVisible({timeout: 5000});

        // Get cursor position/label
        const cursorLabel = await remoteCursor.getAttribute('data-user');
        expect(cursorLabel).toBeTruthy();
    });

    test('Test deletion synchronization', async () => {
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page2.goto(`${BASE_URL}/room/${ROOM_ID}`);

        await page1.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});
        await page2.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});

        await page1.waitForTimeout(2000);

        // User 1 types initial code
        const editor1 = page1.locator('[data-testid="code-editor"]').first();
        await editor1.click();
        await page1.keyboard.type('DELETE_THIS_TEXT', {delay: 50});

        await page1.waitForTimeout(1000);

        // User 1 selects all and deletes
        await page1.keyboard.press('Control+A');
        await page1.keyboard.press('Backspace');

        await page1.waitForTimeout(1000);

        // Verify User 2 sees the deletion
        const editor2 = page2.locator('[data-testid="code-editor"]').first();
        const text2 = await editor2.textContent();
        expect(text2).not.toContain('DELETE_THIS_TEXT');
    });

    test('Test undo/redo synchronization', async () => {
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page2.goto(`${BASE_URL}/room/${ROOM_ID}`);

        await page1.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});
        await page2.waitForSelector('[data-testid="code-editor"]', {timeout: 10000});

        await page1.waitForTimeout(2000);

        // User 1 types
        const editor1 = page1.locator('[data-testid="code-editor"]').first();
        await editor1.click();
        await page1.keyboard.type('First line\n', {delay: 50});
        await page1.keyboard.type('Second line\n', {delay: 50});

        await page1.waitForTimeout(1000);

        // User 1 undoes
        await page1.keyboard.press('Control+Z');

        await page1.waitForTimeout(1000);

        // Verify User 2 sees the undo
        const editor2 = page2.locator('[data-testid="code-editor"]').first();
        const text2 = await editor2.textContent();
        expect(text2).toContain('First line');
        expect(text2).not.toContain('Second line');
    });
});

test.describe('Video Call Connection - E2E Tests', () => {
    let browser1: Browser;
    let browser2: Browser;
    let context1: BrowserContext;
    let context2: BrowserContext;
    let page1: Page;
    let page2: Page;

    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    const ROOM_ID = `video-room-${Date.now()}`;

    test.beforeAll(async () => {
        browser1 = await chromium.launch();
        browser2 = await chromium.launch();

        // Grant permissions for media devices
        context1 = await browser1.newContext({
            permissions: ['microphone', 'camera'],
            deviceScaleFactor: 1,
        });
        context2 = await browser2.newContext({
            permissions: ['microphone', 'camera'],
            deviceScaleFactor: 1,
        });

        page1 = await context1.newPage();
        page2 = await context2.newPage();
    });

    test.afterAll(async () => {
        await context1.close();
        await context2.close();
        await browser1.close();
        await browser2.close();
    });

    test('Users can initiate video call', async () => {
        // Both users join room
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page2.goto(`${BASE_URL}/room/${ROOM_ID}`);

        await page1.waitForSelector('[data-testid="video-call-button"]', {timeout: 10000});
        await page2.waitForSelector('[data-testid="video-call-button"]', {timeout: 10000});

        // User 1 starts video call
        await page1.click('[data-testid="video-call-button"]');
        await page1.waitForTimeout(2000);

        // Verify video UI is visible for User 1
        await expect(page1.locator('[data-testid="video-container"]')).toBeVisible();
        await expect(page1.locator('[data-testid="local-video"]')).toBeVisible();

        // User 2 starts their video
        await page2.click('[data-testid="video-call-button"]');
        await page2.waitForTimeout(3000);

        // Verify both see each other's video
        await expect(page1.locator('[data-testid="remote-video"]').first()).toBeVisible({timeout: 10000});
        await expect(page2.locator('[data-testid="remote-video"]').first()).toBeVisible({timeout: 10000});
    });

    test('Audio mute/unmute functionality', async () => {
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page2.goto(`${BASE_URL}/room/${ROOM_ID}`);

        await page1.waitForSelector('[data-testid="video-call-button"]', {timeout: 10000});

        // Start video call
        await page1.click('[data-testid="video-call-button"]');
        await page1.waitForTimeout(2000);

        // Toggle mute
        const muteButton = page1.locator('[data-testid="mute-button"]');
        await muteButton.click();

        await page1.waitForTimeout(500);

        // Verify muted state
        const isMuted = await muteButton.getAttribute('data-muted');
        expect(isMuted).toBe('true');

        // Unmute
        await muteButton.click();
        await page1.waitForTimeout(500);

        const isUnmuted = await muteButton.getAttribute('data-muted');
        expect(isUnmuted).toBe('false');
    });

    test('Video on/off functionality', async () => {
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page1.waitForSelector('[data-testid="video-call-button"]', {timeout: 10000});

        // Start video call
        await page1.click('[data-testid="video-call-button"]');
        await page1.waitForTimeout(2000);

        // Toggle video off
        const videoButton = page1.locator('[data-testid="video-toggle-button"]');
        await videoButton.click();

        await page1.waitForTimeout(500);

        // Verify video off state
        const isVideoOff = await videoButton.getAttribute('data-video-off');
        expect(isVideoOff).toBe('true');
    });

    test('Screen sharing functionality', async () => {
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page1.waitForSelector('[data-testid="video-call-button"]', {timeout: 10000});

        // Start video call
        await page1.click('[data-testid="video-call-button"]');
        await page1.waitForTimeout(2000);

        // Check if screen share button exists
        const screenShareButton = page1.locator('[data-testid="screen-share-button"]');
        await expect(screenShareButton).toBeVisible();

        // Note: Actually clicking screen share requires user interaction in real browsers
        // This test just verifies the button is present and clickable
        const isEnabled = await screenShareButton.isEnabled();
        expect(isEnabled).toBe(true);
    });

    test('Multiple participants in video call', async () => {
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page2.goto(`${BASE_URL}/room/${ROOM_ID}`);

        await page1.waitForSelector('[data-testid="video-call-button"]', {timeout: 10000});
        await page2.waitForSelector('[data-testid="video-call-button"]', {timeout: 10000});

        // Both users start video
        await page1.click('[data-testid="video-call-button"]');
        await page2.click('[data-testid="video-call-button"]');

        await page1.waitForTimeout(5000);

        // Verify multiple video streams
        const remoteVideos1 = page1.locator('[data-testid="remote-video"]');
        const remoteVideos2 = page2.locator('[data-testid="remote-video"]');

        const count1 = await remoteVideos1.count();
        const count2 = await remoteVideos2.count();

        expect(count1).toBeGreaterThanOrEqual(1);
        expect(count2).toBeGreaterThanOrEqual(1);
    });

    test('Video call persists during code editing', async () => {
        await page1.goto(`${BASE_URL}/room/${ROOM_ID}`);
        await page2.goto(`${BASE_URL}/room/${ROOM_ID}`);

        await page1.waitForSelector('[data-testid="video-call-button"]', {timeout: 10000});

        // Start video call
        await page1.click('[data-testid="video-call-button"]');
        await page2.click('[data-testid="video-call-button"]');

        await page1.waitForTimeout(3000);

        // Edit code while video is active
        const editor1 = page1.locator('[data-testid="code-editor"]').first();
        await editor1.click();
        await page1.keyboard.type('// Coding during video call\n', {delay: 50});

        await page1.waitForTimeout(1000);

        // Verify video still active
        await expect(page1.locator('[data-testid="local-video"]')).toBeVisible();
        await expect(page2.locator('[data-testid="remote-video"]').first()).toBeVisible();

        // Verify code was synchronized
        const editor2 = page2.locator('[data-testid="code-editor"]').first();
        const text2 = await editor2.textContent();
        expect(text2).toContain('Coding during video call');
    });
});
