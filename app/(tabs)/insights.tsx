import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { useLifetimeStats } from '../../hooks/useLifetimeStats';
import { useCycleHistory } from '../../hooks/useCycleHistory';
import { usePayments } from '../../hooks/usePayments';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatRelativeDate, parseDate } from '../../utils/formatDate';
import { capitalizeName } from '../../utils/capitalize';
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

export default function InsightsScreen() {
  const { stats, loading: statsLoading, reload: reloadStats } = useLifetimeStats();
  const { history, loading: historyLoading, reload: reloadHistory } = useCycleHistory();
  const { payments, loading: paymentsLoading, reload: reloadPayments } = usePayments();
  const [showPremiumGate, setShowPremiumGate] = useState(false);

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
            <Text style={[styles.statNumber, { color: COLORS.accent }]}>
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

      {/* Section 3: Cycle History Graph (premium-gated) */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>YOUR PROGRESS</Text>
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
      </View>

      {/* Section 4: BNPL Summary */}
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

      {/* Section 5: Total Debt Estimate */}
      {bnplPayments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TOTAL DEBT</Text>
          <View style={styles.bnplCard}>
            <View style={styles.bnplRow}>
              <Text style={styles.bnplLabel}>Estimated remaining</Text>
              <Text style={[styles.bnplAmount, { color: COLORS.warning }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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

  // Header
  pageTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.bold,
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
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },

  // Lifetime stats
  statsCard: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    padding: 20,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
    textAlign: 'center',
  },

  // Streak
  streakCard: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
  },
  streakBest: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.caption,
  },
  streakEmpty: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'center',
  },

  // Chart placeholder
  chartPlaceholder: {
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.accent,
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
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  chartOverlayDesc: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  premiumButton: {
    backgroundColor: COLORS.accent,
    height: 44,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // BNPL
  bnplCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
  },
  bnplRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  bnplLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
  },
  bnplAmount: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
  },
  bnplValue: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
  },
  bnplDetail: {
    color: COLORS.text,
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'right',
    flex: 1,
    marginLeft: SPACING.md,
  },
  bnplSeparator: {
    height: 1,
    backgroundColor: COLORS.background,
    marginVertical: SPACING.xs,
  },
  debtCaption: {
    color: COLORS.textTertiary,
    fontSize: FONT_SIZES.caption,
    marginTop: SPACING.sm,
  },

  bottomPad: {
    height: 80,
  },
});
