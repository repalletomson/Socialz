import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '../../config/supabaseConfig';
// import { useAuth } from '../../../context/authContext';

const colors = {
  background: '#000000',
  surface: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#999999',
  inputBg: '#2A2A2A',
  inputBorder: '#404040',
  inputFocus: '#3B82F6',
  buttonBg: '#FFFFFF',
  buttonText: '#000000',
  accent: '#3B82F6',
  error: '#EF4444',
  success: '#10B981',
};

// Clean OTP Input Component
const OTPInput = ({ value, onChange, onSubmit, disabled }) => {
  const inputs = useRef([]);
  
  const handleChange = (text, index) => {
    if (disabled) return;
    
    const newValue = value.split('');
    newValue[index] = text;
    const otpValue = newValue.join('').slice(0, 6);
    onChange(otpValue);
    
    // Auto focus next input
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    
    // Auto submit when complete
    if (otpValue.length === 6) {
      onSubmit(otpValue);
    }
  };
  
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };
  
  return (
    <View style={styles.otpContainer}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <TextInput
          key={index}
          ref={(ref) => inputs.current[index] = ref}
          style={[
            styles.otpInput,
            value[index] && styles.otpInputFilled,
            disabled && styles.otpInputDisabled
          ]}
          value={value[index] || ''}
          onChangeText={(text) => handleChange(text.replace(/[^0-9]/g, ''), index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          editable={!disabled}
          autoFocus={index === 0}
        />
      ))}
    </View>
  );
};
const verifyOTP = async (email, otp)  => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    });

    if (error) throw error;

    return true;
  } catch (err) {
    console.error('Error verifying OTP:', err.message);
    return false;
  }
};

const sendOTP = async (email)=> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      createUser: true,
      options: {
        emailRedirectTo: 'socialz://', // Replace with your app deep link or leave blank
      },
    });

    if (error) throw error;

    return true;
  } catch (err) {
    console.error('Error sending OTP:', err.message);
    return false;
  }
};


export default function OTPVerificationScreen() {
  const { email } = useLocalSearchParams();
  // const { verifyOTP, sendOTP } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Timer effect
  useEffect(() => {
    mountedRef.current = true;
    
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleOtpChange = (value) => {
    if (!mountedRef.current) return;
    setOtp(value);
    setError('');
  };

  const handleVerifyOTP = async (code) => {
    if (!mountedRef.current || loading || isProcessingRef.current) return;

    const finalOtp = code || otp;
    if (finalOtp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    isProcessingRef.current = true;

    try {
      const success = await verifyOTP(email, finalOtp);

      if (success && mountedRef.current) {
        console.log('✅ OTP verified successfully - navigation will be handled by the router hub.');
        // Clean up timers
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // After successful OTP verification and login:
        const { data: userProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (!userProfile) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(root)/(tabs)/home');
        }
      }
    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error('❌ OTP verification failed:', error);
      setOtp('');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isProcessingRef.current = false;
    }
  };

  const handleResendOTP = async () => {
    if (!mountedRef.current || !canResend || resendLoading) return;
    
    setResendLoading(true);
    setError('');

    try {
      const success = await sendOTP(email);

      if (success && mountedRef.current) {
        setTimer(60);
        setCanResend(false);
        setOtp('');
        
        // Restart timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimer((prev) => {
            if (prev <= 1) {
              if (mountedRef.current) setCanResend(true);
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      setError('Failed to resend code. Please try again.');
    } finally {
      if (mountedRef.current) {
        setResendLoading(false);
      }
    }
  };

  const goBack = () => {
    if (isProcessingRef.current) return; // Prevent navigation during processing
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    mountedRef.current = false;
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <TouchableOpacity onPress={goBack} style={styles.backButton}>
        <AntDesign name="arrowleft" size={24} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <OTPInput
            value={otp}
            onChange={handleOtpChange}
            onSubmit={handleVerifyOTP}
            disabled={loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            onPress={() => handleVerifyOTP()}
            disabled={loading || otp.length !== 6}
            style={[styles.button, (loading || otp.length !== 6) && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {!canResend ? (
              <Text style={styles.resendText}>Resend code in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP} disabled={resendLoading}>
                <Text style={[styles.resendLink, resendLoading && styles.resendDisabled]}>
                  {resendLoading ? 'Sending...' : 'Resend verification code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.helpText}>
            Check your spam folder if you don't see the email.{'\n'}
            The code expires in 10 minutes.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    padding: 8,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    fontWeight: '600',
    color: colors.text,
  },
  form: {
    alignItems: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  otpInput: {
    width: 45,
    height: 56,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  otpInputFilled: {
    borderColor: colors.inputFocus,
    backgroundColor: colors.surface,
  },
  otpInputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.buttonBg,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 24,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.inputBorder,
    opacity: 0.6,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  resendLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  resendDisabled: {
    color: colors.textMuted,
    textDecorationLine: 'none',
  },
  helpText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
};