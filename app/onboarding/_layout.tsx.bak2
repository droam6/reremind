import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';
import { OnboardingProvider } from './OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0A' },
          animation: 'slide_from_right',
        }}
      />
    </OnboardingProvider>
  );
}
