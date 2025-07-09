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
  Switch,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/useAuthStore';
import { supabase } from '../../config/supabaseConfig';
import { decode } from 'base64-arraybuffer';
import networkErrorHandler from '../../utiles/networkErrorHandler';
import { updateStreakForPost } from '../../(apis)/streaks';
import StreakCelebrationModal from '../../components/StreakCelebrationModal';
import { Fonts, TextStyles } from '../../constants/Fonts';
import { LinearGradient } from 'expo-linear-gradient';

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
          // Sort by like_count descending, fallback to 0 if undefined
          postsWithImages.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
          setHotPosts([postsWithImages[0]]); // Only keep the top post
        } else {
          setHotPosts([]);
        }
      }
    } catch {}
  };

  const loadStreak = async () => {
    try {
      // Fetch streak info if needed for UI
      // setStreakActive(...) if user already posted today
    } catch {}
  };

  const pickImage = async () => {
    // Request permission before opening image picker
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow image access to post images. Go to your device settings and enable photo permissions for this app.',
        [
          { text: 'OK', style: 'default' }
        ]
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
            user_name: user.displayName || user.email,
            user_avatar: user.photoURL,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      // Update streak for post creation using new logic
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
          <TouchableOpacity
            onPress={() => { setContent(''); setSelectedImages([]); fetchHotPosts(); }}
            style={{ marginRight: 8 }}
          >
            <Ionicons name="reload" size={22} color={COLORS.accent} />
          </TouchableOpacity>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
            <Text style={{ color: COLORS.text, marginRight: 8 }}>Post Anonymously</Text>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: '#3f3f46', true: '#8b5cf6' }}
              thumbColor={isAnonymous ? '#8b5cf6' : '#f4f3f4'}
            />
          </View>
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

        {/* Move image icon above keyboard, not in bottom bar */}
        <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={pickImage}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.inputBg, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="image-outline" size={24} color={COLORS.accent} />
          </TouchableOpacity>
        </View>

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

      {/* Streak Celebration Modal */}
      <StreakCelebrationModal
        visible={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          if (celebrationData.isFirstStreak) {
            router.replace('/(root)/(tabs)/home');
          }
        }}
        streakCount={celebrationData.streakCount}
        previousStreak={celebrationData.previousStreak}
        isFirstStreak={celebrationData.isFirstStreak}
        showGoHome={celebrationData.isFirstStreak}
      />
    </KeyboardAvoidingView>
  );
} 