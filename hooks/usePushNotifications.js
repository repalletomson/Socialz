import { useState, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../config/supabaseConfig';

// Configure how notifications are handled when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState([]);
  const [notification, setNotification] = useState(undefined);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then(token => {
        setExpoPushToken(token ?? '');
        if (token) {
          // Save token to Supabase
          saveTokenToSupabase(token);
        }
      })
      .catch((error) => {
        console.error('Error registering for push notifications:', error);
        setExpoPushToken('');
      });

    if (Platform.OS === 'android') {
      Notifications.getNotificationChannelsAsync().then(value => setChannels(value ?? []));
    }

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Notification received:', notification);
      setNotification(notification);
      Notifications.setBadgeCountAsync(0);
      // Handle notification based on type
      handleNotificationReceived(notification);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification tapped:', response);
      Notifications.setBadgeCountAsync(0);
      // Handle notification tap
      handleNotificationTapped(response);
    });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Save Expo push token to Supabase
  const saveTokenToSupabase = async (token) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('No authenticated user found:', userError);
        return;
      }

      // Store the token directly in the users table
      const { error } = await supabase
        .from('users')
        .update({ expo_push_token: token })
        .eq('id', user.id);

      if (error) {
        console.error('Error saving push token:', error);
        throw error;
      }

      console.log('✅ Push token saved successfully');
    } catch (error) {
      console.error('Failed to save push token to Supabase:', error);
    }
  };

  // Remove token from Supabase (called on logout)
  const removeTokenFromSupabase = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('No user to remove token for');
        return;
      }

      // Set expo_push_token to null on logout
      const { error } = await supabase
        .from('users')
        .update({ expo_push_token: null })
        .eq('id', user.id);

      if (error) {
        console.error('Error removing push token:', error);
        throw error;
      }

      console.log('✅ Push token removed successfully');
    } catch (error) {
      console.error('Failed to remove push token from Supabase:', error);
    }
  };

  // Handle incoming notification while app is running
  const handleNotificationReceived = (notification) => {
    const { data, request } = notification;
    
    // You can customize behavior based on notification type
    switch (data?.type) {
      case 'like':
        console.log('👍 Someone liked your post!');
        // Maybe update like count in real-time
        break;
      case 'comment':
        console.log('💬 New comment on your post!');
        // Maybe refresh comments or update count
        break;
      case 'reply':
        console.log('💭 Someone replied to your comment!');
        // Maybe navigate to specific comment thread
        break;
      default:
        console.log('📩 General notification received');
    }

    // Increment badge count
    Notifications.setBadgeCountAsync(1);
  };

  // Handle notification tap (when user taps on notification)
  const handleNotificationTapped = (response) => {
    const { notification } = response;
    const { data } = notification.request.content;
    
    console.log('Notification tapped with data:', data);
    
    // Navigate based on notification type
    // Note: You'll need to implement navigation logic based on your app structure
    if (data?.type && data?.postId) {
      switch (data.type) {
        case 'like':
        case 'comment':
          // Navigate to post details
          console.log(`Navigate to post: ${data.postId}`);
          // Example: navigation.navigate('PostDetails', { postId: data.postId });
          break;
        case 'reply':
          // Navigate to specific comment thread
          console.log(`Navigate to comment: ${data.commentId} in post: ${data.postId}`);
          // Example: navigation.navigate('PostDetails', { 
          //   postId: data.postId, 
          //   highlightCommentId: data.commentId 
          // });
          break;
      }
    }

    // Clear badge when notification is tapped
    Notifications.setBadgeCountAsync(0);
  };

  // Request notification permissions and get token
  const registerForPushNotificationsAsync = async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Push Notifications',
          'Please enable push notifications to get notified about likes, comments, and replies!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Notifications.openSystemPreferencesAsync() }
          ]
        );
        return;
      }
      
      // Get the token that identifies this installation
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
      
      console.log('📱 Expo Push Token:', token);
    } else {
      Alert.alert('Must use physical device for Push Notifications');
    }

    return token;
  };

  // Manual token refresh (useful for settings page)
  const refreshPushToken = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        await saveTokenToSupabase(token);
        return token;
      }
    } catch (error) {
      console.error('Error refreshing push token:', error);
      throw error;
    }
  };

  // Check if notifications are enabled
  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  };

  // Send a test notification (for debugging)
  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification 🧪",
        body: 'This is a test push notification!',
        data: { type: 'test' },
      },
      trigger: { seconds: 2 },
    });
  };

  return {
    expoPushToken,
    channels,
    notification,
    
    // Functions
    saveTokenToSupabase,
    removeTokenFromSupabase,
    refreshPushToken,
    checkNotificationPermissions,
    clearAllNotifications,
    sendTestNotification,
    
    // Handlers (you can override these in your components)
    handleNotificationReceived,
    handleNotificationTapped,
  };
} 