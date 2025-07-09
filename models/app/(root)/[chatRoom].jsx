import React, { useState, useEffect, useRef } from 'react';
import { 
  View, ScrollView, SafeAreaView, Text, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Animated, StatusBar,
  Alert, Modal, Dimensions, TextInput, Image
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  collection, query, orderBy, onSnapshot, doc, limit, 
  getDocs, updateDoc, serverTimestamp, arrayUnion, arrayRemove,
  where, addDoc, getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { supabase } from '../../config/supabaseConfig';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { MessageItem } from '../../components/MessageItem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { 
  PanGestureHandler, 
  GestureHandlerRootView,
  State
} from 'react-native-gesture-handler';
import { AES, enc } from 'react-native-crypto-js';
import { useAuthStore } from '../../stores/useAuthStore';
import networkErrorHandler from '../../utiles/networkErrorHandler';
// import Clipboard from 'expo-clipboard';

dayjs.extend(relativeTime);

const MESSAGES_PER_PAGE = 20;
const { width } = Dimensions.get('window');
const SECRET_KEY = "kliq-secure-messaging-2024";

// Updated Color Palette - WhatsApp-like Black Theme
const COLORS = {
  background: '#000000',
  cardBg: '#111111',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#6B7280',
  inputBg: '#1A1A1A',
  accent: '#8B5CF6',
  messageOwn: '#232136',
  messageOther: '#1A1A1A',
  success: '#10B981',
  danger: '#E53E3E',
  shadow: 'rgba(0, 0, 0, 0.3)',
  border: '#27272A',
  replyBorder: '#8B5CF6',
  replyBg: 'rgba(139, 92, 246, 0.08)',
  headerBg: '#111111',
};

const DEFAULT_PROFILE = 'https://assets.grok.com/users/8c354dfe-946c-4a32-b2de-5cb3a8ab9776/generated/h4epnwdFODX6hW0L/image.jpg';

const ChatOptionsModal = ({ visible, onClose, onBlockUser, recipientName }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}>
        <View style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: 16,
          width: '85%',
          maxWidth: 280,
          borderWidth: 1,
          borderColor: COLORS.border,
          overflow: 'hidden',
        }}>
          <TouchableOpacity
            onPress={() => {
              onClose();
              onBlockUser();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.border,
            }}
          >
            <MaterialIcons name="block" size={22} color={COLORS.danger} />
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: COLORS.danger,
              marginLeft: 12,
            }}>
              Block {recipientName}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onClose}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              justifyContent: 'center',
            }}
          >
            <Text style={{
              fontSize: 16,
              fontWeight: '500',
              color: COLORS.text,
            }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const BlockUserModal = ({ visible, onClose, onBlock, recipientName }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}>
        <View style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: 16,
          padding: 24,
          width: '85%',
          maxWidth: 320,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <MaterialIcons name="block" size={24} color={COLORS.danger} />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: COLORS.text,
              marginLeft: 12,
            }}>
              Block User
            </Text>
          </View>
          
          <Text style={{
            fontSize: 15,
            color: COLORS.textSecondary,
            marginBottom: 24,
            lineHeight: 22,
          }}>
            Are you sure you want to block {recipientName}? You won't receive messages from them anymore.
          </Text>
          
          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: 12,
          }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                backgroundColor: COLORS.inputBg,
                borderRadius: 8,
              }}
            >
              <Text style={{
                fontSize: 16,
                color: COLORS.text,
                fontWeight: '500',
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onBlock}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                backgroundColor: COLORS.danger,
                borderRadius: 8,
              }}
            >
              <Text style={{
                fontSize: 16,
                color: '#FFFFFF',
                fontWeight: '600',
              }}>
                Block
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Enhanced message truncation
const truncateMessage = (text, maxLength = 35) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

const MessageActionModal = ({ visible, onClose, onDelete, isOwnMessage }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <View style={{ backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 24, width: 250, alignItems: 'center' }}>
        {isOwnMessage && (
          <TouchableOpacity onPress={onDelete} style={{ paddingVertical: 12, width: '100%' }}>
            <Text style={{ color: COLORS.error, fontSize: 16, textAlign: 'center' }}>Delete Message</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onClose} style={{ paddingVertical: 12, width: '100%' }}>
          <Text style={{ color: COLORS.text, fontSize: 16, textAlign: 'center' }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function ChatRoom() {
  const { chatId, recipientId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const scrollViewRef = useRef(null);
  const lastMessageRef = useRef(null);
  const unsubscribeRef = useRef({});
  const { user } = useAuthStore();
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);

  const currentUserId = user?.id;

  // Update last seen in Supabase
  const updateLastSeen = async () => {
    if (!currentUserId) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          last_seen: new Date().toISOString(),
          is_online: true 
        })
        .eq('id', currentUserId);
      
      if (error) {
        console.error('Error updating last seen:', error);
      }
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  // Decrypt message function
  const decryptMessage = (encryptedText) => {
    try {
      if (!encryptedText) return '';
      const decrypted = AES.decrypt(encryptedText, SECRET_KEY).toString(enc.Utf8);
      return decrypted || encryptedText;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText;
    }
  };

  // Fetch user details from Supabase
  const fetchUserFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*') // Fetch all fields from users table
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user from Supabase:', error);
        return null;
      }

      return {
        id: data.id,
        uid: data.id,
        fullName: data.full_name,
        full_name: data.full_name,
        displayName: data.full_name,
        username: data.username,
        profileImage: data.profile_image,
        profile_image: data.profile_image,
        photoURL: data.profile_image,
        profile_initials: data.profile_initials,
        college: data.college,
        branch: data.branch,
        passout_year: data.passout_year,
        bio: data.bio,
        about: data.bio,
        interests: data.interests,
        created_at: data.created_at,
        updated_at: data.updated_at,
        expo_push_token: data.expo_push_token,
        lastSeen: data.last_seen ? dayjs(data.last_seen).fromNow() : 'Unknown',
        isOnline: data.is_online || false
      };
    } catch (error) {
      console.error('Error fetching user from Supabase:', error);
      return null;
    }
  };

  // Helper to check block status for both sides
  const checkMutualBlockStatus = async () => {
    try {
      if (!currentUserId || !recipientId) return;
      const currentUserRef = doc(db, 'users', currentUserId);
      const recipientUserRef = doc(db, 'users', recipientId);
      const [currentUserSnap, recipientUserSnap] = await Promise.all([
        getDoc(currentUserRef),
        getDoc(recipientUserRef)
      ]);
      const currentBlocked = currentUserSnap.data()?.blockedUsers || [];
      const recipientBlocked = recipientUserSnap.data()?.blockedUsers || [];
      setIsBlocked(currentBlocked.includes(recipientId));
      setHasBlockedMe(recipientBlocked.includes(currentUserId));
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  useEffect(() => {
    if (!chatId || !recipientId || !currentUserId) return;

    setLoading(true);
    
    updateLastSeen();
    
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    );

    unsubscribeRef.current.messages = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          text: data.text ? decryptMessage(data.text) : data.content ? decryptMessage(data.content) : '',
          replyTo: data.replyTo ? {
            ...data.replyTo,
            text: data.replyTo.text ? decryptMessage(data.replyTo.text) : ''
          } : null
        };
      }).reverse();
      setMessages(fetchedMessages);
      setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE);
      setLoading(false);
    });

    const loadRecipientData = async () => {
      try {
        setLoading(true);
        const recipientData = await fetchUserFromSupabase(recipientId);
        if (recipientData) {
          setRecipient(recipientData);
        }
      } catch (error) {
        networkErrorHandler.showErrorToUser(error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipientData();

    unsubscribeRef.current.chat = onSnapshot(doc(db, 'chats', chatId), (snapshot) => {
      const data = snapshot.data();
      setIsTyping(data?.typingUsers?.includes(recipientId) || false);
    });

    checkMutualBlockStatus();

    return () => Object.values(unsubscribeRef.current).forEach(unsub => unsub?.());
  }, [chatId, recipientId, currentUserId]);

  useEffect(() => {
    updateLastSeen();
    
    return () => {
      if (currentUserId) {
        supabase
          .from('users')
          .update({ 
            last_seen: new Date().toISOString(),
            is_online: false 
          })
          .eq('id', currentUserId)
          .then(({ error }) => {
            if (error) console.error('Error setting offline status:', error);
          });
      }
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!chatId || !currentUserId) return;
    
    const markAsRead = async () => {
      const unreadQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        where('unreadBy', 'array-contains', currentUserId)
      );
      const snapshot = await getDocs(unreadQuery);
      snapshot.forEach(doc => {
        updateDoc(doc.ref, {
          unreadBy: arrayRemove(currentUserId),
          readBy: { ...doc.data().readBy, [currentUserId]: true }
        });
      });
    };
    markAsRead();
  }, [chatId, currentUserId]);

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleBlock = async () => {
    try {
      if (!currentUserId || !recipientId) return;
      const currentUserRef = doc(db, 'users', currentUserId);
      await updateDoc(currentUserRef, {
        blockedUsers: arrayUnion(recipientId)
      });
      setIsBlocked(true);
      setShowBlockModal(false);
      Alert.alert("User Blocked", `You have blocked ${recipient?.fullName || 'this user'} successfully.`);
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert("Error", "Failed to block user");
    }
  };

  const handleUnblock = async () => {
    try {
      if (!currentUserId || !recipientId) return;
      const currentUserRef = doc(db, 'users', currentUserId);
      await updateDoc(currentUserRef, {
        blockedUsers: arrayRemove(recipientId)
      });
      setIsBlocked(false);
      Alert.alert('User Unblocked', 'You have unblocked this user. You can now send messages.');
    } catch (error) {
      console.error('Error unblocking user:', error);
      Alert.alert('Error', 'Failed to unblock user');
    }
  };

  const encryptMessage = (text) => {
    try {
      if (!text) return '';
      return AES.encrypt(text, SECRET_KEY).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return text;
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentUserId) return;
    
    try {
      const messageData = {
        text: encryptMessage(messageText),
        senderId: currentUserId,
        sender: currentUserId, // Keep both for compatibility
        name: user.displayName || user.full_name || 'User',
        userAvatar: user.photoURL || user.profile_image || null,
        timestamp: serverTimestamp(),
        readBy: { [currentUserId]: true },
        replyTo: replyingTo ? {
          id: replyingTo.id,
          sender: replyingTo.sender || replyingTo.senderId,
          name: replyingTo.name || replyingTo.senderName,
          text: encryptMessage(replyingTo.text)
        } : null
      };

      setMessageText('');
      setReplyingTo(null);

      await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: encryptMessage(messageText),
        lastMessageTime: serverTimestamp(),
        lastSender: currentUserId
      });

      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const formatDateHeader = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return dayjs(date).format('dddd'); // Monday, Tuesday, etc.
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Enhanced Message Bubble Component to match the image design
  const MessageBubble = React.memo(({ message }) => {
    const isCurrentUser = message.senderId === currentUserId || message.sender === currentUserId;

    return (
      <View style={{
        alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
        marginBottom: 8,
        maxWidth: width * 0.75,
        marginHorizontal: 16,
      }}>
        <View style={{
          backgroundColor: isCurrentUser ? COLORS.messageOwn : COLORS.messageOther,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 18,
          position: 'relative',
        }}>
          <Text style={{
            color: '#FFFFFF',
            fontSize: 14,
            lineHeight: 20,
            fontFamily: isCurrentUser ? 'GeneralSans-Medium' : 'GeneralSans-Regular',
          }}>
            {message.text || message.content}
          </Text>
          
          {/* <Text style={{
            color: isCurrentUser ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.6)',
            fontSize: 12,
            marginTop: 4,
            alignSelf: 'flex-end',
            fontFamily: 'GeneralSans-Regular',
          }}>
            {formatMessageTime(message.timestamp)}
          </Text> */}
        </View>
      </View>
    );
  });

  // Header component matching the image design
  const ChatHeader = () => (
    <View style={{
      backgroundColor: COLORS.headerBg,
      paddingTop: 20,
      paddingBottom: 16,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 0.5,
      borderBottomColor: COLORS.border,
    }}>
      <TouchableOpacity 
        onPress={() => router.back()}
        style={{ marginRight: 16 }}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      
      <Image
        source={{ 
          uri: recipient?.profileImage || DEFAULT_PROFILE 
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          marginRight: 12,
        }}
      />
      
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 17,
          fontWeight: '600',
          color: COLORS.text,
          fontFamily: 'GeneralSans-Medium',
        }}>
          {recipient?.fullName || 'Chat'}
        </Text>
        <Text style={{
          fontSize: 13,
          color: COLORS.textSecondary,
          marginTop: 1,
          fontFamily: 'GeneralSans-Regular',
        }}>
          {isTyping ? 'typing...' : recipient?.isOnline ? 'online' : `last seen ${recipient?.lastSeen || 'unknown'}`}
        </Text>
      </View>
      
      <TouchableOpacity
        onPress={() => setShowOptionsModal(true)}
        style={{ padding: 8 }}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );

  const handleLongPressMessage = (message) => {
    setSelectedMessage(message);
    setActionModalVisible(true);
  };

  // const handleCopyMessage = () => {
  //   if (selectedMessage) {
  //     // Clipboard.setStringAsync(selectedMessage.text || selectedMessage.content || '');
  //     // Alert.alert('Copied', 'Message copied to clipboard');
  //   }
  //   setActionModalVisible(false);
  // };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    try {
      await updateDoc(doc(db, 'chats', chatId, 'messages', selectedMessage.id), { text: '', content: '', deleted: true });
      setActionModalVisible(false);
      Alert.alert('Deleted', 'Message deleted');
    } catch (error) {
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.background 
      }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{
          marginTop: 20,
          color: COLORS.textSecondary,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: '500',
          fontFamily: 'GeneralSans-Regular',
        }}>
          Loading chat...
        </Text>
      </SafeAreaView>
    );
  }

  if (!currentUserId) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.background 
      }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{
          marginTop: 20,
          color: COLORS.textSecondary,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: '500',
          fontFamily: 'GeneralSans-Regular',
        }}>
          Please sign in to continue...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        
        {/* Header always visible */}
        <ChatHeader />

        {/* Messages Area - inverted, most recent at bottom */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, backgroundColor: COLORS.background }}
          contentContainerStyle={{
            flexDirection: 'column',
            justifyContent: 'flex-end',
            paddingTop: 20,
            paddingBottom: 20,
            minHeight: '100%',
          }}
          onContentSizeChange={() => scrollToBottom()}
          showsVerticalScrollIndicator={false}
          inverted
        >
          {messages.map((message, index, arr) => {
            const prev = arr[index - 1];
            const showDate = !prev || formatDateHeader(message.timestamp) !== formatDateHeader(prev?.timestamp);
            return (
              <View key={message.id}>
                {showDate && (
                  <View style={{ alignItems: 'center', marginVertical: 20 }}>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 15, fontWeight: '600', fontFamily: 'GeneralSans-Medium' }}>
                      {formatDateHeader(message.timestamp)}
                    </Text>
                  </View>
                )}
                <View>
                  <View style={{
                    flexDirection: message.senderId === currentUserId ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    marginHorizontal: 16,
                    marginVertical: 4,
                  }}>
                    <View style={{ 
                      alignItems: message.senderId === currentUserId ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                    }}>
                      {/* Message Bubble */}
                      <TouchableOpacity onLongPress={() => handleLongPressMessage(message)} activeOpacity={0.8}>
                        <View style={{
                          backgroundColor: message.senderId === currentUserId ? COLORS.accent : COLORS.messageOther,
                          borderRadius: 16,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderTopRightRadius: message.senderId === currentUserId ? 4 : 16,
                          borderTopLeftRadius: message.senderId === currentUserId ? 16 : 4,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 1,
                          elevation: 1,
                          maxWidth: "100%",
                        }}>
                          <Text style={{ 
                            fontSize: 13, 
                            color: "#FFFFFF", 
                            lineHeight: 18,
                            fontWeight: "400",
                          }}>
                            {message.text || message.content || message.message || message.body || "No content"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      {/* Timestamp */}
                      <View style={{
                        alignItems: message.senderId === currentUserId ? "flex-end" : "flex-start",
                        marginTop: 4,
                        marginHorizontal: 4,
                      }}>
                        <Text style={{ 
                          fontSize: 10, 
                          color: COLORS.textSecondary,
                          fontWeight: "400",
                        }}>
                          {formatMessageTime(message.timestamp)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Message Input - KeyboardAvoidingView only wraps input */}
        {hasBlockedMe ? (
          <View style={{
            padding: 20,
            backgroundColor: COLORS.background,
            borderTopWidth: 0.5,
            borderTopColor: COLORS.border,
            alignItems: 'center',
          }}>
            <Text style={{ color: COLORS.danger, fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>
              You have been blocked and cannot send messages.
            </Text>
          </View>
        ) : isBlocked ? (
          <View style={{
            padding: 20,
            backgroundColor: COLORS.background,
            borderTopWidth: 0.5,
            borderTopColor: COLORS.border,
            alignItems: 'center',
          }}>
            <Text style={{ color: COLORS.danger, fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 12 }}>
              You have blocked this user. Unblock to send messages.
            </Text>
            <TouchableOpacity
              onPress={handleUnblock}
              style={{
                backgroundColor: COLORS.accent,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Unblock</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: COLORS.background,
              borderTopWidth: 0.5,
              borderTopColor: COLORS.border,
            }}>
              <TextInput
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type Something..."
                placeholderTextColor={COLORS.textSecondary}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.background,
                  color: COLORS.text,
                  fontSize: 16,
                  paddingVertical: 8,
                  fontFamily: 'GeneralSans-Regular',
                }}
                multiline
              />
              <TouchableOpacity 
                onPress={handleSendMessage}
                disabled={!messageText.trim()}
                style={{ marginLeft: 12 }}
              >
                <Ionicons 
                  name="send" 
                  size={24} 
                  color={!messageText.trim() ? COLORS.textSecondary : COLORS.accent} 
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        <ChatOptionsModal
          visible={showOptionsModal}
          onClose={() => setShowOptionsModal(false)}
          onBlockUser={() => setShowBlockModal(true)}
          recipientName={recipient?.fullName}
        />
        <BlockUserModal
          visible={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          onBlock={handleBlock}
          recipientName={recipient?.fullName}
        />
        <MessageActionModal
          visible={actionModalVisible}
          onClose={() => setActionModalVisible(false)}
          onDelete={handleDeleteMessage}
          isOwnMessage={selectedMessage && (selectedMessage.senderId === currentUserId || selectedMessage.sender === currentUserId)}
        />
      </View>
    </GestureHandlerRootView>
  );
}