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
import { PushNavigator } from '../PushNavigator';
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

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark, palette: theme } = useTheme();

  // Hide the pill when the focused tab's nested navigator has pushed past its initial route.
  const nestedState = state.routes[state.index]?.state;
  const isOnPushedScreen = typeof nestedState?.index === 'number' && nestedState.index > 0;

  const barBottomGap = Math.max(insets.bottom, 6) + 6;
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
                {/* Mount a fresh node per selection — Android's drawable can't transition backgroundColor without flattening to a square. */}
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
  activeBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 21,
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
