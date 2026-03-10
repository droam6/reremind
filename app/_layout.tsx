import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { useRouter, Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Montserrat_300Light,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_700Bold,
  Montserrat_900Black,
} from '@expo-google-fonts/montserrat';
import { getUserProfile } from '../utils/storage';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext';

// Component to update document background based on theme
function DocumentBackground() {
  const { colors } = useThemeContext();

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = colors.background;
      document.body.style.backgroundColor = colors.background;
      document.body.style.margin = '0';
      document.body.style.overflow = 'hidden';
    }
  }, [colors.background]);

  return null;
}

function RootLayoutContent() {
  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const hasNavigated = useRef(false);
  const router = useRouter();

  // Load Montserrat fonts
  const [fontsLoaded] = useFonts({
    Montserrat_300Light,
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_700Bold,
    Montserrat_900Black,
  });

  // Splash animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loadData = async () => {
      const profile = await getUserProfile();
      setOnboardingComplete(profile?.onboardingComplete ?? false);
      // Only set ready when both data and fonts are loaded
      if (fontsLoaded) {
        setReady(true);
      }
    };
    loadData();
  }, [fontsLoaded]);

  useEffect(() => {
    // 300ms delay, then fade text in over 800ms
    const fadeInTimer = setTimeout(() => {
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, 300);

    // After text fully visible (1100ms), hold 1500ms, then fade out splash (500ms)
    const fadeOutTimer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2600); // 300 + 800 + 1500 = 2600

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
    };
  }, [textOpacity, splashOpacity]);

  // Only navigate ONCE on initial app load — never re-fire after reset
  useEffect(() => {
    if (!showSplash && ready && !hasNavigated.current) {
      hasNavigated.current = true;
      if (onboardingComplete) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding/welcome');
      }
    }
  }, [showSplash, ready, onboardingComplete, router]);

  // Layered approach: Slot renders underneath, splash overlays on top
  // This eliminates the white flash between splash and content
  return (
    <>
      <DocumentBackground />
      <ErrorBoundary>
        <View style={styles.root}>
          <Slot />
          {showSplash && (
            <Animated.View style={[styles.splash, { opacity: splashOpacity }]} pointerEvents="none">
              <Animated.Text style={[styles.splashText, { opacity: textOpacity }]}>
                RE-REMIND
              </Animated.Text>
            </Animated.View>
          )}
        </View>
      </ErrorBoundary>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  splashText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Montserrat_300Light',
    letterSpacing: 12,
  },
});
