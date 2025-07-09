import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, router } from 'expo-router';
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
  Platform,
  KeyboardAvoidingView
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

import { 
  getGroupMessages, 
  sendMessage, 
  deleteMessage,
  getGroupMembers,
  checkGroupMembership,
  leaveGroup
} from '../../lib/firebase';
import { supabase } from '../../config/supabaseConfig';
import { useAuthStore } from '../../stores/useAuthStore';
import networkErrorHandler from '../../utiles/networkErrorHandler';

const { width } = Dimensions.get('window');
const SECRET_KEY = "kliq-secure-messaging-2024";

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

const LeaveGroupModal = ({ visible, onClose, onLeave, groupName }) => {
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
            <MaterialIcons name="exit-to-app" size={24} color={COLORS.danger} />
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: COLORS.text,
              marginLeft: 12,
            }}>
              Leave Group
            </Text>
          </View>
          
          <Text style={{
            fontSize: 15,
            color: COLORS.textSecondary,
            marginBottom: 24,
            lineHeight: 22,
          }}>
            Are you sure you want to leave "{groupName}"? You won't be able to see new messages or participate in this group.
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
              onPress={onLeave}
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
                Leave
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const HeaderMenuModal = ({ visible, onClose, onRules, onLeave }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        onPress={onClose}
        activeOpacity={1}
      >
        <View style={{
          position: 'absolute',
          top: 120,
          right: 20,
          backgroundColor: COLORS.cardBg,
          borderRadius: 12,
          padding: 8,
          minWidth: 200,
          borderWidth: 1,
          borderColor: COLORS.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}>
          <TouchableOpacity
            onPress={() => {
              onClose();
              onRules();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
          >
            <MaterialIcons name="gavel" size={20} color={COLORS.textSecondary} />
            <Text style={{
              fontSize: 16,
              color: COLORS.text,
              marginLeft: 12,
              fontWeight: '500',
            }}>
              Group Guidelines
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              onClose();
              onLeave();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
            }}
          >
            <MaterialIcons name="exit-to-app" size={20} color={COLORS.danger} />
            <Text style={{
              fontSize: 16,
              color: COLORS.danger,
              marginLeft: 12,
              fontWeight: '500',
            }}>
              Leave Group
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const truncateMessage = (text, maxLength = 35) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

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
  const { user } = useAuthStore();

  let parsedGroupImage;
  try {
    parsedGroupImage = groupImage ? JSON.parse(groupImage) : null;
  } catch (error) {
    parsedGroupImage = groupImage;
  }

  const group = {
    id: groupId,
    name: groupName || groupId,
    image: parsedGroupImage
  };

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
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [leaving, setLeaving] = useState(false);

  const scrollViewRef = useRef(null);
  const messagesUnsubscribeRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

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

  const encryptMessage = (text) => {
    try {
      if (!text) return '';
      return AES.encrypt(text, SECRET_KEY).toString();
    } catch (error) {
      console.error('Encryption error:', error);
      return text;
    }
  };

  const updateLastSeen = async () => {
    if (!user?.uid) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          last_seen: new Date().toISOString(),
          is_online: true 
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating last seen:', error);
      }
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  const fetchUserFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
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

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      fetchInitialData();
      
      return () => {
        cleanup();
        if (user?.id) {
          supabase
            .from('users')
            .update({ 
              last_seen: new Date().toISOString(),
              is_online: false 
            })
            .eq('id', user.id)
            .then(({ error }) => {
              if (error) console.error('Error setting offline status:', error);
            });
        }
      };
    }, [groupId, cleanup, user?.id])
  );

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

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      cleanup();

      loadingTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setLoading(false);
          setError('Loading timed out. Please check your connection and try again.');
        }
      }, 10000);

      await updateLastSeen();

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

      try {
        const messageSubscription = getGroupMessages(
          groupId,
          (fetchedMessages) => {
            if (isMountedRef.current) {
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
              
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
                loadingTimeoutRef.current = null;
              }
              
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

  useEffect(() => {
    async function checkMembership() {
      if (!user?.id || !groupId) return;
      try {
        const member = await checkGroupMembership(user.id, groupId);
        setIsMember(member);
      } catch (err) {
        console.error('Membership check error:', err);
        setIsMember(false);
      }
    }
    checkMembership();
  }, [user?.id, groupId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !isMember) return;
    setSending(true);
    try {
      const messageData = {
        text: encryptMessage(newMessage),
        senderId: user.id,
        senderName: user.displayName || user.full_name || 'Anonymous',
        timestamp: Date.now(),
        replyTo: replyingTo ? {
          id: replyingTo.id,
          senderName: replyingTo.senderName,
          text: encryptMessage(replyingTo.text)
        } : null
      };
      await sendMessage(groupId, messageData);
      setNewMessage('');
      setReplyingTo(null);
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
    } finally {
      setSending(false);
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

  const handleLeaveGroup = async () => {
    if (!user?.id || !groupId) return;
    
    setLeaving(true);
    try {
      // 1. Leave group in Firebase
      await leaveGroup(user.id, groupId);
      
      // 2. Update user's groups in Supabase
      const currentGroups = user.groups || [];
      const updatedGroups = currentGroups.filter(id => id !== groupId);
      
      const { error: supabaseError } = await supabase
        .from('users')
        .update({ groups: updatedGroups })
        .eq('id', user.id);
      
      if (supabaseError) {
        console.error('Error updating user groups in Supabase:', supabaseError);
      }
      
      // 3. Update auth store
      const { updateUserDetails } = useAuthStore.getState();
      await updateUserDetails({ groups: updatedGroups });
      
      Alert.alert(
        "Left Group",
        "You have successfully left the group.",
        [
          {
            text: "OK",
            onPress: () => {
              cleanup();
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      Alert.alert("Error", "Failed to leave group. Please try again.");
    } finally {
      setLeaving(false);
      setShowLeaveGroupModal(false);
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

  const SwipeableMessage = React.memo(({ message, onReply }) => {
    const translateX = new Animated.Value(0);
    const opacity = new Animated.Value(0);
    const isCurrentUser = message.senderId === user?.id;

    const onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: translateX } }],
      { useNativeDriver: true }
    );

    const onHandlerStateChange = (event) => {
      if (event.nativeEvent.state === State.END) {
        const { translationX } = event.nativeEvent;
        
        if (Math.abs(translationX) > 50) {
          onReply(message);
          
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

  const MessageBubble = React.memo(({ message }) => {
    const isCurrentUser = message.senderId === user?.id;

    const handleLongPress = () => {
      if (isCurrentUser) {
        setMessageToDelete(message);
        setShowDeleteModal(true);
      }
    };

    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    };

    const bubbleStyle = {
      backgroundColor: isCurrentUser ? COLORS.accent : '#191825',
      borderRadius: 16,
      paddingHorizontal: 18, // increased for better appearance
      paddingVertical: 8,
      borderTopRightRadius: isCurrentUser ? 4 : 16,
      borderTopLeftRadius: isCurrentUser ? 16 : 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1,
      alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
      maxWidth: '80%',
      minWidth: 56, // increased from 36
    };

    const messageTextStyle = {
      fontSize: 13,
      color: "#FFFFFF",
      lineHeight: 18,
      fontWeight: "400",
    };

    return (
      <View style={{ flexDirection: isCurrentUser ? 'row-reverse' : 'row', alignItems: 'flex-end', marginHorizontal: 16, marginVertical: 4 }}>
        <View style={{ flex: 1 }}>
          {/* Username and timestamp row above the bubble */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: isCurrentUser ? 'flex-end' : 'flex-start', marginBottom: 0 }}>
            {!isCurrentUser && (
              <Text style={{ fontFamily: Fonts.GeneralSans.Bold, color: '#fff', marginRight: 6, fontSize: 13 }}>{(message.senderName || '').split(' ')[0]}</Text>
            )}
            <Text style={{ fontFamily: Fonts.GeneralSans.Medium, color: '#A1A1AA', fontSize: 12 }}>{formatTime(message.timestamp)}</Text>
          </View>
          {/* Replied message bubble */}
          {message.replyTo && (
            <View style={{
              borderLeftWidth: 3,
              borderLeftColor: isCurrentUser ? 'rgba(255,255,255,0.4)' : COLORS.accent,
              backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.08)' : 'rgba(139, 92, 246, 0.08)',
              borderRadius: 8,
              paddingLeft: 10,
              paddingVertical: 4,
              marginBottom: 4,
              marginRight: 4,
              marginLeft: 0,
              maxWidth: '90%',
            }}>
              <Text style={{ fontSize: 11, color: isCurrentUser ? 'rgba(255,255,255,0.7)' : COLORS.textSecondary, fontWeight: '600' }}>
                {(message.replyTo.senderName || '').split(' ')[0] || 'User'}
              </Text>
              <Text style={{ fontSize: 12, color: isCurrentUser ? 'rgba(255,255,255,0.8)' : COLORS.text, marginTop: 1 }} numberOfLines={1}>
                {truncateMessage(message.replyTo.text, 50)}
              </Text>
            </View>
          )}
          {/* Message bubble */}
          <View style={bubbleStyle}>
            <Text style={messageTextStyle}>{message.text}</Text>
          </View>
        </View>
      </View>
    );
  });

  useEffect(() => {
    if (!groupId) {
      console.error('❌ Missing groupId parameter');
      setError('Invalid group. Please try again.');
      setLoading(false);
      return;
    }
  }, [groupId]);

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

          <View style={{ marginLeft: 8 }}>
            <TouchableOpacity
              onPress={() => setShowHeaderMenu(true)}
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

        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            ref={scrollViewRef}
            style={{
              flex: 1,
              backgroundColor: COLORS.background,
            }}
            contentContainerStyle={{ 
              padding: 12,
              flexGrow: 1,
              justifyContent: 'flex-end'
            }}
            removeClippedSubviews={false}
            onContentSizeChange={() => {
              if (scrollViewRef.current) {
                scrollViewRef.current.scrollToEnd({ animated: false });
              }
            }}
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
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
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
                  {getMotivationalQuote(group.name)}
                </Text>
              </View>
            )}
          </ScrollView>

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

          {isMember ? (
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
                disabled={!newMessage.trim() || sending || !isMember}
                style={{
                  marginLeft: 12,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: !newMessage.trim() || sending || !isMember ? COLORS.inputBg : COLORS.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                }}
              >
                {sending ? (
                  <ActivityIndicator size={20} color={COLORS.textMuted} />
                ) : (
                  <Ionicons 
                    name="send" 
                    size={20} 
                    color={!newMessage.trim() || !isMember ? COLORS.textMuted : '#FFFFFF'} 
                  />
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ 
              padding: 16, 
              backgroundColor: COLORS.inputBg, 
              alignItems: 'center',
              borderTopWidth: 1,
              borderTopColor: COLORS.border
            }}>
              <Text style={{ 
                color: COLORS.textMuted, 
                fontSize: 15, 
                textAlign: 'center' 
              }}>
                You are not a member of this group and cannot send messages.
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>

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
        <LeaveGroupModal
          visible={showLeaveGroupModal}
          onClose={() => setShowLeaveGroupModal(false)}
          onLeave={handleLeaveGroup}
          groupName={group.name}
        />
        <HeaderMenuModal
          visible={showHeaderMenu}
          onClose={() => setShowHeaderMenu(false)}
          onRules={() => setShowRulesModal(true)}
          onLeave={() => setShowLeaveGroupModal(true)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default GroupRoomScreen;