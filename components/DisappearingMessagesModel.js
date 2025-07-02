// components/DisappearingMessagesModal.js
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Modal } from './Model';

export const DisappearingMessagesModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  isEnabled 
}) => {
  const title = isEnabled ? 'Disable Disappearing Messages' : 'Enable Disappearing Messages';
  const message = isEnabled
    ? 'Disable disappearing messages? New messages will remain in the chat.'
    : 'When enabled, new messages will disappear after 24 hours.';

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
    >
      <View className="p-4">
        <Text className="text-base text-gray-700 mb-6">
          {message}
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
            className="px-6 py-3 rounded-xl bg-purple-500"
          >
            <Text className="text-white font-medium">
              {isEnabled ? 'Disable' : 'Enable'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};