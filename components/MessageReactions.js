import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export const MessageReactions = React.memo(({ reactions, onReactionPress }) => {
  // Group reactions by type
  const groupedReactions = reactions.reduce((acc, reaction) => {
    acc[reaction.type] = (acc[reaction.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <View className="flex-row flex-wrap mt-1">
      {Object.entries(groupedReactions).map(([type, count]) => (
        <TouchableOpacity
          key={type}
          onPress={() => onReactionPress(type)}
          className="bg-white rounded-full px-2 py-1 mr-1 mb-1 flex-row items-center"
        >
          <Text>{type}</Text>
          {count > 1 && (
            <Text className="ml-1 text-xs text-gray-500">{count}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
});
