import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRegisterScreenHeaderInset, useScreenScrollY } from '../ScreenContainer/screenScrollRegistry';
import { Text } from '../Typography';
import { ScreenHeaderTabs, TABS_HEIGHT } from './ScreenHeaderTabs';
import { useRegisterScreenHeaderTabs } from './screenHeaderTabsRegistry';
import type { ScreenHeaderTabConfig, ScreenHeaderVariant } from './types';

const BAR_HEIGHT = 44; // nav-bar row — reserved when there are actions
const LARGE_TITLE_HEIGHT = 56; // collapsible large-title row (title + subtitle)
const LARGE_TITLE_HEIGHT_NO_SUBTITLE = 40; // title-only — drops the subtitle row's vertical reservation
const COLLAPSE_AT = 96; // scroll offset at which the header is fully collapsed
const BOTTOM_GAP = 8; // breathing room below the nav-bar in the collapsed state (no-tabs only)
const BACKDROP_FADE_AT = 20; // scroll offset over which a fading backdrop reaches full opacity
const TITLE_TOP_MARGIN = 16; // collapses on scroll alongside the title opacity

interface ScreenHeaderBaseProps {
  title: string;
  subtitle?: string;
  variant: ScreenHeaderVariant;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  tabs?: ScreenHeaderTabConfig[];
  backdrop?: ReactNode;
  overlay?: boolean;
  animateBackdrop?: boolean;
  tabsBackground?: ReactNode;
}

export function ScreenHeaderBase({
  title,
  subtitle,
  variant,
  leftActions,
  rightActions,
  tabs,
  backdrop,
  overlay = false,
  animateBackdrop = false,
  tabsBackground,
}: ScreenHeaderBaseProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useScreenScrollY();

  const hasTabs = variant === 'tabs' && (tabs?.length ?? 0) > 0;
  const hasActions = variant === 'standard' && (leftActions != null || rightActions != null);
  // Reserve the nav-bar slot only when there are actions. Without actions the
  // large title sits directly below the status bar — the compact title is
  // absolutely positioned in the BAR_HEIGHT band, so it doesn't need a flex
  // spacer to fade in.
  const reserveBar = hasActions;
  const largeTitleHeight = subtitle ? LARGE_TITLE_HEIGHT : LARGE_TITLE_HEIGHT_NO_SUBTITLE;
  const heroHeight =
    (reserveBar ? BAR_HEIGHT : 0) + TITLE_TOP_MARGIN + largeTitleHeight + (hasTabs ? TABS_HEIGHT : 0);
  const collapsedTarget = hasTabs ? TABS_HEIGHT : BAR_HEIGHT + BOTTOM_GAP;

  useRegisterScreenHeaderInset(overlay ? heroHeight : 0);
  useRegisterScreenHeaderTabs(hasTabs ? tabs : undefined);

  const containerStyle = useAnimatedStyle(() => ({
    height:
      interpolate(scrollY.value, [0, COLLAPSE_AT], [heroHeight, collapsedTarget], Extrapolation.CLAMP) + insets.top,
  }));

  const backdropOpacityStyle = useAnimatedStyle(() => {
    if (!animateBackdrop) return { opacity: 1 };
    return {
      opacity: interpolate(scrollY.value, [0, BACKDROP_FADE_AT], [0, 1], Extrapolation.CLAMP),
    };
  });

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COLLAPSE_AT * 0.6], [1, 0], Extrapolation.CLAMP),
    marginTop: interpolate(scrollY.value, [0, COLLAPSE_AT], [TITLE_TOP_MARGIN, 0], Extrapolation.CLAMP),
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

      {reserveBar ? <View className="h-11" pointerEvents="none" /> : null}

      <Animated.View
        className="flex-1 justify-start gap-0.5 px-4 pb-1"
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

      {hasTabs ? <ScreenHeaderTabs tabs={tabs!} background={tabsBackground} /> : null}

      {/* Compact title — centered in the nav-bar band; fades in on scroll. Hidden in tabs variant. */}
      {!hasTabs ? (
        <Animated.View
          className="absolute left-0 right-0 items-center justify-center px-16"
          style={[{ top: insets.top, height: BAR_HEIGHT }, compactTitleStyle]}
          pointerEvents="none"
        >
          <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>
      ) : null}

      {hasActions && leftActions ? (
        <View
          className="absolute left-4 items-center justify-center"
          style={{ top: insets.top, height: BAR_HEIGHT }}
          pointerEvents="box-none"
        >
          {leftActions}
        </View>
      ) : null}

      {hasActions && rightActions ? (
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
