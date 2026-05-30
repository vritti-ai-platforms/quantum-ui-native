import { MaterialIcons, type MaterialIconsIconName } from '@react-native-vector-icons/material-icons';
import {
  type BottomTabBarProps,
  type BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useEffect, useMemo, useRef } from 'react';
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
import { PushNavigator, type PushScreenConfig } from '../PushNavigator';
import { ScreenContainer } from '../ScreenContainer';
import type { BottomNavigationProps, RouteConfig, TabIcon } from './types';

const Tab = createBottomTabNavigator();

const MAX_VISIBLE = 4;

type MoreListItem = Pick<RouteConfig, 'name' | 'label'> & { icon: TabIcon };

function resolveTabIcon(route: RouteConfig): BottomTabNavigationOptions['tabBarIcon'] {
  return {
    type: 'materialIcon',
    name: route.icon.materialIcon ?? 'apps',
  } as unknown as BottomTabNavigationOptions['tabBarIcon'];
}

function MoreListScreen({ route }: { route: { params?: { items?: MoreListItem[] } } }) {
  const items = route.params?.items ?? [];
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
            <MaterialIcons
              name={(item.icon.materialIcon ?? 'apps') as MaterialIconsIconName}
              size={22}
              color={theme.foreground}
            />
          </View>
          <Text style={[styles.rowLabel, { color: theme.foreground }]}>{item.label ?? item.name}</Text>
          <MaterialIcons name={'chevron-right' as MaterialIconsIconName} size={20} color={theme.border} />
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

function MoreTabContent({ route }: { route: { params?: { routes?: RouteConfig[] } } }) {
  const overflowRoutes = route.params?.routes ?? [];

  const screens = useMemo<PushScreenConfig[]>(
    () => [
      {
        name: '__more_list__',
        component: MoreListScreen,
        headerShown: false,
        initialParams: {
          items: overflowRoutes.map((r) => ({ name: r.name, label: r.label, icon: r.icon })),
        },
      },
      ...overflowRoutes.map((r) => {
        // reuse the route's header fn as the push-screen header (the host value ignores props)
        const header = r.options?.header as PushScreenConfig['header'];
        return {
          name: r.name,
          component: r.component,
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

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark, palette: theme } = useTheme();

  // Scale the whole pill proportionally to the device width (clamped) so it isn't a fixed
  // size across very different screens. useWindowDimensions re-runs on rotation/foldables.
  const { width: screenWidth } = useWindowDimensions();
  const scale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, screenWidth / REF_WIDTH));
  const tabSize = Math.round(BASE_TAB * scale);
  const pillSize = Math.round(BASE_PILL * scale);
  const iconSize = Math.round(BASE_ICON * scale);
  const pillPad = Math.round(BASE_PAD * scale);
  const barRadius = (tabSize + pillPad * 2) / 2;

  // Hide the pill when the focused tab's nested navigator has pushed past its initial route.
  const nestedState = state.routes[state.index]?.state;
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

  // Sliding selection pill. Tabs are equal width, so the pill's position is linear in the
  // (animated) active index: translateX = pillLeft0 + progress * step.
  const progress = useSharedValue(state.index);
  const pillLeft0 = useSharedValue(0);
  const pillTop = useSharedValue(0);
  const step = useSharedValue(0);
  const ready = useSharedValue(0);
  const positionsRef = useRef<Array<{ x: number; y: number; w: number; h: number }>>([]);

  useEffect(() => {
    progress.value = withTiming(state.index, { duration: 260, easing: Easing.bezier(0.4, 0, 0.2, 1) });
  }, [state.index, progress]);

  const handleTabLayout = (index: number, e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    positionsRef.current[index] = { x, y, w: width, h: height };
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

  return (
    <Animated.View
      style={[styles.barWrapper, { paddingBottom: barBottomGap }, animatedStyle]}
      pointerEvents={isOnPushedScreen ? 'none' : 'box-none'}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: theme.card,
            borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
            borderColor: theme.border,
            borderRadius: barRadius,
            padding: pillPad,
          },
        ]}
      >
        {/* Single pill that slides between tabs; painted behind the icons. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.slidingPill,
            { width: pillSize, height: pillSize, borderRadius: pillSize / 2, backgroundColor: theme.primary },
            pillStyle,
          ]}
        />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const iconOpt = options.tabBarIcon;
          const iconName: MaterialIconsIconName = (
            iconOpt && typeof iconOpt === 'object' && !Array.isArray(iconOpt) && 'name' in iconOpt
              ? String((iconOpt as Record<string, unknown>).name)
              : 'apps'
          ) as MaterialIconsIconName;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabButton
              key={route.key}
              index={index}
              progress={progress}
              iconName={iconName}
              iconColor={theme.foreground}
              activeIconColor={theme.primaryForeground}
              tabSize={tabSize}
              slotSize={pillSize}
              iconSize={iconSize}
              selected={isFocused}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              onLayout={(e) => handleTabLayout(index, e)}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

interface TabButtonProps {
  index: number;
  progress: SharedValue<number>;
  iconName: MaterialIconsIconName;
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
        <MaterialIcons name={iconName} size={iconSize} color={iconColor} />
        <Animated.View style={[styles.iconOverlay, activeIconStyle]} pointerEvents="none">
          <MaterialIcons name={iconName} size={iconSize} color={activeIconColor} />
        </Animated.View>
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

export function BottomNavigation({ routes: allRoutes, initialRoute, screenOptions }: BottomNavigationProps) {
  const visibleRoutes = allRoutes.length > MAX_VISIBLE ? allRoutes.slice(0, MAX_VISIBLE) : allRoutes;
  const overflowRoutes = allRoutes.length > MAX_VISIBLE ? allRoutes.slice(MAX_VISIBLE) : [];
  const hasMore = overflowRoutes.length > 0;
  const { isDark } = useTheme();

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: { ...base.colors, background: 'transparent', card: 'transparent' },
    };
  }, [isDark]);

  const navigatorKey = `tab-nav-${allRoutes.map((r) => r.name).join(',')}`;

  return (
    <ThemeProvider value={navigationTheme}>
      <Tab.Navigator
        key={navigatorKey}
        initialRouteName={initialRoute ?? visibleRoutes[0]?.name}
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: 'transparent' },
          ...screenOptions,
        }}
      >
        {visibleRoutes.map((route) => (
          <Tab.Screen
            key={route.name}
            name={route.name}
            component={route.component}
            initialParams={route.params}
            options={{
              tabBarLabel: route.label ?? route.name,
              tabBarIcon: resolveTabIcon(route),
              tabBarBadge: route.badge,
              ...route.options,
            }}
          />
        ))}
        {hasMore && (
          <Tab.Screen
            name="__more__"
            component={MoreTabContent}
            initialParams={{ routes: overflowRoutes }}
            options={{
              tabBarLabel: 'More',
              tabBarIcon: {
                type: 'materialIcon',
                name: 'more-horiz',
              } as unknown as BottomTabNavigationOptions['tabBarIcon'],
            }}
          />
        )}
      </Tab.Navigator>
    </ThemeProvider>
  );
}
