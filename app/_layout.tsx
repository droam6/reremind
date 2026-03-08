import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, Slot } from 'expo-router';
import { getUserProfile } from '../utils/storage';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const profile = await getUserProfile();
      setOnboardingComplete(profile?.onboardingComplete ?? false);
      setReady(true);
    };
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showSplash && ready) {
      if (onboardingComplete) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding/welcome');
      }
    }
  }, [showSplash, ready, onboardingComplete, router]);

  if (showSplash || !ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashText}>RE-REMIND</Text>
      </View>
    );
  }

  return <Slot />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 8,
  },
});
