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

export default function PersonalDetailsStep({ nextStep, userData, updateUserData }) {
  const [fullName, setFullName] = useState(userData.fullName || '');
  const [username, setUsername] = useState(userData.username || '');
  const [bio, setBio] = useState(userData.bio || '');
  const [profileInitials, setProfileInitials] = useState(userData.profileInitials || '');
  const [selectedInterests, setSelectedInterests] = useState(userData.interests || []);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);

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

  const handleNext = () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    if (!usernameAvailable) {
      Alert.alert('Username Unavailable', 'This username is already taken. Please try a different one.');
      return;
    }

    if (selectedInterests.length === 0) {
      Alert.alert('Select Interests', 'Please select at least one interest to continue.');
      return;
    }

    // Update user data
    updateUserData({
      fullName: fullName.trim(),
      username: username.toLowerCase(),
      bio: bio.trim(),
      profileInitials,
      interests: selectedInterests,
    });

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
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={TextStyles.h1}>
            Tell us about yourself
          </Text>
          <Text style={TextStyles.body}>
            Help us personalize your experience
          </Text>
        </View>

        {/* Full Name Input */}
        <View style={{ marginBottom: 28 }}>
          <Text style={TextStyles.label}>
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
              value={fullName}
              onChangeText={setFullName}
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

        {/* Bio Input */}
        <View style={{ marginBottom: 28 }}>
          <Text style={TextStyles.label}>
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
              placeholder="Tell us something about yourself..."
              placeholderTextColor={colors.textMuted}
              value={bio}
              onChangeText={setBio}
              style={{
                color: colors.text,
                fontSize: 17,
                fontWeight: '500',
                textAlignVertical: 'top',
              }}
              multiline
              numberOfLines={4}
              maxLength={150}
            />
          </View>
          <Text style={TextStyles.body}>
            {bio.length}/150 characters
          </Text>
        </View>

        {/* Username Input */}
        <View style={{ marginBottom: 28 }}>
          <Text style={TextStyles.label}>
            Username
          </Text>
          <View style={{
            backgroundColor: colors.inputBg,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: usernameAvailable ? colors.inputBorder : colors.error,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            height: 60,
          }}>
            <MaterialIcons name="alternate-email" size={22} color={colors.textMuted} />
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
                fontSize: 17,
                marginLeft: 16,
                fontWeight: '500',
              }}
              autoCapitalize="none"
              returnKeyType="next"
            />
            {checkingUsername ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : username && (
              <MaterialIcons 
                name={usernameAvailable ? "check-circle" : "error"} 
                size={22} 
                color={usernameAvailable ? colors.success : colors.error} 
              />
            )}
          </View>
          {username && !checkingUsername && (
            <View style={{ marginTop: 8 }}>
              <Text style={{
                color: usernameAvailable ? colors.success : colors.error,
                fontSize: 14,
                fontFamily: 'System',
              }}>
                {usernameAvailable ? '✓ Username available' : '✗ Username already taken'}
              </Text>
              {!usernameAvailable && (
                <TouchableOpacity
                  onPress={async () => {
                    const uniqueUsername = await generateUniqueUsername(username);
                    setUsername(uniqueUsername);
                    setUsernameAvailable(true);
                  }}
                  style={{
                    marginTop: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: colors.accent,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={{
                    color: colors.text,
                    fontSize: 12,
                    fontWeight: '600',
                  }}>
                    Generate Unique Username
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
          <Text style={TextStyles.label}>
            What are you interested in?
          </Text>
          <Text style={TextStyles.body}>
            Select up to 10 interests ({selectedInterests.length}/10 selected)
          </Text>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -6,
          }}>
            {interestOptions.map((interest) => (
              <TouchableOpacity
                key={interest.id}
                onPress={() => toggleInterest(interest.id)}
                style={{
                  backgroundColor: selectedInterests.includes(interest.id) 
                    ? colors.selectedBg 
                    : colors.unselectedBg,
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderRadius: 28,
                  margin: 6,
                  borderWidth: 2,
                  borderColor: selectedInterests.includes(interest.id) 
                    ? colors.selectedBorder 
                    : colors.unselectedBorder,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 48,
                  // Enhanced shadows for selected items
                  shadowColor: selectedInterests.includes(interest.id) ? colors.selectedBorder : 'transparent',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: selectedInterests.includes(interest.id) ? 0.3 : 0,
                  shadowRadius: 12,
                  elevation: selectedInterests.includes(interest.id) ? 6 : 0,
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>
                  {interest.icon}
                </Text>
                <Text style={{
                  color: selectedInterests.includes(interest.id) 
                    ? colors.selectedText 
                    : colors.unselectedText,
                  fontSize: 15,
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