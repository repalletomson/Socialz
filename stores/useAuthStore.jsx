// // // // stores/useAuthStore.js
// // // // import { create } from 'zustand';
// // // // import { supabase, handleSupabaseError } from '../config/supabaseConfig';
// // // // import NetInfo from '@react-native-community/netinfo';
// // // // import { Alert, AppState } from 'react-native';
// // // // import { getProfileById , checkProfileComplete, checkUserCollegeSelection, updateProfile} from '../hooks/profiles';

// // // // let firebaseAuth, db;
// // // // try {
// // // //   const firebaseConfig = require('../config/firebaseConfig');
// // // //   firebaseAuth = firebaseConfig.auth;
// // // //   db = firebaseConfig.db;
// // // //   console.log('✅ Firebase auth and db imported successfully');
// // // // } catch (error) {
// // // //   console.warn('⚠️ Firebase import failed:', error.message);
// // // //   firebaseAuth = null;
// // // //   db = null;
// // // // }

// // // // const monitorNewMessages = (userId) => {
// // // //   try {
// // // //     if (!firebaseAuth) return;
// // // //     console.log('Firebase messaging monitoring for user:', userId);
// // // //   } catch (error) {
// // // //     console.warn('Firebase messaging not available:', error.message);
// // // //   }
// // // // };

// // // // export const useAuthStore = create((set, get) => {
// // // //   console.log('🏪 AuthStore: Initializing store with default state');
// // // //   console.log('📊 AuthStore: Initial state:', {
// // // //     user: null,
// // // //     isAuthenticated: undefined,
// // // //     isProfileComplete: false,
// // // //     isCollegeSelected: false,
// // // //     loading: true
// // // //   });

// // // //   // Wrapper to log state changes
// // // //   const loggedSet = (newState) => {
// // // //     const currentState = get();
// // // //     console.log('🔄 AuthStore: State changing from:', {
// // // //       user: currentState.user ? { id: currentState.user.id, fullName: currentState.user.fullName } : null,
// // // //       isAuthenticated: currentState.isAuthenticated,
// // // //       isProfileComplete: currentState.isProfileComplete,
// // // //       isCollegeSelected: currentState.isCollegeSelected,
// // // //       loading: currentState.loading
// // // //     });
    
// // // //     if (typeof newState === 'function') {
// // // //       const result = newState(currentState);
// // // //       console.log('📝 AuthStore: State changing to:', {
// // // //         user: result.user ? { id: result.user.id, fullName: result.user.fullName } : result.user,
// // // //         isAuthenticated: result.isAuthenticated,
// // // //         isProfileComplete: result.isProfileComplete,
// // // //         isCollegeSelected: result.isCollegeSelected,
// // // //         loading: result.loading
// // // //       });
// // // //       set(newState);
// // // //     } else {
// // // //       console.log('📝 AuthStore: State changing to:', {
// // // //         user: newState.user ? { id: newState.user.id, fullName: newState.user.fullName } : newState.user,
// // // //         isAuthenticated: newState.isAuthenticated,
// // // //         isProfileComplete: newState.isProfileComplete,
// // // //         isCollegeSelected: newState.isCollegeSelected,
// // // //         loading: newState.loading
// // // //       });
// // // //       set(newState);
// // // //     }
// // // //   };
  
// // // //   return {
// // // //     user: null,
// // // //     isAuthenticated: undefined,
// // // //     isProfileComplete: false,
// // // //     isCollegeSelected: false,
// // // //     loading: true,

// // // //     initialize: async () => {
// // // //       console.log('🚀 AuthStore: Starting initialization...');
// // // //     const checkInitialSession = async () => {
// // // //       console.log('🔍 AuthStore: Checking initial session...');
// // // //       try {
// // // //         const { data: { session } } = await supabase.auth.getSession();
// // // //         console.log('📋 AuthStore: Session data:', { 
// // // //           hasSession: !!session, 
// // // //           hasUser: !!session?.user,
// // // //           userId: session?.user?.id 
// // // //         });
        
// // // //         if (session?.user) {
// // // //           console.log('✅ AuthStore: Valid session found, updating user data...');
// // // //           await get().updateUserData(session.user.id);
// // // //           const profileComplete = await get().checkUserProfileCompletion(session.user.id);
// // // //           const collegeSelected = await get().checkUserCollegeSelection(session.user.id);
          
// // // //           console.log('📊 AuthStore: Profile status:', { 
// // // //             profileComplete, 
// // // //             collegeSelected 
// // // //           });
          
// // // //           loggedSet({
// // // //             isAuthenticated: true,
// // // //             isProfileComplete: profileComplete,
// // // //             isCollegeSelected: collegeSelected,
// // // //             loading: false
// // // //           });
// // // //           console.log('✅ AuthStore: User authenticated successfully');
// // // //         } else {
// // // //           console.log('❌ AuthStore: No valid session found');
// // // //           loggedSet({ isAuthenticated: false, isProfileComplete: false, isCollegeSelected: false, loading: false });
// // // //         }
// // // //       } catch (error) {
// // // //         console.error('❌ AuthStore: Error checking initial session:', error);
// // // //         loggedSet({ isAuthenticated: false, isProfileComplete: false, isCollegeSelected: false, loading: false });
// // // //       }
// // // //     };

// // // //     checkInitialSession();

// // // //     supabase.auth.onAuthStateChange(async (event, session) => {
// // // //       console.log('🔄 AuthStore: Auth state changed:', { 
// // // //         event, 
// // // //         hasSession: !!session, 
// // // //         hasUser: !!session?.user,
// // // //         userId: session?.user?.id 
// // // //       });
      
// // // //       if (session?.user) {
// // // //         console.log('✅ AuthStore: User session active, updating data...');
// // // //         await get().updateUserData(session.user.id);
// // // //         const profileComplete = await get().checkUserProfileCompletion(session.user.id);
// // // //         const collegeSelected = await get().checkUserCollegeSelection(session.user.id);
        
// // // //         console.log('📊 AuthStore: Updated profile status:', { 
// // // //           profileComplete, 
// // // //           collegeSelected 
// // // //         });
        
// // // //         loggedSet({
// // // //           isAuthenticated: true,
// // // //           isProfileComplete: profileComplete,
// // // //           isCollegeSelected: collegeSelected,
// // // //         });
// // // //         console.log('✅ AuthStore: State updated for authenticated user');
// // // //         monitorNewMessages(session.user.id);
// // // //       } else {
// // // //         console.log('❌ AuthStore: No user session, setting unauthenticated state');
// // // //         loggedSet({ user: null, isAuthenticated: false, isProfileComplete: false, isCollegeSelected: false });
// // // //       }
// // // //     });

// // // //     AppState.addEventListener('change', (state) => {
// // // //       if (state === 'active') checkInitialSession();
// // // //     });

// // // //     NetInfo.addEventListener(state => {
// // // //       if (state.isConnected) checkInitialSession();
// // // //     });
// // // //   },

// // // //   updateUserData: async (userId) => {
// // // //     console.log('👤 AuthStore: Updating user data for userId:', userId);
// // // //     const { data, error } = await supabase
// // // //     .from('users')
// // // //     .select(`*, streak:streaks(*)`)
// // // //     .eq('id', userId)
// // // //     .single();
  
// // // //     console.log('data', data);
// // // //     if (!error && data) {
// // // //       console.log('✅ AuthStore: User data fetched successfully:', {
// // // //         userId: data.id,
// // // //         fullName: data.full_name,
// // // //         hasProfileImage: !!data.profile_image,
// // // //         hasBio: !!data.bio,
// // // //         branch: data.branch,
// // // //         college: data.college,
// // // //         interests: data.interests?.length || 0
// // // //       });
      
// // // //       loggedSet({
// // // //         user: {
// // // //           ...data,
// // // //           uid: userId,
// // // //           id: userId,
// // // //           fullName: data.full_name,
// // // //           profileImage: data.profile_image,
// // // //           photoURL: data.profile_image,
// // // //           displayName: data.full_name,
// // // //           about: data.bio,
// // // //           passoutYear: data.passout_year,
// // // //         }
// // // //       });
// // // //     } else {
// // // //       console.error('❌ AuthStore: Error fetching user data:', error);
// // // //       loggedSet({ user: { uid: userId, id: userId } });
// // // //     }
// // // //   },

// // // //   login: async (email, password) => {
// // // //     console.log('🔐 AuthStore: Attempting login for email:', email);
// // // //     try {
// // // //       console.log('🌐 AuthStore: Testing network connection...');
// // // //       const testResponse = await fetch('https://httpbin.org/get');
// // // //       if (!testResponse.ok) throw new Error('Network test failed');
// // // //       console.log('✅ AuthStore: Network test passed');

// // // //       console.log('🔑 AuthStore: Attempting Supabase sign in...');
// // // //       const { data, error } = await supabase.auth.signInWithPassword({ email, password });
// // // //       if (error) throw error;

// // // //       console.log('✅ AuthStore: Login successful:', {
// // // //         userId: data.user?.id,
// // // //         email: data.user?.email
// // // //       });
// // // //       return true;
// // // //     } catch (error) {
// // // //       console.error('❌ AuthStore: Login failed:', error);
// // // //       Alert.alert('Login Error', handleSupabaseError(error));
// // // //       return false;
// // // //     }
// // // //   },

// // // //   logout: async () => {
// // // //     console.log('🚪 AuthStore: Starting logout process...');
// // // //     const { data: { user } } = await supabase.auth.getUser();
// // // //     if (user) {
// // // //       console.log('🔄 AuthStore: Clearing push token for user:', user.id);
// // // //       await supabase.from('users').update({ expo_push_token: null }).eq('id', user.id);
// // // //     }
// // // //     console.log('🔐 AuthStore: Signing out from Supabase...');
// // // //     await supabase.auth.signOut();
// // // //     console.log('✅ AuthStore: Logout successful, clearing state...');
// // // //     loggedSet({ user: null, isAuthenticated: false, isProfileComplete: false, isCollegeSelected: false });
// // // //   },

// // // //   register: async (email, password, photoUrl, fullName, autoVerify = false) => {
// // // //     console.log('📝 AuthStore: Attempting registration for email:', email, 'fullName:', fullName);
// // // //     try {
// // // //       console.log('🔑 AuthStore: Calling Supabase signUp...');
// // // //       const { data, error } = await supabase.auth.signUp({
// // // //         email,
// // // //         password,
// // // //         options: {
// // // //           data: { full_name: fullName, profile_image: photoUrl },
// // // //           emailRedirectTo: autoVerify ? undefined : undefined
// // // //         }
// // // //       });
// // // //       if (error) throw error;

// // // //       console.log('✅ AuthStore: Registration successful:', {
// // // //         userId: data.user.id,
// // // //         email: data.user.email
// // // //       });

// // // //       console.log('🔄 AuthStore: Setting initial user state...');
// // // //       loggedSet({
// // // //         user: {
// // // //           uid: data.user.id,
// // // //           id: data.user.id,
// // // //           email,
// // // //           fullName,
// // // //           profileImage: photoUrl
// // // //         },
// // // //         isAuthenticated: true,
// // // //         isProfileComplete: false,
// // // //         isCollegeSelected: false
// // // //       });

// // // //       return data.user.id;
// // // //     } catch (error) {
// // // //       console.error('❌ AuthStore: Registration failed:', error);
// // // //       Alert.alert('Registration Error', handleSupabaseError(error));
// // // //       return false;
// // // //     }
// // // //   },

// // // //   updateUserProfile: async (profileData) => {
// // // //     console.log('📝 AuthStore: Updating user profile with data:', Object.keys(profileData));
// // // //     const { user } = get();
// // // //     if (!user?.uid) {
// // // //       console.error('❌ AuthStore: Cannot update profile - user not authenticated');
// // // //       throw new Error('User not authenticated');
// // // //     }

// // // //     console.log('🔄 AuthStore: Updating profile in database for userId:', user.uid);
// // // //     const { error } = await supabase.from('users').update({ ...profileData, updated_at: new Date().toISOString() }).eq('id', user.uid);
// // // //     if (error) {
// // // //       console.error('❌ AuthStore: Error updating profile:', error);
// // // //       throw error;
// // // //     }

// // // //     console.log('✅ AuthStore: Profile updated successfully, updating local state...');
// // // //     loggedSet(state => ({ user: { ...state.user, ...profileData } }));

// // // //     console.log('🔍 AuthStore: Re-checking profile completion status...');
// // // //     const profileComplete = await get().checkUserProfileCompletion(user.uid);
// // // //     const collegeSelected = await get().checkUserCollegeSelection(user.uid);

// // // //     console.log('📊 AuthStore: Updated completion status:', { profileComplete, collegeSelected });
// // // //     loggedSet({ isProfileComplete: profileComplete, isCollegeSelected: collegeSelected });
// // // //   },

// // // //   checkUserProfileCompletion: async (userId) => {
// // // //     console.log('📝 AuthStore: Checking profile completion for userId:', userId);
// // // //     const { data, error } = await supabase.from('users').select('full_name, branch, passout_year, college, interests, username, profile_initials').eq('id', userId).single();
// // // //     if (error) {
// // // //       console.error('❌ AuthStore: Error checking profile completion:', error);
// // // //       return false;
// // // //     }

// // // //     const hasBasicInfo = !!(data.full_name?.trim() && data.username?.trim());
// // // //     const hasInterests = data.interests?.length > 0;
// // // //     const collegeValue = typeof data.college === 'string' ? data.college : data.college?.name || data.college?.college || '';
// // // //     const hasEducation = !!(data.branch?.trim() && data.passout_year?.trim() && collegeValue);

// // // //     console.log('📊 AuthStore: Profile completion check:', {
// // // //       hasBasicInfo,
// // // //       hasInterests,
// // // //       hasEducation,
// // // //       fullName: !!data.full_name?.trim(),
// // // //       username: !!data.username?.trim(),
// // // //       interestsCount: data.interests?.length || 0,
// // // //       branch: !!data.branch?.trim(),
// // // //       passoutYear: !!data.passout_year?.trim(),
// // // //       college: !!collegeValue,
// // // //       overallComplete: hasBasicInfo && hasInterests && hasEducation
// // // //     });

// // // //     return hasBasicInfo && hasInterests && hasEducation;
// // // //   },

// // // //   checkUserCollegeSelection: async (userId) => {
// // // //     console.log('🏫 AuthStore: Checking college selection for userId:', userId);
// // // //     const { data, error } = await supabase.from('users').select('college').eq('id', userId).single();
// // // //     if (error) {
// // // //       console.error('❌ AuthStore: Error checking college selection:', error);
// // // //       return false;
// // // //     }
    
// // // //     const hasCollege = data?.college?.name ? true : false;
// // // //     console.log('📊 AuthStore: College selection check:', {
// // // //       hasCollege,
// // // //       collegeData: data?.college,
// // // //       collegeName: data?.college?.name
// // // //     });
    
// // // //     return hasCollege;
// // // //   },

// // // //   updateUserCollege: async (college) => {
// // // //     const { user } = get();
// // // //     if (!user?.uid) throw new Error('User not authenticated');

// // // //     const { error } = await supabase.from('users').update({ college }).eq('id', user.uid);
// // // //     if (error) throw error;

// // // //     loggedSet(state => ({ user: { ...state.user, college } }));
// // // //   }
// // // // }});

// // // // stores/useAuthStore.js
// // // import { create } from 'zustand';
// // // import AsyncStorage from '@react-native-async-storage/async-storage';
// // // import { AppState } from 'react-native';
// // // import NetInfo from '@react-native-community/netinfo';
// // // import { supabase } from '../config/supabaseConfig';
// // // import { getProfileById, checkProfileComplete, checkUserCollegeSelection } from '../hooks/profiles';

// // // let db;
// // // try {
// // //   const firebaseConfig = require('../config/firebaseConfig');
// // //   db = firebaseConfig.db;
// // //   console.log('✅ Firebase DB loaded');
// // // } catch (err) {
// // //   console.warn('⚠️ Firebase not available');
// // // }

// // // const AUTH_KEY = 'AUTH_STATE';

// // // export const useAuthStore = create((set, get) => {
// // //   const loggedSet = (newState) => {
// // //     set((prev) => {
// // //       const next = typeof newState === 'function' ? newState(prev) : newState;
      
// // //       // Store complete auth state in AsyncStorage
// // //       const stateToStore = {
// // //         isAuthenticated: next.isAuthenticated,
// // //         user: next.user,
// // //         isProfileComplete: next.isProfileComplete,
// // //         isCollegeSelected: next.isCollegeSelected,
// // //         lastUpdated: new Date().toISOString()
// // //       };
      
// // //       AsyncStorage.setItem(AUTH_KEY, JSON.stringify(stateToStore)).catch(err => {
// // //         console.warn('Failed to save auth state:', err);
// // //       });
      
// // //       return next;
// // //     });
// // //   };

// // //   const updateFirebaseStatus = async (userId, isOnline) => {
// // //     if (!db || !userId) return;
// // //     try {
// // //       const userRef = db.collection('users').doc(userId);
// // //       await userRef.set({
// // //         isOnline,
// // //         lastSeen: new Date(),
// // //       }, { merge: true });
// // //     } catch (e) {
// // //       console.warn('Firebase status update failed:', e.message);
// // //     }
// // //   };

// // //   const checkSessionAndUpdate = async () => {
// // //     try {
// // //       const { data: { session } } = await supabase.auth.getSession();
// // //       const userId = session?.user?.id;
      
// // //       if (!userId) {
// // //         await loggedSet({ 
// // //           isAuthenticated: false, 
// // //           user: null,
// // //           isProfileComplete: false,
// // //           isCollegeSelected: false 
// // //         });
// // //         return;
// // //       }

// // //       const { data, error } = await supabase.from('users').select(`*, streak:streaks(*)`).eq('id', userId).single();
// // //       if (error) {
// // //         console.error('Failed to fetch user:', error);
// // //         await loggedSet({ 
// // //           isAuthenticated: false, 
// // //           user: null,
// // //           isProfileComplete: false,
// // //           isCollegeSelected: false 
// // //         });
// // //         return;
// // //       }

// // //       const profileComplete = await checkProfileComplete(userId);
// // //       const collegeSelected = await checkUserCollegeSelection(userId);

// // //       await loggedSet({
// // //         isAuthenticated: true,
// // //         user: {
// // //           ...data,
// // //           id: userId,
// // //           fullName: data.full_name,
// // //           profileImage: data.profile_image,
// // //           photoURL: data.profile_image,
// // //           displayName: data.full_name,
// // //           about: data.bio,
// // //           passoutYear: data.passout_year,
// // //         },
// // //         isProfileComplete: profileComplete,
// // //         isCollegeSelected: collegeSelected,
// // //       });

// // //       updateFirebaseStatus(userId, true);
// // //     } catch (error) {
// // //       console.error('Session check failed:', error);
// // //       await loggedSet({ 
// // //         isAuthenticated: false, 
// // //         user: null,
// // //         isProfileComplete: false,
// // //         isCollegeSelected: false 
// // //       });
// // //     }
// // //   };

// // //   // Background refresh
// // //   let refreshInterval;
// // //   let appStateListener;
// // //   let netInfoUnsubscribe;

// // //   return {
// // //     user: null,
// // //     isAuthenticated: undefined, // Will be set to true/false after initialization
// // //     isProfileComplete: false,
// // //     isCollegeSelected: false,
// // //     isInitialized: false, // New flag to track if store is ready

// // //     initialize: async () => {
// // //       try {
// // //         console.log('🔄 Initializing auth store...');
        
// // //         // First, try to restore from AsyncStorage
// // //         const cached = await AsyncStorage.getItem(AUTH_KEY);
// // //         if (cached) {
// // //           try {
// // //             const cachedState = JSON.parse(cached);
// // //             console.log('📱 Restoring from AsyncStorage:', cachedState.isAuthenticated);
            
// // //             // Set initial state from cache
// // //             set({
// // //               isAuthenticated: cachedState.isAuthenticated,
// // //               user: cachedState.user,
// // //               isProfileComplete: cachedState.isProfileComplete || false,
// // //               isCollegeSelected: cachedState.isCollegeSelected || false,
// // //               isInitialized: true
// // //             });
            
// // //             // If was authenticated, verify the session is still valid
// // //             if (cachedState.isAuthenticated) {
// // //               await checkSessionAndUpdate();
// // //             }
// // //           } catch (parseError) {
// // //             console.warn('Failed to parse cached auth state:', parseError);
// // //             await AsyncStorage.removeItem(AUTH_KEY);
// // //             set({ isAuthenticated: false, user: null, isInitialized: true });
// // //           }
// // //         } else {
// // //           // No cached state, check current session
// // //           await checkSessionAndUpdate();
// // //           set(prev => ({ ...prev, isInitialized: true }));
// // //         }

// // //         // Set up auth state listener
// // //         const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
// // //           console.log('🔐 Auth state changed:', event);
// // //           if (session?.user) {
// // //             await checkSessionAndUpdate();
// // //           } else {
// // //             await loggedSet({ 
// // //               isAuthenticated: false, 
// // //               user: null,
// // //               isProfileComplete: false,
// // //               isCollegeSelected: false 
// // //             });
// // //           }
// // //         });

// // //         // App state listener
// // //         appStateListener = AppState.addEventListener('change', (state) => {
// // //           const currentUser = get().user;
// // //           if (state === 'active' && currentUser) {
// // //             console.log('📱 App became active, refreshing session');
// // //             checkSessionAndUpdate();
// // //           } else if (state === 'background' && currentUser) {
// // //             console.log('📱 App went to background');
// // //             updateFirebaseStatus(currentUser.id, false);
// // //           }
// // //         });

// // //         // Network state listener
// // //         netInfoUnsubscribe = NetInfo.addEventListener((state) => {
// // //           if (state.isConnected) checkInitialSession();
// // //         });

// // //         // Periodic refresh (every 5 minutes)
// // //         refreshInterval = setInterval(() => {
// // //           const currentUser = get().user;
// // //           if (currentUser) {
// // //             checkSessionAndUpdate();
// // //           }
// // //         }, 5 * 60 * 1000);

// // //         console.log('✅ Auth store initialized');
        
// // //         return subscription;
// // //       } catch (error) {
// // //         console.error('❌ Auth store initialization failed:', error);
// // //         set({ isAuthenticated: false, user: null, isInitialized: true });
// // //       }
// // //     },

// // //     logout: async () => {
// // //       try {
// // //         const userId = get().user?.id;
// // //         await supabase.auth.signOut();
// // //         updateFirebaseStatus(userId, false);
// // //         await AsyncStorage.removeItem(AUTH_KEY);
// // //         await loggedSet({ 
// // //           user: null, 
// // //           isAuthenticated: false,
// // //           isProfileComplete: false,
// // //           isCollegeSelected: false 
// // //         });
// // //         console.log('👋 Logged out successfully');
// // //       } catch (error) {
// // //         console.error('Logout failed:', error);
// // //       }
// // //     },

// // //     cleanup: () => {
// // //       if (refreshInterval) {
// // //         clearInterval(refreshInterval);
// // //       }
// // //       if (appStateListener) {
// // //         appStateListener.remove();
// // //       }
// // //       if (netInfoUnsubscribe) {
// // //         netInfoUnsubscribe();
// // //       }
// // //     },

// // //     // Helper method to check if auth is ready
// // //     isAuthReady: () => {
// // //       const state = get();
// // //       return state.isInitialized && state.isAuthenticated !== undefined;
// // //     }
// // //   };
// // // });

// // // stores/useAuthStore.js
// // import { create } from 'zustand';
// // import AsyncStorage from '@react-native-async-storage/async-storage';
// // import { AppState } from 'react-native';
// // import NetInfo from '@react-native-community/netinfo';
// // import { supabase } from '../config/supabaseConfig';
// // import { checkProfileComplete, checkUserCollegeSelection } from '../hooks/profiles';
// // import { db as db } from '../config/firebaseConfig';
// // try {
// //   const firebaseConfig = require('../config/firebaseConfig');
// //   // db = firebaseConfig.db;
// //   console.log('✅ Firebase DB loaded');
// // } catch (err) {
// //   console.warn('⚠️ Firebase not available');
// // }

// // const AUTH_KEY = 'AUTH_STATE';

// // export const useAuthStore = create((set, get) => {
// //   const loggedSet = async (newState) => {
// //     const currentState = get();
// //     const nextState = typeof newState === 'function' ? newState(currentState) : newState;
    
// //     // Update Zustand state
// //     set(nextState);
    
// //     // Save to AsyncStorage
// //     try {
// //       const stateToStore = {
// //         isAuthenticated: nextState.isAuthenticated,
// //         user: nextState.user,
// //         isProfileComplete: nextState.isProfileComplete,
// //         isCollegeSelected: nextState.isCollegeSelected,
// //         lastUpdated: new Date().toISOString()
// //       };
      
// //       await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(stateToStore));
// //       console.log('💾 Auth state saved to AsyncStorage');
// //     } catch (error) {
// //       console.warn('⚠️ Failed to save auth state:', error);
// //     }
// //   };

// //   const updateFirebaseStatus = async (userId, isOnline) => {
// //     if (!db || !userId) return;
// //     try {
// //       const userRef = db.collection('users').doc(userId);
// //       await userRef.set({
// //         isOnline,
// //         lastSeen: new Date(),
// //       }, { merge: true });
// //     } catch (e) {
// //       console.warn('Firebase status update failed:', e.message);
// //     }
// //   };

// //   const checkSessionAndUpdate = async () => {
// //     try {
// //       console.log('🔍 Checking session...');
// //       const { data: { session } } = await supabase.auth.getSession();
// //       const userId = session?.user?.id;
      
// //       if (!userId) {
// //         console.log('❌ No valid session found');
// //         await loggedSet({ 
// //           isAuthenticated: false, 
// //           user: null,
// //           isProfileComplete: false,
// //           isCollegeSelected: false 
// //         });
// //         return;
// //       }

// //       console.log('✅ Valid session found, fetching user data...');
// //     const { data, error } = await supabase
// //     .from('users')
// //     .select(`*, streak:streaks(*)`)
// //     .eq('id', userId)
// //     .single();
  
// //       if (error) {
// //         console.error('❌ Failed to fetch user:', error);
// //         await loggedSet({ 
// //           isAuthenticated: false, 
// //           user: null,
// //           isProfileComplete: false,
// //           isCollegeSelected: false 
// //         });
// //         return;
// //       }

// //       console.log('📋 Checking profile completion...');
// //       const profileComplete = await checkProfileComplete(userId);
// //       const collegeSelected = await checkUserCollegeSelection(userId);

// //       console.log('✅ Session validated successfully');
// //       await loggedSet({
// //         isAuthenticated: true,
// //         user: {
// //           ...data,
// //           id: userId,
// //           fullName: data.full_name,
// //           profileImage: data.profile_image,
// //           photoURL: data.profile_image,
// //           displayName: data.full_name,
// //           about: data.bio,
// //           passoutYear: data.passout_year,
// //         },
// //         isProfileComplete: profileComplete,
// //         isCollegeSelected: collegeSelected,
// //       });

// //       updateFirebaseStatus(userId, true);
// //     } catch (error) {
// //       console.error('❌ Session check failed:', error);
// //       await loggedSet({ 
// //         isAuthenticated: false, 
// //         user: null,
// //         isProfileComplete: false,
// //         isCollegeSelected: false 
// //       });
// //     }
// //   };

// //   // Listeners
// //   let refreshInterval;
// //   let appStateListener;
// //   let netInfoUnsubscribe;
// //   let authStateListener;

// //   return {
// //     // State
// //     user: null,
// //     isAuthenticated: undefined,
// //     isProfileComplete: false,
// //     isCollegeSelected: false,
// //     isInitialized: false,
// //     loading: true, // Add loading state for your navigation

// //     // Actions
// //     initialize: async () => {
// //       try {
// //         console.log('🚀 Initializing auth store...');
// //         set({ loading: true });
        
// //         // Try to restore from AsyncStorage first
// //         const cached = await AsyncStorage.getItem(AUTH_KEY);
// //         if (cached) {
// //           try {
// //             const cachedState = JSON.parse(cached);
// //             console.log('📱 Restored from AsyncStorage:', {
// //               isAuthenticated: cachedState.isAuthenticated,
// //               hasUser: !!cachedState.user,
// //               isProfileComplete: cachedState.isProfileComplete,
// //               isCollegeSelected: cachedState.isCollegeSelected
// //             });
            
// //             // Set initial state from cache
// //             set({
// //               isAuthenticated: cachedState.isAuthenticated,
// //               user: cachedState.user,
// //               isProfileComplete: cachedState.isProfileComplete || false,
// //               isCollegeSelected: cachedState.isCollegeSelected || false,
// //               isInitialized: true,
// //               loading: false
// //             });
            
// //             // If was authenticated, verify session in background
// //             if (cachedState.isAuthenticated && cachedState.user) {
// //               // Don't await this - let it run in background
// //               checkSessionAndUpdate();
// //             }
// //           } catch (parseError) {
// //             console.warn('⚠️ Failed to parse cached auth state:', parseError);
// //             await AsyncStorage.removeItem(AUTH_KEY);
// //             set({ 
// //               isAuthenticated: false, 
// //               user: null, 
// //               isInitialized: true,
// //               loading: false 
// //             });
// //           }
// //         } else {
// //           console.log('📱 No cached state, checking current session...');
// //           await checkSessionAndUpdate();
// //           set(prev => ({ ...prev, isInitialized: true, loading: false }));
// //         }

// //         // Set up listeners
// //         console.log('🔗 Setting up auth listeners...');
        
// //         // Auth state changes
// //         const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
// //           console.log('🔐 Auth state changed:', event);
// //           if (event === 'SIGNED_OUT') {
// //             await loggedSet({ 
// //               isAuthenticated: false, 
// //               user: null,
// //               isProfileComplete: false,
// //               isCollegeSelected: false 
// //             });
// //           } else if (event === 'SIGNED_IN' && session?.user) {
// //             await checkSessionAndUpdate();
// //           }
// //         });
// //         authStateListener = subscription;

// //         // App state changes
// //         appStateListener = AppState.addEventListener('change', (state) => {
// //           const currentUser = get().user;
// //           if (state === 'active' && currentUser) {
// //             console.log('📱 App became active, refreshing session');
// //             checkSessionAndUpdate();
// //           } else if (state === 'background' && currentUser) {
// //             console.log('📱 App went to background');
// //             updateFirebaseStatus(currentUser.id, false);
// //           }
// //         });

// //         // Network state changes
// //         netInfoUnsubscribe = NetInfo.addEventListener((state) => {
// //           const currentUser = get().user;
// //           if (state.isConnected && currentUser) {
// //             console.log('🌐 Network connected, refreshing session');
// //             checkSessionAndUpdate();
// //           }
// //         });

// //         // Periodic refresh
// //         refreshInterval = setInterval(() => {
// //           const currentUser = get().user;
// //           if (currentUser && get().isAuthenticated) {
// //             checkSessionAndUpdate();
// //           }
// //         }, 5 * 60 * 1000); // 5 minutes

// //         console.log('✅ Auth store initialized successfully');
// //     } catch (error) {
// //         console.error('❌ Auth store initialization failed:', error);
// //         set({ 
// //           isAuthenticated: false, 
// //           user: null, 
// //           isInitialized: true,
// //           loading: false 
// //         });
// //     }
// //   },

// //   logout: async () => {
// //       try {
// //         console.log('👋 Logging out...');
// //         const userId = get().user?.id;
        
// //         // Sign out from Supabase
// //     await supabase.auth.signOut();
        
// //         // Update Firebase status
// //         if (userId) {
// //           updateFirebaseStatus(userId, false);
// //         }
        
// //         // Clear AsyncStorage
// //         await AsyncStorage.removeItem(AUTH_KEY);
        
// //         // Clear state
// //         await loggedSet({ 
// //           user: null, 
// //           isAuthenticated: false,
// //         isProfileComplete: false,
// //         isCollegeSelected: false
// //       });

// //         console.log('✅ Logged out successfully');
// //     } catch (error) {
// //         console.error('❌ Logout failed:', error);
// //       }
// //     },

// //     // Manual refresh
// //     refresh: () => {
// //       return checkSessionAndUpdate();
// //     },

// //     // Update profile completion status
// //     updateProfileComplete: (isComplete) => {
// //       set(prev => ({ ...prev, isProfileComplete: isComplete }));
// //     },

// //     // Update college selection status
// //     updateCollegeSelected: (isSelected) => {
// //       set(prev => ({ ...prev, isCollegeSelected: isSelected }));
// //     },

// //     // Update user details
// //     updateUserDetails: async (userData) => {
// //       console.log('👤 Updating user details');
// //       const currentState = get();
// //       await loggedSet({
// //         ...currentState,
// //         user: {
// //           ...currentState.user,
// //           ...userData
// //         }
// //       });
// //     },

// //     // Update user profile (for onboarding completion)
// //     updateUserProfile: async (profileData) => {
// //       try {
// //         console.log('📝 Updating user profile:', profileData);
// //         const currentUser = get().user;
        
// //         if (!currentUser?.id) {
// //           console.error('❌ No user ID found');
// //           return false;
// //         }

// //         const { data, error } = await supabase
// //           .from('users')
// //           .update(profileData)
// //           .eq('id', currentUser.id)
// //           .select()
// //           .single();

// //         if (error) {
// //           console.error('❌ Profile update failed:', error);
// //           return false;
// //         }

// //         console.log('✅ Profile updated successfully');
        
// //         // Update local state
// //         await loggedSet({
// //           ...get(),
// //           user: {
// //             ...currentUser,
// //             ...data,
// //             fullName: data.full_name,
// //             profileImage: data.profile_image,
// //             photoURL: data.profile_image,
// //             about: data.bio,
// //             passoutYear: data.passout_year,
// //           },
// //           isProfileComplete: true,
// //           isCollegeSelected: true,
// //         });

// //         return true;
// //       } catch (error) {
// //         console.error('❌ Profile update error:', error);
// //         return false;
// //       }
// //     },

// //     // Cleanup
// //     cleanup: () => {
// //       console.log('🧹 Cleaning up auth store...');
// //       if (refreshInterval) {
// //         clearInterval(refreshInterval);
// //       }
// //       if (appStateListener) {
// //         appStateListener.remove();
// //       }
// //       if (netInfoUnsubscribe) {
// //         netInfoUnsubscribe();
// //       }
// //       if (authStateListener) {
// //         authStateListener.unsubscribe();
// //       }
// //     }
// //   };
// // });

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../config/supabaseConfig';
import { checkProfileComplete, checkUserCollegeSelection } from '../hooks/profiles';
import { db } from '../config/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

// Firebase setup with error handling
let firebaseDb = null;
try {
  firebaseDb = db;
  console.log('✅ Firebase DB loaded');
} catch (err) {
  console.warn('⚠️ Firebase not available');
}

const AUTH_KEY = 'AUTH_STATE';

export const useAuthStore = create((set, get) => {
  const loggedSet = async (newState) => {
    const currentState = get();
    const nextState = typeof newState === 'function' ? newState(currentState) : newState;
    
    // Update Zustand state
    set(nextState);
    
    // Save to AsyncStorage
    try {
      const stateToStore = {
        isAuthenticated: nextState.isAuthenticated,
        user: nextState.user,
        isProfileComplete: nextState.isProfileComplete,
        isCollegeSelected: nextState.isCollegeSelected,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(stateToStore));
      console.log('💾 Auth state saved to AsyncStorage');
    } catch (error) {
      console.warn('⚠️ Failed to save auth state:', error);
    }
  };

  const updateFirebaseStatus = async (userId, isOnline) => {
    if (!firebaseDb || !userId) return;
    try {
      const userRef = doc(firebaseDb, 'users', userId);
      await setDoc(userRef, {
        isOnline,
        lastSeen: new Date(),
      }, { merge: true });
    } catch (e) {
      console.warn('Firebase status update failed:', e.message);
    }
  };

  const checkSessionAndUpdate = async () => {
    try {
      console.log('🔍 Checking session...');
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      if (!userId) {
        console.log('❌ No valid session found');
        await loggedSet({ 
          isAuthenticated: false, 
          user: null,
          isProfileComplete: false,
          isCollegeSelected: false 
        });
        return;
      }

      console.log('✅ Valid session found, fetching user data...');
      const { data, error } = await supabase
        .from('users')
        .select(`*, streak:streaks(*)`)
        .eq('id', userId)
        .single();
  
      if (error) {
        console.error('❌ Failed to fetch user:', error);
        await loggedSet({ 
          isAuthenticated: false, 
          user: null,
          isProfileComplete: false,
          isCollegeSelected: false 
        });
        return;
      }

      console.log('📋 Checking profile completion...');
      const profileComplete = await checkProfileComplete(userId);
      const collegeSelected = await checkUserCollegeSelection(userId);

      console.log('✅ Session validated successfully');
      await loggedSet({
        isAuthenticated: true,
        user: {
          ...data,
          id: userId,
          fullName: data.full_name,
          profileImage: data.profile_image,
          photoURL: data.profile_image,
          about: data.bio,
          passoutYear: data.passout_year,
        },
        isProfileComplete: profileComplete,
        isCollegeSelected: collegeSelected,
      });

      updateFirebaseStatus(userId, true);
    } catch (error) {
      console.error('❌ Session check failed:', error);
      await loggedSet({ 
        isAuthenticated: false, 
        user: null,
        isProfileComplete: false,
        isCollegeSelected: false 
      });
    }
  };

  // Listeners
  let refreshInterval;
  let appStateListener;
  let netInfoUnsubscribe;
  let authStateListener;

  return {
    // State
    user: null,
    isAuthenticated: undefined,
    isProfileComplete: false,
    isCollegeSelected: false,
    isInitialized: false,
    loading: true,

    // Actions
    initialize: async () => {
      try {
        console.log('🚀 Initializing auth store...');
        set({ loading: true });
        
        // Try to restore from AsyncStorage first
        const cached = await AsyncStorage.getItem(AUTH_KEY);
        if (cached) {
          try {
            const cachedState = JSON.parse(cached);
            console.log('📱 Restored from AsyncStorage:', {
              isAuthenticated: cachedState.isAuthenticated,
              hasUser: !!cachedState.user,
              isProfileComplete: cachedState.isProfileComplete,
              isCollegeSelected: cachedState.isCollegeSelected
            });
            
            // Set initial state from cache
            set({
              isAuthenticated: cachedState.isAuthenticated,
              user: cachedState.user,
              isProfileComplete: cachedState.isProfileComplete || false,
              isCollegeSelected: cachedState.isCollegeSelected || false,
              isInitialized: true,
              loading: false
            });
            
            // If was authenticated, verify session in background
            if (cachedState.isAuthenticated && cachedState.user) {
              checkSessionAndUpdate();
            }
          } catch (parseError) {
            console.warn('⚠️ Failed to parse cached auth state:', parseError);
            await AsyncStorage.removeItem(AUTH_KEY);
            set({ 
              isAuthenticated: false, 
              user: null, 
              isInitialized: true,
              loading: false 
            });
          }
        } else {
          console.log('📱 No cached state, checking current session...');
          await checkSessionAndUpdate();
          set(prev => ({ ...prev, isInitialized: true, loading: false }));
        }

        // Set up listeners
        console.log('🔗 Setting up auth listeners...');
        
        // Auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔐 Auth state changed:', event);
          if (event === 'SIGNED_OUT') {
            await loggedSet({ 
              isAuthenticated: false, 
              user: null,
              isProfileComplete: false,
              isCollegeSelected: false 
            });
          } else if (event === 'SIGNED_IN' && session?.user) {
            await checkSessionAndUpdate();
          }
        });
        authStateListener = subscription;

        // App state changes
        appStateListener = AppState.addEventListener('change', (state) => {
          const currentUser = get().user;
          if (state === 'active' && currentUser) {
            console.log('📱 App became active, refreshing session');
            checkSessionAndUpdate();
          } else if (state === 'background' && currentUser) {
            console.log('📱 App went to background');
            updateFirebaseStatus(currentUser.id, false);
          }
        });

        // Network state changes
        netInfoUnsubscribe = NetInfo.addEventListener((state) => {
          const currentUser = get().user;
          if (state.isConnected) {
            console.log('🌐 Network connected, attempting session restoration...');
            checkSessionAndUpdate();
          } else {
            console.log('⚠️ Network disconnected. Will retry session restoration when back online.');
            // Do NOT log out the user here; just wait for reconnection
          }
        });

        // Periodic refresh
        refreshInterval = setInterval(() => {
          const currentUser = get().user;
          if (currentUser && get().isAuthenticated) {
            checkSessionAndUpdate();
          }
        }, 5 * 60 * 1000); // 5 minutes

        console.log('✅ Auth store initialized successfully');
      } catch (error) {
        console.error('❌ Auth store initialization failed:', error);
        set({ 
          isAuthenticated: false, 
          user: null, 
          isInitialized: true,
          loading: false 
        });
      }
    },

    // logout: async () => {
    //   try {
    //     console.log('👋 Logging out...');
    //     const userId = get().user?.id;
        
    //     // Sign out from Supabase
    //     await supabase.auth.signOut();
        
    //     // Update Firebase status
    //     if (userId) {
    //       updateFirebaseStatus(userId, false);
    //     }
        
    //     // Clear AsyncStorage
    //     await AsyncStorage.removeItem(AUTH_KEY);
        
    //     // Clear state
    //     await loggedSet({ 
    //       user: null, 
    //       isAuthenticated: false,
    //       isProfileComplete: false,
    //       isCollegeSelected: false
    //     });

    //     console.log('✅ Logged out successfully');
    //   } catch (error) {
    //     console.error('❌ Logout failed:', error);
    //   }
    // },
// Fixed logout function for useAuthStore
logout: async () => {
  try {
    console.log('👋 Logging out...');
    const userId = get().user?.id;
    
    // Update Firebase status before signing out
    if (userId) {
      try {
        await updateFirebaseStatus(userId, false);
      } catch (firebaseError) {
        console.warn('⚠️ Firebase status update failed:', firebaseError);
        // Don't block logout if Firebase update fails
      }
    }
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Supabase signout error:', error);
      // Continue with cleanup even if signout fails
    }
    
    // Clear AsyncStorage
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (storageError) {
      console.warn('⚠️ AsyncStorage clear failed:', storageError);
    }
    
    // Clear state using loggedSet for consistent logging
    await loggedSet({ 
      user: null, 
      isAuthenticated: false,
      isProfileComplete: false,
      isCollegeSelected: false
    });

    console.log('✅ Logged out successfully');
  } catch (error) {
    console.error('❌ Logout failed:', error);
    
    // Force clear state even if logout fails
    await loggedSet({ 
      user: null, 
      isAuthenticated: false,
      isProfileComplete: false,
      isCollegeSelected: false
    });
    
    // Clear AsyncStorage as fallback
    try {
      await AsyncStorage.removeItem(AUTH_KEY);
    } catch (storageError) {
      console.warn('⚠️ Fallback AsyncStorage clear failed:', storageError);
    }
  }
},
    // Manual refresh
    refresh: () => {
      return checkSessionAndUpdate();
    },

    // Update profile completion status
    updateProfileComplete: async (isComplete) => {
      console.log('📝 Updating profile completion status:', isComplete);
      const currentState = get();
      await loggedSet({
        ...currentState,
        isProfileComplete: isComplete
      });
    },

    // Update college selection status
    updateCollegeSelected: async (isSelected) => {
      console.log('🎓 Updating college selection status:', isSelected);
      const currentState = get();
      await loggedSet({
        ...currentState,
        isCollegeSelected: isSelected
      });
    },

    // Update user details
    updateUserDetails: async (userData) => {
      console.log('👤 Updating user details');
      const currentState = get();
      await loggedSet({
        ...currentState,
        user: {
          ...currentState.user,
          ...userData
        }
      });
    },

    // Update user profile (for onboarding completion)
    updateUserProfile: async (profileData) => {
      try {
        console.log('📝 Updating user profile:', profileData);
        const currentUser = get().user;
    
        if (!currentUser?.id) {
          console.error('❌ No user ID found');
          return false;
        }
    
        // Prepare data for Supabase with proper typing
        const updateData = {
          ...profileData,
          college: typeof profileData.college === 'string' ? profileData.college : (profileData.college?.name || ''), // Store as string only
          interests: Array.isArray(profileData.interests) ? profileData.interests : [], // Ensure interests is an array
          full_name: profileData.full_name || profileData.fullName, // Handle both camelCase and snake_case
          profile_image: profileData.profile_image || profileData.profileImage,
          bio: profileData.bio || profileData.about,
          passout_year: profileData.passout_year,
          username: profileData.username?.toLowerCase().trim(),
          updated_at: new Date(), // Trigger the update trigger
        };
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined || updateData[key] === null) {
            delete updateData[key];
          }
        });
        console.log('Update Data for Supabase:', updateData);
    
        const { data, error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', currentUser.id)
          .select()
          .single();
    
        if (error) {
          console.error('❌ Profile update failed:', error.message);
          return false;
        }
    
        console.log('✅ Profile updated successfully');
    
        // Update local state
        await loggedSet({
          ...get(),
          user: {
            ...currentUser,
            ...data,
            fullName: data.full_name,
            profileImage: data.profile_image,
            photoURL: data.profile_image,
            about: data.bio,
            passoutYear: data.passout_year,
          },
          isProfileComplete: true,
          isCollegeSelected: !!data.college, // Update based on college presence
        });
    
        return true;
      } catch (error) {
        console.error('❌ Profile update error:', error.message);
        return false;
      }
    },
    // Cleanup
    cleanup: () => {
      console.log('🧹 Cleaning up auth store...');
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (appStateListener) {
        appStateListener.remove();
      }
      if (netInfoUnsubscribe) {
        netInfoUnsubscribe();
      }
      if (authStateListener) {
        authStateListener.unsubscribe();
      }
    }
  };
});

