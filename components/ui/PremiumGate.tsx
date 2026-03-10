import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, FONTS, BORDER_RADIUS } from '../../constants/theme';

interface PremiumGateProps {
  feature: string;
  onDismiss: () => void;
}

export function PremiumGate({ feature, onDismiss }: PremiumGateProps) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.description}>
            Get {feature} and more.
          </Text>
          <Text style={styles.price}>$4.99/month</Text>
          <Pressable style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>Maybe later</Text>
          </Pressable>
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
  modal: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.sharp,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h2,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontFamily: FONTS.light,
  },
  price: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.h3,
    fontFamily: FONTS.light,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  dismissButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  dismissText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    fontFamily: FONTS.light,
  },
});
