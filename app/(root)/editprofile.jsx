import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons, AntDesign, Feather } from '@expo/vector-icons';
import { useSafeNavigation } from '../../hooks/useSafeNavigation';
import { supabase } from '../../config/supabaseConfig';
import networkErrorHandler from '../../utiles/networkErrorHandler';
import { Fonts, TextStyles } from '../../constants/Fonts';
import { scaleSize, verticalScale } from '../../utiles/common';
import SelectionModal from '../../components/SelectionModal';

const { width } = Dimensions.get('window');

// 🎯 What's Your Vibe? Updated Interests with Creative Flair
const interestOptions = [
  { id: 'music', label: 'Music Vibes', icon: '🎧' },
  { id: 'anime', label: 'Anime Fan', icon: '🌀' },
  { id: 'kdrama', label: 'K-Drama Lover', icon: 'K' },
  { id: 'photography', label: 'Shutterbug', icon: '📸' },
  { id: 'movies', label: 'Movie Buff', icon: '🎬' },
  { id: 'cricket', label: 'Cricket Fever', icon: '🏏' },
  { id: 'coding', label: 'Code Wizard', icon: '💻' },
  { id: 'gym', label: 'Gym Mode On', icon: '🏋️' },
  { id: 'dance', label: 'Dance Floor Vibes', icon: '💃' },
  { id: 'games', label: 'Pub G', icon: '🎮' },
  { id: 'sports', label: 'Sports Lover', icon: '🏀' },
];

// Graduation years
const currentYear = new Date().getFullYear();
const passoutYears = Array.from({ length: 12 }, (_, i) => currentYear + 6 - i).reverse();

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
  // Interest selection colors with purple accents
  selectedBg: '#8B5CF6',
  selectedText: '#FFFFFF',
  selectedBorder: '#A78BFA',
  unselectedBg: '#1A1A1A',
  unselectedText: '#FFFFFF',
  unselectedBorder: '#333333',
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark: '#7C3AED',
};

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

const EditProfile = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { safeBack } = useSafeNavigation({ modals: [], onCleanup: () => {} });
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const isMounted = useRef(true);
  
  const [collegeModalVisible, setCollegeModalVisible] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [manualCollege, setManualCollege] = useState('');
  const [manualBranch, setManualBranch] = useState('');

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const { data: { user: supaUser } } = await supabase.auth.getUser();
      if (supaUser?.id) {
        const { data, error } = await supabase.from('users').select('*').eq('id', supaUser.id).single();
        if (!error && data) setUser(data);
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  if (loading) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>Loading...</Text></View>;

  const toggleInterest = (interestId) => {
    if (selectedInterests.includes(interestId)) {
      const updatedInterests = selectedInterests.filter(id => id !== interestId);
      setSelectedInterests(updatedInterests);
      setUser(prev => ({ ...prev, interests: updatedInterests }));
    } else {
      if (selectedInterests.length >= 10) {
        Alert.alert('Maximum Reached', 'You can select up to 10 interests only.');
        return;
      }
      const updatedInterests = [...selectedInterests, interestId];
      setSelectedInterests(updatedInterests);
      setUser(prev => ({ ...prev, interests: updatedInterests }));
    }
  };

  const selectYear = (year) => {
    setUser(prev => ({ ...prev, passout_year: year.toString() }));
    setShowYearPicker(false);
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        // For now, just update the local state
        // TODO: Implement image upload to Supabase storage
        setUser(prev => ({ ...prev, profile_image: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!user) {
        Alert.alert('Error', 'Unable to save changes. Please try again.');
        return;
      }

      // Validation
      if (!user.full_name?.trim()) {
        Alert.alert('Required Field', 'Please enter your full name.');
        return;
      }

      if (!user.username?.trim()) {
        Alert.alert('Required Field', 'Please enter your username.');
        return;
      }

      const updateData = {
        id: user.id,
        full_name: user.full_name?.trim(),
        username: user.username?.trim(),
        email: user.email || '', // Include email to satisfy NOT NULL constraint
        bio: user.bio?.trim() || '',
        interests: selectedInterests,
        college: user.college?.trim() || '',
        branch: user.branch?.trim() || '',
        passout_year: user.passout_year || '',
        profile_initials: user.profile_initials || '',
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .upsert(updateData);

      if (error) throw error;

      if (isMounted.current) {
        Alert.alert('Success', 'Profile updated successfully');
        safeBack();
      }
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
    } finally {
      setSaving(false);
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
        backgroundColor: user?.passout_year === item.toString() ? colors.selectedBg : 'transparent',
      }}
    >
      <Text style={TextStyles.body1}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? scaleSize(45) : scaleSize(15),
        paddingHorizontal: scaleSize(24),
        paddingBottom: scaleSize(16),
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <TouchableOpacity
          onPress={safeBack}
          style={{
            width: scaleSize(40),
            height: scaleSize(40),
            borderRadius: scaleSize(20),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={scaleSize(24)} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={TextStyles.h2}>
          Edit Profile
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={TextStyles.body1}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: scaleSize(24), paddingVertical: scaleSize(32) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image Section */}
        <View style={{ alignItems: 'center', marginBottom: scaleSize(40) }}>
          {user?.profile_image ? (
            <Image
              source={{ uri: user.profile_image }}
              style={{
                width: scaleSize(100),
                height: scaleSize(100),
                borderRadius: scaleSize(50),
                marginBottom: scaleSize(16),
                borderWidth: 3,
                borderColor: colors.border,
              }}
            />
          ) : (
            <View style={{
              width: scaleSize(100),
              height: scaleSize(100),
              borderRadius: scaleSize(50),
              backgroundColor: colors.cardBg,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: scaleSize(16),
              borderWidth: 3,
              borderColor: colors.border,
            }}>
              <Text style={TextStyles.h1}>
                {user?.profile_initials || user?.full_name?.charAt(0) || 'U'}
              </Text>
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View style={{ marginBottom: scaleSize(32) }}>
          <Text style={TextStyles.h3}>
            Personal Information
          </Text>

          {/* Full Name */}
          <View style={{ marginBottom: scaleSize(24) }}>
            <Text style={{ ...TextStyles.body2, color: colors.text, marginBottom: 6, fontWeight: '600' }}>Full Name</Text>
            <View style={{
              backgroundColor: colors.inputBg,
              borderRadius: scaleSize(16),
              borderWidth: 1.5,
              borderColor: colors.inputBorder,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: scaleSize(12),
              height: scaleSize(44),
            }}>
              <MaterialIcons name="person" size={scaleSize(22)} color={colors.textMuted} />
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
                value={user?.full_name || ''}
                onChangeText={(text) => setUser(prev => ({ ...prev, full_name: text }))}
                style={{ flex: 1, color: colors.text, fontSize: 15, marginLeft: 10, fontWeight: '500', ...TextStyles.body2 }}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Username */}
          <View style={{ marginBottom: scaleSize(24) }}>
            <Text style={{ ...TextStyles.body2, color: colors.text, marginBottom: 6, fontWeight: '600' }}>Username</Text>
            <View style={{
              backgroundColor: colors.inputBg,
              borderRadius: scaleSize(16),
              borderWidth: 1.5,
              borderColor: colors.inputBorder,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: scaleSize(12),
              height: scaleSize(44),
            }}>
              <MaterialIcons name="alternate-email" size={scaleSize(22)} color={colors.textMuted} />
              <TextInput
                placeholder="Enter your username"
                placeholderTextColor={colors.textMuted}
                value={user?.username || ''}
                onChangeText={(text) => setUser(prev => ({ ...prev, username: text.toLowerCase() }))}
                style={{ flex: 1, color: colors.text, fontSize: 15, marginLeft: 10, fontWeight: '500', ...TextStyles.body2 }}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Bio */}
          <View style={{ marginBottom: scaleSize(24) }}>
            <Text style={{ ...TextStyles.body2, color: colors.text, marginBottom: 6, fontWeight: '600' }}>Bio</Text>
            <View style={{
              backgroundColor: colors.inputBg,
              borderRadius: scaleSize(16),
              borderWidth: 1.5,
              borderColor: colors.inputBorder,
              paddingHorizontal: scaleSize(12),
              paddingVertical: scaleSize(16),
              minHeight: scaleSize(100),
            }}>
              <TextInput
                placeholder="Write something about yourself..."
                placeholderTextColor={colors.textMuted}
                value={user?.bio || ''}
                onChangeText={(text) => setUser(prev => ({ ...prev, bio: text }))}
                style={{ color: colors.text, fontSize: 15, fontWeight: '500', textAlignVertical: 'top', ...TextStyles.body2 }}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Email (Read-only) */}
          <View style={{ marginBottom: scaleSize(24) }}>
            <Text style={{ ...TextStyles.body2, color: colors.text, marginBottom: 6, fontWeight: '600' }}>Email</Text>
            <View style={{
              backgroundColor: colors.cardBg,
              borderRadius: scaleSize(16),
              borderWidth: 1.5,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: scaleSize(12),
              height: scaleSize(44),
              opacity: 0.7,
            }}>
              <MaterialIcons name="email" size={scaleSize(22)} color={colors.textMuted} />
              <Text style={{ flex: 1, color: colors.textMuted, fontSize: 15, marginLeft: 10, fontWeight: '500', ...TextStyles.body2 }}>
                {user?.email || 'No email'}
              </Text>
            </View>
          </View>
        </View>

        {/* Interests Selection */}
        <View style={{ marginBottom: scaleSize(32) }}>
          <Text style={TextStyles.h4}>
            Interests
          </Text>
          <Text style={TextStyles.body3}>
            Select up to 10 interests ({selectedInterests.length}/10 selected)
          </Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -scaleSize(4),
          }}>
            {interestOptions.map((interest) => (
              <TouchableOpacity
                key={interest.id}
                onPress={() => toggleInterest(interest.id)}
                style={{
                  backgroundColor: selectedInterests.includes(interest.id) 
                    ? colors.selectedBg 
                    : colors.unselectedBg,
                  paddingHorizontal: scaleSize(16),
                  paddingVertical: scaleSize(10),
                  borderRadius: scaleSize(20),
                  margin: scaleSize(4),
                  borderWidth: 1.5,
                  borderColor: selectedInterests.includes(interest.id) 
                    ? colors.selectedBorder 
                    : colors.unselectedBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: scaleSize(36),
                  shadowColor: selectedInterests.includes(interest.id) ? colors.selectedBorder : 'transparent',
                  shadowOffset: { width: 0, height: scaleSize(2) },
                  shadowOpacity: selectedInterests.includes(interest.id) ? 0.3 : 0,
                  shadowRadius: scaleSize(8),
                  elevation: selectedInterests.includes(interest.id) ? 4 : 0,
                }}
              >
                <Text style={{ fontSize: scaleSize(14), marginRight: scaleSize(6) }}>
                  {interest.icon}
                </Text>
                <Text style={TextStyles.body3}>
                  {interest.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Education Details */}
        <View style={{ marginBottom: scaleSize(40) }}>
          <Text style={TextStyles.h3}>
            Education Details
          </Text>

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
                color: user?.college ? colors.text : colors.textMuted,
                fontSize: 17,
                marginLeft: scaleSize(16),
                fontWeight: '500',
              }}>
                {user?.college || 'Select your college'}
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
                setUser(prev => ({ ...prev, college: '' }));
                setTimeout(() => setManualCollege(''), 100);
              } else {
                setUser(prev => ({ ...prev, college: value }));
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
                color: user?.branch ? colors.text : colors.textMuted,
                fontSize: 17,
                marginLeft: scaleSize(16),
                fontWeight: '500',
              }}>
                {user?.branch || 'Select your branch'}
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
                setUser(prev => ({ ...prev, branch: '' }));
                setTimeout(() => setManualBranch(''), 100);
              } else {
                setUser(prev => ({ ...prev, branch: value }));
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

          {/* Graduation Year */}
          <View style={{ marginBottom: scaleSize(24) }}>
            <Text style={TextStyles.body2}>
              Expected Graduation Year
            </Text>
            <TouchableOpacity
              onPress={() => setShowYearPicker(true)}
              style={{
                backgroundColor: colors.inputBg,
                borderRadius: scaleSize(16),
                borderWidth: 1.5,
                borderColor: colors.inputBorder,
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: scaleSize(20),
                height: scaleSize(60),
              }}
            >
              <MaterialIcons name="event" size={scaleSize(22)} color={colors.textMuted} />
              <Text style={{
                flex: 1,
                color: user?.passout_year ? colors.text : colors.textMuted,
                fontSize: scaleSize(17),
                marginLeft: scaleSize(16),
                fontWeight: '500',
              }}>
                {user?.passout_year || 'Select graduation year'}
              </Text>
              <AntDesign name="down" size={scaleSize(16)} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
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
            borderTopLeftRadius: scaleSize(24),
            borderTopRightRadius: scaleSize(24),
            maxHeight: '60%',
            paddingTop: scaleSize(24),
          }}>
            {/* Modal Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: scaleSize(24),
              paddingBottom: scaleSize(16),
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
                  borderRadius: scaleSize(16),
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
    </View>
  );
};

export default EditProfile;