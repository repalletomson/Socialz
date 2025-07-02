import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  PanResponder,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { doc, deleteDoc, updateDoc, arrayUnion, serverTimestamp, arrayRemove } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { AES, enc } from "react-native-crypto-js";
import { useAuth } from "../context/authContext";

const DRAG_THRESHOLD = 80;

// Modern black theme colors
const COLORS = {
  background: "#000000",
  surface: "#111111",
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  accent: "#3B82F6",
  separator: "#27272A",
  primary: "#3B82F6",
  userBubble: "#3B82F6",
  otherBubble: "#1C1C1E",
  border: "#27272A",
  danger: "#EF4444",
  success: "#10B981",
};

// Consistent secret key
const SECRET_KEY = "kliq-secure-messaging-2024";

const MessageOptionsModal = ({ visible, onClose, onDelete, onEdit, onReply, onBlock, canEdit, isOwnMessage }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable 
        style={{ 
          flex: 1, 
          justifyContent: "center", 
          alignItems: "center", 
          backgroundColor: "rgba(0, 0, 0, 0.8)" 
        }} 
        onPress={onClose}
      >
        <Pressable 
          onPress={(e) => e.stopPropagation()} 
          style={{ 
            backgroundColor: COLORS.surface, 
            borderRadius: 16, 
            width: "85%", 
            maxWidth: 300, 
            overflow: "hidden",
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              onReply();
              onClose();
            }}
            style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              padding: 16, 
              borderBottomWidth: 1, 
              borderBottomColor: COLORS.separator 
            }}
          >
            <Ionicons name="arrow-undo" size={22} color={COLORS.accent} />
            <Text style={{ marginLeft: 12, fontSize: 16, color: COLORS.textPrimary, fontWeight: "500" }}>
              Reply
            </Text>
          </TouchableOpacity>

          {canEdit && (
            <TouchableOpacity 
              onPress={() => {
                onEdit();
                onClose();
              }} 
              style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                padding: 16, 
                borderBottomWidth: 1, 
                borderBottomColor: COLORS.separator 
              }}
            >
              <MaterialIcons name="edit" size={22} color={COLORS.textPrimary} />
              <Text style={{ marginLeft: 12, fontSize: 16, color: COLORS.textPrimary, fontWeight: "500" }}>
                Edit
              </Text>
            </TouchableOpacity>
          )}

          {!isOwnMessage && (
            <TouchableOpacity 
              onPress={() => {
                onBlock();
                onClose();
              }} 
              style={{ 
                flexDirection: "row", 
                alignItems: "center", 
                padding: 16, 
                borderBottomWidth: 1, 
                borderBottomColor: COLORS.separator 
              }}
            >
              <MaterialIcons name="block" size={22} color={COLORS.danger} />
              <Text style={{ marginLeft: 12, fontSize: 16, color: COLORS.danger, fontWeight: "500" }}>
                Block User
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={() => {
              onDelete();
              onClose();
            }} 
            style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              padding: 16 
            }}
          >
            <MaterialIcons name="delete" size={22} color={COLORS.danger} />
            <Text style={{ marginLeft: 12, fontSize: 16, color: COLORS.danger, fontWeight: "500" }}>
              Delete
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const EditMessageModal = ({ visible, onClose, onSave, initialText }) => {
  const [editedText, setEditedText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && initialText) {
      try {
        const decryptedText = AES.decrypt(initialText, SECRET_KEY).toString(enc.Utf8);
        setEditedText(decryptedText || "");
      } catch (error) {
        console.error("Decryption error in edit modal:", error);
        setEditedText("");
      }
    }
  }, [visible, initialText]);

  const handleSave = async () => {
    if (!editedText.trim()) return;
    setIsSaving(true);
    const encryptedEditedText = AES.encrypt(editedText.trim(), SECRET_KEY).toString();
    await onSave(encryptedEditedText);
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        backgroundColor: "rgba(0, 0, 0, 0.8)" 
      }}>
        <View style={{ 
          backgroundColor: COLORS.surface, 
          borderRadius: 20, 
          width: "90%", 
          maxWidth: 350, 
          overflow: "hidden",
          borderWidth: 1,
          borderColor: COLORS.border,
        }}>
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "space-between", 
            alignItems: "center", 
            padding: 20, 
            borderBottomWidth: 1, 
            borderBottomColor: COLORS.separator 
          }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "600", 
              color: COLORS.textPrimary 
            }}>
              Edit Message
            </Text>
            <TouchableOpacity onPress={onClose} disabled={isSaving}>
              <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <TextInput
              style={{ 
                borderWidth: 1, 
                borderColor: COLORS.border, 
                borderRadius: 12, 
                padding: 16, 
                minHeight: 100, 
                marginBottom: 20, 
                color: COLORS.textPrimary, 
                textAlignVertical: "top",
                backgroundColor: COLORS.background,
                fontSize: 16,
              }}
              multiline
              value={editedText}
              onChangeText={setEditedText}
              editable={!isSaving}
              placeholder="Edit your message..."
              placeholderTextColor={COLORS.textSecondary}
            />
            <TouchableOpacity
              onPress={handleSave}
              style={{ 
                padding: 16, 
                borderRadius: 12, 
                alignItems: "center", 
                backgroundColor: isSaving || !editedText.trim() ? COLORS.separator : COLORS.primary 
              }}
              disabled={isSaving || !editedText.trim()}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.textPrimary} />
              ) : (
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: "600", 
                  color: COLORS.textPrimary 
                }}>
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const MessageItem = React.memo(
  ({ item, onReply, recipientId, chatId, onBlock, disappearingMessages }) => {
    const { user } = useAuth();
    const [timeLeft, setTimeLeft] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const messageRef = useRef(null);

    const translateX = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const isOwnMessage = item.sender === user?.uid;

    const ANIMATION_CONFIG = {
      FADE_IN_DURATION: 300,
      SPRING: { friction: 8, tension: 40 },
    };

    useEffect(() => {
      Animated.timing(fadeAnim, { 
        toValue: 1, 
        duration: ANIMATION_CONFIG.FADE_IN_DURATION, 
        useNativeDriver: true 
      }).start();
    }, []);

    // Handle disappearing messages
    useEffect(() => {
      if (item.isDisappearing && item.expiresAt) {
        const interval = setInterval(() => {
          const now = new Date();
          const expires = new Date(item.expiresAt.seconds * 1000);
          const diff = expires - now;
          if (diff <= 0) {
            deleteDoc(doc(db, "chats", chatId, "messages", item.id)).catch((error) => 
              console.error("Error deleting expired message:", error)
            );
            clearInterval(interval);
          } else {
            setTimeLeft(Math.floor(diff / 1000 / 60));
          }
        }, 10000);
        return () => clearInterval(interval);
      }
    }, [item, chatId]);

    const handleDelete = async () => {
      try {
        if (!chatId) throw new Error("Chat ID is missing");
        const messageRef = doc(db, "chats", chatId, "messages", item.id);
        await deleteDoc(messageRef);
        setShowOptions(false);
      } catch (error) {
        console.error("Error deleting message:", error.message);
      }
    };

    const handleEdit = async (newText) => {
      try {
        if (!chatId) throw new Error("Chat ID is missing");
        if (!newText || newText.trim() === "") throw new Error("New text is empty");
        const messageRef = doc(db, "chats", chatId, "messages", item.id);
        await updateDoc(messageRef, { 
          text: newText, 
          edited: true, 
          editedAt: serverTimestamp() 
        });
        setShowEditModal(false);
        setShowOptions(false);
      } catch (error) {
        console.error("Error editing message:", error.message);
      }
    };

    const panResponder = useRef(
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => 
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2) && Math.abs(gestureState.dx) > 10,
        onPanResponderMove: (_, { dx }) => {
          if ((isOwnMessage && dx < 0) || (!isOwnMessage && dx > 0)) {
            translateX.setValue(dx * 0.7); // Smoother drag
          }
        },
        onPanResponderRelease: (_, { dx }) => {
          if (Math.abs(dx) > DRAG_THRESHOLD) {
            Animated.spring(translateX, { 
              toValue: 0, 
              ...ANIMATION_CONFIG.SPRING, 
              useNativeDriver: true 
            }).start(() => onReply(item));
          } else {
            Animated.spring(translateX, { 
              toValue: 0, 
              ...ANIMATION_CONFIG.SPRING, 
              useNativeDriver: true 
            }).start();
          }
        },
      })
    ).current;

    const formatTime = (timestamp) => {
      if (!timestamp) return "";
      const messageDate = new Date(timestamp.seconds * 1000);
      return messageDate.toLocaleTimeString([], { 
        hour: "numeric", 
        minute: "2-digit", 
        hour12: true 
      });
    };

    // Decrypt message text - FIXED
    let decryptedText = "";
    if (item.type === "text" && item.text) {
      try {
        decryptedText = AES.decrypt(item.text, SECRET_KEY).toString(enc.Utf8);
        if (!decryptedText) {
          decryptedText = "[Message could not be decrypted]";
        }
      } catch (error) {
        console.error("Decryption error:", error);
        decryptedText = "[Message could not be decrypted]";
      }
    }

    return (
      <>
        <Animated.View
          {...panResponder.panHandlers}
          style={{ 
            marginVertical: 4,
            alignSelf: isOwnMessage ? "flex-end" : "flex-start",
            maxWidth: "80%",
            minWidth: "20%", // Add minimum width
            transform: [{ translateX }],
            opacity: fadeAnim,
          }}
        >
          <View style={{
            flexDirection: isOwnMessage ? "row-reverse" : "row",
            alignItems: "flex-end",
            marginHorizontal: 16,
          }}>
            {/* Profile Image for other users */}
            {!isOwnMessage && (
              <Image
                source={{ 
                  uri: item.userAvatar || "https://assets.grok.com/users/8c354dfe-946c-4a32-b2de-5cb3a8ab9776/generated/h4epnwdFODX6hW0L/image.jpg"
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  marginRight: 8,
                  marginBottom: 2,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
              />
            )}

            <View style={{ 
              flex: 1,
              alignItems: isOwnMessage ? "flex-end" : "flex-start",
              maxWidth: isOwnMessage ? "85%" : "80%",
            }}>
              {/* Sender name for other users */}
              {!isOwnMessage && item.name && (
                <Text style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: COLORS.textSecondary,
                  marginBottom: 2,
                  marginLeft: 2,
                }}>
                  {item.name}
                </Text>
              )}

              <TouchableOpacity
                onLongPress={() => setShowOptions(true)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isOwnMessage ? COLORS.userBubble : COLORS.otherBubble,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderTopRightRadius: isOwnMessage ? 4 : 16,
                  borderTopLeftRadius: isOwnMessage ? 16 : 4,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1,
                  alignSelf: isOwnMessage ? "flex-end" : "flex-start",
                  maxWidth: "100%",
                }}
              >
                {/* Reply indicator */}
                {item.replyTo && (
                  <View style={{ 
                    borderLeftWidth: 2, 
                    borderLeftColor: isOwnMessage ? "rgba(255,255,255,0.4)" : COLORS.accent, 
                    paddingLeft: 8, 
                    marginBottom: 6,
                    backgroundColor: isOwnMessage ? "rgba(255,255,255,0.08)" : "rgba(59, 130, 246, 0.08)",
                    borderRadius: 6,
                    padding: 6,
                  }}>
                    <Text style={{ 
                      fontSize: 11, 
                      color: isOwnMessage ? "rgba(255,255,255,0.7)" : COLORS.textSecondary,
                      fontWeight: "500",
                    }}>
                      {item.replyTo.sender === user?.uid ? "You" : item.replyTo.name}
                    </Text>
                    <Text style={{ 
                      fontSize: 12, 
                      color: isOwnMessage ? "rgba(255,255,255,0.8)" : COLORS.textPrimary, 
                      marginTop: 1,
                    }} numberOfLines={1}>
                      {item.replyTo.type === "text" 
                        ? AES.decrypt(item.replyTo.text, SECRET_KEY).toString(enc.Utf8) 
                        : "Message"}
                    </Text>
                  </View>
                )}

                {/* Message content - FIXED TEXT DISPLAY */}
                <Text style={{ 
                  fontSize: 13, 
                  color: isOwnMessage ? "#FFFFFF" : COLORS.textPrimary, 
                  lineHeight: 18,
                  fontWeight: "400",
                  flexShrink: 1,
                }}>
                  {decryptedText}
                  {item.edited && (
                    <Text style={{ 
                      fontSize: 10, 
                      color: isOwnMessage ? "rgba(255,255,255,0.5)" : COLORS.textSecondary,
                      fontStyle: "italic",
                    }}>
                      {" (edited)"}
                    </Text>
                  )}
                </Text>
              </TouchableOpacity>

              {/* Timestamp and read status */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
                marginHorizontal: 4,
                justifyContent: isOwnMessage ? "flex-end" : "flex-start",
              }}>
                <Text style={{ 
                  fontSize: 10, 
                  color: COLORS.textSecondary,
                  fontWeight: "400",
                }}>
                  {timeLeft ? `${timeLeft}m left` : formatTime(item.timestamp)}
                </Text>
                
                {isOwnMessage && recipientId && (
                  <Ionicons
                    name={item.readBy?.[recipientId] ? "checkmark-done" : "checkmark"}
                    size={10}
                    color={item.readBy?.[recipientId] ? COLORS.accent : COLORS.textSecondary}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
              
            </View>
          </View>
        </Animated.View>

        <MessageOptionsModal
          visible={showOptions}
          onClose={() => setShowOptions(false)}
          onDelete={handleDelete}
          onEdit={() => setShowEditModal(true)}
          onReply={() => onReply(item)}
          onBlock={onBlock}
          canEdit={item.type === "text" && isOwnMessage}
          isOwnMessage={isOwnMessage}
        />

        <EditMessageModal 
          visible={showEditModal} 
          onClose={() => setShowEditModal(false)} 
          onSave={handleEdit} 
          initialText={item.text} 
        />
      </>
    );
  }
);