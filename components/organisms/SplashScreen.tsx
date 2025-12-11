import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Path } from 'react-native-svg';

// Keep splash screen visible while we load
SplashScreen.preventAutoHideAsync();

interface AppLogoProps {
  width?: number;
  height?: number;
  color?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({ width = 120, height = 120, color = '#d5821d' }) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 235 287"
    preserveAspectRatio="xMidYMid meet"
  >
    <G>
      <Path
        fill={color}
        d="m127.1-0.03l-106.23 106.22c-27 27-26.99 70.77 0 97.76l1.9 1.9c13.08 13.08 34.27 13.08 47.35 0l46.41-46.41-1.9-1.9c-13.07-13.07-34.27-13.07-47.34 0l59.81-59.81c26.99-27 26.99-70.77 0-97.76z"
      />
      <Path
        fill="#9a3412"
        d="m209.82 82.38l-1.9-1.9c-13.07-13.08-34.27-13.08-47.34 0l-47.69 47.68 1.9 1.9c13.08 13.08 34.27 13.08 47.35 0l-58.54 58.54c-27 27-27 70.77 0 97.76l106.22-106.22c27-27 27-70.77 0-97.76z"
      />
    </G>
  </Svg>
);

interface SalozySplashProps {
  onFinish: () => void;
}

export const SalozySplash: React.FC<SalozySplashProps> = ({ onFinish }) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const spinReverseValue = React.useRef(new Animated.Value(0)).current;
  const fadeInValue = React.useRef(new Animated.Value(0)).current;
  const fadeInUpValue = React.useRef(new Animated.Value(0)).current;
  const bounceValue1 = React.useRef(new Animated.Value(0)).current;
  const bounceValue2 = React.useRef(new Animated.Value(0)).current;
  const bounceValue3 = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hide native splash screen immediately
    SplashScreen.hideAsync().catch(() => {
      // Ignore errors if already hidden
    });

    // Start animations
    Animated.parallel([
      // Rotating dashed circles
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      Animated.loop(
        Animated.timing(spinReverseValue, {
          toValue: 1,
          duration: 9000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      // Fade in animations
      Animated.timing(fadeInValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeInUpValue, {
        toValue: 1,
        duration: 1000,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // Bouncing dots
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.sequence([
              Animated.timing(bounceValue1, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(bounceValue1, {
                toValue: 0,
                duration: 400,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.delay(150),
              Animated.timing(bounceValue2, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(bounceValue2, {
                toValue: 0,
                duration: 400,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.delay(300),
              Animated.timing(bounceValue3, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }),
              Animated.timing(bounceValue3, {
                toValue: 0,
                duration: 400,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.delay(200),
        ])
      ),
    ]).start();

    // Auto-finish after 3.5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinReverse = spinReverseValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const translateY1 = bounceValue1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const translateY2 = bounceValue2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const translateY3 = bounceValue3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#1a1a1a', '#050505']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          {/* Dashed Circle Container */}
          <View style={styles.logoContainer}>
            {/* Rotating Dashed Border - Outer */}
            <Animated.View
              style={[
                styles.svgContainer,
                { transform: [{ rotate: spin }] },
              ]}
            >
              <Svg width={160} height={160} viewBox="0 0 160 160">
                <Path
                  d="M 80 10 A 70 70 0 1 1 80 150"
                  fill="none"
                  stroke="rgba(213, 130, 29, 0.3)"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                />
              </Svg>
            </Animated.View>
            {/* Rotating Dashed Border - Inner */}
            <Animated.View
              style={[
                styles.svgContainerInner,
                { transform: [{ rotate: spinReverse }] },
              ]}
            >
              <Svg width={144} height={144} viewBox="0 0 144 144">
                <Path
                  d="M 72 8 A 64 64 0 1 1 72 136"
                  fill="none"
                  stroke="rgba(213, 130, 29, 0.2)"
                  strokeWidth="2"
                  strokeDasharray="8 4"
                />
              </Svg>
            </Animated.View>

            {/* Logo */}
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  opacity: fadeInUpValue,
                  transform: [
                    {
                      translateY: fadeInUpValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <AppLogo width={70} height={85} />
            </Animated.View>
          </View>

          {/* Text with Aclonica Font */}
          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: fadeInValue,
              },
            ]}
          >
            <Text style={styles.title}>SALOZY</Text>
          </Animated.View>

          {/* Subtext with separators */}
          <Animated.View
            style={[
              styles.subtitleContainer,
              {
                opacity: fadeInValue,
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', '#9a3412']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.separator}
            />
            <Text style={styles.subtitle}>Salon Manager</Text>
            <LinearGradient
              colors={['#9a3412', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.separator}
            />
          </Animated.View>
        </View>

        {/* Bottom Dots Loader */}
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ translateY: translateY1 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ translateY: translateY2 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ translateY: translateY3 }],
              },
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  svgContainer: {
    position: 'absolute',
    width: 160,
    height: 160,
    top: 0,
    left: 0,
  },
  svgContainerInner: {
    position: 'absolute',
    width: 144,
    height: 144,
    top: 8,
    left: 8,
  },
  logoWrapper: {
    zIndex: 10,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '400',
    letterSpacing: 1,
    // Note: To use Aclonica font, load it with expo-font and set fontFamily: 'Aclonica'
    // For now using system font as fallback
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    width: 32,
    height: 1,
  },
  subtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 3.2,
    fontWeight: '400',
    marginHorizontal: 12,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d5821d',
    marginHorizontal: 4,
  },
});

