import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  addDoc, 
  collection, 
  serverTimestamp, 
  updateDoc, 
  doc,
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';

export default function GroupInput({ chatId, onMessageSent }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = async () => {
    // Validate input and check sending state
    if (!message.trim() || sending) return;
    if (!chatId) {
      console.error('ChatId is required');
      return;
    }

    setSending(true);

    try {
      // Reference to the chat document
      const chatRef =doc(db, 'chats', chatId)
      
    //   const chatDoc = await getDoc(chatRef);

      // Prepare the message data
      const messageData = {
        text: message.trim(),
        type: 'text', 
        senderId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        reactions: [],
        isEdited: false
      };
    
      // Create messages collection reference
      const messagesCollectionRef = collection(chatRef, 'messages');

      // Add the message to the messages subcollection
      const messageRef = await addDoc(messagesCollectionRef, messageData);

      // Prepare chat document update data
      const updateData = {
        lastMessage: message.trim(),
        lastMessageTime: serverTimestamp(),
        lastMessageId: messageRef.id,
        lastSenderId: auth.currentUser.uid,
        updatedAt: serverTimestamp()
      };

      if (!chatDoc.exists()) {
        // If chat doesn't exist, create it with initial data
        await setDoc(chatRef, {
          ...updateData,
          createdAt: serverTimestamp(),
          participants: [auth.currentUser.uid],
          messageCount: 1,
          name: 'New Chat', // Add a default name
          type: 'group' // Specify chat type
        });
      } else {
        // Update existing chat document
        await updateDoc(chatRef, {
          ...updateData,
          messageCount: (chatDoc.data().messageCount || 0) + 1
        });
      }

      // Clear message and notify parent component
      setMessage('');
      if (onMessageSent) {
        onMessageSent();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Error',
        'Failed to send message. Please try again.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      className="border-t border-gray-200 bg-white"
    >
      <View className="flex-row items-center p-2">
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          multiline
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 max-h-24"
          disabled={sending}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={sending || !message.trim()}
          className={`p-2 rounded-full ${
            sending || !message.trim() ? 'opacity-50' : ''
          }`}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#701ac0" />
          ) : (
            <Ionicons name="send" size={24} color="#701ac0" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}