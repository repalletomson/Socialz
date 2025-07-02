import { InteractionManager } from 'react-native';
import { router } from 'expo-router';

// Safe navigation utility to prevent ViewGroup errors
export const safeNavigate = (route, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // Wait for all interactions to complete before navigating
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          try {
            if (options.replace) {
              router.replace(route);
            } else if (options.push) {
              router.push(route);
            } else {
              router.navigate(route);
            }
            resolve(true);
          } catch (error) {
            console.warn('Navigation error:', error);
            // Fallback navigation
            setTimeout(() => {
              try {
                router.replace(route);
                resolve(true);
              } catch (fallbackError) {
                console.error('Fallback navigation failed:', fallbackError);
                reject(fallbackError);
              }
            }, 200);
          }
        }, 50);
      });
    } catch (error) {
      console.error('Safe navigation error:', error);
      reject(error);
    }
  });
};

// Safe back navigation
export const safeGoBack = () => {
  return new Promise((resolve) => {
    try {
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          try {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(root)/(tabs)/home');
            }
            resolve(true);
          } catch (error) {
            console.warn('Back navigation error:', error);
            // Fallback to home
            setTimeout(() => {
              router.replace('/(root)/(tabs)/home');
              resolve(true);
            }, 100);
          }
        }, 50);
      });
    } catch (error) {
      console.error('Safe back navigation error:', error);
      router.replace('/(root)/(tabs)/home');
      resolve(true);
    }
  });
};

// Clear navigation state
export const clearNavigationState = () => {
  try {
    // Clear any pending navigation operations
    InteractionManager.clearInteractionHandle();
  } catch (error) {
    console.warn('Clear navigation state error:', error);
  }
}; 