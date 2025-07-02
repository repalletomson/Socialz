import React from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { PREDEFINED_GROUPS } from '../constants/groups';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';

export const GroupModal = ({ visible, onClose, onJoinGroup }) => {
  const [joiningGroup, setJoiningGroup] = useState(null);

  const handleJoinGroup = async (group) => {
    try {
      setJoiningGroup(group.id);
      
      // Check if user is already in group
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('type', '==', CHAT_TYPES.GROUP),
        where('groupId', '==', group.id),
        where('participants', 'array-contains', auth.currentUser.uid)
      );
      
      const existingChat = await getDocs(q);
      
      if (!existingChat.empty) {
        Alert.alert('Already Joined', 'You are already a member of this group');
        return;
      }

      // Create new group chat
      const newGroupChat = await addDoc(chatsRef, {
        type: CHAT_TYPES.GROUP,
        groupId: group.id,
        groupName: group.name,
        groupIcon: group.icon,
        participants: [auth.currentUser.uid],
        createdAt: new Date(),
        lastMessageTime: new Date(),
        lastMessage: null,
        memberCount: 1
      });

      onJoinGroup(newGroupChat.id, group);
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group');
    } finally {
      setJoiningGroup(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-white pt-12">
        <View className="px-4 flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold">Join Groups</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={PREDEFINED_GROUPS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              className="p-4 active:bg-gray-50"
              onPress={() => handleJoinGroup(item)}
              disabled={joiningGroup === item.id}
            >
              <View className="flex-row items-center">
                <Text className="text-3xl mr-4">{item.icon}</Text>
                <View className="flex-1">
                  <Text className="text-lg font-medium">{item.name}</Text>
                  <Text className="text-sm text-gray-500">{item.description}</Text>
                </View>
                {joiningGroup === item.id ? (
                  <ActivityIndicator color="#701ac0" />
                ) : (
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                )}
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-100" />}
        />
      </View>
    </Modal>
  );
};