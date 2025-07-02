import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Alert,
  StyleSheet,
  Animated,
  Keyboard,
  ActivityIndicator,
  Modal,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  arrayRemove,
  arrayUnion,
  getDoc,
  setDoc,
  increment,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { AES, enc } from "react-native-crypto-js";
import { useAuth } from "../context/authContext";

// Modern black theme colors
const COLORS = {
  background: "#000000",
  surface: "#111111",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  accent: "#3B82F6",
  separator: "#27272A",
  primary: "#3B82F6",
  border: "#27272A",
  danger: "#EF4444",
  success: "#10B981",
};

// Consistent secret key
const SECRET_KEY = "kliq-secure-messaging-2024";

const DisappearingMessagesModal = ({ visible, onClose, onConfirm }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.confirmModalOverlay}>
        <View style={styles.confirmModalContent}>
          <View style={styles.confirmModalHeader}>
            <MaterialIcons name="timer" size={24} color={COLORS.accent} />
            <Text style={styles.confirmModalTitle}>Disappearing Messages</Text>
          </View>
          <Text style={styles.confirmModalText}>
            Messages will automatically disappear after 24 hours for everyone in this chat.
          </Text>
          <View style={styles.confirmModalButtons}>
            <TouchableOpacity onPress={onClose} style={styles.confirmModalCancel}>
              <Text style={styles.confirmModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={styles.confirmModalConfirm}>
              <Text style={styles.confirmModalConfirmText}>Enable</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const MessageInput = React.memo(
  ({
    chatId,
    recipientId,
    isBlocked,
    replyingTo,
    onCancelReply,
    onSendMessage,
    handleUnblockUser,
    scrollToBottom,
    disappearingMessages,
  }) => {
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [inputHeight, setInputHeight] = useState(36);
    const [isTyping, setIsTyping] = useState(false);
    const [showDisappearingModal, setShowDisappearingModal] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const isMounted = useRef(true);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        if (Platform.OS === 'ios') {
          Animated.timing(translateY, {
            toValue: -event.endCoordinates.height + 34, // 34 is safe area bottom
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
        if (scrollToBottom) setTimeout(scrollToBottom, 100);
      });
      
      const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
        setKeyboardHeight(0);
        if (Platform.OS === 'ios') {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      });

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }, [scrollToBottom, translateY]);

    useEffect(() => {
      return () => {
        isMounted.current = false;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      };
    }, []);

    useEffect(() => {
      if (replyingTo && inputRef.current) {
        inputRef.current.focus();
      }
    }, [replyingTo]);

    const animateSendButton = () => {
      Animated.sequence([
        Animated.spring(scaleAnim, { 
          toValue: 1.1, 
          duration: 150, 
          useNativeDriver: true 
        }),
        Animated.spring(scaleAnim, { 
          toValue: 1, 
          duration: 150, 
          useNativeDriver: true 
        })
      ]).start();
    };

    const resetInputField = () => {
      setInputHeight(36);
      setMessage("");
    };

    // Typing indicator logic
    useEffect(() => {
      const chatRef = doc(db, "chats", chatId);
      const updateTypingStatus = async (isTyping) => {
        try {
          const chatDoc = await getDoc(chatRef);
          if (!user?.uid) return;
          
          if (!chatDoc.exists()) {
            await setDoc(chatRef, { typingUsers: [] });
          } else if (!chatDoc.data()?.typingUsers) {
            await updateDoc(chatRef, { typingUsers: [] });
          }

          if (isTyping) {
            await updateDoc(chatRef, { 
              typingUsers: arrayUnion(user.uid) 
            });
          } else {
            await updateDoc(chatRef, { 
              typingUsers: arrayRemove(user.uid) 
            });
          }
        } catch (error) {
          console.error("Error updating typing status:", error);
        }
      };

      if (message.length > 0) {
        setIsTyping(true);
        updateTypingStatus(true);
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          updateTypingStatus(false);
        }, 3000);
      } else {
        setIsTyping(false);
        updateTypingStatus(false);
      }

      return () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        updateTypingStatus(false);
      };
    }, [message, chatId]);

    const handleToggleDisappearingMessages = async () => {
      if (!disappearingMessages) {
        setShowDisappearingModal(true);
      } else {
        try {
          await updateDoc(doc(db, "chats", chatId), {
            disappearingMessages: false,
            disappearingMessagesUpdatedAt: serverTimestamp(),
          });
        } catch (error) {
          console.error("Error disabling disappearing messages:", error);
          Alert.alert("Error", "Failed to disable disappearing messages");
        }
      }
    };

    const enableDisappearingMessages = async () => {
      try {
        await updateDoc(doc(db, "chats", chatId), {
          disappearingMessages: true,
          disappearingMessagesUpdatedAt: serverTimestamp(),
        });
        setShowDisappearingModal(false);
      } catch (error) {
        console.error("Error enabling disappearing messages:", error);
        Alert.alert("Error", "Failed to enable disappearing messages");
      }
    };

    const handleSendMessage = useCallback(async () => {
      if (sending || message.trim() === "" || !isMounted.current || !user?.uid) return;

      try {
        setSending(true);
        animateSendButton();

        const messageContent = message.trim();
        const encryptedMessage = AES.encrypt(messageContent, SECRET_KEY).toString();

        // Reset input immediately for better UX
        resetInputField();

        const now = serverTimestamp();
        const expiresAt = disappearingMessages ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

        const messageData = {
          text: encryptedMessage,
          sender: user.uid,
          name: user.displayName || user.full_name || "User",
          userAvatar: user.photoURL || user.profile_image || null,
          timestamp: now,
          type: "text",
          reactions: {},
          status: "sent",
          readBy: { [user.uid]: true },
          unreadBy: [recipientId],
          ...(replyingTo && {
            replyTo: {
              id: replyingTo.id,
              text: replyingTo.text,
              sender: replyingTo.sender,
              type: replyingTo.type,
              name: replyingTo.name,
            },
          }),
          ...(disappearingMessages && { 
            expiresAt, 
            isDisappearing: true 
          }),
        };

        const docRef = await addDoc(collection(db, "chats", chatId, "messages"), messageData);

        // Update chat document
        await updateDoc(doc(db, "chats", chatId), {
          lastMessage: encryptedMessage,
          lastMessageTime: now,
          disappearingMessages,
          ...(replyingTo && {
            lastMessageReplyTo: {
              id: replyingTo.id,
              text: replyingTo.text,
              sender: replyingTo.sender,
              type: replyingTo.type,
            },
          }),
          ...(disappearingMessages && { lastMessageExpiresAt: expiresAt }),
        });

        // Update unread count
        const unreadCountRef = doc(db, "unreadCounts", recipientId, "senders", user.uid);
        const unreadCountDoc = await getDoc(unreadCountRef);

        if (unreadCountDoc.exists()) {
          await updateDoc(unreadCountRef, {
            count: increment(1),
            lastMessage: encryptedMessage,
            lastMessageTime: now,
            chatId,
          });
        } else {
          await setDoc(unreadCountRef, {
            count: 1,
            lastMessage: encryptedMessage,
            lastMessageTime: now,
            chatId,
          });
        }

        if (scrollToBottom) setTimeout(scrollToBottom, 100);
        onSendMessage?.(docRef.id);
        onCancelReply?.();

        // Keep keyboard open and focus on input
        setTimeout(() => {
          if (inputRef.current && isMounted.current) {
            inputRef.current.focus();
          }
        }, 50);

      } catch (error) {
        console.error("Send message error:", error);
        if (isMounted.current) {
          Alert.alert("Error", "Failed to send message");
          setMessage(messageContent); // Restore message on error
        }
      } finally {
        setSending(false);
      }
    }, [chatId, message, sending, replyingTo, disappearingMessages, scrollToBottom, onSendMessage, onCancelReply]);

    const handleContentSizeChange = (event) => {
      const { height } = event.nativeEvent.contentSize;
      setInputHeight(Math.min(100, Math.max(36, height + 6)));
    };

    const canSend = message.trim().length > 0 && !sending;

    return (
      <>
        <Animated.View
          style={[
            styles.floatingContainer,
            Platform.OS === 'ios' && { transform: [{ translateY }] }
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
            style={styles.keyboardAvoidingView}
          >
            <SafeAreaView style={styles.container} edges={["bottom"]}>
              {/* Reply indicator */}
              {replyingTo && (
                <View style={styles.replyContainer}>
                  <View style={styles.replyContent}>
                    <Text style={styles.replyLabel}>
                      Replying to {replyingTo.sender === user.uid ? "yourself" : replyingTo.name}
                    </Text>
                    <Text style={styles.replyText} numberOfLines={1}>
                      {replyingTo.type === "text" 
                        ? AES.decrypt(replyingTo.text, SECRET_KEY).toString(enc.Utf8) 
                        : "Message"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={onCancelReply} style={styles.replyCloseButton}>
                    <MaterialIcons name="close" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Blocked user message */}
              {isBlocked ? (
                <View style={styles.blockedContainer}>
                  <Text style={styles.blockedText}>You have blocked this user.</Text>
                  <TouchableOpacity onPress={handleUnblockUser} style={styles.unblockButton}>
                    <Text style={styles.unblockButtonText}>Unblock</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  {/* Text input container */}
                  <View style={styles.textInputContainer}>
                    <TextInput
                      ref={inputRef}
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Message"
                      placeholderTextColor={COLORS.textSecondary}
                      multiline
                      style={[styles.textInput, { height: inputHeight }]}
                      onContentSizeChange={handleContentSizeChange}
                      editable={!sending}
                      blurOnSubmit={false}
                      onSubmitEditing={handleSendMessage}
                      returnKeyType="send"
                    />
                    
                    {/* Disappearing messages toggle */}
                    {message.length === 0 && (
                      <TouchableOpacity
                        onPress={handleToggleDisappearingMessages}
                        style={[
                          styles.disappearingButton,
                          { 
                            backgroundColor: disappearingMessages ? COLORS.accent : "transparent",
                            opacity: disappearingMessages ? 1 : 0.6,
                          }
                        ]}
                      >
                        <MaterialIcons 
                          name="schedule" 
                          size={16} 
                          color={disappearingMessages ? "#FFFFFF" : COLORS.textSecondary} 
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Send button */}
                  <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                    <TouchableOpacity
                      onPress={handleSendMessage}
                      disabled={!canSend}
                      style={[
                        styles.sendButton,
                        { 
                          backgroundColor: canSend ? COLORS.primary : COLORS.separator,
                        }
                      ]}
                    >
                      {sending ? (
                        <ActivityIndicator size="small" color={COLORS.textPrimary} />
                      ) : (
                        <MaterialIcons 
                          name={canSend ? "send" : "send"} 
                          size={16} 
                          color={canSend ? "#FFFFFF" : COLORS.textSecondary} 
                        />
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              )}
            </SafeAreaView>
          </KeyboardAvoidingView>
        </Animated.View>

        {/* Disappearing Messages Modal */}
        <DisappearingMessagesModal
          visible={showDisappearingModal}
          onClose={() => setShowDisappearingModal(false)}
          onConfirm={enableDisappearingMessages}
        />
      </>
    );
  }
);

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  keyboardAvoidingView: { 
    backgroundColor: "transparent",
  },
  container: { 
    backgroundColor: COLORS.background, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.separator,
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
  },
  replyContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: COLORS.surface, 
    padding: 12, 
    borderRadius: 12, 
    marginHorizontal: 16, 
    marginTop: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  replyContent: { 
    flex: 1 
  },
  replyLabel: { 
    fontSize: 13, 
    color: COLORS.accent,
    fontWeight: "600",
  },
  replyText: { 
    fontSize: 14, 
    color: COLORS.textPrimary, 
    marginTop: 2 
  },
  replyCloseButton: { 
    padding: 8,
    marginLeft: 8,
  },
  blockedContainer: { 
    padding: 20, 
    backgroundColor: COLORS.background, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.separator, 
    alignItems: "center" 
  },
  blockedText: { 
    fontSize: 16, 
    color: COLORS.textSecondary, 
    textAlign: "center", 
    marginBottom: 12 
  },
  unblockButton: { 
    padding: 12, 
    backgroundColor: COLORS.primary, 
    borderRadius: 8, 
    alignItems: "center",
    minWidth: 100,
  },
  unblockButtonText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: COLORS.textPrimary 
  },
  inputContainer: { 
    flexDirection: "row", 
    alignItems: "flex-end", 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: COLORS.background,
    gap: 10,
  },
  textInputContainer: { 
    flex: 1, 
    backgroundColor: COLORS.surface, 
    borderRadius: 20, 
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 100,
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 40,
  },
  textInput: { 
    flex: 1,
    fontSize: 15, 
    color: COLORS.textPrimary, 
    minHeight: 24,
    maxHeight: 84,
    textAlignVertical: "center",
    fontWeight: "400",
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 20,
  },
  disappearingButton: {
    padding: 6,
    borderRadius: 10,
    marginLeft: 6,
    marginBottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: { 
    width: 40,
    height: 40,
    borderRadius: 20, 
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  confirmModalOverlay: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0, 0, 0, 0.8)" 
  },
  confirmModalContent: { 
    backgroundColor: COLORS.surface, 
    borderRadius: 20, 
    padding: 24, 
    width: "85%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  confirmModalText: { 
    fontSize: 14, 
    color: COLORS.textSecondary, 
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmModalButtons: { 
    flexDirection: "row", 
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmModalCancel: { 
    paddingVertical: 12, 
    paddingHorizontal: 20,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  confirmModalCancelText: { 
    fontSize: 16, 
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  confirmModalConfirm: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    backgroundColor: COLORS.primary, 
    borderRadius: 8,
  },
  confirmModalConfirmText: { 
    fontSize: 16, 
    color: COLORS.textPrimary, 
    fontWeight: "600",
  },
});

MessageInput.displayName = "MessageInput";