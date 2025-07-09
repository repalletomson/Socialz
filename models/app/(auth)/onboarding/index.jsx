import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useAuthStore } from '../../../stores/useAuthStore';
import PersonalDetailsStep from './PersonalDetailsStep';
import EducationDetailsStep from './EducationDetailsStep';
import { TextStyles } from '../../../constants/Fonts';
import { scaleSize, verticalScale } from '../../../utiles/common';
import { supabase } from '../../../lib/supabase';

// Updated black theme with purple accents
const colors = {
  background: '#000000',
  surface: '#111111',
  cardBg: '#1A1A1A',
  text: '#FFFFFF',
  textSecondary: '#E5E5E5',
  textMuted: '#A1A1AA',
  accent: '#8B5CF6',
  accentBg: '#8B5CF6',
  accentText: '#FFFFFF',
  border: '#333333',
  stepActive: '#8B5CF6',
  stepInactive: '#333333',
  stepText: '#FFFFFF',
  stepTextInactive: '#A1A1AA',
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark: '#7C3AED',
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
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
  const { isAuthenticated, updateProfileComplete, updateCollegeSelected } = useAuthStore();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const nextStep = () => {
    if (mountedRef.current) {
      setStep(step + 1);
    }
  };
  
  const prevStep = () => {
    if (mountedRef.current) {
      setStep(step - 1);
    }
  };

  const updateUserData = (data) => {
    if (mountedRef.current) {
      setUserData(prevData => ({ ...prevData, ...data }));
    }
  };

  const finishOnboarding = async () => {
    console.log('isAuthenticated in finishOnboarding', isAuthenticated);
    if (isAuthenticated) {
      try {
        // Update the profile complete status in the auth store
        if (typeof updateProfileComplete === 'function') await updateProfileComplete(true);
        if (typeof updateCollegeSelected === 'function') await updateCollegeSelected(true);
        // Optionally, fetch and update the latest user data from Supabase
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: updatedUser } = await supabase
              .from('users')
              .select('*')
              .eq('id', user.id)
              .single();
            if (updatedUser) {
              await useAuthStore.getState().updateUserDetails(updatedUser);
            }
          }
        } catch (err) {
          console.warn('Could not update user details after onboarding:', err);
        }
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('Profile marked as complete, navigating to home');
        router.replace('/(root)/(tabs)/home');
      } catch (error) {
        console.error('Error finishing onboarding:', error);
      }
    }
  };

  const renderStepIndicator = () => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: scaleSize(24),
      paddingVertical: verticalScale(20),
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      {/* Step 1 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <View style={{
          width: scaleSize(36),
          height: scaleSize(36),
          borderRadius: scaleSize(18),
          backgroundColor: step >= 1 ? colors.stepActive : colors.stepInactive,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: scaleSize(8),
          shadowColor: step >= 1 ? colors.stepActive : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: step >= 1 ? 0.1 : 0,
          shadowRadius: scaleSize(6),
          elevation: step >= 1 ? 3 : 0,
        }}>
          {step > 1 ? (
            <AntDesign name="check" size={scaleSize(20)} color={colors.accentText} />
          ) : (
            <Text style={TextStyles.body1}>1</Text>
          )}
        </View>
        <Text style={[TextStyles.body2, { color: step >= 1 ? colors.stepText : colors.stepTextInactive, flexShrink: 1 }]} numberOfLines={1}>
          Personal Details
        </Text>
      </View>

      {/* Connector Line */}
      <View style={{
        height: scaleSize(3),
        width: scaleSize(40),
        backgroundColor: step >= 2 ? colors.stepActive : colors.stepInactive,
        marginHorizontal: scaleSize(8),
        borderRadius: scaleSize(1.5),
        alignSelf: 'center',
      }} />

      {/* Step 2 */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
        <Text style={[TextStyles.body2, { color: step >= 2 ? colors.stepText : colors.stepTextInactive, flexShrink: 1, textAlign: 'right' }]} numberOfLines={1}>
          Education Details
        </Text>
        <View style={{
          width: scaleSize(36),
          height: scaleSize(36),
          borderRadius: scaleSize(18),
          backgroundColor: step >= 2 ? colors.stepActive : colors.stepInactive,
          justifyContent: 'center',
          alignItems: 'center',
          marginLeft: scaleSize(8),
          shadowColor: step >= 2 ? colors.stepActive : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: step >= 2 ? 0.1 : 0,
          shadowRadius: scaleSize(6),
          elevation: step >= 2 ? 3 : 0,
        }}>
          {step > 2 ? (
            <AntDesign name="check" size={scaleSize(20)} color={colors.accentText} />
          ) : (
            <Text style={TextStyles.body1}>2</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <PersonalDetailsStep 
            nextStep={nextStep}
            userData={userData}
            updateUserData={updateUserData}
          />
        );
      case 2:
        return (
          <EducationDetailsStep 
            prevStep={prevStep}
            finishOnboarding={finishOnboarding}
            userData={userData}
            updateUserData={updateUserData}
          />
        );
      default:
        return (
          <PersonalDetailsStep 
            nextStep={nextStep}
            userData={userData}
            updateUserData={updateUserData}
          />
        );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Step Indicator */}
      {renderStepIndicator()}
      
      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderStep()}
      </View>
    </SafeAreaView>
  );
}