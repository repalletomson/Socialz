// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   StyleSheet,
//   Alert,
//   StatusBar,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { supabase } from '../../config/supabaseConfig';
// import { Fonts, TextStyles } from '../../constants/Fonts';
// import { useAuthStore } from '../../stores/useAuthStore';

// const COLORS = {
//   background: '#000000',
//   card: '#111111',
//   accent: '#8B5CF6',
//   text: '#FFFFFF',
//   textSecondary: '#A1A1AA',
//   error: '#EF4444',
//   inputBg: '#1A1A1A',
//   inputBorder: '#27272A',
// };

// export default function AuthScreen() {
//   const [step, setStep] = useState(1);
//   const [email, setEmail] = useState('');
//   const [otp, setOtp] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [resendTimer, setResendTimer] = useState(0);
//   const router = useRouter();
//   const { updateProfileComplete, updateCollegeSelected, updateUserDetails } = useAuthStore();

//   useEffect(() => {
//     let interval;
//     if (step === 2 && resendTimer > 0) {
//       interval = setInterval(() => {
//         setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
//       }, 1000);
//     }
//     return () => clearInterval(interval);
//   }, [step, resendTimer]);

//   const handleSendCode = async (isResend = false) => {
//     setError('');
//     setSuccess('');
//     if (!email.trim()) {
//       setError('Please enter your email address.');
//       return;
//     }
//     setLoading(true);
//     try {
//       const { error: otpError } = await supabase.auth.signInWithOtp({
//         email: email.trim(),
//         createUser: true,
//         options: {
//           redirectTo: 'socialz://', 
//         },
//       });
//       if (otpError) throw otpError;
//       setSuccess(isResend ? 'Verification code resent! Check your email.' : 'Verification code sent! Check your email.');
//       setStep(2);
//       setResendTimer(30);
//     } catch (err) {
//       setError(err.message || 'Failed to send code.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleVerify = async () => {
//     setError('');
//     setSuccess('');
//     if (!otp.trim()) {
//       setError('Please enter the verification code.');
//       return;
//     }
//     setLoading(true);
//     try {
//       // Verify OTP
//       const { data, error: verifyError } = await supabase.auth.verifyOtp({
//         email: email.trim(),
//         token: otp.trim(),
//         type: 'email',
//       });
//       if (verifyError) throw verifyError;
//       setSuccess('Verification successful! Logging you in...');
//       // Check if user exists in users table
//       const userId = data?.user?.id;
//       if (!userId) throw new Error('User ID not found after verification.');
//       // Fetch complete user profile from Supabase
//       const { data: userProfile, error: userError } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', userId)
//         .single();
//       console.log('userProfile', userProfile);
//       if (userError && userError.code !== 'PGRST116') {
//         // Only throw if error is not 'No rows found'
//         console.error('Error fetching user profile:', userError);
//         throw new Error('Failed to fetch user profile');
//       }
//       // Update authentication state in useAuthStore
//       if (userProfile) {
//         // If user profile exists, update Zustand store
//         useAuthStore.setState({
//           isAuthenticated: true,
//           user: {
//             ...userProfile,
//             id: userId,
//             fullName: userProfile.full_name,
//             profileImage: userProfile.profile_image,
//             photoURL: userProfile.profile_image,
//             displayName: userProfile.full_name,
//             about: userProfile.bio,
//             passoutYear: userProfile.passout_year,
//           },
//         });
//       } else {
//         // If user profile does not exist, set user as authenticated with id only
//         useAuthStore.setState({
//           isAuthenticated: true,
//           user: { id: userId },
//         });
//       }
//       if (!userProfile) {
//         // User profile does not exist, go to onboarding and pass userId
//         router.replace({ pathname: '/(auth)/onboarding', params: { userId } });
//       } else {
//         // User profile exists, go to home
//         console.log('userProfile exists, going to home');
//         router.replace('/(root)/(tabs)/home');
//       }
//     } catch (err) {
//       setError(err.message || 'Failed to verify code.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={{ flex: 1, backgroundColor: COLORS.background }}
//     >
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
//       <View style={styles.container}>
//         <Text style={styles.title}>Welcome to SocialZ</Text>
//         <Text style={styles.subtitle}>Sign in or create an account</Text>
//         {step === 1 && (
//           <>
//             <Text style={styles.label}>Email Address</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter your email"
//               placeholderTextColor={COLORS.textSecondary}
//               value={email}
//               onChangeText={setEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               autoCorrect={false}
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.button}
//               onPress={handleSendCode}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <Text style={styles.buttonText}>Send Code</Text>
//               )}
//             </TouchableOpacity>
//           </>
//         )}
//         {step === 2 && (
//           <>
//             <Text style={styles.label}>Verification Code</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter the code from your email"
//               placeholderTextColor={COLORS.textSecondary}
//               value={otp}
//               onChangeText={setOtp}
//               keyboardType="number-pad"
//               autoCapitalize="none"
//               autoCorrect={false}
//               editable={!loading}
//             />
//             <TouchableOpacity
//               style={styles.button}
//               onPress={handleVerify}
//               disabled={loading}
//             >
//               {loading ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <Text style={styles.buttonText}>Verify</Text>
//               )}
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.linkButton, { opacity: resendTimer > 0 ? 0.5 : 1 }]}
//               onPress={() => resendTimer === 0 && handleSendCode(true)}
//               disabled={resendTimer > 0 || loading}
//             >
//               <Text style={styles.linkText}>
//                 {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.linkButton}
//               onPress={() => setStep(1)}
//               disabled={loading}
//             >
//               <Text style={styles.linkText}>Change email</Text>
//             </TouchableOpacity>
//           </>
//         )}
//         {error ? <Text style={styles.error}>{error}</Text> : null}
//         {success ? <Text style={styles.success}>{success}</Text> : null}
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//   },
//   title: {
//     fontSize: 28,
//     fontFamily: Fonts.GeneralSans.Bold,
//     color: COLORS.text,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 16,
//     color: COLORS.textSecondary,
//     fontFamily: Fonts.GeneralSans.Medium,
//     marginBottom: 32,
//     textAlign: 'center',
//   },
//   label: {
//     color: COLORS.textSecondary,
//     fontSize: 15,
//     fontFamily: Fonts.GeneralSans.Medium,
//     marginBottom: 8,
//     alignSelf: 'flex-start',
//   },
//   input: {
//     width: '100%',
//     backgroundColor: COLORS.inputBg,
//     color: COLORS.text,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: COLORS.inputBorder,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     fontSize: 16,
//     fontFamily: Fonts.GeneralSans.Regular,
//     marginBottom: 20,
//   },
//   button: {
//     width: '100%',
//     backgroundColor: COLORS.accent,
//     borderRadius: 12,
//     paddingVertical: 16,
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontFamily: Fonts.GeneralSans.Bold,
//   },
//   linkButton: {
//     marginTop: 8,
//     alignSelf: 'center',
//   },
//   linkText: {
//     color: COLORS.accent,
//     fontFamily: Fonts.GeneralSans.Medium,
//     fontSize: 15,
//   },
//   error: {
//     color: COLORS.error,
//     fontSize: 14,
//     marginTop: 16,
//     textAlign: 'center',
//     fontFamily: Fonts.GeneralSans.Medium,
//   },
//   success: {
//     color: COLORS.accent,
//     fontSize: 14,
//     marginTop: 16,
//     textAlign: 'center',
//     fontFamily: Fonts.GeneralSans.Medium,
//   },
// }); 

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../config/supabaseConfig';
import { Fonts, TextStyles } from '../../constants/Fonts';
import { useAuthStore } from '../../stores/useAuthStore';

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

export default function AuthScreen() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const router = useRouter();
  const { updateProfileComplete, updateCollegeSelected } = useAuthStore();

  useEffect(() => {
    let interval;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendCode = async (isResend = false) => {
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
      });
      if (otpError) throw otpError;
      setSuccess(isResend ? 'Verification code resent! Check your email.' : 'Verification code sent! Check your email.');
      setStep(2);
      setResendTimer(60);
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
      console.log('🔐 Verifying OTP...');
      
      // Verify OTP
      const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: 'email',
      });
      
      if (verifyError) throw verifyError;
      
      const userId = authData?.user?.id;
      if (!userId) throw new Error('User ID not found after verification.');
      
      console.log('✅ OTP verified successfully, user ID:', userId);
      setSuccess('Verification successful! Setting up your account...');
      
      // Check if user profile exists
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      console.log('👤 User profile check:', { userProfile, userError });
      
      // Handle user profile scenarios
      if (userError && userError.code === 'PGRST116') {
        // User doesn't exist - new user, redirect to onboarding
        console.log('🆕 New user detected, redirecting to onboarding');
        
        // Update auth store with minimal user data
        useAuthStore.setState({
          isAuthenticated: true,
          user: { 
            id: userId,
            email: email.trim(),
          },
          isProfileComplete: false,
          isCollegeSelected: false,
        });
        
        // Navigate to onboarding
        router.replace({
          pathname: '/(auth)/onboarding',
          params: { userId: userId }
        });
        
      } else if (userError) {
        // Database error
        console.error('❌ Database error:', userError);
        throw new Error('Failed to check user profile');
        
      } else if (userProfile) {
        // User exists - check profile completion
        console.log('👤 Existing user found, checking profile completion');
        
        const isProfileComplete = Boolean(
          userProfile.full_name &&
          userProfile.username &&
          userProfile.college &&
          userProfile.branch &&
          userProfile.passout_year
        );
        
        const isCollegeSelected = Boolean(userProfile.college);
        
        console.log('📊 Profile status:', { isProfileComplete, isCollegeSelected });
        
        // Update auth store with complete user data
        useAuthStore.setState({
          isAuthenticated: true,
          user: {
            ...userProfile,
            id: userId,
            email: email.trim(),
            fullName: userProfile.full_name,
            profileImage: userProfile.profile_image,
            photoURL: userProfile.profile_image,
            displayName: userProfile.full_name,
            about: userProfile.bio,
            passoutYear: userProfile.passout_year,
          },
          isProfileComplete,
          isCollegeSelected,
        });
        
        // Navigate based on profile completion
        if (!isProfileComplete) {
          console.log('📝 Profile incomplete, redirecting to onboarding');
          router.replace({
            pathname: '/(auth)/onboarding',
            params: { userId: userId }
          });
      } else {
        console.log('🏠 Profile complete, redirecting to home');
        router.replace('/(root)/(tabs)/home');
        }
      }
      
    } catch (err) {
      console.error('❌ Verification error:', err);
      setError(err.message || 'Failed to verify code.');
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
        <Text style={styles.title}>Welcome to Socialz.</Text>
        <Text style={styles.subtitle}>Sign in or create an account</Text>
        
        {step === 1 && (
          <>
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
              style={[styles.linkButton, { opacity: resendTimer > 0 ? 0.5 : 1 }]}
              onPress={() => resendTimer === 0 && handleSendCode(true)}
              disabled={resendTimer > 0 || loading}
            >
              <Text style={styles.linkText}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => setStep(1)}
              disabled={loading}
            >
              <Text style={styles.linkText}>Change email</Text>
            </TouchableOpacity>
          </>
        )}
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}
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
    fontFamily: Fonts.GeneralSans.Medium,
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontFamily: Fonts.GeneralSans.Medium,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.inputBg,
    color: COLORS.text,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: Fonts.GeneralSans.Regular,
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.GeneralSans.Bold,
  },
  linkButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
  linkText: {
    color: COLORS.accent,
    fontFamily: Fonts.GeneralSans.Medium,
    fontSize: 15,
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    fontFamily: Fonts.GeneralSans.Medium,
  },
  success: {
    color: COLORS.accent,
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    fontFamily: Fonts.GeneralSans.Medium,
  },
}); 