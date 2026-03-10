import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { IncomeFrequency } from '../../types/income';
import { useIncome } from '../../hooks/useIncome';
import { useCards } from '../../hooks/useCards';
import { useUser } from '../../hooks/useUser';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDate } from '../../utils/formatDate';
import { generateId } from '../../utils/generateId';
import { clearAll } from '../../utils/storage';
import { loadMockData } from '../../utils/mockData';
import { FREE_LIMITS } from '../../constants/limits';
import { PremiumGate } from '../../components/ui/PremiumGate';
import { DatePicker } from '../../components/ui/DatePicker';

const FREQUENCIES: { label: string; value: IncomeFrequency }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Fortnightly', value: 'fortnightly' },
  { label: 'Monthly', value: 'monthly' },
];

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return '';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { income, reload: reloadIncome, saveIncome } = useIncome();
  const { cards, addCard, removeCard } = useCards();
  const { user, setIsPremium } = useUser();

  // Modals
  const [showEditIncome, setShowEditIncome] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  // Edit income draft
  const [editAmount, setEditAmount] = useState('');
  const [editFrequency, setEditFrequency] = useState<IncomeFrequency>('fortnightly');
  const [editPayday, setEditPayday] = useState('');

  // Add card draft
  const [cardLabel, setCardLabel] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');

  useFocusEffect(
    useCallback(() => {
      reloadIncome();
    }, [reloadIncome])
  );

  const openEditIncome = () => {
    if (income) {
      setEditAmount(String(income.amount));
      setEditFrequency(income.frequency);
      setEditPayday(income.nextPayday);
    } else {
      setEditAmount('');
      setEditFrequency('fortnightly');
      setEditPayday('');
    }
    setShowEditIncome(true);
  };

  const handleSaveIncome = async () => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;
    const paydayStr = editPayday.trim()
      ? editPayday
      : income?.nextPayday ?? new Date().toISOString().split('T')[0];
    await saveIncome({ amount, frequency: editFrequency, nextPayday: paydayStr });
    setShowEditIncome(false);
  };

  const openAddCard = () => {
    if (!user?.isPremium && cards.length >= FREE_LIMITS.MAX_CARDS) {
      setPremiumFeature('unlimited cards');
      setShowPremiumGate(true);
      return;
    }
    setCardLabel('');
    setCardLastFour('');
    setShowAddCard(true);
  };

  const handleSaveCard = async () => {
    if (!cardLabel.trim()) return;
    await addCard({
      id: generateId(),
      label: cardLabel.trim(),
      lastFour: cardLastFour.trim() || undefined,
    });
    setShowAddCard(false);
  };

  const handleReset = async () => {
    await clearAll();
    setConfirmReset(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/onboarding/welcome';
    } else {
      router.replace('/onboarding/welcome');
    }
  };

  const handleLoadMockData = async () => {
    await loadMockData();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      // On native, navigate to home to trigger data reload
      router.replace('/(tabs)');
    }
  };

  const handleExport = () => {
    if (Platform.OS === 'web') {
      setPremiumFeature('data export');
      setShowPremiumGate(true);
    } else {
      Alert.alert('Premium feature', 'Export is a premium feature. Coming soon.');
    }
  };

  const handleResetPress = () => {
    if (Platform.OS === 'web') {
      setConfirmReset(true);
    } else {
      Alert.alert(
        'Reset all data',
        'Are you sure? This will delete all your data and restart the app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: handleReset },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.header}>PROFILE</Text>

      {/* Section 1: Your Income */}
      <Text style={styles.sectionLabel}>YOUR INCOME</Text>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardRowLabel}>Take-home pay</Text>
          <Text style={styles.cardRowValueBold}>
            {income ? formatCurrency(income.amount) : '—'}
          </Text>
        </View>
        <View style={styles.cardSep} />
        <View style={styles.cardRow}>
          <Text style={styles.cardRowLabel}>Pay frequency</Text>
          <Text style={styles.cardRowValue}>
            {income ? capitalise(income.frequency) : '—'}
          </Text>
        </View>
        <View style={styles.cardSep} />
        <View style={styles.cardRow}>
          <Text style={styles.cardRowLabel}>Next payday</Text>
          <Text style={styles.cardRowValue}>
            {income?.nextPayday ? formatRelativeDate(income.nextPayday) : '—'}
          </Text>
        </View>
      </View>
      <Pressable style={styles.editLink} onPress={openEditIncome}>
        <Text style={styles.editLinkText}>Edit income</Text>
      </Pressable>

      {/* Section 2: Your Cards */}
      <Text style={styles.sectionLabel}>YOUR CARDS</Text>
      {cards.length > 0 ? (
        <View style={styles.cardList}>
          {cards.map((c) => (
            <View key={c.id} style={styles.cardItem}>
              <View style={styles.cardItemLeft}>
                <Text style={styles.cardItemLabel}>{c.label}</Text>
                {c.lastFour && (
                  <Text style={styles.cardItemDigits}>•••• {c.lastFour}</Text>
                )}
              </View>
              <Pressable
                style={styles.cardItemDelete}
                onPress={() => removeCard(c.id)}
              >
                <Text style={styles.cardItemDeleteText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No cards added</Text>
      )}
      <Pressable style={styles.editLink} onPress={openAddCard}>
        <Text style={styles.editLinkText}>+ Add card</Text>
      </Pressable>

      {/* Section 3: App */}
      <Text style={styles.sectionLabel}>APP</Text>
      <View style={styles.card}>
        <Pressable style={styles.cardRow}>
          <Text style={styles.cardRowValue}>Notifications</Text>
          <Text style={styles.comingSoon}>Coming soon</Text>
        </Pressable>
        <View style={styles.cardSep} />
        <Pressable style={styles.cardRow} onPress={handleExport}>
          <Text style={styles.cardRowValue}>Export data</Text>
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>
        </Pressable>
        <View style={styles.cardSep} />
        <Pressable style={styles.cardRow} onPress={handleResetPress}>
          <Text style={styles.dangerText}>Reset all data</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerBrand}>RE-REMIND</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
        <Pressable
          style={styles.devModeToggle}
          onPress={() => setIsPremium(!user?.isPremium)}
        >
          <Text style={styles.devModeText}>
            Dev Mode{user?.isPremium && ' · Premium'}
          </Text>
          {user?.isPremium && <View style={styles.premiumDot} />}
        </Pressable>
        <Pressable
          style={styles.loadDemoButton}
          onPress={handleLoadMockData}
        >
          <Text style={styles.loadDemoText}>Load demo data</Text>
        </Pressable>
      </View>

      {/* Edit Income Modal */}
      <Modal
        visible={showEditIncome}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditIncome(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowEditIncome(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalLabel}>AMOUNT</Text>
            <View style={styles.amountContainer}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={[styles.amountInput, Platform.OS === 'web' && { outline: 'none' } as any]}
                value={editAmount}
                onChangeText={(t) => {
                  const cleaned = t.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  if (parts.length > 2) return;
                  if (parts.length === 2 && parts[1].length > 2) return;
                  setEditAmount(cleaned);
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>

            <Text style={[styles.modalLabel, { marginTop: 20 }]}>HOW OFTEN?</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => {
                const sel = editFrequency === f.value;
                return (
                  <Pressable
                    key={f.value}
                    style={[styles.freqButton, sel && styles.freqButtonSelected]}
                    onPress={() => setEditFrequency(f.value)}
                  >
                    <Text style={[styles.freqText, sel && styles.freqTextSelected]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ marginTop: 20 }}>
              <DatePicker
                value={editPayday}
                onChange={setEditPayday}
                label="NEXT PAYDAY"
                disablePast
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowEditIncome(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSaveIncome}>
                <Text style={styles.saveText}>SAVE</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Card Modal */}
      <Modal
        visible={showAddCard}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddCard(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowAddCard(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.modalLabel}>CARD LABEL</Text>
            <TextInput
              style={[styles.modalInput, Platform.OS === 'web' && { outline: 'none' } as any]}
              value={cardLabel}
              onChangeText={setCardLabel}
              placeholder="e.g. Commonwealth Debit"
              placeholderTextColor={COLORS.textTertiary}
            />

            <Text style={[styles.modalLabel, { marginTop: 20 }]}>LAST 4 DIGITS (OPTIONAL)</Text>
            <TextInput
              style={[styles.modalInput, Platform.OS === 'web' && { outline: 'none' } as any]}
              value={cardLastFour}
              onChangeText={(t) => setCardLastFour(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="numeric"
              placeholder="1234"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={4}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowAddCard(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, !cardLabel.trim() && { opacity: 0.3 }]}
                onPress={handleSaveCard}
                disabled={!cardLabel.trim()}
              >
                <Text style={styles.saveText}>SAVE</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Web Reset Confirm Modal */}
      <Modal
        visible={confirmReset}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmReset(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setConfirmReset(false)}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <Text style={styles.resetTitle}>Reset all data?</Text>
            <Text style={styles.resetDesc}>
              This will delete all your data and restart the app.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setConfirmReset(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetBtnText}>RESET</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Premium Gate */}
      {showPremiumGate && (
        <PremiumGate
          feature={premiumFeature}
          onDismiss={() => setShowPremiumGate(false)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 80,
  },
  header: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h2,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingTop: SPACING.xxl + SPACING.md,
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
    fontFamily: FONTS.regular,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sharp,
    padding: 20,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  cardRowLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.light,
  },
  cardRowValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.light,
  },
  cardRowValueBold: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
  },
  cardSep: {
    height: 1,
    backgroundColor: COLORS.surfaceLight,
    marginVertical: SPACING.xs,
  },
  editLink: {
    paddingVertical: SPACING.md,
  },
  editLinkText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: FONTS.regular,
  },
  cardList: {
    marginBottom: SPACING.xs,
  },
  cardItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sharp,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardItemLeft: {
    flex: 1,
  },
  cardItemLabel: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.xs,
  },
  cardItemDigits: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
  },
  cardItemDelete: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardItemDeleteText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.h2,
    lineHeight: FONT_SIZES.h2,
  },
  emptyText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.bodySmall,
    paddingVertical: SPACING.md,
  },
  comingSoon: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.caption,
  },
  premiumBadge: {
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.subtle,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  premiumBadgeText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.regular,
  },
  dangerText: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.body,
  },
  footer: {
    alignItems: 'center',
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  footerBrand: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginBottom: SPACING.xs,
  },
  footerVersion: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.caption,
  },
  devModeToggle: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  devModeText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.light,
  },
  premiumDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  loadDemoButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  loadDemoText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.light,
    textAlign: 'center',
  },

  // Modal shared styles
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
    width: '100%',
    maxWidth: 400,
  },
  modalLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    height: 48,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sharp,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  } as any,
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
    fontFamily: FONTS.regular,
    marginRight: SPACING.xs,
  },
  amountInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 24,
    fontFamily: FONTS.regular,
    height: 56,
    padding: 0,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  } as any,
  freqRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  freqButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.button,
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
    fontFamily: FONTS.light,
  },
  freqTextSelected: {
    color: COLORS.accent,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.md,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
  },
  cancelBtn: {
    height: 48,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.light,
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    height: 48,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resetTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h3,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  resetDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.md,
  },
  resetBtn: {
    backgroundColor: COLORS.danger,
    height: 48,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
