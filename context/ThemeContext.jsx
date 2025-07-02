"use client"

import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme, Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define theme colors
export const lightTheme = {
  background: "#FFFFFF",
  surface: "#F8F9FA",
  surfaceVariant: "#F0F0F0",
  primary: "#000000",
  secondary: "#333333",
  accent: "#555555",
  text: "#000000",
  textSecondary: "#555555",
  textTertiary: "#777777",
  border: "#E0E0E0",
  inputBackground: "#F5F5F5",
  statusBar: "dark-content",
  card: "#FFFFFF",
  bubbleSent: "#E8E8E8",
  bubbleReceived: "#FFFFFF",
  icon: "#333333",
  separator: "#EEEEEE",
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FF9800",
  info: "#2196F3",
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "#000000",
};

export const darkTheme = {
  background: "#000000",
  surface: "#111111",
  surfaceVariant: "#1A1A1A",
  primary: "#8B5CF6",
  secondary: "#A1A1AA",
  accent: "#8B5CF6",
  text: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textTertiary: "#6B7280",
  border: "#27272A",
  inputBackground: "#1A1A1A",
  statusBar: "light-content",
  card: "#111111",
  bubbleSent: "#1A1A1A",
  bubbleReceived: "#111111",
  icon: "#A1A1AA",
  separator: "#27272A",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  overlay: "rgba(0, 0, 0, 0.8)",
  shadow: "rgba(0, 0, 0, 0.3)",
  textMuted: "#6B7280",
  textInverse: "#000000",
  modalBackground: "#0A0A0A",
  buttonBackground: "#1A1A1A",
  buttonText: "#FFFFFF",
  unreadBackground: "#09090B",
  searchBackground: "#1A1A1A",
  headerBg: "#111111",
};

const ThemeContext = createContext({
  isDark: false,
  colors: lightTheme,
  setScheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const deviceColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(deviceColorScheme === "dark");

  useEffect(() => {
    loadThemePreference();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      AsyncStorage.getItem("userThemePreference").then((preference) => {
        if (!preference || preference === "system") {
          setIsDark(colorScheme === "dark");
        }
      });
    });

    return () => subscription.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const preference = await AsyncStorage.getItem("userThemePreference");
      if (preference === "dark") {
        setIsDark(true);
      } else if (preference === "light") {
        setIsDark(false);
      } else {
        setIsDark(deviceColorScheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
      setIsDark(deviceColorScheme === "dark");
    }
  };

  const setScheme = (scheme) => {
    if (scheme === "system") {
      setIsDark(deviceColorScheme === "dark");
      AsyncStorage.setItem("userThemePreference", "system");
    } else {
      setIsDark(scheme === "dark");
      AsyncStorage.setItem("userThemePreference", scheme);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors: isDark ? darkTheme : lightTheme,
        setScheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
