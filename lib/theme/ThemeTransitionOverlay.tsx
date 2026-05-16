import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ThemeTransitionOverlayProps {
  /** HSL string of the scheme being left — painted under the reveal mask. */
  fromBg: string;
  /** Origin of the reveal circle in screen-space pixels. */
  origin: { x: number; y: number };
  /** Animation duration in ms. */
  duration?: number;
  /** Called once the reveal completes; the host should unmount the overlay here. */
  onComplete: () => void;
}

export const ThemeTransitionOverlay = ({ fromBg, origin, duration = 600, onComplete }: ThemeTransitionOverlayProps) => {
  const { width, height } = useWindowDimensions();
  // Distance from the origin to the farthest corner — guarantees the circle
  // covers the whole screen regardless of where the origin sits.
  const dx = Math.max(origin.x, width - origin.x);
  const dy = Math.max(origin.y, height - origin.y);
  const maxRadius = Math.hypot(dx, dy);

  const r = useSharedValue(0);

  useEffect(() => {
    // Reanimated 4 compiles this completion callback into a UI-thread worklet,
    // so the JS-side `onComplete` prop MUST be crossed back via runOnJS —
    // calling it directly throws under Worklets-3.
    r.value = withTiming(maxRadius, { duration, easing: Easing.bezier(0.4, 0, 0.2, 1) }, (finished) => {
      'worklet';
      if (finished) runOnJS(onComplete)();
    });
  }, [maxRadius, duration, r, onComplete]);

  const animatedProps = useAnimatedProps(() => ({ r: r.value }));

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        {/* white = fully opaque, black = transparent in the masked output */}
        <Mask id="reveal" x="0" y="0" width={width} height={height}>
          <Rect width={width} height={height} fill="white" />
          <AnimatedCircle cx={origin.x} cy={origin.y} fill="black" animatedProps={animatedProps} />
        </Mask>
      </Defs>
      <Rect width={width} height={height} fill={fromBg} mask="url(#reveal)" />
    </Svg>
  );
};
