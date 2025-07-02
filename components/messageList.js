

import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// import { firestore } from './firebase'; // Import the Firebase Firestore instance

export const MessageBubble = ({ message, isCurrentUser, onDelete }) => {
  const [showDeleteIcon, setShowDeleteIcon] = useState(false);

  const handleLongPress = () => {
    setShowDeleteIcon(true);
  };

  const handleDelete = () => {
    console.log(message)
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(message) },
      ]
    );
    setShowDeleteIcon(false)
  };

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
    //   onPressOut={() => setShowDeleteIcon(false)} // Hide the delete icon when press is released
      activeOpacity={0.9}
    >
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        ]}
      >
        {showDeleteIcon && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteIcon}>
            <MaterialIcons name="delete" size={20} color="red" />
          </TouchableOpacity>
        )}
        <Text style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
          {message.text}
        </Text>
        <Text style={styles.messageTime}>
        {message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || message.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || Timestamp.fromDate(new Date()) || '12:00 PM'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const MessageList = ({ messages, currentUser, onDeleteMessage }) => {
  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id} // Ensure each item has a unique ID
      renderItem={({ item }) => (
        <MessageBubble
          message={item}
          isCurrentUser={item.userId === currentUser?.userId}
          onDelete={onDeleteMessage}
        />
      )}
      inverted={true} // Keeps messages flow starting from the bottom
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 16,
    maxWidth: '80%',
    position: 'relative',
  },
  currentUserMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4f83cc',
  },
  otherUserMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#eaeaea',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: '#fff',
  },
  otherUserText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
    color: '#666',
  },
  deleteIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 1,
  },
});

export default MessageList;
