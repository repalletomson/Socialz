import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from '../../config/supabaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import networkErrorHandler from '../../utiles/networkErrorHandler';

const GOOGLE_CLIENT_ID = '829005659257-sj4nhdfc0oulevt345air506sjn9uoh6.apps.googleusercontent.com';

export default function GoogleSignInScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '829005659257-sj4nhdfc0oulevt345air506sjn9uoh6.apps.googleusercontent.com', // Real Web Client ID
    });
    console.log('GoogleSignin configured with webClientId:', '829005659257-sj4nhdfc0oulevt345air506sjn9uoh6.apps.googleusercontent.com');
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await GoogleSignin.signOut(); // Ensure a fresh sign-in
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log('Google user info:', userInfo);
      const idToken = userInfo.idToken;
      if (!idToken) throw new Error('No idToken from Google');
      // Exchange Google idToken for Supabase session
      const { data, error: supabaseError } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      console.log('Supabase signInWithIdToken response:', { data, supabaseError });
      if (supabaseError) throw supabaseError;
      // Get user info from Supabase session
      const user = data?.user || supabase.auth.user();
      const userId = user?.id || user?.uid;
      if (!userId) throw new Error('No user ID found after sign-in');
      // Check if user exists in Supabase 'users' table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      console.log('Supabase user check:', { userData, userError });
      if (userError || !userData) {
        // New user: go to user profile setup
        router.replace('/(auth)/userprofile');
      } else {
        // Existing user: go to home
        router.replace('/home');
      }
    } catch (err) {
      setError('Google sign-in failed.');
      networkErrorHandler.showErrorToUser(err);
      console.log('Google sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Image source={require('../../assets/images/campus-connect-logo.png')} style={styles.logo} />
      <Text style={styles.title}>SocialZ</Text>
      <Text style={styles.tagline}>Connect, share, and grow with your campus community.</Text>
      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="logo-google" size={22} color="#fff" style={{ marginRight: 10 }} />
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </>
        )}
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: 24,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#A1A1AA',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  error: {
    color: '#EF4444',
    marginTop: 16,
    fontSize: 15,
    textAlign: 'center',
  },
}); 