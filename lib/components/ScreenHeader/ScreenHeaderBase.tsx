import { useUnstableNativeVariable } from 'nativewind';
import { type ReactNode, useRef, useState } from 'react';
import { Image, type ImageSourcePropType, type LayoutChangeEvent, Platform, TextInput, View } from 'react-native';
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePermission } from '../../context/PermissionGateContext';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { DynamicIcon, type PlatformIconDescriptor } from '../DynamicIcon';
import { useScreenCreateAction } from '../ScreenContainer/screenActionRegistry';
import {
  setMeasuredScreenHeaderHeight,
  useRegisterScreenHeaderInset,
  useScreenRouteKey,
  useScreenScrollY,
} from '../ScreenContainer/screenScrollRegistry';
import { useScreenSearch } from '../ScreenContainer/screenSearchRegistry';
import { Text } from '../Text';
import { lockVariant, presentUpsellSheet } from '../Upsell';
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

const SEARCH_ICON: PlatformIconDescriptor = { sfSymbol: 'magnifyingglass', materialSymbol: 'search' };
const CREATE_ICON: PlatformIconDescriptor = { sfSymbol: 'plus', materialSymbol: 'add' };
// Outlined on both platforms: SF `lock` is the outline symbol; the bundled Material Symbols font is
// outline-style (`lock_outline` shares the same codepoint).
const LOCK_ICON: PlatformIconDescriptor = { sfSymbol: 'lock', materialSymbol: 'lock' };
// MF-shared theme reader — className COLORS don't apply reliably across the federation boundary, so the
// search pill resolves its fill/text/placeholder colors inline from the shared NativeWind variables.
const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

interface ScreenHeaderBaseProps {
  title: string;
  subtitle?: string;
  variant: ScreenHeaderVariant;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  createLabel?: string;
  createPermission?: string;
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
  createLabel,
  createPermission,
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
  const { os, version } = usePlatformInfo();
  // iOS 26's liquid-glass header stays translucent (the glass material masks content sliding beneath).
  // Pre-iOS 26 and Android have NO material — the header region is fully transparent, so tab-pager swipes
  // and scrolled keep-alive pages bleed through the chrome. A solid bg-background there is visually
  // identical at rest (content is inset below the header on the same background) and hides the bleed.
  const solidHeaderBg = !(os === 'ios' && version >= 26);
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
    return `hsl(${h} ${s} ${lightness > 50 ? lightness - 3 : lightness + 3}%)`;
  })();

  // Built-in create (+) button: fires the screen body's registered create handler (per-route action registry).
  // iOS 26 renders the LiquidGlass circle; Android + pre-26 iOS (where glass falls back to a bare ghost
  // icon) get a solid primary circle instead — `default` variant + icon size is already rounded-full, and
  // the Button's TextClassContext paints the + glyph primary-foreground.
  // Permission gating (createPermission, resolved via the host gate; fails open when absent): not granted →
  // no button; granted but locked → an amber outlined lock replaces the + and pressing is a no-op. NOT the
  // Button `disabled` prop — its opacity-50 over the iOS-26 LiquidGlassView triggers the glass-ghost artifact.
  const createAction = useScreenCreateAction();
  const createGate = usePermission(createPermission);
  const isLiquidGlass = os === 'ios' && version >= 26;
  const createButton = createLabel && createGate.granted ? (
    <Button
      variant={isLiquidGlass ? 'glass' : 'default'}
      size="icon"
      onPress={() => {
        // Locked → the create action never fires; the locked surface explains why (upsell for a plan lock,
        // "Not enabled for this site" for a site lock).
        if (createGate.locked) {
          presentUpsellSheet({
            featureName: createGate.featureName ?? title,
            unlockPlans: createGate.unlockPlans,
            variant: lockVariant(createGate.reason),
          });
          return;
        }
        createAction?.();
      }}
      accessibilityLabel={createLabel}
      accessibilityState={createGate.locked ? { disabled: true } : undefined}
      hitSlop={8}
    >
      {createGate.locked ? (
        <DynamicIcon
          icon={LOCK_ICON}
          size={22}
          className={lockVariant(createGate.reason) === 'site' ? 'text-destructive' : 'text-warning'}
        />
      ) : (
        <DynamicIcon icon={CREATE_ICON} size={24} />
      )}
    </Button>
  ) : null;

  const hasTabs = variant === 'tabs' && (tabs?.length ?? 0) > 0;
  // Actions render in both variants: standard places them in the top nav-bar band above the large title;
  // the tabs variant centers the title between them in a single collapsing nav row.
  const hasActions = leftActions != null || rightActions != null || createButton != null;
  const hasSearch = variant === 'standard' && searchable;
  // Standard reserves a top nav-bar band for its (absolutely-placed) actions; the tabs nav row IS that band.
  const reserveBar = variant === 'standard' && hasActions;
  const largeTitleHeight = subtitle ? LARGE_TITLE_HEIGHT : LARGE_TITLE_HEIGHT_NO_SUBTITLE;
  const searchHeight = hasSearch ? SEARCH_ROW_HEIGHT : 0;
  // tabs: a centered nav-bar row (BAR_HEIGHT) sitting above the tabs row — collapses to just the tabs.
  // standard: the (reserved bar) + the collapsible large title (no tabs row).
  const titleArea = hasTabs
    ? BAR_HEIGHT + TABS_HEIGHT
    : (reserveBar ? BAR_HEIGHT : 0) + TITLE_TOP_MARGIN + largeTitleHeight;
  const heroHeight = titleArea + searchHeight;
  const collapsedTarget = hasTabs ? TABS_HEIGHT : BAR_HEIGHT + BOTTOM_GAP;
  // Stage the collapse: scroll [0, searchHeight] MINIMIZES the search row (height → 0); only after that,
  // scroll [searchHeight, searchHeight + COLLAPSE_AT] collapses the large title. (stage1 = 0 with no search.)
  const stage1 = searchHeight;

  useRegisterScreenHeaderInset(overlay ? heroHeight : 0);
  // Measure-first (the collapsible-header standard): register the PAINTED expanded height as the offset
  // source of truth for content — consumers prefer it over the constants+safe-area formula, healing any
  // drift between computed and painted. First layout only (the height animates during collapse).
  const routeKey = useScreenRouteKey();
  const measuredOnceRef = useRef(false);
  const handleHeaderLayout = (e: LayoutChangeEvent) => {
    if (!overlay || measuredOnceRef.current) return;
    measuredOnceRef.current = true;
    setMeasuredScreenHeaderHeight(routeKey, e.nativeEvent.layout.height);
  };
  useRegisterScreenHeaderTabs(hasTabs ? tabs : undefined);

  const containerStyle = useAnimatedStyle(() => {
    const titleH = interpolate(
      scrollY.value,
      [stage1, stage1 + COLLAPSE_AT],
      [titleArea, collapsedTarget],
      Extrapolation.CLAMP,
    );
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
    transform: [
      { translateY: interpolate(scrollY.value, [stage1, stage1 + COLLAPSE_AT], [0, -12], Extrapolation.CLAMP) },
    ],
  }));

  // Tabs variant: the centered nav-bar row (title + actions) fades out as it collapses into the tabs.
  const navBarFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COLLAPSE_AT * 0.6], [1, 0], Extrapolation.CLAMP),
  }));

  // Once the nav row has faded out, stop it (and its now-invisible action buttons) from capturing touches,
  // so taps land on the pinned tabs underneath. Threshold = where navBarFadeStyle reaches 0.
  const [navCollapsed, setNavCollapsed] = useState(false);
  useAnimatedReaction(
    () => scrollY.value >= COLLAPSE_AT * 0.6,
    (collapsed, previous) => {
      if (collapsed !== previous) runOnJS(setNavCollapsed)(collapsed);
    },
  );

  // Search MINIMIZES (height → 0), it does not fade — overflow-hidden + justify-end make the pill slide
  // up and clip away (WhatsApp). This finishes before the title starts collapsing (staged above).
  const searchRowStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, SEARCH_ROW_HEIGHT], [SEARCH_ROW_HEIGHT, 0], Extrapolation.CLAMP),
  }));

  const compactTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [stage1 + COLLAPSE_AT * 0.55, stage1 + COLLAPSE_AT],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <Animated.View
      className={cn('relative overflow-hidden', solidHeaderBg && 'bg-background')}
      style={[{ paddingTop: insets.top }, containerStyle]}
      onLayout={handleHeaderLayout}
    >
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

      {hasTabs ? (
        // Tabs variant: a centered title that fades as the nav row collapses into the tabs. The left/right
        // actions are rendered at the CONTAINER level (below) — NOT here — so their iOS-26 glass mounts with a
        // STABLE frame on first render. A frame inside this Reanimated-animated flex band isn't settled at
        // mount, which left the glass buttons rendering as ghost until a relayout/remount.
        <Animated.View
          className="flex-1 items-center justify-center px-16"
          style={navBarFadeStyle}
          pointerEvents="none"
        >
          <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>
      ) : (
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
      )}

      {hasSearch ? (
        // The row's height animates 52→0; the pill is flex-1 so it FILLS that height — the pill itself
        // squishes/minimizes (it isn't a fixed-height pill being clipped). overflow-hidden clips the
        // icon/input once the pill gets too short.
        <Animated.View className="overflow-hidden px-4 py-1" style={searchRowStyle}>
          <View
            className="flex-1 flex-row items-center  gap-2 overflow-hidden rounded-full px-5"
            style={{ backgroundColor: pillFill }}
          >
            <DynamicIcon
              icon={SEARCH_ICON}
              size={18}
              // items-center aligns the boxes, but the iOS SFSymbol's glyph sits optically high
              // relative to the text — nudge it down a touch. Android's Text glyph needs no nudge.
              style={{ marginRight: 2, marginTop: Platform.OS === 'ios' ? 2 : 0 }}
              className="text-muted-foreground"
            />
            <TextInput
              className="flex-1  "
              style={{ color: fgVar ? `hsl(${fgVar})` : undefined, paddingLeft: 2 }}
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

      {/* Header actions at the CONTAINER level (fixed top/height) for BOTH variants — a stable frame so the
          iOS-26 glass mounts correctly on first render. CRITICAL: these are PLAIN Views, NEVER wrapped in an
          animated opacity. A LiquidGlassView whose ancestor has alpha < 1 (even momentarily, mid-mount before
          Reanimated commits) renders its glass effect DISABLED and stays that way until re-created — which is
          exactly why the tabs buttons showed as ghost until a scroll/remount. So the tabs variant does NOT
          fade the actions; it UNMOUNTS them once the nav row has collapsed (navCollapsed) — otherwise they'd
          overlap the pinned tabs. z-10 keeps the press/bounce above the tabs row. */}
      {leftActions && !(hasTabs && navCollapsed) ? (
        <View
          className="absolute left-4 z-10 items-center justify-center"
          style={{ top: insets.top, height: BAR_HEIGHT }}
          pointerEvents="box-none"
        >
          {leftActions}
        </View>
      ) : null}

      {(rightActions || createButton) && !(hasTabs && navCollapsed) ? (
        <View
          className="absolute right-4 z-10 flex-row items-center justify-center gap-2"
          style={{ top: insets.top, height: BAR_HEIGHT }}
          pointerEvents="box-none"
        >
          {rightActions}
          {createButton}
        </View>
      ) : null}
    </Animated.View>
  );
}
