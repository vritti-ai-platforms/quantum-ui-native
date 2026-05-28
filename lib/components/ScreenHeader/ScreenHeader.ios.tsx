import { LiquidGlassView } from '@callstack/liquid-glass';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { useScreenScrollY } from '../ScreenContainer/screenScrollRegistry';
import { ScreenHeaderBase } from './ScreenHeaderBase';
import type { ScreenHeaderProps } from './types';

const BACKDROP_FADE_AT = 20; // mirrors the constant inside ScreenHeaderBase

// iOS 26 tabs variant: a live LiquidGlassView always mounted at full opacity
// (so iOS keeps producing the material), with a bg-background cover laid OVER
// it that fades from opaque-at-rest to transparent-on-scroll. The cover blends
// with the screen background at rest (looks "transparent"); once it fades, the
// always-on glass takes over and blurs the items now scrolled behind the
// header.
function Ios26TabsBackdrop() {
  const scrollY = useScreenScrollY();
  const coverFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, BACKDROP_FADE_AT], [1, 0], Extrapolation.CLAMP),
  }));
  return (
    <View className="flex-1">
      <LiquidGlassView effect="regular" style={StyleSheet.absoluteFill} />
      <Animated.View
        className="absolute inset-0 bg-background"
        style={coverFadeStyle}
        pointerEvents="none"
      />
    </View>
  );
}

export function ScreenHeader(props: ScreenHeaderProps) {
  const { version } = usePlatformInfo();
  const isIos26 = version >= 26;
  const variant = props.variant ?? 'standard';
  const isTabsVariant = variant === 'tabs';

  // iOS 26 standard variant: soft gradient (always visible).
  // iOS 26 tabs variant: always-on LiquidGlass with a self-contained cover fade.
  // Pre-iOS 26: solid bg-background that fades in via the wrapper-level animateBackdrop.
  const backdrop =
    isIos26 && !isTabsVariant ? (
      <View className="flex-1 bg-linear-to-b from-background via-background via-[60%] to-transparent" />
    ) : isIos26 && isTabsVariant ? (
      <Ios26TabsBackdrop />
    ) : (
      <View className="flex-1 bg-background" />
    );

  // The tabs row shares the main backdrop — no separate surface inside it.
  const tabsBackground = undefined;

  // iOS 26 standard: static gradient. iOS 26 tabs: animates internally. Pre-iOS 26: wrapper fade.
  const animateBackdrop = !isIos26;

  return (
    <ScreenHeaderBase
      title={props.title}
      subtitle={props.subtitle}
      variant={variant}
      backdrop={backdrop}
      overlay
      animateBackdrop={animateBackdrop}
      tabsBackground={tabsBackground}
      backgroundImage={props.backgroundImage}
      leftActions={props.variant === 'tabs' ? undefined : props.leftActions}
      rightActions={props.variant === 'tabs' ? undefined : props.rightActions}
      tabs={props.variant === 'tabs' ? props.tabs : undefined}
    />
  );
}
