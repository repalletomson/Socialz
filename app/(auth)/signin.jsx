import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../config/supabaseConfig';
import { Fonts, TextStyles } from '../../constants/Fonts';

const COLORS = {
  background: '#000000',
  card: '#111111',
  accent: '#8B5CF6',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  error: '#EF4444',
  inputBg: '#1A1A1A',
  inputBorder: '#27272A',
};

export default function SignInScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendCode = async () => {
    setError('');
    setSuccess('');
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
        },
      });
      if (otpError) throw otpError;
      setSuccess('Verification code sent! Check your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError('');
    setSuccess('');
    if (!otp.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    setLoading(true);
    try {
      // Verify OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });
      if (verifyError) throw verifyError;
      setSuccess('Verification successful!');
      // Check if user exists in users table
      const newUserId = data?.user?.id;
      if (!newUserId) throw new Error('User ID not found after verification.');
      // Fetch complete user profile from Supabase
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id, full_name, username, college')
        .eq('id', newUserId)
        .single();
      if (userError && userError.code !== 'PGRST116') {
        throw new Error('Failed to fetch user profile');
      }
      if (userProfile && userProfile.id && userProfile.full_name && userProfile.username && userProfile.college) {
        // User exists and is complete, go to home
        router.replace('/(root)/(tabs)/home');
      } else {
        // User not found or incomplete, show modal
        setShowNoDataModal(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setSuccess('Verification code resent! Check your email.');
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
            } finally {
      setLoading(false);
    }
  };

  return (
      <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.background }}
      >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={[styles.container, { justifyContent: 'flex-start', paddingTop: 60 }]}> 
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{
            fontSize: 32,
            fontFamily: Fonts.GeneralSans.Bold,
            color: COLORS.accent,
            letterSpacing: -1,
            marginBottom: 2,
          }}>Welcome to</Text>
          <Text style={{
            fontSize: 40,
            fontFamily: Fonts.GeneralSans.Bold,
            color: COLORS.text,
            letterSpacing: -2,
          }}>socialz.</Text>
          <Text style={{
            color: COLORS.textSecondary,
            fontSize: 16,
            marginTop: 8,
            fontFamily: Fonts.GeneralSans.Medium,
            textAlign: 'center',
            maxWidth: 320,
          }}>
            Sign in to connect, chat, and share with your campus community!
              </Text>
            </View>
        {step === 1 && (
          <>
            <Text style={styles.subtitle}>Sign in with your email + OTP</Text>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.replace('/(auth)/signup')}
              disabled={loading}
            >
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
          </>
        )}
        {step === 2 && (
          <>
            <Text style={styles.label}>Verification Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the code from your email"
              placeholderTextColor={COLORS.textSecondary}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => setStep(1)}
              disabled={loading}
            >
              <Text style={styles.linkText}>Change email</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              {canResend ? (
                <TouchableOpacity onPress={handleResendCode} disabled={loading}>
                  <Text style={[styles.linkText, { color: COLORS.accent }]}>Resend OTP</Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ color: COLORS.textSecondary, fontSize: 15 }}>
                  Resend available in {resendTimer}s
                </Text>
              )}
              </View>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.replace('/(auth)/signup')}
              disabled={loading}
            >
              <Text style={styles.linkText}>Create Account</Text>
            </TouchableOpacity>
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        <Modal
          visible={showNoDataModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNoDataModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>No Data Found</Text>
              <Text style={styles.modalText}>No account found for this email. Please sign up to create a new account.</Text>
              <TouchableOpacity 
                style={styles.button}
                onPress={() => {
                  setShowNoDataModal(false);
                  router.replace('/(auth)/signup');
                }}
              >
                <Text style={styles.buttonText}>Go to Sign Up</Text>
              </TouchableOpacity>
            </View>
              </View>
        </Modal>
            </View>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.GeneralSans.Bold,
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.GeneralSans.Semibold,
  },
  linkButton: {
    marginTop: 16,
  },
  linkText: {
    color: COLORS.accent,
    fontSize: 15,
    fontFamily: Fonts.GeneralSans.Medium,
  },
  error: {
    color: COLORS.error,
    marginTop: 16,
    textAlign: 'center',
  },
  success: {
    color: COLORS.success,
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: Fonts.GeneralSans.Bold,
    color: COLORS.text,
    marginBottom: 12,
  },
  modalText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginBottom: 24,
    textAlign: 'center',
  },
});
