const { device, expect, element, by, waitFor } = require('detox');

// Test timeout configuration
jest.setTimeout(120000);

// Global test setup
beforeAll(async () => {
  console.log('🚀 Starting E2E Test Suite');
  
  // Device setup
  await device.launchApp({
    permissions: {
      notifications: 'YES',
      camera: 'YES',
      photos: 'YES',
      microphone: 'YES',
      location: 'always'
    },
    launchArgs: {
      detoxE2ETest: 'true',
      detoxEnableSynchronization: '0'
    }
  });
  
  // Wait for app to fully load
  await waitFor(element(by.id('app-root')))
    .toBeVisible()
    .withTimeout(30000);
    
  console.log('✅ App launched successfully');
});

beforeEach(async () => {
  // Reset app state before each test
  await device.reloadReactNative();
  
  // Clear notifications
  await device.clearKeychain();
  
  // Reset network conditions
  await device.setNetworkConditions('good');
});

afterEach(async () => {
  // Take screenshot on test failure
  if (global.testResult && global.testResult.failureDetails.length > 0) {
    const testName = expect.getState().currentTestName;
    await device.takeScreenshot(`failed-${testName}`);
  }
  
  // Clear app data
  await device.clearKeychain();
});

afterAll(async () => {
  console.log('🏁 E2E Test Suite Complete');
  await device.terminateApp();
});

// Global test helpers
global.testHelpers = {
  // Authentication helpers
  async signInUser(email = 'test@example.com', password = 'TestPassword123!') {
    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('sign-in-button')).tap();
    
    // Wait for navigation to home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  },

  async signUpUser(userData = {}) {
    const {
      email = 'newuser@example.com',
      password = 'TestPassword123!',
      fullName = 'Test User',
      username = 'testuser123'
    } = userData;

    await element(by.id('email-input')).typeText(email);
    await element(by.id('password-input')).typeText(password);
    await element(by.id('confirm-password-input')).typeText(password);
    await element(by.id('sign-up-button')).tap();
    
    // Complete onboarding
    await this.completeOnboarding({ fullName, username });
  },

  async completeOnboarding(userData = {}) {
    const {
      fullName = 'Test User',
      username = 'testuser123',
      university = 'Test University',
      graduationYear = '2025'
    } = userData;

    // Personal details step
    await waitFor(element(by.id('onboarding-personal-step')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.id('full-name-input')).typeText(fullName);
    await element(by.id('username-input')).typeText(username);
    await element(by.id('next-button')).tap();

    // Education details step
    await waitFor(element(by.id('onboarding-education-step')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.id('university-input')).typeText(university);
    await element(by.id('graduation-year-input')).typeText(graduationYear);
    await element(by.id('next-button')).tap();

    // Notification step
    await waitFor(element(by.id('onboarding-notification-step')))
      .toBeVisible()
      .withTimeout(5000);
      
    await element(by.id('complete-button')).tap();

    // Wait for home screen
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  },

  async signOut() {
    await element(by.id('profile-tab')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.id('sign-out-button')).tap();
    
    // Confirm sign out
    await element(by.text('Sign Out')).tap();
    
    // Wait for welcome screen
    await waitFor(element(by.id('welcome-screen')))
      .toBeVisible()
      .withTimeout(5000);
  },

  // Navigation helpers
  async navigateToTab(tabName) {
    const tabId = `${tabName.toLowerCase()}-tab`;
    await element(by.id(tabId)).tap();
    
    const screenId = `${tabName.toLowerCase()}-screen`;
    await waitFor(element(by.id(screenId)))
      .toBeVisible()
      .withTimeout(3000);
  },

  async goBack() {
    await element(by.id('back-button')).tap();
  },

  // Post helpers
  async createPost(content, images = []) {
    await element(by.id('create-post-button')).tap();
    
    await waitFor(element(by.id('create-post-modal')))
      .toBeVisible()
      .withTimeout(3000);
      
    await element(by.id('post-content-input')).typeText(content);
    
    // Add images if provided
    if (images.length > 0) {
      await element(by.id('image-picker-button')).tap();
      await element(by.id('gallery-option')).tap();
      
      // Select first image (mock selection)
      await element(by.id('image-0')).tap();
      await element(by.id('confirm-selection')).tap();
    }
    
    await element(by.id('post-button')).tap();
    
    // Wait for post to appear in feed
    await waitFor(element(by.text(content)))
      .toBeVisible()
      .withTimeout(5000);
  },

  async likePost(postId) {
    await element(by.id(`like-button-${postId}`)).tap();
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 500));
  },

  async commentOnPost(postId, comment) {
    await element(by.id(`comment-button-${postId}`)).tap();
    
    await waitFor(element(by.id('comment-input')))
      .toBeVisible()
      .withTimeout(3000);
      
    await element(by.id('comment-input')).typeText(comment);
    await element(by.id('send-comment-button')).tap();
    
    // Wait for comment to appear
    await waitFor(element(by.text(comment)))
      .toBeVisible()
      .withTimeout(3000);
  },

  // Chat helpers
  async startChat(userName) {
    await this.navigateToTab('chat');
    await element(by.id('new-chat-button')).tap();
    
    await element(by.id('search-users-input')).typeText(userName);
    await element(by.id(`user-result-${userName}`)).tap();
    await element(by.id('start-chat-button')).tap();
    
    // Wait for chat screen
    await waitFor(element(by.id('chat-messages')))
      .toBeVisible()
      .withTimeout(5000);
  },

  async sendMessage(message) {
    await element(by.id('message-input')).typeText(message);
    await element(by.id('send-button')).tap();
    
    // Wait for message to appear
    await waitFor(element(by.text(message)))
      .toBeVisible()
      .withTimeout(3000);
  },

  async sendImage() {
    await element(by.id('attach-image-button')).tap();
    await element(by.id('camera-option')).tap();
    
    // Mock camera capture
    await element(by.id('capture-button')).tap();
    await element(by.id('use-photo-button')).tap();
    
    // Wait for image message
    await waitFor(element(by.id('image-message')))
      .toBeVisible()
      .withTimeout(5000);
  },

  // Group helpers
  async createGroup(groupName, members = []) {
    await this.navigateToTab('groups');
    await element(by.id('create-group-button')).tap();
    
    await element(by.id('group-name-input')).typeText(groupName);
    
    // Add members
    for (const member of members) {
      await element(by.id('add-member-button')).tap();
      await element(by.id('search-input')).typeText(member);
      await element(by.id(`user-${member}`)).tap();
      await element(by.id('add-button')).tap();
    }
    
    await element(by.id('create-group-submit')).tap();
    
    // Wait for group to be created
    await waitFor(element(by.text(groupName)))
      .toBeVisible()
      .withTimeout(5000);
  },

  async joinGroup(groupId) {
    await element(by.id(`join-group-${groupId}`)).tap();
    
    // Wait for join confirmation
    await waitFor(element(by.text('Joined')))
      .toBeVisible()
      .withTimeout(3000);
  },

  // Search helpers
  async searchUsers(query) {
    await this.navigateToTab('search');
    await element(by.id('search-input')).typeText(query);
    
    // Wait for results
    await waitFor(element(by.id('search-results')))
      .toBeVisible()
      .withTimeout(3000);
  },

  async followUser(username) {
    await element(by.id(`follow-button-${username}`)).tap();
    
    // Wait for follow confirmation
    await waitFor(element(by.id(`following-${username}`)))
      .toBeVisible()
      .withTimeout(3000);
  },

  // Error helpers
  async waitForError(errorMessage) {
    await waitFor(element(by.text(errorMessage)))
      .toBeVisible()
      .withTimeout(5000);
  },

  async dismissError() {
    await element(by.id('dismiss-error')).tap();
  },

  // Network helpers
  async setOfflineMode() {
    await device.setNetworkConditions('offline');
  },

  async setSlowNetwork() {
    await device.setNetworkConditions('slow');
  },

  async restoreNetwork() {
    await device.setNetworkConditions('good');
  },

  // Utility helpers
  async scrollToElement(elementId, direction = 'down') {
    const scrollView = element(by.id('scroll-view'));
    
    while (true) {
      try {
        await waitFor(element(by.id(elementId)))
          .toBeVisible()
          .withTimeout(1000);
        break;
      } catch (e) {
        await scrollView.scroll(200, direction);
      }
    }
  },

  async waitForElement(elementId, timeout = 5000) {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(timeout);
  },

  async takeScreenshot(name) {
    await device.takeScreenshot(name);
  },

  async clearAppData() {
    await device.clearKeychain();
    await device.reloadReactNative();
  },

  // Performance helpers
  async measureStartupTime() {
    const startTime = Date.now();
    
    await device.launchApp({ newInstance: true });
    await waitFor(element(by.id('app-root')))
      .toBeVisible()
      .withTimeout(30000);
      
    const endTime = Date.now();
    return endTime - startTime;
  },

  async measureScrollPerformance() {
    const startTime = Date.now();
    
    // Perform scroll operations
    for (let i = 0; i < 10; i++) {
      await element(by.id('scroll-view')).scroll(300, 'down');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const endTime = Date.now();
    return endTime - startTime;
  },

  // Accessibility helpers
  async checkAccessibility() {
    // Enable accessibility services
    await device.enableSynchronization();
    
    // Check for accessibility labels
    const elements = await element(by.type('RCTView')).getAttributes();
    
    return elements.some(el => 
      el.accessibilityLabel || el.accessibilityHint || el.accessibilityRole
    );
  }
};

// Custom matchers
expect.extend({
  async toBeVisibleOnScreen(elementMatcher) {
    try {
      await waitFor(elementMatcher).toBeVisible().withTimeout(5000);
      return {
        message: () => 'Element is visible',
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Element is not visible: ${error.message}`,
        pass: false,
      };
    }
  },

  async toHaveAccessibilityLabel(elementMatcher, expectedLabel) {
    const attributes = await elementMatcher.getAttributes();
    const hasLabel = attributes.accessibilityLabel === expectedLabel;
    
    return {
      message: () => hasLabel 
        ? `Element has accessibility label: ${expectedLabel}`
        : `Element does not have accessibility label: ${expectedLabel}`,
      pass: hasLabel,
    };
  }
});

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('📱 E2E Test Environment Initialized'); 