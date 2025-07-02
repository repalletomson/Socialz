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
import { useAuth } from '../../context/authContext';
import { supabase } from '../../config/supabaseConfig';
import networkErrorHandler from '../../utiles/networkErrorHandler';
import { Fonts, TextStyles } from '../../constants/Fonts';

const { width } = Dimensions.get('window');

// Updated interest options matching onboarding
const interestOptions = [
  { id: 'movies', label: 'Movies', icon: '🎬' },
  { id: 'games', label: 'Gaming', icon: '🎮' },
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'reading', label: 'Reading', icon: '📚' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'cooking', label: 'Cooking', icon: '👨‍🍳' },
  { id: 'dance', label: 'Dance', icon: '💃' },
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

const EditProfile = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const { safeBack } = useSafeNavigation({ modals: [], onCleanup: () => {} });
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const isMounted = useRef(true);
  
  const { user } = useAuth();

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        if (!user?.uid) {
          console.error('No user ID available');
          if (isMounted.current) {
            setLoading(false);
            Alert.alert('Error', 'Unable to load user data. Please try again.');
            safeBack();
          }
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.uid)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          if (isMounted.current) {
            setLoading(false);
            Alert.alert('Error', 'Failed to load user data. Please try again.');
            safeBack();
          }
          return;
        }

        if (isMounted.current) {
          const loadedData = data || {
            full_name: user.displayName || '',
            username: '',
            bio: '',
            email: user.email || '',
            profile_image: user.photoURL || '',
            interests: [],
            college: '',
            branch: '',
            passout_year: '',
            profile_initials: '',
          };
          
          setUserData(loadedData);
          setSelectedInterests(loadedData.interests || []);
          setLoading(false);
        }
      } catch (error) {
        networkErrorHandler.showErrorToUser(error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const toggleInterest = (interestId) => {
    if (selectedInterests.includes(interestId)) {
      const updatedInterests = selectedInterests.filter(id => id !== interestId);
      setSelectedInterests(updatedInterests);
      setUserData(prev => ({ ...prev, interests: updatedInterests }));
    } else {
      if (selectedInterests.length >= 10) {
        Alert.alert('Maximum Reached', 'You can select up to 10 interests only.');
        return;
      }
      const updatedInterests = [...selectedInterests, interestId];
      setSelectedInterests(updatedInterests);
      setUserData(prev => ({ ...prev, interests: updatedInterests }));
    }
  };

  const selectYear = (year) => {
    setUserData(prev => ({ ...prev, passout_year: year.toString() }));
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
        setUserData(prev => ({ ...prev, profile_image: result.assets[0].uri }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!userData || !user?.uid) {
        Alert.alert('Error', 'Unable to save changes. Please try again.');
        return;
      }

      // Validation
      if (!userData.full_name?.trim()) {
        Alert.alert('Required Field', 'Please enter your full name.');
        return;
      }

      if (!userData.username?.trim()) {
        Alert.alert('Required Field', 'Please enter your username.');
        return;
      }

      const updateData = {
        id: user.uid,
        full_name: userData.full_name?.trim(),
        username: userData.username?.trim(),
        email: userData.email || user.email || '', // Include email to satisfy NOT NULL constraint
        bio: userData.bio?.trim() || '',
        interests: selectedInterests,
        college: userData.college?.trim() || '',
        branch: userData.branch?.trim() || '',
        passout_year: userData.passout_year || '',
        profile_initials: userData.profile_initials || '',
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

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ 
          color: colors.textSecondary,
          marginTop: 16,
          fontSize: 16,
          fontFamily: Fonts.GeneralSans.Medium
        }}>
          Loading profile...
        </Text>
      </View>
    );
  }

  const renderYearItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => selectYear(item)}
      style={{
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: userData?.passout_year === item.toString() ? colors.selectedBg : 'transparent',
      }}
    >
      <Text style={{
        fontSize: 18,
        fontWeight: '600',
        color: userData?.passout_year === item.toString() ? colors.selectedText : colors.text,
        textAlign: 'center',
      }}>
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
        paddingTop: Platform.OS === 'ios' ? 45 : 15,
        paddingHorizontal: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <TouchableOpacity
          onPress={safeBack}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={{
          fontSize: 20,
          fontFamily: Fonts.GeneralSans.Bold,
          color: colors.text,
          letterSpacing: -0.3,
        }}>
          Edit Profile
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            opacity: saving ? 0.6 : 1,
          }}
        >
          <Text style={{
            color: colors.accent,
            fontSize: 16,
            fontFamily: Fonts.GeneralSans.Bold,
            letterSpacing: -0.2,
          }}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image Section */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          {userData?.profile_image ? (
            <Image
              source={{ uri: userData.profile_image }}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                marginBottom: 16,
                borderWidth: 3,
                borderColor: colors.border,
              }}
            />
          ) : (
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.cardBg,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
              borderWidth: 3,
              borderColor: colors.border,
            }}>
              <Text style={{
                color: colors.text,
                fontSize: 32,
                fontWeight: '800',
                letterSpacing: -0.5,
              }}>
                {userData?.profile_initials || userData?.full_name?.charAt(0) || 'U'}
              </Text>
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: '700',
            marginBottom: 20,
            letterSpacing: -0.3,
          }}>
            Personal Information
          </Text>

          {/* Full Name */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              color: colors.text,
              fontSize: 17,
              fontWeight: '600',
              marginBottom: 12,
              letterSpacing: -0.2,
            }}>
              Full Name
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
              <MaterialIcons name="person" size={22} color={colors.textMuted} />
              <TextInput
                placeholder="Enter your full name"
                placeholderTextColor={colors.textMuted}
                value={userData?.full_name || ''}
                onChangeText={(text) => setUserData(prev => ({ ...prev, full_name: text }))}
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 17,
                  marginLeft: 16,
                  fontWeight: '500',
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Username */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              color: colors.text,
              fontSize: 17,
              fontWeight: '600',
              marginBottom: 12,
              letterSpacing: -0.2,
            }}>
              Username
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
              <MaterialIcons name="alternate-email" size={22} color={colors.textMuted} />
              <TextInput
                placeholder="Enter your username"
                placeholderTextColor={colors.textMuted}
                value={userData?.username || ''}
                onChangeText={(text) => setUserData(prev => ({ ...prev, username: text.toLowerCase() }))}
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 17,
                  marginLeft: 16,
                  fontWeight: '500',
                }}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Bio */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              color: colors.text,
              fontSize: 17,
              fontWeight: '600',
              marginBottom: 12,
              letterSpacing: -0.2,
            }}>
              Bio
            </Text>
            <View style={{
              backgroundColor: colors.inputBg,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.inputBorder,
              paddingHorizontal: 20,
              paddingVertical: 16,
              minHeight: 100,
            }}>
              <TextInput
                placeholder="Write something about yourself..."
                placeholderTextColor={colors.textMuted}
                value={userData?.bio || ''}
                onChangeText={(text) => setUserData(prev => ({ ...prev, bio: text }))}
                style={{
                  color: colors.text,
                  fontSize: 17,
                  fontWeight: '500',
                  textAlignVertical: 'top',
                }}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Email (Read-only) */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              color: colors.text,
              fontSize: 17,
              fontWeight: '600',
              marginBottom: 12,
              letterSpacing: -0.2,
            }}>
              Email
            </Text>
            <View style={{
              backgroundColor: colors.cardBg,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 20,
              height: 60,
              opacity: 0.7,
            }}>
              <MaterialIcons name="email" size={22} color={colors.textMuted} />
              <Text style={{
                flex: 1,
                color: colors.textMuted,
                fontSize: 17,
                marginLeft: 16,
                fontWeight: '500',
              }}>
                {userData?.email || 'No email'}
              </Text>
            </View>
          </View>
        </View>

        {/* Interests Selection */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: '700',
            marginBottom: 6,
            letterSpacing: -0.3,
          }}>
            Interests
          </Text>
          <Text style={{
            color: colors.textMuted,
            fontSize: 13,
            marginBottom: 16,
            fontWeight: '400',
          }}>
            Select up to 10 interests ({selectedInterests.length}/10 selected)
          </Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -4,
          }}>
            {interestOptions.map((interest) => (
              <TouchableOpacity
                key={interest.id}
                onPress={() => toggleInterest(interest.id)}
                style={{
                  backgroundColor: selectedInterests.includes(interest.id) 
                    ? colors.selectedBg 
                    : colors.unselectedBg,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  margin: 4,
                  borderWidth: 1.5,
                  borderColor: selectedInterests.includes(interest.id) 
                    ? colors.selectedBorder 
                    : colors.unselectedBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 36,
                  shadowColor: selectedInterests.includes(interest.id) ? colors.selectedBorder : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: selectedInterests.includes(interest.id) ? 0.3 : 0,
                  shadowRadius: 8,
                  elevation: selectedInterests.includes(interest.id) ? 4 : 0,
                }}
              >
                <Text style={{ fontSize: 14, marginRight: 6 }}>
                  {interest.icon}
                </Text>
                <Text style={{
                  color: selectedInterests.includes(interest.id) 
                    ? colors.selectedText 
                    : colors.unselectedText,
                  fontSize: 13,
                  fontWeight: '600',
                  letterSpacing: -0.2,
                }}>
                  {interest.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Education Details */}
        <View style={{ marginBottom: 40 }}>
          <Text style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: '700',
            marginBottom: 20,
            letterSpacing: -0.3,
          }}>
            Education Details
          </Text>

          {/* College */}
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
                value={userData?.college || ''}
                onChangeText={(text) => setUserData(prev => ({ ...prev, college: text }))}
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 17,
                  marginLeft: 16,
                  fontWeight: '500',
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Branch */}
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
                value={userData?.branch || ''}
                onChangeText={(text) => setUserData(prev => ({ ...prev, branch: text }))}
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 17,
                  marginLeft: 16,
                  fontWeight: '500',
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Graduation Year */}
          <View style={{ marginBottom: 24 }}>
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
                color: userData?.passout_year ? colors.text : colors.textMuted,
                fontSize: 17,
                marginLeft: 16,
                fontWeight: '500',
              }}>
                {userData?.passout_year || 'Select graduation year'}
              </Text>
              <AntDesign name="down" size={16} color={colors.textMuted} />
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
    </View>
  );
};

export default EditProfile;