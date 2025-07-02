import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="PersonalDetailsStep"  options={{
          headerShown: false,
        }} />
      <Stack.Screen name="EducationDetailsStep"   options={{
          headerShown: false,
        }}/>
      <Stack.Screen name="NotificationStep"  options={{
          headerShown: false,
        }} />
    </Stack>
  );
} 