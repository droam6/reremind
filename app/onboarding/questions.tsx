import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';

interface Question {
  text: string;
  options: { label: string; primary: boolean }[];
}

const QUESTIONS: Question[] = [
  {
    text: 'Do you ever avoid looking at your bank balance?',
    options: [
      { label: "Yeah, more than I'd like to admit", primary: true },
      { label: 'Not really', primary: false },
    ],
  },
  {
    text: 'Have you ever been caught off guard by a bill?',
    options: [
      { label: 'All the time', primary: true },
      { label: 'Not often', primary: false },
    ],
  },
  {
    text: 'Do you know exactly how much you can safely spend today?',
    options: [
      { label: 'Honestly, no', primary: true },
      { label: "I've got a rough idea", primary: false },
    ],
  },
];

export default function QuestionsScreen() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);

    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedIndex(null);
      } else {
        setShowSummary(true);
        setTimeout(() => {
          setShowButton(true);
        }, 2000);
      }
    }, 500);
  };

  useEffect(() => {
    if (showButton) {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [showButton, buttonOpacity]);

  if (showSummary) {
    return (
      <View style={styles.container}>
        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '20%' }]} />
        </View>

        <View style={styles.summaryCenter}>
          <Text style={styles.summaryTitle}>You're not alone.</Text>
          <Text style={styles.summaryBody}>
            RE-REMIND shows you exactly what's left after your bills — so you never have to guess.
          </Text>
        </View>

        {showButton && (
          <Animated.View style={[styles.bottom, { opacity: buttonOpacity }]}>
            <Pressable
              style={styles.button}
              onPress={() => router.push('/onboarding/income')}
            >
              <Text style={styles.buttonText}>CONTINUE</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    );
  }

  const question = QUESTIONS[currentQuestion];

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '20%' }]} />
      </View>

      <View style={styles.content}>
        <Text style={styles.questionText}>{question.text}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            return (
              <Pressable
                key={index}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                ]}
                onPress={() => handleSelect(index)}
              >
                <Text
                  style={[
                    styles.optionText,
                    !option.primary && styles.optionTextSecondary,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressTrack: {
    height: 2,
    backgroundColor: COLORS.surface,
    marginTop: SPACING.xxl,
  },
  progressFill: {
    height: 2,
    backgroundColor: COLORS.accent,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  questionText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xl,
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  optionButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: 20,
    paddingHorizontal: SPACING.lg,
    borderRadius: 0,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  optionButtonSelected: {
    borderLeftColor: COLORS.accent,
  },
  optionText: {
    color: COLORS.text,
    fontSize: FONT_SIZES.body,
  },
  optionTextSecondary: {
    color: COLORS.textSecondary,
  },
  optionTextSelected: {
    color: COLORS.text,
  },
  summaryCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  summaryTitle: {
    color: COLORS.text,
    fontSize: FONT_SIZES.h1,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  summaryBody: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
    maxWidth: 300,
  },
  bottom: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  button: {
    backgroundColor: COLORS.accent,
    height: 56,
    borderRadius: BORDER_RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.black,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
