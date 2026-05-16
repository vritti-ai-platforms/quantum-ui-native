import { type BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useMemo } from 'react';
import { DynamicColorIOS, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { usePushNavigator } from '../../hooks/usePushNavigator';
import { useTheme } from '../../hooks/useTheme';
import { getTheme, THEME } from '../../theme/colors';
import { PushNavigator } from '../PushNavigator';
import { ScreenContainer } from '../ScreenContainer';
import type { BottomNavigationProps, RouteConfig, TabIcon } from './types';

const Tab = createBottomTabNavigator();

// Show 4 content tabs; overflow goes into the More tab.
const MAX_VISIBLE = 3;

function resolveIcon(route: RouteConfig): BottomTabNavigationOptions['tabBarIcon'] {
  return { type: 'sfSymbol', name: route.icon.sfSymbol };
}

type MoreListItem = Pick<RouteConfig, 'name' | 'label'> & { icon: TabIcon };

// List screen rendered as the initial route inside the More PushNavigator.
// Reads its items from route.params (set via initialParams on Stack.Screen) so
// that React Context propagation issues with NativeStack are avoided.
function MoreListScreen({ route }: { route: { params?: { items?: MoreListItem[] } } }) {
  const items = route.params?.items ?? [];
  const { push } = usePushNavigator();
  // Subscribe to ThemeContext — iOS 26+ keeps the Tab.Navigator mounted across
  // theme flips (constant navigatorKey to preserve liquid-glass state), so this
  // screen never re-renders unless it explicitly consumes the context. Without
  // this line, getTheme() returns the palette captured at first mount and the
  // More-tab rows show stale colors after a theme toggle.
  useTheme();
  const theme = getTheme();

  return (
    <ScreenContainer scrollable>
      {items.map((item) => (
        <Pressable
          key={item.name}
          style={[styles.row, { borderBottomColor: theme.border }]}
          onPress={() => push(item.name)}
        >
          <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
            <SFSymbol name={item.icon.sfSymbol} size={20} color={theme.foreground} />
          </View>
          <Text style={[styles.rowLabel, { color: theme.foreground }]}>{item.label ?? item.name}</Text>
          <Text style={[styles.chevron, { color: theme.border }]}>›</Text>
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

// Defined at module level for a stable Tab.Screen component reference.
// Overflow routes arrive via initialParams. Renders a PushNavigator so each
// selected screen gets the native iOS back gesture/button for free.
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 17 },
  chevron: { fontSize: 20, fontWeight: '300' },
});

export function BottomNavigation({ routes: allRoutes, initialRoute, screenOptions }: BottomNavigationProps) {
  const visibleRoutes = allRoutes.length > MAX_VISIBLE ? allRoutes.slice(0, MAX_VISIBLE) : allRoutes;
  const overflowRoutes = allRoutes.length > MAX_VISIBLE ? allRoutes.slice(MAX_VISIBLE) : [];
  const hasMore = overflowRoutes.length > 0;

  const { version } = usePlatformInfo();
  const systemScheme = useColorScheme();
  // Subscribe to user-driven preference flips so the navigator re-renders
  // when the user picks light/dark/system from the AccountScreen picker —
  // useColorScheme() alone doesn't fire on explicit overrides reliably.
  const { isDark } = useTheme();

  const isIOS26Plus = version >= 26;
  const isNavDark = systemScheme === 'dark';

  const lightThemeColors = THEME.light;
  const darkThemeColors = THEME.dark;

  // DynamicColorIOS resolves at the UIKit layer via trait collection — when
  // Appearance.setColorScheme() flips the window's overrideUserInterfaceStyle,
  // UIKit redraws sceneBackground and the tab bar background without any
  // React re-render or navigator remount.
  const sceneBackground = useMemo(
    () =>
      DynamicColorIOS({
        light: lightThemeColors.background,
        dark: darkThemeColors.background,
      }),
    [lightThemeColors.background, darkThemeColors.background],
  );

  const navigationTheme = useMemo(() => {
    const base = isNavDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isNavDark,
      colors: {
        ...base.colors,
        background: sceneBackground as unknown as string,
        card: 'transparent',
      },
    };
  }, [isNavDark, sceneBackground]);

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: DynamicColorIOS({
        light: lightThemeColors.background,
        dark: darkThemeColors.background,
      }),
    }),
    [lightThemeColors.background, darkThemeColors.background],
  );

  // iOS 26+: constant key — liquid glass paints through a re-resolving blur
  // layer, so DynamicColorIOS handles theme flips without remount and the
  // tab navigator preserves its state across appearance changes.
  // iOS pre-26: include isDark in the key. Native UITabBarAppearance is a
  // value-type snapshot that bakes the resolved color at navigator-creation
  // time and does NOT reliably re-resolve DynamicColorIOS mid-life — without
  // a remount the bar background stays on the previous theme until something
  // else (a tab change, navigation event) re-applies screen options.
  const routeKey = allRoutes.map((r) => r.name).join(',');
  const navigatorKey = isIOS26Plus ? `tab-nav-${routeKey}` : `tab-nav-${isDark ? 'dark' : 'light'}-${routeKey}`;

  return (
    <ThemeProvider value={navigationTheme}>
      <Tab.Navigator
        key={navigatorKey}
        initialRouteName={initialRoute ?? visibleRoutes[0]?.name}
        screenOptions={{
          headerShown: false,
          // iOS 26+: tabBarBlurEffect:'systemDefault' makes RNSTabBarAppearanceCoordinator
          // skip setting UITabBarAppearance.backgroundEffect entirely, so UIKit applies
          // liquid glass automatically. backgroundColor:'transparent' prevents the
          // appearance from setting an opaque color on top of the glass.
          // The React Navigation default (systemMaterial/systemMaterialDark) always
          // sets a blur effect that overrides the glass — 'systemDefault' is the escape hatch.
          // iOS 18-: explicit background color; old-style blur via systemMaterial default.
          ...(isIOS26Plus
            ? {
                tabBarBlurEffect: 'systemDefault',
                tabBarStyle: { backgroundColor: 'transparent' as const },
              }
            : {
                tabBarActiveBackgroundColor: 'transparent',
                tabBarStyle,
              }),
          sceneStyle: { backgroundColor: sceneBackground },
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
              tabBarIcon: resolveIcon(route),
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
              tabBarIcon: { type: 'sfSymbol', name: 'ellipsis' },
            }}
          />
        )}
      </Tab.Navigator>
    </ThemeProvider>
  );
}
