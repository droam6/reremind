import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.center}>
        <Text style={styles.title}>RE-REMIND</Text>
        <Text style={styles.tagline}>Stop guessing. Start knowing.</Text>
        <Text style={styles.subtitle}>
          See what's left after your bills — every day.
        </Text>
      </View>

      <View style={styles.bottom}>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/onboarding/income')}
        >
          <Text style={styles.buttonText}>GET STARTED</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
  },
  spacer: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.heavy,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  tagline: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.regular,
    marginTop: SPACING.md,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.regular,
    marginTop: SPACING.sm,
  },
  bottom: {
    paddingBottom: SPACING.xxl,
  },
  button: {
    backgroundColor: COLORS.accent,
    height: 56,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
