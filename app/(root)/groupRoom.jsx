import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';

// Import necessary React Native components
import {
  View,
  ScrollView,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  StatusBar,
  Alert,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { 
  PanGestureHandler, 
  GestureHandlerRootView,
  State
} from 'react-native-gesture-handler';
import { AES, enc } from 'react-native-crypto-js';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Fonts } from '../../constants/Fonts';

dayjs.extend(relativeTime);

// Import Firebase functions
import { 
  getGroupMessages, 
  sendMessage, 
  deleteMessage,
  getGroupMembers
} from '../../lib/firebase';
import { supabase } from '../../config/supabaseConfig';
import { useAuth } from '../../context/authContext';
import networkErrorHandler from '../../utiles/networkErrorHandler';

const { width } = Dimensions.get('window');
const SECRET_KEY = "kliq-secure-messaging-2024";

// Consistent Color Palette - WhatsApp-like Black Theme
const COLORS = {
  background: '#000000',
  cardBg: '#111111',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textMuted: '#6B7280',
  inputBg: '#1A1A1A',
  accent: '#8B5CF6',
  messageOwn: '#232136',
  messageOther: '#111111',
  receiverBubble: '#2D193E',
  success: '#10B981',
  danger: '#E53E3E',
  shadow: 'rgba(0, 0, 0, 0.3)',
  border: '#27272A',
  replyBorder: '#8B5CF6',
  replyBg: 'rgba(139, 92, 246, 0.08)',
  readTick: '#8B5CF6',
  sentTick: '#A1A1AA',
  headerBg: '#111111',
};

const DEFAULT_PROFILE = require('../../assets/images/Default.webp');

const RulesModal = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }}>
        <View style={{
          backgroundColor: COLORS.cardBg,
          borderRadius: 20,
          padding: 24,
          width: '90%',
          maxWidth: 400,
          maxHeight: '80%',
          borderWidth: 1,
          borderColor: COLORS.border,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 20,
          }}>
            <MaterialIcons name="gavel" size={24} color={COLORS.accent} />
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: COLORS.text,
              marginLeft: 12,
            }}>
              Group Chat Guidelines
            </Text>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
            <Text style={{
              fontSize: 16,
              color: COLORS.textSecondary,
              marginBottom: 16,
              lineHeight: 22,
            }}>
              Please follow these guidelines for a better group chat experience:
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: COLORS.text,
              marginBottom: 12,
              fontWeight: '600',
            }}>
              🔒 Group Privacy & Security:
            </Text>
            <Text style={{
              fontSize: 14,
              color: COLORS.textMuted,
              marginBottom: 16,
              lineHeight: 20,
            }}>
              • All group messages are end-to-end encrypted{'\n'}
              • Don't share personal information with unknown members{'\n'}
            </Text>
            
            <Text style={{
              fontSize: 14,
              color: COLORS.text,
              marginBottom: 12,
              fontWeight: '600',
            }}>
              🤝 Group Communication:
            </Text>
            <Text style={{
              fontSize: 14,
              color: COLORS.textMuted,
              marginBottom: 16,
              lineHeight: 20,
            }}>
              • Stay on topic and be relevant{'\n'}
              • Be respectful to all group members{'\n'}
              • Avoid spam and off-topic discussions{'\n'}
            </Text>
            
       
            
            <Text style={{
              fontSize: 14,
              color: COLORS.text,
              marginBottom: 12,
              fontWeight: '600',
            }}>
              ⚠️ Group Disclaimer:
            </Text>
            <Text style={{
              fontSize: 14,
              color: COLORS.textMuted,
              marginBottom: 16,
              lineHeight: 20,
            }}>
              • Members are responsible for their own messages{'\n'}
              • Violations may result in removal from group
            </Text>
          </ScrollView>
          
          <TouchableOpacity
            onPress={onClose}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 20,
              backgroundColor: COLORS.accent,
              borderRadius: 12,
              alignItems: 'center',
              marginTop: 16,
            }}
          >
            <Text style={{
              fontSize: 16,
              color: '#FFFFFF',
              fontWeight: '700',
            }}>
              Understood
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const DeleteMessageModal = ({ visible, onClose, onDelete, message }) => {
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
          borderRadius: 20,
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
            <MaterialIcons name="delete" size={24} color={COLORS.danger} />
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: COLORS.text,
              marginLeft: 12,
            }}>
              Delete Message
            </Text>
          </View>
          
          <Text style={{
            fontSize: 15,
            color: COLORS.textSecondary,
            marginBottom: 24,
            lineHeight: 22,
          }}>
            Are you sure you want to delete this message? This action cannot be undone.
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
                borderRadius: 12,
              }}
            >
              <Text style={{
                fontSize: 16,
                color: COLORS.text,
                fontWeight: '600',
              }}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onDelete}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 20,
                backgroundColor: COLORS.danger,
                borderRadius: 12,
              }}
            >
              <Text style={{
                fontSize: 16,
                color: '#FFFFFF',
                fontWeight: '700',
              }}>
                Delete
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

// Moved outside component to prevent recreations
const getMotivationalQuote = (groupName) => {
  const quotes = [
    `Start the conversation in ${groupName} today!`,
    `Be the first to share your thoughts in ${groupName}!`,
    `This is where great ideas in ${groupName} will be shared.`,
    `Build connections in ${groupName} with your first message!`,
    `The journey of ${groupName} begins with a single message.`
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

const GroupRoomScreen = () => {
  const navigation = useNavigation();
  const { groupId, groupName, groupImage } = useLocalSearchParams();
  const { user } = useAuth();

  // Parse groupImage if it's a JSON string
  let parsedGroupImage;
  try {
    parsedGroupImage = groupImage ? JSON.parse(groupImage) : null;
  } catch (error) {
    parsedGroupImage = groupImage;
  }

  // Create group object from params
  const group = {
    id: groupId,
    name: groupName || groupId,
    image: parsedGroupImage
  };

  // State management with defaults
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Refs
  const scrollViewRef = useRef(null);
  const messagesUnsubscribeRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Decrypt message function
  const decryptMessage = (encryptedText) => {
    try {
      if (!encryptedText) return '';
      const decrypted = AES.decrypt(encryptedText, SECRET_KEY).toString(enc.Utf8);
      return decrypted || encryptedText; // fallback to original if decryption fails
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedText; // fallback to original text
    }
  };

  // Encrypt message function
  const encryptMessage = (text) => {
    try {
      if (!text) return '';
      return AES.encrypt(text, SECRET_KEY).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return text; // fallback to original text
    }
  };

  // Update last seen in Supabase
  const updateLastSeen = async () => {
    if (!user?.uid) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          last_seen: new Date().toISOString(),
          is_online: true 
        })
        .eq('id', user.uid);
      
      if (error) {
        console.error('Error updating last seen:', error);
      }
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  // Fetch user details from Supabase
  const fetchUserFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*') // Fetch all fields from users table
        .eq('id', userId)
        .maybeSingle();

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

  // Cleanup function
  const cleanup = useCallback(() => {
    if (messagesUnsubscribeRef.current) {
      messagesUnsubscribeRef.current();
      messagesUnsubscribeRef.current = null;
    }
    
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
  }, []);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // Focus effect for screen navigation
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      fetchInitialData();
      
      return () => {
        cleanup();
        // Set user offline when leaving group
        if (user?.uid) {
          supabase
            .from('users')
            .update({ 
              last_seen: new Date().toISOString(),
              is_online: false 
            })
            .eq('id', user.uid)
            .then(({ error }) => {
              if (error) console.error('Error setting offline status:', error);
            });
        }
      };
    }, [groupId, cleanup, user?.uid])
  );

  // Format date header function
  const formatDateHeader = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  // Data fetching with error handling
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      cleanup();

      // Add loading timeout
      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(false);
          setError('Loading timed out. Please check your connection and try again.');
        }
      }, 10000);

      // Update current user's last seen
      await updateLastSeen();

      // Fetch group members
      try {
        const fetchedMembers = await Promise.race([
          getGroupMembers(groupId),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Members fetch timeout')), 5000))
        ]);
        
        if (isMountedRef.current) {
          setMembers(fetchedMembers || []);
        }
      } catch (membersError) {
        console.error('Error fetching group members:', membersError);
        if (isMountedRef.current) {
          setMembers([]);
        }
      }

      // Subscribe to messages with proper error handling
      try {
        const messageSubscription = getGroupMessages(
          groupId,
          (fetchedMessages) => {
            if (isMountedRef.current) {
              // Decrypt messages
              const decryptedMessages = fetchedMessages.map(message => ({
                ...message,
                text: message.text ? decryptMessage(message.text) : '',
                replyTo: message.replyTo ? {
                  ...message.replyTo,
                  text: message.replyTo.text ? decryptMessage(message.replyTo.text) : ''
                } : null
              }));
              
              setMessages(decryptedMessages);
              setLoading(false);
              
              // Clear loading timeout
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
              }
              
              // Safely scroll to bottom
              setTimeout(() => {
                if (scrollViewRef.current && isMountedRef.current) {
                  scrollViewRef.current.scrollToEnd({ animated: false });
                }
              }, 100);
            }
          },
          (messagesError) => {
            console.error('Error in messages subscription:', messagesError);
            if (isMountedRef.current) {
              setError('Failed to load messages. Please try again.');
              setLoading(false);
              
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
              }
            }
          }
        );
        
        messagesUnsubscribeRef.current = messageSubscription;
      } catch (subscribeError) {
        console.error('Error setting up message subscription:', subscribeError);
        if (isMountedRef.current) {
          setError('Failed to connect to the chat. Please try again.');
          setLoading(false);
          
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
        }
      }
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      if (isMountedRef.current) {
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
        
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.uid) return;
    
    try {
      const messageData = {
        text: encryptMessage(newMessage), // Encrypt before sending
        senderId: user.uid,
        senderName: user.displayName || user.full_name || 'Anonymous',
        timestamp: Date.now(),
        replyTo: replyingTo ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          text: encryptMessage(replyingTo.text) // Encrypt reply text too
        } : null
      };

      // Clear input immediately for better UX
      setNewMessage('');
      setReplyingTo(null);

      // Send message
      await sendMessage(groupId, messageData);
      
      // Safely scroll after message is sent
      setTimeout(() => {
        if (scrollViewRef.current && isMountedRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to send message. Please try again.');
      }
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;
    
    try {
      await deleteMessage(groupId, messageToDelete.id);
      setShowDeleteModal(false);
      setMessageToDelete(null);
      Alert.alert("Message Deleted", "The message has been deleted successfully.");
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      Alert.alert("Error", "Failed to delete message");
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Enhanced Swipeable Message Component
  const SwipeableMessage = React.memo(({ message, onReply }) => {
    const translateX = new Animated.Value(0);
    const opacity = new Animated.Value(0);
    const isCurrentUser = message.senderId === user?.uid;

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = (event) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX } = event.nativeEvent;
        
        // Trigger reply if swiped enough (50px threshold)
        if (Math.abs(translationX) > 50) {
          onReply(message);
          
          // Show reply indicator briefly
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
        
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    };

    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View style={{
          transform: [{ translateX }],
        }}>
          {/* Reply indicator */}
          <Animated.View style={{
            position: 'absolute',
            right: isCurrentUser ? width - 60 : 20,
            left: isCurrentUser ? 20 : width - 60,
            top: '50%',
            opacity,
            zIndex: 1,
          }}>
            <Ionicons 
              name="arrow-undo" 
              size={20} 
              color={COLORS.accent} 
            />
          </Animated.View>
          
          <MessageBubble message={message} />
        </Animated.View>
      </PanGestureHandler>
    );
  });

  // Enhanced Message Bubble Component - Matching ChatRoom Style
  const MessageBubble = React.memo(({ message }) => {
    const isCurrentUser = message.senderId === user?.uid;

    const handleLongPress = () => {
      if (isCurrentUser) {
        setMessageToDelete(message);
        setShowDeleteModal(true);
      }
    };

    return (
      <View>
        <View style={{
          flexDirection: isCurrentUser ? "row-reverse" : "row",
          alignItems: "flex-end",
          marginHorizontal: 16,
          marginVertical: 4,
        }}>
          <View style={{ 
            alignItems: isCurrentUser ? "flex-end" : "flex-start",
            maxWidth: "80%",
          }}>
            {/* Sender name for other users */}
            {!isCurrentUser && message.senderName && (
              <Text style={{
                fontSize: 12,
                fontWeight: "500",
                color: COLORS.textSecondary,
                marginBottom: 2,
                marginLeft: 2,
              }}>
                {message.senderName}
              </Text>
            )}

            {/* Message Bubble */}
            <TouchableOpacity
              onLongPress={handleLongPress}
              activeOpacity={0.8}
              style={{
                backgroundColor: isCurrentUser ? COLORS.accent : '#191825',
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderTopRightRadius: isCurrentUser ? 4 : 16,
                borderTopLeftRadius: isCurrentUser ? 16 : 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1,
                maxWidth: "100%",
              }}
            >
              {/* Reply indicator */}
              {message.replyTo && (
                <View style={{ 
                  borderLeftWidth: 2, 
                  borderLeftColor: isCurrentUser ? "rgba(255,255,255,0.4)" : COLORS.accent, 
                  paddingLeft: 8, 
                  marginBottom: 6,
                  backgroundColor: isCurrentUser ? "rgba(255,255,255,0.08)" : "rgba(139, 92, 246, 0.08)",
                  borderRadius: 6,
                  padding: 6,
                }}>
                  <Text style={{ 
                    fontSize: 11, 
                    color: isCurrentUser ? "rgba(255,255,255,0.7)" : COLORS.textSecondary,
                    fontWeight: "500",
                  }}>
                    {message.replyTo.senderName || 'User'}
                  </Text>
                  <Text style={{ 
                    fontSize: 12, 
                    color: isCurrentUser ? "rgba(255,255,255,0.8)" : COLORS.text, 
                    marginTop: 1,
                  }} numberOfLines={1}>
                    {truncateMessage(message.replyTo.text, 50)}
                  </Text>
                </View>
              )}

              {/* Message content */}
              <Text style={{ 
                fontSize: 13, 
                color: "#FFFFFF", 
                lineHeight: 18,
                fontWeight: "400",
              }}>
                {message.text}
              </Text>
            </TouchableOpacity>

            {/* Timestamp and read status */}
            <View style={{
              alignItems: isCurrentUser ? "flex-end" : "flex-start",
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
    );
  });

  // Validate required params
  useEffect(() => {
    if (!groupId) {
      console.error('❌ Missing groupId parameter');
      setError('Invalid group. Please try again.');
      setLoading(false);
      return;
    }
  }, [groupId]);

  // Loading state
  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
      }}>
        <ActivityIndicator 
          size="large" 
          color={COLORS.accent} 
        />
        <Text style={{
          marginTop: 20,
          color: COLORS.textSecondary,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: '500',
        }}>
          Loading chat...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.background,
      }}>
        <Ionicons 
          name="alert-circle-outline" 
          size={60} 
          color="#F87171" 
          style={{ marginBottom: 16 }}
        />
        <Text style={{
          color: '#F87171',
          textAlign: 'center',
          marginBottom: 20,
          fontSize: 16,
          lineHeight: 24,
        }}>
          {error}
        </Text>
        <TouchableOpacity 
          style={{
            backgroundColor: COLORS.accent,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 12,
          }}
          onPress={fetchInitialData}
        >
          <Text style={{
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: 16,
          }}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main render
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{
        flex: 1,
        backgroundColor: COLORS.background,
      }}>
        <StatusBar 
          backgroundColor={COLORS.background}
          barStyle="light-content"
        />

        {/* Improved Group Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: Platform.OS === 'ios' ? 10 : 16,
          paddingBottom: 16,
          paddingHorizontal: 18,
          backgroundColor: COLORS.headerBg,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        }}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              cleanup();
              router.back();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: COLORS.inputBg,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>

          {/* Group Avatar */}
          <TouchableOpacity
            style={{ marginRight: 14 }}
            onPress={() => setShowMembers(true)}
            activeOpacity={0.8}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: COLORS.accent,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: COLORS.border,
              shadowColor: COLORS.accent,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 2,
            }}>
              {/* If group.image exists, show image (uri or require), else initial */}
              {group.image
                ? (typeof group.image === 'string'
                    ? <Image source={{ uri: group.image }} style={{ width: '100%', height: '100%', borderRadius: 24 }} resizeMode="cover" />
                    : <Image source={group.image} style={{ width: '100%', height: '100%', borderRadius: 24 }} resizeMode="cover" />
                  )
                : (
                  <Text style={{
                    color: '#FFFFFF',
                    fontSize: 22,
                    fontFamily: Fonts.GeneralSans.Bold,
                  }}>
                    {group.name?.charAt(0)?.toUpperCase() || 'G'}
                  </Text>
                )}
            </View>
          </TouchableOpacity>

          {/* Group Info */}
          <TouchableOpacity
            style={{ flex: 1, minWidth: 0 }}
            onPress={() => setShowMembers(true)}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: COLORS.text,
                fontSize: 20,
                fontFamily: Fonts.GeneralSans.Bold,
                marginBottom: 2,
                maxWidth: '100%',
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {group.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1 }}>
              <Ionicons name="people-outline" size={15} color={COLORS.textMuted} style={{ marginRight: 4 }} />
              <Text style={{
                color: COLORS.textMuted,
                fontSize: 13,
                fontFamily: Fonts.GeneralSans.Medium,
              }}>
                {members.length} participant{members.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Menu Button */}
          <View style={{ marginLeft: 8 }}>
            <TouchableOpacity
              onPress={() => {
                setShowRulesModal(true);
                setShowHeaderMenu(false);
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: COLORS.inputBg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={{
            flex: 1,
            backgroundColor: COLORS.background,
          }}
          contentContainerStyle={{ 
            padding: 12,
            paddingBottom: 20,
            flexGrow: messages.length === 0 ? 1 : undefined, 
            justifyContent: messages.length === 0 ? 'center' : undefined
          }}
          removeClippedSubviews={false}
        >
          {messages.length > 0 ? (
            messages.map((message, index) => {
              const prev = messages[index - 1];
              const showDate = !prev || formatDateHeader(message.timestamp) !== formatDateHeader(prev.timestamp);
              
              return (
                <View key={message.id}>
                  {showDate && (
                    <View style={{
                      alignItems: 'center',
                      marginVertical: 16,
                    }}>
                      <Text style={{
                        color: COLORS.textSecondary,
                        fontSize: 11,
                        fontWeight: '600',
                        backgroundColor: COLORS.inputBg,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}>
                        {formatDateHeader(message.timestamp)}
                      </Text>
                    </View>
                  )}
                  <SwipeableMessage 
                    key={message.id} 
                    message={message} 
                    onReply={setReplyingTo}
                  />
                </View>
              );
            })
          ) : (
            <View style={{
              alignItems: 'center',
              backgroundColor: COLORS.inputBg,
              padding: 32,
              borderRadius: 20,
            }}>
              <Ionicons 
                name="chatbubbles-outline" 
                size={64} 
                color={COLORS.accent} 
                style={{ marginBottom: 16 }}
              />
              <Text style={{
                fontSize: 20,
                fontWeight: '700',
                color: COLORS.text,
                textAlign: 'center',
                marginBottom: 8,
              }}>
                No messages yet
              </Text>
              <Text style={{
                color: COLORS.textSecondary,
                textAlign: 'center',
                fontSize: 16,
                lineHeight: 22,
              }}>
                {getMotivationalQuote(groupId)}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Reply Preview */}
        {replyingTo && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: COLORS.inputBg,
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            borderLeftWidth: 3,
            borderLeftColor: COLORS.accent,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                color: COLORS.accent,
                fontWeight: '600',
                fontSize: 13,
              }}>
                Replying to {replyingTo.senderName}
              </Text>
              <Text style={{
                color: COLORS.textMuted,
                fontSize: 12,
                marginTop: 2,
              }} numberOfLines={1}>
                {truncateMessage(replyingTo.text, 40)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyingTo(null)}>
              <Ionicons 
                name="close" 
                size={20} 
                color={COLORS.textMuted} 
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Message Input */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: COLORS.headerBg,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }}>
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'flex-end',
            backgroundColor: COLORS.inputBg,
            borderRadius: 25,
            paddingHorizontal: 16,
            paddingVertical: 8,
            maxHeight: 100,
          }}>
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Message"
              placeholderTextColor={COLORS.textMuted}
              multiline
              style={{
                flex: 1,
                color: COLORS.text,
                fontSize: 16,
                lineHeight: 20,
                maxHeight: 80,
                paddingVertical: 4,
              }}
            />
          </View>
          
          <TouchableOpacity 
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            style={{
              marginLeft: 12,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: !newMessage.trim() ? COLORS.inputBg : COLORS.accent,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
            }}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={!newMessage.trim() ? COLORS.textMuted : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <RulesModal
          visible={showRulesModal}
          onClose={() => setShowRulesModal(false)}
        />
        <DeleteMessageModal
          visible={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onDelete={handleDeleteMessage}
          message={messageToDelete}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default GroupRoomScreen;