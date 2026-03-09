import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { Payment, PayFrequency, PaymentCategory } from '../../types/payment';
import { formatCurrency } from '../../utils/formatCurrency';
import { PremiumGate } from '../ui/PremiumGate';
import { DatePicker } from '../ui/DatePicker';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// FAB approximate position offsets (from centre of screen)
const FAB_OFFSET_X = (SCREEN_WIDTH / 2) - SPACING.lg - 28; // right-aligned FAB
const FAB_OFFSET_Y = (SCREEN_HEIGHT / 2) - 90 - 28; // bottom-aligned FAB

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

  // Genie effect animation — single progress value 0→1
  const progress = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      progress.setValue(0);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (modalVisible) {
      Animated.parallel([
        Animated.timing(progress, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, progress, overlayOpacity, modalVisible]);

  // Genie interpolations
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [FAB_OFFSET_X, 0],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [FAB_OFFSET_Y, 0],
  });
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 1],
  });
  const modalOpacity = progress.interpolate({
    inputRange: [0, 0.1, 0.3],
    outputRange: [0, 0.3, 1],
    extrapolate: 'clamp',
  });
  const borderRadius = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  const isEditing = !!initialPayment;

  useEffect(() => {
    if (visible && initialPayment) {
      setName(initialPayment.name);
      setFrequency(initialPayment.frequency);
      setCategory(initialPayment.category);
      setDueDate(initialPayment.nextDueDate);
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

    const dueDateStr = dueDate || new Date().toISOString().split('T')[0];

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

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              opacity: modalOpacity,
              transform: [
                { translateX },
                { translateY },
                { scale },
              ],
            },
          ]}
        >
          <Animated.View style={[styles.modal, { borderRadius }]}>
            {/* Close button */}
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={styles.label}>NAME</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(t) => setName(t.slice(0, 50))}
                placeholder="e.g. Rent, Netflix, Afterpay"
                placeholderTextColor={COLORS.textTertiary}
                maxLength={50}
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
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9.]/g, '');
                    // Prevent multiple dots and more than 2 decimal places
                    const parts = cleaned.split('.');
                    if (parts.length > 2) return;
                    if (parts.length === 2 && parts[1].length > 2) return;
                    setAmount(cleaned);
                  }}
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
              <View style={styles.fieldGapView}>
                <DatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  label="NEXT DUE DATE"
                  disablePast
                />
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                <Pressable style={styles.cancelButton} onPress={handleClose}>
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
          </Animated.View>
        </Animated.View>
      </View>

      {showPremiumGate && (
        <PremiumGate
          feature="bill splitting"
          onDismiss={() => setShowPremiumGate(false)}
        />
      )}
    </Modal>
  );
}

const SPACING_LG = SPACING.lg;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: SPACING_LG,
  },
  modal: {
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING_LG,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
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

  fieldGapView: {
    marginTop: 20,
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
