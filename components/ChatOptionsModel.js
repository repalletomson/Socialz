import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Modal } from './Model';
import { BlockUserModal } from './BlockUserModal';
import { DisappearingMessagesModal } from './DisappearingMessagesModel';

export const ChatOptionsModal = ({ 
  visible, 
  onClose, 
  onBlockUser,
  onToggleDisappearingMessages,
  disappearingMessages,
  recipientName 
}) => {
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDisappearingModal, setShowDisappearingModal] = useState(false);

  const handleBlockConfirm = () => {
    onBlockUser();
    setShowBlockModal(false);
    onClose();
  };

  const handleDisappearingConfirm = () => {
    onToggleDisappearingMessages();
    setShowDisappearingModal(false);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        title="Chat Options"
      >
        <View>
          <TouchableOpacity 
            onPress={() => setShowDisappearingModal(true)}
            className="flex-row items-center p-4 border-b border-gray-100"
          >
            <MaterialIcons 
              name={disappearingMessages ? "timer-off" : "timer"} 
              size={24} 
              color="#8B5CF6" 
            />
            <Text className="ml-3 text-base text-gray-800">
              {disappearingMessages ? "Disable" : "Enable"} Disappearing Messages
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setShowBlockModal(true)}
            className="flex-row items-center p-4"
          >
            <MaterialIcons name="block" size={24} color="#EF4444" />
            <Text className="ml-3 text-base text-red-500">
              Block User
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <BlockUserModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlockConfirm}
        userName={recipientName}
      />

      <DisappearingMessagesModal
        visible={showDisappearingModal}
        onClose={() => setShowDisappearingModal(false)}
        onConfirm={handleDisappearingConfirm}
        isEnabled={disappearingMessages}
      />
    </>
  );
};