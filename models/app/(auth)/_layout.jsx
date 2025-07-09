// For example, in ./(auth)/_layout.jsx
import React, { useEffect } from 'react';
import { Stack, Redirect, Slot, useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/useAuthStore';

export default function AuthLayout() {
  const { isAuthenticated, isProfileComplete } = useAuthStore();
  const router = useRouter();

  // useEffect(() => {
  //   if (isAuthenticated) {
  //     if (!isProfileComplete) {
  //       router.replace('/(auth)/onboarding');
  //     } else {
  //       router.replace('/(root)/(tabs)/home');
  //     }
  //   }
  // }, [isAuthenticated, isProfileComplete]);

  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="signin" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}