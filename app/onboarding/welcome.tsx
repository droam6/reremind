import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZES, FONT_WEIGHTS, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useSlideUp, useFadeIn } from '../../utils/animations';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const title = useSlideUp(200, 600, 20);
  const tagline = useSlideUp(500, 600, 20);
  const subtitle = useSlideUp(700, 600, 20);
  const buttonOpacity = useFadeIn(1000, 500);

  return (
    <View style={styles.container}>
      <View style={styles.spacer} />

      <View style={styles.center}>
        <Animated.Text
          style={[
            styles.title,
            { opacity: title.opacity, transform: [{ translateY: title.translateY }] },
          ]}
        >
          RE-REMIND
        </Animated.Text>
        <Animated.Text
          style={[
            styles.tagline,
            { opacity: tagline.opacity, transform: [{ translateY: tagline.translateY }] },
          ]}
        >
          Stop guessing. Start knowing.
        </Animated.Text>
        <Animated.Text
          style={[
            styles.subtitle,
            { opacity: subtitle.opacity, transform: [{ translateY: subtitle.translateY }] },
          ]}
        >
          See what's left after your bills — every day.
        </Animated.Text>
      </View>

      <Animated.View style={[styles.bottom, { opacity: buttonOpacity }]}>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/onboarding/questions')}
        >
          <Animated.Text style={styles.buttonText}>GET STARTED</Animated.Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
    fontSize: 28,
    fontFamily: FONTS.heavy,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.light,
    marginTop: SPACING.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: FONTS.light,
    marginTop: SPACING.sm,
  },
  bottom: {
    paddingBottom: SPACING.xxl,
  },
  button: {
    backgroundColor: colors.accent,
    height: 56,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.black,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
