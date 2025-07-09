import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  StatusBar,
  Dimensions,
  Image,
  InteractionManager,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuth } from '../../context/authContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';
import { useSafeNavigation } from '../../hooks/useSafeNavigation';
import { TextStyles } from '../../constants/Fonts';
import { scaleSize, verticalScale } from '../../utiles/common';

const { width, height } = Dimensions.get('window');

// Updated color scheme - Black background, white text, purple accents
const colors = {
  // Primary colors
  background: '#000000',
  surface: '#111111',
  surfaceSecondary: '#1A1A1A',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#6B7280',
  
  // Purple accent colors
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  primaryLight: '#A78BFA',
  
  // Input colors
  inputBg: '#1A1A1A',
  inputBorder: '#333333',
  inputBorderFocused: '#8B5CF6',
  
  // Button colors
  buttonPrimary: '#8B5CF6',
  buttonPrimaryText: '#FFFFFF',
  buttonSecondary: '#1A1A1A',
  buttonSecondaryText: '#FFFFFF',
  
  // State colors
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  
  // Shadows and overlays
  shadow: 'rgba(255, 255, 255, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.8)',
  
  // Google colors
  googleBg: '#1A1A1A',
  googleBorder: '#333333',
  googleText: '#FFFFFF',
};

// Create a stable password input component outside the main component
const StablePasswordInput = React.memo(({ 
  placeholder, 
  value, 
  onChangeText,
  icon,
  inputStyle = {}
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  const togglePassword = useCallback(() => {
    setShowPassword(prev => !prev);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, []);

  return (
    <View style={[{
      backgroundColor: colors.inputBg,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: isFocused ? colors.inputBorderFocused : colors.inputBorder,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 4,
      marginVertical: 8,
      height: 56,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }, inputStyle]}>
      {icon && (
        <View style={{ marginRight: 12 }}>
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
        autoComplete="off"
        autoCorrect={false}
        returnKeyType="done"
        blurOnSubmit={false}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          flex: 1,
          color: colors.text,
          fontSize: 16,
          fontWeight: '400',
        }}
      />
      <TouchableOpacity
        onPress={togglePassword}
        style={{ 
          padding: 8,
          borderRadius: 8,
        }}
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

// Safe navigation utility to prevent ViewGroup errors
const safeNavigate = (router, path, method = 'push') => {
  return new Promise((resolve, reject) => {
    InteractionManager.runAfterInteractions(() => {
      try {
        console.log(`🔄 Safe navigation: ${method} to ${path}`);
        
        setTimeout(() => {
          try {
            if (method === 'replace') {
              router.replace(path);
            } else {
              router.push(path);
            }
            resolve(true);
          } catch (error) {
            console.error(`❌ Navigation ${method} failed:`, error);
            reject(error);
          }
        }, 100);
        
      } catch (error) {
        reject(error);
      }
    });
  });
};

// Helper function to get user-friendly error messages for signup
const getSignupErrorMessage = (error) => {
  const errorCode = error?.code || error?.message || '';
  
  if (errorCode.includes('user_already_exists') || errorCode.includes('User already registered')) {
    return 'An account with this email already exists. Please sign in instead or use a different email address.';
  }
  
  if (errorCode.includes('invalid_email') || errorCode.includes('Invalid email')) {
    return 'Please enter a valid email address. Make sure it follows the format: example@domain.com';
  }
  
  if (errorCode.includes('weak_password') || errorCode.includes('Password should be at least')) {
    return 'Password is too weak. Please choose a stronger password with at least 8 characters.';
  }
  
  if (errorCode.includes('signup_disabled')) {
    return 'New user registration is currently disabled. Please contact support for assistance.';
  }
  
  if (errorCode.includes('email_address_invalid')) {
    return 'The email address format is invalid. Please check and try again.';
  }
  
  if (errorCode.includes('network') || errorCode.includes('Network')) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  
  if (errorCode.includes('too_many_requests')) {
    return 'Too many signup attempts. Please wait a few minutes before trying again.';
  }
  
  return 'Unable to create account. Please check your information and try again.';
};

// Check if Google Sign-In is available
const isGoogleSignInAvailable = () => {
  // Check if we're in a preview build or if GoogleSignin is properly configured
  try {
    return GoogleSignin && typeof GoogleSignin.configure === 'function';
  } catch (error) {
    console.log('Google Sign-In not available:', error);
    return false;
  }
};

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const { register } = useAuth();

  // Animation values
  const buttonScale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);
  const slideY = useSharedValue(30);
  const fadeIn = useSharedValue(0);

  // Universal safe navigation
  const { safeNavigate, safeBack } = useSafeNavigation({
    modals: [],
    onCleanup: () => {
      // Clean up any state here
    }
  });

  useEffect(() => {
    // Check Google Sign-In availability
    const checkGoogleAvailability = async () => {
      try {
        if (isGoogleSignInAvailable()) {
          await GoogleSignin.configure({
            webClientId: '912883386678-q9jbm946ol5hr1j78059m1e6erhhi1n5.apps.googleusercontent.com',
          });
          setGoogleAvailable(true);
        } else {
          setGoogleAvailable(false);
          console.log('Google Sign-In not available in this build');
        }
      } catch (error) {
        console.error('Google Sign-In configuration error:', error);
        setGoogleAvailable(false);
      }
    };

    checkGoogleAvailability();

    // Animate entrance
    imageOpacity.value = withTiming(1, { duration: 800 });
    slideY.value = withSpring(0, { damping: 15 });
    fadeIn.value = withTiming(1, { duration: 600 });
  }, []);

  const handleGoogleSignUp = useCallback(async () => {
    if (!googleAvailable) {
      Alert.alert(
        'Google Sign-In Unavailable',
        'Google Sign-In is not available in this build. Please use email signup or try a development/production build.',
        [
          { text: 'Use Email Instead', onPress: () => setStep(2) },
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      buttonScale.value = withSpring(0.95);
      
      await GoogleSignin.signOut();
      
      const { type, data } = await GoogleSignin.signIn();
      console.log("Google sign in data:", data.user);
      
      setPhotoUrl(data.user.photo);
      setEmail(data.user.email);
      setFullName(data.user.name || '');
      setStep(2);
      
      Alert.alert(
        '✅ Success!', 
        'Google account connected successfully! Now create a secure password for your account.',
        [{ text: 'Continue', style: 'default' }]
      );
      
      setTimeout(() => {
        buttonScale.value = withSpring(1);
      }, 150);
    } catch (error) {
      console.error('Google signup error:', error);
      
      let errorMessage = 'Google sign up failed. Please try again.';
      if (error.code === '7') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === '5') {
        errorMessage = 'Google sign up was cancelled. Please try again to continue.';
      } else if (error.code === '2') {
        errorMessage = 'Google Play Services is not available or outdated. This feature works best in development or production builds.';
      }
      Alert.alert('⚠️ Error', errorMessage);
      buttonScale.value = withSpring(1);
    } finally {
      setLoading(false);
    }
  }, [googleAvailable]);

  const handleEmailSignUp = useCallback(() => {
    setStep(2);
  }, []);

  const handleSignUp = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('⚠️ Email Required', 'Please enter your email address.');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('⚠️ Name Required', 'Please enter your full name.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('⚠️ Password Required', 'Please enter a password to secure your account.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('⚠️ Password Too Short', 'Password must be at least 8 characters long for security.');
      return;
    }

    try {
      setLoading(true);
      buttonScale.value = withSpring(0.95);
      
      console.log('🚀 Starting signup process...');
      console.log('Signup data:', { email, fullName, hasPhotoUrl: !!photoUrl });
      
      const response = await register(email, password, photoUrl, fullName, true);
      console.log('📋 Registration response:', response, typeof response);
      
      if (response && response !== false && typeof response === 'string') {
        console.log('✅ Registration successful, redirecting to profile...');
        
        Alert.alert(
          '🎉 Welcome to SocialZ!', 
          'Account created successfully! Let\'s set up your profile.',
          [{ 
            text: 'Get Started', 
            style: 'default',
            onPress: () => {
              setTimeout(async () => {
                console.log('🔄 Starting safe navigation to onboarding...');
                
                try {
                  setTimeout(async () => {
                    try {
                      await safeNavigate(router, '/(auth)/onboarding', 'replace');
                      console.log('✅ Navigation to onboarding successful');
                    } catch (navError) {
                      console.error('❌ Safe navigation failed, trying fallback:', navError);
                      setTimeout(() => {
                        try {
                          router.replace('/(auth)/onboarding');
                        } catch (fallbackError) {
                          console.error('❌ Fallback navigation also failed:', fallbackError);
                        }
                      }, 500);
                    }
                  }, 300);
                } catch (error) {
                  console.error('❌ Navigation setup failed:', error);
                }
              }, 1000);
            }
          }]
        );
      } else {
        console.log('❌ Registration failed, response:', response);
        Alert.alert('❌ Registration Failed', 'Failed to create account. Please try again.');
      }
      
      setTimeout(() => {
        buttonScale.value = withSpring(1);
      }, 150);
    } catch (error) {
      console.error('❌ Signup error:', error);
      const errorMessage = getSignupErrorMessage(error);
      Alert.alert('❌ Error', errorMessage);
      buttonScale.value = withSpring(1);
    } finally {
      setLoading(false);
    }
  }, [email, password, photoUrl, fullName, register, safeNavigate]);

  const AnimatedButton = ({ title, onPress, disabled, variant = 'primary', icon }) => {
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: buttonScale.value }],
      };
    });

    const isPrimary = variant === 'primary';
    const isGoogle = variant === 'google';

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={() => {
            buttonScale.value = withSpring(0.95);
            setTimeout(() => {
              buttonScale.value = withSpring(1);
              onPress();
            }, 100);
          }}
          disabled={disabled}
          style={[
            styles.button,
            {
              backgroundColor: isPrimary ? colors.buttonPrimary : colors.buttonSecondary,
              borderWidth: isGoogle ? 1 : 0,
              borderColor: isGoogle ? colors.googleBorder : 'transparent',
              opacity: disabled ? 0.7 : 1,
            }
          ]}
        >
          <View style={styles.buttonContent}>
            {icon && (
              <View style={styles.buttonIcon}>
                {icon}
              </View>
            )}
            <Text style={[
              styles.buttonText,
              {
                color: isPrimary ? colors.buttonPrimaryText : colors.googleText,
                fontWeight: isPrimary ? '700' : '600',
              }
            ]}>
              {title}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Memoized basic input component
  const BasicInput = React.memo(({ 
    placeholder, 
    value, 
    onChangeText, 
    keyboardType = 'default',
    icon,
    editable = true 
  }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={[
        styles.inputContainer,
        {
          borderColor: isFocused ? colors.inputBorderFocused : colors.inputBorder,
          opacity: editable ? 1 : 0.7,
        }
      ]}>
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
          autoComplete="off"
          autoCorrect={false}
          returnKeyType="done"
          blurOnSubmit={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
        />
      </View>
    );
  });

  BasicInput.displayName = 'BasicInput';

  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
      transform: [{ translateY: slideY.value }],
    };
  });

  const fadeAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeIn.value,
    };
  });

  // Memoized handlers to prevent re-creation
  const handleEmailChange = useCallback((text) => setEmail(text), []);
  const handleFullNameChange = useCallback((text) => setFullName(text), []);
  const handlePasswordChange = useCallback((text) => setPassword(text), []);
  const handleStepBack = useCallback(() => setStep(1), []);

  console.log('Rendering SignUpScreen, step:', step);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <Animated.View style={[styles.content, fadeAnimatedStyle]}>
            {/* Top Logo/Icon */}
            <Animated.View style={[styles.logoContainer, imageAnimatedStyle]}>
              <View style={styles.logoCircle}>
                <MaterialIcons name="people" size={40} color={colors.primary} />
              </View>
            </Animated.View>

            {step === 1 ? (
              <>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>
                    Join the Community
                  </Text>
                  <Text style={styles.subtitle}>
                    Connect with students from your college and discover amazing opportunities
                  </Text>
                </View>

                {/* Google Sign Up Button */}
                {googleAvailable && (
                  <AnimatedButton
                    title={loading ? 'Signing up...' : 'Continue with Google'}
                    onPress={handleGoogleSignUp}
                    disabled={loading}
                    variant="google"
                    icon={<AntDesign name="google" size={20} color="#4285F4" />}
                  />
                )}

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>
                    {googleAvailable ? 'or' : 'Sign up with email'}
                  </Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Email Sign Up Button */}
                <AnimatedButton
                  title="Continue with Email"
                  onPress={handleEmailSignUp}
                  disabled={loading}
                  variant="primary"
                  icon={<MaterialIcons name="email" size={20} color={colors.buttonPrimaryText} />}
                />

                {/* Info Text */}
                <View style={styles.infoContainer}>
                  <Text style={styles.infoText}>
                    {googleAvailable 
                      ? 'Sign up with your Google account for quick access, or use email signup.'
                      : 'Google Sign-In is not available in preview builds. Use email signup or try a development build.'
                    }
                  </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                  <View style={styles.footerRow}>
                    <Text style={styles.footerText}>
                      Already have an account?{' '}
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/auth')}>
                      <Text style={styles.footerLink}>
                        Sign In
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : (
              // Step 2: Complete Profile
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>
                    Complete Your Profile
                  </Text>
                  <Text style={styles.subtitle}>
                    {photoUrl ? 'Add a password to secure your account' : 'Enter your details to create your account'}
                  </Text>
                </View>

                {/* Google Account Info Card (if from Google) */}
                {photoUrl && (
                  <View style={styles.accountCard}>
                    <View style={styles.accountCardHeader}>
                      <View style={styles.accountCardIcon}>
                        <AntDesign name="google" size={20} color="#4285F4" />
                      </View>
                      <Text style={styles.accountCardTitle}>
                        Google Account Connected
                      </Text>
                    </View>
                    <View style={styles.accountCardInfo}>
                      <Text style={styles.accountCardName}>
                        {fullName}
                      </Text>
                      <Text style={styles.accountCardEmail}>
                        {email}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Full Name Input */}
                <BasicInput
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={handleFullNameChange}
                  icon={<MaterialIcons name="person" size={20} color={colors.textMuted} />}
                />

                {/* Email Input */}
                <BasicInput
                  placeholder="Email Address"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  editable={!photoUrl}
                  icon={<MaterialIcons name="email" size={20} color={colors.textMuted} />}
                />

                {/* Password Input */}
                <StablePasswordInput
                  placeholder="Create Password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  icon={<MaterialIcons name="lock-outline" size={20} color={colors.textSecondary} />}
                />

                {/* Password Requirements */}
                <View style={styles.passwordRequirements}>
                  <Text style={styles.passwordRequirementsText}>
                    Password must be at least 8 characters long
                  </Text>
                </View>

                {/* Complete Button */}
                <AnimatedButton
                  title={loading ? 'Creating Account...' : 'Complete Sign Up'}
                  onPress={handleSignUp}
                  disabled={loading}
                  variant="primary"
                />

                {/* Back Button */}
                <TouchableOpacity 
                  onPress={handleStepBack}
                  style={styles.backButton}
                >
                  <Feather name="arrow-left" size={16} color={colors.textSecondary} />
                  <Text style={styles.backButtonText}>
                    Back to Sign Up Options
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.inputBorder,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: colors.textMuted,
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginVertical: 8,
    height: 56,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '400',
  },
  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountCardIcon: {
    marginRight: 8,
  },
  accountCardTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  accountCardInfo: {
    paddingLeft: 28,
  },
  accountCardName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  accountCardEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  passwordRequirements: {
    marginBottom: 16,
  },
  passwordRequirementsText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    marginTop: 32,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
});