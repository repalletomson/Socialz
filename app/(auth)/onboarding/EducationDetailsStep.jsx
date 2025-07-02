import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useAuth } from '../../../context/';

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
  inputBg: '#1A1A1A',
  inputBorder: '#333333',
  success: '#22C55E',
  warning: '#F59E0B',
  modalBg: 'rgba(0,0,0,0.8)',
  selectedBg: '#8B5CF6',
  selectedText: '#FFFFFF',
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark: '#7C3AED',
};

const currentYear = new Date().getFullYear();
const passoutYears = Array.from({ length: 12 }, (_, i) => currentYear + 6 - i).reverse();

export default function EducationDetailsStep({ prevStep, finishOnboarding, userData, updateUserData }) {
  const [college, setCollege] = useState(userData.college || '');
  const [branch, setBranch] = useState(userData.branch || '');
  const [passoutYear, setPassoutYear] = useState(userData.passoutYear || '');
  const [loading, setLoading] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const isMountedRef = useRef(true);
  const isProcessingRef = useRef(false);
  const { updateUserProfile } = useAuth();

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleFinish = async () => {
    if (!isMountedRef.current || isProcessingRef.current) return;
    
    if (!college.trim()) {
      Alert.alert('Required Field', 'Please enter your college/university name.');
      return;
    }

    if (!branch.trim()) {
      Alert.alert('Required Field', 'Please enter your branch/course.');
      return;
    }

    if (!passoutYear) {
      Alert.alert('Required Field', 'Please select your expected passout year.');
      return;
    }

    try {
      if (!isMountedRef.current) return;
      setLoading(true);
      isProcessingRef.current = true;

      // Update user data with all information - use snake_case for database fields
      const completeUserData = {
        full_name: userData.fullName,
        username: userData.username,
        bio: userData.bio,
        profile_initials: userData.profileInitials,
        interests: userData.interests,
        college: college.trim(), // Store as string for simpler profile completion check
        branch: branch.trim(),
        passout_year: passoutYear, // Use snake_case to match database
      };

      console.log('🔄 Updating user profile with onboarding data:', completeUserData);

      // Update user profile in database if updateUserProfile exists
      if (updateUserProfile && isMountedRef.current) {
        const success = await updateUserProfile(completeUserData);
        
        if (!success) {
          throw new Error('Failed to update profile');
        }
      }

      if (!isMountedRef.current) return;

      console.log('✅ User profile updated successfully');

      // Navigate to main app
      finishOnboarding();
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to save your information. Please try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isProcessingRef.current = false;
    }
  };

  const selectYear = (year) => {
    if (isMountedRef.current) {
      setPassoutYear(year.toString());
      setShowYearPicker(false);
    }
  };

  const renderYearItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => selectYear(item)}
      style={{
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: passoutYear === item.toString() ? colors.selectedBg : 'transparent',
      }}
    >
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: passoutYear === item.toString() ? colors.selectedText : colors.text,
        textAlign: 'center',
      }}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{
            fontSize: 32,
            fontWeight: '900',
            color: colors.text,
            marginBottom: 12,
            textAlign: 'center',
            letterSpacing: -0.5,
          }}>
            Education Details
          </Text>
          <Text style={{
            fontSize: 17,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 26,
            fontWeight: '400',
          }}>
            Tell us about your academic background
          </Text>
        </View>

        {/* User Summary Card */}
        <View style={{
          backgroundColor: colors.cardBg,
          borderRadius: 20,
          padding: 24,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.background,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2.5,
              borderColor: colors.accent,
              marginRight: 16,
            }}>
              <Text style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '800',
                letterSpacing: -0.3,
              }}>
                {userData.profileInitials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 2,
                letterSpacing: -0.3,
              }}>
                {userData.fullName}
              </Text>
              <Text style={{
                color: colors.textMuted,
                fontSize: 15,
                fontWeight: '500',
              }}>
                @{userData.username}
              </Text>
            </View>
          </View>
          <Text style={{
            color: colors.textSecondary,
            fontSize: 15,
            fontWeight: '400',
            lineHeight: 22,
          }}>
            Interests: {userData.interests?.map(interest => 
              interest.charAt(0).toUpperCase() + interest.slice(1)
            ).join(', ')}
          </Text>
        </View>

        {/* College/University Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            color: colors.text,
            fontSize: 17,
            fontWeight: '600',
            marginBottom: 12,
            letterSpacing: -0.2,
          }}>
            College / University
          </Text>
          <View style={{
            backgroundColor: colors.inputBg,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: colors.inputBorder,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            height: 60,
          }}>
            <MaterialIcons name="school" size={22} color={colors.textMuted} />
            <TextInput
              placeholder="e.g., XYZ Institute of Technology"
              placeholderTextColor={colors.textMuted}
              value={college}
              onChangeText={setCollege}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 17,
                marginLeft: 16,
                fontWeight: '500',
              }}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Branch/Course Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{
            color: colors.text,
            fontSize: 17,
            fontWeight: '600',
            marginBottom: 12,
            letterSpacing: -0.2,
          }}>
            Branch / Course
          </Text>
          <View style={{
            backgroundColor: colors.inputBg,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: colors.inputBorder,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            height: 60,
          }}>
            <MaterialIcons name="book" size={22} color={colors.textMuted} />
            <TextInput
              placeholder="e.g., Computer Science Engineering"
              placeholderTextColor={colors.textMuted}
              value={branch}
              onChangeText={setBranch}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 17,
                marginLeft: 16,
                fontWeight: '500',
              }}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Graduation Year Picker */}
        <View style={{ marginBottom: 40 }}>
          <Text style={{
            color: colors.text,
            fontSize: 17,
            fontWeight: '600',
            marginBottom: 12,
            letterSpacing: -0.2,
          }}>
            Expected Graduation Year
          </Text>
          <TouchableOpacity
            onPress={() => setShowYearPicker(true)}
            style={{
              backgroundColor: colors.inputBg,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.inputBorder,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              height: 60,
            }}
          >
            <MaterialIcons name="event" size={22} color={colors.textMuted} />
            <Text style={{
              flex: 1,
              color: passoutYear ? colors.text : colors.textMuted,
              fontSize: 17,
              marginLeft: 16,
              fontWeight: '500',
            }}>
              {passoutYear || 'Select graduation year'}
            </Text>
            <AntDesign name="down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Privacy Disclaimer */}
        <View style={{
          backgroundColor: colors.cardBg,
          borderRadius: 20,
          padding: 24,
          marginBottom: 40,
          borderWidth: 1,
          borderColor: colors.warning,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <MaterialIcons name="privacy-tip" size={24} color={colors.warning} />
            <Text style={{
              color: colors.warning,
              fontSize: 18,
              fontWeight: '700',
              marginLeft: 12,
              letterSpacing: -0.2,
            }}>
              Privacy Assurance
            </Text>
          </View>
          <Text style={{
            color: colors.textSecondary,
            fontSize: 15,
            lineHeight: 24,
            fontWeight: '400',
          }}>
            <Text style={{ fontWeight: '700', color: colors.text }}>SocialZ</Text> respects your privacy. 
            We <Text style={{ fontWeight: '700' }}>never share your personal information</Text> with third parties. 
            Your education details are used only to connect you with students from your college and enhance your experience on our platform.
          </Text>
        </View>
      </ScrollView>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: colors.modalBg,
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '60%',
            paddingTop: 24,
          }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text,
                letterSpacing: -0.3,
              }}>
                Select Graduation Year
              </Text>
              <TouchableOpacity
                onPress={() => setShowYearPicker(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.cardBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <AntDesign name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Year List */}
            <FlatList
              data={passoutYears}
              renderItem={renderYearItem}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              style={{ flexGrow: 0 }}
            />
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={{
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={prevStep}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 10,
            backgroundColor: colors.cardBg,
          }}
        >
          <AntDesign name="arrowleft" size={18} color={colors.textMuted} />
          <Text style={{
            color: colors.textMuted,
            fontSize: 14,
            fontWeight: '600',
            marginLeft: 6,
            letterSpacing: -0.1,
          }}>
            Back
          </Text>
        </TouchableOpacity>

        {/* Finish Button */}
        <TouchableOpacity
          onPress={handleFinish}
          disabled={loading || !college.trim() || !branch.trim() || !passoutYear}
          style={{
            borderWidth: 1,
            borderColor: colors.purple,
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'center',
            opacity: loading || !college.trim() || !branch.trim() || !passoutYear ? 0.4 : 1,
          }}
        >
          <Text style={{
            color: colors.purple,
            fontSize: 14,
            fontWeight: '600',
            marginRight: loading ? 6 : 0,
            letterSpacing: -0.1,
          }}>
            {loading ? 'Saving...' : 'Complete Setup'}
          </Text>
          {!loading && (
            <AntDesign name="arrowright" size={16} color={colors.purple} style={{ marginLeft: 6 }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
} 