import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Fonts, TextStyles } from '../constants/Fonts';

const { width, height } = Dimensions.get('window');

const COLORS = {
  background: '#000000',
  text: '#FFFFFF',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  gradient1: '#FF6B6B',
  gradient2: '#4ECDC4',
  gradient3: '#45B7D1',
  gradient4: '#96CEB4',
  gradient5: '#FFEAA7',
};

const StreakCelebrationModal = ({ 
  visible, 
  onClose, 
  streakCount = 1, 
  previousStreak = 0,
  isFirstStreak = false 
}) => {
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const fireAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animations
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnimation, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(fireAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(confettiAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Rotate fire icon continuously
      Animated.loop(
        Animated.timing(rotateAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Reset animations
      scaleAnimation.setValue(0);
      rotateAnimation.setValue(0);
      fireAnimation.setValue(0);
      confettiAnimation.setValue(0);
    }
  }, [visible]);

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStreakMessage = () => {
    if (isFirstStreak) {
      return {
        title: "🎉 First Streak!",
        subtitle: "Welcome to your streak journey!",
        message: "You've started your first streak! Keep posting or commenting to maintain it.",
      };
    } else if (streakCount === 1) {
      return {
        title: "🔥 Streak Started!",
        subtitle: "You're back on track!",
        message: "Your streak has been restored! Keep the momentum going.",
      };
    } else if (streakCount <= 5) {
      return {
        title: "🚀 Streak Growing!",
        subtitle: `${streakCount} days strong!`,
        message: "You're building a great habit! Keep it up!",
      };
    } else if (streakCount <= 10) {
      return {
        title: "⭐ Amazing Streak!",
        subtitle: `${streakCount} days in a row!`,
        message: "You're on fire! This consistency is incredible!",
      };
    } else if (streakCount <= 30) {
      return {
        title: "💪 Streak Master!",
        subtitle: `${streakCount} days strong!`,
        message: "You're a true community champion! Keep inspiring others!",
      };
    } else {
      return {
        title: "👑 Streak Legend!",
        subtitle: `${streakCount} days unstoppable!`,
        message: "Absolutely legendary! You're an inspiration to the entire community!",
      };
    }
  };

  const getGradientColors = () => {
    if (streakCount <= 5) return [COLORS.gradient1, COLORS.gradient2];
    if (streakCount <= 10) return [COLORS.gradient2, COLORS.gradient3];
    if (streakCount <= 30) return [COLORS.gradient3, COLORS.gradient4];
    return [COLORS.gradient4, COLORS.gradient5];
  };

  const { title, subtitle, message } = getStreakMessage();

  // Confetti particles
  const renderConfetti = () => {
    return Array.from({ length: 12 }).map((_, index) => (
      <Animated.View
        key={index}
        style={[
          {
            position: 'absolute',
            width: 8,
            height: 8,
            backgroundColor: [
              COLORS.gradient1,
              COLORS.gradient2,
              COLORS.gradient3,
              COLORS.gradient4,
              COLORS.gradient5,
            ][index % 5],
            borderRadius: 4,
            left: Math.random() * width,
            top: Math.random() * height * 0.3,
          },
          {
            transform: [
              {
                translateY: confettiAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, height * 0.8],
                }),
              },
              {
                rotate: confettiAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
            opacity: confettiAnimation.interpolate({
              inputRange: [0, 0.8, 1],
              outputRange: [1, 1, 0],
            }),
          },
        ]}
      />
    ));
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Confetti */}
        {renderConfetti()}

        {/* Main Modal Content */}
        <Animated.View
          style={[
            {
              transform: [{ scale: scaleAnimation }],
            }
          ]}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={{
              borderRadius: 24,
              overflow: 'hidden',
              margin: 20,
              maxWidth: width * 0.9,
            }}
          >
            <LinearGradient
              colors={getGradientColors()}
              style={{
                padding: 32,
                alignItems: 'center',
              }}
            >
              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 1,
                }}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>

              {/* Fire Icon */}
              <Animated.View
                style={{
                  transform: [
                    { rotate: rotateInterpolate },
                    { 
                      scale: fireAnimation.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1.2, 1],
                      })
                    },
                  ],
                  marginBottom: 24,
                }}
              >
                <View style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                }}>
                  <MaterialCommunityIcons 
                    name="fire" 
                    size={60} 
                    color="white" 
                  />
                </View>
              </Animated.View>

              {/* Title */}
              <Text style={{
                fontSize: 28,
                fontFamily: Fonts.GeneralSans.Bold,
                color: 'white',
                textAlign: 'center',
                marginBottom: 8,
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}>
                {title}
              </Text>

              {/* Subtitle */}
              <Text style={{
                fontSize: 20,
                fontFamily: Fonts.GeneralSans.Semibold,
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                marginBottom: 16,
                textShadowColor: 'rgba(0, 0, 0, 0.2)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>
                {subtitle}
              </Text>

              {/* Streak Counter */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 25,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}>
                <MaterialCommunityIcons 
                  name="fire" 
                  size={24} 
                  color="white" 
                  style={{ marginRight: 8 }}
                />
                <Text style={{
                  fontSize: 24,
                  fontFamily: Fonts.GeneralSans.Bold,
                  color: 'white',
                  marginRight: 8,
                }}>
                  {streakCount}
                </Text>
                <Text style={{
                  fontSize: 16,
                  fontFamily: Fonts.GeneralSans.Semibold,
                  color: 'rgba(255, 255, 255, 0.8)',
                }}>
                  day{streakCount !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Message */}
              <Text style={{
                fontSize: 16,
                fontFamily: Fonts.GeneralSans.Medium,
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                lineHeight: 24,
                marginBottom: 32,
                paddingHorizontal: 8,
              }}>
                {message}
              </Text>

              {/* Action Button */}
              <TouchableOpacity
                onPress={onClose}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  borderRadius: 25,
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  minWidth: 160,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: 18,
                  fontFamily: Fonts.GeneralSans.Bold,
                  color: 'white',
                  textShadowColor: 'rgba(0, 0, 0, 0.2)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}>
                  Awesome! 🎉
                </Text>
              </TouchableOpacity>

              {/* Previous streak info (if applicable) */}
              {previousStreak > 0 && streakCount > previousStreak && (
                <Text style={{
                  fontSize: 14,
                  fontFamily: Fonts.GeneralSans.Medium,
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center',
                  marginTop: 16,
                }}>
                  Previous: {previousStreak} day{previousStreak !== 1 ? 's' : ''}
                </Text>
              )}
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default StreakCelebrationModal; 