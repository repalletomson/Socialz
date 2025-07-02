import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/authContext';
import { safeNavigate } from '../utiles/safeNavigation';
import {
  addLike,
  removeLike,
  hasUserLiked,
  hasUserSaved,
} from '../(apis)/post';

const { width, height } = Dimensions.get('window');

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

// Profile PostCard Component (without horizontal margins)
const ProfilePostCard = ({ post }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLikeProcessing, setIsLikeProcessing] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLikes(post.like_count || 0);
        
        if (user?.uid) {
          const userLiked = await hasUserLiked(post.id, user.uid);
          setIsLiked(userLiked);
          
          const userSaved = await hasUserSaved(post.id, user.uid);
          setIsSaved(userSaved);
        } else {
          setIsLiked(false);
          setIsSaved(false);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    fetchInitialData();
  }, [post.id, user?.uid]);

  const handleLike = async () => {
    if (!user) {
      Alert.alert("Please login", "You need to be logged in to like posts.");
      return;
    }
    
    if (isLikeProcessing) return;
    
    try {
      setIsLikeProcessing(true);
      
      if (isLiked) {
        await removeLike(post.id, user.uid);
        setIsLiked(false);
        setLikes(prev => Math.max(0, prev - 1));
      } else {
        await addLike(post.id, user.uid);
        setIsLiked(true);
        setLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error("Like error:", error);
      Alert.alert("Error", "Unable to process like. Please try again.");
    } finally {
      setIsLikeProcessing(false);
    }
  };

  const renderImageGrid = () => {
    const images = post?.mediaUrls || post?.images || [];
    
    if (images.length === 0) return null;
    
    return (
      <View style={{ marginTop: 16 }}>
        {images.length === 1 ? (
          <TouchableOpacity onPress={() => {}}>
            <Image source={{ uri: images[0] }} style={{ width: '100%', height: 280, borderRadius: 16 }} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {images.slice(0, 4).map((uri, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={() => {}} 
                style={{ 
                  width: '48.5%',
                  aspectRatio: 1,
                  marginBottom: '3%',
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

  return (
    <TouchableOpacity
      onPress={async () => {
        try {
          await safeNavigate(`/postDetailView/${post.id}`, { push: true });
        } catch (error) {
          router.push(`/postDetailView/${post.id}`);
        }
      }}
    >
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
          width: '100%',
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
                  fontWeight: "600",
                  fontSize: 16,
                  color: colors.text,
                  marginBottom: 2,
                }}
              >
                @{post.username || post.user_username || (post.userName || post.user_name || 'anonymous').toLowerCase()}
              </Text>
              
              <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '500' }}>
                {formatTimestamp(post.createdAt || post.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 16,
              lineHeight: 24,
              fontWeight: '400',
            }}
            numberOfLines={3}
          >
            {post.content}
          </Text>
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
                    fontWeight: '600',
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
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
              {(post.comment_count || 0) > 0 && (
                <Text
                  style={{
                    marginLeft: 8,
                    color: colors.textSecondary,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  {post.comment_count > 999 ? `${(post.comment_count / 1000).toFixed(1)}K` : post.comment_count}
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
            >
              <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
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
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isSaved ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProfilePostCard; 