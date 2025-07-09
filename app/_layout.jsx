// import React, { useEffect, useState, createContext, useContext } from 'react';
// import { AppState, StatusBar, Text, View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
// import NetInfo from '@react-native-community/netinfo';
// import { useSegments, useRouter, Stack, Slot } from 'expo-router';
// import ErrorBoundary from '../components/ErrorBoundary';
// import { usePushNotifications } from '../hooks/usePushNotifications';
// import '../global.css';
// import { ThemeProvider } from "../context/ThemeContext"
// import * as Font from 'expo-font';
// import * as Linking from 'expo-linking';
// import { useAuthStore } from '../stores/useAuthStore';

// // Font context and provider
// const FontContext = createContext({ loaded: false });
// export function useFont() {
//   return useContext(FontContext);
// }

// export function AppText(props) {
//   const { loaded } = useFont();
//   return <Text {...props} style={[{ fontFamily: loaded ? 'GeneralSans-Regular' : undefined }, props.style]}>{props.children}</Text>;
// }

// function FontProvider({ children }) {
//   const [loaded, setLoaded] = useState(false);
//   useEffect(() => {
//     Font.loadAsync({
//       'GeneralSans-Regular': require('../assets/fonts/GeneralSans-Regular.otf'),
//       'GeneralSans-Medium': require('../assets/fonts/GeneralSans-Medium.otf'),
//       'GeneralSans-SemiBold': require('../assets/fonts/GeneralSans-Semibold.otf'),
//       'GeneralSans-Bold': require('../assets/fonts/GeneralSans-Bold.otf'),
//       'GeneralSans-Light': require('../assets/fonts/GeneralSans-Light.otf'),
//       'GeneralSans-Extralight': require('../assets/fonts/GeneralSans-Extralight.otf'),
//       'GeneralSans-Italic': require('../assets/fonts/GeneralSans-Italic.otf'),
//       'GeneralSans-MediumItalic': require('../assets/fonts/GeneralSans-MediumItalic.otf'),
//       'GeneralSans-SemiboldItalic': require('../assets/fonts/GeneralSans-SemiboldItalic.otf'),
//       'GeneralSans-BoldItalic': require('../assets/fonts/GeneralSans-BoldItalic.otf'),
//       'GeneralSans-LightItalic': require('../assets/fonts/GeneralSans-LightItalic.otf'),
//       'GeneralSans-ExtralightItalic': require('../assets/fonts/GeneralSans-ExtralightItalic.otf'),
//     }).then(() => setLoaded(true));
//   }, []);
//   return <FontContext.Provider value={{ loaded }}>{children}</FontContext.Provider>;
// }

// function RootLayoutNav() {
//   // const { isAuthenticated, user, isProfileComplete } = useAuth();
//   const segments = useSegments();
//   const router = useRouter();
  
//   // Initialize push notifications hook
//   usePushNotifications();

//   // Deep link handler for password reset
//   useEffect(() => {
//     const subscription = Linking.addEventListener('url', ({ url }) => {
//       if (url.startsWith('socialz://reset-password')) {
//         router.push('/(auth)/reset-password');
//       }
//     });
//     return () => subscription.remove();
//   }, [router]);

//   // Show loader while auth state is loading
//   // if (isAuthLoading) {
//   //   return (
//   //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
//   //       <ActivityIndicator size="large" color="#8B5CF6" />
//   //       <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', marginTop: 24, fontFamily: 'GeneralSans-Bold' }}>SocialZ</Text>
//   //     </View>
//   //   );
//   // }

//   // useEffect(() => {

//   //   if (typeof isAuthenticated === 'undefined') return;
    
//   //   const inApp = segments[0] === '(root)';
//   //   const inAuth = segments[0] === '(auth)';
    
//   //   if (isAuthenticated && !inApp && !inAuth) {
//   //     // If authenticated but not in app or auth, check profile completion
//   //     if (isProfileComplete === false) {
//   //       router.replace('/(auth)/onboarding');
//   //     } else if (isProfileComplete === true) {
//   //       router.replace('/(root)/(tabs)/home');
//   //     }
//   //   } else if (isAuthenticated === false ) {
//   //     router.replace('/(auth)/welcome');
//   //   }
//   // }, [isAuthenticated, user, isProfileComplete, segments]);
//   // useEffect(() => {
//   //   if (typeof isAuthenticated === 'undefined') return;
  
//   //   const inApp = segments[0] === '(root)';
//   //   const inAuth = segments[0] === '(auth)';
//   //   const authAllowed = [
//   //     'welcome',
//   //     'signin',
//   //     'signup',
//   //     'reset-password',
//   //     'verify-otp',
//   //     // add any other auth routes here
//   //   ].includes(segments[1]);
  
//   //   if (isAuthenticated && !inApp && !inAuth) {
//   //     if (isProfileComplete === false) {
//   //       router.replace('/(auth)/onboarding');
//   //     } else if (isProfileComplete === true) {
//   //       router.replace('/(root)/(tabs)/home');
//   //     }
//   //   } else if (isAuthenticated === false && (!inAuth || !authAllowed)) {
//   //     router.replace('/(auth)/welcome');
//   //   }
//   // }, [isAuthenticated, user, isProfileComplete, segments]);

//   // Disabled Firebase user status updates during onboarding transition
//   // // TODO: Re-enable after migrating user status to Supabase
//   // useEffect(() => {
//   //   if (!user || !isProfileComplete) return; // Only update status for complete profiles
    
//   //   // Skip Firebase updates during onboarding to prevent document errors
//   //   console.log('User status updates disabled during onboarding transition');
    
//   //   // Uncomment below when ready to migrate user status to Supabase
//   //   /*
//   //   const userRef = doc(db, 'users', user.uid);

//   //   const subscription = AppState.addEventListener('change', (nextAppState) => {
//   //     const isOnline = nextAppState === 'active';
//   //     updateDoc(userRef, {
//   //       isOnline,
//   //       lastSeen: serverTimestamp(),
//   //     }, { merge: true }).catch(console.error);
//   //   });

//   //   return () => {
//   //     subscription.remove();
//   //     updateDoc(userRef, {
//   //       isOnline: false,
//   //       lastSeen: serverTimestamp(),
//   //     }, { merge: true }).catch(console.error);
//   //   };
//   //   */
//   // }, [user, isProfileComplete]);
//   useEffect(() => {
//     // Initialize auth store on first load
//     console.log('Initializing auth store');
//     useAuthStore.getState().initialize();
//   }, []);


//   return (
//     <>
//    <Slot />
//       <StatusBar style="auto" />
//   </>
//   );
// }

// // Global Network Status Banner
// function NetworkStatusBanner() {
//   const [isConnected, setIsConnected] = useState(true);

//   useEffect(() => {
//     const unsubscribe = NetInfo.addEventListener(state => {
//       setIsConnected(!!state.isConnected);
//     });
//     return () => unsubscribe();
//   }, []);

//   if (isConnected) return null;

//   return (
//     <View style={styles.banner} pointerEvents="none">
//       <Text style={styles.bannerText}>No Internet Connection</Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   banner: {
//     position: 'absolute',
//     top: Platform.OS === 'android' ? 0 : 44, // below status bar on iOS
//     left: 0,
//     right: 0,
//     zIndex: 9999,
//     backgroundColor: '#EF4444',
//     paddingVertical: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 10,
//   },
//   bannerText: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 15,
//     letterSpacing: 0.5,
//   },
// });

// export default function RootLayout() {
//   return (
//     <FontProvider>
//       {/* <AuthContextProvider> */}
//         <ThemeProvider>
//           <ErrorBoundary>
//             <NetworkStatusBanner />
//             <RootLayoutNav />
//           </ErrorBoundary>
//         </ThemeProvider>
//       {/* </AuthContextProvider> */}
//     </FontProvider>
//   );
// }

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
  
  console.log('RootLayoutNav');
  console.log("segments", segments);
  // Initialize push notifications hook
  usePushNotifications();

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