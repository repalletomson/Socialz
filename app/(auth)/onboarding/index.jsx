import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useAuth } from '../../../context/authContext';
import PersonalDetailsStep from './PersonalDetailsStep';
import EducationDetailsStep from './EducationDetailsStep';

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
  const { refreshAuthStates } = useAuth();
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

  const finishOnboarding = () => {
    router.replace('/');
  };

  const renderStepIndicator = () => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      {/* Step 1 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
      }}>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: step >= 1 ? colors.stepActive : colors.stepInactive,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: step >= 1 ? colors.stepActive : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: step >= 1 ? 0.1 : 0,
          shadowRadius: 6,
          elevation: step >= 1 ? 3 : 0,
        }}>
          {step > 1 ? (
            <AntDesign name="check" size={20} color={colors.accentText} />
          ) : (
            <Text style={{
              color: step >= 1 ? colors.accentText : colors.stepTextInactive,
              fontSize: 16,
              fontWeight: '700',
            }}>
              1
            </Text>
          )}
        </View>
        <Text style={{
          color: step >= 1 ? colors.stepText : colors.stepTextInactive,
          fontSize: 15,
          fontWeight: '600',
          marginLeft: 12,
          letterSpacing: -0.2,
        }}>
          Personal Details
        </Text>
      </View>

      {/* Connector Line */}
      <View style={{
        height: 3,
        flex: 0.3,
        backgroundColor: step >= 2 ? colors.stepActive : colors.stepInactive,
        marginHorizontal: 16,
        borderRadius: 1.5,
      }} />

      {/* Step 2 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-end',
      }}>
        <Text style={{
          color: step >= 2 ? colors.stepText : colors.stepTextInactive,
          fontSize: 15,
          fontWeight: '600',
          marginRight: 12,
          letterSpacing: -0.2,
        }}>
          Education Details
        </Text>
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: step >= 2 ? colors.stepActive : colors.stepInactive,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: step >= 2 ? colors.stepActive : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: step >= 2 ? 0.1 : 0,
          shadowRadius: 6,
          elevation: step >= 2 ? 3 : 0,
        }}>
          {step > 2 ? (
            <AntDesign name="check" size={20} color={colors.accentText} />
          ) : (
            <Text style={{
              color: step >= 2 ? colors.accentText : colors.stepTextInactive,
              fontSize: 16,
              fontWeight: '700',
            }}>
              2
            </Text>
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