import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, FONTS, BORDER_RADIUS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  getSavingsGoal,
  saveSavingsGoal,
  clearSavingsGoal,
  getSavingsNudgeFlag,
  setSavingsNudgeFlag,
} from '../../utils/storage';

interface SavingsNudgeProps {
  remainingOnPayday: number;
  onDismiss: () => void;
}

export function SavingsNudge({ remainingOnPayday, onDismiss }: SavingsNudgeProps) {
  const [visible, setVisible] = useState(false);
  const [previousGoal, setPreviousGoal] = useState<number | null>(null);
  const [phase, setPhase] = useState<'ask' | 'followup' | 'success' | 'comfort'>('ask');

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const shouldShow = await getSavingsNudgeFlag();
      if (!shouldShow || !mounted) return;

      const goal = await getSavingsGoal();
      if (goal !== null) {
        setPreviousGoal(goal);
        setPhase('followup');
      } else {
        setPhase('ask');
      }

      // Delay 1s to let dashboard load
      setTimeout(() => {
        if (mounted) {
          setVisible(true);
          setSavingsNudgeFlag(false);
        }
      }, 1000);
    };
    check();
    return () => { mounted = false; };
  }, []);

  const handleTrySaving = async () => {
    await saveSavingsGoal(remainingOnPayday);
    close();
  };

  const handleNotThisTime = () => {
    close();
  };

  const handleYesManaged = async () => {
    setPhase('success');
    setTimeout(() => {
      close();
    }, 1500);
    // Set new goal for next cycle
    await saveSavingsGoal(remainingOnPayday);
  };

  const handleNotQuite = async () => {
    setPhase('comfort');
    setTimeout(() => {
      close();
    }, 2000);
    // Update goal with new amount
    await saveSavingsGoal(remainingOnPayday);
  };

  const close = () => {
    setVisible(false);
    onDismiss();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {phase === 'ask' && (
            <>
              <Text style={styles.title}>Nice work.</Text>
              <Text style={styles.body}>
                You had <Text style={styles.goldBold}>{formatCurrency(remainingOnPayday)}</Text> left on payday.
              </Text>
              <Text style={styles.subtitle}>
                Want to try setting that aside next cycle?
              </Text>
              <Pressable style={styles.primaryButton} onPress={handleTrySaving}>
                <Text style={styles.primaryButtonText}>I'll try</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handleNotThisTime}>
                <Text style={styles.secondaryButtonText}>Not this time</Text>
              </Pressable>
            </>
          )}

          {phase === 'followup' && previousGoal !== null && (
            <>
              <Text style={styles.title}>Welcome back.</Text>
              <Text style={styles.body}>
                Last time you aimed to save <Text style={styles.goldBold}>{formatCurrency(previousGoal)}</Text>.
              </Text>
              <Text style={styles.subtitle}>Did you manage?</Text>
              <Pressable style={styles.primaryButton} onPress={handleYesManaged}>
                <Text style={styles.primaryButtonText}>Yes</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={handleNotQuite}>
                <Text style={styles.secondaryButtonText}>Not quite</Text>
              </Pressable>
            </>
          )}

          {phase === 'success' && (
            <View style={styles.messageCenter}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.messageText}>Amazing. Keep going.</Text>
            </View>
          )}

          {phase === 'comfort' && (
            <View style={styles.messageCenter}>
              <Text style={styles.messageText}>
                That's okay. Every cycle is a fresh start.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.sharp,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.h2,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  body: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  goldBold: {
    color: COLORS.accent,
    fontFamily: FONTS.regular,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.accent,
    height: 48,
    width: '100%',
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.regular,
  },
  secondaryButton: {
    height: 48,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
  },
  messageCenter: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  checkmark: {
    color: COLORS.accent,
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  messageText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
  },
});
