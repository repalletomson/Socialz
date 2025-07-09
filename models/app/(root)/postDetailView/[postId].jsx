import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Animated,
  Switch
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../../config/supabaseConfig';
import { useAuthStore } from '../../../stores/useAuthStore';
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
  getSavedPosts,
  hasUserLiked,
  hasUserSaved,
} from "../../../(apis)/post"
import { LinearGradient } from 'expo-linear-gradient';
import PostCard from '../../../components/PostCard';
import networkErrorHandler from '../../../utiles/networkErrorHandler';
import { updateStreakForComment } from '../../../(apis)/streaks';
import StreakCelebrationModal from '../../../components/StreakCelebrationModal';
import { Fonts, TextStyles } from '../../../constants/Fonts';
import EventEmitter from '../../../utiles/EventEmitter';

const COLORS = {
  background: '#000000',
  cardBg: '#000000',
  text: '#FFFFFF',
  textSecondary: '#E5E5E5',
  textMuted: '#A1A1AA',
  inputBg: '#1A1A1A',
  accent: '#8B5CF6',
  like: '#8B5CF6',
  success: '#10B981',
  shadow: 'rgba(139, 92, 246, 0.15)',
};

function getAnonPseudonym(userId, postId) {
  const str = `${userId}:${postId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  // Convert hash to base36 and take last 2 chars
  const code = Math.abs(hash).toString(36).slice(-2);
  return `anonymous-${code}`;
}

// Add this function for color-coding pseudonyms
function getColorFromPseudonym(pseudonym) {
  let hash = 0;
  for (let i = 0; i < pseudonym.length; i++) {
    hash = pseudonym.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 60%)`;
}

export default function PostDetailView() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();  
  const { user } = useAuthStore();  
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState({});
  const scrollViewRef = useRef();
  const commentInputRef = useRef();
  const [showAllRepliesMap, setShowAllRepliesMap] = useState({});
  const [commentOptions, setCommentOptions] = useState(null);

  // Helper function to organize comments into hierarchical structure
  const organizeComments = (commentsArray) => {
    const commentMap = {};
    const topLevelComments = [];

    // First pass: create a map of all comments
    commentsArray.forEach(comment => {
      commentMap[comment.id] = {
        ...comment,
        replies: []
      };
    });

    // Second pass: organize into hierarchy
    commentsArray.forEach(comment => {
      if (comment.parent_comment_id) {
        // This is a reply
        const parentComment = commentMap[comment.parent_comment_id];
        if (parentComment) {
          parentComment.replies.push(commentMap[comment.id]);
        }
      } else {
        // This is a top-level comment
        topLevelComments.push(commentMap[comment.id]);
      }
    });

    return topLevelComments;
  };

  useEffect(() => {
    console.log('🔗 Setting up PostDetailView for post:', postId, 'user:', user?.id);
    
    const fetchPostDetails = async () => {
      try {
        console.log('📖 Fetching post details for:', postId);
        
        // Fetch post from Supabase
        const { data: postData, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .single();
        
        if (error) {
          console.error('❌ Error fetching post:', error);
          networkErrorHandler.showErrorToUser(error);
          return;
        }
        
        if (postData) {
          console.log('✅ Post data loaded:', postData.title);
          console.log('📊 Post data fields:', Object.keys(postData));
          console.log('🕐 Created at:', postData.created_at);
          console.log('👤 User name:', postData.user_name);
          console.log('🖼️ User avatar:', postData.user_avatar);
          
          // Normalize field names for consistent access
          const normalizedPost = {
            ...postData,
            userName: postData.user_name || postData.userName || 'Anonymous',
            userAvatar: postData.user_avatar || postData.userAvatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            createdAt: postData.created_at || postData.createdAt,
            userId: postData.user_id || postData.userId
          };
          
          setPost(normalizedPost);
          
          // Use the dedicated like count from the post data
          setLikes(postData.like_count || 0);
          setCommentCount(postData.comment_count || 0);
          
          // Check user's like and save status efficiently
          if (user?.id) {
            const userLiked = await hasUserLiked(postId, user.id);
            setIsLiked(userLiked);
            
            const userSaved = await hasUserSaved(postId, user.id);
            setIsSaved(userSaved);
          } else {
            setIsLiked(false);
            setIsSaved(false);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching post details:', error);
      }
    };

    const fetchComments = async () => {
      try {
        console.log('💬 Fetching comments for post:', postId);
        
        const { data: commentsData, error } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('❌ Error fetching comments:', error);
          networkErrorHandler.showErrorToUser(error);
          return;
        }
        
        console.log('✅ Comments loaded:', commentsData?.length || 0);
        console.log('💬 Raw comments data:', commentsData);
        
        // Debug each comment
        if (commentsData && commentsData.length > 0) {
          commentsData.forEach((comment, index) => {
            console.log(`Comment ${index}:`, {
              id: comment.id,
              content: comment.content,
              user_name: comment.user_name,
              created_at: comment.created_at,
              parent_comment_id: comment.parent_comment_id
            });
          });
        }
        
        // Organize comments into hierarchical structure
        const organizedComments = organizeComments(commentsData || []);
        console.log('🏗️ Organized comments:', organizedComments.length, 'top-level comments');
        setComments(organizedComments);
      } catch (error) {
        console.error('❌ Error fetching comments:', error);
      }
    };

    fetchPostDetails();
    fetchComments();
    
    // Set up real-time subscription for comments with improved handling
    const commentsChannel = supabase
      .channel(`comments-${postId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: user?.id }
        }
      })
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comments',
          filter: `post_id=eq.${postId}`
        }, 
        (payload) => {
          console.log('💬 Real-time comment update:', {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
          
          if (payload.eventType === 'INSERT' && payload.new) {
            // Fetch all comments again to maintain proper hierarchy
            fetchComments();
            
            // Update comment count only for top-level comments
            if (!payload.new.parent_comment_id) {
              setCommentCount(prev => prev + 1);
            }
          } else if (payload.eventType === 'DELETE' && payload.old) {
            // Fetch all comments again to maintain proper hierarchy
            fetchComments();
            
            // Update comment count only for top-level comments
            if (!payload.old.parent_comment_id) {
              setCommentCount(prev => Math.max(0, prev - 1));
            }
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            // Fetch all comments again to maintain proper hierarchy
            fetchComments();
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for likes
    const likesChannel = supabase
      .channel(`likes-${postId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'likes',
          filter: `post_id=eq.${postId}`
        }, 
        async (payload) => {
          console.log('❤️ Like update:', payload.eventType);
          
          // Update user's like status
          const { data: likeData, error: likeError } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', postId)
            .eq('user_id', user?.id);
          
          if (!likeError) {
            setIsLiked(likeData && likeData.length > 0);
          }
          
          // Update total likes count
          const { count: likesCount, error: countError } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);
          
          if (!countError) {
            setLikes(likesCount || 0);
          }
        }
      )
      .subscribe();
    
    return () => {
      console.log('🔌 Cleaning up post detail subscriptions');
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [postId, user?.id]);

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now - date;
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      
      if (diffInMinutes < 1) return 'now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'unknown';
    }
  };

  const renderImageGrid = () => {
    if (!post) return null;
    
    // Handle images from multiple possible properties
    const images = post.mediaUrls || post.images || (post.mediaUrl ? [post.mediaUrl] : []);
    if (images.length === 0) return null;
    
    return (
      <View style={{ marginTop: 16 }}>
        {images.length === 1 ? (
          <TouchableOpacity onPress={() => setSelectedImage(images[0])}>
            <Image source={{ uri: images[0] }} style={{ width: '100%', height: 280, borderRadius: 16 }} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {images.slice(0, 4).map((uri, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => setSelectedImage(uri)} 
                style={{ 
                  width: '48.5%', // Use percentage for responsive grid
                  aspectRatio: 1, // Maintain square shape
                  marginBottom: '3%', // Add vertical gap
                }}
              >
                <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
                {index === 3 && images.length > 4 && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>+{images.length - 4}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const toggleShowAllReplies = (commentId) => {
    setShowAllRepliesMap(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Update renderCommentItem to remove left margin for replies, decrease text size, and color-code anonymous avatars
  const renderCommentItem = (item, isReply = false) => {
    const isOwnComment = (item.user_id) === user?.id;
    const userName = item.user_name || 'Anonymous';
    const content = item.content || '';
    const isAnonymousUser = item.is_anonymous;
    const avatarBgColor = isAnonymousUser ? getColorFromPseudonym(userName) : COLORS.inputBg;
    const avatarText = isAnonymousUser ? 'A' : userName.charAt(0).toUpperCase();
    return (
      <View
        key={item.id}
        style={{
          backgroundColor: isReply ? 'rgba(139,92,246,0.07)' : COLORS.cardBg,
          marginBottom: 4,
          marginLeft: isReply ? 0 : 0,
          borderRadius: 12,
          padding: 10,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: avatarBgColor, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700' }}>{avatarText}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Text style={{ color: COLORS.text, fontSize: 16, fontFamily: Fonts.GeneralSans.Bold, marginRight: 8 }}>{userName}</Text>
              <TouchableOpacity onPress={() => setCommentOptions({ id: item.id, isOwn: isOwnComment })} style={{ padding: 4 }}>
                <Ionicons name="ellipsis-horizontal" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: COLORS.text, fontSize: 15, lineHeight: 22, fontFamily: Fonts.GeneralSans.Regular }}>{content}</Text>
            {/* Only show Reply for main comments */}
            {!isReply && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <TouchableOpacity
                  onPress={() => handleReplyPress(item.id, userName)}
                  style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8 }}
                >
                  <Text style={{ color: COLORS.accent, fontSize: 13, fontFamily: Fonts.GeneralSans.Semibold }}>Reply</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        {/* Replies: group with a single vertical line */}
        {!isReply && item.replies && item.replies.length > 0 && (
          <View style={{ flexDirection: 'row', marginTop: 4, marginLeft: 32 }}>
            <View style={{ width: 1.5, backgroundColor: COLORS.accent, borderRadius: 1, marginRight: 10, marginTop: 2, marginBottom: 2 }} />
            <View style={{ flex: 1 }}>
              {item.replies.map(reply => renderCommentItem(reply, true))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to like posts");
      return;
    }
    
    if (isLikeProcessing) return;
    
    try {
      setIsLikeProcessing(true);
      
      if (isLiked) {
        // User wants to unlike - delete from likes table
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
          
        if (error) {
          console.error('❌ Error removing like:', error);
          networkErrorHandler.showErrorToUser(error);
          Alert.alert("Error", "Failed to remove like. Please try again.");
          return;
        }
        
        console.log('✅ Like removed successfully');
        setIsLiked(false);
        
      } else {
        // User wants to like - insert into likes table
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
            created_at: new Date().toISOString()
          });
          
        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            console.log('⚠️ User already liked this post');
            setIsLiked(true); // Sync UI state
            return;
          }
          console.error('❌ Error adding like:', error);
          networkErrorHandler.showErrorToUser(error);
          Alert.alert("Error", "Failed to add like. Please try again.");
          return;
        }
        
        console.log('✅ Like added successfully');
        setIsLiked(true);
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

  const handleSavePost = async () => {
    try {
      if (isSaved) {
        // User wants to unsave
        const result = await unsavePost(post.id, user.id);
        if (result !== false) {
          setIsSaved(false);
        }
      } else {
        // User wants to save
        const result = await savePost(post.id, user.id);
        
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
      networkErrorHandler.showErrorToUser(error);
      if (error.code === '23505') {
        console.log("Duplicate key error - syncing save state");
        setIsSaved(true);
      } else {
        Alert.alert("Error", "Unable to save post. Please try again.");
      }
    }
  };

  const handleReplyPress = (commentId, userName) => {
    setReplyingTo({ id: commentId, name: userName });
    setNewComment(`@${userName} `);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      console.log('💬 Adding comment to post:', postId);
      
      const commentData = {
        post_id: postId,
        user_id: user.id,
        parent_comment_id: replyingTo?.id || null,
        content: newComment.trim(),
        user_name: isAnonymous ? getAnonPseudonym(user.id, postId) : user.full_name || user.name || 'User',
        user_avatar: isAnonymous ? null : user.profile_image || user.avatar,
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Clear form immediately for better UX
      setNewComment('');
      setIsAnonymous(false);
      setReplyingTo(null);

      // Scroll to bottom to show new comment area
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Save to database
      const { data, error } = await supabase
        .from('comments')
        .insert(commentData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding comment:', error);
        networkErrorHandler.showErrorToUser(error);
        Alert.alert('Error', 'Failed to add comment. Please try again.');
        return;
      }

      console.log('✅ Comment added successfully to database');
      
      // The real-time subscription will handle updating the UI

      // ---- New Streak Logic ----
      // Update streak for commenting on other users' posts
      try {
        console.log('🔥 Updating streak for comment...');
        const streakResult = await updateStreakForComment(user.id, post.user_id || post.userId);
        
        if (streakResult.streakIncreased) {
          console.log(`🎉 Streak increased to ${streakResult.current_streak}!`);
          // Show beautiful celebration modal
          setCelebrationData({
            streakCount: streakResult.current_streak,
            previousStreak: streakResult.previousStreak,
            isFirstStreak: streakResult.current_streak === 1 && streakResult.previousStreak === 0
          });
          setShowCelebration(true);
          // Emit event for Home page
          EventEmitter.emit('streak-achieved', {
            streakCount: streakResult.current_streak,
            previousStreak: streakResult.previousStreak,
            isFirstStreak: streakResult.current_streak === 1 && streakResult.previousStreak === 0
          });
        } else if (streakResult.commentsProgress) {
          console.log(`💬 Comment progress: ${streakResult.commentsProgress}/5`);
          // Optional: Show progress toast
        } else if (streakResult.ownPost) {
          console.log('❌ Comment on own post, not counting for streak');
        }
      } catch (streakError) {
        console.error('❌ Error updating streak:', streakError);
        // Non-critical error, so we don't need to alert the user
      }

    } catch (error) {
      console.error('❌ Error adding comment:', error);
      networkErrorHandler.showErrorToUser(error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    // Only allow delete if own comment
    if (!commentOptions?.isOwn) return;
    await supabase.from('comments').delete().eq('id', commentId);
    setCommentOptions(null);
  };

  if (!post) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: COLORS.text, fontSize: 18 }}>Loading...</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'red' }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#000' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: '#000',
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 5,
        }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', pointerEvents: 'none' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Medium, marginRight: 2, letterSpacing: -1 }}>social</Text>
              <Text style={{ fontSize: 24, color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Bold, letterSpacing: -2 }}>z.</Text>
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          ref={scrollViewRef} 
          style={{ flex: 1, backgroundColor: '#000' }}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Post Card */}
          <View style={{
            backgroundColor: COLORS.cardBg,
            marginHorizontal: 0,
            // marginVertical: 20,
            borderRadius: 0,
            shadowColor: COLORS.shadow,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 8,
          }}>
            {/* User Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: COLORS.cardBg }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.inputBg, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.accent, marginRight: 8 }}>
                <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: '800' }}>
                  {(post?.userName || 'A').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 16, fontFamily: Fonts.GeneralSans.Bold }}>
                  {post?.username ? `@${post.username}` : 'Anonymous'}
                </Text>
                <Text style={{ color: COLORS.textMuted, fontSize: 13, fontFamily: Fonts.GeneralSans.Regular, marginTop: 2 }}>
                  {formatTimestamp(post?.createdAt)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCommentOptions({ id: post.id, isOwn: post.userId === user?.id })} style={{ padding: 4 }}>
                <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Post Content */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
              {post.title && (
                <Text style={{
                  fontSize: 22,
                  fontFamily: Fonts.GeneralSans.Bold,
                  color: COLORS.text,
                  marginBottom: 16,
                  lineHeight: 30,
                }}>
                  {post.title}
                </Text>
              )}

              <Text style={{
                color: COLORS.text,
                fontSize: 17,
                lineHeight: 26,
                marginBottom: 16,
                fontFamily: Fonts.GeneralSans.Regular
              }}>
                {post.content}
              </Text>
            </View>

            {renderImageGrid()}

            {/* Action Bar */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 20,
              marginTop: 12,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: isLiked ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 28,
                    marginRight: 16,
                    minWidth: 70,
                    justifyContent: 'center',
                  }} 
                  onPress={handleLike}
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={22}
                    color={isLiked ? COLORS.like : COLORS.textSecondary}
                  />
                  {likes > 0 && (
                    <Text style={{
                      marginLeft: 8,
                      color: isLiked ? COLORS.like : COLORS.textSecondary,
                      fontSize: 15,
                      fontFamily: Fonts.GeneralSans.Semibold,
                    }}>
                      {likes > 999 ? `${(likes / 1000).toFixed(1)}K` : likes}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 28,
                  marginRight: 16,
                  minWidth: 70,
                  justifyContent: 'center',
                }}>
                  <Ionicons name="chatbubble-outline" size={20} color={COLORS.textSecondary} />
                  {commentCount > 0 && (
                    <Text style={{
                      marginLeft: 8,
                      color: COLORS.textSecondary,
                      fontSize: 15,
                      fontFamily: Fonts.GeneralSans.Semibold,
                    }}>
                      {commentCount}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    paddingHorizontal: 18,
                    paddingVertical: 12,
                    borderRadius: 28,
                    minWidth: 70,
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="share-outline" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isSaved ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={handleSavePost}
              >
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={isSaved ? COLORS.accent : COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments Section */}
          <View style={{ paddingHorizontal: 20, backgroundColor: 'transparent' }}>
            <Text style={{ 
              color: COLORS.text, 
              fontSize: 20, 
              fontFamily: Fonts.GeneralSans.Bold, 
              marginBottom: 20 
            }}>
              Comments ({commentCount})
            </Text>
            {comments.length > 0 ? (
              comments.map(comment => renderCommentItem(comment))
            ) : (
              <View style={{
                backgroundColor: 'transparent',
                borderRadius: 20,
                padding: 40,
                alignItems: 'center',
              }}>
                <Ionicons name="chatbubble-outline" size={56} color={COLORS.textSecondary} />
                <Text style={{ 
                  color: COLORS.textSecondary, 
                  fontSize: 20,
                  textAlign: 'center',
                  marginTop: 16,
                  fontFamily: Fonts.GeneralSans.Medium
                }}>
                  No comments yet.{'\n'}Be the first to comment!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Comment Input */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#000', shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.8, shadowRadius: 15, elevation: 10 }}>
          {replyingTo && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.inputBg, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginBottom: 12 }}>
              <Text style={{ color: COLORS.text, fontSize: 15, fontFamily: Fonts.GeneralSans.Medium }}>
                Replying to <Text style={{ color: COLORS.accent, fontFamily: Fonts.GeneralSans.Bold }}>{replyingTo.name}</Text>
              </Text>
              <TouchableOpacity onPress={() => { setReplyingTo(null); setNewComment(''); }}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg, borderRadius: 28, paddingLeft: 8, paddingRight: 8, paddingVertical: 8 }}>
            <TouchableOpacity
              onPress={() => setIsAnonymous((prev) => !prev)}
              style={{
                marginRight: 10,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isAnonymous ? COLORS.accent : COLORS.textMuted,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: isAnonymous ? COLORS.accent : COLORS.textMuted,
              }}
              accessibilityLabel="Toggle anonymous comment"
            >
              {isAnonymous ? (
                <FontAwesome5 name="user-secret" size={18} color="#fff" />
              ) : (
                <FontAwesome5 name="user" size={18} color="#fff" />
              )}
            </TouchableOpacity>
            <TextInput
              ref={commentInputRef}
              value={newComment}
              onChangeText={setNewComment}
              placeholder={isAnonymous ? "Comment as anonymous..." : "Add a comment..."}
              placeholderTextColor={COLORS.textSecondary}
              style={{ flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 10, fontFamily: Fonts.GeneralSans.Regular, backgroundColor: 'transparent' }}
              multiline
            />
            <TouchableOpacity onPress={handleAddComment} disabled={!newComment.trim()} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', opacity: !newComment.trim() ? 0.5 : 1 }}>
              <LinearGradient colors={[COLORS.accent, '#A855F7']} style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                <FontAwesome5 name="paper-plane" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Image Preview Modal */}
      {selectedImage && (
        <Modal visible={true} transparent={true} animationType="fade">
          <Pressable 
            style={{ 
              flex: 1, 
              backgroundColor: 'rgba(0,0,0,0.95)', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }} 
            onPress={() => setSelectedImage(null)}
          >
            <TouchableOpacity 
              style={{ 
                position: 'absolute', 
                top: 60, 
                right: 24, 
                zIndex: 10,
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderRadius: 24,
                padding: 12,
              }}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Image 
              source={{ uri: selectedImage }} 
              style={{ width: '90%', height: '70%' }}
              resizeMode="contain" 
            />
          </Pressable>
        </Modal>
      )}

      {/* Comment Options Modal */}
      <Modal visible={!!commentOptions} transparent animationType="fade" onRequestClose={() => setCommentOptions(null)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setCommentOptions(null)}>
          <View style={{ backgroundColor: COLORS.cardBg, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 24 }}>
            {commentOptions?.isOwn && (
              <TouchableOpacity onPress={() => handleDeleteComment(commentOptions.id)} style={{ paddingVertical: 12 }}>
                <Text style={{ color: COLORS.accent, fontFamily: Fonts.GeneralSans.Bold, fontSize: 16 }}>Delete Comment</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setCommentOptions(null)} style={{ paddingVertical: 12 }}>
              <Text style={{ color: COLORS.textSecondary, fontFamily: Fonts.GeneralSans.Medium, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Streak Celebration Modal */}
      <StreakCelebrationModal
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
        streakCount={celebrationData.streakCount}
        previousStreak={celebrationData.previousStreak}
        isFirstStreak={celebrationData.isFirstStreak}
      />
    </SafeAreaView>
  );
};