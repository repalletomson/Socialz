import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Share,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/authContext';
import { safeNavigate } from '../utiles/safeNavigation';
import { supabase } from '../config/supabaseConfig';
import {
  addComment,
  getComments,
  addLike,
  removeLike,
  getLikes,
  incrementViews,
  getViews,
  deletePost,
  reportPost,
  fetchHotPosts,
  incrementShareCount,
  getShareCount,
  savePost,
  unsavePost,
  hasUserLiked,
  hasUserSaved,
} from '../(apis)/post';
import EventEmitter from '../utiles/EventEmitter';
import { Fonts, TextStyles } from '../constants/Fonts';

const { width, height } = Dimensions.get('window');
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

// Professional black theme with consistent purple accent
const colors = {
  background: '#000000',
  cardBackground: '#000000',
  text: '#FFFFFF',
  textSecondary: '#E5E5E5',
  textMuted: '#A1A1AA',
  inputBg: '#1A1A1A',
  accent: '#8B5CF6',
  like: '#8B5CF6',
  success: '#10B981',
  shadow: 'rgba(139, 92, 246, 0.15)',
};

// Timestamp Formatting Utility
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";

  const now = new Date();
  let date;
  
  // Handle different timestamp formats
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return "";
  }

  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  return date.toLocaleDateString();
};

// Hot Post Banner Component
const HotPostBanner = ({ onPress }) => {
  const [hotPosts, setHotPosts] = useState([]);

  useEffect(() => {
    const loadHotPosts = async () => {
      const posts = await fetchHotPosts();
      setHotPosts(posts);
    };
    loadHotPosts();
  }, []);

  return hotPosts.length > 0 ? (
    <TouchableOpacity onPress={onPress}>
      <LinearGradient colors={[colors.accent, "#A855F7"]} className="rounded-none p-4 mb-4 flex-row items-center">
        <Ionicons name="flame" size={24} color="white" />
        <Text className="text-white font-bold ml-2 text-lg">Hot Post of the Week</Text>
      </LinearGradient>
    </TouchableOpacity>
  ) : null;
};

const PostCard = ({ post, isDetailView = false, isHotPost = false, enableRealTime = true }) => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const [shareCount, setShareCount] = useState(0);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);

  // State Management
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [postViews, setPostViews] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Permissions and Ownership
  const isOwner = post.userId === user?.uid || post.user_id === user?.uid;

  const handleShare = useCallback(async () => {
    try {
      const result = await Share.share({
        title: post.title || `${post.userName}'s KLiqq`,
        message: `${post.title ? post.title + '\n\n' : ''}${post.content}\n\nShared via kliq:Student networking App`,
      });
      if (result.action === Share.sharedAction) {
        await incrementShareCount(post.id);
        setShareCount((prev) => prev + 1);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to share post");
    }
  }, [post.id, post.title, post.userName, post.content]);

  const handleSavePost = useCallback(async () => {
    if (!user) {
      Alert.alert("Please login", "You need to be logged in to save posts.");
      return;
    }
    try {
      if (isSaved) {
        // User wants to unsave
        const result = await unsavePost(post.id, user.uid);
        if (result !== false) { // unsavePost returns true on success
          setIsSaved(false);
        }
      } else {
        // User wants to save
        const result = await savePost(post.id, user.uid);
        
        // Check if save was actually added (result will be null if already saved)
        if (result !== null) {
          setIsSaved(true);
        } else {
          // Save already exists, sync the UI state
          console.log("Save already exists, syncing UI state");
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error("Save post error:", error);
      
      // If there's a duplicate key error, it means the save exists but UI is out of sync
      if (error.code === '23505') {
        console.log("Duplicate key error - syncing save state");
        setIsSaved(true);
      } else {
        Alert.alert("Error", "Unable to save post. Please try again.");
      }
    }
  }, [post.id, user, isSaved]);

  const renderImageGrid = () => {
    // Check for images in multiple possible properties
    const images = post?.mediaUrls || post?.images || [];
    
    // console.log('🖼️ PostCard renderImageGrid:', {
    //   postId: post?.id,
    //   mediaUrls: post?.mediaUrls,
    //   images: post?.images,
    //   finalImages: images,
    //   imageCount: images.length
    // });
    
    if (!images?.length) {
      return null;
    }

    const imageCount = images.length;
    // console.log(`🖼️ Rendering ${imageCount} images for post ${post?.id}`);

    // For single image, show without slider
    if (imageCount === 1) {
      // console.log('🖼️ Rendering single image:', images[0]);
      return (
        <View className="mt-4 rounded-xl overflow-hidden">
          <TouchableOpacity
            onPress={() => setSelectedImage(images[0])}
            onLongPress={() =>
              Alert.alert("Image Options", "Would you like to save this image?", [
                { text: "Cancel", style: "cancel" },
                { text: "Save", onPress: () => console.log("Save image functionality to be implemented") },
              ])
            }
          >
            <Image source={{ uri: images[0] }} className="w-full h-72 rounded-xl" resizeMode="cover" />
          </TouchableOpacity>
        </View>
      );
    }
    // Sample posts with images
    // For multiple images, show Instagram-style slider
    // console.log(`🖼️ Rendering ${imageCount} images in slider`);
    return (
      <View className="mt-4 rounded-xl overflow-hidden relative">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(newIndex);
          }}
          scrollEventThrottle={16}
        >
          {images.map((url, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedImage(url)}
              style={{ width: width }}
            >
              <Image 
                source={{ uri: url }} 
                style={{ width: width, height: 300 }}
                resizeMode="cover" 
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Image count indicator */}
        <View style={{
          position: 'absolute',
          top: 16,
          right: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 16,
        }}>
          <Text style={{
            color: 'white',
            fontSize: 13,
            fontFamily: Fonts.GeneralSans.Semibold,
          }}>
            {currentImageIndex + 1}/{imageCount}
          </Text>
        </View>

        {/* Pagination dots */}
        <View style={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {images.map((_, index) => (
            <View
              key={index}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: index === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                marginHorizontal: 3,
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  const ImageModal = ({ imageUrl, onClose }) => {
    const handleDoubleTap = () => {
      setZoomLevel(zoomLevel === 1 ? 2 : 1);
    };

    let lastTap = null;
    const handleTap = () => {
      const now = Date.now();
      if (lastTap && (now - lastTap) < 300) {
        handleDoubleTap();
      }
      lastTap = now;
    };

    return (
      <Modal transparent={true} visible={!!imageUrl} onRequestClose={onClose}>
        <View className="flex-1 bg-black/90 items-center justify-center" style={{ zIndex: 4000 }}>
          <TouchableOpacity onPress={onClose} className="absolute top-12 right-6 z-50">
            <View style={{
              backgroundColor: 'rgba(0,0,0,0.7)',
              borderRadius: 20,
              padding: 8,
            }}>
              <Ionicons name="close" size={24} color="white" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={1} onPress={handleTap} className="w-full h-full items-center justify-center">
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: width,
                height: height * 0.7,
                transform: [{ scale: zoomLevel }],
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Modal>
    );
  };

  const OptionsMenu = () => (
    <Modal 
      transparent={true} 
      visible={showOptionsMenu} 
      onRequestClose={() => setShowOptionsMenu(false)}
      animationType="fade"
    >
      <TouchableOpacity 
        className="flex-1" 
        activeOpacity={1} 
        onPress={() => setShowOptionsMenu(false)}
        style={{ 
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.5)' 
        }}
      >
        <View
          style={{
            backgroundColor: colors.cardBackground,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Handle bar */}
          <View style={{
            width: 40,
            height: 4,
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: 2,
            alignSelf: 'center',
            marginTop: 12,
            marginBottom: 24,
          }} />

          <Text style={{
            color: colors.text,
            fontSize: 18,
            fontFamily: Fonts.GeneralSans.Bold,
            textAlign: 'center',
            marginBottom: 24,
          }}>
            Post Options
          </Text>

          {isOwner ? (
            <>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                }}
                onPress={() => {
                  handleSavePost();
                  setShowOptionsMenu(false);
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons 
                    name={isSaved ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color={colors.accent} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                    {isSaved ? "Unsave Post" : "Save Post"}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {isSaved ? "Remove from saved posts" : "Save for later viewing"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                }}
                onPress={() => {
                  setShowOptionsMenu(false);
                  // TODO: Implement edit functionality
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons name="create-outline" size={20} color="#3B82F6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                    Edit Post
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    Make changes to your post
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                }}
                onPress={() => {
                  handleDeletePost();
                  setShowOptionsMenu(false);
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: '600' }}>
                    Delete Post
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    This action cannot be undone
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                }}
                onPress={() => {
                  handleSavePost();
                  setShowOptionsMenu(false);
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons 
                    name={isSaved ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color={colors.accent} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
                    {isSaved ? "Unsave Post" : "Save Post"}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    {isSaved ? "Remove from saved posts" : "Save for later viewing"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                }}
                onPress={() => {
                  handleReportPost();
                  setShowOptionsMenu(false);
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons name="flag-outline" size={20} color="#EF4444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: '600' }}>
                    Report Post
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>
                    Report inappropriate content
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        // Use the dedicated comment count from the post data
        setComments([]); // We don't need to load all comments in PostCard

        // Use the dedicated like count from the post data and check user's like status efficiently
        setLikes(post.like_count || 0);

        // Use the more efficient hasUserLiked function instead of fetching all likes
        if (user?.uid) {
          const userLiked = await hasUserLiked(post.id, user.uid);
          setIsLiked(userLiked);
          
          // Check if user has saved this post
          const userSaved = await hasUserSaved(post.id, user.uid);
          setIsSaved(userSaved);
        } else {
          setIsLiked(false);
          setIsSaved(false);
        }

        const fetchedViews = await getViews(post.id);
        setPostViews(fetchedViews);

        const fetchedShareCount = await getShareCount(post.id);
        setShareCount(fetchedShareCount || 0);

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Set up real-time subscriptions only if enabled (disabled for search results to prevent conflicts)
    let postChannel = null;
    let likesChannel = null;
    
    if (enableRealTime) {
      // Use a unique channel name with timestamp to prevent conflicts
      const channelId = `${post.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      postChannel = supabase
        .channel(`post-updates-${channelId}`)
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'posts',
            filter: `id=eq.${post.id}`
          }, 
          (payload) => {
            console.log('📊 Post update for post:', post.id, payload.new);
            
            // Update like count and comment count from the updated post data
            if (payload.new) {
              setLikes(payload.new.like_count || 0);
              // Comment count will be reflected through the post.comment_count in UI
            }
          }
        )
        .subscribe();

      // Set up real-time subscription for likes
      likesChannel = supabase
        .channel(`post-likes-${channelId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'likes',
            filter: `post_id=eq.${post.id}`
          }, 
          async (payload) => {
            console.log('❤️ Like update for post:', post.id, payload.eventType);
            
            if (payload.eventType === 'INSERT') {
              // Check if this like is from the current user
              if (payload.new?.user_id === user?.uid) {
                setIsLiked(true);
              }
              setLikes(prev => prev + 1);
            } else if (payload.eventType === 'DELETE') {
              // Check if this unlike is from the current user
              if (payload.old?.user_id === user?.uid) {
                setIsLiked(false);
              }
              setLikes(prev => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe();
    }

    return () => {
      console.log('🔌 Cleaning up PostCard subscriptions for post:', post.id);
      if (postChannel) {
        supabase.removeChannel(postChannel);
      }
      if (likesChannel) {
        supabase.removeChannel(likesChannel);
      }
    };
  }, [post.id, user]);

  const SkeletonLoader = () => (
    <View
      style={{
        backgroundColor: colors.cardBackground,
        padding: 20,
        marginBottom: 12,
        borderRadius: 20,
        marginHorizontal: 16,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.inputBg,
            marginRight: 12,
          }}
        />
        <View style={{ flex: 1 }}>
          <View
            style={{
              width: "60%",
              height: 16,
              backgroundColor: colors.inputBg,
              borderRadius: 8,
              marginBottom: 8,
            }}
          />
          <View
            style={{
              width: "40%",
              height: 12,
              backgroundColor: colors.inputBg,
              borderRadius: 6,
            }}
          />
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <View
          style={{
            width: "90%",
            height: 12,
            backgroundColor: colors.inputBg,
            borderRadius: 6,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            width: "100%",
            height: 12,
            backgroundColor: colors.inputBg,
            borderRadius: 6,
            marginBottom: 8,
          }}
        />
        <View
          style={{
            width: "75%",
            height: 12,
            backgroundColor: colors.inputBg,
            borderRadius: 6,
          }}
        />
      </View>

      <View
        style={{
          width: "100%",
          height: 240,
          backgroundColor: colors.inputBg,
          borderRadius: 16,
          marginBottom: 16,
        }}
      />
    </View>
  );

  if (isLoading) {
    return <SkeletonLoader />;
  }

  const handleLike = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to like posts");
      return;
    }

    if (isLikeProcessing) return;

    try {
      setIsLikeProcessing(true);

      if (isLiked) {
        // User wants to unlike
        const result = await removeLike(post.id, user);
        if (result !== false) { // removeLike returns true on success, false on failure
          setLikes((prev) => Math.max(0, prev - 1));
          setIsLiked(false);
        }
      } else {
        // User wants to like
        const result = await addLike(post.id, user);
        
        // Check if like was actually added (result will be null if already liked)
        if (result !== null) {
          setLikes((prev) => prev + 1);
          setIsLiked(true);
        } else {
          // Like already exists, sync the UI state
          console.log("Like already exists, syncing UI state");
          setIsLiked(true);
          
          // Re-fetch the actual like count to ensure accuracy
          const actualLikes = await getLikes(post.id);
          setLikes(actualLikes.length);
        }
      }
    } catch (error) {
      console.error("Like error:", error);
      
      // If there's a duplicate key error, it means the like exists but UI is out of sync
      if (error.code === '23505') {
        console.log("Duplicate key error - syncing UI state");
        setIsLiked(true);
        
        // Re-fetch to get accurate count
        try {
          const actualLikes = await getLikes(post.id);
          setLikes(actualLikes.length);
        } catch (syncError) {
          console.error("Error syncing like state:", syncError);
        }
      } else {
        Alert.alert("Error", "Unable to process like. Please try again.");
      }
    } finally {
      setTimeout(() => {
        setIsLikeProcessing(false);
      }, 500);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to comment");
      return;
    }

    try {
      const commentData = {
        content: newComment,
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userAvatar: user.photoURL || DEFAULT_AVATAR,
        timestamp: new Date(),
      };

      await addComment(post.id, commentData);
      setNewComment("");

      const updatedComments = await getComments(post.id);
      setComments(updatedComments);
    } catch (error) {
      console.error("Comment error:", error);
      Alert.alert("Error", "Unable to post comment. Please try again.");
    }
  };

  const handleDeletePost = async () => {
    if (!post?.id || !user?.uid) {
      console.error("Delete post error: Missing post ID or user ID");
      Alert.alert("Error", "Unable to delete post. Missing required information.");
      return;
    }

    try {
      console.log("Deleting post:", post.id, "by user:", user.uid);
      await deletePost(post.id, user.uid);
      
      // Emit an event to notify other components (like the feed)
      EventEmitter.emit('post-deleted', post.id);

      Alert.alert("Success", "Post deleted successfully");

      // If on detail view, navigate back
      if (isDetailView) {
        router.back();
      }

    } catch (error) {
      console.error("Delete post error:", error);
      Alert.alert("Error", "Unable to delete post. Please try again.");
    }
  };

  const handleReportPost = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to report posts");
      return;
    }

    try {
      Alert.alert(
        "Report Post",
        "Why are you reporting this post?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Inappropriate Content", onPress: () => submitReport("inappropriate_content") },
          { text: "Spam", onPress: () => submitReport("spam") },
          { text: "Harassment", onPress: () => submitReport("harassment") },
        ]
      );
    } catch (error) {
      console.error("Report post error:", error);
      Alert.alert("Error", "Unable to report post. Please try again.");
    }
  };

  const submitReport = async (reason) => {
    try {
      await reportPost(post.id, user.uid, reason);
      Alert.alert("Report Submitted", "Thank you for reporting this post.");
    } catch (error) {
      console.error("Submit report error:", error);
      Alert.alert("Error", "Unable to submit report. Please try again.");
    }
  };

  return (
    <View>
              {isHotPost && <HotPostBanner onPress={async () => {
          try {
            await safeNavigate(`/postDetailView/${post.id}`, { push: true });
          } catch (error) {
            router.push(`/postDetailView/${post.id}`);
          }
        }} />}

      <View
        style={{
          backgroundColor:'#121212',
          marginHorizontal: 0,
          marginBottom: 0,
          borderRadius: 0,
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        {/* User Header */}
        <View style={{ 
          flexDirection: "row", 
          justifyContent: "space-between", 
          alignItems: "center", 
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: 12
        }}>
          <TouchableOpacity 
            style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            onPress={async () => {
              try {
                await safeNavigate(`/profile/${post.userId}`, { push: true });
              } catch (error) {
                router.push(`/profile/${post.userId}`);
              }
            }}
          >
            {/* Profile initials instead of image */}
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: colors.inputBg,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              borderWidth: 2,
              borderColor: colors.accent,
            }}>
              <Text style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: '800',
                letterSpacing: -0.3,
              }}>
                {post.profile_initials || post.user_initials || 
                 (post.userName || post.user_name || 'A').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: Fonts.GeneralSans.Semibold,
                  fontSize: 16,
                  color: isHotPost ? colors.accent : colors.text,
                  marginBottom: 2,
                }}
              >
                @{post.username || post.user_username || (post.userName || post.user_name || 'anonymous').toLowerCase()}
                {isHotPost && <Text style={{ fontSize: 12, color: colors.accent, marginLeft: 6, fontFamily: Fonts.GeneralSans.Medium }}>{" 🔥"}</Text>}
              </Text>
              
              {/* Show full name as secondary text */}
              {/* <Text style={{ 
                fontSize: 12, 
                color: colors.textMuted, 
                fontWeight: '500',
                marginBottom: 2 
              }}>
                {post.userName || post.user_name || 'Anonymous'}
              </Text>
               */}
              {/* Show college name for non-anonymous posts */}
              {(post.userName !== 'Anonymous' && post.user_name !== 'Anonymous') && (post.college || post.userCollege) && (
                <Text style={{ 
                  fontSize: 11, 
                  color: colors.textMuted, 
                  fontFamily: Fonts.GeneralSans.Regular,
                  marginBottom: 2 
                }}>
                  {typeof (post.college || post.userCollege) === 'object' 
                    ? (post.college?.name || post.userCollege?.name || '')
                    : (post.college || post.userCollege)
                  }
                </Text>
              )}
              
              <Text style={{ fontSize: 14, color: colors.textSecondary, fontFamily: Fonts.GeneralSans.Medium }}>
                {formatTimestamp(post.createdAt || post.created_at)}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowOptionsMenu(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons 
              name="ellipsis-horizontal" 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>


        <TouchableOpacity
          onPress={async () => {
            try {
              await safeNavigate(`/postDetailView/${post.id}`, { push: true });
            } catch (error) {
              router.push(`/postDetailView/${post.id}`);
            }
          }}
          style={
            isHotPost
              ? {
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 16,
                }
              : { marginBottom: 16 }
          }
        >
          <Text
            style={{
              color: colors.text,
              fontSize: 17,
              lineHeight: 26,
              fontFamily: Fonts.GeneralSans.Medium,
            }}
            numberOfLines={isDetailView ? undefined : 3}
          >
            {post.content}
          </Text>
        </TouchableOpacity>
        </View>

        {renderImageGrid()}

        {/* Action Bar */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginTop: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity 
              style={{ 
                flexDirection: "row", 
                alignItems: "center",
                backgroundColor: isLiked ? "rgba(139, 92, 246, 0.15)" : "rgba(255,255,255,0.05)",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 25,
                marginRight: 12,
                minWidth: 60,
                justifyContent: "center",
              }} 
              onPress={handleLike}
            >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
                size={22}
                color={isLiked ? colors.like : colors.textSecondary}
            />
              {likes > 0 && (
            <Text
              style={{
                    marginLeft: 8,
                    color: isLiked ? colors.like : colors.textSecondary,
                    fontSize: 14,
                    fontFamily: Fonts.GeneralSans.Semibold,
                  }}
                >
                  {likes > 999 ? `${(likes / 1000).toFixed(1)}K` : likes}
            </Text>
              )}
          </TouchableOpacity>

          <TouchableOpacity
              style={{ 
                flexDirection: "row", 
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.05)",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 25,
                marginRight: 12,
                minWidth: 60,
                justifyContent: "center",
              }}
            onPress={async () => {
              try {
                await safeNavigate(`/postDetailView/${post.id}`, { push: true });
              } catch (error) {
                router.push(`/postDetailView/${post.id}`);
              }
            }}
          >
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
              {(post.comment_count || 0) > 0 && (
            <Text
              style={{
                    marginLeft: 8,
                color: colors.textSecondary,
                    fontSize: 14,
                    fontFamily: Fonts.GeneralSans.Semibold,
              }}
            >
              {post.comment_count || 0}
            </Text>
              )}
          </TouchableOpacity>

            <TouchableOpacity 
              style={{ 
                flexDirection: "row", 
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.05)",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 25,
                minWidth: 60,
                justifyContent: "center",
              }} 
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: isSaved ? "rgba(139, 92, 246, 0.15)" : "rgba(255,255,255,0.05)",
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={handleSavePost}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isSaved ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <OptionsMenu />
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => {
            setSelectedImage(null);
            setZoomLevel(1);
          }}
        />
      </View>
      
      {/* Light separation line */}
      <View style={{
        height: 1.5,
        backgroundColor: 'black',
        marginHorizontal: 0,
        marginBottom: 0,
      }} />
    </View>
  );
};

// Memoize PostCard for performance optimization
export default memo(PostCard, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.like_count === nextProps.post.like_count &&
    prevProps.post.comment_count === nextProps.post.comment_count &&
    prevProps.isDetailView === nextProps.isDetailView &&
    prevProps.isHotPost === nextProps.isHotPost &&
    prevProps.enableRealTime === nextProps.enableRealTime
  );
});