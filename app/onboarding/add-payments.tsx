import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { Payment } from '../../types/payment';
import { formatCurrency } from '../../utils/formatCurrency';
import { generateId } from '../../utils/generateId';
import { useOnboarding } from './OnboardingContext';
import { AddPaymentSheet } from '../../components/payments/AddPaymentSheet';
import { PremiumGate } from '../../components/ui/PremiumGate';
import { FREE_LIMITS } from '../../constants/limits';

export default function AddPaymentsScreen() {
  const router = useRouter();
  const { payments, addPayment, removePayment } = useOnboarding();
  const [showSheet, setShowSheet] = useState(false);
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  const handleSave = (data: Omit<Payment, 'id' | 'createdAt'>) => {
    const payment: Payment = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    addPayment(payment);
  };

  const handleAddPayment = () => {
    if (payments.length >= FREE_LIMITS.MAX_PAYMENTS) {
      setShowPremiumGate(true);
      return;
    }
    setShowSheet(true);
  };

  const hasPayments = payments.length > 0;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '50%' }]} />
      </View>

      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.heading}>What's coming out of your account?</Text>
        <Text style={styles.subheading}>
          Bills, subscriptions, BNPL — anything that repeats.
        </Text>

        {/* Payment list */}
        {hasPayments ? (
          <View style={styles.paymentList}>
            {payments.map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>{p.name}</Text>
                  <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
                </View>
                <Pressable
                  style={styles.removeButton}
                  onPress={() => removePayment(p.id)}
                >
                  <Text style={styles.removeText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No payments added yet</Text>
        )}

        {/* Add payment button */}
        <Pressable style={styles.addButton} onPress={handleAddPayment}>
          <Text style={styles.addButtonText}>+ Add payment</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottom}>
        <Pressable
          style={styles.button}
          onPress={() => router.push('/onboarding/confirmation')}
        >
          <Text style={styles.buttonText}>
            {hasPayments ? 'NEXT' : 'SKIP FOR NOW'}
          </Text>
        </Pressable>
      </View>

      <AddPaymentSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onSave={handleSave}
      />

      {showPremiumGate && (
        <PremiumGate
          feature="unlimited payments"
          onDismiss={() => setShowPremiumGate(false)}
        />
      )}
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
  },
  contentInner: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
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
    marginBottom: SPACING.lg,
  },
  paymentList: {
    marginBottom: SPACING.md,
  },
  paymentRow: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sharp,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  paymentAmount: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.h2,
    lineHeight: FONT_SIZES.h2,
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  addButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.bold,
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
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
