import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar,
  Alert,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuth } from '../../context/authContext';
import { supabase } from '../../config/supabaseConfig';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { TextStyles } from '../../constants/Fonts';

const { width, height } = Dimensions.get('window');

// Professional color scheme with white, black, and purple
const colors = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceElevated: '#FFFFFF',
  text: '#000000',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E7EB',
  inputBorderActive: '#8B5CF6',
  buttonPrimary: '#8B5CF6',
  buttonSecondary: '#FFFFFF',
  buttonText: '#FFFFFF',
  buttonTextSecondary: '#374151',
  googleBg: '#FFFFFF',
  googleBorder: '#E5E7EB',
  accent: '#8B5CF6',
  error: '#EF4444',
  success: '#10B981',
  shadow: 'rgba(0, 0, 0, 0.1)',
  divider: '#E5E7EB',
};

// Stable password input component
const StablePasswordInput = React.memo(({ 
  placeholder, 
  value, 
  onChangeText,
  icon,
  style = {},
  editable = true
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused, style]}>
      {icon && (
        <View style={styles.inputIcon}>
          {icon}
        </View>
      )}
      <TextInput
        ref={inputRef}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="current-password"
        autoCorrect={false}
        returnKeyType="done"
        editable={editable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.textInput}
      />
      <TouchableOpacity
        onPress={togglePassword}
        style={styles.eyeIcon}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather 
          name={showPassword ? "eye-off" : "eye"} 
          size={20} 
          color={colors.textMuted} 
        />
      </TouchableOpacity>
    </View>
  );
});

StablePasswordInput.displayName = 'StablePasswordInput';

// Basic input component
const BasicInput = React.memo(({ 
  placeholder, 
  value, 
  onChangeText, 
  keyboardType = 'default',
  icon,
  editable = true,
  style = {}
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused, style]}>
      {icon && (
        <View style={styles.inputIcon}>
          {icon}
      </View>
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        editable={editable}
        autoCapitalize="none"
        autoComplete={keyboardType === 'email-address' ? 'email' : 'off'}
        autoCorrect={false}
        returnKeyType="next"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.textInput}
      />
    </View>
  );
});

BasicInput.displayName = 'BasicInput';

// Helper function to get user-friendly error messages
const getErrorMessage = (error) => {
  const errorCode = error?.code || error?.message || '';
  
  if (errorCode.includes('invalid_credentials') || errorCode.includes('Invalid login credentials')) {
    return 'The email or password you entered is incorrect. Please check your credentials and try again.';
  }
  
  if (errorCode.includes('user_not_found') || errorCode.includes('User not found')) {
    return 'No account found with this email address. Please check your email or sign up for a new account.';
  }
  
  if (errorCode.includes('wrong_password') || errorCode.includes('Invalid password')) {
    return 'The password you entered is incorrect. Please try again or reset your password.';
  }
  
  if (errorCode.includes('too_many_requests')) {
    return 'Too many login attempts. Please wait a few minutes before trying again.';
  }
  
  if (errorCode.includes('network') || errorCode.includes('Network')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  
  if (errorCode.includes('email_not_confirmed')) {
    return 'Please verify your email address before signing in. Check your inbox for a verification email.';
  }
  
  return 'Unable to sign in. Please check your credentials and try again.';
};

export default function SigninScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isGoogleEmail, setIsGoogleEmail] = useState(false);
  
  const { login } = useAuth();
  const navigation = useNavigation();

  // Animation values
  const buttonScale = useSharedValue(1);
  const fadeIn = useSharedValue(0);
  const slideY = useSharedValue(30);

  useEffect(() => {
    // Configure Google Sign In
    GoogleSignin.configure({
      webClientId: '912883386678-q9jbm946ol5hr1j78059m1e6erhhi1n5.apps.googleusercontent.com',
    });

    // Animate entrance
    fadeIn.value = withTiming(1, { duration: 600 });
    slideY.value = withSpring(0, { damping: 15 });

    const configureGoogleSignIn = async () => {
      try {
        await GoogleSignin.hasPlayServices();
        console.log('Play services checked successfully');
      } catch (error) {
        console.error('Play services error:', error);
      }
    };
    
    configureGoogleSignIn();
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password to continue.');
      return;
    }

    try {
      setLoading(true);
      buttonScale.value = withSpring(0.95);
      
      console.log('Attempting login with:', email);
      const response = await login(email.trim(), password);
      
      if (response) {
        Alert.alert('Success', 'Welcome back! Redirecting to your dashboard...', [
          {
            text: 'OK',
            onPress: () => {
          router.replace('/(root)/(tabs)/home');
            }
          }
        ]);
      }
      
      setTimeout(() => {
        buttonScale.value = withSpring(1);
      }, 150);
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = getErrorMessage(error);
      Alert.alert('Sign In Failed', errorMessage);
      buttonScale.value = withSpring(1);
    } finally {
      setLoading(false);
    }
  }, [email, password, login]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setGoogleLoading(true);
      
      // Sign out first
      await GoogleSignin.signOut();
      
      // Check Play Services
      await GoogleSignin.hasPlayServices();

      // Get Google user info
      const { type, data } = await GoogleSignin.signIn();
      
      if (data?.user) {
        // Set email from Google and mark it as Google email
        setEmail(data.user.email);
        setIsGoogleEmail(true);

        Alert.alert('Google Account Connected', 'Please enter your password to continue with this account.');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      
      let errorMessage = 'Google sign in failed. Please try again.';
      
      if (error.code === '7') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === '5') {
        errorMessage = 'Google sign in was cancelled. Please try again to continue.';
      } else if (error.code === '2') {
        errorMessage = 'Google Play Services is not available. Please update Google Play Services.';
      }
      
      Alert.alert('Google Sign In Failed', errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  const handleForgotPassword = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first, then try the forgot password option.');
      return;
    }

    Alert.alert(
      'Reset Password',
      `Send password reset instructions to ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: async () => {
            try {
              setResetLoading(true);
              
              const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'socialz://reset-password'
              });
              if (error) {
                throw error;
              }

              Alert.alert('Email Sent', 'Password reset instructions have been sent to your email. Please check your inbox and follow the instructions.');
            } catch (error) {
              console.error('Password reset error:', error);
              Alert.alert('Reset Failed', 'Failed to send reset email. Please check your email address and try again.');
            } finally {
              setResetLoading(false);
            }
          }
        }
      ]
    );
  }, [email]);

  // Animated button component
  const AnimatedButton = ({ title, onPress, disabled, variant = 'primary', loading: buttonLoading = false }) => {
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: buttonScale.value }],
      };
    });

    const isPrimary = variant === 'primary';
    const isDisabled = disabled || buttonLoading;

    return (
      <Animated.View style={animatedStyle}>
    <TouchableOpacity
          onPress={() => {
            if (!isDisabled) {
            buttonScale.value = withSpring(0.95);
            setTimeout(() => {
              buttonScale.value = withSpring(1);
              onPress();
            }, 100);
            }
          }}
          disabled={isDisabled}
          style={[
            styles.button,
            isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
            isDisabled && styles.buttonDisabled
          ]}
        >
          {buttonLoading ? (
            <View style={styles.buttonLoadingContainer}>
              <ActivityIndicator 
                size="small" 
                color={isPrimary ? colors.buttonText : colors.buttonTextSecondary} 
                style={styles.buttonLoader}
              />
              <Text style={[
                styles.buttonText,
                isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary
              ]}>
            {title}
          </Text>
            </View>
          ) : variant === 'google' ? (
            <View style={styles.googleButtonContent}>
            <AntDesign name="google" size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>
              {title}
            </Text>
        </View>
          ) : (
            <Text style={[
              styles.buttonText,
              isPrimary ? styles.buttonTextPrimary : styles.buttonTextSecondary
            ]}>
              {title}
            </Text>
      )}
    </TouchableOpacity>
      </Animated.View>
  );
  };

  // Memoized handlers
  const handleEmailChange = useCallback((text) => {
    setEmail(text);
    if (isGoogleEmail) {
      setIsGoogleEmail(false);
    }
  }, [isGoogleEmail]);
  
  const handlePasswordChange = useCallback((text) => setPassword(text), []);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
      transform: [{ translateY: slideY.value }],
    };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={0}
      >
        <View style={styles.container}>
          <Animated.View style={[styles.content, containerAnimatedStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                Welcome back
              </Text>
              <Text style={styles.subtitle}>
                Sign in to your account
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Google Sign In */}
              <AnimatedButton
                title={googleLoading ? 'Connecting...' : 'Continue with Google'}
                onPress={handleGoogleSignIn}
                disabled={googleLoading || loading}
                variant="google"
                loading={googleLoading}
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  Or sign in with email
                </Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Email Input */}
              <BasicInput
                placeholder="Email address"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                editable={!isGoogleEmail}
                icon={<MaterialIcons name="email" size={20} color={colors.textMuted} />}
                style={isGoogleEmail ? styles.inputDisabled : {}}
              />

              {/* Password Input */}
              <StablePasswordInput
                placeholder="Password"
                value={password}
                onChangeText={handlePasswordChange}
                icon={<MaterialIcons name="lock-outline" size={20} color={colors.textMuted} />}
              />

              {/* Forgot Password */}
              <TouchableOpacity 
                onPress={handleForgotPassword}
                disabled={resetLoading}
                style={styles.forgotPasswordButton}
              >
                <Text style={[
                  styles.forgotPasswordText,
                  resetLoading && styles.forgotPasswordTextDisabled
                ]}>
                  {resetLoading ? 'Sending...' : 'Forgot Password?'}
                </Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <AnimatedButton
                title={loading ? 'Signing In...' : 'Sign In'}
                onPress={handleLogin}
                disabled={loading || googleLoading}
                loading={loading}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                  Don't have an account?{' '}
                <Text 
                  style={styles.footerLink}
                  onPress={() => router.push('/(auth)/auth')}
                >
                    Sign Up
                  </Text>
              </Text>
              </View>
          </Animated.View>
            </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '400',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
    height: 56,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  inputContainerFocused: {
    borderColor: colors.inputBorderActive,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputDisabled: {
    backgroundColor: colors.surface,
    opacity: 0.7,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 8,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: colors.buttonPrimary,
  },
  buttonSecondary: {
    backgroundColor: colors.buttonSecondary,
    borderWidth: 1,
    borderColor: colors.googleBorder,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonTextPrimary: {
    color: colors.buttonText,
  },
  buttonTextSecondary: {
    color: colors.buttonTextSecondary,
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleButtonText: {
    color: colors.buttonTextSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    color: colors.textMuted,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '400',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    padding: 4,
  },
  forgotPasswordText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  forgotPasswordTextDisabled: {
    color: colors.textMuted,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
  },
  footerLink: {
    color: colors.accent,
    fontWeight: '600',
  },
});

