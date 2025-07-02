import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

export const ImageOptionsModal = React.memo(({ visible, onClose, onGallerySelect, onCameraSelect }) => {
  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onClose} 
        className="flex-1 bg-black/50"
      >
        <View className="mt-auto bg-white rounded-t-3xl">
          <View className="p-6">
            <TouchableOpacity 
              onPress={onGallerySelect}
              className="p-4 bg-purple-50 rounded-xl mb-4"
            >
              <Text className="text-purple-600 text-center font-medium">
                Choose from Gallery
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onCameraSelect}
              className="p-4 bg-purple-50 rounded-xl"
            >
              <Text className="text-purple-600 text-center font-medium">
                Take Photo
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onClose} 
              className="p-4 mt-4 bg-gray-100 rounded-xl"
            >
              <Text className="text-gray-800 text-center font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});