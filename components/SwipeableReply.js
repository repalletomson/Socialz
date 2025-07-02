import React from 'react';
import { PanResponder, Animated } from 'react-native';

export const SwipeableReply = React.memo(({ children, onReply }) => {
  const pan = React.useRef(new Animated.ValueXY()).current;
  const swipeThreshold = 50;

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderMove: (_, { dx }) => {
        pan.x.setValue(Math.min(Math.max(dx, -100), 0));
      },
      onPanResponderRelease: (_, { dx }) => {
        if (Math.abs(dx) > swipeThreshold) {
          onReply();
        }
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: [{ translateX: pan.x }],
      }}
    >
      {children}
    </Animated.View>
  );
});
