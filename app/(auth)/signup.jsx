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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../config/supabaseConfig';
import { Fonts, TextStyles } from '../../constants/Fonts';
import { useAuthStore } from '../../stores/useAuthStore';
import { scaleSize, verticalScale } from '../../utiles/common';

const COLORS = {
  background: '#000000',
  card: '#111111',
  accent: '#8B5CF6',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  error: '#EF4444',
  inputBg: '#1A1A1A',
  inputBorder: '#27272A',
  stepActive: '#8B5CF6',
  stepInactive: '#333333',
  stepText: '#FFFFFF',
  stepTextInactive: '#A1A1AA',
};

export default function SignUpScreen() {
  const [step, setStep] = useState(1); // 1: email/otp, 2: personal, 3: education
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExistsModal, setShowExistsModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState({
    fullName: '',
    username: '',
    bio: '',
    profileInitials: '',
    interests: [],
    college: '',
    branch: '',
    passoutYear: '',
  });
  const router = useRouter();
  const { initialize } = useAuthStore();
  const mountedRef = useRef(true);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
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
        options: { shouldCreateUser: true },
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
      setUserId(newUserId);
      // Fetch complete user profile from Supabase
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id, full_name, college')
        .eq('id', newUserId)
        .single();
      if (userError && userError.code !== 'PGRST116') {
        throw new Error('Failed to fetch user profile');
      }
      if (userProfile && userProfile.id && userProfile.full_name && userProfile.college) {
        setShowExistsModal(true);
      } else {
        // New user, go to onboarding screen
        router.replace('/(auth)/onboarding');
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

  // Stepper indicator
  const renderStepIndicator = () => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scaleSize(24),
      paddingVertical: verticalScale(20),
      backgroundColor: COLORS.card,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.inputBorder,
    }}>
      {/* Step 1: Email/OTP */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <View style={{
          width: scaleSize(36),
          height: scaleSize(36),
          borderRadius: scaleSize(18),
          backgroundColor: step === 1 || step === 2 ? COLORS.stepActive : COLORS.stepInactive,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: scaleSize(8),
        }}>
          <Text style={TextStyles.body1}>1</Text>
              </View>
        <Text style={[TextStyles.body2, { color: step === 1 || step === 2 ? COLORS.stepText : COLORS.stepTextInactive, flexShrink: 1 }]} numberOfLines={1}>
          Email/OTP
            </Text>
          </View>
      {/* Connector Line */}
      <View style={{
        height: scaleSize(3),
        width: scaleSize(40),
        backgroundColor: step >= 3 ? COLORS.stepActive : COLORS.stepInactive,
        marginHorizontal: scaleSize(8),
        borderRadius: scaleSize(1.5),
        alignSelf: 'center',
      }} />
      {/* Step 2: Personal Details */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
        <Text style={[TextStyles.body2, { color: step === 3 ? COLORS.stepText : COLORS.stepTextInactive, flexShrink: 1, textAlign: 'right' }]} numberOfLines={1}>
          Personal Details
        </Text>
        <View style={{
          width: scaleSize(36),
          height: scaleSize(36),
          borderRadius: scaleSize(18),
          backgroundColor: step === 3 ? COLORS.stepActive : COLORS.stepInactive,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: scaleSize(8),
        }}>
          <Text style={TextStyles.body1}>2</Text>
        </View>
      </View>
      {/* Connector Line */}
      <View style={{
        height: scaleSize(3),
        width: scaleSize(40),
        backgroundColor: step === 4 ? COLORS.stepActive : COLORS.stepInactive,
        marginHorizontal: scaleSize(8),
        borderRadius: scaleSize(1.5),
        alignSelf: 'center',
      }} />
      {/* Step 3: Education Details */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
        <Text style={[TextStyles.body2, { color: step === 4 ? COLORS.stepText : COLORS.stepTextInactive, flexShrink: 1, textAlign: 'right' }]} numberOfLines={1}>
          Education Details
        </Text>
        <View style={{
          width: scaleSize(36),
          height: scaleSize(36),
          borderRadius: scaleSize(18),
          backgroundColor: step === 4 ? COLORS.stepActive : COLORS.stepInactive,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: scaleSize(8),
        }}>
          <Text style={TextStyles.body1}>3</Text>
          </View>
      </View>
      </View>
    );

  // Step navigation
  const nextStep = () => { if (mountedRef.current) setStep(step + 1); };
  const prevStep = () => { if (mountedRef.current) setStep(step - 1); };
  const updateUserData = (data) => { if (mountedRef.current) setUserData(prev => ({ ...prev, ...data })); };

  // Final onboarding completion
  const finishOnboarding = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Update user profile in Supabase
      const completeUserData = {
        id: userId,
        full_name: userData.fullName,
        username: userData.username,
        bio: userData.bio,
        profile_initials: userData.profileInitials,
        interests: userData.interests,
        college: userData.college,
        branch: userData.branch,
        passout_year: userData.passoutYear,
        updated_at: new Date().toISOString(),
      };
      const { error: upsertError } = await supabase.from('users').upsert(completeUserData);
      if (upsertError) throw upsertError;
      // Re-initialize auth store to refresh user state
      await initialize();
      // Navigate to home
      router.replace('/(root)/(tabs)/home');
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding.');
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
      <View style={styles.container}>
        {renderStepIndicator()}
        {step === 1 && (
          <>
            <Text style={styles.subtitle}>Create your account with email + OTP</Text>
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
              onPress={() => router.replace('/(auth)/signin')}
                  disabled={loading}
            >
              <Text style={styles.linkText}>Already registered? Sign In</Text>
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
            {/* Resend OTP and timer */}
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
              onPress={() => router.replace('/(auth)/signin')}
              disabled={loading}
            >
              <Text style={styles.linkText}>Already registered? Sign In</Text>
                </TouchableOpacity>
              </>
            )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
        <Modal
          visible={showExistsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowExistsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>User Already Exists</Text>
              <Text style={styles.modalText}>An account with this email already exists. Please sign in instead.</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  setShowExistsModal(false);
                  router.push('/(auth)/signin');
                }}
              >
                <Text style={styles.buttonText}>Go to Sign In</Text>
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