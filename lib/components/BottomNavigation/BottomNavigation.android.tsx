import { MaterialIcons, type MaterialIconsIconName } from '@react-native-vector-icons/material-icons';
import {
  type BottomTabBarProps,
  type BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePushNavigator } from '../../hooks/usePushNavigator';
import { useTheme } from '../../hooks/useTheme';
import { getTheme } from '../../theme/colors';
import { PushNavigator } from '../PushNavigator';
import { ScreenContainer } from '../ScreenContainer';
import type { BottomNavigationProps, RouteConfig, TabIcon } from './types';

const Tab = createBottomTabNavigator();

// Keep 3 content tabs so the floating pill stays compact.
const MAX_VISIBLE = 4;

type MoreListItem = Pick<RouteConfig, 'name' | 'label'> & { icon: TabIcon };

// Store the materialIcon name as the icon descriptor so FloatingTabBar can read it.
function resolveTabIcon(route: RouteConfig): BottomTabNavigationOptions['tabBarIcon'] {
  return {
    type: 'materialIcon',
    name: route.icon.materialIcon ?? 'apps',
  } as unknown as BottomTabNavigationOptions['tabBarIcon'];
}

function MoreListScreen({ route }: { route: { params?: { items?: MoreListItem[] } } }) {
  const items = route.params?.items ?? [];
  const { push } = usePushNavigator();
  useTheme();
  const theme = getTheme();

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

  const screens = useMemo(
    () => [
      {
        name: '__more_list__',
        component: MoreListScreen,
        headerShown: false,
        initialParams: {
          items: overflowRoutes.map((r) => ({ name: r.name, label: r.label, icon: r.icon })),
        },
      },
      ...overflowRoutes.map((r) => ({
        name: r.name,
        component: r.component,
        title: r.label ?? r.name,
        initialParams: r.params,
      })),
    ],
    [overflowRoutes],
  );

  return <PushNavigator initialRoute="__more_list__" screens={screens} />;
}

// Floating pill tab bar — pure React, no native BottomNavigationView.
// Theme changes re-render via useTheme() without any navigator remount.
function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const theme = getTheme();

  // Hide the pill when the focused tab's nested navigator (More tab, or any
  // micro-frontend with its own PushNavigator inside) has pushed beyond its
  // initial route. The pushed screen has its own header + back button.
  const nestedState = state.routes[state.index]?.state;
  const isOnPushedScreen = typeof nestedState?.index === 'number' && nestedState.index > 0;

  const barBottomGap = Math.max(insets.bottom, 6) + 6;
  // Pill (62) + wrapper bottom gap + small buffer so the slide finishes
  // fully off-screen including shadow.
  const slideDistance = 62 + barBottomGap + 8;
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
            // Border only in dark mode where bg-card blends with bg-background.
            borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
            borderColor: theme.border,
          },
        ]}
      >
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
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              <View style={styles.iconSlot}>
                {/* Active background as a conditionally-mounted, absolute-positioned
                    View — every selection mounts a fresh node with borderRadius set
                    from the start, so Android's drawable never has to transition
                    backgroundColor on a View it might flatten into a square. */}
                {isFocused ? <View style={[styles.activeBg, { backgroundColor: theme.primary }]} /> : null}
                <MaterialIcons
                  name={iconName}
                  size={22}
                  color={isFocused ? theme.primaryForeground : theme.foreground}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // Pill auto-sizes; centering it avoids stretching to screen width.
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pill: {
    flexDirection: 'row',
    // Half of pill height (62) → fully-rounded pill ends.
    borderRadius: 31,
    // Uniform padding so the active indicator has the same gap from the
    // pill edge on every side, including corner-selected tabs.
    padding: 5,
    // Material elevation handles Android shadow; shadowColor lets newer
    // Android versions (10+) tint the elevation shadow black for a deeper drop.
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  tabItem: {
    // Fixed-width tabs let the pill auto-size to its content; combined with
    // uniform pill padding and centered iconSlot, every tab — including the
    // corner ones — gets an identical 10px halo when active.
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
  activeBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 21,
  },
  // MoreListScreen styles
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

  // Navigator colors are transparent so the area around/below the floating
  // pill doesn't paint the tab-navigator background. Each screen's
  // ScreenContainer provides its own bg-background which extends full height
  // — including behind the floating pill — so there's no white strip below
  // the pill. Screens that need their last item visible above the pill
  // should add bottom padding to their own content (e.g. pb-28 / pb-32).
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: { ...base.colors, background: 'transparent', card: 'transparent' },
    };
  }, [isDark]);

  // Only route names in the key — theme changes are handled reactively in
  // FloatingTabBar via useTheme(), so isDark remounts are no longer needed.
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
