import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { IncomeFrequency } from '../../types/income';
import { useOnboarding } from './OnboardingContext';
import { useFadeIn, useProgressWidth } from '../../utils/animations';
import { DatePicker } from '../../components/ui/DatePicker';

const FREQUENCIES: { label: string; value: IncomeFrequency }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Fortnightly', value: 'fortnightly' },
  { label: 'Monthly', value: 'monthly' },
];

export default function IncomeScreen() {
  const router = useRouter();
  const { income, setIncomeAmount, setIncomeFrequency, setIncomeNextPayday } = useOnboarding();
  const [amountText, setAmountText] = useState(income.amount > 0 ? String(income.amount) : '');

  const contentOpacity = useFadeIn(200, 400);
  const progressWidth = useProgressWidth(40, 500, 200);

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts.length === 2 && parts[1].length > 2) return;
    setAmountText(cleaned);
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      setIncomeAmount(num);
    } else {
      setIncomeAmount(0);
    }
  };

  const handlePaydayChange = (isoDate: string) => {
    setIncomeNextPayday(isoDate);
  };

  const canProceed = income.amount > 0 && income.frequency && income.nextPayday.length >= 8;

  return (
    <View style={styles.container}>
      {/* Animated progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: progressWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>&#8592;</Text>
      </Pressable>

      {/* Content with fade in */}
      <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
        <Text style={styles.heading}>How much do you take home?</Text>
        <Text style={styles.subheading}>
          After tax. The amount that hits your account.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>AMOUNT</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={[styles.amountInput, Platform.OS === 'web' && { outline: 'none' } as any]}
              value={amountText}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>HOW OFTEN?</Text>
          <View style={styles.frequencyRow}>
            {FREQUENCIES.map((f) => {
              const selected = income.frequency === f.value;
              return (
                <Pressable
                  key={f.value}
                  style={[
                    styles.frequencyButton,
                    selected && styles.frequencyButtonSelected,
                  ]}
                  onPress={() => setIncomeFrequency(f.value)}
                >
                  <Text
                    style={[
                      styles.frequencyText,
                      selected && styles.frequencyTextSelected,
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <DatePicker
            value={income.nextPayday}
            onChange={handlePaydayChange}
            label="NEXT PAYDAY"
            disablePast
          />
        </View>
      </Animated.View>

      {/* Bottom button */}
      <Animated.View style={[styles.bottom, { opacity: contentOpacity }]}>
        <Pressable
          style={[styles.button, !canProceed && styles.buttonDisabled]}
          onPress={() => canProceed && router.push('/onboarding/add-payments')}
          disabled={!canProceed}
        >
          <Text style={styles.buttonText}>NEXT</Text>
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
  backButton: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
    alignSelf: 'flex-start',
  },
  backText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h2,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  heading: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h1,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
  },
  subheading: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    marginBottom: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    height: 64,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
  },
  dollarSign: {
    color: COLORS.text,
    fontSize: 36,
    fontWeight: FONT_WEIGHTS.bold,
    marginRight: SPACING.xs,
  },
  amountInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 36,
    fontWeight: FONT_WEIGHTS.bold,
    height: 64,
    padding: 0,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  } as any,
  frequencyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  frequencyButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  frequencyButtonSelected: {
    borderColor: COLORS.accent,
  },
  frequencyText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.medium,
  },
  frequencyTextSelected: {
    color: COLORS.accent,
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
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
