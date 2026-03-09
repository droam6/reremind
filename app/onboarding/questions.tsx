import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
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

  // Crossfade animations for questions
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Summary animations
  const summaryScale = useRef(new Animated.Value(0.95)).current;
  const summaryOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  const handleSelect = (index: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(index);

    // After 400ms, crossfade to next
    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length - 1) {
        // Slide out left
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -30,
            duration: 300,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrentQuestion((prev) => prev + 1);
          setSelectedIndex(null);
          // Reset to right side
          slideAnim.setValue(30);
          // Slide in from right
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start();
        });
      } else {
        setShowSummary(true);
      }
    }, 400);
  };

  // Summary reveal animation
  useEffect(() => {
    if (showSummary) {
      Animated.parallel([
        Animated.timing(summaryOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(summaryScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        setShowButton(true);
      }, 2000);
    }
  }, [showSummary, summaryOpacity, summaryScale]);

  // Button fade in
  useEffect(() => {
    if (showButton) {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [showButton, buttonOpacity]);

  if (showSummary) {
    return (
      <View style={styles.container}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '20%' }]} />
        </View>

        <Animated.View
          style={[
            styles.summaryCenter,
            {
              opacity: summaryOpacity,
              transform: [{ scale: summaryScale }],
            },
          ]}
        >
          <Text style={styles.summaryTitle}>You're not alone.</Text>
          <Text style={styles.summaryBody}>
            RE-REMIND shows you exactly what's left after your bills — so you never have to guess.
          </Text>
        </Animated.View>

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
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: '20%' }]} />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
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
      </Animated.View>
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
