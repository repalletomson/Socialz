import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
//   ActivityIndicator
} from 'react-native';
import { collection, query, where, getDocs,getDoc,chatDoc, updateDoc, arrayUnion, doc,addDoc, arrayRemove, increment } from 'firebase/firestore';
import { db, auth } from '../../config/firebaseConfig';

const PREDEFINED_GROUPS = [
  { id: 'placements', name: 'Placements', icon: '💼', description: 'Discuss placement opportunities and preparations' },
  { id: 'exams', name: 'Exams', icon: '📚', description: 'Share exam tips and study materials' },
  { id: 'fun', name: 'Fun & Frustration', icon: '😄', description: 'A place to share college life moments' },
  { id: 'clubs', name: 'Clubs', icon: '🎭', description: 'Updates from various college clubs' },
  { id: 'events', name: 'Events', icon: '🎉', description: 'Stay updated with college events' }
];

export const GroupModal = ({ visible, onClose, onJoinGroup }) => {
  const [loading, setLoading] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState([]);

  useEffect(() => {
    if (visible) {
      loadJoinedGroups();
    }
  }, [visible]);

  const loadJoinedGroups = async () => {
    try {
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('type', '==', 'group'),
        where('participants', 'array-contains', auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);
      setJoinedGroups(snapshot.docs.map(doc => doc.id));
    } catch (error) {
      console.error('Error loading joined groups:', error);
    }
  };

  const handleJoinGroup = async (group) => {
    if (joinedGroups.includes(group.id)) {
      Alert.alert('Already Joined', 'You are already a member of this group');
      return;
    }

    setLoading(true);
    try {
      const groupRef = doc(db, 'chats', group.id);
      const groupDoc = await getDoc(groupRef);

      if (!groupDoc.exists()) {
        // Create new group if it doesn't exist
        await addDoc(collection(db, 'chats'), {
          id: group.id,
          type: 'group',
          groupName: group.name,
          groupIcon: group.icon,
          description: group.description,
          participants: [auth.currentUser.uid],
          createdAt: new Date(),
          lastMessageTime: new Date(),
          memberCount: 1
        });
      } else {
        // Join existing group
        await updateDoc(groupRef, {
          participants: arrayUnion(auth.currentUser.uid),
          memberCount: increment(1)
        });
      }
     
      onJoinGroup(group.id, group);
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text className="text-xl font-bold">Join Groups</Text>
          <TouchableOpacity onPress={onClose}>
            <Text className="text-purple-600">Close</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={PREDEFINED_GROUPS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row items-center">
                <Text className="text-3xl mr-3">{item.icon}</Text>
                <View className="flex-1">
                  <Text className="text-lg font-semibold">{item.name}</Text>
                  <Text className="text-gray-600">{item.description}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleJoinGroup(item)}
                  disabled={loading}
                  className={`px-4 py-2 rounded-full ${
                    joinedGroups.includes(item.id)
                      ? 'bg-gray-100'
                      : 'bg-purple-600'
                  }`}
                >
                  <Text
                    className={joinedGroups.includes(item.id)
                      ? 'text-gray-600'
                      : 'text-white'
                    }
                  >
                    {joinedGroups.includes(item.id) ? 'Joined' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </Modal>
  );
};
