import * as ProgressPrimitive from '@rn-primitives/progress';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { cn } from '../../utils/index';

// RN analog of the web shadcnProgress — a track (bg-primary/20) with a primary indicator that fills
// to `value` (0–100). The bar fills via a Reanimated width spring (the web animates its translateX
// with a CSS transition, which has no plain-RN equivalent); `indicatorClassName` recolors the bar.
function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: ProgressPrimitive.RootProps &
  React.RefAttributes<ProgressPrimitive.RootRef> & {
    indicatorClassName?: string;
  }) {
  const progress = useDerivedValue(() => value ?? 0);
  const indicatorStyle = useAnimatedStyle(() => ({
    width: withSpring(`${interpolate(progress.value, [0, 100], [0, 100], Extrapolation.CLAMP)}%`, {
      overshootClamping: true,
    }),
  }));

  return (
    <ProgressPrimitive.Root
      className={cn('bg-primary/20 relative h-2 w-full overflow-hidden rounded-full', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator asChild>
        <Animated.View style={indicatorStyle} className={cn('bg-primary h-full w-full flex-1', indicatorClassName)} />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
