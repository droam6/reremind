import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { Payment, PayFrequency } from '../../types/payment';
import { usePayments } from '../../hooks/usePayments';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDate } from '../../utils/formatDate';
import { capitalizeName } from '../../utils/capitalize';
import { generateId } from '../../utils/generateId';
import { AddPaymentSheet } from '../../components/payments/AddPaymentSheet';
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
  const { payments, loading, addPayment, removePayment, updatePayment, reload } = usePayments();
  const [showSheet, setShowSheet] = useState(false);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | undefined>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    if (payments.length >= FREE_LIMITS.MAX_PAYMENTS) {
      setShowPremiumGate(true);
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

  const hasPayments = payments.length > 0;

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>PAYMENTS</Text>
        {hasPayments && (
          <Text style={styles.summary}>
            {payments.length} payment{payments.length !== 1 ? 's' : ''} · {formatCurrency(Math.round(monthlyTotal))}/month
          </Text>
        )}
      </View>

      {hasPayments ? (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {payments.map((p) => (
            <Pressable key={p.id} style={styles.card} onPress={() => handleEditPayment(p)}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardName}>{capitalizeName(p.name)}</Text>
                <Text style={styles.cardDetail}>
                  {frequencyLabel(p.frequency)} · due {formatRelativeDate(p.nextDueDate)}
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
                  >
                    <Text style={styles.deleteText}>×</Text>
                  </Pressable>
                )}
              </View>
            </Pressable>
          ))}
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
        <Pressable style={styles.fab} onPress={handleAddPayment}>
          <Text style={styles.fabText}>+</Text>
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
  centred: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: SPACING.xxl + SPACING.md,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  },
  summary: {
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  cardDetail: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.subtle,
  },
  categoryBadgeText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardAmount: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
  },
  splitCaption: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.caption,
    marginTop: 2,
  },
  deleteButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.h2,
    lineHeight: FONT_SIZES.h2,
  },
  confirmRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  confirmCancel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.medium,
  },
  confirmYes: {
    color: COLORS.danger,
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.bold,
  },
  emptyTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    backgroundColor: COLORS.accent,
    height: 48,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: SPACING.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    color: COLORS.black,
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: 28,
    textAlign: 'center',
    includeFontPadding: false,
    paddingBottom: 1,
  },
  bottomPad: {
    height: 120,
  },
});
