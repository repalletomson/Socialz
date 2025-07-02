import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar, Alert, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../../context/authContext';

const colors = {
  background: '#000000',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#999999',
  inputBg: '#2A2A2A',
  inputBorder: '#404040',
  buttonBg: '#FFFFFF',
  buttonText: '#000000',
  accent: '#3B82F6',
  error: '#EF4444',
  success: '#10B981',
};

export default function EmailAuthScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const emailInputRef = useRef(null);
  const mountedRef = useRef(true);
  const { sendOTP } = useAuth();

  useEffect(() => {
    mountedRef.current = true;

    // Focus input on mount
    const focusTimer = setTimeout(() => {
      if (mountedRef.current) {
        emailInputRef.current?.focus();
      }
    }, 100);

    return () => {
      mountedRef.current = false;
      clearTimeout(focusTimer);
      Keyboard.dismiss();
    };
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmedEmail = email.trim();
    return emailRegex.test(trimmedEmail) && trimmedEmail.length >= 5 && !trimmedEmail.includes('..') && !trimmedEmail.startsWith('.') && !trimmedEmail.endsWith('.');
  };

  const handleEmailChange = (text) => {
    if (!mountedRef.current) return;
    setEmail(text);
    setIsValidEmail(validateEmail(text));
  };

  const handleSendOTP = async () => {
    if (!mountedRef.current) return;
    
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    if (!isValidEmail) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    if (mountedRef.current) {
      setLoading(true);
    }
    
    try {
      const success = await sendOTP(trimmedEmail);
      
      if (success && mountedRef.current) {
        console.log('✅ OTP sent successfully, navigating to verify-otp');
        Keyboard.dismiss();
        router.push({ pathname: '/(auth)/verify-otp', params: { email: trimmedEmail } });
      }
    } catch (error) {
      console.error('❌ Error in handleSendOTP:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 20}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to SocialZ</Text>
        <Text style={styles.subtitle}>Enter your email to receive a verification code</Text>
      </View>
      
      <View style={styles.form}>
        <View style={[styles.inputContainer, email && !isValidEmail && styles.inputInvalid]}>
          <MaterialIcons name="email" size={20} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            ref={emailInputRef}
            style={styles.input}
            placeholder="Enter your email address"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={handleSendOTP}
            blurOnSubmit={false}
          />
        </View>
        
        <TouchableOpacity
          onPress={handleSendOTP}
          disabled={loading || !isValidEmail}
          style={[styles.button, (loading || !isValidEmail) && styles.buttonDisabled]}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending...' : 'Send Verification Code'}
          </Text>
        </TouchableOpacity>
        
        {email && !isValidEmail && (
          <Text style={styles.errorText}>Please enter a valid email address</Text>
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: { 
    flex: 1, 
    backgroundColor: colors.background, 
    paddingHorizontal: 24, 
    justifyContent: 'center',
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 48 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: colors.text, 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: 16, 
    color: colors.textSecondary, 
    textAlign: 'center', 
    lineHeight: 24, 
    paddingHorizontal: 20,
    marginTop: 12
  },
  form: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  inputContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.inputBg,
    borderRadius: 16, 
    borderWidth: 2, 
    borderColor: colors.inputBorder, 
    paddingHorizontal: 16, 
    marginVertical: 8,
  },
  inputInvalid: { 
    borderColor: colors.error 
  },
  input: { 
    flex: 1, 
    color: colors.text, 
    fontSize: 16, 
    height: 56 
  },
  inputIcon: { 
    marginRight: 12 
  },
  button: {
    backgroundColor: colors.buttonBg, 
    height: 56, 
    borderRadius: 16, 
    alignItems: 'center',
    justifyContent: 'center', 
    marginVertical: 8,
  },
  buttonDisabled: { 
    backgroundColor: colors.inputBorder, 
    opacity: 0.6 
  },
  buttonText: { 
    color: colors.buttonText, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  errorText: { 
    color: colors.error, 
    fontSize: 12, 
    textAlign: 'center', 
    marginTop: 8 
  },
  footer: { 
    alignItems: 'center', 
    paddingBottom: 40, 
    marginTop: 40 
  },
  footerText: { 
    color: colors.textMuted, 
    fontSize: 12, 
    textAlign: 'center', 
    lineHeight: 18, 
    paddingHorizontal: 40 
  },
};