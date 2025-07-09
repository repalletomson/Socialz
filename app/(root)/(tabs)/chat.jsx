import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  InteractionManager,
  BackHandler,
  StatusBar,
  Pressable,
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

import { router } from 'expo-router';
import { useAuthStore } from '../../../stores/useAuthStore';
import { db } from '../../../config/firebaseConfig';
import { supabase } from '../../../config/supabaseConfig';
import { formatMessageTime } from '../../../utiles/dateFormat';

import { CHAT_TYPES } from '../../../types/index';
import { AES, enc } from "react-native-crypto-js";
import { AppText } from '../../_layout';
import { useSafeNavigation } from '../../../hooks/useSafeNavigation';
import networkErrorHandler from '../../../utiles/networkErrorHandler';
import { Fonts, TextStyles } from '../../../constants/Fonts';
import { scaleSize, verticalScale } from '../../../utiles/common';
import { useFocusEffect } from '@react-navigation/native';

const DEFAULT_PROFILE='https://assets.grok.com/users/8c354dfe-946c-4a32-b2de-5cb3a8ab9776/generated/h4epnwdFODX6hW0L/image.jpg';

// Updated WhatsApp-like dark theme colors
const COLORS = {
  background: '#000000',
  secondaryBackground: '#111111',
  surface: '#111111',
  cardBg: '#111111',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#6B7280',
  accent: '#8B5CF6',
  primary: '#8B5CF6',
  border: '#27272A',
  shadow: 'rgba(0, 0, 0, 0.3)',
  headerBg: '#111111',
  inputBg: '#1A1A1A',
  success: '#10B981',
  unreadBackground: '#09090B',
  searchBackground: '#1A1A1A',
  separator: '#27272A',
  // Additional dark theme colors for consistency
  textMuted: '#6B7280',
  textInverse: '#000000',
  overlay: 'rgba(0, 0, 0, 0.8)',
  modalBackground: '#0A0A0A',
  buttonBackground: '#1A1A1A',
  buttonText: '#FFFFFF',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

const { width } = Dimensions.get('window');
const SECRET_KEY = "kliq-secure-messaging-2024";

export default function ChatList() {
  const { user, isAuthenticated } = useAuthStore();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [error, setError] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const mounted = useRef(true);
  const searchTimeout = useRef(null);
  const chatsUnsubscribe = useRef(null);

  // Universal safe navigation
  const { safeNavigate, safeBack } = useSafeNavigation({
    modals: [
      () => showNewChatModal && setShowNewChatModal(false),
      // Add other modal close functions here if needed
    ],
    onCleanup: () => {
      // Clean up any FlatList or state here
    }
  });

  // Remove early return for !user?.uid
  // Instead, use a variable to conditionally render loading UI
  const showLoading = !isAuthenticated || !user?.id;

  if (showLoading) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#fff' }}>Loading...</Text></View>;

  // chats.js (only showing the unread count retrieval part)
  useEffect(() => {
    // Guard against null user
    if (!user?.id) return;
    
    const q = query(
      collection(db, "unreadCounts", user.id, "senders")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = {};
      snapshot.docs.forEach((doc) => {
        counts[doc.id] = doc.data().count;
      });
      setUnreadCounts(counts);
    });
    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (searchQuery) {
          setSearchQuery('');
          return true;
        }
        return false;
      }
    );

    return () => {
      mounted.current = false;
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (chatsUnsubscribe.current) chatsUnsubscribe.current();
      backHandler.remove();
    };
  }, [searchQuery]);

  const getOtherParticipantId = useCallback((participants = [], currentUserId) => {
    if (!Array.isArray(participants) || participants.length < 2) return null;
    return participants.find(id => id !== currentUserId) || null;
  }, []);

  const fetchUserDetails = async (userId) => {
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
        college: data.college,
        branch: data.branch,
        passout_year: data.passout_year,
        bio: data.bio,
        about: data.bio,
        profile_initials: data.profile_initials,
        interests: data.interests,
        created_at: data.created_at,
        updated_at: data.updated_at,
        expo_push_token: data.expo_push_token,
        lastSeen: data.last_seen ? new Date(data.last_seen) : null,
        isOnline: data.is_online || false
      };
    } catch (error) {
      console.error('Error fetching user from Supabase:', error);
      return null;
    }
  };

  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Enhanced query to capture all chats including newly created ones
      const chatsQuery = query( 
        collection(db, 'chats'),
        where('participants', 'array-contains', user.id)
        // Removed orderBy to ensure all chats are captured first
      );
      
      chatsUnsubscribe.current = onSnapshot(chatsQuery, async (snapshot) => {
        try {
          console.log(`📥 Chat listener triggered - ${snapshot.docs.length} chats found`);
          
          const chatPromises = snapshot.docs.map(async (doc) => {
            const chatData = doc.data();
            if (chatData.type === CHAT_TYPES.GROUP) {
              return {
                id: doc.id,
                ...chatData,
                isGroup: true,
                lastMessageTime: chatData.lastMessageTime || chatData.createdAt || new Date()
              };
            }
            const otherUserId = getOtherParticipantId(chatData.participants, user.id);
            if (!otherUserId) return null;

            const userDetails = await fetchUserDetails(otherUserId);
            
            return {
              id: doc.id,
              ...chatData,
              recipient: userDetails,
              recipientId: otherUserId,
              unreadCount: chatData.unreadCount || 0,
              lastMessageTime: chatData.lastMessageTime || chatData.createdAt || new Date()
            };
          });

          const populatedChats = (await Promise.all(chatPromises)).filter(Boolean);
          
          // Sort chats by lastMessageTime in memory (after fetching)
          populatedChats.sort((a, b) => {
            const timeA = a.lastMessageTime?.toDate?.() || a.lastMessageTime || new Date(0);
            const timeB = b.lastMessageTime?.toDate?.() || b.lastMessageTime || new Date(0);
            return timeB - timeA;
          });
          
          console.log(`✅ Loaded ${populatedChats.length} chats successfully`);
          setChats(populatedChats);
          if (mounted.current) {
            setError(null);
          }

          // Setup unread counts listener
          const unreadQ = query(
            collection(db, "unreadCounts", user.id, "senders")
          );
          const unreadUnsubscribe = onSnapshot(unreadQ, (snapshot) => {
            const counts = {};
            snapshot.docs.forEach((doc) => {
              counts[doc.id] = doc.data().count;
            });
            setUnreadCounts(counts);
          });

          return () => {
            unreadUnsubscribe();
          };
        } catch (err) {
          if (mounted.current) {
            console.error("Error loading chat details:", err);
            setError('Failed to load chat details');
          }
        } finally {
          if (mounted.current) {
            setLoading(false);
          }
        }
      }, (err) => {
        console.error("Firestore listener error:", err);
        if (mounted.current) {
          setError('Error listening to chat updates');
          setLoading(false);
        }
      });
      
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      if (mounted.current) {
        setError('Failed to initialize chat list');
        setLoading(false);
      }
    }
  }, [getOtherParticipantId, user?.id]);

  useEffect(() => {
    loadChats();
    InteractionManager.runAfterInteractions(() => {});
    return () => {
      if (chatsUnsubscribe.current) {
        chatsUnsubscribe.current();
      }
    };
  }, [loadChats]);

  // Modified handleSearch to fetch all users from Supabase instead of Firebase
  const handleSearch = useCallback(async (queryText) => {
    if (!queryText.trim() || !user?.id) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    try {
      console.log('🔍 Searching for users with query:', queryText);
      
      // Query all users from Supabase with multiple search fields
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          full_name,
          profile_image,
          college,
          branch,
          passout_year,
          bio
        `)
        .neq('id', user.id)
        .or(`full_name.ilike.%${queryText}%,username.ilike.%${queryText}%,branch.ilike.%${queryText}%`)
        .limit(20);

      if (error) {
        console.error('❌ Supabase search error:', error);
        setSearchResults([]);
        return;
      }

      console.log(`✅ Found ${usersData?.length || 0} users matching "${queryText}"`);
      
      // Transform data for compatibility
      const transformedUsers = usersData?.map(userData => ({
        id: userData.id,
        userId: userData.id, // For compatibility
        // uid: userData.id, // For compatibility
        fullName: userData.full_name,
        full_name: userData.full_name,
        displayName: userData.full_name,
        username: userData.username,
        profileImage: userData.profile_image,
        profile_image: userData.profile_image,
        photoURL: userData.profile_image,
        college: userData.college,
        branch: userData.branch,
        passout_year: userData.passout_year,
        bio: userData.bio,
        about: userData.bio
      })) || [];

      setSearchResults(transformedUsers);
      console.log('Search results set:', transformedUsers.length);
      
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [user?.uid]);

  // Search debouncing effect - fix: use 500ms debounce, only show results after user stops typing
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimeout.current = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500); // 500ms debounce
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, handleSearch]);

  const deleteChat = async (chatId) => {
    try {
      setLoading(true);
      
      // Ensure chatId is valid
      if (!chatId) {
        throw new Error("Invalid chatId");
      }
  
      // Delete messages
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      await Promise.all(messagesSnapshot.docs.map(doc => deleteDoc(doc.ref)));
  
      // Delete chat document
      await deleteDoc(doc(db, 'chats', chatId));
  
      setShowDeleteModal(false);
      setSelectedChat(null);
      Alert.alert('Success', 'Chat deleted successfully');
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      Alert.alert('Error', 'Failed to delete chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchNavigation = useCallback(async (recipientId) => {
    try {
      if (!recipientId) {
        Alert.alert('Error', 'Invalid recipient');
        return;
      }
       
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', user.id)
      );
      const snapshot = await getDocs(q);
      
      const existingChat = snapshot.docs.find(doc => 
        doc.data().participants.includes(recipientId)
      );

      if (existingChat) {
        router.push({
          pathname: '/(root)/[chatRoom]',
          params: { 
            chatId: existingChat.id,
            recipientId 
          }
        });
      } else {
        console.log('🔥 Creating new chat with recipient:', recipientId);
        
        const newChatData = {
          participants: [user.id, recipientId],
          createdAt: serverTimestamp(),
          lastMessageTime: serverTimestamp(),
          lastMessage: null,
          lastSender: null,
          type: 'direct', // Add type for clarity
          unreadCount: 0
        };

        const newChatRef = await addDoc(chatsRef, newChatData);
        
        console.log('✅ New chat created successfully:', newChatRef.id);

        // Navigate to the new chat
        router.push({
          pathname: '/(root)/[chatRoom]',
          params: { 
            chatId: newChatRef.id,
            recipientId 
          }
        });
        
        // Force refresh chat list after a short delay to ensure the new chat appears
        setTimeout(() => {
          loadChats();
        }, 500);
      }
      setSearchQuery('');
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      Alert.alert('Error', 'Failed to navigate to chat');
    }
  }, [user.id, loadChats]);

  const handleChatNavigation = useCallback(async (recipientId) => {
    try {
      if (!recipientId) {
        Alert.alert('Error', 'Invalid recipient');
        return;
      }
      
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', user.id)
      );
      const snapshot = await getDocs(q);
      
      const existingChat = snapshot.docs.find(doc => 
        doc.data().participants.includes(recipientId)
      );

      if (existingChat) {
        router.push({
          pathname: '/(root)/[chatRoom]',
          params: { 
            chatId: existingChat.id,
            recipientId 
          }
        });
      } else {
        const newChatRef = await addDoc(chatsRef, {
          participants: [user.id, recipientId],
          createdAt: new Date(),
          lastMessageTime: new Date(),
          lastMessage: null
        });

        router.push({
          pathname: '/(root)/[chatRoom]',
          params: { 
            chatId: newChatRef.id,
            recipientId 
          }
        });
      }
      setSearchQuery('');
    } catch (error) {
      networkErrorHandler.showErrorToUser(error);
      Alert.alert('Error', 'Failed to navigate to chat');
    }
  }, [user.id]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Modern Header Component
  const Header = () => (
    <View style={{
      backgroundColor: COLORS.headerBg,
      paddingTop: verticalScale(60),
      paddingBottom: verticalScale(20),
      paddingHorizontal: scaleSize(20),
      borderBottomWidth: 1,
      borderBottomColor: COLORS.separator,
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 3,
      elevation: 3,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        {/* Chat Title */}
        <AppText style={{
          fontSize: scaleSize(34),
          fontFamily: Fonts.GeneralSans.Bold,
          color: COLORS.textPrimary,
          letterSpacing: 0.4,
        }}>
          Chat
        </AppText>
        
        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: scaleSize(12) }}>
          {/* New Chat Button */}
          <TouchableOpacity
            onPress={() => setShowNewChatModal(true)}
            style={{
              width: scaleSize(44),
              height: scaleSize(44),
              borderRadius: scaleSize(22),
              backgroundColor: COLORS.primary,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="create-outline" size={scaleSize(22)} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Modern Search Bar Component
  const SearchBar = () => (
    <View style={{
      backgroundColor: COLORS.background,
      paddingHorizontal: scaleSize(20),
      paddingVertical: verticalScale(16),
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.searchBackground,
        borderRadius: scaleSize(16),
        paddingHorizontal: scaleSize(16),
        paddingVertical: verticalScale(12),
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: scaleSize(2),
        elevation: 1,
      }}>
        <Ionicons name="search-outline" size={scaleSize(20)} color={COLORS.textSecondary} />
        <TextInput
          style={{
            flex: 1,
            marginLeft: scaleSize(12),
            fontSize: scaleSize(16),
            color: COLORS.textPrimary,
            fontFamily: 'System',
            letterSpacing: 0.3,
          }}
          placeholder="Search chat..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searching ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={scaleSize(20)} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  function handleDecrypt(text) {
    let decryptedText = "";
  
    // Decrypt the last message text if it exists
    if (text) {
      try {
        decryptedText = AES.decrypt(text, SECRET_KEY).toString(enc.Utf8);

        console.log(decryptedText)
        if (!decryptedText) {
          decryptedText = "[Decryption Failed]";
        }
        return decryptedText;
      } catch (error) {
        console.error("Decryption error:", error);
        decryptedText = "[Decryption Failed]";
        return decryptedText;
      }
    }
    return "";
  }

  // Modern Chat Item Component with tap animation
  const ChatItem = ({ item }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
              }).start();
      };

      const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }).start();
    };

    const hasUnread = item.unreadcount >= 1;

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={() => handleChatNavigation(item.recipientId)}
          onLongPress={() => {
            setSelectedChat(item);
            setShowDeleteModal(true);
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{
            backgroundColor: hasUnread ? COLORS.unreadBackground : COLORS.background,
            paddingVertical: verticalScale(16),
            paddingHorizontal: scaleSize(20),
            marginHorizontal: scaleSize(4),
            marginVertical: verticalScale(2),
            borderRadius: scaleSize(12),
            minHeight: verticalScale(80),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {/* Profile Avatar with online indicator */}
          <View style={{ position: 'relative', marginRight: scaleSize(16) }}>
                         <View style={{
               width: scaleSize(56),
               height: scaleSize(56),
               borderRadius: scaleSize(28),
               backgroundColor: COLORS.secondaryBackground,
               justifyContent: 'center',
               alignItems: 'center',
               borderWidth: hasUnread ? 2 : 2,
               borderColor: hasUnread ? COLORS.primary : COLORS.accent,
             }}>
               <Text style={{
                 color: COLORS.textPrimary,
                 fontSize: scaleSize(20),
                 fontFamily: Fonts.GeneralSans.Bold,
                 letterSpacing: -0.3,
               }}>
                 {item.recipient?.profile_initials || item.recipient?.full_name?.charAt(0) || item.recipient?.fullName?.charAt(0) || 'U'}
               </Text>
             </View>
            {item.recipient?.online && (
              <View style={{
                position: 'absolute',
                bottom: verticalScale(2),
                right: 0,
                width: scaleSize(16),
                height: scaleSize(16),
                borderRadius: scaleSize(8),
                backgroundColor: COLORS.success,
                borderWidth: 2,
                borderColor: COLORS.background,
              }} />
            )}
          </View>

          {/* Chat Content */}
          <View style={{ flex: 1 }}>
            {/* Top Row: Name and Time */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: verticalScale(6),
            }}>
              <AppText style={{
                fontSize: scaleSize(17),
                fontFamily: hasUnread ? Fonts.GeneralSans.Bold : Fonts.GeneralSans.Semibold,
                color: COLORS.textPrimary,
                letterSpacing: 0.3,
                flex: 1,
              }} numberOfLines={1}>
                {item.recipient?.fullName || 'Unknown User'}
              </AppText>
              
              <AppText style={{
                fontSize: scaleSize(14),
                color: hasUnread ? COLORS.primary : COLORS.textSecondary,
                letterSpacing: 0.2,
                fontFamily: hasUnread ? Fonts.GeneralSans.Semibold : Fonts.GeneralSans.Regular,
                marginLeft: scaleSize(8),
              }}>
                {formatTime(item.lastMessageTime)}
              </AppText>
            </View>
            
            {/* Bottom Row: Message Preview and Unread Count */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              {/* Message Preview */}
              <AppText 
                style={{
                  color: hasUnread ? COLORS.textPrimary : COLORS.textSecondary,
                  flex: 1,
                  fontSize: scaleSize(15),
                  letterSpacing: 0.2,
                  fontFamily: hasUnread ? Fonts.GeneralSans.Medium : Fonts.GeneralSans.Regular,
                  marginRight: scaleSize(12),
                }}
                numberOfLines={1}
              >
                {handleDecrypt(item.lastMessage) || 'No messages yet'}
              </AppText>
              
              {/* Unread Count Badge and Status Icons */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: scaleSize(8) }}>
                {/* Double tick for seen messages */}
                {!hasUnread && item.lastMessage && (
                  <Ionicons name="checkmark-done" size={scaleSize(16)} color={COLORS.primary} />
                )}
                
                {/* Unread Count Badge */}
                {hasUnread && (
                  <View style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: scaleSize(12),
                    minWidth: scaleSize(24),
                    height: scaleSize(24),
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: scaleSize(8),
                  }}>
                    <AppText style={{
                      color: COLORS.background,
                      fontSize: scaleSize(12),
                      fontFamily: Fonts.GeneralSans.Semibold,
                    }}>
                      {item.unreadcount > 99 ? '99+' : item.unreadcount}
                    </AppText>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // Modern Delete Modal
  const DeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}>
        <View style={{
          backgroundColor: COLORS.background,
          borderRadius: scaleSize(20),
          padding: scaleSize(24),
          width: '85%',
          maxWidth: scaleSize(320),
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: scaleSize(8) },
          shadowOpacity: 1,
          shadowRadius: scaleSize(16),
          elevation: 8,
        }}>
          <AppText style={{
            fontSize: scaleSize(20),
            fontFamily: Fonts.GeneralSans.Semibold,
            color: COLORS.textPrimary,
            textAlign: 'center',
            marginBottom: scaleSize(12),
            letterSpacing: 0.3
          }}>
            Delete Chat
          </AppText>
          <AppText style={{
            color: COLORS.textSecondary,
            textAlign: 'center',
            marginBottom: scaleSize(24),
            lineHeight: scaleSize(20),
            letterSpacing: 0.2
          }}>
            Are you sure you want to delete this chat? This action cannot be undone.
          </AppText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: scaleSize(12) }}>
            <TouchableOpacity
              onPress={() => setShowDeleteModal(false)}
              style={{
                padding: scaleSize(16),
                flex: 1,
                alignItems: 'center',
                backgroundColor: COLORS.searchBackground,
                borderRadius: scaleSize(12),
              }}
            >
              <AppText style={{ color: COLORS.textPrimary, fontFamily: Fonts.GeneralSans.Semibold, letterSpacing: 0.3 }}>Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteChat(selectedChat?.id)}
              style={{
                padding: scaleSize(16),
                flex: 1,
                alignItems: 'center',
                backgroundColor: '#DC2626',
                borderRadius: scaleSize(12),
              }}
            >
              <AppText style={{ color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Semibold, letterSpacing: 0.3 }}>Delete</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const fetchUser = async () => {
        const { data: { user: supaUser } } = await supabase.auth.getUser();
        if (supaUser && isActive) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', supaUser.id)
            .single();
          if (data && isActive) {
            setUser(data);
          }
        }
      };
      fetchUser();
      return () => { isActive = false; };
    }, [])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" />
      {showLoading ? (
        <View style={{ 
          flex: 1, 
          backgroundColor: COLORS.background, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
              <Text style={{ fontSize: scaleSize(32), color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Medium, marginRight: 2, letterSpacing: -1 }}>social</Text>
              <Text style={{ fontSize: scaleSize(44), color: '#FFFFFF', fontFamily: Fonts.GeneralSans.Bold, letterSpacing: -2 }}>z.</Text>
            </View>
            <Text style={{ color: '#A1A1AA', fontSize: scaleSize(18), marginTop: 8, fontFamily: Fonts.GeneralSans.Medium }}>Loading...</Text>
          </View>
        </View>
      ) : (
        <>
      {/* Main content over glassmorphism background */}
      <Header />
      <SearchBar />
      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <ChatItem item={item} />}
        contentContainerStyle={{
          paddingTop: verticalScale(8),
          paddingBottom: verticalScale(100),
        }}
        refreshing={loading}
        onRefresh={loadChats}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: scaleSize(40),
            marginTop: verticalScale(80),
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: scaleSize(24),
            overflow: 'hidden',
          }}>
            <Ionicons name="chatbubbles-outline" size={scaleSize(64)} color={COLORS.textTertiary} />
            <AppText style={{
              color: COLORS.textSecondary,
              textAlign: 'center',
              fontSize: scaleSize(18),
              fontFamily: Fonts.GeneralSans.Medium,
              letterSpacing: 0.3,
              lineHeight: scaleSize(24),
              marginTop: verticalScale(16),
            }}>
              No conversations yet
            </AppText>
            <AppText style={{
              color: COLORS.textTertiary,
              textAlign: 'center',
              fontSize: scaleSize(16),
              letterSpacing: 0.2,
              lineHeight: scaleSize(20),
              marginTop: verticalScale(8),
            }}>
              Start chatting with your friends!
            </AppText>
          </View>
        }
      />

      {/* New Chat Modal */}
      <Modal
        visible={showNewChatModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewChatModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingTop: verticalScale(60),
            paddingHorizontal: scaleSize(20),
            paddingBottom: verticalScale(20),
            borderBottomWidth: 1,
            borderBottomColor: COLORS.separator,
            backgroundColor: COLORS.background,
          }}>
            <TouchableOpacity 
              onPress={() => setShowNewChatModal(false)}
              style={{ 
                marginRight: scaleSize(16),
                width: scaleSize(44),
                height: scaleSize(44),
                borderRadius: scaleSize(22),
                backgroundColor: COLORS.searchBackground,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="arrow-back" size={scaleSize(24)} color={COLORS.textPrimary} />
            </TouchableOpacity>
            
            <AppText style={{
              fontSize: scaleSize(20),
              fontFamily: Fonts.GeneralSans.Semibold,
              color: COLORS.textPrimary,
              letterSpacing: 0.3,
              flex: 1,
            }}>
              New Chat
            </AppText>
          </View>

          <View style={{ paddingHorizontal: scaleSize(20), paddingVertical: verticalScale(16) }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.searchBackground,
              borderRadius: scaleSize(16),
              paddingHorizontal: scaleSize(16),
              paddingVertical: verticalScale(12),
              borderWidth: 1,
              borderColor: COLORS.border,
            }}>
              <Ionicons name="search" size={scaleSize(20)} color={COLORS.textSecondary} />
              <TextInput
                style={{
                  flex: 1,
                  marginLeft: scaleSize(12),
                  fontSize: scaleSize(16),
                  color: COLORS.textPrimary,
                  paddingVertical: verticalScale(4)
                }}
                placeholder="Search users..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={scaleSize(20)} color={COLORS.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          
          {searching ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    handleSearchNavigation(item.id);
                    setShowNewChatModal(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    padding: scaleSize(20),
                    alignItems: 'center',
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.separator,
                    backgroundColor: COLORS.background,
                    marginHorizontal: scaleSize(4),
                    marginVertical: verticalScale(2),
                    borderRadius: scaleSize(12),
                    minHeight: verticalScale(80),
                  }}
                >
                  <Image
                    source={
                      item.profileImage 
                        ? { uri: item.profileImage === "https://via.placeholder.com/150" ? DEFAULT_PROFILE : item.profileImage } 
                        : { uri: DEFAULT_PROFILE }
                    }
                    style={{
                      width: scaleSize(56),
                      height: scaleSize(56),
                      borderRadius: scaleSize(28),
                      backgroundColor: COLORS.searchBackground,
                      borderWidth: 1,
                      borderColor: COLORS.border,
                      marginRight: scaleSize(16),
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <AppText style={{
                      fontSize: scaleSize(17),
                      fontFamily: Fonts.GeneralSans.Semibold,
                      color: COLORS.textPrimary,
                      letterSpacing: 0.3,
                      marginBottom: verticalScale(4),
                    }}>
                      {item.fullName || 'Unknown User'}
                    </AppText>
                    {/* Display college name */}
                    {item.college && (
                      <AppText style={{
                        fontSize: scaleSize(15),
                        color: COLORS.textSecondary,
                        letterSpacing: 0.2,
                      }}>
                        @{item.college.name || 'No college information'}
                      </AppText>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length > 0 ? (
                  <View style={{ padding: scaleSize(40), alignItems: 'center' }}>
                    <Ionicons name="search-outline" size={scaleSize(48)} color={COLORS.textTertiary} />
                    <AppText style={{ 
                      color: COLORS.textSecondary, 
                      fontSize: scaleSize(16), 
                      marginTop: verticalScale(16),
                      fontFamily: Fonts.GeneralSans.Medium 
                    }}>
                      No users found
                    </AppText>
                  </View>
                ) : (
                  <View style={{ padding: scaleSize(40), alignItems: 'center' }}>
                    <Ionicons name="people-outline" size={scaleSize(48)} color={COLORS.textTertiary} />
                    <AppText style={{ 
                      color: COLORS.textSecondary, 
                      fontSize: scaleSize(16), 
                      marginTop: verticalScale(16),
                      fontFamily: Fonts.GeneralSans.Medium 
                    }}>
                      Search for users to chat with
                    </AppText>
                  </View>
                )
              }
            />
          )}
        </View>
      </Modal>

      <DeleteModal />
        </>
      )}
    </SafeAreaView>
  );
}