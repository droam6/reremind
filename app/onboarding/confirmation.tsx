import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { useOnboarding } from './OnboardingContext';
import { useIncome } from '../../hooks/useIncome';
import { useUser } from '../../hooks/useUser';
import { useLifetimeStats } from '../../hooks/useLifetimeStats';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDate } from '../../utils/formatDate';
import { savePayments } from '../../utils/storage';
import { Income } from '../../types/income';
import { useSlideUp, useFadeIn } from '../../utils/animations';

function getFrequencyLabel(freq: string): string {
  switch (freq) {
    case 'weekly': return 'Weekly';
    case 'fortnightly': return 'Fortnightly';
    case 'monthly': return 'Monthly';
    default: return freq;
  }
}

function getCycleDays(freq: string): number {
  switch (freq) {
    case 'weekly': return 7;
    case 'fortnightly': return 14;
    case 'monthly': return 30;
    default: return 14;
  }
}

export default function ConfirmationScreen() {
  const router = useRouter();
  const { income: onboardingIncome, payments } = useOnboarding();
  const { saveIncome } = useIncome();
  const { completeOnboarding } = useUser();
  const { initStats } = useLifetimeStats();

  const totalCommitted = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, onboardingIncome.amount - totalCommitted);

  // Animations
  const card = useSlideUp(200, 500, 20);
  const heroOpacity = useFadeIn(500, 600);
  const buttonOpacity = useFadeIn(800, 500);

  const handleFinish = async () => {
    const nextPayday = onboardingIncome.nextPayday || (() => {
      const d = new Date();
      d.setDate(d.getDate() + getCycleDays(onboardingIncome.frequency));
      return d.toISOString().split('T')[0];
    })();

    const incomeData: Income = {
      amount: onboardingIncome.amount,
      frequency: onboardingIncome.frequency,
      nextPayday,
    };

    await saveIncome(incomeData);
    await savePayments(payments);
    await initStats(payments.length, totalCommitted);
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: card.opacity,
            transform: [{ translateY: card.translateY }],
          }}
        >
          <Text style={styles.heading}>You're all set.</Text>
          <Text style={styles.subheading}>
            Here's what we're watching for you.
          </Text>

          {/* Summary card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Take-home pay</Text>
              <Text style={styles.cardValueBold}>
                {formatCurrency(onboardingIncome.amount)}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Pay frequency</Text>
              <Text style={styles.cardValue}>
                {getFrequencyLabel(onboardingIncome.frequency)}
              </Text>
            </View>
            {onboardingIncome.nextPayday ? (
              <View style={styles.cardRow}>
                <Text style={styles.cardLabel}>Next payday</Text>
                <Text style={styles.cardValue}>
                  {formatRelativeDate(onboardingIncome.nextPayday)}
                </Text>
              </View>
            ) : null}
            <View style={styles.cardSeparator} />
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Payments tracked</Text>
              <Text style={styles.cardValue}>{payments.length}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Total committed</Text>
              <Text style={styles.cardValueBold}>
                {formatCurrency(totalCommitted)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Hero preview */}
        {payments.length > 0 && (
          <Animated.View style={[styles.heroPreview, { opacity: heroOpacity }]}>
            <Text style={styles.heroLabel}>LEFT AFTER BILLS</Text>
            <Text style={styles.heroNumber}>{formatCurrency(remaining)}</Text>
            <Text style={styles.heroSub}>after your first pay cycle</Text>
          </Animated.View>
        )}
      </View>

      {/* Bottom button */}
      <Animated.View style={[styles.bottom, { opacity: buttonOpacity }]}>
        <Pressable style={styles.button} onPress={handleFinish}>
          <Text style={styles.buttonText}>LET'S GO</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressTrack: {
    height: 2,
    backgroundColor: COLORS.surface,
    marginTop: SPACING.xxl,
  },
  progressFill: {
    height: 2,
    backgroundColor: COLORS.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  heading: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h1,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sharp,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  cardLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
  },
  cardValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
  },
  cardValueBold: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: COLORS.background,
    marginVertical: SPACING.sm,
  },
  heroPreview: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  heroLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  heroNumber: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.h1,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  heroSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
  },
  bottom: {
    paddingHorizontal: SPACING.lg,
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
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
