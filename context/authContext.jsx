
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, handleSupabaseError } from '../config/supabaseConfig';
import NetInfo from '@react-native-community/netinfo';

// Keep Firebase for chat functionality - import with error handling
let firebaseAuth, firebaseDb;
try {
  const firebaseConfig = require('../config/firebaseConfig');
  firebaseAuth = firebaseConfig.auth;
  firebaseDb = firebaseConfig.db;
  console.log('✅ Firebase auth and db imported successfully');
} catch (error) {
  console.warn('⚠️ Firebase import failed:', error.message);
  firebaseAuth = null;
  firebaseDb = null;
}

// Safe wrapper for Firebase operations
const monitorNewMessages = (userId) => {
  try {
    if (!firebaseAuth) {
      console.warn('Firebase auth not available for messaging');
      return;
    }

    console.log('Firebase messaging monitoring for user:', userId);
    // Add actual Firebase messaging logic here if needed
  } catch (error) {
    console.warn('Firebase messaging not available:', error.message);
  }
};

export const AuthContext = createContext();

export default function AuthContextProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(undefined);
  const [user, setUser] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isCollegeSelected, setIsCollegeSelected] = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    setIsMounted(true);
    let isActive = true;

    const checkInitialSession = async () => {
      try {
        if (!isMounted) return;
    
        // 🔁 Force refresh session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn("❌ Session refresh error:", refreshError.message);
        }
    
        const { data: { session } } = await supabase.auth.getSession();
    
        if (session?.user && isMounted) {
          await updateUserData(session.user.id);
          const profileComplete = await checkUserProfileCompletion(session.user.id);
          const collegeSelected = await checkUserCollegeSelection(session.user.id);
          if (isMounted) {
            setIsAuthenticated(true);
            setIsProfileComplete(profileComplete);
            setIsCollegeSelected(collegeSelected);
          }
        } else {
          if (isMounted) {
            setIsAuthenticated(false);
            setIsProfileComplete(false);
            setIsCollegeSelected(false);
          }
        }
      } catch (error) {
        console.error("Session check error:", error.message);
        if (isMounted) {
          setIsAuthenticated(false);
          setIsProfileComplete(false);
          setIsCollegeSelected(false);
        }
      }
    };
    
    checkInitialSession();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        await updateUserData(session.user.id);
        const profileComplete = await checkUserProfileCompletion(session.user.id);
        const collegeSelected = await checkUserCollegeSelection(session.user.id);
        if (isMounted) {
          setIsAuthenticated(true);
          setIsProfileComplete(profileComplete);
          setIsCollegeSelected(collegeSelected);
        }
        try { monitorNewMessages(session.user.id); } catch {}
      } else {
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
          setIsProfileComplete(false);
          setIsCollegeSelected(false);
        }
      }
    });

    // AppState listener for foreground/background
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkInitialSession();
      }
      appState.current = nextAppState;
    };
    const appStateListener = AppState.addEventListener('change', handleAppStateChange);

    // NetInfo listener for network reconnect
    const netInfoUnsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        checkInitialSession();
      }
    });

    return () => {
      setIsMounted(false);
      subscription?.unsubscribe();
      appStateListener.remove();
      netInfoUnsubscribe();
    };
  }, []);

  const updateUserData = async (userId) => {
    try {
      if (!isMounted) return;
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          streak:streaks(*)
        `)
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        return;
      }

      if (data && isMounted) {
        setUser({
          ...data,
          uid: userId,
          id: userId,
          fullName: data.full_name,
          profileImage: data.profile_image,
          photoURL: data.profile_image,
          displayName: data.full_name,
          about: data.bio,
          passoutYear: data.passout_year,
        });
      } else {
        if (isMounted) {
          setUser({
            uid: userId,
            id: userId,
          });
        }
      }
    } catch (error) {
      if (isMounted) {
        setUser({
          uid: userId,
          id: userId,
        });
      }
    }
  };

  async function login(email, password) {
    try {
      console.log('🔐 Starting login process for:', email);
      
      // Test basic connectivity first
      try {
        console.log('🌐 Testing basic connectivity...');
        const testResponse = await fetch('https://httpbin.org/get', { 
          method: 'GET',
          timeout: 5000 
        });
        if (!testResponse.ok) {
          throw new Error(`Network test failed: ${testResponse.status}`);
        }
        console.log('✅ Basic connectivity working');
      } catch (connectError) {
        console.error('❌ Network connectivity issue:', connectError.message);
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
        return false;
      }
      
      console.log('🔑 Attempting Supabase login...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        console.error('❌ Supabase auth error:', error);
        throw error;
      }

      console.log('✅ Login successful:', data.user?.id);
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message?.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account.';
      }
      
      Alert.alert('Login Error', errorMessage);
      return false;
    }
  }

  async function loginOut() {
    try {
      console.log("Logging out...");
        // Clear push token from database before clearing local state
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          await supabase
            .from('users')
            .update({ expo_push_token: null })
            .eq('id', currentUser.id);
          console.log("✅ Push token cleared from database");
        }
      } catch (tokenError) {
        console.warn("⚠️ Failed to clear push token:", tokenError);
      }
      
      // Clear all local states immediately to prevent hooks errors
      setUser(null);
      setIsAuthenticated(false);
      setIsProfileComplete(false);
      setIsCollegeSelected(false);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      console.log("Logout successful");
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert('Logout Error', handleSupabaseError(error));
      return false;
    }
  }

  async function register(email, password, photoUrl, fullName, autoVerify = false) {
    try {
      console.log('Starting registration process...', { autoVerify });
      
      // Sign up with Supabase Auth with auto-verification option
      const signUpOptions = {
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName || '',
            profile_image: photoUrl || 'https://imgs.search.brave.com/SRTQLz_BmOq7xwzV7ls7bV62QzMZtDrGSacNS5G1d1A/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9pY29u/cy52ZXJ5aWNvbi5j/b20vcG5nLzEyOC9t/aXNjZWxsYW5lb3Vz/LzNweC1saW5lYXIt/ZmlsbGV0LWNvbW1v/bi1pY29uL2RlZmF1/bHQtbWFsZS1hdmF0/YXItMS5wbmc'
          }
        }
      };

      // Disable email confirmation if auto-verify is true
      if (autoVerify) {
        signUpOptions.options.emailRedirectTo = undefined;
      }

      const { data, error } = await supabase.auth.signUp(signUpOptions);

      if (error) {
        throw error;
      }

      if (data.user) {
        console.log('✅ User created successfully:', data.user.id);
        
        // If auto-verify is enabled and user needs confirmation, auto-confirm them
        if (autoVerify && !data.user.email_confirmed_at) {
          try {
            console.log('🔄 Auto-confirming user email...');
            // Note: This requires admin privileges or RLS policy adjustments
            // For now, we'll proceed with the assumption that email confirmation is disabled in Supabase settings
          } catch (confirmError) {
            console.warn('⚠️ Auto-confirmation failed, but continuing...', confirmError);
          }
        }
        
        // Set user data immediately after successful registration
        setUser({
          uid: data.user.id,
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || '',
          fullName: fullName || '',
          profile_image: photoUrl || 'https://imgs.search.brave.com/SRTQLz_BmOq7xwzV7ls7bV62QzMZtDrGSacNS5G1d1A/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9pY29u/cy52ZXJ5aWNvbi5j/b20vcG5nLzEyOC9t/aXNjZWxsYW5lb3Vz/LzNweC1saW5lYXIt/ZmlsbGV0LWNvbW1v/bi1pY29uL2RlZmF1/bHQtbWFsZS1hdmF0/YXItMS5wbmc',
          profileImage: photoUrl || 'https://imgs.search.brave.com/SRTQLz_BmOq7xwzV7ls7bV62QzMZtDrGSacNS5G1d1A/rs:fit:500:0:0:0/g:ce/aHR0cHM6Ly9pY29u/cy52ZXJ5aWNvbi5j/b20vcG5nLzEyOC9t/aXNjZWxsYW5lb3Vz/LzNweC1saW5lYXIt/ZmlsbGV0LWNvbW1v/bi1pY29uL2RlZmF1/bHQtbWFsZS1hdmF0/YXItMS5wbmc'
        });
        setIsAuthenticated(true);
        
        // Set profile completion states for new user (profile is incomplete initially)
        setIsProfileComplete(false);
        setIsCollegeSelected(false);
        
        console.log('✅ User states set - isAuthenticated: true, isProfileComplete: false');
        
        // User profile will be created automatically by database trigger
        console.log('✅ User profile will be created automatically by database trigger');

        return data.user.id;
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const errorMessage = handleSupabaseError(error);
      Alert.alert('Registration Error', errorMessage);
      return false;
    }
  }

  const updateUserProfile = async (profileData) => {
    try {
      if (!user?.uid) {
        console.error('❌ Update profile failed: User not authenticated');
        console.log('Current user state:', user);
        console.log('Is authenticated:', isAuthenticated);
        throw new Error('User not authenticated');
      }

      console.log('🔄 Updating user profile for:', user.uid);
      const { error } = await supabase
        .from('users')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.uid);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      // Update local user state
      setUser(prev => ({ ...prev, ...profileData }));
      
      // Force re-check profile completion status
      console.log('🔄 Re-checking profile completion status...');
      const profileComplete = await checkUserProfileCompletion(user.uid);
      const collegeSelected = await checkUserCollegeSelection(user.uid);
      
      console.log('Updated states:', { profileComplete, collegeSelected });
      setIsProfileComplete(profileComplete);
      setIsCollegeSelected(collegeSelected);
      
      console.log('✅ User profile updated successfully');
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw new Error(handleSupabaseError(error));
    }
  };

  const checkUserCollegeSelection = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('college')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking college selection:', error);
        return false;
      }

      return data?.college?.name ? true : false;
    } catch (error) {
      console.error('Error checking college selection:', error);
      return false;
    }
  };

  const updateUserCollege = async (college) => {
    try {
      if (!user?.uid) {
        console.error('❌ Update college failed: User not authenticated');
        console.log('Current user state:', user);
        console.log('Is authenticated:', isAuthenticated);
        
        // Try to get current user from Supabase
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          console.log('🔄 Found authenticated user, updating user state...');
          setUser({
            uid: currentUser.id,
            email: currentUser.email,
            ...currentUser.user_metadata
          });
          setIsAuthenticated(true);
          
          // Try again with the updated user
          const { error } = await supabase
            .from('users')
            .update({ college })
            .eq('id', currentUser.id);

          if (error) {
            console.error('Database update error:', error);
            throw error;
          }

          setUser(prev => ({ ...prev, college }));
          console.log('✅ College updated successfully');
          return { uid: currentUser.id, ...currentUser.user_metadata, college };
        }
        
        throw new Error('User not authenticated');
      }

      console.log('🔄 Updating college for user:', user.uid);
      const { error } = await supabase
        .from('users')
        .update({ college })
        .eq('id', user.uid);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      setUser(prev => ({ ...prev, college }));
      console.log('✅ College updated successfully');
      return user;
    } catch (error) {
      console.error("Error updating college:", error);
      throw new Error(handleSupabaseError(error));
    }
  };

  const checkUserProfileCompletion = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('full_name, branch, passout_year, college, interests, username, profile_initials')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile completion:', error);
        return false;
      }

      // Check if all required profile fields are completed for the new onboarding flow
      const hasBasicInfo = !!(data?.full_name?.trim() && data?.username?.trim());
      const hasInterests = !!(data?.interests && data?.interests.length > 0);
      
      // Handle college field - it could be stored as JSONB or string
      let collegeValue = '';
      if (typeof data?.college === 'string') {
        collegeValue = data.college.trim();
      } else if (data?.college && typeof data.college === 'object') {
        collegeValue = data.college.name || data.college.college || '';
      }
      
      const hasEducation = !!(data?.branch?.trim() && data?.passout_year?.trim() && collegeValue);
      
      const isComplete = hasBasicInfo && hasInterests && hasEducation;

      console.log('Profile completion check:', {
        full_name: !!data?.full_name?.trim(),
        username: !!data?.username?.trim(),
        interests: !!(data?.interests && data?.interests.length > 0),
        branch: !!data?.branch?.trim(),
        passout_year: !!data?.passout_year?.trim(),
        college: !!collegeValue,
        collegeValue,
        hasBasicInfo,
        hasInterests,
        hasEducation,
        isComplete
      });

      return isComplete;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return false;
    }
  };

  // Google Sign In functions (placeholder for Google OAuth with Supabase)
  const registerWithGoogleCredentials = async (credentials) => {
    try {
      // This would be implemented with Supabase OAuth
      console.log('Google registration with Supabase not yet implemented');
      return null;
    } catch (error) {
      console.error('Google registration error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async (credentials) => {
    try {
      // This would be implemented with Supabase OAuth
      console.log('Google sign in with Supabase not yet implemented');
      return null;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user,
      login,
      loginOut, 
      register,
      updateUserProfile,
      updateUserCollege, 
      isProfileComplete, 
      isCollegeSelected,
      registerWithGoogleCredentials, 
      signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (value === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return value;
};