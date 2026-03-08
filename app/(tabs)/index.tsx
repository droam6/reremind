import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { useIncome } from '../../hooks/useIncome';
import { usePayments } from '../../hooks/usePayments';
import { useCycleData } from '../../hooks/useCycleData';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDate, formatCountdown } from '../../utils/formatDate';
import { getDayPayments, getWeekPayments, getWeekTotal, getBusiestDay } from '../../utils/calculations';
import { ProgressRing } from '../../components/dashboard/ProgressRing';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatHeaderDate(): string {
  const now = new Date();
  return `${DAY_NAMES[now.getDay()]} ${now.getDate()} ${MONTH_NAMES[now.getMonth()]}`;
}

function getHealthColor(remaining: number, income: number): string {
  if (income === 0) return COLORS.accent;
  const ratio = remaining / income;
  if (ratio > 0.3) return COLORS.accent;
  if (ratio > 0.1) return COLORS.warning;
  return COLORS.danger;
}

function getDotColor(count: number): string | null {
  if (count === 0) return null;
  if (count === 1) return COLORS.accent;
  if (count === 2) return COLORS.warning;
  return COLORS.danger;
}

export default function HomeScreen() {
  const router = useRouter();
  const { income, loading: incomeLoading, reload: reloadIncome } = useIncome();
  const { payments, loading: paymentsLoading, reload: reloadPayments } = usePayments();
  const cycleData = useCycleData(income, payments);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      reloadIncome();
      reloadPayments();
      setExpandedDay(null);
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

  if (!cycleData || payments.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
        </View>
        <View style={styles.heroZone}>
          <ProgressRing
            progress={1}
            size={240}
            strokeWidth={10}
            color={COLORS.accent}
            trackColor={COLORS.surfaceLight}
          >
            <Text style={styles.ringLabel}>LEFT AFTER BILLS</Text>
            <Text style={[styles.ringNumber, { color: COLORS.accent }]}>
              {formatCurrency(income.amount)}
            </Text>
            <Text style={styles.ringSub}>
              {cycleData ? formatCountdown(cycleData.daysUntilPayday) : ''}
            </Text>
          </ProgressRing>
        </View>
        <Text style={styles.addPaymentsHint}>
          Add payments to see what's really left
        </Text>
        <View style={styles.bottomPad} />
      </ScrollView>
    );
  }

  // Full dashboard
  const healthColor = getHealthColor(cycleData.remainingAfterBills, income.amount);
  const ringProgress = income.amount > 0
    ? Math.min(1, Math.max(0, cycleData.remainingAfterBills / income.amount))
    : 0;

  // Calendar strip data
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      date: d,
      dateStr: d.toISOString().split('T')[0],
      dayLabel: DAY_LABELS[d.getDay()],
      dateNum: d.getDate(),
      isToday: i === 0,
    };
  });
  const dayPaymentMap = new Map(
    calendarDays.map((d) => [d.dateStr, getDayPayments(payments, d.dateStr)])
  );

  // Expanded day data
  const expandedDayInfo = expandedDay ? dayPaymentMap.get(expandedDay) : null;

  // Week snapshot
  const weekPaymentDays = getWeekPayments(payments);
  const weekPaymentCount = weekPaymentDays.reduce((sum, d) => sum + d.payments.length, 0);
  const weekTotal = getWeekTotal(payments);
  const busiest = getBusiestDay(payments);

  // Next payment
  const nextPayment = cycleData.upcomingPayments[0] ?? null;
  const nextPaymentCluster = nextPayment
    ? cycleData.paymentClusters.find((c) => c.date === nextPayment.nextDueDate)
    : null;
  const isNextSoon = nextPayment && (
    nextPayment.nextDueDate === todayStr ||
    nextPayment.nextDueDate === new Date(today.getTime() + 86400000).toISOString().split('T')[0]
  );

  // Coming up (skip first if it's the next payment card)
  const comingUp = cycleData.upcomingPayments.slice(1, 4);

  // Largest payment
  const largestPayment = [...payments].sort((a, b) => b.amount - a.amount)[0] ?? null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Section 1: Header */}
      <View style={styles.header}>
        <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
      </View>

      {/* Section 2: Progress Ring */}
      <View style={styles.heroZone}>
        <ProgressRing
          progress={ringProgress}
          size={240}
          strokeWidth={10}
          color={healthColor}
          trackColor={COLORS.surfaceLight}
        >
          <Text style={styles.ringLabel}>LEFT AFTER BILLS</Text>
          <Text style={[styles.ringNumber, { color: healthColor }]}>
            {formatCurrency(cycleData.remainingAfterBills)}
          </Text>
          <Text style={styles.ringSub}>
            {formatCountdown(cycleData.daysUntilPayday)}
          </Text>
        </ProgressRing>
      </View>

      {/* Section 3: 7-Day Calendar Strip */}
      <View style={styles.calendarStrip}>
        {calendarDays.map((day) => {
          const dayInfo = dayPaymentMap.get(day.dateStr);
          const dotColor = getDotColor(dayInfo?.payments.length ?? 0);
          const hasDayPayments = (dayInfo?.payments.length ?? 0) > 0;
          return (
            <Pressable
              key={day.dateStr}
              style={styles.calendarCell}
              onPress={() => {
                if (hasDayPayments) {
                  setExpandedDay(expandedDay === day.dateStr ? null : day.dateStr);
                }
              }}
            >
              <Text style={styles.calendarDayLabel}>{day.dayLabel}</Text>
              <Text style={[
                styles.calendarDateNum,
                day.isToday && styles.calendarDateNumToday,
              ]}>
                {day.dateNum}
              </Text>
              {day.isToday && <View style={styles.todayDot} />}
              {dotColor && <View style={[styles.paymentDot, { backgroundColor: dotColor }]} />}
            </Pressable>
          );
        })}
      </View>

      {/* Expanded day detail */}
      {expandedDayInfo && expandedDayInfo.payments.length > 0 && (
        <View style={styles.expandedDay}>
          {expandedDayInfo.payments.map((p) => (
            <View key={p.id} style={styles.expandedRow}>
              <Text style={styles.expandedName}>{p.name}</Text>
              <Text style={styles.expandedAmount}>{formatCurrency(p.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Section 4: Next Payment Card */}
      {nextPayment && (
        <View style={styles.section}>
          <View style={[
            styles.nextPaymentCard,
            (isNextSoon || nextPaymentCluster) && styles.nextPaymentCardWarning,
          ]}>
            {(isNextSoon || nextPaymentCluster) && <View style={styles.warningBar} />}
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

      {/* Section 5: This Week Snapshot */}
      {weekPaymentCount > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>THIS WEEK</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatNumber}>{weekPaymentCount}</Text>
              <Text style={styles.weekStatLabel}>payments</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatNumber}>{formatCurrency(weekTotal)}</Text>
              <Text style={styles.weekStatLabel}>due</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={[
                styles.weekStatNumber,
                busiest.count > 1 && { color: COLORS.warning },
              ]}>
                {busiest.count}
              </Text>
              <Text style={styles.weekStatLabel}>busiest day</Text>
            </View>
          </View>
        </View>
      )}

      {/* Section 6: Coming Up */}
      {comingUp.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>COMING UP</Text>
          {comingUp.map((payment, index) => (
            <View key={payment.id + '-' + index}>
              <View style={styles.listRow}>
                <View style={styles.listRowLeft}>
                  <View style={styles.listRowTop}>
                    <Text style={styles.listRowName}>{payment.name}</Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {payment.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
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

      {/* Section 7: This Cycle Summary */}
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
    paddingBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerDate: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
  },

  // Hero / Ring
  heroZone: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  ringLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  ringNumber: {
    fontSize: 42,
    fontWeight: FONT_WEIGHTS.heavy,
    marginBottom: SPACING.xs,
  },
  ringSub: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
  },

  // Calendar strip
  calendarStrip: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  calendarCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  calendarDayLabel: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.caption,
    marginBottom: SPACING.xs,
  },
  calendarDateNum: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
  },
  calendarDateNumToday: {
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.bold,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginBottom: 2,
  },
  paymentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // Expanded day
  expandedDay: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  expandedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  expandedName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.bodySmall,
  },
  expandedAmount: {
    color: COLORS.text,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Next payment
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
  nextPaymentCardWarning: {
    flexDirection: 'row',
  },
  warningBar: {
    width: 2,
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
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Week snapshot
  weekCard: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    padding: 20,
    borderRadius: 0,
  },
  weekStat: {
    flex: 1,
    alignItems: 'center',
  },
  weekStatNumber: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  weekStatLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
  },

  // Coming up list
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  listRowLeft: {
    flex: 1,
  },
  listRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  listRowName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
  },
  categoryBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.subtle,
  },
  categoryBadgeText: {
    color: COLORS.textTertiary,
    fontSize: 10,
    textTransform: 'uppercase',
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
    backgroundColor: COLORS.surfaceLight,
  },

  // Cycle summary
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
    height: 80,
  },
});
