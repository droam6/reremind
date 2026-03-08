import { Stack } from 'expo-router';
import { COLORS } from '../../constants/theme';
import { OnboardingProvider } from './OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      />
    </OnboardingProvider>
  );
}
