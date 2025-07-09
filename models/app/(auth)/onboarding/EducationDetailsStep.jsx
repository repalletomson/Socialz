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
import { useAuth } from '../../../context/authContext';
import { TextStyles } from '../../../constants/Fonts';
import { scaleSize, verticalScale } from '../../../utiles/common';
import SelectionModal from '../../../components/SelectionModal';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../config/supabaseConfig';

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

const engineeringColleges = [
  "Indian Institute of Technology Hyderabad",
  "National Institute of Technology Warangal",
  "International Institute of Information Technology Hyderabad",
  "Birla Institute of Technology and Science Hyderabad",
  "Jawaharlal Nehru Technological University Hyderabad",
  "University College of Engineering, Osmania University",
  "Chaitanya Bharathi Institute of Technology",
  "Vasavi College of Engineering",
  "VNR Vignana Jyothi Institute of Engineering & Technology",
  "Gokaraju Rangaraju Institute of Engineering and Technology",
  "Mahatma Gandhi Institute of Technology",
  "CVR College of Engineering",
  "CMR Institute of Technology",
  "MLR Institute of Technology",
  "Malla Reddy Engineering College",
  "Keshav Memorial Institute of Technology",
  "Sreenidhi Institute of Science and Technology",
  "Lords Institute of Engineering and Technology",
  "BVRIT Hyderabad",
  "J.B. Institute of Engineering and Technology",
  "Ellenki Institute of Engineering and Technology",
  "Institute of Aeronautical Engineering",
  "ACE Engineering College",
  "Vardhaman College of Engineering",
  "Vidya Jyothi Institute of Technology",
  "TRR College of Engineering",
  "Kakatiya Institute of Technology and Science, Warangal",
  "Muffakham Jah College of Engineering and Technology",
  "Padmasri Dr. B.V. Raju Institute of Technology",
  "Abhinav Hi-Tech College of Engineering",
  "Jayamukhi Institute of Technological Sciences",
  "CMR Technical Campus"
];
const allBranches = [
  "Computer Science and Engineering (CSE)",
  "Information Technology (IT)",
  "Artificial Intelligence and Machine Learning (AIML)",
  "Data Science (DS)",
  "Cyber Security",
  "Electronics and Communication Engineering (ECE)",
  "Electrical and Electronics Engineering (EEE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
  "Chemical Engineering",
  "Metallurgical Engineering",
  "Instrumentation Engineering",
  "Aeronautical Engineering",
  "Mechatronics",
  "Biomedical Engineering",
  "Biotechnology",
  "Mining Engineering",
  "Mathematics and Computing",
  "Engineering Physics",
  "VLSI Design",
  "Embedded Systems",
  "Robotics",
  "Environmental Engineering",
  "B.Sc Computer Science",
  "B.Sc Mathematics",
  "B.Sc Electronics",
  "B.Sc Physics",
  "B.Sc Chemistry",
  "B.Sc Data Science",
  "B.Sc Biotechnology",
  "B.Sc Statistics",
  "B.Sc Psychology",
  "B.Com (General)",
  "B.Com Computers",
  "B.Com Honors",
  "BBA",
  "BBA (Business Analytics)",
  "BA Economics",
  "BA Political Science",
  "BA Psychology",
  "BA Mass Communication",
  "BA English Literature",
  "BA Public Administration",
  "BCA (Bachelor of Computer Applications)",
  "B.S.W (Social Work)"
];

export default function EducationDetailsStep({ prevStep, finishOnboarding, userData, updateUserData }) {
  const [college, setCollege] = useState(userData.college || '');
  const [branch, setBranch] = useState(userData.branch || '');
  const [passoutYear, setPassoutYear] = useState(userData.passoutYear || '');
  const [loading, setLoading] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const isMountedRef = useRef(true);
  const isProcessingRef = useRef(false);
  const { updateUserProfile, updateUserDetails } = useAuthStore();
  const [collegeModalVisible, setCollegeModalVisible] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [manualCollege, setManualCollege] = useState('');
  const [manualBranch, setManualBranch] = useState('');

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

      // Update user profile in store
      const success = await useAuthStore.getState().updateUserProfile(completeUserData);
      
      if (!success) {
        throw new Error('Failed to update profile');
      }
      
      // Also update auth store with the complete user data
      const currentUser = await supabase.auth.getUser();
      if (currentUser.data.user) {
        const { data: updatedUser } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUser.data.user.id)
          .single();
        
        if (updatedUser) {
          await useAuthStore.getState().updateUserDetails(updatedUser);
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
        paddingVertical: verticalScale(16),
        paddingHorizontal: scaleSize(24),
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
        contentContainerStyle={{ paddingHorizontal: scaleSize(24), paddingVertical: verticalScale(40) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: verticalScale(40) }}>
          <Text style={TextStyles.h1}>
            Education Details
          </Text>
          <Text style={TextStyles.body}>
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
        <View style={{ marginBottom: verticalScale(24) }}>
          <Text style={TextStyles.label}>
            College / University
          </Text>
          <TouchableOpacity
            onPress={() => setCollegeModalVisible(true)}
            style={{
              backgroundColor: colors.inputBg,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.inputBorder,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: scaleSize(20),
              height: verticalScale(60),
            }}
          >
            <MaterialIcons name="school" size={22} color={colors.textMuted} />
            <Text style={{
              flex: 1,
              color: college ? colors.text : colors.textMuted,
              fontSize: 17,
              marginLeft: scaleSize(16),
              fontWeight: '500',
            }}>
              {college || 'Select your college'}
            </Text>
            <AntDesign name="down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <SelectionModal
          visible={collegeModalVisible}
          onClose={() => setCollegeModalVisible(false)}
          options={engineeringColleges}
          onSelect={(value) => {
            if (value === 'My option is not listed') {
              setManualCollege('');
              setCollege('');
              setTimeout(() => setManualCollege(''), 100);
            } else {
              setCollege(value);
              setManualCollege('');
            }
            setCollegeModalVisible(false);
          }}
          title="Select College"
          placeholder="Search college..."
          notListedLabel="My college is not listed"
        />
        {manualCollege !== '' && (
          <TextInput
            placeholder="Enter your college name"
            placeholderTextColor={colors.textMuted}
            value={manualCollege}
            onChangeText={setManualCollege}
            style={{
              backgroundColor: colors.inputBg,
              color: colors.text,
              fontSize: 17,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.inputBorder,
              paddingHorizontal: scaleSize(20),
              height: verticalScale(60),
              marginBottom: verticalScale(24),
            }}
          />
        )}

        {/* Branch/Course Input */}
        <View style={{ marginBottom: verticalScale(24) }}>
          <Text style={TextStyles.label}>
            Branch / Course
          </Text>
          <TouchableOpacity
            onPress={() => setBranchModalVisible(true)}
            style={{
              backgroundColor: colors.inputBg,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.inputBorder,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: scaleSize(20),
              height: verticalScale(60),
            }}
          >
            <MaterialIcons name="book" size={22} color={colors.textMuted} />
            <Text style={{
              flex: 1,
              color: branch ? colors.text : colors.textMuted,
              fontSize: 17,
              marginLeft: scaleSize(16),
              fontWeight: '500',
            }}>
              {branch || 'Select your branch'}
            </Text>
            <AntDesign name="down" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
        <SelectionModal
          visible={branchModalVisible}
          onClose={() => setBranchModalVisible(false)}
          options={allBranches}
          onSelect={(value) => {
            if (value === 'My option is not listed') {
              setManualBranch('');
              setBranch('');
              setTimeout(() => setManualBranch(''), 100);
            } else {
              setBranch(value);
              setManualBranch('');
            }
            setBranchModalVisible(false);
          }}
          title="Select Branch"
          placeholder="Search branch..."
          notListedLabel="My branch is not listed"
        />
        {manualBranch !== '' && (
          <TextInput
            placeholder="Enter your branch name"
            placeholderTextColor={colors.textMuted}
            value={manualBranch}
            onChangeText={setManualBranch}
            style={{
              backgroundColor: colors.inputBg,
              color: colors.text,
              fontSize: 17,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.inputBorder,
              paddingHorizontal: scaleSize(20),
              height: verticalScale(60),
              marginBottom: verticalScale(24),
            }}
          />
        )}

        {/* Graduation Year Picker */}
        <View style={{ marginBottom: verticalScale(40) }}>
          <Text style={TextStyles.label}>
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
              paddingHorizontal: scaleSize(20),
              height: verticalScale(60),
            }}
          >
            <MaterialIcons name="event" size={22} color={colors.textMuted} />
            <Text style={{
              flex: 1,
              color: passoutYear ? colors.text : colors.textMuted,
              fontSize: 17,
              marginLeft: scaleSize(16),
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
          marginBottom: verticalScale(40),
          borderWidth: 1,
          borderColor: colors.warning,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <MaterialIcons name="privacy-tip" size={24} color={colors.warning} />
            <Text style={{
              color: colors.warning,
              fontSize: 18,
              fontWeight: '700',
              marginLeft: scaleSize(12),
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
              paddingHorizontal: scaleSize(24),
              paddingBottom: verticalScale(16),
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}>
              <Text style={TextStyles.h2}>
                Select Graduation Year
              </Text>
              <TouchableOpacity
                onPress={() => setShowYearPicker(false)}
                style={{
                  width: scaleSize(32),
                  height: scaleSize(32),
                  borderRadius: 16,
                  backgroundColor: colors.cardBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <AntDesign name="close" size={scaleSize(18)} color={colors.text} />
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
        paddingHorizontal: scaleSize(24),
        paddingVertical: verticalScale(20),
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
            paddingVertical: verticalScale(10),
            paddingHorizontal: scaleSize(16),
            borderRadius: 10,
            backgroundColor: colors.cardBg,
          }}
        >
          <AntDesign name="arrowleft" size={scaleSize(18)} color={colors.textMuted} />
          <Text style={{
            color: colors.textMuted,
            fontSize: 14,
            fontWeight: '600',
            marginLeft: scaleSize(6),
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
            paddingVertical: verticalScale(10),
            paddingHorizontal: scaleSize(20),
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
            marginRight: loading ? scaleSize(6) : 0,
            letterSpacing: -0.1,
          }}>
            {loading ? 'Saving...' : 'Complete Setup'}
          </Text>
          {!loading && (
            <AntDesign name="arrowright" size={scaleSize(16)} color={colors.purple} style={{ marginLeft: scaleSize(6) }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
} 