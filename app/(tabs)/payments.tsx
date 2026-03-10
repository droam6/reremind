import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SPACING, FONT_SIZES, FONT_WEIGHTS, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { Payment, PayFrequency } from '../../types/payment';
import { usePayments } from '../../hooks/usePayments';
import { useUser } from '../../hooks/useUser';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDate, parseDate } from '../../utils/formatDate';
import { capitalizeName } from '../../utils/capitalize';
import { generateId } from '../../utils/generateId';
import { AddPaymentSheet } from '../../components/payments/AddPaymentSheet';
import { PaymentCalendar } from '../../components/payments/PaymentCalendar';
import { PremiumGate } from '../../components/ui/PremiumGate';
import { FREE_LIMITS } from '../../constants/limits';

function frequencyLabel(freq: PayFrequency): string {
  switch (freq) {
    case 'weekly': return 'Weekly';
    case 'fortnightly': return 'Fortnightly';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    case 'yearly': return 'Yearly';
  }
}

function toMonthlyAmount(amount: number, freq: PayFrequency): number {
  switch (freq) {
    case 'weekly': return amount * 4.33;
    case 'fortnightly': return amount * 2.17;
    case 'monthly': return amount;
    case 'quarterly': return amount / 3;
    case 'yearly': return amount / 12;
  }
}

export default function PaymentsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { user } = useUser();
  const { payments, loading, addPayment, removePayment, updatePayment, reload } = usePayments();
  const [showSheet, setShowSheet] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<string>('');
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const isPremium = user?.isPremium ?? false;

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const monthlyTotal = payments.reduce(
    (sum, p) => sum + toMonthlyAmount(p.amount, p.frequency),
    0
  );

  const handleAddPayment = () => {
    if (!isPremium && payments.length >= FREE_LIMITS.MAX_PAYMENTS) {
      setPremiumFeature('unlimited payments');
      return;
    }
    setEditingPayment(undefined);
    setShowSheet(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setShowSheet(true);
  };

  const handleSave = (data: Omit<Payment, 'id' | 'createdAt'>) => {
    if (editingPayment) {
      updatePayment({ ...editingPayment, ...data });
    } else {
      const payment: Payment = {
        ...data,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      addPayment(payment);
    }
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === 'web') {
      setConfirmDeleteId(id);
    } else {
      Alert.alert(
        'Remove payment',
        'Are you sure you want to remove this payment?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removePayment(id) },
        ]
      );
    }
  };

  // Sort payments: future/today first by soonest, then overdue at bottom
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const sortedPayments = [...payments].sort((a, b) => {
    const aOverdue = a.nextDueDate < todayStr;
    const bOverdue = b.nextDueDate < todayStr;
    if (aOverdue && !bOverdue) return 1;
    if (!aOverdue && bOverdue) return -1;
    return a.nextDueDate.localeCompare(b.nextDueDate);
  });

  const hasPayments = payments.length > 0;

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>PAYMENTS</Text>
          {hasPayments && (
            <View style={styles.viewToggle}>
              <Pressable
                style={[
                  styles.viewPill,
                  view === 'list' && styles.viewPillActive,
                  { backgroundColor: view === 'list' ? 'transparent' : colors.surface },
                ]}
                onPress={() => setView('list')}
              >
                <Text
                  style={[
                    styles.viewPillText,
                    { color: view === 'list' ? colors.accent : colors.textSecondary },
                  ]}
                >
                  List
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.viewPill,
                  view === 'calendar' && styles.viewPillActive,
                  { backgroundColor: view === 'calendar' ? 'transparent' : colors.surface },
                ]}
                onPress={() => {
                  if (!isPremium) {
                    setPremiumFeature('payment calendar view');
                  } else {
                    setView('calendar');
                  }
                }}
              >
                <Text
                  style={[
                    styles.viewPillText,
                    { color: view === 'calendar' ? colors.accent : colors.textSecondary },
                  ]}
                >
                  Calendar
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        {hasPayments && (
          <Text style={styles.summary}>
            {payments.length} payment{payments.length !== 1 ? 's' : ''} · {formatCurrency(Math.round(monthlyTotal))}/month
          </Text>
        )}
      </View>

      {view === 'calendar' && hasPayments ? (
        <PaymentCalendar payments={payments} />
      ) : hasPayments ? (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {sortedPayments.map((p) => {
            const isOverdue = p.nextDueDate < todayStr;
            return (
            <Pressable
              key={p.id}
              style={styles.card}
              onPress={() => handleEditPayment(p)}
              accessibilityLabel={`${p.name}, ${formatCurrency(p.amount)}, due ${formatRelativeDate(p.nextDueDate)}`}
              accessibilityRole="button"
            >
              <View style={styles.cardLeft}>
                <Text style={styles.cardName}>{capitalizeName(p.name)}</Text>
                <Text style={[styles.cardDetail, isOverdue && styles.overdueText]}>
                  {isOverdue ? 'Overdue' : frequencyLabel(p.frequency)} · due {formatRelativeDate(p.nextDueDate)}
                </Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {p.category.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>{formatCurrency(p.amount)}</Text>
                {p.isSplit && p.fullAmount && p.splitCount && (
                  <Text style={styles.splitCaption}>
                    1/{p.splitCount} of {formatCurrency(p.fullAmount)}
                  </Text>
                )}
                {confirmDeleteId === p.id ? (
                  <View style={styles.confirmRow}>
                    <Pressable onPress={() => setConfirmDeleteId(null)}>
                      <Text style={styles.confirmCancel}>No</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        removePayment(p.id);
                        setConfirmDeleteId(null);
                      }}
                    >
                      <Text style={styles.confirmYes}>Yes</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleDelete(p.id)}
                    accessibilityLabel={`Remove ${p.name}`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.deleteText}>×</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
            );
          })}
          <View style={styles.bottomPad} />
        </ScrollView>
      ) : (
        <View style={[styles.centred, { flex: 1 }]}>
          <Text style={styles.emptyTitle}>You haven't added any payments yet</Text>
          <Text style={styles.emptySubtitle}>
            Track your bills, BNPL, and subscriptions
          </Text>
          <Pressable style={styles.emptyButton} onPress={handleAddPayment}>
            <Text style={styles.emptyButtonText}>+ Add your first payment</Text>
          </Pressable>
        </View>
      )}

      {/* FAB */}
      {hasPayments && (
        <Pressable
          style={styles.fab}
          onPress={handleAddPayment}
          accessibilityLabel="Add payment"
          accessibilityRole="button"
        >
          <View style={styles.fabIconContainer}>
            <View style={styles.fabBarHorizontal} />
            <View style={styles.fabBarVertical} />
          </View>
        </Pressable>
      )}

      <AddPaymentSheet
        visible={showSheet}
        onClose={() => {
          setShowSheet(false);
          setEditingPayment(undefined);
        }}
        onSave={handleSave}
        initialPayment={editingPayment}
        isPremium={isPremium}
      />

      {premiumFeature && (
        <PremiumGate
          feature={premiumFeature}
          onDismiss={() => setPremiumFeature('')}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centred: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: SPACING.xxl + SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  title: {
    color: colors.text,
    fontSize: FONT_SIZES.h2,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  viewPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.button,
  },
  viewPillActive: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  viewPillText: {
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.sharp,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardLeft: {
    flex: 1,
  },
  cardName: {
    color: colors.text,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  cardDetail: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.caption,
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.subtle,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  categoryBadgeText: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    fontFamily: FONTS.regular,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardAmount: {
    color: colors.text,
    fontSize: FONT_SIZES.h3,
    fontFamily: FONTS.regular,
  },
  splitCaption: {
    color: colors.textTertiary,
    fontSize: FONT_SIZES.caption,
    marginTop: 2,
  },
  overdueText: {
    color: colors.danger,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: colors.textTertiary,
    fontSize: FONT_SIZES.h2,
    lineHeight: FONT_SIZES.h2,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  confirmCancel: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.light,
  },
  confirmYes: {
    color: colors.danger,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.regular,
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.h3,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    color: colors.textTertiary,
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    backgroundColor: colors.accent,
    height: 48,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: colors.black,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBarHorizontal: {
    position: 'absolute',
    width: 20,
    height: 2.5,
    backgroundColor: colors.black,
    borderRadius: 1,
  },
  fabBarVertical: {
    position: 'absolute',
    width: 2.5,
    height: 20,
    backgroundColor: colors.black,
    borderRadius: 1,
  },
  bottomPad: {
    height: 120,
  },
});
