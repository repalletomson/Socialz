import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Fonts, TextStyles } from '../constants/Fonts';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = height * 0.16; // Responsive height (16% of screen height)
const CARD_SPACING = 20;

const COLORS = {
  background: '#000000',
  cardBg: '#111111',
  text: '#FFFFFF',
  textSecondary: '#E5E5E5',
  textMuted: '#A1A1AA',
  accent: '#8B5CF6',
  // New smoky color palette
  charcoalGray: '#2E2E2E',
  smokyGray: '#555555',
  coolMist: '#B0BEC5',
  slateGray: '#708090',
  darkFog: '#1C1C1C',
  frostedGlass: '#D9D9D9',
  blurBlue: '#A3BFD9',
};

const motivationalCards = [
  {
    id: 1,
    title: "Wanna post anything about your college life?",
    subtitle: "share your story @Socialz.",
    icon: "school-outline",
    gradient: ['#1C1C1C', '#2E2E2E', '#555555'], // Dark Fog → Charcoal Gray → Smoky Gray
    action: "/(root)/createpost",
    buttonText: "Post Now",
  },
  {
    id: 2,
    title: "Chat with friends and Connect ",
    subtitle: "Find people from different colleges",
    icon: "chatbubbles-outline",
    gradient: ['#2E2E2E', '#708090', '#A3BFD9'], // Charcoal Gray → Slate Gray → Blur Blue
    action: "/(root)/(tabs)/chat",
    buttonText: "Chat Now",
  },
  {
    id: 3,
    title: "Post daily to earn streaks",
    subtitle: "Get into Spotlight",
    icon: "flame-outline",
    gradient: ['#555555', '#708090', '#B0BEC5'], // Smoky Gray → Slate Gray → Cool Mist
    action: "/(root)/streak",
    buttonText: "Top streakers @Socialz.",
  },
  {
    id: 4,
    title: "Join Spaces that interests you",
    subtitle: " From college fests,movies to career tips ",
    icon: "planet-outline",
    gradient: ['#1C1C1C', '#555555', '#A3BFD9'], // Dark Fog → Smoky Gray → Blur Blue
    action: "/(root)/(tabs)/groups",
    buttonText: "Explore Now",
  },
];

const MotivationalCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % motivationalCards.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (CARD_WIDTH + CARD_SPACING),
          animated: true,
        });
        return nextIndex;
      });
    }, 4000); // Change card every 4 seconds

    return () => clearInterval(interval);
  }, [fadeAnim]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_SPACING));
    setCurrentIndex(index);
  };

  const handleCardPress = (action) => {
    if (action) {
      router.push(action);
    }
  };

  const renderCard = (card, index) => (
    <TouchableOpacity
      key={card.id}
      activeOpacity={0.9}
      onPress={() => handleCardPress(card.action)}
      style={{
        width: CARD_WIDTH,
        marginRight: index < motivationalCards.length - 1 ? CARD_SPACING : 0,
      }}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <LinearGradient
          colors={card.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 18,
            height: CARD_HEIGHT,
            minHeight: 120, // Minimum height fallback
            maxHeight: 140, // Maximum height limit
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
            borderWidth: 1,
            borderColor: 'rgba(217, 217, 217, 0.1)', // Frosted Glass border
          }}
        >
          {/* Left Content */}
          <View style={{ flex: 1, justifyContent: 'space-between', height: '100%' }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: width > 380 ? 18 : 16, // Responsive font size
                fontFamily: Fonts.GeneralSans.Bold,
                color: '#FFFFFF',
                lineHeight: width > 380 ? 22 : 20,
                marginBottom: 4,
                textShadowColor: 'rgba(0, 0, 0, 0.5)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}>
                {card.title}
              </Text>
              
              <Text style={{
                fontSize: width > 380 ? 13 : 12, // Responsive font size
                fontFamily: Fonts.GeneralSans.Medium,
                color: COLORS.coolMist, // Using Cool Mist for subtitle
                lineHeight: width > 380 ? 16 : 15,
                opacity: 0.9,
              }}>
                {card.subtitle}
              </Text>
            </View>

            {/* Bottom Right Action Button */}
            <View style={{
              alignSelf: 'flex-end',
              marginTop: 8,
            }}>
              <View style={{
                backgroundColor: `${COLORS.frostedGlass}E6`, // Frosted Glass with opacity
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                alignItems: 'center',
                shadowColor: COLORS.blurBlue,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 4,
                borderWidth: 1,
                borderColor: 'rgba(176, 190, 197, 0.3)', // Cool Mist border
              }}>
                <Text style={{
                  fontSize: 12,
                  fontFamily: Fonts.GeneralSans.Bold,
                  color: COLORS.darkFog, // Dark text for contrast
                }}>
                  {card.buttonText}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );

  return (
    <View style={{
      marginVertical: 12,
    }}>
      {/* Carousel */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
        contentContainerStyle={{
          paddingHorizontal: 20,
        }}
        onMomentumScrollEnd={handleScroll}
      >
        {motivationalCards.map((card, index) => renderCard(card, index))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
      }}>
        {motivationalCards.map((_, index) => (
          <View
            key={index}
            style={{
              width: currentIndex === index ? 16 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: currentIndex === index ? COLORS.blurBlue : COLORS.slateGray,
              marginHorizontal: 3,
              opacity: currentIndex === index ? 1 : 0.6,
            }}
          />
        ))}
      </View>

      {/* Refresh Hint */}
      <View style={{
        alignItems: 'center',
        marginTop: 6,
      }}>
        <Text style={{
          fontSize: 10,
          color: COLORS.slateGray,
          fontFamily: Fonts.GeneralSans.Medium,
        }}>
          Swipe or wait for auto-refresh
        </Text>
      </View>
    </View>
  );
};

export default MotivationalCarousel; 