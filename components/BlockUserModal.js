import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Modal } from './Model';

export const BlockUserModal = ({ visible, onClose, onConfirm, userName }) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Block User"
    >
      
      <View className="p-4">
        <Text className="text-base text-gray-700 mb-6">
          Are you sure you want to block {userName}? You won't receive their messages anymore.
        </Text>

        <View className="flex-row justify-end space-x-4">
          <TouchableOpacity 
            onPress={onClose}
            className="px-6 py-3 rounded-xl bg-gray-100"
          >
            <Text className="text-gray-700 font-medium">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={onConfirm}
            className="px-6 py-3 rounded-xl bg-red-500"
          >
            <Text className="text-white font-medium">Block</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

