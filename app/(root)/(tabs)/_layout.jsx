import React, { useEffect, useState } from 'react';
import { Animated, Platform, Keyboard, View, Dimensions, TouchableOpacity } from 'react-native';
import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Fonts, TextStyles } from '../../../constants/Fonts';

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#000000',
  iconInactive: '#A1A1AA', // muted gray
  iconActive: '#8B5CF6',   // accent color
  activeBackground: 'transparent',
  createButton: '#8B5CF6',
};

const TabIcon = ({ name, focused }) => {
  const scaleValue = useState(new Animated.Value(1))[0];
  
  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1.05 : 1,
      useNativeDriver: true,
      tension: 150,
      friction: 10,
    }).start();
  }, [focused]);

  return (
    <Animated.View 
      style={{ 
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        transform: [{ scale: scaleValue }],
      }}
    >
      <Ionicons
        name={getIconName(name, focused)}
        size={24}
        color={focused ? COLORS.iconActive : COLORS.iconInactive}
        style={{ opacity: focused ? 1 : 0.8 }}
      />
    </Animated.View>
  );
};

const getIconName = (routeName, focused) => {
  switch (routeName) {
    case 'home':
      return focused ? 'home' : 'home-outline';
    case 'connect':
      return focused ? 'people' : 'people-outline';
    case 'chat':
      return focused ? 'chatbubbles' : 'chatbubbles-outline';
    case 'groups':
      return focused ? 'person-circle' : 'person-circle-outline';
    default:
      return 'circle-outline';
  }
};

const CreatePostButton = () => (
  <View style={{
    top: -18,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <TouchableOpacity
      onPress={() => router.push('/createpost')}
      activeOpacity={0.85}
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.createButton,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.createButton,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        borderWidth: 4,
        borderColor: COLORS.background,
      }}
    >
      <Ionicons name="add" size={36} color="#fff" />
    </TouchableOpacity>
  </View>
);

export default function Layout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.iconActive,
        tabBarInactiveTintColor: COLORS.iconInactive,
        tabBarLabelStyle: {
          fontFamily: Fonts.GeneralSans.Medium,
          fontSize: 11,
          marginTop: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56 + insets.bottom,
          backgroundColor: COLORS.background,
          paddingBottom: insets.bottom,
          paddingTop: 0,
          paddingHorizontal: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          borderTopWidth: 0,
          borderTopColor: 'transparent',
        },
        tabBarHideOnKeyboard: Platform.OS === 'android',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="connect" focused={focused} />,
          tabBarLabel: 'Connect',
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} />,
          tabBarLabel: 'Chat',
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="groups" focused={focused} />,
          tabBarLabel: 'Groups',
        }}
      />
    </Tabs>
  );
}
