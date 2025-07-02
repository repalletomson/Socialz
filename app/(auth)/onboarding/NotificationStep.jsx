import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Linking, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from '../../../hooks/usePushNotifications';

const COLORS = {
  background: '#000000',
  surface: '#111111',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#6B7280',
  primary: '#8B5CF6',
  accent: '#8B5CF6',
  border: '#27272A',
  cardBg: '#1A1A1A',
};

export default function NotificationStep({ finishOnboarding }) {
  const { registerForPushNotificationsAsync } = usePushNotifications();

  const handleEnableNotifications = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      await registerForPushNotificationsAsync();
      Alert.alert("Thank You!", "Notifications have been enabled.");
    } else {
      Alert.alert(
        "Notifications Denied",
        "You can enable notifications later from your phone's settings.",
        [
          { text: "Don't ask again" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]
      );
    }
    
    finishOnboarding();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'space-between' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: COLORS.cardBg,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 32,
          borderWidth: 2,
          borderColor: COLORS.primary,
        }}>
          <Feather name="bell" size={48} color={COLORS.primary} />
        </View>

        <Text style={{ fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: COLORS.text }}>
          Don't miss DMs, chat messages, or updates from schools - enable notifications!
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <TouchableOpacity
          onPress={handleEnableNotifications}
          style={{
            backgroundColor: COLORS.primary,
            paddingVertical: 18,
            borderRadius: 12,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: 'bold' }}>YES, NOTIFY ME</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={finishOnboarding} 
          style={{
            paddingVertical: 18,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 