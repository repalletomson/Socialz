import { useRef, useEffect } from 'react';
import { BackHandler, InteractionManager } from 'react-native';
import { router } from 'expo-router';

export function useSafeNavigation({ modals = [], onCleanup = () => {} }) {
  const navigationLocked = useRef(false);

  // Close all modals
  const closeAllModals = async () => {
    for (const close of modals) {
      if (close && typeof close === 'function') await close();
    }
    // Wait for modals to close
    await new Promise(res => setTimeout(res, 350));
  };

  // Safe navigation
  const safeNavigate = async (route, options = {}) => {
    if (navigationLocked.current) return;
    navigationLocked.current = true;
    await closeAllModals();
    onCleanup();
    InteractionManager.runAfterInteractions(() => {
      if (options.replace) {
        router.replace(route);
      } else if (options.push) {
        router.push(route);
      } else {
        router.navigate(route);
      }
      navigationLocked.current = false;
    });
  };

  // Safe back
  const safeBack = async () => {
    if (navigationLocked.current) return true;
    navigationLocked.current = true;
    await closeAllModals();
    onCleanup();
    InteractionManager.runAfterInteractions(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(root)/(tabs)/home');
      }
      navigationLocked.current = false;
    });
    return true; // Prevent default
  };

  // Hardware back handler
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', safeBack);
    return () => handler.remove();
  }, [modals]);

  return { safeNavigate, safeBack };
} 