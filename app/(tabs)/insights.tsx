import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { SPACING, FONT_SIZES, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { useLifetimeStats } from '../../hooks/useLifetimeStats';
import { useCycleHistory } from '../../hooks/useCycleHistory';
import { usePayments } from '../../hooks/usePayments';
import { useUser } from '../../hooks/useUser';
import { useIncome } from '../../hooks/useIncome';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDate, parseDate } from '../../utils/formatDate';
import { capitalizeName } from '../../utils/capitalize';
import { formatCategoryName } from '../../utils/categoryDisplay';
import { PremiumGate } from '../../components/ui/PremiumGate';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTenure(firstUsedDate: string): string {
  const start = parseDate(firstUsedDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / 86400000));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day';
  if (diffDays < 30) return `${diffDays} days`;
  const months = Math.floor(diffDays / 30);
  if (months === 1) return '1 month';
  return `${months} months`;
}

function plural(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].substring(0, 3)}`;
}

interface LineChartProps {
  data: Array<{ date: string; value: number }>;
  width: number;
  height: number;
  colors: any;
}

function LineChart({ data, width, height, colors }: LineChartProps) {
  if (data.length === 0) return null;

  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map((d) => d.value), 100);
  const minValue = Math.min(...data.map((d) => d.value), 0);
  const valueRange = maxValue - minValue || 100;

  const xStep = chartWidth / (data.length - 1 || 1);

  const getX = (index: number) => padding.left + index * xStep;
  const getY = (value: number) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

  // Build line path
  let pathD = '';
  data.forEach((point, i) => {
    const x = getX(i);
    const y = getY(point.value);
    if (i === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      pathD += ` L ${x} ${y}`;
    }
  });

  // Build area path (fill below line)
  let areaD = pathD;
  if (data.length > 0) {
    areaD += ` L ${getX(data.length - 1)} ${padding.top + chartHeight}`;
    areaD += ` L ${getX(0)} ${padding.top + chartHeight}`;
    areaD += ' Z';
  }

  // Grid lines (4 horizontal lines)
  const gridLines = [0, 0.33, 0.66, 1].map((ratio) => ({
    y: padding.top + chartHeight * (1 - ratio),
    value: Math.round(minValue + valueRange * ratio),
  }));

  // Determine trend: gold if improving, amber if declining
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const lineColor = lastValue >= firstValue ? colors.accent : colors.warning;

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      {gridLines.map((line, i) => (
        <Line
          key={i}
          x1={padding.left}
          y1={line.y}
          x2={padding.left + chartWidth}
          y2={line.y}
          stroke={colors.chartGrid}
          strokeWidth="1"
        />
      ))}

      {/* Area fill */}
      <Path d={areaD} fill={lineColor} fillOpacity="0.06" />

      {/* Line */}
      <Path d={pathD} stroke={lineColor} strokeWidth="2" fill="none" />

      {/* Data points */}
      {data.map((point, i) => (
        <Circle
          key={i}
          cx={getX(i)}
          cy={getY(point.value)}
          r="5"
          fill={lineColor}
        />
      ))}

      {/* X-axis labels */}
      {data.map((point, i) => {
        // Only show labels for first, middle, and last points
        if (i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) {
          return (
            <SvgText
              key={`label-${i}`}
              x={getX(i)}
              y={padding.top + chartHeight + 20}
              fill={colors.textTertiary}
              fontSize="10"
              fontFamily={FONTS.light}
              textAnchor="middle"
            >
              {formatShortDate(point.date)}
            </SvgText>
          );
        }
        return null;
      })}

      {/* Y-axis labels */}
      {gridLines.filter((_, i) => i === 0 || i === gridLines.length - 1).map((line, i) => (
        <SvgText
          key={`y-${i}`}
          x={padding.left - 10}
          y={line.y + 4}
          fill={colors.textTertiary}
          fontSize="10"
          fontFamily={FONTS.light}
          textAnchor="end"
        >
          ${line.value}
        </SvgText>
      ))}
    </Svg>
  );
}

interface DonutChartProps {
  data: Array<{ category: string; amount: number; color: string }>;
  size: number;
  strokeWidth: number;
}

function DonutChart({ data, size, strokeWidth }: DonutChartProps) {
  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.amount, 0);
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Add 2px gap between segments (in circumference units)
  const gapSize = 2;
  const totalGaps = data.length * gapSize;
  const usableCircumference = circumference - totalGaps;

  let cumulativeOffset = 0;

  return (
    <Svg width={size} height={size}>
      {data.map((segment, i) => {
        const percentage = segment.amount / total;
        const segmentLength = percentage * usableCircumference;

        // strokeDasharray: [segmentLength, rest of circle]
        const dashArray = `${segmentLength} ${circumference - segmentLength}`;

        // strokeDashoffset: rotate to position this segment after previous segments
        // Start at top (12 o'clock) by offsetting by quarter circle
        const dashOffset = -circumference / 4 + cumulativeOffset;

        cumulativeOffset -= (segmentLength + gapSize);

        return (
          <Circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
          />
        );
      })}
    </Svg>
  );
}

interface BarChartProps {
  data: Array<{ label: string; income: number; committed: number }>;
  width: number;
  height: number;
  colors: any;
}

function BarChart({ data, width, height, colors }: BarChartProps) {
  if (data.length === 0) return null;

  const padding = { top: 10, right: 20, bottom: 30, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.flatMap((d) => [d.income, d.committed]), 1000);
  const barWidth = 24;
  const barGap = 4;
  const groupGap = 32;
  const groupWidth = barWidth * 2 + barGap;
  const totalGroupsWidth = groupWidth * data.length + groupGap * (data.length - 1);
  const startX = padding.left + (chartWidth - totalGroupsWidth) / 2;

  const baselineY = padding.top + chartHeight;

  return (
    <Svg width={width} height={height}>
      {/* Baseline */}
      <Line
        x1={padding.left}
        y1={baselineY}
        x2={padding.left + chartWidth}
        y2={baselineY}
        stroke={colors.cardBorder}
        strokeWidth="1"
      />

      {/* Bars and labels */}
      {data.map((group, i) => {
        const groupX = startX + i * (groupWidth + groupGap);

        const incomeHeight = (group.income / maxValue) * chartHeight;
        const committedHeight = (group.committed / maxValue) * chartHeight;

        const incomeY = baselineY - incomeHeight;
        const committedY = baselineY - committedHeight;

        return (
          <>
            {/* Income bar (opacity) */}
            <Rect
              key={`income-${i}`}
              x={groupX}
              y={incomeY}
              width={barWidth}
              height={incomeHeight}
              fill={colors.accent}
              fillOpacity="0.3"
            />
            {/* Committed bar (solid) */}
            <Rect
              key={`committed-${i}`}
              x={groupX + barWidth + barGap}
              y={committedY}
              width={barWidth}
              height={committedHeight}
              fill={colors.accent}
            />
            {/* X-axis label */}
            <SvgText
              key={`label-${i}`}
              x={groupX + groupWidth / 2}
              y={baselineY + 20}
              fill={colors.textTertiary}
              fontSize="10"
              fontFamily={FONTS.light}
              textAnchor="middle"
            >
              {group.label}
            </SvgText>
          </>
        );
      })}
    </Svg>
  );
}

export default function InsightsScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { user } = useUser();
  const { income } = useIncome();
  const { stats, loading: statsLoading, reload: reloadStats } = useLifetimeStats();
  const { history, loading: historyLoading, reload: reloadHistory } = useCycleHistory();
  const { payments, loading: paymentsLoading, reload: reloadPayments } = usePayments();
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const isPremium = user?.isPremium ?? false;

  useFocusEffect(
    useCallback(() => {
      reloadStats();
      reloadHistory();
      reloadPayments();
    }, [reloadStats, reloadHistory, reloadPayments])
  );

  const loading = statsLoading || historyLoading || paymentsLoading;

  // BNPL payments
  const bnplPayments = payments.filter((p) => p.category === 'bnpl');
  const bnplTotal = bnplPayments.reduce((sum, p) => sum + p.amount, 0);
  const nextBnpl = bnplPayments.length > 0
    ? [...bnplPayments].sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))[0]
    : null;

  // Spending breakdown by category
  const categoryColors: Record<string, string> = {
    rent: colors.accent,
    utilities: colors.accentDim,
    subscriptions: colors.textSecondary,
    bnpl: colors.warning,
    insurance: colors.safe,
    transport: colors.danger,
    groceries: colors.textSecondary,
    other: colors.textTertiary,
  };

  const spendingByCategory = payments.reduce((acc, p) => {
    const existing = acc.find((item) => item.category === p.category);
    if (existing) {
      existing.amount += p.amount;
    } else {
      acc.push({
        category: p.category,
        amount: p.amount,
        color: categoryColors[p.category] || categoryColors.other,
      });
    }
    return acc;
  }, [] as Array<{ category: string; amount: number; color: string }>);

  spendingByCategory.sort((a, b) => b.amount - a.amount);
  const totalMonthlyCommitted = spendingByCategory.reduce((sum, c) => sum + c.amount, 0);

  // Monthly comparison (last 3 months) - derive from cycle history
  const monthlyData: Array<{ label: string; income: number; committed: number }> = [];
  const now = new Date();

  // Group cycles by month
  const cyclesByMonth = new Map<string, typeof history>();
  history.forEach((cycle) => {
    const cycleDate = new Date(cycle.cycleEndDate);
    const monthKey = `${cycleDate.getFullYear()}-${cycleDate.getMonth()}`;
    if (!cyclesByMonth.has(monthKey)) {
      cyclesByMonth.set(monthKey, []);
    }
    cyclesByMonth.get(monthKey)!.push(cycle);
  });

  for (let i = 2; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = MONTH_NAMES[monthDate.getMonth()];
    const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;

    // Get cycles for this month
    const monthCycles = cyclesByMonth.get(monthKey) || [];

    // Average committed amount for cycles in this month
    const avgCommitted = monthCycles.length > 0
      ? Math.round(monthCycles.reduce((sum, c) => sum + c.totalCommitted, 0) / monthCycles.length)
      : totalMonthlyCommitted; // fallback to current if no data

    monthlyData.push({
      label: monthLabel,
      income: income.amount || 2100,
      committed: avgCommitted,
    });
  }

  // Cycle history chart data
  const cycleChartData = history.map((record) => ({
    date: record.cycleEndDate,
    value: record.remainingOnPayday,
  }));

  const averageRemaining = history.length > 0
    ? Math.round(history.reduce((sum, r) => sum + r.remainingOnPayday, 0) / history.length)
    : 0;

  const lastCycle = history.length > 0 ? history[history.length - 1] : null;
  const secondLastCycle = history.length > 1 ? history[history.length - 2] : null;
  const cycleDiff = lastCycle && secondLastCycle
    ? lastCycle.remainingOnPayday - secondLastCycle.remainingOnPayday
    : 0;
  const isImproving = cycleDiff > 0;

  if (loading) {
    return <View style={styles.container} />;
  }

  const tenure = stats?.firstUsedDate ? formatTenure(stats.firstUsedDate) : '0 days';
  const currentStreak = stats?.currentStreak ?? 0;
  const bestStreak = stats?.bestStreak ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.pageTitle}>INSIGHTS</Text>

      {/* Section 1: Lifetime Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ALL TIME</Text>
        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {formatCurrency(stats?.totalAmountWatched ?? 0)}
            </Text>
            <Text style={styles.statLabel}>bills watched</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>
              {stats?.cyclesCompleted ?? 0}
            </Text>
            <Text style={styles.statLabel}>{plural(stats?.cyclesCompleted ?? 0, 'cycle')}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{tenure}</Text>
            <Text style={styles.statLabel}>with RE-REMIND</Text>
          </View>
        </View>
      </View>

      {/* Section 2: Streak */}
      <View style={styles.section}>
        <View style={styles.streakCard}>
          {currentStreak > 0 ? (
            <View style={styles.streakRow}>
              <Text style={styles.streakIcon}>🔥</Text>
              <View style={styles.streakContent}>
                <Text style={styles.streakText}>
                  {currentStreak} {plural(currentStreak, 'cycle')} without hitting $0
                </Text>
              </View>
              <Text style={styles.streakBest}>Best: {bestStreak}</Text>
            </View>
          ) : (
            <Text style={styles.streakEmpty}>
              Start your streak by making it to payday with money left
            </Text>
          )}
        </View>
      </View>

      {/* Section 3: Cycle History Line Chart (premium) */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>YOUR PROGRESS</Text>
        {isPremium ? (
          <View style={styles.chartContainer}>
            {history.length === 0 ? (
              <View style={styles.chartEmpty}>
                <Text style={styles.chartEmptyText}>
                  Complete a pay cycle to see your progress here
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.chartTitle}>Money left on payday</Text>
                <LineChart data={cycleChartData} width={340} height={200} colors={colors} />
                <Text style={styles.chartCaption}>
                  Your average: {formatCurrency(averageRemaining)}/cycle
                </Text>
                <Text style={[styles.trendIndicator, { color: isImproving ? colors.accent : '#D4913A' }]}>
                  {isImproving ? '↑' : '↓'} {isImproving ? 'Improving' : 'Declining'}
                </Text>
              </>
            )}
          </View>
        ) : (
          <View style={styles.chartPlaceholder}>
            <View style={styles.chartBlur}>
              {/* Fake chart bars for visual effect */}
              <View style={styles.fakeChartRow}>
                {[40, 65, 50, 80, 55, 70, 90].map((h, i) => (
                  <View
                    key={i}
                    style={[styles.fakeBar, { height: h, opacity: 0.15 }]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.chartOverlay}>
              <Text style={styles.chartOverlayTitle}>See how you're improving</Text>
              <Text style={styles.chartOverlayDesc}>
                Track your money left on payday over time
              </Text>
              <Pressable
                style={styles.premiumButton}
                onPress={() => setShowPremiumGate(true)}
              >
                <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
              </Pressable>
            </View>
          </View>
        )}
        {/* Conversational insight for line chart */}
        {isPremium && history.length > 0 && (
          <Text style={styles.conversationalInsight}>
            {isImproving
              ? "You've been keeping more money each cycle. That's not luck — that's awareness."
              : lastCycle && secondLastCycle && lastCycle.remainingOnPayday < secondLastCycle.remainingOnPayday
              ? "Things have been tighter lately. That's okay — knowing is the first step."
              : "You've been consistent. Steady is good."}
          </Text>
        )}
      </View>

      {/* Section 4: Spending Breakdown Donut Chart (premium) */}
      {isPremium && spendingByCategory.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>WHERE IT GOES</Text>
          <View style={styles.chartContainer}>
            <View style={styles.donutContainer}>
              <DonutChart data={spendingByCategory} size={180} strokeWidth={24} />
              <View style={styles.donutCenter}>
                <Text style={styles.donutCenterAmount}>
                  {formatCurrency(Math.round(totalMonthlyCommitted))}
                </Text>
                <Text style={styles.donutCenterLabel}>/month</Text>
              </View>
            </View>
            <View style={styles.legend}>
              {spendingByCategory.map((item, i) => {
                const percentage = Math.round((item.amount / totalMonthlyCommitted) * 100);
                return (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{formatCategoryName(item.category)}</Text>
                    <View style={styles.legendSpacer} />
                    <Text style={styles.legendAmount}>{formatCurrency(item.amount)}</Text>
                    <Text style={styles.legendPercent}>{percentage}%</Text>
                  </View>
                );
              })}
            </View>
            {/* Conversational insight for donut chart */}
            {spendingByCategory.length > 0 && (() => {
              const largest = spendingByCategory[0];
              const largestPercentage = Math.round((largest.amount / totalMonthlyCommitted) * 100);
              return (
                <Text style={styles.conversationalInsight}>
                  {formatCategoryName(largest.category)} takes up {largestPercentage}% of your bills. {largestPercentage > 50 ? "That's normal" : "That's the biggest one"} — but everything else is where you have control.
                </Text>
              );
            })()}
          </View>
        </View>
      )}

      {/* Section 5: Monthly Comparison Bar Chart (premium) */}
      {isPremium && monthlyData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>MONTH BY MONTH</Text>
          <View style={styles.chartContainer}>
            <BarChart data={monthlyData} width={340} height={160} colors={colors} />
            <View style={styles.barLegend}>
              <View style={styles.barLegendItem}>
                <View style={[styles.barLegendDot, { backgroundColor: colors.accent, opacity: 0.3 }]} />
                <Text style={styles.barLegendText}>Income</Text>
              </View>
              <View style={styles.barLegendItem}>
                <View style={[styles.barLegendDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.barLegendText}>Committed</Text>
              </View>
            </View>
            {/* Conversational insight for bar chart */}
            {monthlyData.length >= 2 && (() => {
              const firstMonth = monthlyData[0];
              const lastMonth = monthlyData[monthlyData.length - 1];
              if (lastMonth.committed < firstMonth.committed) {
                return (
                  <Text style={styles.conversationalInsight}>
                    Your bills are getting lighter. Keep it going.
                  </Text>
                );
              } else if (lastMonth.committed > firstMonth.committed) {
                return (
                  <Text style={styles.conversationalInsight}>
                    Your commitments are growing. Worth reviewing what's new.
                  </Text>
                );
              } else {
                return (
                  <Text style={styles.conversationalInsight}>
                    Your monthly pattern is steady. No surprises.
                  </Text>
                );
              }
            })()}
          </View>
        </View>
      )}

      {/* Section 6: BNPL Exposure */}
      {bnplPayments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>BNPL EXPOSURE</Text>
          <View style={styles.bnplCard}>
            <View style={styles.bnplRow}>
              <Text style={styles.bnplLabel}>Total BNPL commitments</Text>
              <Text style={styles.bnplAmount}>{formatCurrency(bnplTotal)}</Text>
            </View>
            <View style={styles.bnplSeparator} />
            <View style={styles.bnplRow}>
              <Text style={styles.bnplLabel}>Active plans</Text>
              <Text style={styles.bnplValue}>{bnplPayments.length}</Text>
            </View>
            {nextBnpl && (
              <>
                <View style={styles.bnplSeparator} />
                <View style={styles.bnplRow}>
                  <Text style={styles.bnplLabel}>Next instalment</Text>
                  <Text style={styles.bnplDetail}>
                    {capitalizeName(nextBnpl.name)} · {formatCurrency(nextBnpl.amount)} · {formatRelativeDate(nextBnpl.nextDueDate)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Section 7: Total Debt Estimate */}
      {bnplPayments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TOTAL DEBT</Text>
          <View style={styles.bnplCard}>
            <View style={styles.bnplRow}>
              <Text style={styles.bnplLabel}>Estimated remaining</Text>
              <Text style={[styles.bnplAmount, { color: colors.warning }]}>
                {formatCurrency(bnplPayments.reduce((sum, p) => {
                  // Rough estimate: 4 remaining instalments for fortnightly BNPL
                  const remaining = p.frequency === 'fortnightly' ? 4 : p.frequency === 'weekly' ? 8 : 2;
                  return sum + (p.amount * remaining);
                }, 0))}
              </Text>
            </View>
            <Text style={styles.debtCaption}>
              This is a rough estimate based on your tracked payments.
            </Text>
          </View>
        </View>
      )}

      {/* Section 8: Cycle Report Card (premium) */}
      {isPremium && lastCycle && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>LAST CYCLE</Text>
          <View style={styles.reportCard}>
            <Text style={styles.reportAmount}>
              You had {formatCurrency(lastCycle.remainingOnPayday)} left on payday
            </Text>
            <Text style={styles.reportCoverage}>
              You covered all {lastCycle.paymentsCovered} payments
            </Text>
            {secondLastCycle && cycleDiff !== 0 && (
              <Text style={styles.reportComparison}>
                <Text style={{ color: isImproving ? colors.accent : '#D4913A' }}>
                  {isImproving ? '↑ ' : '↓ '}
                </Text>
                That's {formatCurrency(Math.abs(cycleDiff))} {isImproving ? 'more' : 'less'} than the cycle before
              </Text>
            )}
            {/* Conversational insight for cycle report card */}
            {secondLastCycle && cycleDiff !== 0 && (
              <Text style={[styles.conversationalInsight, { marginTop: SPACING.md }]}>
                {isImproving
                  ? `That extra ${formatCurrency(Math.abs(cycleDiff))} might not feel like much, but over a year that's ${formatCurrency(Math.abs(cycleDiff) * 26)}. Small wins compound.`
                  : `You had less this time. It happens. The fact that you're tracking it puts you ahead of most people.`}
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.bottomPad} />

      {showPremiumGate && (
        <PremiumGate
          feature="cycle history charts"
          onDismiss={() => setShowPremiumGate(false)}
        />
      )}
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: SPACING.lg,
  },

  // Header
  pageTitle: {
    color: colors.text,
    fontSize: FONT_SIZES.h2,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingTop: 48,
    paddingBottom: SPACING.lg,
  },

  // Sections
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },

  // Lifetime stats
  statsCard: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    padding: 20,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: colors.text,
    fontSize: FONT_SIZES.h3,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.caption,
    textAlign: 'center',
    fontFamily: FONTS.light,
  },

  // Streak
  streakCard: {
    backgroundColor: colors.surface,
    padding: 20,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  streakContent: {
    flex: 1,
  },
  streakText: {
    color: colors.text,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.light,
  },
  streakBest: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.light,
  },
  streakEmpty: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'center',
    fontFamily: FONTS.light,
  },

  // Chart container
  chartContainer: {
    backgroundColor: colors.surface,
    padding: 20,
    alignItems: 'center',
  },
  chartTitle: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: FONTS.light,
    marginBottom: SPACING.md,
  },
  chartCaption: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: FONTS.light,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  trendIndicator: {
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: FONTS.light,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  conversationalInsight: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: FONTS.light,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: SPACING.md,
    maxWidth: 300,
    alignSelf: 'center',
    lineHeight: 20,
  },
  chartEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  chartEmptyText: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    fontFamily: FONTS.light,
  },

  // Chart placeholder for free users
  chartPlaceholder: {
    backgroundColor: colors.surface,
    height: 200,
    overflow: 'hidden',
  },
  chartBlur: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  fakeChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
  },
  fakeBar: {
    width: 24,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  chartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.75)',
    padding: SPACING.lg,
  },
  chartOverlayTitle: {
    color: colors.text,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  chartOverlayDesc: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    marginBottom: SPACING.lg,
    textAlign: 'center',
    fontFamily: FONTS.light,
  },
  premiumButton: {
    backgroundColor: colors.accent,
    height: 44,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButtonText: {
    color: colors.black,
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: FONTS.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Donut chart
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterAmount: {
    color: colors.text,
    fontSize: FONT_SIZES.h3,
    fontFamily: FONTS.bold,
  },
  donutCenterLabel: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.light,
    marginTop: 2,
  },
  legend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  legendLabel: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.light,
    textTransform: 'capitalize',
  },
  legendSpacer: {
    flex: 1,
  },
  legendAmount: {
    color: colors.text,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.light,
    marginRight: SPACING.sm,
  },
  legendPercent: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.light,
    minWidth: 32,
    textAlign: 'right',
  },

  // Bar chart
  barLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.md,
  },
  barLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: SPACING.xs,
  },
  barLegendText: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.caption,
    fontFamily: FONTS.light,
  },

  // BNPL
  bnplCard: {
    backgroundColor: colors.surface,
    padding: 20,
  },
  bnplRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  bnplLabel: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.light,
  },
  bnplAmount: {
    color: colors.text,
    fontSize: FONT_SIZES.h3,
    fontFamily: FONTS.regular,
  },
  bnplValue: {
    color: colors.text,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.light,
  },
  bnplDetail: {
    color: colors.text,
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md,
    fontFamily: FONTS.light,
  },
  bnplSeparator: {
    height: 1,
    backgroundColor: colors.background,
    marginVertical: SPACING.xs,
  },
  debtCaption: {
    color: colors.textTertiary,
    fontSize: FONT_SIZES.caption,
    marginTop: SPACING.sm,
    fontFamily: FONTS.light,
  },

  // Report card
  reportCard: {
    backgroundColor: colors.surface,
    padding: 24,
    alignItems: 'center',
  },
  reportAmount: {
    color: colors.accent,
    fontSize: FONT_SIZES.h3,
    fontFamily: FONTS.bold,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  reportCoverage: {
    color: colors.text,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.light,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  reportComparison: {
    color: colors.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: FONTS.light,
    textAlign: 'center',
  },

  bottomPad: {
    height: 80,
  },
});
