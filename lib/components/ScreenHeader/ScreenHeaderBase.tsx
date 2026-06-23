import { useUnstableNativeVariable } from 'nativewind';
import { type ReactNode, useState } from 'react';
import { Image, type ImageSourcePropType, TextInput, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRegisterScreenHeaderInset, useScreenScrollY } from '../ScreenContainer/screenScrollRegistry';
import { useScreenSearch } from '../ScreenContainer/screenSearchRegistry';
import { DynamicIcon, type PlatformIconDescriptor } from '../DynamicIcon';
import { Text } from '../Text';
import { ScreenHeaderTabs, TABS_HEIGHT } from './ScreenHeaderTabs';
import { ScreenHeaderTabsBackground } from './ScreenHeaderTabsBackground';
import { useRegisterScreenHeaderTabs } from './screenHeaderTabsRegistry';
import type { ScreenHeaderTabConfig, ScreenHeaderVariant } from './types';

const BAR_HEIGHT = 44; // nav-bar row — reserved when there are actions
const LARGE_TITLE_HEIGHT = 56; // collapsible large-title row (title + subtitle)
const LARGE_TITLE_HEIGHT_NO_SUBTITLE = 40; // title-only — drops the subtitle row's vertical reservation
const COLLAPSE_AT = 96; // scroll distance over which the large title collapses (after the search closes)
const BOTTOM_GAP = 8; // breathing room below the nav-bar in the collapsed state (no-tabs only)
const BACKDROP_FADE_AT = 20; // scroll offset over which a fading backdrop reaches full opacity
const TITLE_TOP_MARGIN = 16; // collapses on scroll alongside the title opacity
const SEARCH_ROW_HEIGHT = 52; // collapsible search row (pill + bottom gap)

const SEARCH_ICON: PlatformIconDescriptor = { sfSymbol: 'magnifyingglass', materialIcon: 'search' };
// MF-shared theme reader — className COLORS don't apply reliably across the federation boundary, so the
// search pill resolves its fill/text/placeholder colors inline from the shared NativeWind variables.
const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

interface ScreenHeaderBaseProps {
  title: string;
  subtitle?: string;
  variant: ScreenHeaderVariant;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  tabs?: ScreenHeaderTabConfig[];
  backdrop?: ReactNode;
  overlay?: boolean;
  animateBackdrop?: boolean;
  tabsBackground?: ReactNode;
  backgroundImage?: ImageSourcePropType;
}

export function ScreenHeaderBase({
  title,
  subtitle,
  variant,
  leftActions,
  rightActions,
  searchable = false,
  searchPlaceholder = 'Search',
  tabs,
  backdrop,
  overlay = false,
  animateBackdrop = false,
  tabsBackground,
  backgroundImage,
}: ScreenHeaderBaseProps) {
  const insets = useSafeAreaInsets();
  const scrollY = useScreenScrollY();
  const { setQuery } = useScreenSearch();
  const [searchText, setSearchText] = useState('');
  const mutedVar = useVar('--muted');
  const fgVar = useVar('--foreground');
  const mutedFgVar = useVar('--muted-foreground');
  // Deepen the muted fill so the search pill reads with more weight than the plain --muted token —
  // localized to this pill (no colors.ts change). Stays theme-aware: darken in light, lighten in dark.
  const pillFill = (() => {
    if (!mutedVar) return undefined;
    const [h, s, l] = mutedVar.trim().split(/\s+/);
    const lightness = Number.parseFloat(l);
    if (Number.isNaN(lightness)) return `hsl(${mutedVar})`;
    return `hsl(${h} ${s} ${lightness > 50 ? lightness - 3: lightness + 3}%)`;
  })();

  const hasTabs = variant === 'tabs' && (tabs?.length ?? 0) > 0;
  const hasActions = variant === 'standard' && (leftActions != null || rightActions != null);
  const hasSearch = variant === 'standard' && searchable;
  const reserveBar = hasActions;
  const largeTitleHeight = subtitle ? LARGE_TITLE_HEIGHT : LARGE_TITLE_HEIGHT_NO_SUBTITLE;
  const searchHeight = hasSearch ? SEARCH_ROW_HEIGHT : 0;
  // The non-search part of the header (bar + large title) — what stays once the search has minimized.
  const titleArea = (reserveBar ? BAR_HEIGHT : 0) + TITLE_TOP_MARGIN + largeTitleHeight + (hasTabs ? TABS_HEIGHT : 0);
  const heroHeight = titleArea + searchHeight;
  const collapsedTarget = hasTabs ? TABS_HEIGHT : BAR_HEIGHT + BOTTOM_GAP;
  // Stage the collapse: scroll [0, searchHeight] MINIMIZES the search row (height → 0); only after that,
  // scroll [searchHeight, searchHeight + COLLAPSE_AT] collapses the large title. (stage1 = 0 with no search.)
  const stage1 = searchHeight;

  useRegisterScreenHeaderInset(overlay ? heroHeight : 0);
  useRegisterScreenHeaderTabs(hasTabs ? tabs : undefined);

  const containerStyle = useAnimatedStyle(() => {
    const titleH = interpolate(scrollY.value, [stage1, stage1 + COLLAPSE_AT], [titleArea, collapsedTarget], Extrapolation.CLAMP);
    const searchH = hasSearch ? interpolate(scrollY.value, [0, stage1], [searchHeight, 0], Extrapolation.CLAMP) : 0;
    return { height: titleH + searchH + insets.top };
  });

  const backdropOpacityStyle = useAnimatedStyle(() => {
    if (!animateBackdrop) return { opacity: 1 };
    return {
      opacity: interpolate(scrollY.value, [0, BACKDROP_FADE_AT], [0, 1], Extrapolation.CLAMP),
    };
  });

  const imageFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [stage1, stage1 + COLLAPSE_AT], [1, 0], Extrapolation.CLAMP),
  }));

  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [stage1, stage1 + COLLAPSE_AT * 0.6], [1, 0], Extrapolation.CLAMP),
    marginTop: interpolate(scrollY.value, [stage1, stage1 + COLLAPSE_AT], [TITLE_TOP_MARGIN, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [stage1, stage1 + COLLAPSE_AT], [0, -12], Extrapolation.CLAMP) }],
  }));

  // Search MINIMIZES (height → 0), it does not fade — overflow-hidden + justify-end make the pill slide
  // up and clip away (WhatsApp). This finishes before the title starts collapsing (staged above).
  const searchRowStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, SEARCH_ROW_HEIGHT], [SEARCH_ROW_HEIGHT, 0], Extrapolation.CLAMP),
  }));

  const compactTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [stage1 + COLLAPSE_AT * 0.55, stage1 + COLLAPSE_AT], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View className="relative overflow-hidden" style={[{ paddingTop: insets.top }, containerStyle]}>
      {backdrop ? (
        <Animated.View className="absolute inset-0" style={backdropOpacityStyle} pointerEvents="none">
          {backdrop}
        </Animated.View>
      ) : null}

      {hasTabs ? (
        <Animated.View className="absolute inset-0" style={imageFadeStyle} pointerEvents="none">
          <ScreenHeaderTabsBackground fallback={backgroundImage} />
        </Animated.View>
      ) : backgroundImage ? (
        <Animated.View className="absolute inset-0" style={imageFadeStyle} pointerEvents="none">
          <Image source={backgroundImage} resizeMode="cover" className="h-full w-full" />
        </Animated.View>
      ) : null}

      {reserveBar ? <View className="h-11" pointerEvents="none" /> : null}

      <Animated.View className="flex-1 justify-start gap-0.5 px-4 pb-1" style={largeTitleStyle} pointerEvents="none">
        <Text className="text-2xl font-bold text-foreground" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </Animated.View>

      {hasSearch ? (
        // The row's height animates 52→0; the pill is flex-1 so it FILLS that height — the pill itself
        // squishes/minimizes (it isn't a fixed-height pill being clipped). overflow-hidden clips the
        // icon/input once the pill gets too short.
        <Animated.View className="overflow-hidden px-4 pb-2" style={searchRowStyle}>
          <View
            className="flex-1 flex-row items-center  gap-2 overflow-hidden rounded-full px-5"
            style={{ backgroundColor: pillFill }}
          >
            <DynamicIcon icon={SEARCH_ICON} size={14} style={{marginRight: 2,marginTop: 4}} className="text-muted-foreground" />
            <TextInput
              className="flex-1 text-base "
              style={{ color: fgVar ? `hsl(${fgVar})` : undefined, paddingLeft:2 }}
              placeholder={searchPlaceholder}
              placeholderTextColor={mutedFgVar ? `hsl(${mutedFgVar})` : undefined}
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                setQuery(text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
        </Animated.View>
      ) : null}

      {hasTabs ? <ScreenHeaderTabs tabs={tabs ?? []} background={tabsBackground} /> : null}

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
