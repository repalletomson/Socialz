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
            user_name: isAnonymous ? 'Anonymous' : (user.user_name || user.display_name || 'User'),
            user_avatar: isAnonymous ? null : user.photoURL,
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
            fontSize: 24,
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
// import React, { useState, useCallback, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   Alert,
//   Switch,
//   FlatList,
//   StyleSheet,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { Ionicons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker';
// import { supabase } from '../../config/supabaseConfig';
// import { decode } from 'base64-arraybuffer';
// import networkErrorHandler from '../../utiles/networkErrorHandler';
// import { updateStreakForPost } from '../../(apis)/streaks';
// import StreakCelebrationModal from '../../components/StreakCelebrationModal';
// import { Fonts, TextStyles } from '../../constants/Fonts';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useAuthStore } from '../../stores/useAuthStore';

// const COLORS = {
//   background: '#000000',
//   text: '#FFFFFF',
//   accent: '#8B5CF6',
//   textSecondary: '#E5E5E5',
//   textMuted: '#A1A1AA',
//   inputBg: '#1A1A1A',
//   border: 'rgba(255, 255, 255, 0.1)',
// };

// export default function CreatePost() {
//   const [content, setContent] = useState('');
//   const [selectedImages, setSelectedImages] = useState([]);
//   const [isPosting, setIsPosting] = useState(false);
//   const [showCelebration, setShowCelebration] = useState(false);
//   const [celebrationData, setCelebrationData] = useState({});
//   const { user } = useAuthStore();
//   const router = useRouter();
//   const isMounted = useRef(true);
//   const [isAnonymous, setIsAnonymous] = useState(false);
//   const [hotPosts, setHotPosts] = useState([]);
//   const [streakActive, setStreakActive] = useState(false);

//   // Cleanup on unmount
//   React.useEffect(() => {
//     return () => {
//       isMounted.current = false;
//     };
//   }, []);

//   // Fetch hot posts and streak info on mount
//   React.useEffect(() => {
//     fetchHotPosts();
//     loadStreak();
//   }, []);

//   const fetchHotPosts = async () => {
//     try {
//       const yesterday = new Date();
//       yesterday.setDate(yesterday.getDate() - 1);
//       yesterday.setHours(0, 0, 0, 0);
//       const yesterdayEnd = new Date(yesterday);
//       yesterdayEnd.setHours(23, 59, 59, 999);
//       const { data: hotPostsData, error } = await supabase
//         .from('posts')
//         .select('*')
//         .gte('created_at', yesterday.toISOString())
//         .lte('created_at', yesterdayEnd.toISOString())
//         .order('created_at', { ascending: false })
//         .limit(3);
//       if (!error) {
//         const postsWithImages = hotPostsData?.filter((post) => post.images && post.images.length > 0) || [];
//         if (postsWithImages.length > 0) {
//           // Sort by like_count descending, fallback to 0 if undefined
//           postsWithImages.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
//           setHotPosts([postsWithImages[0]]); // Only keep the top post
//         } else {
//           setHotPosts([]);
//         }
//       }
//     } catch {}
//   };

//   const loadStreak = async () => {
//     try {
//       // Fetch streak info if needed for UI
//       // setStreakActive(...) if user already posted today
//     } catch {}
//   };

//   const pickImage = async () => {
//     // Request permission before opening image picker
//     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (status !== 'granted') {
//       Alert.alert(
//         'Permission Required',
//         'Please allow image access to post images. Go to your device settings and enable photo permissions for this app.',
//         [
//           { text: 'OK', style: 'default' }
//         ]
//       );
//       return;
//     }
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         mediaTypes: ['images'],
//         quality: 0.6,
//         base64: true,
//       });
//       if (!result.canceled && result.assets?.[0]) {
//         const newImage = result.assets[0];
//         setSelectedImages(prev => [...prev, newImage]);
//       }
//     } catch (error) {
//       console.error('Error picking image:', error);
//       Alert.alert('Error', 'Failed to pick image. Please try again.');
//     }
//   };

//   const removeImage = (index) => {
//     setSelectedImages(prev => prev.filter((_, i) => i !== index));
//   };

//   const uploadImage = async (base64Image) => {
//     try {
//       setIsPosting(true);
//       const fileName = `${user.id}-${Date.now()}.jpg`;
//       const filePath = `public/${fileName}`;
//       const contentType = 'image/jpeg';

//       const { data, error } = await supabase.storage
//         .from('posts')
//         .upload(filePath, decode(base64Image), {
//           contentType,
//           upsert: true,
//         });

//       if (error) throw error;

//       const { data: { publicUrl } } = supabase.storage
//         .from('posts')
//         .getPublicUrl(filePath);

//       return publicUrl;
//     } catch (error) {
//       networkErrorHandler.showErrorToUser(error);
//       return null;
//     } finally {
//       setIsPosting(false);
//     }
//   };

//   const handlePost = async () => {
//     if (!content.trim() && selectedImages.length === 0) {
//       Alert.alert('Error', 'Please add some content or images to your post.');
//       return;
//     }
//     try {
//       setIsPosting(true);
//       let imageUrls = [];
//       if (selectedImages.length > 0) {
//         const uploadPromises = selectedImages.map(image => uploadImage(image.base64));
//         imageUrls = await Promise.all(uploadPromises);
//       }
//       const { data: post, error } = await supabase
//         .from('posts')
//         .insert([
//           {
//         user_id: user.id,
//         content: content.trim(),
//         images: imageUrls,
//             user_name: user.user_name || user.email,
//             user_avatar: user.photoURL,
//           },
//         ])
//         .select()
//         .single();
//       if (error) throw error;
//       // Update streak for post creation using new logic
//       try {
//         const streakResult = await updateStreakForPost(user.id);
//         if (streakResult.streakIncreased) {
//           setCelebrationData({
//             streakCount: streakResult.current_streak,
//             previousStreak: streakResult.previousStreak,
//             isFirstStreak: streakResult.current_streak === 1 && streakResult.previousStreak === 0
//           });
//           setShowCelebration(true);
//         }
//       } catch (streakError) {
//         console.error('Error updating streak:', streakError);
//       }
//       if (isMounted.current) {
//         setContent('');
//         setSelectedImages([]);
//         router.back();
//       }
//     } catch (error) {
//       networkErrorHandler.showErrorToUser(error);
//     } finally {
//       setIsPosting(false);
//     }
//   };

//   if (!user?.id) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>Loading...</Text></View>;

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={{ flex: 1, backgroundColor: COLORS.background }}
//     >
//       {/* Header */}
//       <View style={{
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 16,
//         paddingTop: Platform.OS === 'ios' ? 60 : 20,
//         paddingBottom: 16,
//         borderBottomWidth: 1,
//         borderBottomColor: COLORS.border,
//       }}>
//         <TouchableOpacity
//           onPress={() => router.back()}
//           style={{
//             width: 40,
//             height: 40,
//             borderRadius: 20,
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//         >
//           <Ionicons name="close" size={24} color={COLORS.text} />
//         </TouchableOpacity>

//         <Text style={{
//           fontSize: 18,
//           fontFamily: Fonts.GeneralSans.Semibold,
//           color: COLORS.text,
//         }}>
//           Create Post
//         </Text>

//         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//           <TouchableOpacity
//             onPress={() => { setContent(''); setSelectedImages([]); fetchHotPosts(); }}
//             style={{ marginRight: 8 }}
//           >
//             <Ionicons name="reload" size={22} color={COLORS.accent} />
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={handlePost}
//             disabled={isPosting || (!content.trim() && selectedImages.length === 0)}
//             style={{
//               backgroundColor: COLORS.accent,
//               paddingHorizontal: 16,
//               paddingVertical: 8,
//               borderRadius: 20,
//               opacity: isPosting || (!content.trim() && selectedImages.length === 0) ? 0.5 : 1,
//             }}
//           >
//             {isPosting ? (
//               <ActivityIndicator color="#FFFFFF" size="small" />
//             ) : (
//               <Text style={{
//                 color: '#FFFFFF',
//                 fontSize: 16,
//                 fontFamily: Fonts.GeneralSans.Semibold,
//               }}>
//                 Post
//               </Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>

//       <ScrollView
//         style={{ flex: 1 }}
//         contentContainerStyle={{ padding: 16 }}
//         keyboardShouldPersistTaps="handled"
//       >
//         {/* User Info */}
//         <View style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           marginBottom: 16,
//         }}>
//           <Image
//             source={{ uri: user?.photoURL || 'https://via.placeholder.com/40' }}
//             style={{
//               width: 40,
//               height: 40,
//               borderRadius: 20,
//               marginRight: 12,
//             }}
//           />
//           <Text style={{
//             fontSize: 16,
//             fontFamily: Fonts.GeneralSans.Semibold,
//             color: COLORS.text,
//           }}>
//             {user?.user_name || user?.email || 'User'}
//           </Text>
//           <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' }}>
//             <Text style={{ color: COLORS.text, marginRight: 8 }}>Post Anonymously</Text>
//             <Switch
//               value={isAnonymous}
//               onValueChange={setIsAnonymous}
//               trackColor={{ false: '#3f3f46', true: '#8b5cf6' }}
//               thumbColor={isAnonymous ? '#8b5cf6' : '#f4f3f4'}
//             />
//           </View>
//         </View>

//         {/* Post Input */}
//         <TextInput
//           value={content}
//           onChangeText={setContent}
//           placeholder="What's happening?"
//           placeholderTextColor={COLORS.textMuted}
//           multiline
//           style={{
//             color: COLORS.text,
//             fontSize: 16,
//             fontFamily: Fonts.GeneralSans.Regular,
//             lineHeight: 24,
//             minHeight: 120,
//             textAlignVertical: 'top',
//           }}
//           autoFocus
//         />

//         {/* Selected Images */}
//         {selectedImages.length > 0 && (
//           <ScrollView
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             style={{ marginTop: 16 }}
//             contentContainerStyle={{ gap: 8 }}
//           >
//             {selectedImages.map((image, index) => (
//               <View key={index} style={{ position: 'relative' }}>
//                 <Image
//                   source={{ uri: image.uri }}
//                   style={{
//                     width: 100,
//                     height: 100,
//                     borderRadius: 8,
//                   }}
//                 />
//                 <TouchableOpacity
//                   onPress={() => removeImage(index)}
//                   style={{
//                     position: 'absolute',
//                     top: 4,
//                     right: 4,
//                     backgroundColor: 'rgba(0,0,0,0.5)',
//                     borderRadius: 12,
//                     width: 24,
//                     height: 24,
//                     alignItems: 'center',
//                     justifyContent: 'center',
//                   }}
//                 >
//                   <Ionicons name="close" size={16} color="#FFFFFF" />
//                 </TouchableOpacity>
//               </View>
//             ))}
//           </ScrollView>
//         )}

//         {/* Move image icon above keyboard, not in bottom bar */}
//         <View style={{ alignItems: 'flex-start', marginBottom: 12 }}>
//           <TouchableOpacity
//             onPress={pickImage}
//             style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.inputBg, alignItems: 'center', justifyContent: 'center' }}
//           >
//             <Ionicons name="image-outline" size={24} color={COLORS.accent} />
//           </TouchableOpacity>
//         </View>

//         {/* Hot Posts Section */}
//         {hotPosts.length > 0 && (
//           <View style={{ padding: 16 }}>
//             <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Top Post From Yesterday</Text>
//             <TouchableOpacity style={{ borderRadius: 8, overflow: 'hidden' }}>
//               <Image source={{ uri: hotPosts[0].images[0] }} style={{ width: 100, height: 100, borderRadius: 8 }} />
//               <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 }}>
//                 <Text style={{ color: COLORS.text, fontSize: 12 }}>{hotPosts[0].user_name || 'Anonymous'}</Text>
//                 <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
//                   <Ionicons name="heart" size={12} color="#FF6B6B" />
//                   <Text style={{ color: COLORS.text, fontSize: 10, marginLeft: 4 }}>{hotPosts[0].like_count || 0}</Text>
//                   <Ionicons name="chatbubble" size={12} color="#3B82F6" style={{ marginLeft: 8 }} />
//                   <Text style={{ color: COLORS.text, fontSize: 10, marginLeft: 4 }}>{hotPosts[0].comment_count || 0}</Text>
//           </View>
//               </LinearGradient>
//             </TouchableOpacity>
//         </View>
//         )}
//       </ScrollView>

//       {/* Streak Celebration Modal */}
//       <StreakCelebrationModal
//         visible={showCelebration}
//         onClose={() => {
//           setShowCelebration(false);
//           if (celebrationData.isFirstStreak) {
//             router.replace('/(root)/(tabs)/home');
//           }
//         }}
//         streakCount={celebrationData.streakCount}
//         previousStreak={celebrationData.previousStreak}
//         isFirstStreak={celebrationData.isFirstStreak}
//         showGoHome={celebrationData.isFirstStreak}
//       />
//     </KeyboardAvoidingView>
//   );
// } 

// // // // import React, { useState, useCallback, useRef, useEffect } from 'react';
// // // // import {
// // // //   View,
// // // //   Text,
// // // //   TextInput,
// // // //   TouchableOpacity,
// // // //   Image,
// // // //   ScrollView,
// // // //   KeyboardAvoidingView,
// // // //   Platform,
// // // //   ActivityIndicator,
// // // //   Alert,
// // // //   Switch,
// // // //   FlatList,
// // // //   StyleSheet,
// // // //   Dimensions,
// // // // } from 'react-native';
// // // // import { useRouter } from 'expo-router';
// // // // import { Ionicons } from '@expo/vector-icons';
// // // // import * as ImagePicker from 'expo-image-picker';
// // // // import { supabase } from '../../config/supabaseConfig';
// // // // import { decode } from 'base64-arraybuffer';
// // // // import networkErrorHandler from '../../utiles/networkErrorHandler';
// // // // import { updateStreakForPost } from '../../(apis)/streaks';
// // // // import StreakCelebrationModal from '../../components/StreakCelebrationModal';
// // // // import { Fonts, TextStyles } from '../../constants/Fonts';
// // // // import { LinearGradient } from 'expo-linear-gradient';
// // // // import { useAuthStore } from '../../stores/useAuthStore';

// // // // const { width: SCREEN_WIDTH } = Dimensions.get('window');

// // // // const COLORS = {
// // // //   background: '#000000',
// // // //   surface: '#111111',
// // // //   text: '#FFFFFF',
// // // //   accent: '#8B5CF6',
// // // //   textSecondary: '#E5E5E5',
// // // //   textMuted: '#71717A',
// // // //   inputBg: '#1A1A1A',
// // // //   border: 'rgba(255, 255, 255, 0.1)',
// // // //   cardBg: '#0F0F0F',
// // // //   success: '#22C55E',
// // // //   warning: '#F59E0B',
// // // //   error: '#EF4444',
// // // // };

// // // // const anonymousAvatars = [
// // // //   'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous1&backgroundColor=6366f1',
// // // //   'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous2&backgroundColor=8b5cf6',
// // // //   'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous3&backgroundColor=06b6d4',
// // // //   'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous4&backgroundColor=10b981',
// // // //   'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous5&backgroundColor=f59e0b',
// // // // ];

// // // // const getRandomAnonymousAvatar = () => {
// // // //   return anonymousAvatars[Math.floor(Math.random() * anonymousAvatars.length)];
// // // // };  
// // // // // const currentUser=await supabase.auth.getUser();

// // // // // console.log("user",currentUser);

// // // // export default function CreatePost() {
// // // //   const [content, setContent] = useState('');
// // // //   const [selectedImages, setSelectedImages] = useState([]);
// // // //   const [isPosting, setIsPosting] = useState(false);
// // // //   const [showCelebration, setShowCelebration] = useState(false);
// // // //   const [celebrationData, setCelebrationData] = useState({});
// // // //   const { user } = useAuthStore();
// // // //   const router = useRouter();
// // // //   const isMounted = useRef(true);
// // // //   const [isAnonymous, setIsAnonymous] = useState(false);
// // // //   const [hotPosts, setHotPosts] = useState([]);
// // // //   const [streakActive, setStreakActive] = useState(false);
// // // //   const [anonymousAvatar, setAnonymousAvatar] = useState(getRandomAnonymousAvatar());
// // // //   const [characterCount, setCharacterCount] = useState(0);
// // // //   const MAX_CHARACTERS = 280;
// // // //   const MAX_IMAGES = 4;


// // // //   const currentUser= supabase.auth.getUser();

// // // // console.log("user",currentUser);

// // // //   // Cleanup on unmount
// // // //   React.useEffect(() => {
// // // //     return () => {
// // // //       isMounted.current = false;
// // // //     };
// // // //   }, []);

// // // //   // Fetch hot posts and streak info on mount
// // // //   React.useEffect(() => {
// // // //     fetchHotPosts();
// // // //     loadStreak();
// // // //   }, []);

// // // //   // Update character count
// // // //   React.useEffect(() => {
// // // //     setCharacterCount(content.length);
// // // //   }, [content]);

// // // //   const fetchHotPosts = async () => {
// // // //     try {
// // // //       const yesterday = new Date();
// // // //       yesterday.setDate(yesterday.getDate() - 1);
// // // //       yesterday.setHours(0, 0, 0, 0);
// // // //       const yesterdayEnd = new Date(yesterday);
// // // //       yesterdayEnd.setHours(23, 59, 59, 999);
      
// // // //       const { data: hotPostsData, error } = await supabase
// // // //         .from('posts')
// // // //         .select('*')
// // // //         .gte('created_at', yesterday.toISOString())
// // // //         .lte('created_at', yesterdayEnd.toISOString())
// // // //         .order('created_at', { ascending: false })
// // // //         .limit(3);
        
// // // //       if (!error && hotPostsData) {
// // // //         const postsWithImages = hotPostsData.filter((post) => post.images && post.images.length > 0);
// // // //         if (postsWithImages.length > 0) {
// // // //           postsWithImages.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
// // // //           setHotPosts([postsWithImages[0]]);
// // // //         } else {
// // // //           setHotPosts([]);
// // // //         }
// // // //       }
// // // //     } catch (error) {
// // // //       console.error('Error fetching hot posts:', error);
// // // //     }
// // // //   };

// // // //   const loadStreak = async () => {
// // // //     try {
// // // //       // Fetch streak info if needed for UI
// // // //       // setStreakActive(...) if user already posted today
// // // //     } catch (error) {
// // // //       console.error('Error loading streak:', error);
// // // //     }
// // // //   };

// // // //   const pickImage = async () => {
// // // //     if (selectedImages.length >= MAX_IMAGES) {
// // // //       Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images per post.`);
// // // //       return;
// // // //     }

// // // //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
// // // //     if (status !== 'granted') {
// // // //       Alert.alert(
// // // //         'Permission Required',
// // // //         'Please allow photo access to add images to your post.',
// // // //         [
// // // //           { text: 'Cancel', style: 'cancel' },
// // // //           { text: 'Open Settings', onPress: () => {} }
// // // //         ]
// // // //       );
// // // //       return;
// // // //     }

// // // //     try {
// // // //       const result = await ImagePicker.launchImageLibraryAsync({
// // // //         mediaTypes: ['images'],
// // // //         allowsMultipleSelection: true,
// // // //         quality: 0.8,
// // // //         base64: true,
// // // //         selectionLimit: MAX_IMAGES - selectedImages.length,
// // // //       });

// // // //       if (!result.canceled && result.assets) {
// // // //         setSelectedImages(prev => [...prev, ...result.assets]);
// // // //       }
// // // //     } catch (error) {
// // // //       console.error('Error picking image:', error);
// // // //       Alert.alert('Error', 'Failed to select images. Please try again.');
// // // //     }
// // // //   };

// // // //   const removeImage = (index) => {
// // // //     setSelectedImages(prev => prev.filter((_, i) => i !== index));
// // // //   };

// // // //   const uploadImage = async (base64Image) => {
// // // //     try {
// // // //       const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
// // // //       const filePath = `public/${fileName}`;
// // // //       const contentType = 'image/jpeg';

// // // //       const { data, error } = await supabase.storage
// // // //         .from('posts')
// // // //         .upload(filePath, decode(base64Image), {
// // // //           contentType,
// // // //           upsert: true,
// // // //         });

// // // //       if (error) throw error;

// // // //       const { data: { publicUrl } } = supabase.storage
// // // //         .from('posts')
// // // //         .getPublicUrl(filePath);

// // // //       return publicUrl;
// // // //     } catch (error) {
// // // //       console.error('Error uploading image:', error);
// // // //       throw error;
// // // //     }
// // // //   };

// // // //   const handlePost = async () => {
// // // //     if (!content.trim() && selectedImages.length === 0) {
// // // //       Alert.alert('Empty Post', 'Please add some content or images to your post.');
// // // //       return;
// // // //     }

// // // //     if (content.length > MAX_CHARACTERS) {
// // // //       Alert.alert('Post Too Long', `Please keep your post under ${MAX_CHARACTERS} characters.`);
// // // //       return;
// // // //     }

// // // //     try {
// // // //       setIsPosting(true);
// // // //       let imageUrls = [];

// // // //       if (selectedImages.length > 0) {
// // // //         const uploadPromises = selectedImages.map(image => uploadImage(image.base64));
// // // //         imageUrls = await Promise.all(uploadPromises);
// // // //         imageUrls = imageUrls.filter(url => url !== null);
// // // //       }

// // // //       const postData = {
// // // //         user_id: user.id,
// // // //         content: content.trim(),
// // // //         images: imageUrls,
// // // //         is_anonymous: isAnonymous,
// // // //         user_name: isAnonymous ? 'Anonymous User' : (user.user_name || user.email),
// // // //         user_avatar: isAnonymous ? anonymousAvatar : user.photoURL,
// // // //         anonymous_id: isAnonymous ? `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
// // // //       };

// // // //       const { data: post, error } = await supabase
// // // //         .from('posts')
// // // //         .insert([postData])
// // // //         .select()
// // // //         .single();

// // // //       if (error) throw error;

// // // //       // Update streak for post creation
// // // //       try {
// // // //         const streakResult = await updateStreakForPost(user.id);
// // // //         if (streakResult.streakIncreased) {
// // // //           setCelebrationData({
// // // //             streakCount: streakResult.current_streak,
// // // //             previousStreak: streakResult.previousStreak,
// // // //             isFirstStreak: streakResult.current_streak === 1 && streakResult.previousStreak === 0
// // // //           });
// // // //           setShowCelebration(true);
// // // //         }
// // // //       } catch (streakError) {
// // // //         console.error('Error updating streak:', streakError);
// // // //       }

// // // //       if (isMounted.current) {
// // // //         setContent('');
// // // //         setSelectedImages([]);
// // // //         setIsAnonymous(false);
// // // //         setAnonymousAvatar(getRandomAnonymousAvatar());
// // // //         router.back();
// // // //       }
// // // //     } catch (error) {
// // // //       console.error('Error creating post:', error);
// // // //       networkErrorHandler.showErrorToUser(error);
// // // //     } finally {
// // // //       setIsPosting(false);
// // // //     }
// // // //   };

// // // //   const handleAnonymousToggle = (value) => {
// // // //     setIsAnonymous(value);
// // // //     if (value) {
// // // //       setAnonymousAvatar(getRandomAnonymousAvatar());
// // // //     }
// // // //   };

// // // //   const renderImageGrid = () => {
// // // //     if (selectedImages.length === 0) return null;

// // // //     return (
// // // //       <View style={styles.imageGrid}>
// // // //         {selectedImages.map((image, index) => (
// // // //           <View key={index} style={styles.imageContainer}>
// // // //             <Image source={{ uri: image.uri }} style={styles.selectedImage} />
// // // //             <TouchableOpacity
// // // //               onPress={() => removeImage(index)}
// // // //               style={styles.removeImageButton}
// // // //             >
// // // //               <Ionicons name="close" size={16} color="#FFFFFF" />
// // // //             </TouchableOpacity>
// // // //           </View>
// // // //         ))}
// // // //       </View>
// // // //     );
// // // //   };

// // // //   const renderHotPost = () => {
// // // //     if (hotPosts.length === 0) return null;

// // // //     const post = hotPosts[0];
// // // //     return (
// // // //       <View style={styles.hotPostContainer}>
// // // //         <View style={styles.hotPostHeader}>
// // // //           <Ionicons name="flame" size={16} color="#FF6B6B" />
// // // //           <Text style={styles.hotPostTitle}>Trending from yesterday</Text>
// // // //         </View>
// // // //         <TouchableOpacity style={styles.hotPostCard}>
// // // //           <Image source={{ uri: post.images[0] }} style={styles.hotPostImage} />
// // // //           <LinearGradient
// // // //             colors={['transparent', 'rgba(0,0,0,0.8)']}
// // // //             style={styles.hotPostGradient}
// // // //           >
// // // //             <Text style={styles.hotPostUsername}>
// // // //               {post.is_anonymous ? 'Anonymous User' : (post.user_name || 'Anonymous')}
// // // //             </Text>
// // // //             <View style={styles.hotPostStats}>
// // // //               <View style={styles.statItem}>
// // // //                 <Ionicons name="heart" size={12} color="#FF6B6B" />
// // // //                 <Text style={styles.statText}>{post.like_count || 0}</Text>
// // // //               </View>
// // // //               <View style={styles.statItem}>
// // // //                 <Ionicons name="chatbubble" size={12} color="#3B82F6" />
// // // //                 <Text style={styles.statText}>{post.comment_count || 0}</Text>
// // // //               </View>
// // // //             </View>
// // // //           </LinearGradient>
// // // //         </TouchableOpacity>
// // // //       </View>
// // // //     );
// // // //   };

// // // //   if (!user?.id) {
// // // //     return (
// // // //       <View style={styles.loadingContainer}>
// // // //         <ActivityIndicator size="large" color={COLORS.accent} />
// // // //         <Text style={styles.loadingText}>Loading...</Text>
// // // //       </View>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <KeyboardAvoidingView
// // // //       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
// // // //       style={styles.container}
// // // //     >
// // // //       {/* Header */}
// // // //       <View style={styles.header}>
// // // //         <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
// // // //           <Ionicons name="close" size={24} color={COLORS.text} />
// // // //         </TouchableOpacity>

// // // //         <Text style={styles.headerTitle}>Create Post</Text>

// // // //         <View style={styles.headerActions}>
// // // //           <TouchableOpacity
// // // //             onPress={() => {
// // // //               setContent('');
// // // //               setSelectedImages([]);
// // // //               setIsAnonymous(false);
// // // //               fetchHotPosts();
// // // //             }}
// // // //             style={styles.refreshButton}
// // // //           >
// // // //             <Ionicons name="refresh" size={20} color={COLORS.accent} />
// // // //           </TouchableOpacity>
          
// // // //           <TouchableOpacity
// // // //             onPress={handlePost}
// // // //             disabled={isPosting || (!content.trim() && selectedImages.length === 0)}
// // // //             style={[
// // // //               styles.postButton,
// // // //               {
// // // //               opacity: isPosting || (!content.trim() && selectedImages.length === 0) ? 0.5 : 1,
// // // //               }
// // // //             ]}
// // // //           >
// // // //             {isPosting ? (
// // // //               <ActivityIndicator color="#FFFFFF" size="small" />
// // // //             ) : (
// // // //               <Text style={styles.postButtonText}>Post</Text>
// // // //             )}
// // // //           </TouchableOpacity>
// // // //         </View>
// // // //       </View>

// // // //       <ScrollView
// // // //         style={styles.content}
// // // //         contentContainerStyle={styles.contentContainer}
// // // //         keyboardShouldPersistTaps="handled"
// // // //         showsVerticalScrollIndicator={false}
// // // //       >
// // // //         {/* User Info */}
// // // //         <View style={styles.userInfo}>
// // // //           <Image
// // // //             source={{ 
// // // //               uri: isAnonymous ? anonymousAvatar : (user?.photoURL || 'https://via.placeholder.com/40') 
// // // //             }}
// // // //             style={styles.avatar}
// // // //           />
// // // //           <View style={styles.userDetails}>
// // // //             <Text style={styles.username}>
// // // //               {isAnonymous ? 'Anonymous User' : (user?.user_name || user?.email || 'User')}
// // // //           </Text>
// // // //             {isAnonymous && (
// // // //               <Text style={styles.anonymousLabel}>Your identity is hidden</Text>
// // // //             )}
// // // //           </View>
// // // //         </View>

// // // //         {/* Post Input */}
// // // //         <TextInput
// // // //           value={content}
// // // //           onChangeText={setContent}
// // // //           placeholder="What's on your mind?"
// // // //           placeholderTextColor={COLORS.textMuted}
// // // //           multiline
// // // //           style={styles.textInput}
// // // //           autoFocus
// // // //           maxLength={MAX_CHARACTERS}
// // // //         />

// // // //         {/* Character Counter */}
// // // //         <View style={styles.characterCounter}>
// // // //           <Text style={[
// // // //             styles.characterCountText,
// // // //             { color: characterCount > MAX_CHARACTERS * 0.9 ? COLORS.warning : COLORS.textMuted }
// // // //           ]}>
// // // //             {characterCount}/{MAX_CHARACTERS}
// // // //           </Text>
// // // //         </View>

// // // //         {/* Selected Images */}
// // // //         {renderImageGrid()}

// // // //         {/* Hot Post */}
// // // //         {renderHotPost()}
// // // //           </ScrollView>

// // // //       {/* Bottom Actions */}
// // // //       <View style={styles.bottomActions}>
// // // //         <View style={styles.actionButtons}>
// // // //           <TouchableOpacity
// // // //             onPress={pickImage}
// // // //             style={styles.imageButton}
// // // //             disabled={selectedImages.length >= MAX_IMAGES}
// // // //           >
// // // //             <Ionicons 
// // // //               name="image" 
// // // //               size={24} 
// // // //               color={selectedImages.length >= MAX_IMAGES ? COLORS.textMuted : COLORS.accent} 
// // // //             />
// // // //             {selectedImages.length > 0 && (
// // // //               <View style={styles.imageBadge}>
// // // //                 <Text style={styles.imageBadgeText}>{selectedImages.length}</Text>
// // // //               </View>
// // // //             )}
// // // //           </TouchableOpacity>

// // // //           <View style={styles.anonymousToggle}>
// // // //             <Ionicons 
// // // //               name={isAnonymous ? "eye-off" : "eye"} 
// // // //               size={18} 
// // // //               color={isAnonymous ? COLORS.accent : COLORS.textMuted} 
// // // //             />
// // // //             <Text style={[styles.anonymousText, { color: isAnonymous ? COLORS.accent : COLORS.text }]}>
// // // //               Go Incognito
// // // //             </Text>
// // // //             <Switch
// // // //               value={isAnonymous}
// // // //               onValueChange={handleAnonymousToggle}
// // // //               trackColor={{ false: '#3f3f46', true: COLORS.accent }}
// // // //               thumbColor={isAnonymous ? '#FFFFFF' : '#f4f3f4'}
// // // //               style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
// // // //             />
// // // //           </View>
// // // //         </View>
// // // //           </View>

// // // //       {/* Streak Celebration Modal */}
// // // //       <StreakCelebrationModal
// // // //         visible={showCelebration}
// // // //         onClose={() => {
// // // //           setShowCelebration(false);
// // // //           if (celebrationData.isFirstStreak) {
// // // //             router.replace('/(root)/(tabs)/home');
// // // //           }
// // // //         }}
// // // //         streakCount={celebrationData.streakCount}
// // // //         previousStreak={celebrationData.previousStreak}
// // // //         isFirstStreak={celebrationData.isFirstStreak}
// // // //         showGoHome={celebrationData.isFirstStreak}
// // // //       />
// // // //     </KeyboardAvoidingView>
// // // //   );
// // // // } 

// // // // const styles = StyleSheet.create({
// // // //   container: {
// // // //     flex: 1,
// // // //     backgroundColor: COLORS.background,
// // // //   },
// // // //   loadingContainer: {
// // // //     flex: 1,
// // // //     backgroundColor: COLORS.background,
// // // //     justifyContent: 'center',
// // // //     alignItems: 'center',
// // // //   },
// // // //   loadingText: {
// // // //     color: COLORS.text,
// // // //     marginTop: 12,
// // // //     fontSize: 16,
// // // //     fontFamily: Fonts.GeneralSans.Regular,
// // // //   },
// // // //   header: {
// // // //     flexDirection: 'row',
// // // //     justifyContent: 'space-between',
// // // //     alignItems: 'center',
// // // //     paddingHorizontal: 16,
// // // //     paddingTop: Platform.OS === 'ios' ? 60 : 20,
// // // //     paddingBottom: 16,
// // // //     borderBottomWidth: 1,
// // // //     borderBottomColor: COLORS.border,
// // // //     backgroundColor: COLORS.surface,
// // // //   },
// // // //   headerButton: {
// // // //     width: 40,
// // // //     height: 40,
// // // //     borderRadius: 20,
// // // //     alignItems: 'center',
// // // //     justifyContent: 'center',
// // // //   },
// // // //   headerTitle: {
// // // //     fontSize: 18,
// // // //     fontFamily: Fonts.GeneralSans.Semibold,
// // // //     color: COLORS.text,
// // // //   },
// // // //   headerActions: {
// // // //     flexDirection: 'row',
// // // //     alignItems: 'center',
// // // //     gap: 8,
// // // //   },
// // // //   refreshButton: {
// // // //     padding: 8,
// // // //   },
// // // //   postButton: {
// // // //     backgroundColor: COLORS.accent,
// // // //     paddingHorizontal: 20,
// // // //     paddingVertical: 10,
// // // //     borderRadius: 24,
// // // //     minWidth: 80,
// // // //     alignItems: 'center',
// // // //   },
// // // //   postButtonText: {
// // // //     color: '#FFFFFF',
// // // //     fontSize: 16,
// // // //     fontFamily: Fonts.GeneralSans.Semibold,
// // // //   },
// // // //   content: {
// // // //     flex: 1,
// // // //   },
// // // //   contentContainer: {
// // // //     padding: 16,
// // // //     paddingBottom: 100,
// // // //   },
// // // //   userInfo: {
// // // //     flexDirection: 'row',
// // // //     alignItems: 'center',
// // // //     marginBottom: 16,
// // // //   },
// // // //   avatar: {
// // // //     width: 48,
// // // //     height: 48,
// // // //     borderRadius: 24,
// // // //     marginRight: 12,
// // // //   },
// // // //   userDetails: {
// // // //     flex: 1,
// // // //   },
// // // //   username: {
// // // //     fontSize: 16,
// // // //     fontFamily: Fonts.GeneralSans.Semibold,
// // // //     color: COLORS.text,
// // // //   },
// // // //   anonymousLabel: {
// // // //     fontSize: 12,
// // // //     fontFamily: Fonts.GeneralSans.Regular,
// // // //     color: COLORS.accent,
// // // //     marginTop: 2,
// // // //   },
// // // //   textInput: {
// // // //     color: COLORS.text,
// // // //     fontSize: 18,
// // // //     fontFamily: Fonts.GeneralSans.Regular,
// // // //     lineHeight: 26,
// // // //     minHeight: 120,
// // // //     textAlignVertical: 'top',
// // // //     marginBottom: 8,
// // // //   },
// // // //   characterCounter: {
// // // //     alignItems: 'flex-end',
// // // //     marginBottom: 16,
// // // //   },
// // // //   characterCountText: {
// // // //     fontSize: 12,
// // // //     fontFamily: Fonts.GeneralSans.Regular,
// // // //   },
// // // //   imageGrid: {
// // // //     flexDirection: 'row',
// // // //     flexWrap: 'wrap',
// // // //     gap: 8,
// // // //     marginBottom: 16,
// // // //   },
// // // //   imageContainer: {
// // // //     position: 'relative',
// // // //     width: (SCREEN_WIDTH - 48) / 2,
// // // //     height: 120,
// // // //   },
// // // //   selectedImage: {
// // // //     width: '100%',
// // // //     height: '100%',
// // // //     borderRadius: 12,
// // // //   },
// // // //   removeImageButton: {
// // // //     position: 'absolute',
// // // //     top: 8,
// // // //     right: 8,
// // // //     backgroundColor: 'rgba(0,0,0,0.7)',
// // // //     borderRadius: 16,
// // // //     width: 32,
// // // //     height: 32,
// // // //     alignItems: 'center',
// // // //     justifyContent: 'center',
// // // //   },
// // // //   hotPostContainer: {
// // // //     marginTop: 16,
// // // //   },
// // // //   hotPostHeader: {
// // // //     flexDirection: 'row',
// // // //     alignItems: 'center',
// // // //     marginBottom: 12,
// // // //   },
// // // //   hotPostTitle: {
// // // //     color: COLORS.text,
// // // //     fontSize: 16,
// // // //     fontFamily: Fonts.GeneralSans.Semibold,
// // // //     marginLeft: 8,
// // // //   },
// // // //   hotPostCard: {
// // // //     borderRadius: 12,
// // // //     overflow: 'hidden',
// // // //     backgroundColor: COLORS.cardBg,
// // // //   },
// // // //   hotPostImage: {
// // // //     width: '100%',
// // // //     height: 200,
// // // //   },
// // // //   hotPostGradient: {
// // // //     position: 'absolute',
// // // //     bottom: 0,
// // // //     left: 0,
// // // //     right: 0,
// // // //     padding: 16,
// // // //   },
// // // //   hotPostUsername: {
// // // //     color: COLORS.text,
// // // //     fontSize: 14,
// // // //     fontFamily: Fonts.GeneralSans.Medium,
// // // //     marginBottom: 8,
// // // //   },
// // // //   hotPostStats: {
// // // //     flexDirection: 'row',
// // // //     gap: 16,
// // // //   },
// // // //   statItem: {
// // // //     flexDirection: 'row',
// // // //     alignItems: 'center',
// // // //     gap: 4,
// // // //   },
// // // //   statText: {
// // // //     color: COLORS.text,
// // // //     fontSize: 12,
// // // //     fontFamily: Fonts.GeneralSans.Regular,
// // // //   },
// // // //   bottomActions: {
// // // //     position: 'absolute',
// // // //     bottom: 0,
// // // //     left: 0,
// // // //     right: 0,
// // // //     backgroundColor: COLORS.surface,
// // // //     borderTopWidth: 1,
// // // //     borderTopColor: COLORS.border,
// // // //     paddingHorizontal: 16,
// // // //     paddingVertical: 12,
// // // //     paddingBottom: Platform.OS === 'ios' ? 34 : 12,
// // // //   },
// // // //   actionButtons: {
// // // //     flexDirection: 'row',
// // // //     justifyContent: 'space-between',
// // // //     alignItems: 'center',
// // // //   },
// // // //   imageButton: {
// // // //     width: 44,
// // // //     height: 44,
// // // //     borderRadius: 22,
// // // //     backgroundColor: COLORS.inputBg,
// // // //     alignItems: 'center',
// // // //     justifyContent: 'center',
// // // //     position: 'relative',
// // // //   },
// // // //   imageBadge: {
// // // //     position: 'absolute',
// // // //     top: -4,
// // // //     right: -4,
// // // //     backgroundColor: COLORS.accent,
// // // //     borderRadius: 10,
// // // //     width: 20,
// // // //     height: 20,
// // // //     alignItems: 'center',
// // // //     justifyContent: 'center',
// // // //   },
// // // //   imageBadgeText: {
// // // //     color: '#FFFFFF',
// // // //     fontSize: 10,
// // // //     fontFamily: Fonts.GeneralSans.Bold,
// // // //   },
// // // //   anonymousToggle: {
// // // //     flexDirection: 'row',
// // // //     alignItems: 'center',
// // // //     gap: 8,
// // // //   },
// // // //   anonymousText: {
// // // //     fontSize: 14,
// // // //     fontFamily: Fonts.GeneralSans.Medium,
// // // //   },
// // // // });


// // // // import React, { useState, useCallback, useRef, useEffect } from 'react';
// // // // import {
// // // //   View,
// // // //   Text,
// // // //   TextInput,
// // // //   TouchableOpacity,
// // // //   Image,
// // // //   ScrollView,
// // // //   KeyboardAvoidingView,
// // // //   Platform,
// // // //   ActivityIndicator,
// // // //   Alert,
// // // //   Switch,
// // // //   StyleSheet,
// // // //   Dimensions,
// // // //   Modal,
// // // //   Animated,
// // // //   SafeAreaView,
// // // //   Keyboard,
// // // // } from 'react-native';
// // // // import { useRouter } from 'expo-router';
// // // // import { Ionicons } from '@expo/vector-icons';
// // // // import * as ImagePicker from 'expo-image-picker';
// // // // import { supabase } from '../../config/supabaseConfig';
// // // // import { decode } from 'base64-arraybuffer';
// // // // import networkErrorHandler from '../../utiles/networkErrorHandler';
// // // // import { updateStreakForPost } from '../../(apis)/streaks';
// // // // import { Fonts, TextStyles } from '../../constants/Fonts';
// // // // import { LinearGradient } from 'expo-linear-gradient';
// // // // import { useAuthStore } from '../../stores/useAuthStore';

// // // // const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// // // // const COLORS = {
// // // //   background: '#000000',
// // // //   surface: '#111111',
// // // //   text: '#FFFFFF',
// // // //   accent: '#8B5CF6',
// // // //   textSecondary: '#E5E5E5',
// // // //   textMuted: '#71717A',
// // // //   inputBg: '#1A1A1A',
// // // //   border: 'rgba(255, 255, 255, 0.1)',
// // // //   cardBg: '#0F0F0F',
// // // //   success: '#22C55E',
// // // //   warning: '#F59E0B',
// // // //   error: '#EF4444',
// // // //   gradient: ['#8B5CF6', '#3B82F6'],
// // // // };

// // // // const anonymousAvatars = [
// // // //   'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous1&backgroundColor=6366f1',
// // // //   'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous2&backgroundColor=8b5cf6',
// // // //   'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous3&backgroundColor=06b6d4',
// // // //   'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous4&backgroundColor=10b981',
// // // //   'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous5&backgroundColor=f59e0b',
// // // // ];

// // // // const getRandomAnonymousAvatar = () => {
// // // //   return anonymousAvatars[Math.floor(Math.random() * anonymousAvatars.length)];
// // // // };

// // // // // Enhanced Streak Celebration Modal Component
// // // // const StreakCelebrationModal = ({ visible, onClose, streakCount, previousStreak, isFirstStreak }) => {
// // // //   const scaleAnim = useRef(new Animated.Value(0)).current;
// // // //   const fadeAnim = useRef(new Animated.Value(0)).current;
// // // //   const sparkleAnim = useRef(new Animated.Value(0)).current;

// // // //   useEffect(() => {
// // // //     if (visible) {
// // // //       Animated.parallel([
// // // //         Animated.spring(scaleAnim, {
// // // //           toValue: 1,
// // // //           tension: 50,
// // // //           friction: 7,
// // // //           useNativeDriver: true,
// // // //         }),
// // // //         Animated.timing(fadeAnim, {
// // // //           toValue: 1,
// // // //           duration: 300,
// // // //           useNativeDriver: true,
// // // //         }),
// // // //         Animated.loop(
// // // //           Animated.sequence([
// // // //             Animated.timing(sparkleAnim, {
// // // //               toValue: 1,
// // // //               duration: 1000,
// // // //               useNativeDriver: true,
// // // //             }),
// // // //             Animated.timing(sparkleAnim, {
// // // //               toValue: 0,
// // // //               duration: 1000,
// // // //               useNativeDriver: true,
// // // //             }),
// // // //           ])
// // // //         ),
// // // //       ]).start();
// // // //     }
// // // //   }, [visible]);

// // // //   const handleClose = () => {
// // // //     Animated.parallel([
// // // //       Animated.timing(scaleAnim, {
// // // //         toValue: 0,
// // // //         duration: 200,
// // // //         useNativeDriver: true,
// // // //       }),
// // // //       Animated.timing(fadeAnim, {
// // // //         toValue: 0,
// // // //         duration: 200,
// // // //         useNativeDriver: true,
// // // //       }),
// // // //     ]).start(() => {
// // // //       onClose();
// // // //     });
// // // //   };

// // // //   if (!visible) return null;

// // // //   return (
// // // //     <Modal
// // // //       visible={visible}
// // // //       transparent
// // // //       animationType="none"
// // // //       onRequestClose={handleClose}
// // // //     >
// // // //       <View style={styles.modalOverlay}>
// // // //         <Animated.View
// // // //           style={[
// // // //             styles.modalContent,
// // // //             {
// // // //               transform: [{ scale: scaleAnim }],
// // // //               opacity: fadeAnim,
// // // //             },
// // // //           ]}
// // // //         >
// // // //           <LinearGradient
// // // //             colors={['#8B5CF6', '#3B82F6']}
// // // //             style={styles.modalGradient}
// // // //           >
// // // //             {/* Sparkle Effects */}
// // // //             <Animated.View
// // // //               style={[
// // // //                 styles.sparkle,
// // // //                 styles.sparkle1,
// // // //                 { opacity: sparkleAnim },
// // // //               ]}
// // // //             >
// // // //               <Ionicons name="sparkles" size={24} color="#FFD700" />
// // // //             </Animated.View>
// // // //             <Animated.View
// // // //               style={[
// // // //                 styles.sparkle,
// // // //                 styles.sparkle2,
// // // //                 { opacity: sparkleAnim },
// // // //               ]}
// // // //             >
// // // //               <Ionicons name="sparkles" size={18} color="#FFD700" />
// // // //             </Animated.View>
// // // //             <Animated.View
// // // //               style={[
// // // //                 styles.sparkle,
// // // //                 styles.sparkle3,
// // // //                 { opacity: sparkleAnim },
// // // //               ]}
// // // //             >
// // // //               <Ionicons name="sparkles" size={20} color="#FFD700" />
// // // //             </Animated.View>

// // // //             {/* Fire Icon */}
// // // //             <View style={styles.fireIconContainer}>
// // // //               <Ionicons name="flame" size={60} color="#FF6B6B" />
// // // //             </View>

// // // //             {/* Streak Count */}
// // // //             <Text style={styles.streakNumber}>{streakCount}</Text>
// // // //             <Text style={styles.streakLabel}>Day Streak!</Text>

// // // //             {/* Message */}
// // // //             <Text style={styles.celebrationMessage}>
// // // //               {isFirstStreak
// // // //                 ? "🎉 You've started your streak journey!"
// // // //                 : `🔥 Amazing! You've maintained your streak for ${streakCount} days!`}
// // // //             </Text>

// // // //             <Text style={styles.motivationText}>
// // // //               Keep posting daily to build your momentum! 💪
// // // //             </Text>

// // // //             {/* Close Button */}
// // // //             <TouchableOpacity
// // // //               style={styles.celebrationButton}
// // // //               onPress={handleClose}
// // // //             >
// // // //               <Text style={styles.celebrationButtonText}>Continue</Text>
// // // //             </TouchableOpacity>
// // // //           </LinearGradient>
// // // //         </Animated.View>
// // // //       </View>
// // // //     </Modal>
// // // //   );
// // // // };

// // // // export default function CreatePost() {
// // // //   const [content, setContent] = useState('');
// // // //   const [selectedImages, setSelectedImages] = useState([]);
// // // //   const [isPosting, setIsPosting] = useState(false);
// // // //   const [showCelebration, setShowCelebration] = useState(false);
// // // //   const [celebrationData, setCelebrationData] = useState({});
// // // //   const { user } = useAuthStore();
// // // //   const router = useRouter();
// // // //   const isMounted = useRef(true);
// // // //   const [isAnonymous, setIsAnonymous] = useState(false);
// // // //   const [hotPosts, setHotPosts] = useState([]);
// // // //   const [anonymousAvatar, setAnonymousAvatar] = useState(getRandomAnonymousAvatar());
// // // //   const [keyboardHeight, setKeyboardHeight] = useState(0);
// // // //   const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
// // // //   const MAX_IMAGES = 4;

// // // //   const currentUser = supabase.auth.getUser();

// // // //   // Keyboard handling
// // // //   useEffect(() => {
// // // //     const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
// // // //       setKeyboardHeight(e.endCoordinates.height);
// // // //       setIsKeyboardVisible(true);
// // // //     });
// // // //     const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
// // // //       setKeyboardHeight(0);
// // // //       setIsKeyboardVisible(false);
// // // //     });

// // // //     return () => {
// // // //       keyboardDidShowListener?.remove();
// // // //       keyboardDidHideListener?.remove();
// // // //     };
// // // //   }, []);

// // // //   // Cleanup on unmount
// // // //   useEffect(() => {
// // // //     return () => {
// // // //       isMounted.current = false;
// // // //     };
// // // //   }, []);

// // // //   // Fetch hot posts on mount
// // // //   useEffect(() => {
// // // //     fetchHotPosts();
// // // //   }, []);

// // // //   const fetchHotPosts = async () => {
// // // //     try {
// // // //       const yesterday = new Date();
// // // //       yesterday.setDate(yesterday.getDate() - 1);
// // // //       yesterday.setHours(0, 0, 0, 0);
// // // //       const yesterdayEnd = new Date(yesterday);
// // // //       yesterdayEnd.setHours(23, 59, 59, 999);
      
// // // //       const { data: hotPostsData, error } = await supabase
// // // //         .from('posts')
// // // //         .select('*')
// // // //         .gte('created_at', yesterday.toISOString())
// // // //         .lte('created_at', yesterdayEnd.toISOString())
// // // //         .order('created_at', { ascending: false })
// // // //         .limit(3);
        
// // // //       if (!error && hotPostsData) {
// // // //         const postsWithImages = hotPostsData.filter((post) => post.images && post.images.length > 0);
// // // //         if (postsWithImages.length > 0) {
// // // //           postsWithImages.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
// // // //           setHotPosts([postsWithImages[0]]);
// // // //         } else {
// // // //           setHotPosts([]);
// // // //         }
// // // //       }
// // // //     } catch (error) {
// // // //       console.error('Error fetching hot posts:', error);
// // // //     }
// // // //   };

// // // //   const pickImage = async () => {
// // // //     if (selectedImages.length >= MAX_IMAGES) {
// // // //       Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images per post.`);
// // // //       return;
// // // //     }

// // // //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
// // // //     if (status !== 'granted') {
// // // //       Alert.alert(
// // // //         'Permission Required',
// // // //         'Please allow photo access to add images to your post.',
// // // //         [
// // // //           { text: 'Cancel', style: 'cancel' },
// // // //           { text: 'Open Settings', onPress: () => {} }
// // // //         ]
// // // //       );
// // // //       return;
// // // //     }

// // // //     try {
// // // //       const result = await ImagePicker.launchImageLibraryAsync({
// // // //         mediaTypes: ['images'],
// // // //         allowsMultipleSelection: true,
// // // //         quality: 0.8,
// // // //         base64: true,
// // // //         selectionLimit: MAX_IMAGES - selectedImages.length,
// // // //       });

// // // //       if (!result.canceled && result.assets) {
// // // //         setSelectedImages(prev => [...prev, ...result.assets]);
// // // //       }
// // // //     } catch (error) {
// // // //       console.error('Error picking image:', error);
// // // //       Alert.alert('Error', 'Failed to select images. Please try again.');
// // // //     }
// // // //   };

// // // //   const removeImage = (index) => {
// // // //     setSelectedImages(prev => prev.filter((_, i) => i !== index));
// // // //   };

// // // //   const uploadImage = async (base64Image) => {
// // // //     try {
// // // //       const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
// // // //       const filePath = `public/${fileName}`;
// // // //       const contentType = 'image/jpeg';

// // // //       const { data, error } = await supabase.storage
// // // //         .from('posts')
// // // //         .upload(filePath, decode(base64Image), {
// // // //           contentType,
// // // //           upsert: true,
// // // //         });

// // // //       if (error) throw error;

// // // //       const { data: { publicUrl } } = supabase.storage
// // // //         .from('posts')
// // // //         .getPublicUrl(filePath);

// // // //       return publicUrl;
// // // //     } catch (error) {
// // // //       console.error('Error uploading image:', error);
// // // //       throw error;
// // // //     }
// // // //   };

// // // //   const handlePost = async () => {
// // // //     if (!content.trim() && selectedImages.length === 0) {
// // // //       Alert.alert('Empty Post', 'Please add some content or images to your post.');
// // // //       return;
// // // //     }

// // // //     try {
// // // //       setIsPosting(true);
// // // //       let imageUrls = [];

// // // //       if (selectedImages.length > 0) {
// // // //         const uploadPromises = selectedImages.map(image => uploadImage(image.base64));
// // // //         imageUrls = await Promise.all(uploadPromises);
// // // //         imageUrls = imageUrls.filter(url => url !== null);
// // // //       }

// // // //       const postData = {
// // // //         user_id: user.id,
// // // //         content: content.trim(),
// // // //         images: imageUrls,
// // // //         is_anonymous: isAnonymous,
// // // //         user_name: isAnonymous ? 'Anonymous User' : (user.user_name || user.email),
// // // //         user_avatar: isAnonymous ? anonymousAvatar : user.photoURL,
// // // //         anonymous_id: isAnonymous ? `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
// // // //       };

// // // //       const { data: post, error } = await supabase
// // // //         .from('posts')
// // // //         .insert([postData])
// // // //         .select()
// // // //         .single();

// // // //       if (error) throw error;

// // // //       // Update streak for post creation
// // // //       try {
// // // //         const streakResult = await updateStreakForPost(user.id);
// // // //         if (streakResult.streakIncreased) {
// // // //           setCelebrationData({
// // // //             streakCount: streakResult.current_streak,
// // // //             previousStreak: streakResult.previousStreak,
// // // //             isFirstStreak: streakResult.current_streak === 1 && streakResult.previousStreak === 0
// // // //           });
// // // //           setShowCelebration(true);
// // // //         }
// // // //       } catch (streakError) {
// // // //         console.error('Error updating streak:', streakError);
// // // //       }

// // // //       if (isMounted.current) {
// // // //         setContent('');
// // // //         setSelectedImages([]);
// // // //         setIsAnonymous(false);
// // // //         setAnonymousAvatar(getRandomAnonymousAvatar());
        
// // // //         // Don't navigate back immediately if showing celebration
// // // //         if (!showCelebration) {
// // // //           router.back();
// // // //         }
// // // //       }
// // // //     } catch (error) {
// // // //       console.error('Error creating post:', error);
// // // //       networkErrorHandler.showErrorToUser(error);
// // // //     } finally {
// // // //       setIsPosting(false);
// // // //     }
// // // //   };

// // // //   const handleAnonymousToggle = (value) => {
// // // //     setIsAnonymous(value);
// // // //     if (value) {
// // // //       setAnonymousAvatar(getRandomAnonymousAvatar());
// // // //     }
// // // //   };

// // // //   const handleCelebrationClose = () => {
// // // //     setShowCelebration(false);
// // // //     router.back();
// // // //   };

// // // //   const renderImageGrid = () => {
// // // //     if (selectedImages.length === 0) return null;

// // // //     return (
// // // //       <View style={styles.imageGrid}>
// // // //         {selectedImages.map((image, index) => (
// // // //           <View key={index} style={styles.imageContainer}>
// // // //             <Image source={{ uri: image.uri }} style={styles.selectedImage} />
// // // //             <TouchableOpacity
// // // //               onPress={() => removeImage(index)}
// // // //               style={styles.removeImageButton}
// // // //             >
// // // //               <Ionicons name="close" size={16} color="#FFFFFF" />
// // // //             </TouchableOpacity>
// // // //           </View>
// // // //         ))}
// // // //       </View>
// // // //     );
// // // //   };

// // // //   const renderHotPost = () => {
// // // //     if (hotPosts.length === 0) return null;

// // // //     const post = hotPosts[0];
// // // //     return (
// // // //       <View style={styles.hotPostContainer}>
// // // //         <View style={styles.hotPostHeader}>
// // // //           <Ionicons name="flame" size={16} color="#FF6B6B" />
// // // //           <Text style={styles.hotPostTitle}>Trending from yesterday</Text>
// // // //         </View>
// // // //         <TouchableOpacity style={styles.hotPostCard}>
// // // //           <Image source={{ uri: post.images[0] }} style={styles.hotPostImage} />
// // // //           <LinearGradient
// // // //             colors={['transparent', 'rgba(0,0,0,0.8)']}
// // // //             style={styles.hotPostGradient}
// // // //           >
// // // //             <Text style={styles.hotPostUsername}>
// // // //               {post.is_anonymous ? 'Anonymous User' : (post.user_name || 'Anonymous')}
// // // //             </Text>
// // // //             <View style={styles.hotPostStats}>
// // // //               <View style={styles.statItem}>
// // // //                 <Ionicons name="heart" size={12} color="#FF6B6B" />
// // // //                 <Text style={styles.statText}>{post.like_count || 0}</Text>
// // // //               </View>
// // // //               <View style={styles.statItem}>
// // // //                 <Ionicons name="chatbubble" size={12} color="#3B82F6" />
// // // //                 <Text style={styles.statText}>{post.comment_count || 0}</Text>
// // // //               </View>
// // // //             </View>
// // // //           </LinearGradient>
// // // //         </TouchableOpacity>
// // // //       </View>
// // // //     );
// // // //   };

// // // //   if (!user?.id) {
// // // //     return (
// // // //       <View style={styles.loadingContainer}>
// // // //         <ActivityIndicator size="large" color={COLORS.accent} />
// // // //         <Text style={styles.loadingText}>Loading...</Text>
// // // //       </View>
// // // //     );
// // // //   }

// // // //   return (
// // // //     <SafeAreaView style={styles.container}>
// // // //       <KeyboardAvoidingView
// // // //         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
// // // //         style={styles.keyboardAvoidingView}
// // // //       >
// // // //         {/* Header */}
// // // //         <View style={styles.header}>
// // // //           <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
// // // //             <Ionicons name="close" size={24} color={COLORS.text} />
// // // //           </TouchableOpacity>

// // // //           <Text style={styles.headerTitle}>Create Post</Text>

// // // //           <View style={styles.headerActions}>
// // // //             <TouchableOpacity
// // // //               onPress={() => {
// // // //                 setContent('');
// // // //                 setSelectedImages([]);
// // // //                 setIsAnonymous(false);
// // // //                 fetchHotPosts();
// // // //               }}
// // // //               style={styles.refreshButton}
// // // //             >
// // // //               <Ionicons name="refresh" size={20} color={COLORS.accent} />
// // // //             </TouchableOpacity>
            
// // // //             <TouchableOpacity
// // // //               onPress={handlePost}
// // // //               disabled={isPosting || (!content.trim() && selectedImages.length === 0)}
// // // //               style={[
// // // //                 styles.postButton,
// // // //                 {
// // // //                   opacity: isPosting || (!content.trim() && selectedImages.length === 0) ? 0.5 : 1,
// // // //                 }
// // // //               ]}
// // // //             >
// // // //               {isPosting ? (
// // // //                 <ActivityIndicator color="#FFFFFF" size="small" />
// // // //               ) : (
// // // //                 <Text style={styles.postButtonText}>Post</Text>
// // // //               )}
// // // //             </TouchableOpacity>
// // // //           </View>
// // // //         </View>

// // // //         <ScrollView
// // // //           style={styles.content}
// // // //           contentContainerStyle={[
// // // //             styles.contentContainer,
// // // //             { paddingBottom: isKeyboardVisible ? keyboardHeight + 20 : 120 }
// // // //           ]}
// // // //           keyboardShouldPersistTaps="handled"
// // // //           showsVerticalScrollIndicator={false}
// // // //         >
// // // //           {/* User Info */}
// // // //           <View style={styles.userInfo}>
// // // //             <Image
// // // //               source={{ 
// // // //                 uri: isAnonymous ? anonymousAvatar : (user?.photoURL || 'https://via.placeholder.com/40') 
// // // //               }}
// // // //               style={styles.avatar}
// // // //             />
// // // //             <View style={styles.userDetails}>
// // // //               <Text style={styles.username}>
// // // //                 {isAnonymous ? 'Anonymous User' : (user?.user_name || user?.email || 'User')}
// // // //               </Text>
// // // //               {isAnonymous && (
// // // //                 <Text style={styles.anonymousLabel}>Your identity is hidden</Text>
// // // //               )}
// // // //             </View>
// // // //           </View>

// // // //           {/* Post Input */}
// // // //           <TextInput
// // // //             value={content}
// // // //             onChangeText={setContent}
// // // //             placeholder="What's on your mind?"
// // // //             placeholderTextColor={COLORS.textMuted}
// // // //             multiline
// // // //             style={styles.textInput}
// // // //             autoFocus
// // // //           />

// // // //           {/* Selected Images */}
// // // //           {renderImageGrid()}

// // // //           {/* Hot Post */}
// // // //           {renderHotPost()}
// // // //         </ScrollView>

// // // //         {/* Bottom Actions - Fixed at bottom */}
// // // //         <View style={[
// // // //           styles.bottomActions,
// // // //           { 
// // // //             bottom: isKeyboardVisible ? keyboardHeight : 0,
// // // //             paddingBottom: isKeyboardVisible ? 12 : (Platform.OS === 'ios' ? 34 : 12)
// // // //           }
// // // //         ]}>
// // // //           <View style={styles.actionButtons}>
// // // //             <TouchableOpacity
// // // //               onPress={pickImage}
// // // //               style={[
// // // //                 styles.imageButton,
// // // //                 { opacity: selectedImages.length >= MAX_IMAGES ? 0.5 : 1 }
// // // //               ]}
// // // //               disabled={selectedImages.length >= MAX_IMAGES}
// // // //             >
// // // //               <Ionicons 
// // // //                 name="image" 
// // // //                 size={24} 
// // // //                 color={selectedImages.length >= MAX_IMAGES ? COLORS.textMuted : COLORS.accent} 
// // // //               />
// // // //               {selectedImages.length > 0 && (
// // // //                 <View style={styles.imageBadge}>
// // // //                   <Text style={styles.imageBadgeText}>{selectedImages.length}</Text>
// // // //                 </View>
// // // //               )}
// // // //             </TouchableOpacity>

// // // //             <View style={styles.anonymousToggle}>
// // // //               <Ionicons 
// // // //                 name={isAnonymous ? "eye-off" : "eye"} 
// // // //                 size={18} 
// // // //                 color={isAnonymous ? COLORS.accent : COLORS.textMuted} 
// // // //               />
// // // //               <Text style={[styles.anonymousText, { color: isAnonymous ? COLORS.accent : COLORS.text }]}>
// // // //                 Go Incognito
// // // //               </Text>
// // // //               <Switch
// // // //                 value={isAnonymous}
// // // //                 onValueChange={handleAnonymousToggle}
// // // //                 trackColor={{ false: '#3f3f46', true: COLORS.accent }}
// // // //                 thumbColor={isAnonymous ? '#FFFFFF' : '#f4f3f4'}
// // // //                 style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
// // // //               />
// // // //             </View>
// // // //           </View>
// // // //         </View>

// // // //         {/* Streak Celebration Modal */}
// // // //         <StreakCelebrationModal
// // // //           visible={showCelebration}
// // // //           onClose={handleCelebrationClose}
// // // //           streakCount={celebrationData.streakCount}
// // // //           previousStreak={celebrationData.previousStreak}
// // // //           isFirstStreak={celebrationData.isFirstStreak}
// // // //         />
// // // //       </KeyboardAvoidingView>
// // // //     </SafeAreaView>
// // // //   );
// // // // }

// // // // const styles = StyleSheet.create({
// // // //   container: {
// // // //     flex: 1,
// // // //     backgroundColor: COLORS.background,
// // // //   },
// // // //   keyboardAvoidingView: {
// // // //     flex: 1,
// // // //   },
// // // //   loadingContainer: {
// // // //     flex: 1,
// // // //     backgroundColor: COLORS.background,
// // // //     justifyContent: 'center',
// // // //     alignItems: 'center',
// // // //   },
// // // //   loadingText: {
// // // //     color: COLORS.text,
// // // //     marginTop: 12,
// // // //     fontSize: 16,
// // // //     fontFamily: Fonts.GeneralSans.Regular,
// // // //   },
// // // //   header: {
// // // //     flexDirection: 'row',
// // // //     justifyContent: 'space-between',
// // // //     alignItems: 'center',
// // // //     paddingHorizontal: 16,
// // // //     paddingVertical: 16,
// // // //     borderBottomWidth: 1,
// // // //     borderBottomColor: COLORS.border,
// // // //     backgroundColor: COLORS.surface,
// // // //   },
// // // //   headerButton: {
// // // //     width: 40,
// // // //     height: 40,
// // // //     borderRadius: 20,
// // // //     alignItems: 'center',
// // // //     justifyContent: 'center',
// // // //   },
// // // //   headerTitle: {
// // // //     fontSize: 18,
// // // //     fontFamily: Fonts.GeneralSans.Semibold,
// // // //     color: COLORS.text,
// // // //   },
// // // //   headerActions: {
// // // //     flexDirection: 'row',
// // // //     alignItems: 'center',
// // // //     gap: 8,
// // // //   },
// // // //   refreshButton: {
// // // //     padding: 8,
// // // //   },
// // // //   postButton: {
// // // //     backgroundColor: COLORS.accent,
// // // //     paddingHorizontal: 20,
// // // //     paddingVertical: 10,
// // // //     borderRadius: 24,
// // // //     minWidth: 80,
// // // //     alignItems: 'center',
// // // //   },
// // // //   postButtonText: {
// // // //     color: '#FFFFFF',
// // // //     fontSize: 16,
// // // //     fontFamily: Fonts.GeneralSans.Semibold,
// // // //   },
// // // //   content: {
// // // //     flex: 1,
// // // //   },
// // // //   contentContainer: {
// // // //     padding: 16,
// // // //   },
// // // //   userInfo: {
// // // //     flexDirection: 'row',
// // // //     alignItems: 'center',
// // // //     marginBottom: 16,
// // // //   },
// // // //   avatar: {
// // // //     width: 48,
// // // //     height: 48,
// // // //     borderRadius: 24,
// // // //     marginRight: 12,
// // // //   },
// // // //   userDetails: {
// // // //     flex: 1,
// // // //   },
// // // //   username: {
// // // //     fontSize: 16,
// // // //     fontFamily: Fonts.GeneralSans.Semibold,
// // // //     color: COLORS.text,
// // // //   },
// // // //   anonymousLabel: {
// // // //     fontSize: 12,
// // // //     fontFamily: Fonts.GeneralSans.Regular,
// // // //     color: COLORS.accent,
// // // //     marginTop: 2,
// // // //   },
// // // //   textInput: {
// // // //     color: COLORS.text,
// // // //     fontSize: 18,
// // // //     fontFamily: Fonts.GeneralSans.Regular,
// // // //     lineHeight: 26,
// // // //     minHeight: 120,
// // // //     textAlignVertical: 'top',
// // // //     marginBottom: 16,
// // // //   },
// // // //   imageGrid: {
// // // //     flexDirection: 'row',
// // // //     flexWrap: 'wrap',
// // // //     gap: 8,
// // // //     marginBottom: 16,
// // // //   },
// // // //   imageContainer: {
// // // //     position: 'relative',
// // // //     width: (SCREEN_WIDTH - 48) / 2,
// // // //     height: 120,
// // // //   },
// // // //   selectedImage: {
// // // //     width: '100%',
// // // //     height: '100%',
// // // //     borderRadius: 12,
// // // //   },
// // // //   removeImageButton: {
// // // //     position: 'absolute',
// // // //     top: 8,
// // // //     right: 8,
// // // //     backgroundColor: 'rgba(0,0,0,0.7)',
// // // //     borderRadius: 16,
// // // //     width: 32,
// // // //     height: 32,
// // // //     alignItems: 'center',
// // // //     justifyContent: 'center',
// // // //   },
// // // //   hotPostContainer: {
// // // //     marginTop: 16,
// // // //   },
// // // //   hotPostHeader: {
// // // //     flexDirection: 'row',
// // // //     alignItems: 'center',
// // // //     marginBottom: 12,
// // // //   },
// // // //   hotPostTitle: {
// // // //     color: COLORS.text,
// // // //     fontSize: 16,
// // // //     fontFamily: Fonts.GeneralSans.Semibold,
// // // //     marginLeft: 8,
// // // //   },
// // // //   hotPostCard: {
// // // //     borderRadius: 12,
// // // //     overflow: 'hidden',
// // // //     backgroundColor: COLORS.cardBg,
// // // //   },
// // // //   hotPostImage: {
// // // //     width: '100%',
// // // //     height: 200,
// // // //   },
// // // //   hotPostGradient: {
// // // //     position: 'absolute',
// // // //     bottom: 0,
// // // //     left: 0,
// // // //     right: 0,
// // // //     padding: 16,
// // // //   },
// // // //   hotPostUsername: {
// // // //     color: COLORS.text,
// // // //     fontSize: 14,
// // // //     fontFamily: Fonts.GeneralSans.Medium,
// // // //     marginBottom: 8,
// // // //   },
// // // //   hotPostStats: {
// // // //     flexDirection: 'row',
// // // //     gap: 16,
// // // //   },
// // // //   statItem: {
// // // //     flexDirection: 'row',
// // // //     alignItems: 'center',
// // // //     gap: 4,
// // // //   },
// // // //   statText: {
// // // //     color: COLORS.text,
// // // //     fontSize: 12,
// // // //     fontFamily: Fonts.GeneralSans.Regular,
// // // //   },
// // // //   bottomActions: {
// // // //     position: 'absolute',
// // // //     left: 0,
// // // //     right: 0,
// // // //     backgroundColor: COLORS.surface,
// // // //     borderTopWidth: 1,
// // // //     borderTopColor: COLORS.border,
// // // //     paddingHorizontal: 16,
// // // //     paddingVertical: 12,
// // // //   },
// // // //   actionButtons: {
// // // //     flexDirection: 'row',
// // // //     justifyContent: 'space-between',
// // // //     alignItems: 'center',
// // // //   },
// // // //   imageButton: {
// // // //     width: 44,
// // // //     height: 44,
// // // //     borderRadius: 22,
// // // //     backgroundColor: COLORS.inputBg,
// // // //     alignItems: 'center',
// // // //     justifyContent: 'center',
// // // //     position: 'relative',
// // // //   },
// // // //   imageBadge: {
// // // //     position: 'absolute',
// // // //     top: -4,
// // // //     right: -4,
// // // //     backgroundColor: COLORS.accent,
// // // //     borderRadius: 10,
// // // //     width: 20,
// // // //     height: 20,
// // // //     alignItems: 'center',
// // // //     justifyContent: 'center',
// // // //   },
// // // //   imageBadgeText: {
// // // //     color: '#FFFFFF',
// // // //     fontSize: 10,
// // // //     fontFamily: Fonts.GeneralSans.Bold,
// // // //   },
// // // //   anonymousToggle: {
// // // //     flexDirection: 'row',
// // // //     alignItems: 'center',
// // // //     gap: 8,
// // // //   },
// // // //   anonymousText: {
// // // //     fontSize: 14,
// // // //     fontFamily: Fonts.GeneralSans.Medium,
// // // //   },
  
// // // //   // Modal Styles
// // // //   modalOverlay: {
// // // //     flex: 1,
// // // //     backgroundColor: 'rgba(0,0,0,0.8)',
// // // //     justifyContent: 'center',
// // // //     alignItems: 'center',
// // // //   },
// // // //   modalContent: {
// // // //     width: SCREEN_WIDTH - 40,
// // // //     maxWidth: 400,
// // // //     borderRadius: 24,
// // // //     overflow: 'hidden',
// // // //     position: 'relative',
// // // //   },
// // // //   modalGradient: {
// // // //     padding: 32,
// // // //     alignItems: 'center',
// // // //     position: 'relative',
// // // //   },
// // // //   fireIconContainer: {
// // // //     marginBottom: 16,
// // // //   },
// // // //   streakNumber: {
// // // //     fontSize: 64,
// // // //     fontFamily: Fonts.GeneralSans.Bold,
// // // //     color: '#FFFFFF',
// // // //     textAlign: 'center',
// // // //     marginBottom: 8,
// // // //   },
// // // //   streakLabel: {
// // // //     fontSize: 24,
// // // //     fontFamily: Fonts.GeneralSans.Semibold,
// // // //     color: '#FFFFFF',
// // // //     textAlign: 'center',
// // // //     marginBottom: 16,
// // // //   },
// // // //   celebrationMessage: {
// // // //     fontSize: 18,
// // // //     fontFamily: Fonts.GeneralSans.Medium,
// // // //     celebrationMessage: {
// // // //       fontSize: 18,
// // // //       fontFamily: Fonts.GeneralSans.Medium,
// // // //       color: '#FFFFFF',
// // // //       textAlign: 'center',
// // // //       marginBottom: 12,
// // // //       lineHeight: 24,
// // // //     },
// // // //     motivationText: {
// // // //       fontSize: 14,
// // // //       fontFamily: Fonts.GeneralSans.Regular,
// // // //       color: 'rgba(255,255,255,0.8)',
// // // //       textAlign: 'center',
// // // //       marginBottom: 24,
// // // //       lineHeight: 20,
// // // //     },
// // // //     celebrationButton: {
// // // //       backgroundColor: 'rgba(255,255,255,0.2)',
// // // //       paddingHorizontal: 32,
// // // //       paddingVertical: 12,
// // // //       borderRadius: 24,
// // // //       borderWidth: 1,
// // // //       borderColor: 'rgba(255,255,255,0.3)',
// // // //     },
// // // //     celebrationButtonText: {
// // // //       color: '#FFFFFF',
// // // //       fontSize: 16,
// // // //       fontFamily: Fonts.GeneralSans.Semibold,
// // // //       textAlign: 'center',
// // // //     },
// // // //     sparkle: {
// // // //       position: 'absolute',
// // // //     },
// // // //     sparkle1: {
// // // //       top: 20,
// // // //       left: 30,
// // // //     },
// // // //     sparkle2: {
// // // //       top: 60,
// // // //       right: 40,
// // // //     },
// // // //     sparkle3: {
// // // //       bottom: 80,
// // // //       left: 50,
// // // //     },
// // // //   });

// // // import React, { useState, useCallback, useRef, useEffect } from 'react';
// // // import {
// // //   View,
// // //   Text,
// // //   TextInput,
// // //   TouchableOpacity,
// // //   Image,
// // //   ScrollView,
// // //   KeyboardAvoidingView,
// // //   Platform,
// // //   ActivityIndicator,
// // //   Alert,
// // //   Switch,
// // //   StyleSheet,
// // //   Dimensions,
// // //   Modal,
// // //   Animated,
// // //   SafeAreaView,
// // //   Keyboard,
// // // } from 'react-native';
// // // import { useRouter } from 'expo-router';
// // // import { Ionicons } from '@expo/vector-icons';
// // // import * as ImagePicker from 'expo-image-picker';
// // // import { supabase } from '../../config/supabaseConfig';
// // // import { decode } from 'base64-arraybuffer';
// // // import networkErrorHandler from '../../utiles/networkErrorHandler';
// // // import { updateStreakForPost } from '../../(apis)/streaks';
// // // import { Fonts, TextStyles } from '../../constants/Fonts';
// // // import { LinearGradient } from 'expo-linear-gradient';
// // // import { useAuthStore } from '../../stores/useAuthStore';

// // // const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// // // const COLORS = {
// // //   background: '#000000',
// // //   surface: '#111111',
// // //   text: '#FFFFFF',
// // //   accent: '#8B5CF6',
// // //   textSecondary: '#E5E5E5',
// // //   textMuted: '#71717A',
// // //   inputBg: '#1A1A1A',
// // //   border: 'rgba(255, 255, 255, 0.1)',
// // //   cardBg: '#0F0F0F',
// // //   success: '#22C55E',
// // //   warning: '#F59E0B',
// // //   error: '#EF4444',
// // //   gradient: ['#8B5CF6', '#3B82F6'],
// // // };

// // // const DEFAULT_ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous&backgroundColor=8b5cf6';

// // // // Enhanced Streak Celebration Modal Component
// // // const StreakCelebrationModal = ({ visible, onClose, streakCount, previousStreak, isFirstStreak }) => {
// // //   const scaleAnim = useRef(new Animated.Value(0)).current;
// // //   const fadeAnim = useRef(new Animated.Value(0)).current;
// // //   const sparkleAnim = useRef(new Animated.Value(0)).current;

// // //   useEffect(() => {
// // //     if (visible) {
// // //       Animated.parallel([
// // //         Animated.spring(scaleAnim, {
// // //           toValue: 1,
// // //           tension: 50,
// // //           friction: 7,
// // //           useNativeDriver: true,
// // //         }),
// // //         Animated.timing(fadeAnim, {
// // //           toValue: 1,
// // //           duration: 300,
// // //           useNativeDriver: true,
// // //         }),
// // //         Animated.loop(
// // //           Animated.sequence([
// // //             Animated.timing(sparkleAnim, {
// // //               toValue: 1,
// // //               duration: 1000,
// // //               useNativeDriver: true,
// // //             }),
// // //             Animated.timing(sparkleAnim, {
// // //               toValue: 0,
// // //               duration: 1000,
// // //               useNativeDriver: true,
// // //             }),
// // //           ])
// // //         ),
// // //       ]).start();
// // //     }
// // //   }, [visible]);

// // //   const handleClose = () => {
// // //     Animated.parallel([
// // //       Animated.timing(scaleAnim, {
// // //         toValue: 0,
// // //         duration: 200,
// // //         useNativeDriver: true,
// // //       }),
// // //       Animated.timing(fadeAnim, {
// // //         toValue: 0,
// // //         duration: 200,
// // //         useNativeDriver: true,
// // //       }),
// // //     ]).start(() => {
// // //       onClose();
// // //     });
// // //   };

// // //   if (!visible) return null;

// // //   return (
// // //     <Modal
// // //       visible={visible}
// // //       transparent
// // //       animationType="none"
// // //       onRequestClose={handleClose}
// // //     >
// // //       <View style={styles.modalOverlay}>
// // //         <Animated.View
// // //           style={[
// // //             styles.modalContent,
// // //             {
// // //               transform: [{ scale: scaleAnim }],
// // //               opacity: fadeAnim,
// // //             },
// // //           ]}
// // //         >
// // //           <LinearGradient
// // //             colors={['#8B5CF6', '#3B82F6']}
// // //             style={styles.modalGradient}
// // //           >
// // //             <Animated.View
// // //               style={[
// // //                 styles.sparkle,
// // //                 styles.sparkle1,
// // //                 { opacity: sparkleAnim },
// // //               ]}
// // //             >
// // //               <Ionicons name="sparkles" size={24} color="#FFD700" />
// // //             </Animated.View>
// // //             <Animated.View
// // //               style={[
// // //                 styles.sparkle,
// // //                 styles.sparkle2,
// // //                 { opacity: sparkleAnim },
// // //               ]}
// // //             >
// // //               <Ionicons name="sparkles" size={18} color="#FFD700" />
// // //             </Animated.View>
// // //             <Animated.View
// // //               style={[
// // //                 styles.sparkle,
// // //                 styles.sparkle3,
// // //                 { opacity: sparkleAnim },
// // //               ]}
// // //             >
// // //               <Ionicons name="sparkles" size={20} color="#FFD700" />
// // //             </Animated.View>

// // //             <View style={styles.fireIconContainer}>
// // //               <Ionicons name="flame" size={60} color="#FF6B6B" />
// // //             </View>

// // //             <Text style={styles.streakNumber}>{streakCount}</Text>
// // //             <Text style={styles.streakLabel}>Day Streak!</Text>

// // //             <Text style={styles.celebrationMessage}>
// // //               {isFirstStreak
// // //                 ? "🎉 You've started your streak journey!"
// // //                 : `🔥 Amazing! You've maintained your streak for ${streakCount} days!`}
// // //             </Text>

// // //             <Text style={styles.motivationText}>
// // //               Keep posting daily to build your momentum! 💪
// // //             </Text>

// // //             <TouchableOpacity
// // //               style={styles.celebrationButton}
// // //               onPress={handleClose}
// // //             >
// // //               <Text style={styles.celebrationButtonText}>Continue</Text>
// // //             </TouchableOpacity>
// // //           </LinearGradient>
// // //         </Animated.View>
// // //       </View>
// // //     </Modal>
// // //   );
// // // };

// // // export default function CreatePost() {
// // //   const [content, setContent] = useState('');
// // //   const [selectedImages, setSelectedImages] = useState([]);
// // //   const [isPosting, setIsPosting] = useState(false);
// // //   const [showCelebration, setShowCelebration] = useState(false);
// // //   const [celebrationData, setCelebrationData] = useState({});
// // //   const { user } = useAuthStore();
// // //   const router = useRouter();
// // //   const isMounted = useRef(true);
// // //   const [isAnonymous, setIsAnonymous] = useState(false);
// // //   const [hotPosts, setHotPosts] = useState([]);
// // //   const [keyboardHeight, setKeyboardHeight] = useState(0);
// // //   const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
// // //   const MAX_IMAGES = 4;

// // //   // Keyboard handling
// // //   useEffect(() => {
// // //     const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
// // //       setKeyboardHeight(e.endCoordinates.height);
// // //       setIsKeyboardVisible(true);
// // //     });
// // //     const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
// // //       setKeyboardHeight(0);
// // //       setIsKeyboardVisible(false);
// // //     });

// // //     return () => {
// // //       keyboardDidShowListener?.remove();
// // //       keyboardDidHideListener?.remove();
// // //     };
// // //   }, []);

// // //   // Cleanup on unmount
// // //   useEffect(() => {
// // //     return () => {
// // //       isMounted.current = false;
// // //     };
// // //   }, []);

// // //   // Fetch hot posts on mount
// // //   useEffect(() => {
// // //     fetchHotPosts();
// // //   }, []);

// // //   const fetchHotPosts = async () => {
// // //     try {
// // //       const yesterday = new Date();
// // //       yesterday.setDate(yesterday.getDate() - 1);
// // //       yesterday.setHours(0, 0, 0, 0);
// // //       const yesterdayEnd = new Date(yesterday);
// // //       yesterdayEnd.setHours(23, 59, 59, 999);
      
// // //       const { data: hotPostsData, error } = await supabase
// // //         .from('posts')
// // //         .select('*')
// // //         .gte('created_at', yesterday.toISOString())
// // //         .lte('created_at', yesterdayEnd.toISOString())
// // //         .order('created_at', { ascending: false })
// // //         .limit(3);
        
// // //       if (!error && hotPostsData) {
// // //         const postsWithImages = hotPostsData.filter((post) => post.images && post.images.length > 0);
// // //         if (postsWithImages.length > 0) {
// // //           postsWithImages.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
// // //           setHotPosts([postsWithImages[0]]);
// // //         } else {
// // //           setHotPosts([]);
// // //         }
// // //       }
// // //     } catch (error) {
// // //       console.error('Error fetching hot posts:', error);
// // //     }
// // //   };

// // //   const pickImage = async () => {
// // //     if (selectedImages.length >= MAX_IMAGES) {
// // //       Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images per post.`);
// // //       return;
// // //     }

// // //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
// // //     if (status !== 'granted') {
// // //       Alert.alert(
// // //         'Permission Required',
// // //         'Please allow photo access to add images to your post.',
// // //         [
// // //           { text: 'Cancel', style: 'cancel' },
// // //           { text: 'Open Settings', onPress: () => {} }
// // //         ]
// // //       );
// // //       return;
// // //     }

// // //     try {
// // //       const result = await ImagePicker.launchImageLibraryAsync({
// // //         mediaTypes: ['images'],
// // //         allowsMultipleSelection: true,
// // //         quality: 0.8,
// // //         base64: true,
// // //         selectionLimit: MAX_IMAGES - selectedImages.length,
// // //       });

// // //       if (!result.canceled && result.assets) {
// // //         setSelectedImages(prev => [...prev, ...result.assets]);
// // //       }
// // //     } catch (error) {
// // //       console.error('Error picking image:', error);
// // //       Alert.alert('Error', 'Failed to select images. Please try again.');
// // //     }
// // //   };

// // //   const removeImage = (index) => {
// // //     setSelectedImages(prev => prev.filter((_, i) => i !== index));
// // //   };

// // //   const uploadImage = async (base64Image) => {
// // //     try {
// // //       const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
// // //       const filePath = `public/${fileName}`;
// // //       const contentType = 'image/jpeg';

// // //       const { data, error } = await supabase.storage
// // //         .from('posts')
// // //         .upload(filePath, decode(base64Image), {
// // //           contentType,
// // //           upsert: true,
// // //         });

// // //       if (error) throw error;

// // //       const { data: { publicUrl } } = supabase.storage
// // //         .from('posts')
// // //         .getPublicUrl(filePath);

// // //       return publicUrl;
// // //     } catch (error) {
// // //       console.error('Error uploading image:', error);
// // //       throw error;
// // //     }
// // //   };

// // //   const handlePost = async () => {
// // //     if (!content.trim() && selectedImages.length === 0) {
// // //       Alert.alert('Empty Post', 'Please add some content or images to your post.');
// // //       return;
// // //     }

// // //     try {
// // //       setIsPosting(true);
// // //       let imageUrls = [];

// // //       if (selectedImages.length > 0) {
// // //         const uploadPromises = selectedImages.map(image => uploadImage(image.base64));
// // //         imageUrls = await Promise.all(uploadPromises);
// // //         imageUrls = imageUrls.filter(url => url !== null);
// // //       }

// // //       const now = new Date();
// // //       const lastPost = await supabase
// // //         .from('posts')
// // //         .select('created_at')
// // //         .eq('user_id', user.id)
// // //         .order('created_at', { ascending: false })
// // //         .limit(1)
// // //         .single();

// // //       const isFirstPostOfDay = !lastPost.data || new Date(lastPost.data.created_at).toDateString() !== now.toDateString();

// // //       const postData = {
// // //         user_id: user.id,
// // //         content: content.trim(),
// // //         images: imageUrls,
// // //         is_anonymous: isAnonymous,
// // //         user_name: isAnonymous ? 'Anonymous User' : (user.user_name || user.email),
// // //         user_avatar: isAnonymous ? DEFAULT_ANONYMOUS_AVATAR : (user.photoURL || 'https://via.placeholder.com/40'),
// // //         anonymous_id: isAnonymous ? `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
// // //       };

// // //       const { data: post, error } = await supabase
// // //         .from('posts')
// // //         .insert([postData])
// // //         .select()
// // //         .single();

// // //       if (error) throw error;

// // //       // Update streak for post creation
// // //       try {
// // //         const streakResult = await updateStreakForPost(user.id);
// // //         if (streakResult.streakIncreased || (isFirstPostOfDay && streakResult.current_streak > 0)) {
// // //           setCelebrationData({
// // //             streakCount: streakResult.current_streak,
// // //             previousStreak: streakResult.previousStreak,
// // //             isFirstStreak: streakResult.current_streak === 1 && streakResult.previousStreak === 0
// // //           });
// // //           setShowCelebration(true);
// // //         }
// // //       } catch (streakError) {
// // //         console.error('Error updating streak:', streakError);
// // //       }

// // //       if (isMounted.current) {
// // //         setContent('');
// // //         setSelectedImages([]);
// // //         setIsAnonymous(false);
        
// // //         if (!showCelebration) {
// // //           router.back();
// // //         }
// // //       }
// // //     } catch (error) {
// // //       console.error('Error creating post:', error);
// // //       networkErrorHandler.showErrorToUser(error);
// // //     } finally {
// // //       setIsPosting(false);
// // //     }
// // //   };

// // //   const handleAnonymousToggle = (value) => {
// // //     setIsAnonymous(value);
// // //   };

// // //   const handleCelebrationClose = () => {
// // //     setShowCelebration(false);
// // //     router.back();
// // //   };

// // //   const renderImageGrid = () => {
// // //     if (selectedImages.length === 0) return null;

// // //     return (
// // //       <View style={styles.imageGrid}>
// // //         {selectedImages.map((image, index) => (
// // //           <View key={index} style={styles.imageContainer}>
// // //             <Image source={{ uri: image.uri }} style={styles.selectedImage} />
// // //             <TouchableOpacity
// // //               onPress={() => removeImage(index)}
// // //               style={styles.removeImageButton}
// // //             >
// // //               <Ionicons name="close" size={16} color="#FFFFFF" />
// // //             </TouchableOpacity>
// // //           </View>
// // //         ))}
// // //       </View>
// // //     );
// // //   };

// // //   const renderHotPost = () => {
// // //     if (hotPosts.length === 0) return null;

// // //     const post = hotPosts[0];
// // //     return (
// // //       <View style={styles.hotPostContainer}>
// // //         <View style={styles.hotPostHeader}>
// // //           <Ionicons name="flame" size={16} color="#FF6B6B" />
// // //           <Text style={styles.hotPostTitle}>Trending from yesterday</Text>
// // //         </View>
// // //         <TouchableOpacity style={styles.hotPostCard}>
// // //           <Image source={{ uri: post.images[0] }} style={styles.hotPostImage} />
// // //           <LinearGradient
// // //             colors={['transparent', 'rgba(0,0,0,0.8)']}
// // //             style={styles.hotPostGradient}
// // //           >
// // //             <Text style={styles.hotPostUsername}>
// // //               {post.is_anonymous ? 'Anonymous User' : (post.user_name || 'Anonymous')}
// // //             </Text>
// // //             <View style={styles.hotPostStats}>
// // //               <View style={styles.statItem}>
// // //                 <Ionicons name="heart" size={12} color="#FF6B6B" />
// // //                 <Text style={styles.statText}>{post.like_count || 0}</Text>
// // //               </View>
// // //               <View style={styles.statItem}>
// // //                 <Ionicons name="chatbubble" size={12} color="#3B82F6" />
// // //                 <Text style={styles.statText}>{post.comment_count || 0}</Text>
// // //               </View>
// // //             </View>
// // //           </LinearGradient>
// // //         </TouchableOpacity>
// // //       </View>
// // //     );
// // //   };

// // //   if (!user?.id) {
// // //     return (
// // //       <View style={styles.loadingContainer}>
// // //         <ActivityIndicator size="large" color={COLORS.accent} />
// // //         <Text style={styles.loadingText}>Loading...</Text>
// // //       </View>
// // //     );
// // //   }

// // //   return (
// // //     <SafeAreaView style={styles.container}>
// // //       <KeyboardAvoidingView
// // //         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
// // //         style={styles.keyboardAvoidingView}
// // //       >
// // //         <View style={styles.header}>
// // //           <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
// // //             <Ionicons name="close" size={24} color={COLORS.text} />
// // //           </TouchableOpacity>

// // //           <Text style={styles.headerTitle}>Create Post</Text>

// // //           <View style={styles.headerActions}>
// // //             <TouchableOpacity
// // //               onPress={() => {
// // //                 setContent('');
// // //                 setSelectedImages([]);
// // //                 setIsAnonymous(false);
// // //                 fetchHotPosts();
// // //               }}
// // //               style={styles.refreshButton}
// // //             >
// // //               <Ionicons name="refresh" size={20} color={COLORS.accent} />
// // //             </TouchableOpacity>
            
// // //             <TouchableOpacity
// // //               onPress={handlePost}
// // //               disabled={isPosting || (!content.trim() && selectedImages.length === 0)}
// // //               style={[
// // //                 styles.postButton,
// // //                 {
// // //                   opacity: isPosting || (!content.trim() && selectedImages.length === 0) ? 0.5 : 1,
// // //                 }
// // //               ]}
// // //             >
// // //               {isPosting ? (
// // //                 <ActivityIndicator color="#FFFFFF" size="small" />
// // //               ) : (
// // //                 <Text style={styles.postButtonText}>Post</Text>
// // //               )}
// // //             </TouchableOpacity>
// // //           </View>
// // //         </View>

// // //         <ScrollView
// // //           style={styles.content}
// // //           contentContainerStyle={styles.contentContainer}
// // //           keyboardShouldPersistTaps="handled"
// // //           showsVerticalScrollIndicator={false}
// // //         >
// // //           <View style={styles.userInfo}>
// // //             <Image
// // //               source={{ 
// // //                 uri: isAnonymous ? DEFAULT_ANONYMOUS_AVATAR : (user?.photoURL || 'https://via.placeholder.com/40') 
// // //               }}
// // //               style={styles.avatar}
// // //             />
// // //             <View style={styles.userDetails}>
// // //               <Text style={styles.username}>
// // //                 {isAnonymous ? 'Anonymous User' : (user?.user_name || user?.email || 'User')}
// // //               </Text>
// // //               {isAnonymous && (
// // //                 <Text style={styles.anonymousLabel}>Your identity is hidden</Text>
// // //               )}
// // //             </View>
// // //           </View>

// // //           <TextInput
// // //             value={content}
// // //             onChangeText={setContent}
// // //             placeholder="What's on your mind?"
// // //             placeholderTextColor={COLORS.textMuted}
// // //             multiline
// // //             style={styles.textInput}
// // //             autoFocus
// // //           />

// // //           {renderImageGrid()}

// // //           {renderHotPost()}
// // //         </ScrollView>

// // //         <View style={[
// // //           styles.bottomActions,
// // //           {
// // //             paddingBottom: isKeyboardVisible ? keyboardHeight + 12 : (Platform.OS === 'ios' ? 34 : 12),
// // //           },
// // //         ]}>
// // //           <View style={styles.actionButtons}>
// // //             <TouchableOpacity
// // //               onPress={pickImage}
// // //               style={[
// // //                 styles.imageButton,
// // //                 { opacity: selectedImages.length >= MAX_IMAGES ? 0.5 : 1 }
// // //               ]}
// // //               disabled={selectedImages.length >= MAX_IMAGES}
// // //             >
// // //               <Ionicons 
// // //                 name="image" 
// // //                 size={24} 
// // //                 color={selectedImages.length >= MAX_IMAGES ? COLORS.textMuted : COLORS.accent} 
// // //               />
// // //               {selectedImages.length > 0 && (
// // //                 <View style={styles.imageBadge}>
// // //                   <Text style={styles.imageBadgeText}>{selectedImages.length}</Text>
// // //                 </View>
// // //               )}
// // //             </TouchableOpacity>

// // //             <View style={styles.anonymousToggle}>
// // //               <Ionicons 
// // //                 name={isAnonymous ? "eye-off" : "eye"} 
// // //                 size={18} 
// // //                 color={isAnonymous ? COLORS.accent : COLORS.textMuted} 
// // //               />
// // //               <Text style={[styles.anonymousText, { color: isAnonymous ? COLORS.accent : COLORS.text }]}>
// // //                 Go Incognito
// // //               </Text>
// // //               <Switch
// // //                 value={isAnonymous}
// // //                 onValueChange={handleAnonymousToggle}
// // //                 trackColor={{ false: '#3f3f46', true: COLORS.accent }}
// // //                 thumbColor={isAnonymous ? '#FFFFFF' : '#f4f3f4'}
// // //                 style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
// // //               />
// // //             </View>
// // //           </View>
// // //         </View>

// // //         <StreakCelebrationModal
// // //           visible={showCelebration}
// // //           onClose={handleCelebrationClose}
// // //           streakCount={celebrationData.streakCount}
// // //           previousStreak={celebrationData.previousStreak}
// // //           isFirstStreak={celebrationData.isFirstStreak}
// // //         />
// // //       </KeyboardAvoidingView>
// // //     </SafeAreaView>
// // //   );
// // // }

// // // const styles = StyleSheet.create({
// // //   container: {
// // //     flex: 1,
// // //     backgroundColor: COLORS.background,
// // //   },
// // //   keyboardAvoidingView: {
// // //     flex: 1,
// // //   },
// // //   loadingContainer: {
// // //     flex: 1,
// // //     backgroundColor: COLORS.background,
// // //     justifyContent: 'center',
// // //     alignItems: 'center',
// // //   },
// // //   loadingText: {
// // //     color: COLORS.text,
// // //     marginTop: 12,
// // //     fontSize: 16,
// // //     fontFamily: Fonts.GeneralSans.Regular,
// // //   },
// // //   header: {
// // //     flexDirection: 'row',
// // //     justifyContent: 'space-between',
// // //     alignItems: 'center',
// // //     paddingHorizontal: 16,
// // //     paddingVertical: 16,
// // //     borderBottomWidth: 1,
// // //     borderBottomColor: COLORS.border,
// // //     backgroundColor: COLORS.surface,
// // //   },
// // //   headerButton: {
// // //     width: 40,
// // //     height: 40,
// // //     borderRadius: 20,
// // //     alignItems: 'center',
// // //     justifyContent: 'center',
// // //   },
// // //   headerTitle: {
// // //     fontSize: 18,
// // //     fontFamily: Fonts.GeneralSans.Semibold,
// // //     color: COLORS.text,
// // //   },
// // //   headerActions: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     gap: 8,
// // //   },
// // //   refreshButton: {
// // //     padding: 8,
// // //   },
// // //   postButton: {
// // //     backgroundColor: COLORS.accent,
// // //     paddingHorizontal: 20,
// // //     paddingVertical: 10,
// // //     borderRadius: 24,
// // //     minWidth: 80,
// // //     alignItems: 'center',
// // //   },
// // //   postButtonText: {
// // //     color: '#FFFFFF',
// // //     fontSize: 16,
// // //     fontFamily: Fonts.GeneralSans.Semibold,
// // //   },
// // //   content: {
// // //     flex: 1,
// // //   },
// // //   contentContainer: {
// // //     padding: 16,
// // //     paddingBottom: 120, // Ensure space for bottom actions
// // //   },
// // //   userInfo: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     marginBottom: 16,
// // //   },
// // //   avatar: {
// // //     width: 48,
// // //     height: 48,
// // //     borderRadius: 24,
// // //     marginRight: 12,
// // //   },
// // //   userDetails: {
// // //     flex: 1,
// // //   },
// // //   username: {
// // //     fontSize: 16,
// // //     fontFamily: Fonts.GeneralSans.Semibold,
// // //     color: COLORS.text,
// // //   },
// // //   anonymousLabel: {
// // //     fontSize: 12,
// // //     fontFamily: Fonts.GeneralSans.Regular,
// // //     color: COLORS.accent,
// // //     marginTop: 2,
// // //   },
// // //   textInput: {
// // //     color: COLORS.text,
// // //     fontSize: 18,
// // //     fontFamily: Fonts.GeneralSans.Regular,
// // //     lineHeight: 26,
// // //     minHeight: 120,
// // //     textAlignVertical: 'top',
// // //     marginBottom: 16,
// // //   },
// // //   imageGrid: {
// // //     flexDirection: 'row',
// // //     flexWrap: 'wrap',
// // //     gap: 8,
// // //     marginBottom: 16,
// // //   },
// // //   imageContainer: {
// // //     position: 'relative',
// // //     width: (SCREEN_WIDTH - 48) / 2,
// // //     height: 120,
// // //   },
// // //   selectedImage: {
// // //     width: '100%',
// // //     height: '100%',
// // //     borderRadius: 12,
// // //   },
// // //   removeImageButton: {
// // //     position: 'absolute',
// // //     top: 8,
// // //     right: 8,
// // //     backgroundColor: 'rgba(0,0,0,0.7)',
// // //     borderRadius: 16,
// // //     width: 32,
// // //     height: 32,
// // //     alignItems: 'center',
// // //     justifyContent: 'center',
// // //   },
// // //   hotPostContainer: {
// // //     marginTop: 16,
// // //   },
// // //   hotPostHeader: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     marginBottom: 12,
// // //   },
// // //   hotPostTitle: {
// // //     color: COLORS.text,
// // //     fontSize: 16,
// // //     fontFamily: Fonts.GeneralSans.Semibold,
// // //     marginLeft: 8,
// // //   },
// // //   hotPostCard: {
// // //     borderRadius: 12,
// // //     overflow: 'hidden',
// // //     backgroundColor: COLORS.cardBg,
// // //   },
// // //   hotPostImage: {
// // //     width: '100%',
// // //     height: 200,
// // //   },
// // //   hotPostGradient: {
// // //     position: 'absolute',
// // //     bottom: 0,
// // //     left: 0,
// // //     right: 0,
// // //     padding: 16,
// // //   },
// // //   hotPostUsername: {
// // //     color: COLORS.text,
// // //     fontSize: 14,
// // //     fontFamily: Fonts.GeneralSans.Medium,
// // //     marginBottom: 8,
// // //   },
// // //   hotPostStats: {
// // //     flexDirection: 'row',
// // //     gap: 16,
// // //   },
// // //   statItem: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     gap: 4,
// // //   },
// // //   statText: {
// // //     color: COLORS.text,
// // //     fontSize: 12,
// // //     fontFamily: Fonts.GeneralSans.Regular,
// // //   },
// // //   bottomActions: {
// // //     backgroundColor: COLORS.surface,
// // //     borderTopWidth: 1,
// // //     borderTopColor: COLORS.border,
// // //     paddingHorizontal: 16,
// // //     paddingVertical: 12,
// // //     marginTop: 'auto',
// // //   },
// // //   actionButtons: {
// // //     flexDirection: 'row',
// // //     justifyContent: 'space-between',
// // //     alignItems: 'center',
// // //   },
// // //   imageButton: {
// // //     width: 44,
// // //     height: 44,
// // //     borderRadius: 22,
// // //     backgroundColor: COLORS.inputBg,
// // //     alignItems: 'center',
// // //     justifyContent: 'center',
// // //     position: 'relative',
// // //   },
// // //   imageBadge: {
// // //     position: 'absolute',
// // //     top: -4,
// // //     right: -4,
// // //     backgroundColor: COLORS.accent,
// // //     borderRadius: 10,
// // //     width: 20,
// // //     height: 20,
// // //     alignItems: 'center',
// // //     justifyContent: 'center',
// // //   },
// // //   imageBadgeText: {
// // //     color: '#FFFFFF',
// // //     fontSize: 10,
// // //     fontFamily: Fonts.GeneralSans.Bold,
// // //   },
// // //   anonymousToggle: {
// // //     flexDirection: 'row',
// // //     alignItems: 'center',
// // //     gap: 8,
// // //   },
// // //   anonymousText: {
// // //     fontSize: 14,
// // //     fontFamily: Fonts.GeneralSans.Medium,
// // //   },
// // //   modalOverlay: {
// // //     flex: 1,
// // //     backgroundColor: 'rgba(0,0,0,0.8)',
// // //     justifyContent: 'center',
// // //     alignItems: 'center',
// // //   },
// // //   modalContent: {
// // //     width: SCREEN_WIDTH - 40,
// // //     maxWidth: 400,
// // //     borderRadius: 24,
// // //     overflow: 'hidden',
// // //     position: 'relative',
// // //   },
// // //   modalGradient: {
// // //     padding: 32,
// // //     alignItems: 'center',
// // //     position: 'relative',
// // //   },
// // //   fireIconContainer: {
// // //     marginBottom: 16,
// // //   },
// // //   streakNumber: {
// // //     fontSize: 64,
// // //     fontFamily: Fonts.GeneralSans.Bold,
// // //     color: '#FFFFFF',
// // //     textAlign: 'center',
// // //     marginBottom: 8,
// // //   },
// // //   streakLabel: {
// // //     fontSize: 24,
// // //     fontFamily: Fonts.GeneralSans.Semibold,
// // //     color: '#FFFFFF',
// // //     textAlign: 'center',
// // //     marginBottom: 16,
// // //   },
// // //   celebrationMessage: {
// // //     fontSize: 18,
// // //     fontFamily: Fonts.GeneralSans.Medium,
// // //     color: '#FFFFFF',
// // //     textAlign: 'center',
// // //     marginBottom: 12,
// // //     lineHeight: 24,
// // //   },
// // //   motivationText: {
// // //     fontSize: 14,
// // //     fontFamily: Fonts.GeneralSans.Regular,
// // //     color: 'rgba(255,255,255,0.8)',
// // //     textAlign: 'center',
// // //     marginBottom: 24,
// // //     lineHeight: 20,
// // //   },
// // //   celebrationButton: {
// // //     backgroundColor: 'rgba(255,255,255,0.2)',
// // //     paddingHorizontal: 32,
// // //     paddingVertical: 12,
// // //     borderRadius: 24,
// // //     borderWidth: 1,
// // //     borderColor: 'rgba(255,255,255,0.3)',
// // //   },
// // //   celebrationButtonText: {
// // //     color: '#FFFFFF',
// // //     fontSize: 16,
// // //     fontFamily: Fonts.GeneralSans.Semibold,
// // //     textAlign: 'center',
// // //   },
// // //   sparkle: {
// // //     position: 'absolute',
// // //   },
// // //   sparkle1: {
// // //     top: 20,
// // //     left: 30,
// // //   },
// // //   sparkle2: {
// // //     top: 60,
// // //     right: 40,
// // //   },
// // //   sparkle3: {
// // //     bottom: 80,
// // //     left: 50,
// // //   },
// // // });

// // import React, { useState, useCallback, useRef, useEffect } from 'react';
// // import {
// //   View,
// //   Text,
// //   TextInput,
// //   TouchableOpacity,
// //   Image,
// //   ScrollView,
// //   KeyboardAvoidingView,
// //   Platform,
// //   ActivityIndicator,
// //   Alert,
// //   Switch,
// //   StyleSheet,
// //   Dimensions,
// //   Modal,
// //   Animated,
// //   SafeAreaView,
// //   Keyboard,
// // } from 'react-native';
// // import { useRouter } from 'expo-router';
// // import { Ionicons } from '@expo/vector-icons';
// // import * as ImagePicker from 'expo-image-picker';
// // import { supabase } from '../../config/supabaseConfig';
// // import { decode } from 'base64-arraybuffer';
// // import networkErrorHandler from '../../utiles/networkErrorHandler';
// // import { updateStreakForPost } from '../../(apis)/streaks';
// // import { Fonts, TextStyles } from '../../constants/Fonts';
// // import { LinearGradient } from 'expo-linear-gradient';
// // import { useAuthStore } from '../../stores/useAuthStore';

// // const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// // const SPACING = 10;
// // const MAX_IMAGES = 4;

// // const COLORS = {
// //   background: '#000000',
// //   surface: '#111111',
// //   text: '#FFFFFF',
// //   accent: '#8B5CF6',
// //   textSecondary: '#E5E5E5',
// //   textMuted: '#71717A',
// //   inputBg: '#1A1A1A',
// //   border: 'rgba(255, 255, 255, 0.1)',
// //   cardBg: '#0F0F0F',
// //   success: '#22C55E',
// //   warning: '#F59E0B',
// //   error: '#EF4444',
// //   gradient: ['#8B5CF6', '#3B82F6'],
// // };

// // const DEFAULT_ANONYMOUS_AVATAR = 'https://api.dicebear.com/7.x/avataaars/png?seed=anonymous&backgroundColor=8b5cf6';

// // // Enhanced Streak Celebration Modal Component
// // const StreakCelebrationModal = ({ visible, onClose, streakCount, previousStreak, isFirstStreak }) => {
// //   const scaleAnim = useRef(new Animated.Value(0)).current;
// //   const fadeAnim = useRef(new Animated.Value(0)).current;
// //   const sparkleAnim = useRef(new Animated.Value(0)).current;

// //   useEffect(() => {
// //     if (visible) {
// //       Animated.parallel([
// //         Animated.spring(scaleAnim, {
// //           toValue: 1,
// //           tension: 50,
// //           friction: 7,
// //           useNativeDriver: true,
// //         }),
// //         Animated.timing(fadeAnim, {
// //           toValue: 1,
// //           duration: 300,
// //           useNativeDriver: true,
// //         }),
// //         Animated.loop(
// //           Animated.sequence([
// //             Animated.timing(sparkleAnim, {
// //               toValue: 1,
// //               duration: 1000,
// //               useNativeDriver: true,
// //             }),
// //             Animated.timing(sparkleAnim, {
// //               toValue: 0,
// //               duration: 1000,
// //               useNativeDriver: true,
// //             }),
// //           ])
// //         ),
// //       ]).start();
// //     }
// //   }, [visible]);

// //   const handleClose = () => {
// //     Animated.parallel([
// //       Animated.timing(scaleAnim, {
// //         toValue: 0,
// //         duration: 200,
// //         useNativeDriver: true,
// //       }),
// //       Animated.timing(fadeAnim, {
// //         toValue: 0,
// //         duration: 200,
// //         useNativeDriver: true,
// //       }),
// //     ]).start(() => {
// //       onClose();
// //     });
// //   };

// //   if (!visible) return null;

// //   return (
// //     <Modal
// //       visible={visible}
// //       transparent
// //       animationType="none"
// //       onRequestClose={handleClose}
// //     >
// //       <View style={styles.modalOverlay}>
// //         <Animated.View
// //           style={[
// //             styles.modalContent,
// //             {
// //               transform: [{ scale: scaleAnim }],
// //               opacity: fadeAnim,
// //             },
// //           ]}
// //         >
// //           <LinearGradient
// //             colors={['#8B5CF6', '#3B82F6']}
// //             style={styles.modalGradient}
// //           >
// //             <Animated.View
// //               style={[
// //                 styles.sparkle,
// //                 styles.sparkle1,
// //                 { opacity: sparkleAnim },
// //               ]}
// //             >
// //               <Ionicons name="sparkles" size={24} color="#FFD700" />
// //             </Animated.View>
// //             <Animated.View
// //               style={[
// //                 styles.sparkle,
// //                 styles.sparkle2,
// //                 { opacity: sparkleAnim },
// //               ]}
// //             >
// //               <Ionicons name="sparkles" size={18} color="#FFD700" />
// //             </Animated.View>
// //             <Animated.View
// //               style={[
// //                 styles.sparkle,
// //                 styles.sparkle3,
// //                 { opacity: sparkleAnim },
// //               ]}
// //             >
// //               <Ionicons name="sparkles" size={20} color="#FFD700" />
// //             </Animated.View>

// //             <View style={styles.fireIconContainer}>
// //               <Ionicons name="flame" size={60} color="#FF6B6B" />
// //             </View>

// //             <Text style={styles.streakNumber}>{streakCount}</Text>
// //             <Text style={styles.streakLabel}>Day Streak!</Text>

// //             <Text style={styles.celebrationMessage}>
// //               {isFirstStreak
// //                 ? "🎉 You've started your streak journey!"
// //                 : `🔥 Amazing! You've maintained your streak for ${streakCount} days!`}
// //             </Text>

// //             <Text style={styles.motivationText}>
// //               Keep posting daily to build your momentum! 💪
// //             </Text>

// //             <TouchableOpacity
// //               style={styles.celebrationButton}
// //               onPress={handleClose}
// //             >
// //               <Text style={styles.celebrationButtonText}>Continue</Text>
// //             </TouchableOpacity>
// //           </LinearGradient>
// //         </Animated.View>
// //       </View>
// //     </Modal>
// //   );
// // };

// // export default function CreatePost() {
// //   const [content, setContent] = useState('');
// //   const [selectedImages, setSelectedImages] = useState([]);
// //   const [isPosting, setIsPosting] = useState(false);
// //   const [showCelebration, setShowCelebration] = useState(false);
// //   const [celebrationData, setCelebrationData] = useState({});
// //   const { user } = useAuthStore();
// //   const router = useRouter();
// //   const isMounted = useRef(true);
// //   const [isAnonymous, setIsAnonymous] = useState(false);
// //   const [hotPosts, setHotPosts] = useState([]);
// //   const [keyboardHeight, setKeyboardHeight] = useState(0);
// //   const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

// //   const windowDimensions = Dimensions.get('window');
// //   const imageGridWidth = windowDimensions.width - (2 * SPACING * 3); // Account for padding and gaps

// //   // Keyboard handling
// //   useEffect(() => {
// //     const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
// //       setKeyboardHeight(e.endCoordinates.height);
// //       setIsKeyboardVisible(true);
// //     });
// //     const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
// //       setKeyboardHeight(0);
// //       setIsKeyboardVisible(false);
// //     });

// //     return () => {
// //       keyboardDidShowListener?.remove();
// //       keyboardDidHideListener?.remove();
// //     };
// //   }, []);

// //   // Cleanup on unmount
// //   useEffect(() => {
// //     return () => {
// //       isMounted.current = false;
// //     };
// //   }, []);

// //   // Fetch hot posts on mount
// //   useEffect(() => {
// //     fetchHotPosts();
// //   }, []);

// //   const fetchHotPosts = async () => {
// //     try {
// //       const yesterday = new Date();
// //       yesterday.setDate(yesterday.getDate() - 1);
// //       yesterday.setHours(0, 0, 0, 0);
// //       const yesterdayEnd = new Date(yesterday);
// //       yesterdayEnd.setHours(23, 59, 59, 999);
      
// //       const { data: hotPostsData, error } = await supabase
// //         .from('posts')
// //         .select('*')
// //         .gte('created_at', yesterday.toISOString())
// //         .lte('created_at', yesterdayEnd.toISOString())
// //         .order('created_at', { ascending: false })
// //         .limit(3);
        
// //       if (!error && hotPostsData) {
// //         const postsWithImages = hotPostsData.filter((post) => post.images && post.images.length > 0);
// //         if (postsWithImages.length > 0) {
// //           postsWithImages.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
// //           setHotPosts([postsWithImages[0]]);
// //         } else {
// //           setHotPosts([]);
// //         }
// //       }
// //     } catch (error) {
// //       console.error('Error fetching hot posts:', error);
// //     }
// //   };

// //   const pickImage = async () => {
// //     if (selectedImages.length >= MAX_IMAGES) {
// //       Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images per post.`);
// //       return;
// //     }

// //     const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
// //     if (status !== 'granted') {
// //       Alert.alert(
// //         'Permission Required',
// //         'Please allow photo access to add images to your post.',
// //         [
// //           { text: 'Cancel', style: 'cancel' },
// //           { text: 'Open Settings', onPress: () => {} }
// //         ]
// //       );
// //       return;
// //     }

// //     try {
// //       const result = await ImagePicker.launchImageLibraryAsync({
// //         mediaTypes: ['images'],
// //         allowsMultipleSelection: true,
// //         quality: 0.8,
// //         base64: true,
// //         selectionLimit: MAX_IMAGES - selectedImages.length,
// //       });

// //       if (!result.canceled && result.assets) {
// //         setSelectedImages(prev => [...prev, ...result.assets]);
// //       }
// //     } catch (error) {
// //       console.error('Error picking image:', error);
// //       Alert.alert('Error', 'Failed to select images. Please try again.');
// //     }
// //   };

// //   const removeImage = (index) => {
// //     setSelectedImages(prev => prev.filter((_, i) => i !== index));
// //   };

// //   const uploadImage = async (base64Image) => {
// //     try {
// //       const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
// //       const filePath = `public/${fileName}`;
// //       const contentType = 'image/jpeg';

// //       const { data, error } = await supabase.storage
// //         .from('posts')
// //         .upload(filePath, decode(base64Image), {
// //           contentType,
// //           upsert: true,
// //         });

// //       if (error) throw error;

// //       const { data: { publicUrl } } = supabase.storage
// //         .from('posts')
// //         .getPublicUrl(filePath);

// //       return publicUrl;
// //     } catch (error) {
// //       console.error('Error uploading image:', error);
// //       throw error;
// //     }
// //   };

// //   const handlePost = async () => {
// //     if (!content.trim() && selectedImages.length === 0) {
// //       Alert.alert('Empty Post', 'Please add some content or images to your post.');
// //       return;
// //     }

// //     try {
// //       setIsPosting(true);
// //       let imageUrls = [];

// //       if (selectedImages.length > 0) {
// //         const uploadPromises = selectedImages.map(image => uploadImage(image.base64));
// //         imageUrls = await Promise.all(uploadPromises);
// //         imageUrls = imageUrls.filter(url => url !== null);
// //       }

// //       const postData = {
// //         user_id: user.id,
// //         content: content.trim(),
// //         images: imageUrls,
// //         is_anonymous: isAnonymous,
// //         user_name: isAnonymous ? 'Anonymous User' : (user.user_name || user.email),
// //         user_avatar: isAnonymous ? DEFAULT_ANONYMOUS_AVATAR : (user.photoURL || 'https://via.placeholder.com/40'),
// //         anonymous_id: isAnonymous ? `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
// //       };

// //       const { data: post, error } = await supabase
// //         .from('posts')
// //         .insert([postData])
// //         .select()
// //         .single();

// //       if (error) throw error;

// //       // Update streak for post creation
// //       try {
// //         const streakResult = await updateStreakForPost(user.id);
// //         if (streakResult.streakIncreased) {
// //           setCelebrationData({
// //             streakCount: streakResult.current_streak,
// //             previousStreak: streakResult.previousStreak,
// //             isFirstStreak: streakResult.current_streak === 1 && streakResult.previousStreak === 0
// //           });
// //           setShowCelebration(true);
// //         }
// //       } catch (streakError) {
// //         console.error('Error updating streak:', streakError);
// //       }

// //       if (isMounted.current) {
// //         setContent('');
// //         setSelectedImages([]);
// //         setIsAnonymous(false);
        
// //         if (!showCelebration) {
// //           router.back();
// //         }
// //       }
// //     } catch (error) {
// //       console.error('Error creating post:', error);
// //       networkErrorHandler.showErrorToUser(error);
// //     } finally {
// //       setIsPosting(false);
// //     }
// //   };

// //   const handleAnonymousToggle = (value) => {
// //     setIsAnonymous(value);
// //   };

// //   const handleCelebrationClose = () => {
// //     setShowCelebration(false);
// //     router.back();
// //   };

// //   const renderImageGrid = () => {
// //     if (selectedImages.length === 0) return null;

// //     const imageWidth = (imageGridWidth - (SPACING * (Math.min(selectedImages.length, 2) - 1))) / Math.min(selectedImages.length, 2);
// //     const imageHeight = imageWidth * 1.2; // Maintain aspect ratio

// //     return (
// //       <View style={styles.imageGrid}>
// //         {selectedImages.map((image, index) => (
// //           <View key={index} style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
// //             <Image source={{ uri: image.uri }} style={styles.selectedImage} />
// //             <TouchableOpacity
// //               onPress={() => removeImage(index)}
// //               style={styles.removeImageButton}
// //             >
// //               <Ionicons name="close" size={16} color="#FFFFFF" />
// //             </TouchableOpacity>
// //           </View>
// //         ))}
// //       </View>
// //     );
// //   };

// //   const renderHotPost = () => {
// //     if (hotPosts.length === 0) return null;

// //     const post = hotPosts[0];
// //     const hotPostImageHeight = windowDimensions.width * 0.6; // 60% of screen width

// //     return (
// //       <View style={styles.hotPostContainer}>
// //         <View style={styles.hotPostHeader}>
// //           <Ionicons name="flame" size={16} color="#FF6B6B" />
// //           <Text style={styles.hotPostTitle}>Trending from yesterday</Text>
// //         </View>
// //         <TouchableOpacity style={styles.hotPostCard}>
// //           <Image source={{ uri: post.images[0] }} style={[styles.hotPostImage, { height: hotPostImageHeight }]} />
// //           <LinearGradient
// //             colors={['transparent', 'rgba(0,0,0,0.8)']}
// //             style={styles.hotPostGradient}
// //           >
// //             <Text style={styles.hotPostUsername}>
// //               {post.is_anonymous ? 'Anonymous User' : (post.user_name || 'Anonymous')}
// //             </Text>
// //             <View style={styles.hotPostStats}>
// //               <View style={styles.statItem}>
// //                 <Ionicons name="heart" size={12} color="#FF6B6B" />
// //                 <Text style={styles.statText}>{post.like_count || 0}</Text>
// //               </View>
// //               <View style={styles.statItem}>
// //                 <Ionicons name="chatbubble" size={12} color="#3B82F6" />
// //                 <Text style={styles.statText}>{post.comment_count || 0}</Text>
// //               </View>
// //             </View>
// //           </LinearGradient>
// //         </TouchableOpacity>
// //       </View>
// //     );
// //   };

// //   if (!user?.id) {
// //     return (
// //       <View style={styles.loadingContainer}>
// //         <ActivityIndicator size="large" color={COLORS.accent} />
// //         <Text style={styles.loadingText}>Loading...</Text>
// //       </View>
// //     );
// //   }

// //   return (
// //     <SafeAreaView style={styles.container}>
// //       <KeyboardAvoidingView
// //         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
// //         style={styles.keyboardAvoidingView}
// //       >
// //         <View style={styles.header}>
// //           <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
// //             <Ionicons name="close" size={24} color={COLORS.text} />
// //           </TouchableOpacity>

// //           <Text style={styles.headerTitle}>Create Post</Text>

// //           <View style={styles.headerActions}>
// //             <TouchableOpacity
// //               onPress={() => {
// //                 setContent('');
// //                 setSelectedImages([]);
// //                 setIsAnonymous(false);
// //                 fetchHotPosts();
// //               }}
// //               style={styles.refreshButton}
// //             >
// //               <Ionicons name="refresh" size={20} color={COLORS.accent} />
// //             </TouchableOpacity>
            
// //             <TouchableOpacity
// //               onPress={handlePost}
// //               disabled={isPosting || (!content.trim() && selectedImages.length === 0)}
// //               style={[
// //                 styles.postButton,
// //                 {
// //                   opacity: isPosting || (!content.trim() && selectedImages.length === 0) ? 0.5 : 1,
// //                 }
// //               ]}
// //             >
// //               {isPosting ? (
// //                 <ActivityIndicator color="#FFFFFF" size="small" />
// //               ) : (
// //                 <Text style={styles.postButtonText}>Post</Text>
// //               )}
// //             </TouchableOpacity>
// //           </View>
// //         </View>

// //         <ScrollView
// //           style={styles.content}
// //           contentContainerStyle={styles.contentContainer}
// //           keyboardShouldPersistTaps="handled"
// //           showsVerticalScrollIndicator={false}
// //         >
// //           <View style={styles.userInfo}>
// //             <Image
// //               source={{ 
// //                 uri: isAnonymous ? DEFAULT_ANONYMOUS_AVATAR : (user?.photoURL || 'https://via.placeholder.com/40') 
// //               }}
// //               style={styles.avatar}
// //             />
// //             <View style={styles.userDetails}>
// //               <Text style={styles.username}>
// //                 {isAnonymous ? 'Anonymous User' : (user?.user_name || user?.email || 'User')}
// //               </Text>
// //               {isAnonymous && (
// //                 <Text style={styles.anonymousLabel}>Your identity is hidden</Text>
// //               )}
// //             </View>
// //           </View>

// //           <TextInput
// //             value={content}
// //             onChangeText={setContent}
// //             placeholder="What's on your mind?"
// //             placeholderTextColor={COLORS.textMuted}
// //             multiline
// //             style={[styles.textInput, { height: Math.max(120, content.split('\n').length * 24) }]}
// //             autoFocus
// //           />

// //           {renderImageGrid()}

// //           {renderHotPost()}
// //         </ScrollView>

// //         <View style={[
// //           styles.bottomActions,
// //           {
// //             paddingBottom: isKeyboardVisible ? keyboardHeight + SPACING : (Platform.OS === 'ios' ? 34 : SPACING),
// //           },
// //         ]}>
// //           <View style={styles.actionButtons}>
// //             <TouchableOpacity
// //               onPress={pickImage}
// //               style={[
// //                 styles.imageButton,
// //                 { opacity: selectedImages.length >= MAX_IMAGES ? 0.5 : 1 }
// //               ]}
// //               disabled={selectedImages.length >= MAX_IMAGES}
// //             >
// //               <Ionicons 
// //                 name="image" 
// //                 size={24} 
// //                 color={selectedImages.length >= MAX_IMAGES ? COLORS.textMuted : COLORS.accent} 
// //               />
// //               {selectedImages.length > 0 && (
// //                 <View style={styles.imageBadge}>
// //                   <Text style={styles.imageBadgeText}>{selectedImages.length}</Text>
// //                 </View>
// //               )}
// //             </TouchableOpacity>

// //             <View style={styles.anonymousToggle}>
// //               <Ionicons 
// //                 name={isAnonymous ? "eye-off" : "eye"} 
// //                 size={18} 
// //                 color={isAnonymous ? COLORS.accent : COLORS.textMuted} 
// //               />
// //               <Text style={[styles.anonymousText, { color: isAnonymous ? COLORS.accent : COLORS.text }]}>
// //                 Go Incognito
// //               </Text>
// //               <Switch
// //                 value={isAnonymous}
// //                 onValueChange={handleAnonymousToggle}
// //                 trackColor={{ false: '#3f3f46', true: COLORS.accent }}
// //                 thumbColor={isAnonymous ? '#FFFFFF' : '#f4f3f4'}
// //                 style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
// //               />
// //             </View>
// //           </View>
// //         </View>

// //         <StreakCelebrationModal
// //           visible={showCelebration}
// //           onClose={handleCelebrationClose}
// //           streakCount={celebrationData.streakCount}
// //           previousStreak={celebrationData.previousStreak}
// //           isFirstStreak={celebrationData.isFirstStreak}
// //         />
// //       </KeyboardAvoidingView>
// //     </SafeAreaView>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     backgroundColor: COLORS.background,
// //   },
// //   keyboardAvoidingView: {
// //     flex: 1,
// //   },
// //   loadingContainer: {
// //     flex: 1,
// //     backgroundColor: COLORS.background,
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   loadingText: {
// //     color: COLORS.text,
// //     marginTop: 12,
// //     fontSize: 16,
// //     fontFamily: Fonts.GeneralSans.Regular,
// //   },
// //   header: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //     paddingHorizontal: SPACING,
// //     paddingVertical: SPACING,
// //     borderBottomWidth: 1,
// //     borderBottomColor: COLORS.border,
// //     backgroundColor: COLORS.surface,
// //   },
// //   headerButton: {
// //     width: 40,
// //     height: 40,
// //     borderRadius: 20,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   headerTitle: {
// //     fontSize: 18,
// //     fontFamily: Fonts.GeneralSans.Semibold,
// //     color: COLORS.text,
// //   },
// //   headerActions: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: SPACING / 2,
// //   },
// //   refreshButton: {
// //     padding: SPACING / 2,
// //   },
// //   postButton: {
// //     backgroundColor: COLORS.accent,
// //     paddingHorizontal: SPACING * 1.5,
// //     paddingVertical: SPACING,
// //     borderRadius: 24,
// //     minWidth: 80,
// //     alignItems: 'center',
// //   },
// //   postButtonText: {
// //     color: '#FFFFFF',
// //     fontSize: 16,
// //     fontFamily: Fonts.GeneralSans.Semibold,
// //   },
// //   content: {
// //     flex: 1,
// //   },
// //   contentContainer: {
// //     padding: SPACING,
// //     paddingBottom: SPACING * 12, // Ensure space for bottom actions
// //   },
// //   userInfo: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     marginBottom: SPACING,
// //   },
// //   avatar: {
// //     width: 48,
// //     height: 48,
// //     borderRadius: 24,
// //     marginRight: SPACING,
// //   },
// //   userDetails: {
// //     flex: 1,
// //   },
// //   username: {
// //     fontSize: 16,
// //     fontFamily: Fonts.GeneralSans.Semibold,
// //     color: COLORS.text,
// //   },
// //   anonymousLabel: {
// //     fontSize: 12,
// //     fontFamily: Fonts.GeneralSans.Regular,
// //     color: COLORS.accent,
// //     marginTop: 2,
// //   },
// //   textInput: {
// //     color: COLORS.text,
// //     fontSize: 18,
// //     fontFamily: Fonts.GeneralSans.Regular,
// //     lineHeight: 24,
// //     textAlignVertical: 'top',
// //     marginBottom: SPACING,
// //     padding: SPACING,
// //     backgroundColor: COLORS.inputBg,
// //     borderRadius: 12,
// //     borderWidth: 1,
// //     borderColor: COLORS.border,
// //   },
// //   imageGrid: {
// //     flexDirection: 'row',
// //     flexWrap: 'wrap',
// //     gap: SPACING,
// //     marginBottom: SPACING,
// //   },
// //   imageContainer: {
// //     position: 'relative',
// //     borderRadius: 12,
// //     overflow: 'hidden',
// //   },
// //   selectedImage: {
// //     width: '100%',
// //     height: '100%',
// //   },
// //   removeImageButton: {
// //     position: 'absolute',
// //     top: SPACING / 2,
// //     right: SPACING / 2,
// //     backgroundColor: 'rgba(0,0,0,0.7)',
// //     borderRadius: 16,
// //     width: 32,
// //     height: 32,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   hotPostContainer: {
// //     marginTop: SPACING,
// //   },
// //   hotPostHeader: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     marginBottom: SPACING / 2,
// //   },
// //   hotPostTitle: {
// //     color: COLORS.text,
// //     fontSize: 16,
// //     fontFamily: Fonts.GeneralSans.Semibold,
// //     marginLeft: SPACING,
// //   },
// //   hotPostCard: {
// //     borderRadius: 12,
// //     overflow: 'hidden',
// //     backgroundColor: COLORS.cardBg,
// //   },
// //   hotPostImage: {
// //     width: '100%',
// //   },
// //   hotPostGradient: {
// //     position: 'absolute',
// //     bottom: 0,
// //     left: 0,
// //     right: 0,
// //     padding: SPACING,
// //   },
// //   hotPostUsername: {
// //     color: COLORS.text,
// //     fontSize: 14,
// //     fontFamily: Fonts.GeneralSans.Medium,
// //     marginBottom: SPACING / 2,
// //   },
// //   hotPostStats: {
// //     flexDirection: 'row',
// //     gap: SPACING,
// //   },
// //   statItem: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: SPACING / 2,
// //   },
// //   statText: {
// //     color: COLORS.text,
// //     fontSize: 12,
// //     fontFamily: Fonts.GeneralSans.Regular,
// //   },
// //   bottomActions: {
// //     backgroundColor: COLORS.surface,
// //     borderTopWidth: 1,
// //     borderTopColor: COLORS.border,
// //     paddingHorizontal: SPACING,
// //     paddingVertical: SPACING,
// //     marginTop: 'auto',
// //   },
// //   actionButtons: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     alignItems: 'center',
// //   },
// //   imageButton: {
// //     width: 44,
// //     height: 44,
// //     borderRadius: 22,
// //     backgroundColor: COLORS.inputBg,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //     position: 'relative',
// //   },
// //   imageBadge: {
// //     position: 'absolute',
// //     top: -4,
// //     right: -4,
// //     backgroundColor: COLORS.accent,
// //     borderRadius: 10,
// //     width: 20,
// //     height: 20,
// //     alignItems: 'center',
// //     justifyContent: 'center',
// //   },
// //   imageBadgeText: {
// //     color: '#FFFFFF',
// //     fontSize: 10,
// //     fontFamily: Fonts.GeneralSans.Bold,
// //   },
// //   anonymousToggle: {
// //     flexDirection: 'row',
// //     alignItems: 'center',
// //     gap: SPACING,
// //   },
// //   anonymousText: {
// //     fontSize: 14,
// //     fontFamily: Fonts.GeneralSans.Medium,
// //   },
// //   modalOverlay: {
// //     flex: 1,
// //     backgroundColor: 'rgba(0,0,0,0.8)',
// //     justifyContent: 'center',
// //     alignItems: 'center',
// //   },
// //   modalContent: {
// //     width: SCREEN_WIDTH - (2 * SPACING),
// //     maxWidth: 400,
// //     borderRadius: 24,
// //     overflow: 'hidden',
// //     position: 'relative',
// //   },
// //   modalGradient: {
// //     padding: SPACING * 2,
// //     alignItems: 'center',
// //     position: 'relative',
// //   },
// //   fireIconContainer: {
// //     marginBottom: SPACING,
// //   },
// //   streakNumber: {
// //     fontSize: 64,
// //     fontFamily: Fonts.GeneralSans.Bold,
// //     color: '#FFFFFF',
// //     textAlign: 'center',
// //     marginBottom: SPACING,
// //   },
// //   streakLabel: {
// //     fontSize: 24,
// //     fontFamily: Fonts.GeneralSans.Semibold,
// //     color: '#FFFFFF',
// //     textAlign: 'center',
// //     marginBottom: SPACING,
// //   },
// //   celebrationMessage: {
// //     fontSize: 18,
// //     fontFamily: Fonts.GeneralSans.Medium,
// //     color: '#FFFFFF',
// //     textAlign: 'center',
// //     marginBottom: SPACING,
// //     lineHeight: 24,
// //   },
// //   motivationText: {
// //     fontSize: 14,
// //     fontFamily: Fonts.GeneralSans.Regular,
// //     color: 'rgba(255,255,255,0.8)',
// //     textAlign: 'center',
// //     marginBottom: SPACING * 2,
// //     lineHeight: 20,
// //   },
// //   celebrationButton: {
// //     backgroundColor: 'rgba(255,255,255,0.2)',
// //     paddingHorizontal: SPACING * 2,
// //     paddingVertical: SPACING,
// //     borderRadius: 24,
// //     borderWidth: 1,
// //     borderColor: 'rgba(255,255,255,0.3)',
// //   },
// //   celebrationButtonText: {
// //     color: '#FFFFFF',
// //     fontSize: 16,
// //     fontFamily: Fonts.GeneralSans.Semibold,
// //     textAlign: 'center',
// //   },
// //   sparkle: {
// //     position: 'absolute',
// //   },
// //   sparkle1: {
// //     top: SPACING,
// //     left: SPACING * 2,
// //   },
// //   sparkle2: {
// //     top: SPACING * 4,
// //     right: SPACING * 3,
// //   },
// //   sparkle3: {
// //     bottom: SPACING * 5,
// //     left: SPACING * 2,
// //   },
// // });

// import React, { useState, useCallback, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   Alert,
//   Switch,
//   Dimensions,
//   Modal,
//   Animated,
//   SafeAreaView,
//   Keyboard,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// const SPACING = 16;
// const MAX_IMAGES = 4;

// const COLORS = {
//   background: '#000000',
//   surface: '#000000',
//   text: '#FFFFFF',
//   accent: '#FFFFFF',
//   textSecondary: '#E5E5E5',
//   textMuted: '#71717A',
//   inputBg: '#000000',
//   border: 'rgba(255, 255, 255, 0.1)',
//   cardBg: '#000000',
//   success: '#22C55E',
//   warning: '#F59E0B',
//   error: '#EF4444',
//   gradient: ['#000000', '#000000'],
// };

// // Get initials from name
// const getInitials = (name) => {
//   if (!name) return 'U';
//   return name
//     .split(' ')
//     .map(word => word.charAt(0))
//     .join('')
//     .toUpperCase()
//     .slice(0, 2);
// };

// // Profile initials component
// const ProfileInitials = ({ name, isAnonymous, size = 48 }) => {
//   const initials = isAnonymous ? 'A' : getInitials(name);
//   const backgroundColor = isAnonymous ? '#666666' : '#333333';
  
//   return (
//     <View style={{
//       width: size,
//       height: size,
//       borderRadius: size / 2,
//       backgroundColor: backgroundColor,
//       alignItems: 'center',
//       justifyContent: 'center',
//       marginRight: 12,
//     }}>
//       <Text style={{
//         color: '#FFFFFF',
//         fontSize: size * 0.4,
//         fontWeight: '600',
//       }}>
//         {initials}
//       </Text>
//     </View>
//   );
// };

// // Enhanced Streak Celebration Modal Component
// const StreakCelebrationModal = ({ visible, onClose, streakCount, previousStreak, isFirstStreak }) => {
//   const scaleAnim = useRef(new Animated.Value(0)).current;
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const sparkleAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (visible) {
//       Animated.parallel([
//         Animated.spring(scaleAnim, {
//           toValue: 1,
//           tension: 50,
//           friction: 7,
//           useNativeDriver: true,
//         }),
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//         Animated.loop(
//           Animated.sequence([
//             Animated.timing(sparkleAnim, {
//               toValue: 1,
//               duration: 1000,
//               useNativeDriver: true,
//             }),
//             Animated.timing(sparkleAnim, {
//               toValue: 0,
//               duration: 1000,
//               useNativeDriver: true,
//             }),
//           ])
//         ),
//       ]).start();
//     }
//   }, [visible]);

//   const handleClose = () => {
//     Animated.parallel([
//       Animated.timing(scaleAnim, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//       Animated.timing(fadeAnim, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       onClose();
//     });
//   };

//   if (!visible) return null;

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="none"
//       onRequestClose={handleClose}
//     >
//       <View style={{
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.8)',
//         justifyContent: 'center',
//         alignItems: 'center',
//       }}>
//         <Animated.View
//           style={{
//             width: SCREEN_WIDTH - 32,
//             maxWidth: 400,
//             borderRadius: 24,
//             overflow: 'hidden',
//             position: 'relative',
//             transform: [{ scale: scaleAnim }],
//             opacity: fadeAnim,
//           }}
//         >
//           <View style={{
//             backgroundColor: '#000000',
//             padding: 32,
//             alignItems: 'center',
//             position: 'relative',
//           }}>
//             <Animated.View
//               style={{
//                 position: 'absolute',
//                 top: 16,
//                 left: 32,
//                 opacity: sparkleAnim,
//               }}
//             >
//               <Ionicons name="sparkles" size={24} color="#FFD700" />
//             </Animated.View>
//             <Animated.View
//               style={{
//                 position: 'absolute',
//                 top: 64,
//                 right: 48,
//                 opacity: sparkleAnim,
//               }}
//             >
//               <Ionicons name="sparkles" size={18} color="#FFD700" />
//             </Animated.View>
//             <Animated.View
//               style={{
//                 position: 'absolute',
//                 bottom: 80,
//                 left: 32,
//                 opacity: sparkleAnim,
//               }}
//             >
//               <Ionicons name="sparkles" size={20} color="#FFD700" />
//             </Animated.View>

//             <View style={{ marginBottom: 16 }}>
//               <Ionicons name="flame" size={60} color="#FF6B6B" />
//             </View>

//             <Text style={{
//               fontSize: 64,
//               fontWeight: 'bold',
//               color: '#FFFFFF',
//               textAlign: 'center',
//               marginBottom: 8,
//             }}>{streakCount}</Text>
            
//             <Text style={{
//               fontSize: 24,
//               fontWeight: '600',
//               color: '#FFFFFF',
//               textAlign: 'center',
//               marginBottom: 16,
//             }}>Day Streak!</Text>

//             <Text style={{
//               fontSize: 18,
//               fontWeight: '500',
//               color: '#FFFFFF',
//               textAlign: 'center',
//               marginBottom: 12,
//               lineHeight: 24,
//             }}>
//               {isFirstStreak
//                 ? "🎉 You've started your streak journey!"
//                 : `🔥 Amazing! You've maintained your streak for ${streakCount} days!`}
//             </Text>

//             <Text style={{
//               fontSize: 14,
//               color: 'rgba(255,255,255,0.8)',
//               textAlign: 'center',
//               marginBottom: 24,
//               lineHeight: 20,
//             }}>
//               Keep posting daily to build your momentum! 💪
//             </Text>

//             <TouchableOpacity
//               style={{
//                 backgroundColor: 'rgba(255,255,255,0.2)',
//                 paddingHorizontal: 32,
//                 paddingVertical: 12,
//                 borderRadius: 24,
//                 borderWidth: 1,
//                 borderColor: 'rgba(255,255,255,0.3)',
//               }}
//               onPress={handleClose}
//             >
//               <Text style={{
//                 color: '#FFFFFF',
//                 fontSize: 16,
//                 fontWeight: '600',
//                 textAlign: 'center',
//               }}>Continue</Text>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>
//       </View>
//     </Modal>
//   );
// };

// export default function CreatePost() {
//   const [content, setContent] = useState('');
//   const [selectedImages, setSelectedImages] = useState([]);
//   const [isPosting, setIsPosting] = useState(false);
//   const [showCelebration, setShowCelebration] = useState(false);
//   const [celebrationData, setCelebrationData] = useState({ streakCount: 5, previousStreak: 4, isFirstStreak: false });
//   const [isAnonymous, setIsAnonymous] = useState(false);
//   const [hotPosts, setHotPosts] = useState([]); // Empty by default - only show if exists
//   const [keyboardHeight, setKeyboardHeight] = useState(0);
//   const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
//   const [textInputHeight, setTextInputHeight] = useState(120);

//   // Mock current user data - replace with actual user data
//   const user = {
//     id: '1',
//     user_name: 'Current User', // Replace with actual current user name
//     email: 'user@example.com',
//   };

//   const scrollViewRef = useRef(null);
//   const textInputRef = useRef(null);

//   // Keyboard handling
//   useEffect(() => {
//     const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
//       setKeyboardHeight(e.endCoordinates.height);
//       setIsKeyboardVisible(true);
//     });
//     const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
//       setKeyboardHeight(0);
//       setIsKeyboardVisible(false);
//     });

//     return () => {
//       keyboardDidShowListener?.remove();
//       keyboardDidHideListener?.remove();
//     };
//   }, []);

//   const pickImage = async () => {
//     if (selectedImages.length >= MAX_IMAGES) {
//       Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images per post.`);
//       return;
//     }

//     // Mock image selection - replace with actual image picker
//     const mockImages = [
//       'https://picsum.photos/400/600?random=2',
//       'https://picsum.photos/400/600?random=3',
//       'https://picsum.photos/400/600?random=4',
//       'https://picsum.photos/400/600?random=5',
//     ];

//     const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
//     setSelectedImages(prev => [...prev, { uri: randomImage, id: Date.now() }]);
//   };

//   const removeImage = (id) => {
//     setSelectedImages(prev => prev.filter(img => img.id !== id));
//   };

//   const handlePost = async () => {
//     if (!content.trim() && selectedImages.length === 0) {
//       Alert.alert('Empty Post', 'Please add some content or images to your post.');
//       return;
//     }

//     try {
//       setIsPosting(true);
      
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 2000));

//       // Mock streak celebration
//       setShowCelebration(true);
      
//       // Reset form
//       setContent('');
//       setSelectedImages([]);
//       setIsAnonymous(false);
//       setTextInputHeight(120);
      
//     } catch (error) {
//       console.error('Error creating post:', error);
//       Alert.alert('Error', 'Failed to create post. Please try again.');
//     } finally {
//       setIsPosting(false);
//     }
//   };

//   const handleAnonymousToggle = (value) => {
//     setIsAnonymous(value);
//   };

//   const handleCelebrationClose = () => {
//     setShowCelebration(false);
//     // In real app, navigate back
//     console.log('Navigate back to main feed');
//   };

//   const handleContentSizeChange = (event) => {
//     const newHeight = Math.max(120, Math.min(200, event.nativeEvent.contentSize.height));
//     setTextInputHeight(newHeight);
//   };

//   const renderImageGrid = () => {
//     if (selectedImages.length === 0) return null;

//     const imageGridWidth = SCREEN_WIDTH - (2 * SPACING);
//     const imageSize = selectedImages.length === 1 
//       ? imageGridWidth 
//       : (imageGridWidth - SPACING) / 2;

//     return (
//       <View style={{
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         marginBottom: SPACING,
//       }}>
//         {selectedImages.map((image, index) => (
//           <View key={image.id} style={{
//             width: imageSize,
//             height: imageSize * 1.2,
//             marginRight: (index % 2 === 0 && selectedImages.length > 1) ? SPACING : 0,
//             marginBottom: index < selectedImages.length - 2 ? SPACING : 0,
//             position: 'relative',
//             borderRadius: 12,
//             overflow: 'hidden',
//           }}>
//             <Image source={{ uri: image.uri }} style={{
//               width: '100%',
//               height: '100%',
//             }} />
//             <TouchableOpacity
//               onPress={() => removeImage(image.id)}
//               style={{
//                 position: 'absolute',
//                 top: 8,
//                 right: 8,
//                 backgroundColor: 'rgba(0,0,0,0.7)',
//                 borderRadius: 16,
//                 width: 32,
//                 height: 32,
//                 alignItems: 'center',
//                 justifyContent: 'center',
//               }}
//             >
//               <Ionicons name="close" size={16} color="#FFFFFF" />
//             </TouchableOpacity>
//           </View>
//         ))}
//       </View>
//     );
//   };

//   const renderHotPost = () => {
//     // Only render if hotPosts exist and have content
//     if (!hotPosts || hotPosts.length === 0) return null;

//     const post = hotPosts[0];
//     const hotPostImageHeight = SCREEN_WIDTH * 0.5;

//     return (
//       <View style={{ marginTop: SPACING }}>
//         <View style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           marginBottom: 8,
//         }}>
//           <Ionicons name="flame" size={16} color="#FF6B6B" />
//           <Text style={{
//             color: COLORS.text,
//             fontSize: 16,
//             fontWeight: '600',
//             marginLeft: 8,
//           }}>Trending from yesterday</Text>
//         </View>
        
//         <TouchableOpacity style={{
//           borderRadius: 12,
//           overflow: 'hidden',
//           backgroundColor: COLORS.cardBg,
//           position: 'relative',
//         }}>
//           <Image source={{ uri: post.images[0] }} style={{
//             width: '100%',
//             height: hotPostImageHeight,
//           }} />
//           <View style={{
//             position: 'absolute',
//             bottom: 0,
//             left: 0,
//             right: 0,
//             backgroundColor: 'rgba(0,0,0,0.7)',
//             padding: SPACING,
//           }}>
//             <Text style={{
//               color: COLORS.text,
//               fontSize: 14,
//               fontWeight: '500',
//               marginBottom: 4,
//             }}>
//               {post.is_anonymous ? 'Anonymous User' : (post.user_name || 'Anonymous')}
//             </Text>
//             <View style={{
//               flexDirection: 'row',
//               gap: 12,
//             }}>
//               <View style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 gap: 4,
//               }}>
//                 <Ionicons name="heart" size={12} color="#FF6B6B" />
//                 <Text style={{
//                   color: COLORS.text,
//                   fontSize: 12,
//                 }}>{post.like_count || 0}</Text>
//               </View>
//               <View style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 gap: 4,
//               }}>
//                 <Ionicons name="chatbubble" size={12} color="#3B82F6" />
//                 <Text style={{
//                   color: COLORS.text,
//                   fontSize: 12,
//                 }}>{post.comment_count || 0}</Text>
//               </View>
//             </View>
//           </View>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   const isPostButtonDisabled = isPosting || (!content.trim() && selectedImages.length === 0);

//   return (
//     <SafeAreaView style={{
//       flex: 1,
//       backgroundColor: COLORS.background,
//     }}>
//       <View style={{
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: SPACING,
//         paddingVertical: 12,
//         borderBottomWidth: 1,
//         borderBottomColor: COLORS.border,
//         backgroundColor: COLORS.surface,
//       }}>
//         <TouchableOpacity onPress={() => console.log('Navigate back')} style={{
//           width: 40,
//           height: 40,
//           borderRadius: 20,
//           alignItems: 'center',
//           justifyContent: 'center',
//         }}>
//           <Ionicons name="close" size={24} color={COLORS.text} />
//         </TouchableOpacity>

//         <Text style={{
//           fontSize: 18,
//           fontWeight: '600',
//           color: COLORS.text,
//         }}>Create Post</Text>

//         <View style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           gap: 8,
//         }}>
//           <TouchableOpacity
//             onPress={() => {
//               setContent('');
//               setSelectedImages([]);
//               setIsAnonymous(false);
//               setTextInputHeight(120);
//             }}
//             style={{ padding: 8 }}
//           >
//             <Ionicons name="refresh" size={20} color={COLORS.accent} />
//           </TouchableOpacity>
          
//           <TouchableOpacity
//             onPress={handlePost}
//             disabled={isPostButtonDisabled}
//             style={{
//               backgroundColor: COLORS.accent,
//               paddingHorizontal: 20,
//               paddingVertical: 10,
//               borderRadius: 20,
//               minWidth: 70,
//               alignItems: 'center',
//               opacity: isPostButtonDisabled ? 0.5 : 1,
//             }}
//           >
//             {isPosting ? (
//               <ActivityIndicator color="#000000" size="small" />
//             ) : (
//               <Text style={{
//                 color: '#000000',
//                 fontSize: 16,
//                 fontWeight: '600',
//               }}>Post</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={{ flex: 1 }}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
//       >
//         <ScrollView
//           ref={scrollViewRef}
//           style={{ flex: 1 }}
//           contentContainerStyle={{ padding: SPACING }}
//           keyboardShouldPersistTaps="handled"
//           showsVerticalScrollIndicator={false}
//         >
//           <View style={{
//             flexDirection: 'row',
//             alignItems: 'center',
//             marginBottom: SPACING,
//           }}>
//             <ProfileInitials 
//               name={user?.user_name || user?.email || 'User'} 
//               isAnonymous={isAnonymous}
//               size={48}
//             />
//             <View style={{ flex: 1 }}>
//               <Text style={{
//                 fontSize: 16,
//                 fontWeight: '600',
//                 color: COLORS.text,
//               }}>
//                 {isAnonymous ? 'Anonymous User' : (user?.user_name || user?.email || 'User')}
//               </Text>
//               {isAnonymous && (
//                 <Text style={{
//                   fontSize: 12,
//                   color: COLORS.accent,
//                   marginTop: 2,
//                 }}>Your identity is hidden</Text>
//               )}
//             </View>
//           </View>

//           <TextInput
//             ref={textInputRef}
//             value={content}
//             onChangeText={setContent}
//             placeholder="What's on your mind?"
//             placeholderTextColor={COLORS.textMuted}
//             multiline
//             style={{
//               color: COLORS.text,
//               fontSize: 18,
//               lineHeight: 24,
//               textAlignVertical: 'top',
//               marginBottom: SPACING,
//               padding: SPACING,
//               backgroundColor: COLORS.inputBg,
//               borderRadius: 12,
//               borderWidth: 1,
//               borderColor: COLORS.border,
//               height: textInputHeight,
//             }}
//             onContentSizeChange={handleContentSizeChange}
//             autoFocus
//             textAlignVertical="top"
//           />

//           {renderImageGrid()}
//           {renderHotPost()}
          
//           {/* Spacer to ensure content is above keyboard */}
//           <View style={{ height: 100 }} />
//         </ScrollView>

//         <View style={{
//           backgroundColor: COLORS.surface,
//           borderTopWidth: 1,
//           borderTopColor: COLORS.border,
//           paddingHorizontal: SPACING,
//           paddingVertical: 12,
//           paddingBottom: Platform.OS === 'ios' ? (isKeyboardVisible ? 8 : 34) : 12,
//         }}>
//           <View style={{
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//           }}>
//             <TouchableOpacity
//               onPress={pickImage}
//               style={{
//                 width: 44,
//                 height: 44,
//                 borderRadius: 22,
//                 backgroundColor: COLORS.inputBg,
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 position: 'relative',
//                 opacity: selectedImages.length >= MAX_IMAGES ? 0.5 : 1,
//               }}
//               disabled={selectedImages.length >= MAX_IMAGES}
//             >
//               <Ionicons 
//                 name="image" 
//                 size={24} 
//                 color={selectedImages.length >= MAX_IMAGES ? COLORS.textMuted : COLORS.accent} 
//               />
//               {selectedImages.length > 0 && (
//                 <View style={{
//                   position: 'absolute',
//                   top: -4,
//                   right: -4,
//                   backgroundColor: COLORS.accent,
//                   borderRadius: 10,
//                   width: 20,
//                   height: 20,
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                 }}>
//                   <Text style={{
//                     color: '#000000',
//                     fontSize: 10,
//                     fontWeight: 'bold',
//                   }}>{selectedImages.length}</Text>
//                 </View>
//               )}
//             </TouchableOpacity>

//             <View style={{
//               flexDirection: 'row',
//               alignItems: 'center',
//               gap: 8,
//             }}>
//               <Ionicons 
//                 name={isAnonymous ? "eye-off" : "eye"} 
//                 size={18} 
//                 color={isAnonymous ? COLORS.accent : COLORS.textMuted} 
//               />
//               <Text style={{
//                 fontSize: 14,
//                 fontWeight: '500',
//                 color: isAnonymous ? COLORS.accent : COLORS.text,
//               }}>
//                 Go Incognito
//               </Text>
//               <Switch
//                 value={isAnonymous}
//                 onValueChange={handleAnonymousToggle}
//                 trackColor={{ false: '#3f3f46', true: COLORS.accent }}
//                 thumbColor={isAnonymous ? '#000000' : '#f4f3f4'}
//                 style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
//               />
//             </View>
//           </View>
//         </View>
//       </KeyboardAvoidingView>

//       <StreakCelebrationModal
//         visible={showCelebration}
//         onClose={handleCelebrationClose}
//         streakCount={celebrationData.streakCount}
//         previousStreak={celebrationData.previousStreak}
//         isFirstStreak={celebrationData.isFirstStreak}
//       />
//     </SafeAreaView>
//   );
// } 
// import React, { useState, useCallback, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   Alert,
//   Switch,
//   Dimensions,
//   Modal,
//   Animated,
//   SafeAreaView,
//   Keyboard,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { 
//   updateStreakForPost, 
//   getTodayProgress 
// } from '../../(apis)/streaks'; // Adjust path as needed
// import { useAuthStore } from '../../stores/useAuthStore';
// const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// const SPACING = 16;
// const MAX_IMAGES = 4;

// const COLORS = {
//   background: '#000000',
//   surface: '#000000',
//   text: '#FFFFFF',
//   accent: '#FFFFFF',
//   textSecondary: '#E5E5E5',
//   textMuted: '#71717A',
//   inputBg: '#000000',
//   border: 'rgba(255, 255, 255, 0.1)',
//   cardBg: '#000000',
//   success: '#22C55E',
//   warning: '#F59E0B',
//   error: '#EF4444',
//   gradient: ['#000000', '#000000'],
// };

// // Get initials from name
// const getInitials = (name) => {
//   if (!name) return 'U';
//   return name
//     .split(' ')
//     .map(word => word.charAt(0))
//     .join('')
//     .toUpperCase()
//     .slice(0, 2);
// };

// // Profile initials component
// const ProfileInitials = ({ name, isAnonymous, size = 48 }) => {
//   const initials = isAnonymous ? 'A' : getInitials(name);
//   const backgroundColor = isAnonymous ? '#666666' : '#333333';
  
//   return (
//     <View style={{
//       width: size,
//       height: size,
//       borderRadius: size / 2,
//       backgroundColor: backgroundColor,
//       alignItems: 'center',
//       justifyContent: 'center',
//       marginRight: 12,
//     }}>
//       <Text style={{
//         color: '#FFFFFF',
//         fontSize: size * 0.4,
//         fontWeight: '600',
//       }}>
//         {initials}
//       </Text>
//     </View>
//   );
// };

// // Enhanced Streak Celebration Modal Component
// const StreakCelebrationModal = ({ visible, onClose, streakCount, previousStreak, isFirstStreak }) => {
//   const scaleAnim = useRef(new Animated.Value(0)).current;
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const sparkleAnim = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     if (visible) {
//       Animated.parallel([
//         Animated.spring(scaleAnim, {
//           toValue: 1,
//           tension: 50,
//           friction: 7,
//           useNativeDriver: true,
//         }),
//         Animated.timing(fadeAnim, {
//           toValue: 1,
//           duration: 300,
//           useNativeDriver: true,
//         }),
//         Animated.loop(
//           Animated.sequence([
//             Animated.timing(sparkleAnim, {
//               toValue: 1,
//               duration: 1000,
//               useNativeDriver: true,
//             }),
//             Animated.timing(sparkleAnim, {
//               toValue: 0,
//               duration: 1000,
//               useNativeDriver: true,
//             }),
//           ])
//         ),
//       ]).start();
//     }
//   }, [visible]);

//   const handleClose = () => {
//     Animated.parallel([
//       Animated.timing(scaleAnim, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//       Animated.timing(fadeAnim, {
//         toValue: 0,
//         duration: 200,
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       onClose();
//     });
//   };

//   if (!visible) return null;

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="none"
//       onRequestClose={handleClose}
//     >
//       <View style={{
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.8)',
//         justifyContent: 'center',
//         alignItems: 'center',
//       }}>
//         <Animated.View
//           style={{
//             width: SCREEN_WIDTH - 32,
//             maxWidth: 400,
//             borderRadius: 24,
//             overflow: 'hidden',
//             position: 'relative',
//             transform: [{ scale: scaleAnim }],
//             opacity: fadeAnim,
//           }}
//         >
//           <View style={{
//             backgroundColor: '#000000',
//             padding: 32,
//             alignItems: 'center',
//             position: 'relative',
//           }}>
//             <Animated.View
//               style={{
//                 position: 'absolute',
//                 top: 16,
//                 left: 32,
//                 opacity: sparkleAnim,
//               }}
//             >
//               <Ionicons name="sparkles" size={24} color="#FFD700" />
//             </Animated.View>
//             <Animated.View
//               style={{
//                 position: 'absolute',
//                 top: 64,
//                 right: 48,
//                 opacity: sparkleAnim,
//               }}
//             >
//               <Ionicons name="sparkles" size={18} color="#FFD700" />
//             </Animated.View>
//             <Animated.View
//               style={{
//                 position: 'absolute',
//                 bottom: 80,
//                 left: 32,
//                 opacity: sparkleAnim,
//               }}
//             >
//               <Ionicons name="sparkles" size={20} color="#FFD700" />
//             </Animated.View>

//             <View style={{ marginBottom: 16 }}>
//               <Ionicons name="flame" size={60} color="#FF6B6B" />
//             </View>

//             <Text style={{
//               fontSize: 64,
//               fontWeight: 'bold',
//               color: '#FFFFFF',
//               textAlign: 'center',
//               marginBottom: 8,
//             }}>{streakCount}</Text>
            
//             <Text style={{
//               fontSize: 24,
//               fontWeight: '600',
//               color: '#FFFFFF',
//               textAlign: 'center',
//               marginBottom: 16,
//             }}>Day Streak!</Text>

//             <Text style={{
//               fontSize: 18,
//               fontWeight: '500',
//               color: '#FFFFFF',
//               textAlign: 'center',
//               marginBottom: 12,
//               lineHeight: 24,
//             }}>
//               {isFirstStreak
//                 ? "🎉 You've started your streak journey!"
//                 : `🔥 Amazing! You've maintained your streak for ${streakCount} days!`}
//             </Text>

//             <Text style={{
//               fontSize: 14,
//               color: 'rgba(255,255,255,0.8)',
//               textAlign: 'center',
//               marginBottom: 24,
//               lineHeight: 20,
//             }}>
//               Keep posting daily to build your momentum! 💪
//             </Text>

//             <TouchableOpacity
//               style={{
//                 backgroundColor: 'rgba(255,255,255,0.2)',
//                 paddingHorizontal: 32,
//                 paddingVertical: 12,
//                 borderRadius: 24,
//                 borderWidth: 1,
//                 borderColor: 'rgba(255,255,255,0.3)',
//               }}
//               onPress={handleClose}
//             >
//               <Text style={{
//                 color: '#FFFFFF',
//                 fontSize: 16,
//                 fontWeight: '600',
//                 textAlign: 'center',
//               }}>Continue</Text>
//             </TouchableOpacity>
//           </View>
//         </Animated.View>
//       </View>
//     </Modal>
//   );
// };

// export default function CreatePost({ visible = true, onClose,userr }) {
//   const [content, setContent] = useState('');
//   const [selectedImages, setSelectedImages] = useState([]);
//   const [isPosting, setIsPosting] = useState(false);
//   const [showCelebration, setShowCelebration] = useState(false);
//   const [celebrationData, setCelebrationData] = useState({ streakCount: 0, previousStreak: 0, isFirstStreak: false });
//   const [isAnonymous, setIsAnonymous] = useState(false);
//   const [hotPosts, setHotPosts] = useState([]); // Empty by default - only show f exists
//   const {user}=useAuthStore();
//   const [keyboardHeight, setKeyboardHeight] = useState(0);
//   const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
//   const [textInputHeight, setTextInputHeight] = useState(120);
//   const [todayProgress, setTodayProgress] = useState({
//     currentStreak: 0,
//     highestStreak: 0,
//     commentsToday: 0,
//     postsToday: 0,
//     streakCompletedToday: false,
//     commentsNeeded: 5,
//   });
//   const [isLoadingProgress, setIsLoadingProgress] = useState(true);
//   const [uses,setUser]=useState(null);

//   const scrollViewRef = useRef(null);
//   const textInputRef = useRef(null);
//   const [loading,setLoading]=useState(false);
  
//   useEffect(() => {
//     async function fetchUser() {
//       setLoading(true);
//       console.log("userr",userr);
//       const { data: { user: supaUser } } = await supabase.auth.getUser();
//       if (supaUser?.id) {
//         const { data, error } = await supabase.from('users').select('*').eq('id', supaUser.id).single();
//         if (!error && data) setUser(data);
//       }
//       setLoading(false);
//     }
//     fetchUser();
//   }, []);
//   // Load today's progress on component mount
//   useEffect(() => {
//     const loadTodayProgress = async () => {
//       if (!user?.id) return;
      
//       try {
//         setIsLoadingProgress(true);
//         const progress = await getTodayProgress(user.id);
//         setTodayProgress(progress);
//     } catch (error) {
//         console.error('Error loading today progress:', error);
//         // Set default values on error
//         setTodayProgress({
//           currentStreak: 0,
//           highestStreak: 0,
//           commentsToday: 0,
//           postsToday: 0,
//           streakCompletedToday: false,
//           commentsNeeded: 5,
//         });
//       } finally {
//         setIsLoadingProgress(false);
//       }
//     };

//     loadTodayProgress();
//   }, [user?.id]);

//   // Keyboard handling
//   useEffect(() => {
//     const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
//       setKeyboardHeight(e.endCoordinates.height);
//       setIsKeyboardVisible(true);
//     });
//     const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
//       setKeyboardHeight(0);
//       setIsKeyboardVisible(false);
//     });

//     return () => {
//       keyboardDidShowListener?.remove();
//       keyboardDidHideListener?.remove();
//     };
//   }, []);

//   const pickImage = async () => {
//     if (selectedImages.length >= MAX_IMAGES) {
//       Alert.alert('Limit Reached', `You can only add up to ${MAX_IMAGES} images per post.`);
//       return;
//     }

//     // Mock image selection - replace with actual image picker
//     const mockImages = [
//       'https://picsum.photos/400/600?random=2',
//       'https://picsum.photos/400/600?random=3',
//       'https://picsum.photos/400/600?random=4',
//       'https://picsum.photos/400/600?random=5',
//     ];

//     const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
//     setSelectedImages(prev => [...prev, { uri: randomImage, id: Date.now() }]);
//   };

//   const removeImage = (id) => {
//     setSelectedImages(prev => prev.filter(img => img.id !== id));
//   };

//   const handlePost = async () => {
//     if (!content.trim() && selectedImages.length === 0) {
//       Alert.alert('Empty Post', 'Please add some content or images to your post.');
//       return;
//     }

//     if (!user?.id) {
//       Alert.alert('Error', 'User not found. Please try logging in again.');
//       return;
//     }

//     try {
//       setIsPosting(true);
      
//       // First, create the post (replace with your actual post creation API)
//       const postData = {
//         content: content.trim(),
//         images: selectedImages,
//         isAnonymous,
//         userId: user.id,
//       };
      
//       // Simulate post creation API call
//       await new Promise(resolve => setTimeout(resolve, 1000));
//       console.log('Post created:', postData);
      
//       // Update streak after successful post creation
//         const streakResult = await updateStreakForPost(user.id);
      
//       // Update today's progress
//       const updatedProgress = await getTodayProgress(user.id);
//       setTodayProgress(updatedProgress);
      
//       // Show celebration modal only if streak increased
//         if (streakResult.streakIncreased) {
//           setCelebrationData({
//             streakCount: streakResult.current_streak,
//             previousStreak: streakResult.previousStreak,
//           isFirstStreak: streakResult.previousStreak === 0,
//           });
//           setShowCelebration(true);
//       } else {
//         // If streak didn't increase, just close the modal
//         handleCreatePostClose();
//       }
      
//       // Reset form
//         setContent('');
//         setSelectedImages([]);
//         setIsAnonymous(false);
//       setTextInputHeight(120);
      
//     } catch (error) {
//       console.error('Error creating post:', error);
//       Alert.alert('Error', 'Failed to create post. Please try again.');
//     } finally {
//       setIsPosting(false);
//     }
//   };

//   const handleAnonymousToggle = (value) => {
//     setIsAnonymous(value);
//   };

//   const handleCelebrationClose = () => {
//     setShowCelebration(false);
//     // Close the create post modal after streak celebration
//     handleCreatePostClose();
//   };

//   const handleCreatePostClose = () => {
//     // Reset form state
//     setContent('');
//     setSelectedImages([]);
//     setIsAnonymous(false);
//     setTextInputHeight(120);
    
//     // Close the create post modal
//     if (onClose) {
//       onClose();
//     } else {
//       // If no onClose prop, navigate back (for navigation-based apps)
//       console.log('Navigate back to main feed');
//     }
//   };

//   const handleContentSizeChange = (event) => {
//     const newHeight = Math.max(120, Math.min(200, event.nativeEvent.contentSize.height));
//     setTextInputHeight(newHeight);
//   };

//   const renderImageGrid = () => {
//     if (selectedImages.length === 0) return null;

//     const imageGridWidth = SCREEN_WIDTH - (2 * SPACING);
//     const imageSize = selectedImages.length === 1 
//       ? imageGridWidth 
//       : (imageGridWidth - SPACING) / 2;

//     return (
//       <View style={{
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         marginBottom: SPACING,
//       }}>
//         {selectedImages.map((image, index) => (
//           <View key={image.id} style={{
//             width: imageSize,
//             height: imageSize * 1.2,
//             marginRight: (index % 2 === 0 && selectedImages.length > 1) ? SPACING : 0,
//             marginBottom: index < selectedImages.length - 2 ? SPACING : 0,
//             position: 'relative',
//             borderRadius: 12,
//             overflow: 'hidden',
//           }}>
//             <Image source={{ uri: image.uri }} style={{
//               width: '100%',
//               height: '100%',
//             }} />
//             <TouchableOpacity
//               onPress={() => removeImage(image.id)}
//               style={{
//                 position: 'absolute',
//                 top: 8,
//                 right: 8,
//                 backgroundColor: 'rgba(0,0,0,0.7)',
//                 borderRadius: 16,
//                 width: 32,
//                 height: 32,
//                 alignItems: 'center',
//                 justifyContent: 'center',
//               }}
//             >
//               <Ionicons name="close" size={16} color="#FFFFFF" />
//             </TouchableOpacity>
//           </View>
//         ))}
//       </View>
//     );
//   };

//   const renderHotPost = () => {
//     // Only render if hotPosts exist and have content
//     if (!hotPosts || hotPosts.length === 0) return null;

//     const post = hotPosts[0];
//     const hotPostImageHeight = SCREEN_WIDTH * 0.5;

//     return (
//       <View style={{ marginTop: SPACING }}>
//         <View style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           marginBottom: 8,
//         }}>
//           <Ionicons name="flame" size={16} color="#FF6B6B" />
//           <Text style={{
//             color: COLORS.text,
//             fontSize: 16,
//             fontWeight: '600',
//             marginLeft: 8,
//           }}>Trending from yesterday</Text>
//         </View>
        
//         <TouchableOpacity style={{
//           borderRadius: 12,
//           overflow: 'hidden',
//           backgroundColor: COLORS.cardBg,
//           position: 'relative',
//         }}>
//           <Image source={{ uri: post.images[0] }} style={{
//             width: '100%',
//             height: hotPostImageHeight,
//           }} />
//           <View style={{
//             position: 'absolute',
//             bottom: 0,
//             left: 0,
//             right: 0,
//             backgroundColor: 'rgba(0,0,0,0.7)',
//             padding: SPACING,
//           }}>
//             <Text style={{
//               color: COLORS.text,
//               fontSize: 14,
//               fontWeight: '500',
//               marginBottom: 4,
//             }}>
//               {post.is_anonymous ? 'Anonymous User' : (post.user_name || 'Anonymous')}
//             </Text>
//             <View style={{
//               flexDirection: 'row',
//               gap: 12,
//             }}>
//               <View style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 gap: 4,
//               }}>
//                 <Ionicons name="heart" size={12} color="#FF6B6B" />
//                 <Text style={{
//                   color: COLORS.text,
//                   fontSize: 12,
//                 }}>{post.like_count || 0}</Text>
//               </View>
//               <View style={{
//                 flexDirection: 'row',
//                 alignItems: 'center',
//                 gap: 4,
//               }}>
//                 <Ionicons name="chatbubble" size={12} color="#3B82F6" />
//                 <Text style={{
//                   color: COLORS.text,
//                   fontSize: 12,
//                 }}>{post.comment_count || 0}</Text>
//               </View>
//             </View>
//           </View>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   const renderStreakStatus = () => {
//     if (isLoadingProgress) {
//     return (
//         <View style={{
//           backgroundColor: 'rgba(255, 255, 255, 0.1)',
//           paddingHorizontal: 12,
//           paddingVertical: 8,
//           borderRadius: 12,
//           marginBottom: SPACING,
//           flexDirection: 'row',
//           alignItems: 'center',
//           justifyContent: 'center',
//         }}>
//           <ActivityIndicator size="small" color={COLORS.accent} />
//           <Text style={{
//             color: COLORS.textMuted,
//             fontSize: 12,
//             marginLeft: 8,
//           }}>
//             Loading streak info...
//           </Text>
//       </View>
//     );
//   }

//     if (todayProgress.streakCompletedToday) {
//   return (
//         <View style={{
//           backgroundColor: 'rgba(34, 197, 94, 0.2)',
//           paddingHorizontal: 12,
//           paddingVertical: 8,
//           borderRadius: 12,
//           marginBottom: SPACING,
//           borderWidth: 1,
//           borderColor: 'rgba(34, 197, 94, 0.3)',
//         }}>
//           <View style={{
//             flexDirection: 'row',
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}>
//             <Ionicons name="flame" size={14} color="#22C55E" />
//             <Text style={{
//               color: '#22C55E',
//               fontSize: 12,
//               fontWeight: '600',
//               marginLeft: 6,
//             }}>
//               Streak Complete! ({todayProgress.currentStreak} days)
//             </Text>
//           </View>
//           <Text style={{
//             color: COLORS.textMuted,
//             fontSize: 10,
//             textAlign: 'center',
//             marginTop: 2,
//           }}>
//             Additional posts won't count toward your streak today
//           </Text>
//         </View>
//       );
//     }

//     return (
//       <View style={{
//         backgroundColor: 'rgba(255, 255, 255, 0.1)',
//         paddingHorizontal: 12,
//         paddingVertical: 8,
//         borderRadius: 12,
//         marginBottom: SPACING,
//       }}>
//         <View style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           justifyContent: 'space-between',
//         }}>
//           <View style={{
//             flexDirection: 'row',
//             alignItems: 'center',
//           }}>
//             <Ionicons name="flame" size={14} color="#FF6B6B" />
//             <Text style={{
//               color: COLORS.text,
//               fontSize: 12,
//               fontWeight: '600',
//               marginLeft: 6,
//             }}>
//               Current Streak: {todayProgress.currentStreak} days
//             </Text>
//           </View>
//           <Text style={{
//             color: COLORS.textMuted,
//             fontSize: 10,
//           }}>
//             Post to continue!
//           </Text>
//         </View>
//         {todayProgress.currentStreak > 0 && (
//           <Text style={{
//             color: COLORS.textMuted,
//             fontSize: 10,
//             textAlign: 'center',
//             marginTop: 2,
//           }}>
//             Best: {todayProgress.highestStreak} days
//           </Text>
//         )}
//       </View>
//     );
//   };

//   const isPostButtonDisabled = isPosting || (!content.trim() && selectedImages.length === 0);

//   // Don't render if not visible (for modal-based usage)
//   if (!visible) return null;

//   return (
//     <SafeAreaView style={{
//       flex: 1,
//       backgroundColor: COLORS.background,
//     }}>
//       <View style={{
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: SPACING,
//         paddingVertical: 12,
//         borderBottomWidth: 1,
//         borderBottomColor: COLORS.border,
//         backgroundColor: COLORS.surface,
//       }}>
//         <TouchableOpacity onPress={handleCreatePostClose} style={{
//           width: 40,
//           height: 40,
//           borderRadius: 20,
//           alignItems: 'center',
//           justifyContent: 'center',
//         }}>
//           <Ionicons name="close" size={24} color={COLORS.text} />
//         </TouchableOpacity>

//         <Text style={{
//           fontSize: 18,
//           fontWeight: '600',
//           color: COLORS.text,
//         }}>Create Post</Text>

//         <View style={{
//           flexDirection: 'row',
//           alignItems: 'center',
//           gap: 8,
//         }}>
//           <TouchableOpacity
//             onPress={() => {
//               setContent('');
//               setSelectedImages([]);
//               setIsAnonymous(false);
//               setTextInputHeight(120);
//             }}
//             style={{ padding: 8 }}
//           >
//             <Ionicons name="refresh" size={20} color={COLORS.accent} />
//           </TouchableOpacity>
          
//           <TouchableOpacity
//             onPress={handlePost}
//             disabled={isPostButtonDisabled}
//             style={{
//               backgroundColor: COLORS.accent,
//               paddingHorizontal: 20,
//               paddingVertical: 10,
//               borderRadius: 20,
//               minWidth: 70,
//               alignItems: 'center',
//               opacity: isPostButtonDisabled ? 0.5 : 1,
//             }}
//           >
//             {isPosting ? (
//               <ActivityIndicator color="#000000" size="small" />
//             ) : (
//               <Text style={{
//                 color: '#000000',
//                 fontSize: 16,
//                 fontWeight: '600',
//               }}>Post</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>

//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={{ flex: 1 }}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
//       >
//       <ScrollView
//           ref={scrollViewRef}
//           style={{ flex: 1 }}
//           contentContainerStyle={{ padding: SPACING }}
//         keyboardShouldPersistTaps="handled"
//         showsVerticalScrollIndicator={false}
//       >
//           {renderStreakStatus()}

//           {/* <View style={{
//             flexDirection: 'row',
//             alignItems: 'center',
//             marginBottom: SPACING,
//           }}>
//             <ProfileInitials 
//               name={user?.user_name || user?.full_name || user?.email || 'User'} 
//               isAnonymous={isAnonymous}
//               size={48}
//             />
//             <View style={{ flex: 1 }}>
//               <Text style={{
//                 fontSize: 16,
//                 fontWeight: '600',
//                 color: COLORS.text,
//               }}>
//                 {isAnonymous ? 'Anonymous User' : (user?.user_name || user?.full_name || user?.fullName || 'User')}
//           </Text>
//             {isAnonymous && (
//                 <Text style={{
//                   fontSize: 12,
//                   color: COLORS.accent,
//                   marginTop: 2,
//                 }}>Your identity is hidden</Text>
//             )}
//           </View>
//           </View> */}

//         <TextInput
//             ref={textInputRef}
//           value={content}
//           onChangeText={setContent}
//           placeholder="What's on your mind?"
//           placeholderTextColor={COLORS.textMuted}
//           multiline
//             style={{
//               color: COLORS.text,
//               fontSize: 18,
//               lineHeight: 24,
//               textAlignVertical: 'top',
//               marginBottom: SPACING,
//               padding: SPACING,
//               backgroundColor: COLORS.inputBg,
//               borderRadius: 12,
//               borderWidth: 1,
//               borderColor: COLORS.border,
//               height: textInputHeight,
//             }}
//             onContentSizeChange={handleContentSizeChange}
//           autoFocus
//             textAlignVertical="top"
//           />

//         {renderImageGrid()}
//         {renderHotPost()}
          
//           {/* Spacer to ensure content is above keyboard */}
//           <View style={{ height: 100 }} />
//           </ScrollView>

//         <View style={{
//           backgroundColor: COLORS.surface,
//           borderTopWidth: 1,
//           borderTopColor: COLORS.border,
//           paddingHorizontal: SPACING,
//           paddingVertical: 12,
//           paddingBottom: Platform.OS === 'ios' ? (isKeyboardVisible ? 8 : 34) : 12,
//         }}>
//           <View style={{
//             flexDirection: 'row',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//           }}>
//           <TouchableOpacity
//             onPress={pickImage}
//               style={{
//                 width: 44,
//                 height: 44,
//                 borderRadius: 22,
//                 backgroundColor: COLORS.inputBg,
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 position: 'relative',
//                 opacity: selectedImages.length >= MAX_IMAGES ? 0.5 : 1,
//               }}
//             disabled={selectedImages.length >= MAX_IMAGES}
//           >
//             <Ionicons 
//               name="image" 
//               size={24} 
//               color={selectedImages.length >= MAX_IMAGES ? COLORS.textMuted : COLORS.accent} 
//             />
//             {selectedImages.length > 0 && (
//                 <View style={{
//                   position: 'absolute',
//                   top: -4,
//                   right: -4,
//                   backgroundColor: COLORS.accent,
//                   borderRadius: 10,
//                   width: 20,
//                   height: 20,
//                   alignItems: 'center',
//                   justifyContent: 'center',
//                 }}>
//                   <Text style={{
//                     color: '#000000',
//                     fontSize: 10,
//                     fontWeight: 'bold',
//                   }}>{selectedImages.length}</Text>
//               </View>
//             )}
//           </TouchableOpacity>

//             <View style={{
//               flexDirection: 'row',
//               alignItems: 'center',
//               gap: 8,
//             }}>
//             <Ionicons 
//               name={isAnonymous ? "eye-off" : "eye"} 
//               size={18} 
//               color={isAnonymous ? COLORS.accent : COLORS.textMuted} 
//             />
//               <Text style={{
//                 fontSize: 14,
//                 fontWeight: '500',
//                 color: isAnonymous ? COLORS.accent : COLORS.text,
//               }}>
//               Go Incognito
//             </Text>
//             <Switch
//               value={isAnonymous}
//               onValueChange={handleAnonymousToggle}
//               trackColor={{ false: '#3f3f46', true: COLORS.accent }}
//                 thumbColor={isAnonymous ? '#000000' : '#f4f3f4'}
//               style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
//             />
//           </View>
//         </View>
//           </View>
//       </KeyboardAvoidingView>

//       <StreakCelebrationModal
//         visible={showCelebration}
//         onClose={handleCelebrationClose}
//         streakCount={celebrationData.streakCount}
//         previousStreak={celebrationData.previousStreak}
//         isFirstStreak={celebrationData.isFirstStreak}
//       />
//     </SafeAreaView>
//   );
// }