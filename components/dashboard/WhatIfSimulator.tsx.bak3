import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import { ProgressRing } from './ProgressRing';
import { PremiumGate } from '../ui/PremiumGate';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WhatIfSimulatorProps {
  remainingAfterBills: number;
  incomeAmount: number;
  daysUntilPayday: number;
  isPremium?: boolean;
}

function getHealthColor(remaining: number, income: number): string {
  if (income === 0) return COLORS.accent;
  const ratio = remaining / income;
  if (ratio > 0.3) return COLORS.accent;
  if (ratio > 0.1) return COLORS.warning;
  return COLORS.danger;
}

function getStatusMessage(newRemaining: number, income: number): { text: string; color: string } {
  if (newRemaining <= 0) {
    return { text: "That would leave you with nothing until payday.", color: COLORS.danger };
  }
  const ratio = newRemaining / income;
  if (ratio < 0.1) {
    return { text: "You'd need to be careful for the rest of the cycle.", color: COLORS.warning };
  }
  return { text: "You'd still be comfortable.", color: COLORS.accent };
}

export function WhatIfSimulator({
  remainingAfterBills,
  incomeAmount,
  daysUntilPayday,
  isPremium = false,
}: WhatIfSimulatorProps) {
  const [expanded, setExpanded] = useState(false);
  const [spendAmount, setSpendAmount] = useState('');
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  const handleToggle = () => {
    if (!isPremium) {
      setShowPremiumGate(true);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
    if (expanded) setSpendAmount('');
  };

  const handleClose = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(false);
    setSpendAmount('');
  };

  const parsedSpend = parseFloat(spendAmount) || 0;
  const newRemaining = Math.max(0, remainingAfterBills - parsedSpend);
  const newProgress = incomeAmount > 0
    ? Math.min(1, Math.max(0, newRemaining / incomeAmount))
    : 0;
  const newColor = getHealthColor(newRemaining, incomeAmount);
  const status = getStatusMessage(newRemaining, incomeAmount);

  return (
    <View style={styles.section}>
      {/* Collapsed row */}
      <Pressable style={styles.collapsedRow} onPress={handleToggle}>
        <Text style={styles.collapsedText}>What if I spend...?</Text>
        <Text style={styles.chevron}>{expanded ? '−' : '›'}</Text>
      </Pressable>

      {/* Expanded content */}
      {expanded && (
        <View style={styles.expandedCard}>
          {/* Amount input */}
          <View style={styles.inputRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={[styles.amountInput, Platform.OS === 'web' && { outline: 'none' } as any]}
              value={spendAmount}
              onChangeText={(t) => setSpendAmount(t.replace(/[^0-9.]/g, ''))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={COLORS.textTertiary}
              autoFocus
            />
          </View>

          {/* Impact display */}
          {parsedSpend > 0 && (
            <View style={styles.impactArea}>
              <View style={styles.impactRow}>
                <View style={styles.impactText}>
                  <Text style={styles.impactLine}>
                    You'd have{' '}
                    <Text style={[styles.impactAmount, { color: newColor }]}>
                      {formatCurrency(newRemaining)}
                    </Text>
                    {' '}for{' '}
                    <Text style={styles.impactBold}>
                      {daysUntilPayday} {daysUntilPayday === 1 ? 'day' : 'days'}
                    </Text>
                  </Text>
                  <Text style={[styles.statusMessage, { color: status.color }]}>
                    {status.text}
                  </Text>
                </View>
                <View style={styles.miniRing}>
                  <ProgressRing
                    progress={newProgress}
                    size={80}
                    strokeWidth={6}
                    trackStrokeWidth={4}
                    color={newColor}
                    trackColor="#1A1A1A"
                    animated={false}
                  >
                    <Text style={[styles.miniRingAmount, { color: newColor }]}>
                      {formatCurrency(newRemaining)}
                    </Text>
                  </ProgressRing>
                </View>
              </View>
            </View>
          )}

          {/* Close */}
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      )}

      {showPremiumGate && (
        <PremiumGate
          feature="What If simulator"
          onDismiss={() => setShowPremiumGate(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
  },
  collapsedRow: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  collapsedText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
  },
  chevron: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.h3,
  },
  expandedCard: {
    backgroundColor: COLORS.surface,
    padding: 20,
    marginTop: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    height: 56,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  dollarSign: {
    color: COLORS.text,
    fontSize: 28,
    fontFamily: FONTS.regular,
    marginRight: SPACING.xs,
  },
  amountInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 28,
    fontFamily: FONTS.regular,
    height: 56,
    padding: 0,
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
  } as any,
  impactArea: {
    marginBottom: SPACING.lg,
  },
  impactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  impactText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  impactLine: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
  impactAmount: {
    fontFamily: FONTS.regular,
  },
  impactBold: {
    fontFamily: FONTS.regular,
    color: COLORS.text,
  },
  statusMessage: {
    fontSize: FONT_SIZES.bodySmall,
  },
  miniRing: {
    alignItems: 'center',
  },
  miniRingAmount: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  closeText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.light,
  },
});
