import React, { useEffect, useState, createContext, useContext } from 'react';
import { AppState, StatusBar, Text, View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSegments, useRouter, Stack, Slot } from 'expo-router';
import ErrorBoundary from '../components/ErrorBoundary';
import { usePushNotifications } from '../hooks/usePushNotifications';
import '../global.css';
import { ThemeProvider } from "../context/ThemeContext"
import * as Font from 'expo-font';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../stores/useAuthStore';
import * as Notifications from 'expo-notifications';

// Font context and provider
const FontContext = createContext({ loaded: false });
export function useFont() {
  return useContext(FontContext);
}

export function AppText(props) {
  const { loaded } = useFont();
  return <Text {...props} style={[{ fontFamily: loaded ? 'GeneralSans-Regular' : undefined }, props.style]}>{props.children}</Text>;
}


function FontProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    Font.loadAsync({
      'GeneralSans-Regular': require('../assets/fonts/GeneralSans-Regular.otf'),
      'GeneralSans-Medium': require('../assets/fonts/GeneralSans-Medium.otf'),
      'GeneralSans-SemiBold': require('../assets/fonts/GeneralSans-Semibold.otf'),
      'GeneralSans-Bold': require('../assets/fonts/GeneralSans-Bold.otf'),
      'GeneralSans-Light': require('../assets/fonts/GeneralSans-Light.otf'),
      'GeneralSans-Extralight': require('../assets/fonts/GeneralSans-Extralight.otf'),
      'GeneralSans-Italic': require('../assets/fonts/GeneralSans-Italic.otf'),
      'GeneralSans-MediumItalic': require('../assets/fonts/GeneralSans-MediumItalic.otf'),
      'GeneralSans-SemiboldItalic': require('../assets/fonts/GeneralSans-SemiboldItalic.otf'),
      'GeneralSans-BoldItalic': require('../assets/fonts/GeneralSans-BoldItalic.otf'),
      'GeneralSans-LightItalic': require('../assets/fonts/GeneralSans-LightItalic.otf'),
      'GeneralSans-ExtralightItalic': require('../assets/fonts/GeneralSans-ExtralightItalic.otf'),
    }).then(() => setLoaded(true));
  }, []);
  return <FontContext.Provider value={{ loaded }}>{children}</FontContext.Provider>;
}

function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { forceClearBadge } = usePushNotifications();

  // Initialize push notifications hook - always call this first
  usePushNotifications();

  useEffect(() => {
    // Clear badge count on app launch
    Notifications.setBadgeCountAsync(0);
    
    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // Clear badge when app becomes active/foreground
        Notifications.setBadgeCountAsync(0);
        forceClearBadge();
      }
    };

    // Add app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Cleanup subscription on unmount
    return () => subscription?.remove();
  }, [forceClearBadge]);

  // Deep link handler for password reset and post sharing
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Deep link received:', url);
      
      if (url.startsWith('socialz://reset-password')) {
        router.push('/(auth)/reset-password');
      } else if (url.startsWith('socialz://post/')) {
        // Extract post ID from deep link: socialz://post/123
        const postId = url.split('/').pop();
        if (postId) {
          console.log('📱 Navigating to post:', postId);
          router.push(`/postDetailView/${postId}`);
        }
      }
    });
    return () => subscription.remove();
  }, [router]);

  // All the commented out auth logic removed since it's handled in index.jsx
  // The initialization is now properly handled in index.jsx with proper loading states

  return (
    <>
      <Slot />
      <StatusBar style="auto" />
    </>
  );
}

// Global Network Status Banner
function NetworkStatusBanner() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerText}>No Internet Connection</Text>
        <Text style={styles.bannerSubtext}>Please check your connection and try again</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  bannerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bannerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 24,
    letterSpacing: 0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  bannerSubtext: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default function RootLayout() {
  return (
    <FontProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <NetworkStatusBanner />
          <RootLayoutNav />
        </ErrorBoundary>
      </ThemeProvider>
    </FontProvider>
  );
}