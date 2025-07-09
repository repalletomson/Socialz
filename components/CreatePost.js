import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  FlatList,
  StyleSheet,
  Switch,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../stores/useAuthStore';
import { createPost } from '../(apis)/post'; // Using Supabase post API
import { incrementUserStreak, getUserStreak } from '../(apis)/streaks';
import { supabase } from '../config/supabaseConfig'; // Fixed import path

const CreatePostScreen = ({ visible, onClose, onPostCreated }) => {
  const { user } = useAuthStore();

  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [streakTimer, setStreakTimer] = useState('');
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [streakIncreased, setStreakIncreased] = useState(false);
  const [streakActive, setStreakActive] = useState(false);
  const [hotPosts, setHotPosts] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [userStreak, setUserStreak] = useState(null);


  useEffect(() => {
    if (visible) {
      loadStreak();
      fetchHotPosts();
    }
  }, [visible]);

  const loadStreak = async () => {
    try {
      const streakData = await getUserStreak(user.uid);
      setUserStreak(streakData);
      setStreak(streakData.currentStreak || 0);
      setStreakActive(streakData.streakActive || false);

      if (!streakData.streakActive) {
        updateStreakTimer();
      }
    } catch (error) {
      // Silently handle error
    }
  };

  const fetchHotPosts = async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      // Use Supabase instead of Firebase
      const { data: hotPostsData, error } = await supabase
        .from('posts')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .lte('created_at', yesterdayEnd.toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        return;
      }

      // Filter posts that have images
      const postsWithImages = hotPostsData?.filter((post) => post.images && post.images.length > 0) || [];
      setHotPosts(postsWithImages);
    } catch (error) {
      // Silently handle error
    }
  };

  const updateStreakTimer = () => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const timeRemaining = endOfDay - now;
    const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);

    setStreakTimer(`${hours}h ${minutes}m left`);
  };

  useEffect(() => {
    if (!visible || streakActive) return;
    updateStreakTimer();
    const interval = setInterval(updateStreakTimer, 60000);
    return () => clearInterval(interval);
  }, [visible, streakActive]);

  const pickImage = async () => {
    try {
      // Request permission before accessing images
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library access is required to select images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 8 - selectedImages.length,
      });
      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setSelectedImages([...selectedImages, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        setSelectedImages([...selectedImages, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const removeImage = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  const renderImagePreviews = () => {
    if (selectedImages.length === 0) return null;

    return (
      <View style={styles.imagePreviewContainer} className='mt-4'>
        <FlatList
          horizontal
          data={selectedImages}
          renderItem={({ item, index }) => (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: item }} style={styles.imagePreview} />
              <TouchableOpacity onPress={() => removeImage(index)} style={styles.removeImageButton}>
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };
  // No images found in post
  const renderHotPosts = () => {
    if (hotPosts.length === 0) return null;

    return (
      <View style={styles.hotPostsContainer}>
        <Text style={styles.hotPostsTitle}>Hot Posts From Yesterday</Text>
        <FlatList
          horizontal
          data={hotPosts}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.hotPostItem}>
              <Image source={{ uri: item.images[0] }} style={styles.hotPostImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.hotPostOverlay}>
                <Text style={styles.hotPostUserName}>{item.user_name || 'Anonymous'}</Text>
                <View style={styles.hotPostStats}>
                  <Ionicons name="heart" size={12} color="#FF6B6B" />
                  <Text style={styles.hotPostStatText}>{item.like_count || 0}</Text>
                  <Ionicons name="chatbubble" size={12} color="#3B82F6" style={styles.hotPostStatIcon} />
                  <Text style={styles.hotPostStatText}>{item.comment_count || 0}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called');
    if (!content.trim() && selectedImages.length === 0) {
      Alert.alert('Error', 'Please add some content or images to your post');
      return;
    }

    setIsLoading(true);
    console.log('Creating post with data:', { content, selectedImages, isAnonymous, user });

    try {
      const postData = {
        content: content.trim(),
        isAnonymous: isAnonymous
      };
      // Use Supabase createPost function - PASS IMAGES CORRECTLY
      const post = await createPost(postData, selectedImages.length > 0 ? selectedImages : null, user);
      console.log('Post created:', post);

      // Only increment streak if user hasn't posted today
      if (!streakActive) {
        const updatedStreak = await incrementUserStreak(user.uid);
        setStreak(updatedStreak.currentStreak);
        setStreakActive(true);

        if (updatedStreak.streakIncreased) {
          setStreakIncreased(true);
          setShowStreakAnimation(true);
          setTimeout(() => setShowStreakAnimation(false), 3000);
        }
      }
// net
      if (onPostCreated) {
        const postCallbackData = {
          id: post.id,
          content: content.trim(),
          mediaUrls: post.images || [],
          createdAt: new Date(),
          userId: user.uid,
          profile_initials: user.profile_initials,  
          userName: isAnonymous ? 'Anonymous' : (user.fullName || user.full_name || 'Anonymous'),
          userAvatar: isAnonymous ? null : (user.profileImage || user.profile_image || null),
          isAnonymous: isAnonymous
        };

        // Pass streak data if it was updated
        if (!streakActive && streakIncreased) {
          onPostCreated({
            ...postCallbackData,
            streakData: {
              streakIncreased: true,
              currentStreak: streak
            }
          });
        } else {
          onPostCreated(postCallbackData);
        }
      }

      setContent('');
      setSelectedImages([]);
      setIsAnonymous(false);
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Test function to invoke the edge function
  // const testPushNotification = async () => {
  //   try {
  //     console.log('Invoking send-push-notification edge function...');
  //     const { data, error } = await supabase.functions.invoke('send-push-notification', {
  //       body: { name: 'Functions' },
  //     });
  //     console.log('Edge function response:', { data, error });
  //     Alert.alert('Edge Function', error ? `Error: ${error.message}` : `Success: ${JSON.stringify(data)}`);
  //   } catch (err) {
  //     console.error('Error invoking edge function:', err);
  //     Alert.alert('Edge Function', `Error: ${err.message}`);
  //   }
  // };

  if (!visible) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Create Post</Text>
            
            <TouchableOpacity 
              onPress={handleSubmit}
              disabled={isLoading || (!content.trim() && selectedImages.length === 0)}
              style={[
                styles.postButton,
                (!content.trim() && selectedImages.length === 0) && styles.postButtonDisabled
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Streak Info (Compact) */}
          {userStreak && (
            <View style={[styles.streakBanner, streakActive && styles.streakBannerActive]}>
              <Ionicons name="flame" size={20} color={streakActive ? "#F97316" : "#8B5CF6"} />
              <Text style={[styles.streakText, streakActive && styles.streakTextActive]}>
                {streak} day streak {streakActive ? "✓" : `• ${streakTimer} left`}
              </Text>
            </View>
          )}

          {/* Content */}
          <ScrollView style={styles.contentContainer} className=''>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity onPress={pickImage} style={{ marginRight: 16, backgroundColor: '#1A1A1A', borderRadius: 22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="image-outline" size={24} color="#8B5CF6" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsAnonymous(!isAnonymous)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isAnonymous ? '#8B5CF6' : '#1A1A1A',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderWidth: 1.5,
                  borderColor: isAnonymous ? '#8B5CF6' : '#333',
                }}
              >
                <Ionicons name={isAnonymous ? 'eye-off' : 'eye'} size={20} color={isAnonymous ? '#fff' : '#8B5CF6'} />
                <Text style={{ color: isAnonymous ? '#fff' : '#8B5CF6', marginLeft: 8, fontWeight: '600' }}>
                  {isAnonymous ? 'Anonymous' : 'Post as Me'}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.contentInput}
              className='mt-4 pl-2 '
              placeholder="What's on your mind?"
              placeholderTextColor="#6B7280"
              multiline
              value={content}
              onChangeText={setContent}
            />
            {renderImagePreviews()}
          </ScrollView>

            {renderHotPosts()}
          {/* Footer */}
              </KeyboardAvoidingView>
          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={async () => {
                try {
                  // Test storage access
                  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
                  
                  // Test file list in user-uploads bucket
                  const { data: files, error: filesError } = await supabase.storage
                    .from('user-uploads')
                    .list('posts', { limit: 5 });
                  
                  Alert.alert('Storage Test', `Buckets: ${buckets?.length || 0}, Files: ${files?.length || 0}`);
                } catch (error) {
                  Alert.alert('Storage Test Failed', error.message);
                }
              }}
              style={{
                backgroundColor: '#10b981',
                padding: 8,
                borderRadius: 4,
                marginHorizontal: 4
              }}
            >
              <Text style={{ color: 'white', fontSize: 12 }}>Storage</Text>
            </TouchableOpacity>
          </View>

          {/* Hot Posts */}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  postButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#374151',
  },
  postButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  streakBannerActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  streakText: {
    color: '#8B5CF6',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  streakTextActive: {
    color: '#F97316',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  titleInput: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  contentInput: {
    color: 'white',
    fontSize: 16,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    marginBottom: 16,
  },
  imagePreviewWrapper: {
    marginRight: 8,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#3f3f46',
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousText: {
    color: 'white',
    marginRight: 8,
  },
  hotPostsContainer: {
    padding: 16,
  },
  hotPostsTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  hotPostItem: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  hotPostImage: {
    width: 100,
    height: 100,
  },
  hotPostOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
  },
  hotPostUserName: {
    color: 'white',
    fontSize: 12,
  },
  hotPostStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hotPostStatText: {
    color: 'white',
    fontSize: 10,
    marginLeft: 4,
  },
  hotPostStatIcon: {
    marginLeft: 8,
  },
});

export default CreatePostScreen;