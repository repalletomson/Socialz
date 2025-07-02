import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/authContext';
import { supabase } from '../../config/supabaseConfig';
import { decode } from 'base64-arraybuffer';
import networkErrorHandler from '../../utiles/networkErrorHandler';
import { updateStreakForPost } from '../../(apis)/streaks';
import StreakCelebrationModal from '../../components/StreakCelebrationModal';
import { Fonts, TextStyles } from '../../constants/Fonts';

const COLORS = {
  background: '#000000',
  text: '#FFFFFF',
  accent: '#8B5CF6',
  textSecondary: '#E5E5E5',
  textMuted: '#A1A1AA',
  inputBg: '#1A1A1A',
  border: 'rgba(255, 255, 255, 0.1)',
};

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({});
  const { user } = useAuth();
  const router = useRouter();
  const isMounted = useRef(true);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const newImage = result.assets[0];
        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (base64Image) => {
    try {
      setIsPosting(true);
      const fileName = `${user.uid}-${Date.now()}.jpg`;
      const filePath = `public/${fileName}`;
      const contentType = 'image/jpeg';

      const { data, error } = await supabase.storage
        .from('posts')
        .upload(filePath, decode(base64Image), {
          contentType,
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      return null;
    } finally {
      setIsPosting(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && selectedImages.length === 0) {
      Alert.alert('Error', 'Please add some content or images to your post.');
      return;
    }

    try {
      setIsPosting(true);
      let imageUrls = [];
      
      // Upload images if any
      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(image => uploadImage(image.base64));
        imageUrls = await Promise.all(uploadPromises);
      }

      // Create post
      const { data: post, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.uid,
            content: content.trim(),
            images: imageUrls,
            user_name: user.displayName || user.email,
            user_avatar: user.photoURL,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Update streak for post creation
      try {
        console.log('🔥 Updating streak for new post...');
        const streakResult = await updateStreakForPost(user.uid);
        
        if (streakResult.streakIncreased) {
          console.log(`🎉 Streak increased to ${streakResult.current_streak}!`);
          
          // Show beautiful celebration modal
          setCelebrationData({
            streakCount: streakResult.current_streak,
            previousStreak: streakResult.previousStreak,
            isFirstStreak: streakResult.current_streak === 1 && streakResult.previousStreak === 0
          });
          setShowCelebration(true);
          
        } else if (streakResult.alreadyCompleted) {
          console.log('✅ Streak already completed for today');
        }
      } catch (streakError) {
        console.error('Error updating streak:', streakError);
        // Don't block the post creation if streak update fails
      }

      if (isMounted.current) {
        // Clear form
        setContent('');
        setSelectedImages([]);
        
        // Navigate back
        router.back();
      }
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={{
          fontSize: 18,
          fontFamily: Fonts.GeneralSans.Semibold,
          color: COLORS.text,
        }}>
          Create Post
        </Text>

        <TouchableOpacity
          onPress={handlePost}
          disabled={isPosting || (!content.trim() && selectedImages.length === 0)}
          style={{
            backgroundColor: COLORS.accent,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            opacity: isPosting || (!content.trim() && selectedImages.length === 0) ? 0.5 : 1,
          }}
        >
          {isPosting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontFamily: Fonts.GeneralSans.Semibold,
            }}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* User Info */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <Image
            source={{ uri: user?.photoURL || 'https://via.placeholder.com/40' }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              marginRight: 12,
            }}
          />
          <Text style={{
            fontSize: 16,
            fontFamily: Fonts.GeneralSans.Semibold,
            color: COLORS.text,
          }}>
            {user?.displayName || user?.email || 'User'}
          </Text>
        </View>

        {/* Post Input */}
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="What's happening?"
          placeholderTextColor={COLORS.textMuted}
          multiline
          style={{
            color: COLORS.text,
            fontSize: 16,
            fontFamily: Fonts.GeneralSans.Regular,
            lineHeight: 24,
            minHeight: 120,
            textAlignVertical: 'top',
          }}
          autoFocus
        />

        {/* Selected Images */}
        {selectedImages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 16 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {selectedImages.map((image, index) => (
              <View key={index} style={{ position: 'relative' }}>
                <Image
                  source={{ uri: image.uri }}
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 8,
                  }}
                />
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 12,
                    width: 24,
                    height: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={{
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
      }}>
        <TouchableOpacity
          onPress={pickImage}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: COLORS.inputBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="image-outline" size={24} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Streak Celebration Modal */}
      <StreakCelebrationModal
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
        streakCount={celebrationData.streakCount}
        previousStreak={celebrationData.previousStreak}
        isFirstStreak={celebrationData.isFirstStreak}
      />
    </KeyboardAvoidingView>
  );
} 