// // // import React from 'react';
// // // import { Redirect } from 'expo-router';

// // // export default function Index() {
// // //   // Redirect to your desired initial route, e.g., welcome or login
// // //   return <Redirect href="/(auth)/welcome" />;
// // // }
// // import React, { useEffect, useState } from 'react';
// // import { View, Text, StyleSheet, Animated, Image } from 'react-native';
// // import { useAuth } from '../context/authContext';
// // import { Redirect } from 'expo-router';
// // import { useAuthStore } from '../stores/useAuthStore';

// // const Loader = () => {
// //   const loadingAnimation = new Animated.Value(0);

// //   React.useEffect(() => {
// //     Animated.loop(
// //       Animated.sequence([
// //         Animated.timing(loadingAnimation, {
// //           toValue: 1,
// //           duration: 3500,
// //           useNativeDriver: false,
// //         }),
// //         Animated.timing(loadingAnimation, {
// //           toValue: 0,
// //           duration: 0,
// //           useNativeDriver: false,
// //         }),
// //       ])
// //     ).start();
// //   }, [loadingAnimation]);

// //   return (
// //     <View style={styles.wrapper}>
// //       <Animated.Text
// //         style={[
// //           styles.text,
// //           {
// //             opacity: loadingAnimation.interpolate({
// //               inputRange: [0, 1],
// //               outputRange: [0.3, 1],
// //             }),
// //           },
// //         ]}
// //       >
// //         Loading...
// //       </Animated.Text>
// //     </View>
// //   );
// // };
// // export default function IndexPage() {



// //   const { isAuthenticated, isProfileComplete, isCollegeSelected } = useAuthStore();
// //   const [shouldRedirect, setShouldRedirect] = useState(false);
// //   const [redirectTo, setRedirectTo] = useState('');
// // console.log('isAuthenticated', isAuthenticated);
// // console.log('isProfileComplete', isProfileComplete);
// // console.log('isCollegeSelected', isCollegeSelected);

// //   // useEffect(() => {
// //   //   // Initialize auth store on first load
// //   //   useAuthStore.getState().initialize();
// //   // }, []);

// //   useEffect(() => {
// //     // Add a delay to ensure all auth states are properly initialized and prevent race conditions
// //     const timer = setTimeout(() => {
// //       console.log('🔍 Navigation decision - Auth states:', {
// //         isAuthenticated,
// //         isProfileComplete,
// //         isCollegeSelected
// //       });

// //       // Only redirect when we have clear states to avoid navigation conflicts
// //       if (isAuthenticated === false || isAuthenticated === undefined) {
// //         console.log('➡️ Not authenticated, going to welcome');
// //         setRedirectTo('/(auth)/welcome');
// //         setShouldRedirect(true);
// //       } else if (isAuthenticated === true) {
// //         if (isProfileComplete === false) {
// //           console.log('➡️ Profile incomplete, going to onboarding');
// //           setRedirectTo('/(auth)/onboarding');
// //           setShouldRedirect(true);
// //         } else if (isProfileComplete === true) {
// //           console.log('➡️ Profile complete, going to home');
// //           setRedirectTo('/(root)/(tabs)/home');
// //           setShouldRedirect(true);
// //         } else {
// //           // If profile completion state is undefined, wait longer
// //           console.log('⏳ Profile completion state undefined, waiting...');
// //         }
// //       } else {
// //         console.log('🔄 Auth state still undefined, showing loader');
// //       }
// //     }, 250); // Increased delay to prevent race conditions

// //     return () => clearTimeout(timer);
// //   }, [isAuthenticated, isProfileComplete, isCollegeSelected]);
// //   // Show loading while determining where to navigate
// //   if (isAuthenticated === undefined || !shouldRedirect) {
// //     return <Loader />;
// //   }
// //   console.log('redirectTo', redirectTo);
// //   // Safe redirect after state is determined
// //   return <Redirect href={redirectTo} />;
// // }

// // const styles = StyleSheet.create({
// //   wrapper: {
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     flex: 1,
// //     backgroundColor: '#000000', // Match black theme
// //   },
// //   image: {
// //     width: 200,
// //     height: 200,
// //     marginBottom: 20,
// //   },
// //   text: {
// //     fontSize: 20,
// //     fontWeight: 'bold',
// //     color: '#fff',
// //   },
// // });

// import React, { useEffect, useState } from 'react';
// import { View, StyleSheet, Animated, Text } from 'react-native';
// import { Redirect } from 'expo-router';
// import { useAuthStore } from '../stores/useAuthStore';

// const Loader = () => {
//   const loadingAnimation = new Animated.Value(0);

//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(loadingAnimation, {
//           toValue: 1,
//           duration: 1500,
//           useNativeDriver: false,
//         }),
//         Animated.timing(loadingAnimation, {
//           toValue: 0,
//           duration: 0,
//           useNativeDriver: false,
//         }),
//       ])
//     ).start();
//   }, []);

//   return (
//     <View style={styles.wrapper}>
//       <Animated.Text
//         style={[
//           styles.text,
//           {
//             opacity: loadingAnimation.interpolate({
//               inputRange: [0, 1],
//               outputRange: [0.3, 1],
//             }),
//           },
//         ]}
//       >
//         Loading...
//       </Animated.Text>
//     </View>
//   );
// };

// export default function IndexPage() {
//   const { isAuthenticated, isProfileComplete, loading } = useAuthStore();
//   const [redirectTo, setRedirectTo] = useState(null);

//   useEffect(() => {
    
//     if (loading) return;

//     console.log('🔍 Navigation decision - Auth states:', {
//       isAuthenticated,
//       isProfileComplete
//     });

//     if (!isAuthenticated) {
//       setRedirectTo('/(auth)/welcome');
//     } else if (!isProfileComplete) {
//       setRedirectTo('/(auth)/onboarding');
//     } else {
//       setRedirectTo('/(root)/(tabs)/home');
//     }
//   }, [isAuthenticated, isProfileComplete, loading]);

//   if (loading || !redirectTo) return <Loader />;

//   return <Redirect href={redirectTo} />;
// }

// const styles = StyleSheet.create({
//   wrapper: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     flex: 1,
//     backgroundColor: '#000',
//   },
//   text: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
// });
// app/index.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/useAuthStore';

const Loader = () => {
  const loadingAnimation = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(loadingAnimation, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.wrapper}>
      <Animated.Text
        style={[
          styles.text,
          {
            opacity: loadingAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
          },
        ]}
      >
        Loading...
      </Animated.Text>
    </View>
  );
};

export default function IndexPage() {
  const { 
    isAuthenticated, 
    isProfileComplete, 
    isCollegeSelected,
    isInitialized,
    initialize 
  } = useAuthStore();
  
  const [redirectTo, setRedirectTo] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize auth store when component mounts
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth store...');
        await initialize();
        setIsReady(true);
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        // Fallback to unauthenticated state
        setRedirectTo('/(auth)/welcome');
        setIsReady(true);
      }
    };

    initAuth();
  }, [initialize]);

  // Determine navigation route based on auth state
  useEffect(() => {
    // Don't proceed until auth is initialized and ready
    if (!isInitialized || !isReady) {
      console.log('⏳ Waiting for auth initialization...');
      return;
    }

    console.log('🔍 Navigation decision - Auth states:', {
      isAuthenticated,
      isProfileComplete,
      isCollegeSelected,
      isInitialized
    });

    // Navigation logic
    if (isAuthenticated === false) {
      console.log('➡️ Not authenticated, going to welcome');
      setRedirectTo('/(auth)/welcome');
    } else if (isAuthenticated === true) {
      if (isProfileComplete === false) {
        console.log('➡️ Profile incomplete, going to onboarding');
        setRedirectTo('/(auth)/onboarding');
      } 
      else {
        console.log('➡️ Fully authenticated, going to home');
        setRedirectTo('/(root)/(tabs)/home');
      }
    } else {
      console.log('🔄 Auth state still undefined, continuing to wait...');
    }
  }, [isAuthenticated, isProfileComplete, isCollegeSelected, isInitialized, isReady]);

  // Show loader while determining navigation
  if (!isInitialized || !isReady || !redirectTo) {
    return <Loader />;
  }

  console.log('🎯 Redirecting to:', redirectTo);
  return <Redirect href={redirectTo} />;
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#000',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});