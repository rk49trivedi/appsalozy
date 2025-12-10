import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: number;
  title: string;
  desc: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

interface OnboardingScreenProps {
  onFinish: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  
  // Calculate slide width - full screen width since card has its own padding
  const slideWidth = SCREEN_WIDTH;

  const slides: Slide[] = [
    {
      id: 1,
      title: 'Manage Appointments Effortlessly',
      desc: 'Streamline your booking process. Reduce no-shows with automated reminders and smart scheduling.',
      icon: 'event',
    },
    {
      id: 2,
      title: 'Track Revenue Growth',
      desc: 'Monitor your daily earnings and growth with detailed analytics and performance reports.',
      icon: 'trending-up',
    },
    {
      id: 3,
      title: 'Client Management',
      desc: 'Keep detailed records of client preferences, history, and retention statistics in one place.',
      icon: 'people',
    },
  ];

  useEffect(() => {
    // Initialize animation
    fadeAnim.setValue(1);
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      scrollViewRef.current?.scrollTo({
        x: nextSlide * slideWidth,
        animated: true,
      });
    } else {
      onFinish();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(offsetX / slideWidth);
    
    if (slideIndex !== currentSlide && slideIndex >= 0 && slideIndex < slides.length) {
      // Animate fade in when slide changes
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCurrentSlide(slideIndex);
    }
  };

  const handleSkip = () => {
    onFinish();
  };

  return (
    <View style={styles.container}>
      {/* Background Image (Salon Interior) */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop' }}
          style={styles.backgroundImage}
          contentFit="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Top Badge */}
      <View style={[styles.badgeContainer, { top: insets.top + 56 }]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SALOZY</Text>
        </View>
      </View>

      {/* White Bottom Card */}
      <View style={styles.cardContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
          decelerationRate="fast"
          snapToInterval={slideWidth}
          snapToAlignment="start"
        >
          {slides.map((slide, index) => (
            <View key={slide.id} style={[styles.slide, { width: slideWidth }]}>
              {/* Icon Container */}
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    opacity: index === currentSlide ? fadeAnim : 0.6,
                  },
                ]}
              >
                <MaterialIcons name={slide.icon} size={32} color="#d5821d" />
              </Animated.View>

              {/* Text Content */}
              <Animated.View
                style={[
                  styles.textContainer,
                  {
                    opacity: index === currentSlide ? fadeAnim : 0.6,
                  },
                ]}
              >
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.desc}>{slide.desc}</Text>
              </Animated.View>
            </View>
          ))}
        </ScrollView>

        {/* Bottom Controls Row */}
        <View style={styles.controlsContainer}>
          {/* Skip Button */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          {/* Pagination Dots */}
          <View style={styles.dotsContainer}>
            {slides.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  currentSlide === idx ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            style={styles.nextButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#9a3412', '#d5821d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <MaterialIcons name="chevron-right" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1917', // stone-900
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '65%',
    zIndex: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  badgeContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '50%',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 20,
    zIndex: 20,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    flex: 1,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFF7ED', // orange-50
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a', // slate-900
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 32,
  },
  desc: {
    fontSize: 14,
    color: '#6B7280', // gray-500
    textAlign: 'center',
    lineHeight: 20,
  },
  controlsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 32,
  },
  skipButton: {
    width: 48,
  },
  skipText: {
    color: '#9CA3AF', // gray-400
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#9a3412',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#D1D5DB', // gray-300
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#9a3412',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
