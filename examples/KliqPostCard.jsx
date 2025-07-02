import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  StyleSheet
} from 'react-native';
import {
  getCurrentUser,
  toggleLike,
  toggleSavePost,
  isPostLiked,
  createComment,
  getPostComments,
  subscribeToPostLikes,
  subscribeToPostComments,
  createNotification
} from '../lib/supabase';

const KliqPostCard = ({ post, onCommentPress }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    initializeUser();
    setupRealtimeSubscriptions();
    
    return () => {
      // Cleanup subscriptions when component unmounts
      cleanupSubscriptions();
    };
  }, [post.id]);

  const initializeUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        // Check if post is already liked
        const isLiked = await isPostLiked(user.uid, post.id);
        setLiked(isLiked);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to real-time like updates
    const likesChannel = subscribeToPostLikes(post.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setLikeCount(prev => prev + 1);
      } else if (payload.eventType === 'DELETE') {
        setLikeCount(prev => Math.max(0, prev - 1));
      }
    });

    // Subscribe to real-time comment updates
    const commentsChannel = subscribeToPostComments(post.id, (payload) => {
      if (payload.eventType === 'INSERT') {
        setCommentCount(prev => prev + 1);
        // Add new comment to the list if we're showing comments
        if (showComments) {
          loadComments();
        }
      }
    });
  };

  const cleanupSubscriptions = () => {
    // Subscriptions are automatically cleaned up when channels are garbage collected
  };

  const handleLike = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to like posts');
      return;
    }

    try {
      const result = await toggleLike(currentUser.uid, post.id);
      setLiked(result.liked);
      
      // Create notification for post author (if not self-like)
      if (result.liked && post.user_id !== currentUser.uid) {
        await createNotification(post.user_id, {
          type: 'like',
          title: 'New Like',
          message: `${currentUser.displayName} liked your post`,
          data: {
            post_id: post.id,
            user_id: currentUser.uid,
            user_name: currentUser.displayName
          }
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleSave = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to save posts');
      return;
    }

    try {
      const result = await toggleSavePost(currentUser.uid, post.id);
      setSaved(result.saved);
      
      Alert.alert(
        result.saved ? 'Post Saved' : 'Post Unsaved',
        result.saved ? 'Post saved to your collection' : 'Post removed from your collection'
      );
    } catch (error) {
      console.error('Error toggling save:', error);
      Alert.alert('Error', 'Failed to save post');
    }
  };

  const handleComment = async () => {
    if (onCommentPress) {
      onCommentPress(post);
    } else {
      setShowComments(!showComments);
      if (!showComments) {
        await loadComments();
      }
    }
  };

  const loadComments = async () => {
    try {
      const postComments = await getPostComments(post.id);
      setComments(postComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = {
        message: `Check out this post on Kliq: "${post.content}"`,
        url: `https://kliq.app/post/${post.id}` // Replace with your actual app URL
      };
      
      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMs = now - postDate;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return postDate.toLocaleDateString();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ 
            uri: post.anonymous ? 
              'https://via.placeholder.com/40/CCCCCC/FFFFFF?text=A' : 
              post.user?.profile_image || 'https://via.placeholder.com/40'
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.username}>
            {post.anonymous ? 'Anonymous' : post.user?.full_name || 'Unknown User'}
          </Text>
          <Text style={styles.timestamp}>
            {formatTimeAgo(post.created_at)}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <View style={styles.mediaContainer}>
          {post.media_urls.map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.media} />
          ))}
        </View>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, index) => (
            <Text key={index} style={styles.tag}>#{tag}</Text>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Text style={[styles.actionText, liked && styles.likedText]}>
            {liked ? '❤️' : '🤍'} {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <Text style={styles.actionText}>💬 {commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Text style={[styles.actionText, saved && styles.savedText]}>
            {saved ? '🔖' : '📌'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Text style={styles.actionText}>📤</Text>
        </TouchableOpacity>
      </View>

      {/* Comments Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {comments.map((comment, index) => (
            <View key={comment.id || index} style={styles.comment}>
              <Text style={styles.commentAuthor}>
                {comment.anonymous ? 'Anonymous' : comment.user?.full_name}
              </Text>
              <Text style={styles.commentContent}>{comment.content}</Text>
              <Text style={styles.commentTime}>
                {formatTimeAgo(comment.created_at)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  content: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 12,
  },
  mediaContainer: {
    marginBottom: 12,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    fontSize: 14,
    color: '#8B5CF6',
    marginRight: 8,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
  },
  actionText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  likedText: {
    color: '#EF4444',
  },
  savedText: {
    color: '#8B5CF6',
  },
  commentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  comment: {
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#A1A1AA',
  },
});

export default KliqPostCard; 