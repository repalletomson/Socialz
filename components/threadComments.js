import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
// import TimeAgo from 'react-native-timeago';
import { useAuthStore } from '../stores/useAuthStore';
const CommentThread = ({ comments, postId, onAddComment, onReply }) => {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const slideAnim = new Animated.Value(0);
const { user } = useAuthStore();
  const handleSubmit = () => {
    if (!newComment.trim()) return;

    const commentData = {
      text: newComment.trim(),
      parentId: replyTo?.id || null,
      timestamp: new Date().toISOString(),
      userId: user.uid|| 'current-user-id', // Replace with actual user ID
      username: user.username || 'current-user-name', // Replace with actual user name
    };
  
    onAddComment(commentData);
    setNewComment('');
    setReplyTo(null);
  };

  const renderComment = ({ item, depth = 0 }) => {
    const replies = comments.filter(c => c.parentId === item.id);
    const maxDepth = 3;

    return (
      <Animated.View
        style={[
          styles.commentContainer,
          {
            marginLeft: depth * 20,
            opacity: slideAnim,
            transform: [
              {
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.commentHeader}>
          <Text style={styles.commentUser}>{item.username}</Text>
          {/* <TimeAgo time={item.timestamp} style={styles.commentTime} /> */}
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
        
        {depth < maxDepth && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => setReplyTo(item)}
          >
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        )}

        {replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {replies.map(reply => renderComment({ item: reply, depth: depth + 1 }))}
          </View>
        )}
      </Animated.View>
    );
  };

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <FlatList
        data={comments.filter(c => !c.parentId)}
        renderItem={renderComment}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.commentsList}
      />

      <View style={styles.inputContainer}>
        {replyTo && (
          <View style={styles.replyingTo}>
            <Text style={styles.replyingToText}>
              Replying to {replyTo.username}
            </Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <MaterialIcons name="close" size={16} color={colors.mediumGrey} />
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.submitButton, !newComment.trim() && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!newComment.trim()}
        >
          <Text style={styles.submitButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  commentsList: {
    padding: 16,
  },
  commentContainer: {
    marginVertical: 8,
    padding: 12,
    backgroundColor: colors.lightGrey,
    borderRadius: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: '600',
    color: colors.text,
  },
  commentTime: {
    fontSize: 12,
    color: colors.mediumGrey,
  },
  commentText: {
    color: colors.text,
    lineHeight: 20,
  },
  replyButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  replyButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
    backgroundColor: colors.background,
  },
  replyingTo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.lightGrey,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: colors.mediumGrey,
  },
  input: {
    backgroundColor: colors.lightGrey,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  submitButton: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.mediumGrey,
  },
  submitButtonText: {
    color: colors.background,
    fontWeight: '500',
  },
};

export default CommentThread;