import React, { useEffect, useState, createContext, useContext, useRef } from 'react';
import { AppState, StatusBar, Text, View, StyleSheet, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSegments, useRouter, Stack } from 'expo-router';
import AuthProvider, { useAuth } from '../context/authContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { usePushNotifications } from '../hooks/usePushNotifications';
import '../global.css';
import { ThemeProvider } from "../context/ThemeContext"
import * as Font from 'expo-font';
import { Fonts, TextStyles } from '../constants/Fonts';

// Simple navigation helper to prevent multiple calls
let isNavigating = false;
let lastNavigationTime = 0;

// const safeNavigate = (router, targetRoute, currentRoute, reason) => {
//   // Prevent rapid navigation
//   const now = Date.now();
//   if (isNavigating || now - lastNavigationTime < 1000) {
//     console.log(`🔒 Navigation blocked - too recent`);
//     return;
//   }

//   // Only navigate if route actually changed
//   if (currentRoute !== targetRoute) {
//     console.log(`🚀 Navigating: ${reason}`);
//     console.log(`📍 ${currentRoute} → ${targetRoute}`);
    
//     isNavigating = true;
//     lastNavigationTime = now;
    
//     try {
//       router.replace(targetRoute);
//     } catch (error) {
//       console.error('❌ Navigation error:', error);
//     } finally {
//       // Reset navigation lock after delay
//       setTimeout(() => {
//         isNavigating = false;
//       }, 1000);
//     }
//   } else {
//     console.log(`✅ Already at target: ${targetRoute}`);
//   }
// };

// Font context and provider
const FontContext = createContext({ loaded: false });
export function useFont() {
  return useContext(FontContext);
}

export function AppText(props) {
  const { loaded } = useFont();
  const defaultStyle = loaded ? { fontFamily: Fonts.GeneralSans.Regular } : {};
  return <Text {...props} style={[defaultStyle, props.style]}>{props.children}</Text>;
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
  const { isAuthenticated, user, isProfileComplete, isCollegeSelected, isInitialCheckComplete } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(true);
  const lastNavigatedRoute = useRef(null);
  
  // Initialize push notifications hook
  usePushNotifications();

  // Handle initial loading state
  // useEffect(() => {
  //   if (isInitialCheckComplete) {
  //     // Reduce initialization delay for faster startup
  //     setIsInitializing(false);
  //   }
  // }, [isInitialCheckComplete]);

  // Simple navigation logic
  // useEffect(() => {
  //   // Wait for auth system to be ready
  //   if (!isInitialCheckComplete || isInitializing) {
  //     console.log('⏳ Waiting for auth system...', { 
  //       isInitialCheckComplete,
  //       isAuthenticated, 
  //       isProfileComplete,
  //       isCollegeSelected,
  //       isInitializing 
  //     });
  //     return;
  //   }
    
  //   // Get current route information
  //   const currentRoute = segments.join('/');
  //   const isInApp = segments[0] === '(root)';
  //   const isInAuth = segments[0] === '(auth)';
  //   const isInOnboarding = currentRoute.includes('onboarding');
  //   const isInHome = currentRoute.includes('(root)/(tabs)/home') || isInApp;
  //   const isInWelcome = currentRoute.includes('welcome');
  //   const isInSignin = currentRoute.includes('signin');
  //   const isInVerifyOtp = currentRoute.includes('verify-otp');
    
  //   console.log('🔄 Navigation check:', {
  //     currentRoute,
  //     isAuthenticated,
  //     user: user?.uid ? 'Present' : 'Missing',
  //     isProfileComplete,
  //     isCollegeSelected,
  //     isInApp,
  //     isInAuth,
  //     isInOnboarding,
  //     isInHome
  //   });

  //   // Navigation decision logic
  //   let targetRoute = null;
  //   let reason = '';

  //   if (isAuthenticated === true && user?.uid) {
  //     // User is authenticated
  //     const hasCompleteProfile = isProfileComplete === true && isCollegeSelected === true;
      
  //     if (hasCompleteProfile) {
  //       // Complete profile - should be in main app
  //       if (!isInApp && !isInHome) {
  //         targetRoute = '/(root)/(tabs)/home';
  //         reason = `Authenticated user with complete profile → home`;
  //       }
  //     } else {
  //       // Incomplete profile - should be in onboarding (but not if in active auth flow)
  //       const isInActiveAuthFlow = isInSignin || isInVerifyOtp || isInWelcome;
        
  //       if (!isInOnboarding && !isInActiveAuthFlow) {
  //         targetRoute = '/(auth)/onboarding';
  //         reason = `Authenticated user with incomplete profile → onboarding`;
  //       }
  //     }
  //   } else if (isAuthenticated === false) {
  //     // Not authenticated - should be in welcome screen
  //     if (!isInWelcome && !isInAuth) {
  //       targetRoute = '/(auth)/welcome';
  //       reason = `Unauthenticated user → welcome`;
  //     }
  //   }

  //   // Execute navigation using simple helper
  //   if (targetRoute && targetRoute !== lastNavigatedRoute.current) {
  //     lastNavigatedRoute.current = targetRoute;
  //     safeNavigate(router, targetRoute, currentRoute, reason);
  //   } else if (targetRoute) {
  //     console.log(`✅ Already navigated to: ${targetRoute}`);
  //   } else {
  //     console.log(`✅ User in correct location: ${currentRoute}`);
  //   }
    
  // }, [
  //   isAuthenticated, 
  //   user?.uid, 
  //   isProfileComplete, 
  //   isCollegeSelected, 
  //   isInitialCheckComplete,
  //   segments.join('/'), 
  //   router, 
  //   isInitializing
  // ]);

  // Firebase user status updates (disabled during transition)
  useEffect(() => {
    if (!user || !isProfileComplete || !isCollegeSelected) return;
    console.log('User status updates disabled during onboarding transition');
  }, [user, isProfileComplete, isCollegeSelected]);

  // Show loading screen during initialization
  if (isInitializing || !isInitialCheckComplete) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Text style={{ 
          color: '#FFFFFF', 
          fontSize: 32, 
          fontWeight: '800',
          letterSpacing: -0.8 
        }}>
          Socialz
        </Text>
        <Text style={{ 
          color: '#666666', 
          fontSize: 14, 
          marginTop: 8,
          letterSpacing: 0.5 
        }}>
          {!isInitialCheckComplete ? 'Loading...' : 'Initializing...'}
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(root)" options={{ headerShown: false }} />
      </Stack>
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
    <View style={styles.banner} pointerEvents="none">
      <Text style={styles.bannerText}>No Internet Connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 0 : 44,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
  },
  bannerText: {
    color: 'white',
    fontFamily: 'GeneralSans-Semibold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

export default function RootLayout() {
  return (
    <FontProvider>
      <AuthProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <NetworkStatusBanner />
            <RootLayoutNav />
          </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </FontProvider>
  );
}

