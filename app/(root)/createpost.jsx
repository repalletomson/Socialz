import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  Switch,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../config/supabaseConfig';
import { decode } from 'base64-arraybuffer';
import networkErrorHandler from '../../utiles/networkErrorHandler';
import { updateStreakForPost } from '../../(apis)/streaks';
import StreakCelebrationModal from '../../components/StreakCelebrationModal';
import { Fonts, TextStyles } from '../../constants/Fonts';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../stores/useAuthStore';

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
  const { user } = useAuthStore();
  const router = useRouter();
  const isMounted = useRef(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [hotPosts, setHotPosts] = useState([]);
  const [streakActive, setStreakActive] = useState(false);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Fetch hot posts and streak info on mount
  React.useEffect(() => {
    fetchHotPosts();
    loadStreak();
  }, []);

  // Auto-close celebration modal after 4 seconds
  React.useEffect(() => {
    if (showCelebration) {
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showCelebration]);

  const fetchHotPosts = async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      const { data: hotPostsData, error } = await supabase
        .from('posts')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', yesterdayEnd.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error) {
        const postsWithImages = hotPostsData?.filter((post) => post.images && post.images.length > 0) || [];
        if (postsWithImages.length > 0) {
          postsWithImages.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
          setHotPosts([postsWithImages[0]]);
        } else {
          setHotPosts([]);
        }
      }
    } catch {}
  };

  const loadStreak = async () => {
    try {
      // Fetch streak info if needed for UI
    } catch {}
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow image access to post images. Go to your device settings and enable photo permissions for this app.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
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
      const fileName = `${user.id}-${Date.now()}.jpg`;
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
      if (selectedImages.length > 0) {
        const uploadPromises = selectedImages.map(image => uploadImage(image.base64));
        imageUrls = await Promise.all(uploadPromises);
      }
      const { data: post, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            content: content.trim(),
            images: imageUrls,
            user_name: isAnonymous ? 'Anonymous' : (user.username || user.display_name || 'User'),
            user_avatar: isAnonymous ? null : user.photoURL,
            is_anonymous: isAnonymous, // <-- Add this line
          },
        ])
        .select()
        .single();
      if (error) throw error;

      try {
        const streakResult = await updateStreakForPost(user.id);
        if (streakResult.streakIncreased) {
          setCelebrationData({
            streakCount: streakResult.current_streak,
            previousStreak: streakResult.previousStreak,
            isFirstStreak: streakResult.current_streak === 1 && streakResult.previousStreak === 0
          });
          setShowCelebration(true);
        }
      } catch (streakError) {
        console.error('Error updating streak:', streakError);
      }

      if (isMounted.current) {
        setContent('');
        setSelectedImages([]);
        router.back();
      }
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
    } finally {
      setIsPosting(false);
    }
  };

  if (!user?.id) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>Loading...</Text></View>;

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

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* <TouchableOpacity
            onPress={() => { setContent(''); setSelectedImages([]); fetchHotPosts(); }}
            style={{ marginRight: 8 }}
          >
            <Ionicons name="reload" size={22} color={COLORS.accent} />
          </TouchableOpacity> */}
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
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* User Info
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <Image
            source={{ uri: user?.photoURL || 'https://via.placeholder.com/32' }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              marginRight: 12,
            }}
          />
          {/* <Text style={{
            fontSize: 16,
            fontFamily: Fonts.GeneralSans.Bold,
            color: COLORS.textSecondary,
            letterSpacing: 0.5,
          }}>
            {user?.user_name || user?.display_name || 'User'}
          </Text> */}
        {/* </View> */}

        {/* Post Input */}
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="What's happening?"
          placeholderTextColor={COLORS.textMuted}
          multiline
          style={{
            color: COLORS.text,
            fontSize: 16, // Decreased from 24
            fontFamily: Fonts.GeneralSans.Regular,
            lineHeight: 22,
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
                    width: 80,
                    height: 80,
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
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Hot Posts Section */}
        {hotPosts.length > 0 && (
          <View style={{ padding: 16 }}>
            <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Top Post From Yesterday</Text>
            <TouchableOpacity style={{ borderRadius: 8, overflow: 'hidden' }}>
              <Image source={{ uri: hotPosts[0].images[0] }} style={{ width: 100, height: 100, borderRadius: 8 }} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 }}>
                <Text style={{ color: COLORS.text, fontSize: 12 }}>{hotPosts[0].user_name || 'Anonymous'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="heart" size={12} color="#FF6B6B" />
                  <Text style={{ color: COLORS.text, fontSize: 10, marginLeft: 4 }}>{hotPosts[0].like_count || 0}</Text>
                  <Ionicons name="chatbubble" size={12} color="#3B82F6" style={{ marginLeft: 8 }} />
                  <Text style={{ color: COLORS.text, fontSize: 10, marginLeft: 4 }}>{hotPosts[0].comment_count || 0}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Bar with Image Picker and Anonymous Toggle */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
      }}>
        <TouchableOpacity
          onPress={pickImage}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.inputBg,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
          }}
        >
          <Ionicons name="image-outline" size={22} color={COLORS.accent} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            color: COLORS.textSecondary,
            fontSize: 14,
            fontFamily: Fonts.GeneralSans.Medium,
            marginRight: 8,
            letterSpacing: 0.5,
          }}>
            Anonymous
          </Text>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: '#3f3f46', true: '#8b5cf6' }}
            thumbColor={isAnonymous ? '#8b5cf6' : '#f4f3f4'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </View>
      </View>

      {/* Streak Celebration Modal */}
      <StreakCelebrationModal
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
        streakCount={celebrationData.streakCount}
        previousStreak={celebrationData.previousStreak}
        isFirstStreak={celebrationData.isFirstStreak}
        showGoHome={false}
      />
    </KeyboardAvoidingView>
  );
}