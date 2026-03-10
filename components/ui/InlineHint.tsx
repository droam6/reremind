import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SPACING, FONT_SIZES, FONTS } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

interface InlineHintProps {
  hintId: string;
  text: string;
  onDismiss: () => void;
}

export function InlineHint({ hintId, text, onDismiss }: InlineHintProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.border} />
      <Text style={styles.text}>{text}</Text>
      <Pressable
        style={styles.closeButton}
        onPress={onDismiss}
        accessibilityLabel="Dismiss hint"
        accessibilityRole="button"
      >
        <Text style={styles.closeText}>×</Text>
      </Pressable>
    </Animated.View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceLight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    marginBottom: SPACING.md,
  },
  border: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.accent,
  },
  text: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: FONT_SIZES.bodySmall,
    fontFamily: FONTS.light,
    lineHeight: 18,
  },
  closeButton: {
    marginLeft: SPACING.sm,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.textTertiary,
    fontSize: 20,
    lineHeight: 20,
  },
});
