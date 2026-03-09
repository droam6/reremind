import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

/**
 * Creates a fade-in animation value.
 * Returns an Animated.Value that goes from 0 to 1.
 */
export function useFadeIn(delay: number = 0, duration: number = 500): Animated.Value {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: EASE_OUT,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [opacity, delay, duration]);

  return opacity;
}

/**
 * Creates a slide-up + fade-in animation.
 * Returns { opacity, translateY } for use in Animated.View style.
 */
export function useSlideUp(
  delay: number = 0,
  duration: number = 600,
  distance: number = 20,
): { opacity: Animated.Value; translateY: Animated.AnimatedInterpolation<number> } {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: EASE_OUT,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [progress, delay, duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [distance, 0],
  });

  return { opacity: progress, translateY };
}

/**
 * Creates a subtle scale-in + fade animation (0.95 → 1.0).
 */
export function useScaleIn(
  delay: number = 0,
  duration: number = 600,
): { opacity: Animated.Value; scale: Animated.AnimatedInterpolation<number> } {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: EASE_OUT,
        useNativeDriver: true,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [progress, delay, duration]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });

  return { opacity: progress, scale };
}

/**
 * Creates a fade-out animation value.
 * Starts at 1, goes to 0 after trigger.
 */
export function createFadeOut(
  animated: Animated.Value,
  duration: number = 500,
): void {
  Animated.timing(animated, {
    toValue: 0,
    duration,
    easing: EASE_IN,
    useNativeDriver: true,
  }).start();
}

/**
 * Creates a crossfade animation: slide left out, slide right in.
 */
export function useCrossfade(): {
  slideAnim: Animated.Value;
  opacityAnim: Animated.Value;
  triggerOut: (onDone: () => void) => void;
  triggerIn: () => void;
} {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const triggerOut = (onDone: () => void) => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        easing: EASE_IN,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 300,
        easing: EASE_IN,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDone();
      slideAnim.setValue(30);
      triggerIn();
    });
  };

  const triggerIn = () => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { slideAnim, opacityAnim, triggerOut, triggerIn };
}

/**
 * Animated progress bar width (0 to target).
 */
export function useProgressWidth(
  targetPercent: number,
  duration: number = 500,
  delay: number = 200,
): Animated.Value {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(width, {
        toValue: targetPercent,
        duration,
        easing: EASE_OUT,
        useNativeDriver: false, // width can't use native driver
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [width, targetPercent, duration, delay]);

  return width;
}
