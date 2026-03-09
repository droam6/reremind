import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { Payment, PayFrequency, PaymentCategory } from '../../types/payment';
import { formatCurrency } from '../../utils/formatCurrency';
import { PremiumGate } from '../ui/PremiumGate';

const FREQUENCIES: { label: string; value: PayFrequency }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Fortnightly', value: 'fortnightly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
];

const CATEGORIES: { label: string; value: PaymentCategory }[] = [
  { label: 'Rent', value: 'rent' },
  { label: 'Utilities', value: 'utilities' },
  { label: 'Subscriptions', value: 'subscriptions' },
  { label: 'BNPL', value: 'bnpl' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Transport', value: 'transport' },
  { label: 'Groceries', value: 'groceries' },
  { label: 'Other', value: 'other' },
];

interface AddPaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSave: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  initialPayment?: Payment;
  isPremium?: boolean;
}

function parseDueDate(input: string): string {
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
  return new Date().toISOString().split('T')[0];
}

function formatToDisplay(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return '';
}

export function AddPaymentSheet({
  visible,
  onClose,
  onSave,
  initialPayment,
  isPremium = false,
}: AddPaymentSheetProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<PayFrequency>('monthly');
  const [category, setCategory] = useState<PaymentCategory>('other');
  const [dueDate, setDueDate] = useState('');
  const [isSplit, setIsSplit] = useState(false);
  const [splitCount, setSplitCount] = useState('2');
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  const isEditing = !!initialPayment;

  useEffect(() => {
    if (visible && initialPayment) {
      setName(initialPayment.name);
      setFrequency(initialPayment.frequency);
      setCategory(initialPayment.category);
      setDueDate(formatToDisplay(initialPayment.nextDueDate));
      if (initialPayment.isSplit && initialPayment.fullAmount) {
        setIsSplit(true);
        setSplitCount(String(initialPayment.splitCount ?? 2));
        setAmount(String(initialPayment.fullAmount));
      } else {
        setIsSplit(false);
        setSplitCount('2');
        setAmount(String(initialPayment.amount));
      }
    } else if (visible) {
      setName('');
      setAmount('');
      setFrequency('monthly');
      setCategory('other');
      setDueDate('');
      setIsSplit(false);
      setSplitCount('2');
    }
  }, [visible, initialPayment]);

  const parsedAmount = parseFloat(amount);
  const parsedSplitCount = Math.max(2, parseInt(splitCount, 10) || 2);
  const userShare = isSplit && !isNaN(parsedAmount) && parsedAmount > 0
    ? Math.round((parsedAmount / parsedSplitCount) * 100) / 100
    : parsedAmount;
  const canSave = name.trim().length > 0 && !isNaN(parsedAmount) && parsedAmount > 0;

  const handleSplitToggle = () => {
    if (!isPremium) {
      setShowPremiumGate(true);
      return;
    }
    setIsSplit(!isSplit);
  };

  const handleSave = () => {
    if (!canSave) return;

    const dueDateStr = dueDate.trim()
      ? parseDueDate(dueDate)
      : new Date().toISOString().split('T')[0];

    const payment: Omit<Payment, 'id' | 'createdAt'> = {
      name: name.trim(),
      amount: isSplit ? userShare : parsedAmount,
      frequency,
      nextDueDate: dueDateStr,
      category,
    };

    if (isSplit) {
      payment.isSplit = true;
      payment.splitCount = parsedSplitCount;
      payment.fullAmount = parsedAmount;
    }

    onSave(payment);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => {}}>
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Name */}
            <Text style={styles.label}>NAME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rent, Netflix, Afterpay"
              placeholderTextColor={COLORS.textTertiary}
            />

            {/* Amount */}
            <Text style={[styles.label, styles.fieldGap]}>
              {isSplit ? 'FULL AMOUNT' : 'AMOUNT'}
            </Text>
            <View style={styles.amountContainer}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>
            {isSplit && !isNaN(parsedAmount) && parsedAmount > 0 && (
              <Text style={styles.shareText}>
                Your share: {formatCurrency(userShare)}
              </Text>
            )}

            {/* Frequency */}
            <Text style={[styles.label, styles.fieldGap]}>HOW OFTEN?</Text>
            <View style={styles.optionRow}>
              {FREQUENCIES.map((f) => {
                const sel = frequency === f.value;
                return (
                  <Pressable
                    key={f.value}
                    style={[styles.freqButton, sel && styles.freqButtonSelected]}
                    onPress={() => setFrequency(f.value)}
                  >
                    <Text style={[styles.freqText, sel && styles.freqTextSelected]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Category */}
            <Text style={[styles.label, styles.fieldGap]}>CATEGORY</Text>
            <View style={styles.optionRow}>
              {CATEGORIES.map((c) => {
                const sel = category === c.value;
                return (
                  <Pressable
                    key={c.value}
                    style={[styles.categoryPill, sel && styles.categoryPillSelected]}
                    onPress={() => setCategory(c.value)}
                  >
                    <Text style={[styles.categoryText, sel && styles.categoryTextSelected]}>
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Split toggle */}
            <Text style={[styles.label, styles.fieldGap]}>SPLIT THIS BILL?</Text>
            <Pressable style={styles.splitRow} onPress={handleSplitToggle}>
              <Text style={styles.splitLabel}>Split between people</Text>
              <View style={[styles.toggle, isSplit && styles.toggleOn]}>
                <View style={[styles.toggleThumb, isSplit && styles.toggleThumbOn]} />
              </View>
            </Pressable>
            {isSplit && (
              <View style={styles.splitCountRow}>
                <Text style={styles.splitCountLabel}>How many people?</Text>
                <TextInput
                  style={styles.splitCountInput}
                  value={splitCount}
                  onChangeText={(t) => setSplitCount(t.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            )}

            {/* Due date */}
            <Text style={[styles.label, styles.fieldGap]}>NEXT DUE DATE</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={COLORS.textTertiary}
            />

            {/* Action buttons */}
            <View style={styles.actions}>
              <Pressable style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!canSave}
              >
                <Text style={styles.saveText}>
                  {isEditing ? 'UPDATE' : 'SAVE'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>

      {showPremiumGate && (
        <PremiumGate
          feature="bill splitting"
          onDismiss={() => setShowPremiumGate(false)}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modal: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.sharp,
    padding: SPACING.lg,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.h1,
    lineHeight: FONT_SIZES.h1,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  fieldGap: {
    marginTop: 20,
  },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    height: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sharp,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    height: 56,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sharp,
  },
  dollarSign: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
    marginRight: SPACING.xs,
  },
  amountInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.bold,
    height: 56,
    padding: 0,
  },
  shareText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.sm,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  freqButton: {
    paddingHorizontal: SPACING.md,
    height: 40,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sharp,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  freqButtonSelected: {
    borderColor: COLORS.accent,
  },
  freqText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.medium,
  },
  freqTextSelected: {
    color: COLORS.accent,
  },
  categoryPill: {
    paddingHorizontal: SPACING.md,
    height: 32,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillSelected: {
    borderColor: COLORS.accent,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.medium,
    textTransform: 'uppercase',
  },
  categoryTextSelected: {
    color: COLORS.accent,
  },

  // Split
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    height: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sharp,
  },
  splitLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: COLORS.accent,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.textTertiary,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.black,
  },
  splitCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  splitCountLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
  },
  splitCountInput: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    width: 48,
    height: 40,
    textAlign: 'center',
    borderRadius: BORDER_RADIUS.sharp,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
  },
  cancelButton: {
    height: 48,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
    height: 48,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.3,
  },
  saveText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
