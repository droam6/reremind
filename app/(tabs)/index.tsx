import { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { useIncome } from '../../hooks/useIncome';
import { usePayments } from '../../hooks/usePayments';
import { useCycleData } from '../../hooks/useCycleData';
import { useCycleHistory } from '../../hooks/useCycleHistory';
import { useLifetimeStats } from '../../hooks/useLifetimeStats';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDate, formatCountdown, parseDate } from '../../utils/formatDate';
import { capitalizeName } from '../../utils/capitalize';
import { getDayPayments, getWeekPayments, getWeekTotal, getBusiestDay, DayPaymentInfo } from '../../utils/calculations';
import { generateId } from '../../utils/generateId';
import { saveIncome } from '../../utils/storage';
import { ProgressRing } from '../../components/dashboard/ProgressRing';
import { WhatIfSimulator } from '../../components/dashboard/WhatIfSimulator';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RING_TRACK_COLOR = '#1A1A1A';

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

function getStatusBadge(remaining: number, income: number): { label: string; color: string } {
  if (remaining === 0) return { label: 'EMPTY', color: COLORS.danger };
  if (income === 0) return { label: 'COMFORTABLE', color: COLORS.accent };
  const ratio = remaining / income;
  if (ratio > 0.3) return { label: 'COMFORTABLE', color: COLORS.accent };
  if (ratio > 0.1) return { label: 'CAREFUL', color: COLORS.warning };
  return { label: 'TIGHT', color: COLORS.danger };
}

function getDotColor(count: number): string | null {
  if (count === 0) return null;
  if (count === 1) return COLORS.accent;
  if (count === 2) return COLORS.warning;
  return COLORS.danger;
}

function getHeatColor(total: number): string {
  if (total === 0) return '#141414';
  if (total <= 50) return '#2A2215';
  if (total <= 200) return '#3D3018';
  if (total <= 500) return 'rgba(212, 145, 58, 0.4)';
  return 'rgba(196, 74, 74, 0.5)';
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}

function daysFromToday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseDate(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatShortDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function freqLabel(freq: string): string {
  switch (freq) {
    case 'weekly': return 'Weekly';
    case 'fortnightly': return 'Fortnightly';
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    case 'yearly': return 'Yearly';
    default: return freq;
  }
}

// Height per payment card in expanded day detail
const EXPANDED_BASE_HEIGHT = 120;
const EXPANDED_EXTRA_PER_PAYMENT = 80;

function getExpandedHeight(paymentCount: number): number {
  if (paymentCount <= 1) return EXPANDED_BASE_HEIGHT;
  return EXPANDED_BASE_HEIGHT + (paymentCount - 1) * EXPANDED_EXTRA_PER_PAYMENT;
}

export default function HomeScreen() {
  // ALL hooks called unconditionally at the top — no early returns
  const router = useRouter();
  const { income, loading: incomeLoading, reload: reloadIncome } = useIncome();
  const { payments, loading: paymentsLoading, reload: reloadPayments } = usePayments();
  const cycleData = useCycleData(income, payments);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const { history, addRecord, reload: reloadHistory } = useCycleHistory();
  const { incrementCyclesCompleted, updateStreak, reload: reloadStats } = useLifetimeStats();
  const cycleRecordedRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      reloadIncome();
      reloadPayments();
      reloadHistory();
      reloadStats();
      setExpandedDay(null);
    }, [reloadIncome, reloadPayments, reloadHistory, reloadStats])
  );

  // Cycle end detection — record completed cycles automatically
  useEffect(() => {
    if (!income || !cycleData || cycleRecordedRef.current) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextPayday = parseDate(income.nextPayday);

    // Check if payday has arrived (today >= nextPayday)
    if (today.getTime() < nextPayday.getTime()) return;

    // Check if we already recorded this cycle
    const endDateStr = income.nextPayday;
    const alreadyRecorded = history.some((r) => r.cycleEndDate === endDateStr);
    if (alreadyRecorded) return;

    cycleRecordedRef.current = true;

    // Record the cycle
    const record = {
      id: generateId(),
      cycleEndDate: endDateStr,
      incomeAmount: income.amount,
      totalCommitted: cycleData.totalCommitted,
      remainingOnPayday: cycleData.remainingAfterBills,
      paymentsCovered: cycleData.cycleOccurrences.length,
      totalPayments: payments.length,
      createdAt: new Date().toISOString(),
    };

    (async () => {
      await addRecord(record);
      await incrementCyclesCompleted();
      await updateStreak(cycleData.remainingAfterBills);

      // Auto-advance payday
      const cycleDaysMap: Record<string, number> = {
        weekly: 7, fortnightly: 14, monthly: 30,
      };
      const days = cycleDaysMap[income.frequency] ?? 30;
      const newPayday = new Date(nextPayday);
      newPayday.setDate(newPayday.getDate() + days);
      const y = newPayday.getFullYear();
      const m = String(newPayday.getMonth() + 1).padStart(2, '0');
      const d = String(newPayday.getDate()).padStart(2, '0');
      const updatedIncome = { ...income, nextPayday: `${y}-${m}-${d}` };
      await saveIncome(updatedIncome);
      reloadIncome();
    })();
  }, [income, cycleData, history, payments, addRecord, incrementCyclesCompleted, updateStreak, reloadIncome]);

  // Calendar expand/collapse animation refs (effect moved after dayPaymentMap)
  const expandHeight = useRef(new Animated.Value(0)).current;
  const expandOpacity = useRef(new Animated.Value(0)).current;
  const expandMargin = useRef(new Animated.Value(0)).current;
  const prevExpandedDay = useRef<string | null>(null);
  const [expandVisible, setExpandVisible] = useState(false);

  // First-mount staggered animations (only on initial mount, not tab switches)
  const isFirstMount = useRef(true);
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const calendarOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isFirstMount.current) return;
    isFirstMount.current = false;
    const easeOut = Easing.out(Easing.cubic);

    Animated.stagger(100, [
      Animated.timing(heroOpacity, {
        toValue: 1, duration: 500, easing: easeOut, useNativeDriver: true,
      }),
      Animated.timing(badgeOpacity, {
        toValue: 1, duration: 400, easing: easeOut, useNativeDriver: true,
      }),
      Animated.timing(calendarOpacity, {
        toValue: 1, duration: 400, easing: easeOut, useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1, duration: 400, easing: easeOut, useNativeDriver: true,
      }),
    ]).start();
  }, [heroOpacity, badgeOpacity, calendarOpacity, contentOpacity]);

  const todayStr = new Date().toISOString().split('T')[0];

  const heatMapData = useMemo(() => {
    if (!cycleData) return [];
    const startDate = parseDate(cycleData.cycleStartDate);
    const cells: { dateStr: string; total: number; isToday: boolean }[] = [];
    for (let i = 0; i < cycleData.cycleDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayTotal = cycleData.cycleOccurrences
        .filter((o) => o.date === ds)
        .reduce((sum, o) => sum + o.payment.amount, 0);
      cells.push({ dateStr: ds, total: dayTotal, isToday: ds === todayStr });
    }
    return cells;
  }, [cycleData, todayStr]);

  // Derived state — safe to compute even when data is missing
  const loading = incomeLoading || paymentsLoading;
  const hasIncome = income !== null && income.amount > 0;
  const hasDashboardData = hasIncome && cycleData !== null && payments.length > 0;

  // Full dashboard derived values (safe defaults when data missing)
  const healthColor = hasDashboardData
    ? getHealthColor(cycleData.remainingAfterBills, income.amount)
    : COLORS.accent;
  const statusBadge = hasDashboardData
    ? getStatusBadge(cycleData.remainingAfterBills, income.amount)
    : { label: 'COMFORTABLE', color: COLORS.accent };
  const ringProgress = hasDashboardData && income.amount > 0
    ? Math.min(1, Math.max(0, cycleData.remainingAfterBills / income.amount))
    : 1;

  const today = new Date();
  const calendarDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
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
  }, [todayStr]);

  const dayPaymentMap = useMemo(() => {
    if (!hasDashboardData) return new Map<string, DayPaymentInfo>();
    return new Map<string, DayPaymentInfo>(
      calendarDays.map((d) => [d.dateStr, getDayPayments(payments, d.dateStr)])
    );
  }, [calendarDays, payments, hasDashboardData]);

  const expandedDayInfo = expandedDay ? dayPaymentMap.get(expandedDay) : undefined;

  // Calendar expand/collapse animation effect
  useEffect(() => {
    if (expandedDay && expandedDay !== prevExpandedDay.current) {
      const dayInfo = dayPaymentMap.get(expandedDay);
      const count = dayInfo?.payments.length ?? 1;
      const targetHeight = getExpandedHeight(count);

      setExpandVisible(true);
      expandHeight.setValue(0);
      expandOpacity.setValue(0);
      expandMargin.setValue(0);
      Animated.parallel([
        Animated.timing(expandHeight, {
          toValue: targetHeight,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(expandOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(expandMargin, {
          toValue: SPACING.lg,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    } else if (!expandedDay && prevExpandedDay.current) {
      Animated.parallel([
        Animated.timing(expandHeight, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(expandOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(expandMargin, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start(() => {
        setExpandVisible(false);
      });
    }
    prevExpandedDay.current = expandedDay;
  }, [expandedDay, dayPaymentMap, expandHeight, expandOpacity, expandMargin]);

  const weekStats = useMemo(() => {
    if (!hasDashboardData) return { count: 0, total: 0, busiest: { date: '', count: 0, total: 0 } };
    const weekPaymentDays = getWeekPayments(payments);
    return {
      count: weekPaymentDays.reduce((sum, d) => sum + d.payments.length, 0),
      total: getWeekTotal(payments),
      busiest: getBusiestDay(payments),
    };
  }, [payments, hasDashboardData]);

  const hasCluster = weekStats.busiest.count >= 2;
  const busiestDayName = weekStats.busiest.date
    ? DAY_NAMES[parseDate(weekStats.busiest.date).getDay()]
    : '';

  const nextPayment = hasDashboardData ? (cycleData.upcomingPayments[0] ?? null) : null;
  const nextPaymentCluster = nextPayment && hasDashboardData
    ? cycleData.paymentClusters.find((c) => c.date === nextPayment.nextDueDate) ?? null
    : null;
  const isNextSoon = nextPayment && (
    nextPayment.nextDueDate === todayStr ||
    nextPayment.nextDueDate === new Date(today.getTime() + 86400000).toISOString().split('T')[0]
  );
  const daysToNext = nextPayment ? daysFromToday(nextPayment.nextDueDate) : null;

  const comingUp = hasDashboardData ? cycleData.upcomingPayments.slice(1, 4) : [];

  const largestPayment = useMemo(() => {
    if (!hasDashboardData) return null;
    const cyclePaymentIds = new Set(cycleData.cycleOccurrences.map((o) => o.payment.id));
    const cycleFiltered = payments.filter((p) => cyclePaymentIds.has(p.id));
    return cycleFiltered.length > 0
      ? [...cycleFiltered].sort((a, b) => b.amount - a.amount)[0]
      : null;
  }, [payments, cycleData, hasDashboardData]);

  // --- Single return — no early returns, just conditional JSX ---

  if (loading) {
    return <View style={styles.container} />;
  }

  if (!hasIncome) {
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

  if (!hasDashboardData) {
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
            trackStrokeWidth={8}
            color={COLORS.accent}
            trackColor={RING_TRACK_COLOR}
          >
            <Text style={styles.ringLabel}>LEFT AFTER BILLS</Text>
            <Text style={[styles.ringNumber, { color: COLORS.accent }]}>
              {formatCurrency(income.amount)}
            </Text>
            <Text style={styles.ringSub}>
              {cycleData ? formatCountdown(cycleData.daysUntilPayday) : ''}
            </Text>
            <Text style={[styles.statusBadge, { color: COLORS.accent }]}>
              COMFORTABLE
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
      </View>

      {/* 2. Progress Ring with safe badge */}
      <Animated.View style={[styles.heroZone, { opacity: heroOpacity }]}>
        <ProgressRing
          progress={ringProgress}
          size={240}
          strokeWidth={10}
          trackStrokeWidth={8}
          color={healthColor}
          trackColor={RING_TRACK_COLOR}
        >
          <Text style={styles.ringLabel}>LEFT AFTER BILLS</Text>
          <Text style={[styles.ringNumber, { color: healthColor }]}>
            {formatCurrency(cycleData.remainingAfterBills)}
          </Text>
          <Text style={styles.ringSub}>
            {formatCountdown(cycleData.daysUntilPayday)}
          </Text>
          <Animated.Text style={[styles.statusBadge, { color: statusBadge.color, opacity: badgeOpacity }]}>
            {statusBadge.label}
          </Animated.Text>
        </ProgressRing>
      </Animated.View>

      {/* 3. 7-Day Calendar Strip */}
      <Animated.View style={[styles.calendarStrip, { opacity: calendarOpacity }]}>
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
      </Animated.View>

      {/* Expanded day detail */}
      {expandVisible && (
        <Animated.View style={[styles.expandedDay, { height: expandHeight, opacity: expandOpacity, marginBottom: expandMargin }]}>
          {expandedDayInfo && expandedDayInfo.payments.length > 0 && (
            <>
              {expandedDayInfo.payments.length > 1 && (
                <View style={styles.expandedSummary}>
                  <Text style={styles.expandedSummaryText}>
                    {expandedDayInfo.payments.length} payments · {formatCurrency(expandedDayInfo.total)}
                  </Text>
                </View>
              )}
              {expandedDayInfo.payments.map((p, i) => (
                <View key={p.id}>
                  <View style={styles.expandedCard}>
                    <View style={styles.expandedCardTop}>
                      <Text style={styles.expandedName}>{capitalizeName(p.name)}</Text>
                      <Text style={styles.expandedAmount}>{formatCurrency(p.amount)}</Text>
                    </View>
                    <View style={styles.expandedCardBottom}>
                      <View style={styles.expandedCategoryPill}>
                        <Text style={styles.expandedCategoryText}>{p.category.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.expandedFrequency}>{freqLabel(p.frequency)}</Text>
                      <Text style={styles.expandedDue}>Due {formatRelativeDate(p.nextDueDate)}</Text>
                    </View>
                  </View>
                  {i < expandedDayInfo.payments.length - 1 && <View style={styles.expandedSeparator} />}
                </View>
              ))}
            </>
          )}
        </Animated.View>
      )}

      {/* Everything below fades in together */}
      <Animated.View style={{ opacity: contentOpacity }}>

      {/* 4. Danger Days Heat Map */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PAY CYCLE</Text>
        <View style={styles.heatMapContainer}>
          {heatMapData.map((cell, i) => (
            <View
              key={cell.dateStr}
              style={[
                styles.heatCell,
                {
                  backgroundColor: getHeatColor(cell.total),
                  flex: 1,
                  marginLeft: i === 0 ? 0 : 1,
                },
                cell.isToday && styles.heatCellToday,
              ]}
            />
          ))}
        </View>
        <View style={styles.heatLabels}>
          <Text style={styles.heatLabel}>{formatShortDate(cycleData.cycleStartDate)}</Text>
          <Text style={styles.heatLabel}>Next payday</Text>
        </View>
      </View>

      {/* 5. Next Payment Card */}
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
                      {nextPaymentCluster.payments.length} {plural(nextPaymentCluster.payments.length, 'payment')}
                    </Text>
                    <Text style={styles.nextPaymentDate}>
                      {formatCurrency(nextPaymentCluster.total)} hitting {formatRelativeDate(nextPaymentCluster.date)}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.nextPaymentName}>{capitalizeName(nextPayment.name)}</Text>
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

      {/* 6. This Week Snapshot */}
      {weekStats.count > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>THIS WEEK</Text>
          <View style={styles.weekCard}>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatNumber}>{weekStats.count}</Text>
              <Text style={styles.weekStatLabel}>{plural(weekStats.count, 'payment')}</Text>
            </View>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatNumber}>{formatCurrency(weekStats.total)}</Text>
              <Text style={styles.weekStatLabel}>due</Text>
            </View>
            <View style={styles.weekStat}>
              {hasCluster ? (
                <>
                  <Text style={[styles.weekStatNumber, { color: COLORS.warning }]}>
                    {weekStats.busiest.count} on {busiestDayName}
                  </Text>
                  <Text style={styles.weekStatLabel}>busiest day</Text>
                </>
              ) : (
                <>
                  <Text style={styles.weekStatNumber}>
                    {daysToNext !== null ? `${daysToNext} ${plural(daysToNext, 'day')}` : '0 days'}
                  </Text>
                  <Text style={styles.weekStatLabel}>next payment</Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 7. Coming Up */}
      {comingUp.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>COMING UP</Text>
          {comingUp.map((payment, index) => (
            <View key={payment.id + '-' + index}>
              <View style={styles.listRow}>
                <View style={styles.listRowLeft}>
                  <View style={styles.listRowTop}>
                    <Text style={styles.listRowName}>{capitalizeName(payment.name)}</Text>
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
                <View style={styles.listRowRight}>
                  <Text style={styles.listRowAmount}>
                    {formatCurrency(payment.amount)}
                  </Text>
                  {payment.isSplit && payment.fullAmount && payment.splitCount && (
                    <Text style={styles.splitCaption}>
                      1/{payment.splitCount} of {formatCurrency(payment.fullAmount)}
                    </Text>
                  )}
                </View>
              </View>
              {index < comingUp.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      )}

      {/* 8. What If Simulator */}
      <WhatIfSimulator
        remainingAfterBills={cycleData.remainingAfterBills}
        incomeAmount={income.amount}
        daysUntilPayday={cycleData.daysUntilPayday}
      />

      {/* 9. This Cycle Summary */}
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
              {capitalizeName(largestPayment.name)} · {formatCurrency(largestPayment.amount)}
            </Text>
          </View>
        )}
      </View>

      </Animated.View>

      {/* 10. Bottom padding */}
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
    paddingTop: SPACING.md,
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
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 3,
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
    marginBottom: 4,
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
    marginTop: 4,
  },

  // Expanded day
  expandedDay: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    overflow: 'hidden',
  },
  expandedSummary: {
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  expandedSummaryText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.bold,
  },
  expandedCard: {
    paddingVertical: SPACING.sm,
  },
  expandedCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  expandedName: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
  },
  expandedAmount: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
  },
  expandedCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  expandedCategoryPill: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.subtle,
  },
  expandedCategoryText: {
    color: COLORS.textTertiary,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  expandedFrequency: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
  },
  expandedDue: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
  },
  expandedSeparator: {
    height: 1,
    backgroundColor: COLORS.surfaceLight,
  },

  // Heat map
  heatMapContainer: {
    flexDirection: 'row',
    height: 32,
    marginBottom: SPACING.sm,
  },
  heatCell: {
    height: 32,
  },
  heatCellToday: {
    borderTopWidth: 2,
    borderTopColor: COLORS.text,
  },
  heatLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatLabel: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.caption,
  },

  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },

  // Next payment card
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
    padding: 20,
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
  listRowRight: {
    alignItems: 'flex-end' as const,
  },
  listRowAmount: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
  },
  splitCaption: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.caption,
    marginTop: 2,
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
