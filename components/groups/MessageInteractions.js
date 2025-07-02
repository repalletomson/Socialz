// components/groups/MessageInteractions.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';

const REACTIONS = {
  LIKE: '👍',
  LOVE: '❤️',
  LAUGH: '😄',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠'
};

export const MessageInteractions = ({ message, chatId }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.text);
  const isOwnMessage = message.senderId === auth.currentUser.uid;

  const handleReaction = async (reaction) => {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
      const userReaction = {
        type: reaction,
        userId: auth.currentUser.uid,
        timestamp: new Date().toISOString()
      };

      // Check if user already made this reaction
      const existingReaction = message.reactions?.find(
        r => r.userId === auth.currentUser.uid && r.type === reaction
      );

      if (existingReaction) {
        await updateDoc(messageRef, {
          reactions: arrayRemove(existingReaction)
        });
      } else {
        // Remove any other reactions by the same user
        const userPreviousReactions = message.reactions?.filter(
          r => r.userId === auth.currentUser.uid
        ) || [];
        
        for (const prevReaction of userPreviousReactions) {
          await updateDoc(messageRef, {
            reactions: arrayRemove(prevReaction)
          });
        }

        await updateDoc(messageRef, {
          reactions: arrayUnion(userReaction)
        });
      }
      setShowReactions(false);
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const handleEdit = async () => {
    if (!editedText.trim() || editedText === message.text) {
      setIsEditing(false);
      return;
    }

    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
      await updateDoc(messageRef, {
        text: editedText.trim(),
        isEdited: true,
        editedAt: new Date().toISOString()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing message:', error);
      Alert.alert('Error', 'Failed to edit message');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'chats', chatId, 'messages', message.id));
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
  };

  return (
    <>
      {/* Message Options */}
      <View className="flex-row items-center mt-1">
        {/* Reaction Button */}
        <TouchableOpacity
          onPress={() => setShowReactions(true)}
          className="mr-2 p-1"
        >
          <Ionicons name="happy-outline" size={18} color="#666" />
        </TouchableOpacity>

        {/* Edit/Delete Options (only for own messages) */}
        {isOwnMessage && (
          <View className="flex-row">
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              className="mr-2 p-1"
            >
              <Ionicons name="pencil-outline" size={18} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              className="p-1"
            >
              <Ionicons name="trash-outline" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Display Reactions */}
      {message.reactions && message.reactions.length > 0 && (
        <View className="flex-row flex-wrap mt-1">
          {Object.entries(
            message.reactions.reduce((acc, reaction) => {
              if (!acc[reaction.type]) acc[reaction.type] = [];
              acc[reaction.type].push(reaction);
              return acc;
            }, {})
          ).map(([type, reactions]) => (
            <TouchableOpacity
              key={type}
              onPress={() => handleReaction(type)}
              className="bg-gray-100 rounded-full px-2 py-1 mr-1 mb-1 flex-row items-center"
            >
              <Text>{type}</Text>
              <Text className="ml-1 text-xs">{reactions.length}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Reaction Picker Modal */}
      <Modal
        visible={showReactions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactions(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          onPress={() => setShowReactions(false)}
        >
          <View className="bg-white rounded-t-2xl absolute bottom-0 w-full p-4">
            <View className="flex-row justify-around">
              {Object.entries(REACTIONS).map(([key, emoji]) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleReaction(emoji)}
                  className="p-2"
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Message Modal */}
      <Modal
        visible={isEditing}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditing(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white p-4 rounded-t-2xl">
            <Text className="text-lg font-semibold mb-4">Edit Message</Text>
            <TextInput
              className="bg-gray-100 rounded-lg p-3 mb-4"
              value={editedText}
              onChangeText={setEditedText}
              multiline
              maxLength={1000}
              autoFocus
            />
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setIsEditing(false)}
                className="px-4 py-2 mr-2"
              >
                <Text className="text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEdit}
                className="bg-purple-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};