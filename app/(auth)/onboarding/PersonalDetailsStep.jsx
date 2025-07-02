import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Dimensions 
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';

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

export default function PersonalDetailsStep({ nextStep, userData, updateUserData }) {
  const [fullName, setFullName] = useState(userData.fullName || '');
  const [username, setUsername] = useState(userData.username || '');
  const [bio, setBio] = useState(userData.bio || '');
  const [profileInitials, setProfileInitials] = useState(userData.profileInitials || '');
  const [selectedInterests, setSelectedInterests] = useState(userData.interests || []);

  // Auto-generate username and profile initials when full name changes
  useEffect(() => {
    if (fullName.trim()) {
      const words = fullName.trim().split(' ');
      const firstWord = words[0];
      setUsername(firstWord.toLowerCase());
      
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
          <Text style={{
            fontSize: 32,
            fontWeight: '900',
            color: colors.text,
            marginBottom: 12,
            textAlign: 'center',
            letterSpacing: -0.5,
          }}>
            Tell us about yourself
          </Text>
          <Text style={{
            fontSize: 17,
            color: colors.textMuted,
            textAlign: 'center',
            lineHeight: 26,
            fontWeight: '400',
          }}>
            Help us personalize your experience
          </Text>
        </View>

        {/* Full Name Input */}
        <View style={{ marginBottom: 28 }}>
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
          <Text style={{
            color: colors.textMuted,
            fontSize: 13,
            marginTop: 8,
            textAlign: 'right',
            fontWeight: '400',
          }}>
            {bio.length}/150 characters
          </Text>
        </View>

        {/* Generated Username & Profile Initials */}
        {username && (
          <View style={{
            backgroundColor: colors.cardBg,
            borderRadius: 20,
            padding: 24,
            marginBottom: 32,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{
              color: colors.textMuted,
              fontSize: 15,
              marginBottom: 16,
              fontWeight: '500',
            }}>
              Auto-generated for you:
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1, marginRight: 20 }}>
                <Text style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  marginBottom: 6,
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  Username
                </Text>
                <Text style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '700',
                  letterSpacing: -0.3,
                }}>
                  @{username}
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  marginBottom: 6,
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  Profile Avatar
                </Text>
                <View style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.background,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2.5,
                  borderColor: colors.accent,
                }}>
                  <Text style={{
                    color: colors.text,
                    fontSize: 20,
                    fontWeight: '800',
                    letterSpacing: -0.5,
                  }}>
                    {profileInitials}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Interests Selection */}
        <View style={{ marginBottom: 40 }}>
          <Text style={{
            color: colors.text,
            fontSize: 17,
            fontWeight: '600',
            marginBottom: 8,
            letterSpacing: -0.2,
          }}>
            What are you interested in?
          </Text>
          <Text style={{
            color: colors.textMuted,
            fontSize: 15,
            marginBottom: 20,
            fontWeight: '400',
          }}>
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
            opacity: fullName.trim() && selectedInterests.length > 0 ? 1 : 0.4,
          }}
          disabled={!fullName.trim() || selectedInterests.length === 0}
        >
          <Text style={{
            color: colors.purple,
            fontSize: 14,
            fontWeight: '600',
            letterSpacing: -0.1,
          }}>
            Continue to Education Details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 