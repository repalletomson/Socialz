import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { TextStyles } from '../../../constants/Fonts';
import { scaleSize, verticalScale } from '../../../utiles/common';
import { useAuthStore } from '../../../stores/useAuthStore';
import { supabase } from '../../../config/supabaseConfig';

const { width } = Dimensions.get('window');

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
  error: '#EF4444',
  // Updated interest selection colors with purple accents
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

// 🎯 What's Your Vibe? Updated Interests with Creative Flair
const interestOptions = [
  { id: 'music', label: 'Music', icon: '🎧' },
  { id: 'anime', label: 'Anime ', icon: '🌀' },
  { id: 'kdrama', label: 'K-Drama Lover', icon: 'K' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'movies', label: 'Movies', icon: '🎬' },
  { id: 'cricket', label: 'Cricket', icon: '🏏' },
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'gym', label: 'Fitness', icon: '🏋️' },
  { id: 'dance', label: 'Dance', icon: '✨' },
  { id: 'games', label: 'Pub G', icon: '🎮' },
  { id: 'sports', label: 'Sports', icon: '🏀' },
];

export default function PersonalDetailsStep({ nextStep, userData, updateUserData }) {
  const [fullName, setFullName] = useState(userData.fullName || '');
  const [username, setUsername] = useState(userData.username || '');
  const [bio, setBio] = useState(userData.bio || '');
  const [profileInitials, setProfileInitials] = useState(userData.profileInitials || '');
  const [selectedInterests, setSelectedInterests] = useState(userData.interests || []);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [error, setError] = useState('');

  // Generate unique username
  const generateUniqueUsername = async (baseUsername) => {
    let counter = 1;
    let uniqueUsername = baseUsername;
    
    while (counter <= 10) { // Try up to 10 variations
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', uniqueUsername.toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // Username is available
        return uniqueUsername;
      }
      
      // Username exists, try next variation
      uniqueUsername = `${baseUsername}${counter}`;
      counter++;
    }
    
    // If all variations are taken, add timestamp
    return `${baseUsername}${Date.now().toString().slice(-4)}`;
  };

  // Check username availability
  const checkUsernameAvailability = async (usernameToCheck) => {
    if (!usernameToCheck.trim()) return;
    
    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', usernameToCheck.toLowerCase())
        .single();

      if (error && error.code === 'PGRST116') {
        // No user found with this username - it's available
        setUsernameAvailable(true);
      } else if (data) {
        // Username already exists
        setUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Auto-generate username and profile initials when full name changes
  useEffect(() => {
    if (fullName.trim()) {
      const words = fullName.trim().split(' ');
      const firstWord = words[0];
      const generatedUsername = firstWord.toLowerCase();
      setUsername(generatedUsername);
      
      // Check username availability
      checkUsernameAvailability(generatedUsername);
      
      // Generate profile initials (first letter of first word + first letter of last word)
      if (words.length >= 2) {
        const initials = words[0].charAt(0).toUpperCase() + words[words.length - 1].charAt(0).toUpperCase();
        setProfileInitials(initials);
      } else {
        const initials = words[0].charAt(0).toUpperCase();
        setProfileInitials(initials);
      }
    }
  }, [fullName]);

  const toggleInterest = (interestId) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      if (selectedInterests.length >= 10) {
        Alert.alert('Maximum Reached', 'You can select up to 10 interests only.');
        return;
      }
      setSelectedInterests([...selectedInterests, interestId]);
    }
  };

  const handleNext = async () => {
    setError('');
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest.');
      return;
    }
  
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }
  
    if (!usernameAvailable) {
      Alert.alert('Username Unavailable', 'This username is already taken. Please try a different one.');
      return;
    }
  
    // Prepare data with interests and correct field names for Supabase
    const personalDetails = {
      ...userData,
      full_name: fullName.trim(), // Use snake_case for Supabase
      username: username.toLowerCase().trim(), // Ensure username is lowercase and trimmed
      bio: bio.trim() || null, // Handle empty bio as null
      profile_initials: profileInitials,
      interests: selectedInterests, // Explicitly include interests as an array
    };
  
    // Log data for debugging
    console.log('Personal Details to Update:', personalDetails);
  
    // Update user data
    updateUserData(personalDetails);
  
    // Optionally save to Supabase here if needed before next step.
    // const { user } = useAuthStore.getState();
    // if (user?.id) {
    //   const success = await useAuthStore.getState().updateUserProfile(personalDetails);
    //   if (!success) {
    //     Alert.alert('Error', 'Failed to save personal details. Please try again.');
    //     return;
    //   }
    // }
  
    
    nextStep();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ marginBottom: 40 }}>
          <Text style={[TextStyles.h1, { textAlign: 'left' }]}>Tell us about yourself</Text>
          <Text style={[TextStyles.body, { textAlign: 'left' }]}>Help us personalize your experience</Text>
        </View>

        {/* Full Name Input */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ ...TextStyles.body2, color: colors.text, marginBottom: 6, fontWeight: '600' }}>
            Full Name
          </Text>
          <View style={{
            backgroundColor: colors.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.inputBorder,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            height: 44,
          }}>
            <MaterialIcons name="person" size={18} color={colors.textMuted} />
            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 15,
                marginLeft: 10,
                fontWeight: '500',
                ...TextStyles.body2,
              }}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        </View>

        {/* Bio Input */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ ...TextStyles.body2, color: colors.text, marginBottom: 6, fontWeight: '600' }}>
            Bio
          </Text>
          <View style={{
            backgroundColor: colors.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.inputBorder,
            paddingHorizontal: 12,
            paddingVertical: 8,
            minHeight: 44,
          }}>
            <TextInput
              placeholder="Tell us something about yourself..."
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
              style={{
                color: colors.text,
                fontSize: 15,
                fontWeight: '500',
                textAlignVertical: 'top',
                ...TextStyles.body2,
              }}
              multiline
              numberOfLines={2}
              maxLength={150}
            />
          </View>
          <Text style={{ ...TextStyles.caption, color: colors.textMuted, marginTop: 2 }}>{bio.length}/150</Text>
        </View>

        {/* Username Input */}
        <View style={{ marginBottom: 18 }}>
          <Text style={{ ...TextStyles.body2, color: colors.text, marginBottom: 6, fontWeight: '600' }}>
            Username
          </Text>
          <View style={{
            backgroundColor: colors.inputBg,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: usernameAvailable ? colors.inputBorder : colors.error,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            height: 44,
          }}>
            <MaterialIcons name="alternate-email" size={18} color={colors.textMuted} />
            <TextInput
              placeholder="Enter username"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={(text) => {
                setUsername(text.toLowerCase());
                if (text.trim()) {
                  checkUsernameAvailability(text.toLowerCase());
                }
              }}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 15,
                marginLeft: 10,
                fontWeight: '500',
                ...TextStyles.body2,
              }}
              autoCapitalize="none"
              returnKeyType="next"
            />
            {checkingUsername ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : username && (
              <MaterialIcons 
                name={usernameAvailable ? "check-circle" : "error"} 
                size={18} 
                color={usernameAvailable ? colors.success : colors.error} 
              />
            )}
          </View>
          {username && !checkingUsername && (
            <Text style={{ color: usernameAvailable ? colors.success : colors.error, fontSize: 12, marginTop: 2, ...TextStyles.caption }}>
              {usernameAvailable ? '✓ Username available' : '✗ Username already taken'}
            </Text>
          )}
        </View>

        {/* Profile Initials Display */}
        {profileInitials && (
          <View style={{
            backgroundColor: colors.cardBg,
            borderRadius: 20,
            padding: 24,
            marginBottom: 32,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={TextStyles.label}>
              Your Profile Avatar:
            </Text>
            
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.background,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: colors.accent,
              }}>
                <Text style={{
                  fontSize: 32,
                  fontWeight: 'bold',
                  color: colors.text,
                }}>
                  {profileInitials}
                </Text>
              </View>
              <Text style={{
                color: colors.textSecondary,
                fontSize: 14,
                marginTop: 8,
                textAlign: 'center',
              }}>
                This will be your profile picture
              </Text>
            </View>
          </View>
        )}

        {/* Interests Selection */}
        <View style={{ marginBottom: 40 }}>
          <Text style={[TextStyles.label, { textAlign: 'left' }]}>What are you interested in?</Text>
          <Text style={[TextStyles.body, { textAlign: 'left' }]}>Select up to 10 interests ({selectedInterests.length}/10 selected)</Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -2,
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
          }}>
            {interestOptions.map((interest) => (
              <TouchableOpacity
                key={interest.id}
                onPress={() => toggleInterest(interest.id)}
                style={{
                  backgroundColor: selectedInterests.includes(interest.id) 
                    ? colors.selectedBg 
                    : colors.unselectedBg,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 18,
                  margin: 4,
                  borderWidth: 1.5,
                  borderColor: selectedInterests.includes(interest.id) 
                    ? colors.selectedBorder 
                    : colors.unselectedBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 32,
                  shadowColor: selectedInterests.includes(interest.id) ? colors.selectedBorder : 'transparent',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: selectedInterests.includes(interest.id) ? 0.15 : 0,
                  shadowRadius: 4,
                  elevation: selectedInterests.includes(interest.id) ? 2 : 0,
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
      </ScrollView>

      {/* Bottom Button */}
      <View style={{
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
      }}>
        <TouchableOpacity
          onPress={handleNext}
          style={{
            borderWidth: 1,
            borderColor: colors.purple,
            borderRadius: 8,
            paddingVertical: 10,
            paddingHorizontal: 20,
            alignItems: 'center',
            alignSelf: 'center',
            opacity: fullName.trim() && usernameAvailable && selectedInterests.length > 0 ? 1 : 0.4,
          }}
          disabled={!fullName.trim() || !usernameAvailable || selectedInterests.length === 0}
        >
          <Text style={TextStyles.button}>
            Continue to Education Details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 