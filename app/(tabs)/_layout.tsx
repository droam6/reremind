import { Tabs } from 'expo-router';
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.black,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 70,
          paddingBottom: 16,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          textTransform: 'uppercase',
          fontWeight: FONT_WEIGHTS.bold,
          fontSize: FONT_SIZES.caption,
          letterSpacing: 1,
        },
        tabBarActiveTintColor: COLORS.text,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'HOME', tabBarAccessibilityLabel: 'Home tab' }} />
      <Tabs.Screen name="payments" options={{ title: 'PAYMENTS', tabBarAccessibilityLabel: 'Payments tab' }} />
      <Tabs.Screen name="insights" options={{ title: 'INSIGHTS', tabBarAccessibilityLabel: 'Insights tab' }} />
      <Tabs.Screen name="profile" options={{ title: 'PROFILE', tabBarAccessibilityLabel: 'Profile tab' }} />
    </Tabs>
  );
}
