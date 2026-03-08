import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { IncomeFrequency } from '../../types/income';
import { useOnboarding } from './OnboardingContext';

const FREQUENCIES: { label: string; value: IncomeFrequency }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Fortnightly', value: 'fortnightly' },
  { label: 'Monthly', value: 'monthly' },
];

function formatPaydayDisplay(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return '';
}

function parsePaydayInput(input: string): string {
  const parts = input.split('/');
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts;
    const d = parseInt(dd, 10);
    const m = parseInt(mm, 10);
    const y = parseInt(yyyy, 10);
    if (d > 0 && m > 0 && y > 2000) {
      return `${yyyy}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return '';
}

export default function IncomeScreen() {
  const router = useRouter();
  const { income, setIncomeAmount, setIncomeFrequency, setIncomeNextPayday } = useOnboarding();
  const [amountText, setAmountText] = useState(income.amount > 0 ? String(income.amount) : '');
  const [paydayText, setPaydayText] = useState(formatPaydayDisplay(income.nextPayday));

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmountText(cleaned);
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      setIncomeAmount(num);
    } else {
      setIncomeAmount(0);
    }
  };

  const handlePaydayChange = (text: string) => {
    setPaydayText(text);
    const parsed = parsePaydayInput(text);
    setIncomeNextPayday(parsed);
  };

  const canProceed = income.amount > 0 && income.frequency && paydayText.length >= 8;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '25%' }]} />
      </View>

      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.heading}>How much do you take home?</Text>
        <Text style={styles.subheading}>
          After tax. The amount that hits your account.
        </Text>

        {/* Amount input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>AMOUNT</Text>
          <View style={styles.amountContainer}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amountText}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>
        </View>

        {/* Frequency selector */}
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

        {/* Next payday input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>NEXT PAYDAY</Text>
          <TextInput
            style={styles.paydayInput}
            value={paydayText}
            onChangeText={handlePaydayChange}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={COLORS.textTertiary}
          />
        </View>
      </View>

      {/* Bottom button */}
      <View style={styles.bottom}>
        <Pressable
          style={[styles.button, !canProceed && styles.buttonDisabled]}
          onPress={() => canProceed && router.push('/onboarding/add-payments')}
          disabled={!canProceed}
        >
          <Text style={styles.buttonText}>NEXT</Text>
        </Pressable>
      </View>
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
  },
  paydayInput: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    height: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.button,
  },
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
