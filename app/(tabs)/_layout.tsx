import { Tabs } from 'expo-router';
import { FONT_SIZES, FONTS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.separator,
          elevation: 0,
          shadowOpacity: 0,
          height: 70,
          paddingBottom: 16,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          textTransform: 'uppercase',
          fontFamily: FONTS.medium,
          fontSize: FONT_SIZES.caption,
          letterSpacing: 1,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textTertiary,
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
