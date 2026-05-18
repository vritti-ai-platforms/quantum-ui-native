import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface ThemeTransitionOverlayProps {
  fromBg: string;
  origin?: { x: number; y: number };
  duration?: number;
  onComplete: () => void;
}

// 2-frame delay so the theme cascade commits before the fade worklet starts — avoids first-frame jitter.
const FADE_DELAY_MS = 32;
const DEFAULT_FADE_DURATION = 400;

// View-based opacity fade — react-native-svg <Mask> rasterizes on the UI thread on Android. iOS keeps the SVG ripple via the bare .tsx fallback.
export const ThemeTransitionOverlay = ({
  fromBg,
  origin: _origin,
  duration = DEFAULT_FADE_DURATION,
  onComplete,
}: ThemeTransitionOverlayProps) => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    const handle = setTimeout(() => {
      opacity.value = withTiming(
        0,
        { duration, easing: Easing.bezier(0.4, 0, 0.2, 1) },
        (finished) => {
          'worklet';
          if (finished) runOnJS(onComplete)();
        },
      );
    }, FADE_DELAY_MS);
    return () => clearTimeout(handle);
  }, [duration, opacity, onComplete]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: fromBg }, animatedStyle]}
    />
  );
};
