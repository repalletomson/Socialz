import React from 'react';
import { View, TouchableOpacity, Text, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';


export const ImageOptionsModal = ({
  visible,
  onClose,
  onGallerySelect,
  onCameraSelect,
  onViewOnceSelect,
  disappearingMessages
}) => {
  // Handler to prevent modal from closing when clicking inside content
  const handleContentPress = (e) => {
    e.stopPropagation();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Semi-transparent overlay that closes modal when tapped */}
      <Pressable 
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        {/* Modal content container */}
        <Pressable 
          onPress={handleContentPress}
          className="bg-white rounded-t-3xl"
        >
          <View className="p-6">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-semibold text-gray-800">
                Share Photo
              </Text>
              <TouchableOpacity 
                onPress={onClose}
                className="p-2"
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            {/* Option buttons */}
            <View className="space-y-4">
              {/* Gallery option */}
              <TouchableOpacity
                onPress={onGallerySelect}
                className="flex-row items-center p-4 bg-gray-50 rounded-xl active:bg-gray-100"
              >
                <MaterialIcons name="photo-library" size={24} color="#8B5CF6" />
                <View className="ml-3">
                  <Text className="text-base font-medium text-gray-800">
                    {disappearingMessages ? 'Send Disappearing Photo' : 'Choose from Gallery'}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Select a photo from your device
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Camera option */}
              <TouchableOpacity
                onPress={onCameraSelect}
                className="flex-row items-center p-4 bg-gray-50 rounded-xl active:bg-gray-100"
              >
                <MaterialIcons name="camera-alt" size={24} color="#8B5CF6" />
                <View className="ml-3">
                  <Text className="text-base font-medium text-gray-800">
                    Take Photo
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Capture a new photo now
                  </Text>
                </View>
              </TouchableOpacity>

              {/* View once option */}
              <TouchableOpacity
                onPress={onViewOnceSelect}
                className="flex-row items-center p-4 bg-gray-50 rounded-xl active:bg-gray-100"
              >
                <MaterialIcons name="remove-red-eye" size={24} color="#8B5CF6" />
                <View className="ml-3">
                  <Text className="text-base font-medium text-gray-800">
                    View Once Photo
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Photo will disappear after viewing
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Cancel button */}
            <TouchableOpacity
              onPress={onClose}
              className="mt-6 p-4 bg-gray-100 rounded-xl active:bg-gray-200"
            >
              <Text className="text-center text-base font-medium text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};