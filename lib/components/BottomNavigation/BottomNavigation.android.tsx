import { type BottomTabBarProps, createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { type ComponentType, createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePushNavigator } from '../../hooks/usePushNavigator';
import { useTheme } from '../../hooks/useTheme';
import codepoints from '../DynamicIcon/materialSymbols.codepoints.json';
import { PushNavigator, type PushScreenConfig } from '../PushNavigator';
import { ScreenContainer } from '../ScreenContainer';
import type { BottomNavigationProps, RouteConfig } from './types';

// react-native-bottom-tabs backs both platforms now. On Android the native Material bar is HIDDEN
// (a custom `tabBar` is provided), so we keep the hand-built Reanimated floating pill and render Material
// Symbol glyphs in JS. `detached` routes render in their OWN capsule beside the main pill — mirroring the
// iOS 26 detached search-role partition. The bridge's TypedNavigator resolves to the static branch under
// @react-navigation/native@8-alpha, hiding .Navigator/.Screen (they exist at runtime). Cast to the shape.
const Tab = createNativeBottomTabNavigator() as unknown as {
  Navigator: ComponentType<Record<string, unknown>>;
  Screen: ComponentType<Record<string, unknown>>;
};

const MAX_VISIBLE = 4;

const CODEPOINTS = codepoints as Record<string, number>;

// Per-tab metadata the custom bar needs, keyed by route name (icons come from the route config, not
// from native tab options, because the native bar is hidden). `detached` splits it into the side capsule.
type TabMeta = Record<string, { icon: string; label: string; detached: boolean; onPress?: () => void }>;

// Renders a Material Symbols glyph (codepoint) as text in the bundled font — pure JS, reliable on old
// Android (no native module, no ligatures). Mirrors DynamicIcon.android's approach.
function MaterialSymbol({ name, size, color }: { name: string; size: number; color: string }) {
  const cp = CODEPOINTS[name];
  if (cp == null) return null;
  return (
    <Text
      allowFontScaling={false}
      // Android matches fontFamily by the bundled asset's FILE BASENAME (MaterialSymbols_400Regular.ttf),
      // NOT the font's internal "Material Symbols" family name. Must match DynamicIcon.android.tsx.
      style={{ fontFamily: 'MaterialSymbols_400Regular', fontSize: size, lineHeight: size, color, includeFontPadding: false }}
    >
      {String.fromCharCode(cp)}
    </Text>
  );
}

// Action routes (onPress, no scene of their own) still need a Screen component for the navigator.
const NullScreen: ComponentType = () => null;

// Native tabs have no header slot; a route with a header is hosted in a one-screen nested native-stack.
function makeScreen(route: RouteConfig): ComponentType {
  const Comp = route.component ?? NullScreen;
  const header = route.header;
  if (!header) return Comp;
  // Name the nested stack's root distinctly from the tab (route.name) so react-navigation doesn't warn
  // about same-name nesting (HomeTabs > /uom > /uom). It's an internal root; detail pushes use their own names.
  const rootName = `${route.name}::view`;
  const screens: ReadonlyArray<PushScreenConfig> = [
    { name: rootName, component: Comp, initialParams: route.params, header },
  ];
  return function TabStack() {
    return <PushNavigator initialRoute={rootName} screens={screens} />;
  };
}

// Overflow routes flow to the More screens via context (not route params) so the More list
// stays reactive when the host's route set changes — initialParams are applied only once.
const OverflowRoutesContext = createContext<RouteConfig[]>([]);

function MoreListScreen() {
  const overflowRoutes = useContext(OverflowRoutesContext);
  const items = overflowRoutes.map((r) => ({ name: r.name, label: r.label, icon: r.icon }));
  const { push } = usePushNavigator();
  const { palette: theme } = useTheme();

  return (
    <ScreenContainer scrollable>
      {items.map((item) => (
        <Pressable
          key={item.name}
          style={[styles.row, { borderBottomColor: theme.border }]}
          onPress={() => push(item.name)}
          android_ripple={{ color: theme.border }}
        >
          <View style={[styles.moreIconWrap, { backgroundColor: theme.muted }]}>
            <MaterialSymbol name={item.icon.materialSymbol ?? 'apps'} size={22} color={theme.foreground} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.foreground }]}>{item.label ?? item.name}</Text>
          <MaterialSymbol name="chevron_right" size={20} color={theme.border} />
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

function MoreTabContent() {
  const overflowRoutes = useContext(OverflowRoutesContext);

  const screens = useMemo<PushScreenConfig[]>(
    () => [
      {
        name: '__more_list__',
        component: MoreListScreen,
        title: 'More',
      },
      ...overflowRoutes.map((r) => {
        const header = r.header;
        return {
          name: r.name,
          component: r.component ?? NullScreen,
          initialParams: r.params,
          ...(header ? { header } : { headerShown: false }),
        };
      }),
    ],
    [overflowRoutes],
  );

  return <PushNavigator initialRoute="__more_list__" screens={screens} />;
}

// Base sizes (tuned for ~390dp width → scale 1). Scaled proportionally to the device width.
const REF_WIDTH = 390;
const SCALE_MIN = 0.85;
const SCALE_MAX = 1.3;
const BASE_TAB = 52;
const BASE_PILL = 42;
const BASE_ICON = 22;
const BASE_PAD = 5;
const BASE_EDGE = 20;

type RouteEntry = { route: BottomTabBarProps['state']['routes'][number]; stateIndex: number };

function FloatingTabBar({ state, navigation, tabMeta }: BottomTabBarProps & { tabMeta: TabMeta }) {
  const insets = useSafeAreaInsets();
  const { isDark, palette: theme } = useTheme();

  // Scale the whole bar proportionally to the device width (clamped) so it isn't a fixed
  // size across very different screens. useWindowDimensions re-runs on rotation/foldables.
  const { width: screenWidth } = useWindowDimensions();
  const scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, screenWidth / REF_WIDTH));
  const tabSize = Math.round(BASE_TAB * scale);
  const pillSize = Math.round(BASE_PILL * scale);
  const iconSize = Math.round(BASE_ICON * scale);
  const pillPad = Math.round(BASE_PAD * scale);
  const edge = Math.round(BASE_EDGE * scale);
  const barRadius = (tabSize + pillPad * 2) / 2;

  // Partition into the main pill vs the detached side capsule (iOS-26-style separate partition).
  const mainEntries: RouteEntry[] = [];
  const detachedEntries: RouteEntry[] = [];
  state.routes.forEach((route, stateIndex) => {
    (tabMeta[route.name]?.detached ? detachedEntries : mainEntries).push({ route, stateIndex });
  });

  // Position of the focused route within the MAIN list (−1 while a detached tab is transiently focused).
  const focusedMain = mainEntries.findIndex((e) => e.stateIndex === state.index);

  // Hide both capsules when the focused tab's nested navigator has pushed past its initial route.
  const nestedState = state.routes[state.index]?.state as { index?: number } | undefined;
  const isOnPushedScreen = typeof nestedState?.index === 'number' && nestedState.index > 0;

  const barBottomGap = Math.max(insets.bottom, 6) + 6;
  const slideDistance = tabSize + pillPad * 2 + barBottomGap + 8;
  const visibility = useSharedValue(isOnPushedScreen ? 0 : 1);

  useEffect(() => {
    visibility.value = withTiming(isOnPushedScreen ? 0 : 1, {
      duration: 240,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [isOnPushedScreen, visibility]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
    transform: [{ translateY: (1 - visibility.value) * slideDistance }],
  }));

  // Sliding selection pill inside the MAIN pill. Tabs are equal width, so the pill's position is linear
  // in the (animated) active index: translateX = pillLeft0 + progress * step.
  const progress = useSharedValue(Math.max(0, focusedMain));
  const pillLeft0 = useSharedValue(0);
  const pillTop = useSharedValue(0);
  const step = useSharedValue(0);
  const ready = useSharedValue(0);
  const positionsRef = useRef<Array<{ x: number; y: number; w: number; h: number }>>([]);

  useEffect(() => {
    // Leave the pill where it is while a detached tab is transiently focused (it clears the workspace).
    if (focusedMain < 0) return;
    progress.value = withTiming(focusedMain, { duration: 260, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  }, [focusedMain, progress]);

  const handleTabLayout = (mainIndex: number, e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    positionsRef.current[mainIndex] = { x, y, w: width, h: height };
    const p0 = positionsRef.current[0];
    if (!p0) return;
    const p1 = positionsRef.current[1];
    pillLeft0.value = p0.x + (p0.w - pillSize) / 2;
    pillTop.value = p0.y + (p0.h - pillSize) / 2;
    step.value = p1 ? p1.x - p0.x : p0.w;
    ready.value = 1;
  };

  const pillStyle = useAnimatedStyle(() => ({
    opacity: ready.value,
    transform: [{ translateX: pillLeft0.value + progress.value * step.value }, { translateY: pillTop.value }],
  }));

  const capsuleStyle = {
    backgroundColor: theme.card,
    borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
    borderColor: theme.border,
    borderRadius: barRadius,
    padding: pillPad,
  } as const;

  const press = (route: RouteEntry['route'], isFocused: boolean) => {
    // Action routes (e.g. the detached workspace button) run their onPress instead of selecting the tab.
    const action = tabMeta[route.name]?.onPress;
    if (action) {
      action();
      return;
    }
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  return (
    <Animated.View
      style={[styles.barWrapper, { paddingBottom: barBottomGap }, animatedStyle]}
      pointerEvents={isOnPushedScreen ? 'none' : 'box-none'}
    >
      {/* iOS 26 layout: with a detached capsule, stretch full-width and push the main pill LEFT and the
          detached capsule RIGHT (space-between); otherwise center the lone main pill. box-none so the empty
          middle band doesn't swallow touches meant for content below. */}
      <View
        pointerEvents="box-none"
        style={[
          styles.group,
          detachedEntries.length > 0
            ? { alignSelf: 'stretch', justifyContent: 'space-between', paddingHorizontal: edge }
            : null,
        ]}
      >
        {/* Main pill (features) — left */}
        <View style={[styles.pill, capsuleStyle]}>
          {/* Single pill that slides between tabs; painted behind the icons. */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.slidingPill,
              { width: pillSize, height: pillSize, borderRadius: pillSize / 2, backgroundColor: theme.primary },
              pillStyle,
            ]}
          />
          {mainEntries.map(({ route, stateIndex }, mainIndex) => {
            const isFocused = state.index === stateIndex;
            const meta = tabMeta[route.name];
            return (
              <TabButton
                key={route.key}
                index={mainIndex}
                progress={progress}
                iconName={meta?.icon ?? 'apps'}
                iconColor={theme.foreground}
                activeIconColor={theme.primaryForeground}
                tabSize={tabSize}
                slotSize={pillSize}
                iconSize={iconSize}
                selected={isFocused}
                accessibilityLabel={meta?.label ?? route.name}
                onPress={() => press(route, isFocused)}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                onLayout={(e) => handleTabLayout(mainIndex, e)}
              />
            );
          })}
        </View>

        {/* Detached capsule (e.g. the workspace button) — right, iOS-26-style partition. */}
        {detachedEntries.length > 0 && (
          <View style={[styles.pill, capsuleStyle]}>
            {detachedEntries.map(({ route, stateIndex }) => {
              const isFocused = state.index === stateIndex;
              const meta = tabMeta[route.name];
              return (
                <DetachedButton
                  key={route.key}
                  iconName={meta?.icon ?? 'apps'}
                  iconColor={theme.foreground}
                  tabSize={tabSize}
                  slotSize={pillSize}
                  iconSize={iconSize}
                  accessibilityLabel={meta?.label ?? route.name}
                  onPress={() => press(route, isFocused)}
                />
              );
            })}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

interface TabButtonProps {
  index: number;
  progress: SharedValue<number>;
  iconName: string;
  iconColor: string;
  activeIconColor: string;
  tabSize: number;
  slotSize: number;
  iconSize: number;
  selected: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
  onLongPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}

function TabButton({
  index,
  progress,
  iconName,
  iconColor,
  activeIconColor,
  tabSize,
  slotSize,
  iconSize,
  selected,
  accessibilityLabel,
  onPress,
  onLongPress,
  onLayout,
}: TabButtonProps) {
  // The white (active) icon crossfades in as the pill arrives over this tab and out as it
  // leaves, over the always-visible base icon — so a white icon never shows without the pill.
  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [index - 1, index, index + 1], [0, 1, 0], Extrapolation.CLAMP),
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={onLayout}
      style={({ pressed }) => [styles.tabItem, { width: tabSize, height: tabSize }, pressed && styles.tabItemPressed]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.iconSlot, { width: slotSize, height: slotSize }]}>
        <MaterialSymbol name={iconName} size={iconSize} color={iconColor} />
        <Animated.View style={[styles.iconOverlay, activeIconStyle]} pointerEvents="none">
          <MaterialSymbol name={iconName} size={iconSize} color={activeIconColor} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

// A standalone button in the detached capsule — no sliding selection pill (its tab clears the workspace
// on focus, so it is never persistently selected). Just the glyph with a pressed state.
function DetachedButton({
  iconName,
  iconColor,
  tabSize,
  slotSize,
  iconSize,
  accessibilityLabel,
  onPress,
}: {
  iconName: string;
  iconColor: string;
  tabSize: number;
  slotSize: number;
  iconSize: number;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.tabItem, { width: tabSize, height: tabSize }, pressed && styles.tabItemPressed]}
    >
      <View style={[styles.iconSlot, { width: slotSize, height: slotSize }]}>
        <MaterialSymbol name={iconName} size={iconSize} color={iconColor} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 31,
    padding: 5,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  tabItem: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemPressed: {
    opacity: 0.6,
  },
  iconSlot: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slidingPill: {
    position: 'absolute',
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  moreIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 16 },
});

export function BottomNavigation({ routes: allRoutes, initialRoute, onActiveTabChange }: BottomNavigationProps) {
  // Tracks the currently-focused tab so screenListeners.focus can skip the initial (cold-launch) focus
  // and only report genuine tab CHANGES to the host.
  const activeRouteRef = useRef<string | null>(null);

  // Detached routes never enter the overflow "More" — they render in their own side capsule.
  const mainRoutes = useMemo(() => allRoutes.filter((r) => !r.detached), [allRoutes]);
  const detachedRoutes = useMemo(() => allRoutes.filter((r) => r.detached), [allRoutes]);

  // Only split into a "More" tab when it would hold ≥2 items — a lone overflow item is shown directly.
  const useOverflow = mainRoutes.length > MAX_VISIBLE + 1;
  const visibleMain = useMemo(
    () => (useOverflow ? mainRoutes.slice(0, MAX_VISIBLE) : mainRoutes),
    [mainRoutes, useOverflow],
  );
  const overflowRoutes = useMemo(() => (useOverflow ? mainRoutes.slice(MAX_VISIBLE) : []), [mainRoutes, useOverflow]);
  const hasMore = overflowRoutes.length > 0;

  // Stable component per route (nested-stack wrapper when a header is present).
  const mainScreens = useMemo(
    () => visibleMain.map((route) => ({ route, Component: makeScreen(route) })),
    [visibleMain],
  );
  const detachedScreens = useMemo(
    () => detachedRoutes.map((route) => ({ route, Component: makeScreen(route) })),
    [detachedRoutes],
  );

  // Icons/labels + the main-vs-detached split for the custom bar, keyed by route name.
  const tabMeta = useMemo<TabMeta>(() => {
    const meta: TabMeta = {};
    for (const r of visibleMain)
      meta[r.name] = { icon: r.icon.materialSymbol ?? 'apps', label: r.label ?? r.name, detached: false, onPress: r.onPress };
    if (hasMore) meta.__more__ = { icon: 'more_horiz', label: 'More', detached: false };
    for (const r of detachedRoutes)
      meta[r.name] = { icon: r.icon.materialSymbol ?? 'apps', label: r.label ?? r.name, detached: true, onPress: r.onPress };
    return meta;
  }, [visibleMain, hasMore, detachedRoutes]);

  // Force a clean remount when the route SET changes (a workspace switch changes the feature set).
  const navigatorKey = `tab-nav-${allRoutes.map((r) => r.name).join(',')}`;

  return (
    <OverflowRoutesContext.Provider value={overflowRoutes}>
      <Tab.Navigator
        key={navigatorKey}
        initialRouteName={initialRoute ?? visibleMain[0]?.name}
        tabBar={(props: BottomTabBarProps) => <FloatingTabBar {...props} tabMeta={tabMeta} />}
        screenListeners={({ route }: { route: { name: string } }) => ({
          focus: () => {
            const prev = activeRouteRef.current;
            if (prev === route.name) return;
            activeRouteRef.current = route.name;
            if (prev !== null) onActiveTabChange?.(route.name, prev);
          },
        })}
      >
        {mainScreens.map(({ route, Component }) => (
          <Tab.Screen
            key={route.name}
            name={route.name}
            component={Component}
            initialParams={route.params}
            options={{ title: route.label ?? route.name }}
          />
        ))}
        {hasMore && <Tab.Screen name="__more__" component={MoreTabContent} options={{ title: 'More' }} />}
        {detachedScreens.map(({ route, Component }) => (
          <Tab.Screen
            key={route.name}
            name={route.name}
            component={Component}
            initialParams={route.params}
            options={{ title: route.label ?? route.name }}
          />
        ))}
      </Tab.Navigator>
    </OverflowRoutesContext.Provider>
  );
}
