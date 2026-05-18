import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ThemeTransitionOverlayProps {
  fromBg: string;
  origin: { x: number; y: number };
  duration?: number;
  onComplete: () => void;
}

export const ThemeTransitionOverlay = ({ fromBg, origin, duration = 600, onComplete }: ThemeTransitionOverlayProps) => {
  const { width, height } = useWindowDimensions();
  // Distance to the farthest corner — guarantees full-screen coverage regardless of origin.
  const dx = Math.max(origin.x, width - origin.x);
  const dy = Math.max(origin.y, height - origin.y);
  const maxRadius = Math.hypot(dx, dy);

  const r = useSharedValue(0);

  useEffect(() => {
    r.value = withTiming(maxRadius, { duration, easing: Easing.bezier(0.4, 0, 0.2, 1) }, (finished) => {
      'worklet';
      // Worklets-3 requires runOnJS for the JS-side callback.
      if (finished) runOnJS(onComplete)();
    });
  }, [maxRadius, duration, r, onComplete]);

  const animatedProps = useAnimatedProps(() => ({ r: r.value }));

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Mask id="reveal" x="0" y="0" width={width} height={height}>
          <Rect width={width} height={height} fill="white" />
          <AnimatedCircle cx={origin.x} cy={origin.y} fill="black" animatedProps={animatedProps} />
        </Mask>
      </Defs>
      <Rect width={width} height={height} fill={fromBg} mask="url(#reveal)" />
    </Svg>
  );
};
