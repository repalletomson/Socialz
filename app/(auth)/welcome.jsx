import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform, Dimensions, FlatList, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Fonts, TextStyles } from '../../constants/Fonts';

const onboardingData = [
  {
    id: 1,
    title: 'Welcome to',
    subtitle: 'SocialZ.',
    description: 'An Exclusive app made for Genz\'s',
    backgroundType: 'gradient1',
  },
  {
    id: 2,
    title: 'Meet new people from different colleges...',
    subtitle: '',
    description: '',
    backgroundType: 'gradient2',
  },
  {
    id: 3,
    title: 'make college fun,like never before',
    subtitle: '',
    description: '',
    backgroundType: 'gradient3',
  },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleGetStarted = () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    router.push('/(auth)/signin');
    
    // Reset loading after navigation
    setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
      }
    }, 1000);
  };

  const getBackgroundGradient = (backgroundType) => {
    switch (backgroundType) {
      case 'gradient1':
        return {
          colors: ['#000000', '#1a0029', '#2d004d'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
        };
      case 'gradient2':
        return {
          colors: ['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
        };
      case 'gradient3':
        return {
          colors: ['#1a0029', '#2d004d', '#4a1a5a', '#6a2c7c'],
          start: { x: 0, y: 0 },
          end: { x: 0, y: 1 },
        };
      default:
        return {
          colors: ['#000000', '#1a0029', '#2d004d'],
          start: { x: 0, y: 0 },
          end: { x: 1, y: 1 },
        };
    }
  };

  const renderItem = ({ item, index }) => {
    const gradient = getBackgroundGradient(item.backgroundType);
    
    return (
      <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
        <LinearGradient
          colors={gradient.colors}
          start={gradient.start}
          end={gradient.end}
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            paddingHorizontal: 32,
            paddingBottom: 100,
          }}
        >
          {/* Purple decorative shapes */}
          {item.backgroundType === 'gradient1' && (
            <>
              <View style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: 'rgba(139, 92, 246, 0.3)',
                transform: [{ translateX: 50 }, { translateY: -50 }],
              }} />
              <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 150,
                height: 150,
                borderRadius: 75,
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                transform: [{ translateX: -30 }, { translateY: 30 }],
              }} />
            </>
          )}

          {item.backgroundType === 'gradient2' && (
            <>
              {/* Elegant flowing shapes */}
              <View style={{
                position: 'absolute',
                top: 120,
                left: -30,
                width: 300,
                height: 180,
                borderRadius: 90,
                backgroundColor: 'rgba(139, 92, 246, 0.15)',
                transform: [{ rotate: '25deg' }],
              }} />
              <View style={{
                position: 'absolute',
                top: 300,
                right: -50,
                width: 250,
                height: 150,
                borderRadius: 75,
                backgroundColor: 'rgba(99, 102, 241, 0.12)',
                transform: [{ rotate: '-20deg' }],
              }} />
              <View style={{
                position: 'absolute',
                bottom: 150,
                left: 20,
                width: 180,
                height: 180,
                borderRadius: 90,
                backgroundColor: 'rgba(168, 85, 247, 0.08)',
              }} />
            </>
          )}

          {/* Content Container */}
          {item.id === 1 && (
            <View style={{ marginBottom: 120 }}>
              <Text style={{
                fontSize: 56,
                fontFamily: Fonts.GeneralSans.Bold,
                color: '#8B5CF6',
                textAlign: 'left',
                lineHeight: 64,
                marginBottom: 8,
              }}>
                {item.title}
              </Text>
              
              <Text style={{
                fontSize: 72,
                fontFamily: Fonts.GeneralSans.Bold,
                color: '#FFFFFF',
                textAlign: 'left',
                lineHeight: 76,
                marginBottom: 24,
              }}>
                {item.subtitle}
              </Text>
              
              <Text style={{
                fontSize: 18,
                fontFamily: Fonts.GeneralSans.Regular,
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'left',
                lineHeight: 24,
                marginTop: 16,
              }}>
                {item.description}
              </Text>
            </View>
          )}

          {item.id === 2 && (
            <View style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 40,
            }}>
              <Text style={{
                fontSize: 52,
                fontFamily: Fonts.GeneralSans.Bold,
                color: '#FFFFFF',
                textAlign: 'center',
                lineHeight: 58,
                letterSpacing: -0.5,
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}>
                {item.title}
              </Text>
            </View>
          )}

          {item.id === 3 && (
            <View style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'flex-start',
              paddingHorizontal: 32,
            }}>
              <Text style={{
                fontSize: 64,
                fontFamily: Fonts.GeneralSans.Bold,
                color: '#8B5CF6',
                textAlign: 'left',
                lineHeight: 68,
                textShadowColor: 'rgba(0, 0, 0, 0.3)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 4,
              }}>
                {item.title}
              </Text>
            </View>
          )}

          {/* Next/Get Started Button - Fixed position at bottom right */}
          <View style={{ 
            position: 'absolute',
            bottom: 60,
            right: 32,
            alignItems: 'flex-end',
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#8B5CF6',
                borderRadius: 30,
                paddingHorizontal: 32,
                paddingVertical: 16,
                minWidth: 120,
                alignItems: 'center',
                shadowColor: '#8B5CF6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={() => {
                if (index < onboardingData.length - 1) {
                  flatListRef.current?.scrollToIndex({ index: index + 1, animated: true });
                } else {
                  handleGetStarted();
                }
              }}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontFamily: Fonts.GeneralSans.Bold,
                  letterSpacing: 0.5,
                }}>
                  {index === onboardingData.length - 1 ? 'Get Started' : 'Next'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderPagination = () => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      bottom: 20,
      left: 0,
      right: 0,
    }}>
      {onboardingData.map((_, idx) => (
        <View
          key={idx}
          style={{
            width: idx === currentIndex ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: idx === currentIndex ? '#8B5CF6' : 'rgba(255, 255, 255, 0.3)',
            marginHorizontal: 4,
          }}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          if (mountedRef.current) {
            setCurrentIndex(idx);
          }
        }}
        getItemLayout={(_, index) => ({ 
          length: SCREEN_WIDTH, 
          offset: SCREEN_WIDTH * index, 
          index 
        })}
      />
      {renderPagination()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Remove old styles if not needed
});