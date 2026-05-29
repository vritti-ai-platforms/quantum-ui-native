import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export interface ThemeTransitionOverlayProps {
  fromBg: string;
  // Called after the opaque cover has painted — the parent swaps the theme behind it.
  onCovered: () => void;
  onComplete: () => void;
  duration?: number;
}

const DEFAULT_FADE_DURATION = 400;

// Cover-first fade for all platforms. The cover mounts fully opaque in the OLD
// background color (so the screen looks unchanged), then on the next frame asks the
// parent to swap the theme UNDERNEATH it (iOS native Appearance re-theme + Android
// surface remount happen hidden), then fades the cover out to reveal the settled new
// theme. Painting the cover BEFORE the swap is what eliminates the 1-frame blink.
export const ThemeTransitionOverlay = ({
  fromBg,
  onCovered,
  onComplete,
  duration = DEFAULT_FADE_DURATION,
}: ThemeTransitionOverlayProps) => {
  const opacity = useSharedValue(1); // opaque from the first frame

  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      onCovered(); // swap the theme behind the opaque cover
      raf2 = requestAnimationFrame(() => {
        // give the swap a frame to commit under the cover, then reveal it
        opacity.value = withTiming(0, { duration, easing: Easing.bezier(0.4, 0, 0.2, 1) }, (finished) => {
          'worklet';
          if (finished) runOnJS(onComplete)();
        });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [onCovered, onComplete, duration, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: fromBg }, animatedStyle]} />;
};
