import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRegisterScreenHeaderInset, useScreenScrollY } from '../ScreenContainer/screenScrollRegistry';
import { Text } from '../Typography';
import type { ScreenHeaderProps } from './types';

const BAR_HEIGHT = 44; // nav-bar row — reserved only when there are actions
const LARGE_TITLE_HEIGHT = 68; // collapsible large-title row (title + subtitle)
const LARGE_TITLE_HEIGHT_NO_SUBTITLE = 52; // title-only — drops the subtitle row's vertical reservation
const COLLAPSE_AT = 96; // scroll offset at which the header is fully collapsed
const BOTTOM_GAP = 8; // breathing room between content and the backdrop's bottom border
const BACKDROP_FADE_AT = 20; // scroll offset over which a fading backdrop reaches full opacity

interface ScreenHeaderBaseProps extends ScreenHeaderProps {
  backdrop?: ReactNode;
  overlay?: boolean;
  animateBackdrop?: boolean;
}

export function ScreenHeaderBase({
  title,
  subtitle,
  backdrop,
  overlay = false,
  animateBackdrop = false,
  leftActions,
  rightActions,
}: ScreenHeaderBaseProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useScreenScrollY();

  // The nav-bar row only takes vertical space when there are actions; without
  // actions the large title sits directly below the status bar (no empty gap).
  const hasActions = leftActions != null || rightActions != null;
  const largeTitleHeight = subtitle ? LARGE_TITLE_HEIGHT : LARGE_TITLE_HEIGHT_NO_SUBTITLE;
  const heroHeight = (hasActions ? BAR_HEIGHT : 0) + largeTitleHeight;

  useRegisterScreenHeaderInset(overlay ? heroHeight : 0);

  const containerStyle = useAnimatedStyle(() => ({
    height:
      interpolate(scrollY.value, [0, COLLAPSE_AT], [heroHeight, BAR_HEIGHT + BOTTOM_GAP], Extrapolation.CLAMP) +
      insets.top,
  }));

  const backdropOpacityStyle = useAnimatedStyle(() => {
    if (!animateBackdrop) return { opacity: 1 };
    return {
      opacity: interpolate(scrollY.value, [0, BACKDROP_FADE_AT], [0, 1], Extrapolation.CLAMP),
    };
  });

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COLLAPSE_AT * 0.6], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, COLLAPSE_AT], [0, -12], Extrapolation.CLAMP) }],
  }));

  const compactTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [COLLAPSE_AT * 0.55, COLLAPSE_AT], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View className="relative overflow-hidden" style={[{ paddingTop: insets.top }, containerStyle]}>
      {backdrop ? (
        <Animated.View className="absolute inset-0" style={backdropOpacityStyle} pointerEvents="none">
          {backdrop}
        </Animated.View>
      ) : null}

      {/* Nav-bar row spacer — reserved only when there are actions. */}
      {hasActions ? <View className="h-11" pointerEvents="none" /> : null}

      {/* Large-title row — collapses on scroll. */}
      <Animated.View
        className="flex-1 justify-start gap-0.5 px-4 pb-1 mt-4"
        style={largeTitleStyle}
        pointerEvents="none"
      >
        <Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </Animated.View>

      {/* Compact title — centered in the nav-bar band; fades in on scroll. */}
      <Animated.View
        className="absolute left-0 right-0 items-center justify-center px-16"
        style={[{ top: insets.top, height: BAR_HEIGHT }, compactTitleStyle]}
        pointerEvents="none"
      >
        <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
          {title}
        </Text>
      </Animated.View>

      {leftActions ? (
        <View
          className="absolute left-4 items-center justify-center"
          style={{ top: insets.top, height: BAR_HEIGHT }}
          pointerEvents="box-none"
        >
          {leftActions}
        </View>
      ) : null}

      {rightActions ? (
        <View
          className="absolute right-4 items-center justify-center"
          style={{ top: insets.top, height: BAR_HEIGHT }}
          pointerEvents="box-none"
        >
          {rightActions}
        </View>
      ) : null}
    </Animated.View>
  );
}
