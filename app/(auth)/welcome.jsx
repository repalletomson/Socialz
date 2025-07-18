import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Platform, 
  Dimensions, 
  SafeAreaView,
  Animated,
  StatusBar
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Fonts, TextStyles } from '../../constants/Fonts';

const onboardingData = [
  {
    id: 1,
    title: 'Welcome to',
    subtitle: 'SocialZ.',
    description: 'An Exclusive app made for GenZ college students',
    backgroundType: 'gradient1',
    accentColor: '#A259FF',
  }, 
  {
    id: 2,
    title: 'Meet new people from different colleges',
    backgroundType: 'gradient1',
    accentColor: '#A259FF',
  },
  {
    id: 3,
    title: 'Make college fun, like',
    titleHighlight: 'never before',
    description: 'Create memories that will last a lifetime',
    backgroundType: 'gradient1',
    accentColor: '#A259FF',
  },
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeScreen() {
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    StatusBar.setBarStyle('light-content', true);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleGetStarted = () => {
    router.replace('/(auth)/auth');
  };

  const nextSlide = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      
      // Animate slide transition
      Animated.parallel([
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(nextIndex);
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    } else {
      handleGetStarted();
    }
  };

  const getBackgroundGradient = (backgroundType) => {
    // Use the same gradient for all screens
    return {
      colors: ['#0F0F23', '#1A0A2E', '#2D1B69', '#4A1A5A'],
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    };
  };

  const renderCurrentSlide = () => {
    const item = onboardingData[currentIndex];
    const gradient = getBackgroundGradient(item.backgroundType);
    
    return (
      <LinearGradient
        colors={gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={styles.gradientContainer}
      >
        {/* Enhanced Decorative Elements - Same for all screens */}
        <View style={styles.decorativeContainer}>
          <View style={[styles.decorativeCircle, {
            top: -50,
            right: -50,
            width: 300,
            height: 300,
            backgroundColor: 'rgba(162, 89, 255, 0.15)',
          }]} />
          <View style={[styles.decorativeCircle, {
            bottom: -30,
            left: -40,
            width: 200,
            height: 200,
            backgroundColor: 'rgba(162, 89, 255, 0.1)',
          }]} />
          <View style={[styles.decorativeCircle, {
            top: 200,
            left: -60,
            width: 150,
            height: 150,
            backgroundColor: 'rgba(162, 89, 255, 0.08)',
          }]} />
        </View>

        {/* Skip Button - Top Right */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleGetStarted}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Main Content Container */}
        <View style={styles.mainContentContainer}>
          {currentIndex === 0 && (
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>
                {item.title}
              </Text>
              <View style={styles.brandContainer}>
                <Text style={styles.brandName}>Social</Text>
                <View style={styles.dotContainer}>
                  <Text style={styles.brandNameDot}>z.</Text>
                </View>
              </View>
              <Text style={styles.welcomeDescription}>
                {item.description}
              </Text>
            </View>
          )}

          {currentIndex === 1 && (
            <View style={styles.centerContent}>
              <Text style={styles.screen2Title}>
                {item.title}
              </Text>
            </View>
          )}

          {currentIndex === 2 && (
            <View style={styles.finalContent}>
              <Text style={styles.finalTitle}>
                {item.title}
              </Text>
              <Text style={styles.finalTitleHighlight}>
                {item.titleHighlight}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Pagination */}
          <View style={styles.paginationContainer}>
            {onboardingData.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.paginationDot,
                  {
                    width: idx === currentIndex ? 32 : 8,
                    backgroundColor: idx === currentIndex ? item.accentColor : 'rgba(255, 255, 255, 0.3)',
                  }
                ]}
              />
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: item.accentColor }]}
            onPress={nextSlide}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>
                {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnimation,
            transform: [{ scale: scaleAnimation }]
          }
        ]}
      >
        {renderCurrentSlide()}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  animatedContainer: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    position: 'relative',
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 1000,
  },
  decorativeEllipse: {
    position: 'absolute',
    borderRadius: 1000,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 32,
    zIndex: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    fontSize: 16,
    fontFamily: Fonts.GeneralSans.Medium,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0, // Removed margin to reduce spacing
  },
  brandName: {
    fontSize: 72,
    fontFamily: Fonts.GeneralSans.Bold,
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 72,
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dotContainer: {
    // marginLeft: 8,
    marginTop: 0, // Removed negative margin
  },
  brandNameDot: {
    fontSize: 72,
    fontFamily: Fonts.GeneralSans.Bold,
    color: '#A259FF',
    textAlign: 'left',
    lineHeight: 72,
    letterSpacing: -2,
    textShadowColor: 'rgba(162, 89, 255, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  welcomeTitle: {
    fontSize: 46,
    fontFamily: Fonts.GeneralSans.Bold,
    textAlign: 'left',
    lineHeight: 52,
    marginBottom: 4, // Reduced spacing
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  welcomeDescription: {
    fontSize: 17,
    fontFamily: Fonts.GeneralSans.Regular,
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 26,
    letterSpacing: 0.3,
    marginTop: 8, // Small margin to separate from logo
  },
  centerContent: {
    alignItems: 'center',
  },
  centerTitle: {
    fontSize: 42,
    fontFamily: Fonts.GeneralSans.Bold,
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: 8,
    letterSpacing: -1,
    color: '#FFFFFF',
  },
  centerSubtitle: {
    fontSize: 24,
    fontFamily: Fonts.GeneralSans.Medium,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 18,
    letterSpacing: 0.5,
    color: '#A259FF',
  },
  centerDescription: {
    fontSize: 16,
    fontFamily: Fonts.GeneralSans.Regular,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
    letterSpacing: 0.3,
    marginTop: 18,
  },
  screen2Title: {
    fontSize: 48,
    fontFamily: Fonts.GeneralSans.Bold,
    textAlign: 'center',
    lineHeight: 56,
    letterSpacing: -1,
    color: '#FFFFFF',
    paddingHorizontal: 20,
    maxWidth: 350,
  },
  finalContent: {
    alignItems: 'flex-start',
  },
  finalTitle: {
    fontSize: 64,
    fontFamily: Fonts.GeneralSans.Bold,
    textAlign: 'left',
    lineHeight: 72,
    letterSpacing: -2,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  finalTitleHighlight: {
    fontSize: 64,
    fontFamily: Fonts.GeneralSans.Bold,
    textAlign: 'left',
    lineHeight: 72,
    letterSpacing: -2,
    color: '#A259FF',
    textShadowColor: 'rgba(162, 89, 255, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  mainContentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 180,
    zIndex: 5,
  },
  welcomeContent: {
    alignItems: 'flex-start',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    paddingBottom: 40,
    zIndex: 10,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionButton: {
    borderRadius: 50,
    paddingHorizontal: 40,
    paddingVertical: 18,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: Fonts.GeneralSans.Bold,
    letterSpacing: 0.5,
  },
});