import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

export const ReactionPicker = React.memo(({ onSelect, onClose }) => {
  return (
    <View className="absolute bottom-full mb-2 bg-white rounded-full shadow-lg flex-row p-2">
      {REACTIONS.map((reaction) => (
        <TouchableOpacity
          key={reaction}
          onPress={() => onSelect(reaction)}
          className="px-2 py-1"
        >
          <Text className="text-xl">{reaction}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});