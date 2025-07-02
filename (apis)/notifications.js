import * as Notifications from 'expo-notifications';
import { supabase } from '../config/supabaseConfig';
import { Alert, Platform } from 'react-native';

export default async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    // Alert.alert('Failed to get push token for push notification!');
    return { token: null };
  }
  token = await Notifications.getExpoPushTokenAsync({
    projectId: '166a1538-4e89-4467-9385-455a907144e1',
  });

  if (token?.data) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ expo_push_token: token.data })
        .eq('id', user.id);
    }
  }

  return { token };
} 