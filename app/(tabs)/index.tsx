import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { useIncome } from '../../hooks/useIncome';
import { usePayments } from '../../hooks/usePayments';
import { useCycleData } from '../../hooks/useCycleData';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDate, formatCountdown } from '../../utils/formatDate';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatHeaderDate(): string {
  const now = new Date();
  return `${DAY_NAMES[now.getDay()]} ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`;
}

function getHeroColor(remaining: number, income: number): string {
  if (income === 0) return COLORS.safe;
  const ratio = remaining / income;
  if (ratio > 0.3) return COLORS.safe;
  if (ratio > 0.1) return COLORS.warning;
  return COLORS.danger;
}

export default function HomeScreen() {
  const router = useRouter();
  const { income, loading: incomeLoading, reload: reloadIncome } = useIncome();
  const { payments, loading: paymentsLoading, reload: reloadPayments } = usePayments();
  const cycleData = useCycleData(income, payments);

  useFocusEffect(
    useCallback(() => {
      reloadIncome();
      reloadPayments();
    }, [reloadIncome, reloadPayments])
  );

  const loading = incomeLoading || paymentsLoading;

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // No income set up
  if (!income || income.amount === 0) {
    return (
      <View style={[styles.container, styles.centred]}>
        <Text style={styles.emptyText}>Set up your income to get started</Text>
        <Pressable
          style={styles.setupButton}
          onPress={() => router.push('/onboarding/welcome')}
        >
          <Text style={styles.setupButtonText}>GO TO SETUP</Text>
        </Pressable>
      </View>
    );
  }

  // Income exists but no payments
  if (!cycleData || payments.length === 0) {
    const daysUntilPayday = cycleData?.daysUntilPayday ?? 1;
    const dailyAmount = daysUntilPayday > 0 ? income.amount / daysUntilPayday : income.amount;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
        </View>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>LEFT AFTER BILLS</Text>
          <Text style={[styles.heroNumber, { color: COLORS.safe }]}>
            {formatCurrency(income.amount)}
          </Text>
          <Text style={styles.heroSub}>
            {cycleData ? formatCountdown(cycleData.daysUntilPayday) : ''}
          </Text>
          {cycleData && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${cycleData.cycleProgress * 100}%` }]} />
            </View>
          )}
        </View>
        <Text style={styles.addPaymentsHint}>
          Add payments to see what's really left
        </Text>
        <View style={styles.bottomPad} />
      </ScrollView>
    );
  }

  // Full dashboard
  const heroColor = getHeroColor(cycleData.remainingAfterBills, income.amount);
  const nextPayment = cycleData.upcomingPayments[0] ?? null;
  const comingUp = cycleData.upcomingPayments.slice(nextPayment ? 1 : 0, nextPayment ? 4 : 3);
  const largestPayment = [...payments].sort((a, b) => b.amount - a.amount)[0] ?? null;

  const nextPaymentCluster = nextPayment
    ? cycleData.paymentClusters.find((c) => c.date === nextPayment.nextDueDate)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
      </View>

      {/* Hero zone */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>LEFT AFTER BILLS</Text>
        <Text style={[styles.heroNumber, { color: heroColor }]}>
          {formatCurrency(cycleData.remainingAfterBills)}
        </Text>
        <Text style={styles.heroSub}>
          {formatCountdown(cycleData.daysUntilPayday)}
        </Text>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${cycleData.cycleProgress * 100}%` }]}
          />
        </View>
      </View>

      {/* Next payment card */}
      {nextPayment && (
        <View style={styles.section}>
          <View style={[
            styles.nextPaymentCard,
            nextPaymentCluster && styles.nextPaymentCardCluster,
          ]}>
            {nextPaymentCluster && <View style={styles.clusterBar} />}
            <View style={styles.nextPaymentContent}>
              <View style={styles.nextPaymentLeft}>
                {nextPaymentCluster ? (
                  <>
                    <Text style={styles.nextPaymentName}>
                      {nextPaymentCluster.payments.length} payments
                    </Text>
                    <Text style={styles.nextPaymentDate}>
                      {formatCurrency(nextPaymentCluster.total)} hitting {formatRelativeDate(nextPaymentCluster.date)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.nextPaymentName}>{nextPayment.name}</Text>
                    <Text style={styles.nextPaymentDate}>
                      {formatRelativeDate(nextPayment.nextDueDate)}
                    </Text>
                  </>
                )}
              </View>
              <Text style={styles.nextPaymentAmount}>
                {formatCurrency(nextPaymentCluster ? nextPaymentCluster.total : nextPayment.amount)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Coming up */}
      {comingUp.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>COMING UP</Text>
          {comingUp.map((payment, index) => (
            <View key={payment.id + '-' + index}>
              <View style={styles.listRow}>
                <View style={styles.listRowLeft}>
                  <Text style={styles.listRowName}>{payment.name}</Text>
                  <Text style={styles.listRowDate}>
                    {formatRelativeDate(payment.nextDueDate)}
                  </Text>
                </View>
                <Text style={styles.listRowAmount}>
                  {formatCurrency(payment.amount)}
                </Text>
              </View>
              {index < comingUp.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      )}

      {/* This cycle summary */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>THIS CYCLE</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total committed</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(cycleData.totalCommitted)}
          </Text>
        </View>
        {largestPayment && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Largest payment</Text>
            <Text style={styles.summaryValue}>
              {largestPayment.name} · {formatCurrency(largestPayment.amount)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
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
    paddingHorizontal: SPACING.lg,
  },
  content: {
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    marginTop: SPACING.xxxl,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.lg,
  },
  setupButton: {
    backgroundColor: COLORS.accent,
    height: 48,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addPaymentsHint: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  header: {
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerDate: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
  },
  hero: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  heroLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  heroNumber: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.heavy,
    marginBottom: SPACING.xs,
  },
  heroSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.heroSub,
    marginBottom: SPACING.lg,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: COLORS.surface,
  },
  progressFill: {
    height: 2,
    backgroundColor: COLORS.accent,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  nextPaymentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 0,
    overflow: 'hidden',
  },
  nextPaymentCardCluster: {
    flexDirection: 'row',
  },
  clusterBar: {
    width: 3,
    backgroundColor: COLORS.warning,
  },
  nextPaymentContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  nextPaymentLeft: {
    flex: 1,
  },
  nextPaymentName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  nextPaymentDate: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
  },
  nextPaymentAmount: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  listRowLeft: {
    flex: 1,
  },
  listRowName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    marginBottom: SPACING.xs,
  },
  listRowDate: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
  },
  listRowAmount: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.surface,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
  },
  bottomPad: {
    height: SPACING.xxxl,
  },
});
