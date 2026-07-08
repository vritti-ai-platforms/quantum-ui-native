import { type BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { createContext, useContext, useMemo, useRef } from 'react';
import { DynamicColorIOS, Image, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { sfSymbolSource } from '../DynamicIcon/sfSymbolSource';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { usePushNavigator } from '../../hooks/usePushNavigator';
import { useTheme } from '../../hooks/useTheme';
import { THEME } from '../../theme/colors';
import { PushNavigator, type PushScreenConfig } from '../PushNavigator';
import { ScreenContainer } from '../ScreenContainer';
import type { BottomNavigationProps, RouteConfig } from './types';

const Tab = createBottomTabNavigator();

const MAX_VISIBLE = 3;

function resolveIcon(route: RouteConfig): BottomTabNavigationOptions['tabBarIcon'] {
  return { type: 'sfSymbol', name: route.icon.sfSymbol };
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
        >
          <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
            <Image
              source={{ uri: sfSymbolSource(item.icon.sfSymbol, 20, theme.foreground, 'regular', false) }}
              resizeMode="contain"
              style={{ width: 20, height: 20 }}
            />
          </View>
          <Text style={[styles.rowLabel, { color: theme.foreground }]}>{item.label ?? item.name}</Text>
          <Text style={[styles.chevron, { color: theme.border }]}>›</Text>
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

export function BottomNavigation({
  routes: allRoutes,
  initialRoute,
  screenOptions,
  onActiveTabChange,
}: BottomNavigationProps) {
  // Tracks the currently-focused tab so screenListeners.focus can skip the initial (cold-launch) focus
  // and only report genuine tab CHANGES to the host.
  const activeRouteRef = useRef<string | null>(null);
  // Only split into a "More" tab when it would hold ≥2 items — a lone overflow item is shown directly.
  const useOverflow = allRoutes.length > MAX_VISIBLE + 1;
  const visibleRoutes = useMemo(
    () => (useOverflow ? allRoutes.slice(0, MAX_VISIBLE) : allRoutes),
    [allRoutes, useOverflow],
  );
  const overflowRoutes = useMemo(() => (useOverflow ? allRoutes.slice(MAX_VISIBLE) : []), [allRoutes, useOverflow]);
  const hasMore = overflowRoutes.length > 0;

  const { version } = usePlatformInfo();
  const systemScheme = useColorScheme();
  // useColorScheme alone doesn't fire on explicit overrides reliably.
  const { isDark } = useTheme();

  const isIOS26Plus = version >= 26;
  const isNavDark = systemScheme === 'dark';

  const lightThemeColors = THEME.light;
  const darkThemeColors = THEME.dark;

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

  // iOS pre-26 needs isDark in the key — UITabBarAppearance bakes the color at creation and won't re-resolve DynamicColorIOS mid-life.
  const routeKey = allRoutes.map((r) => r.name).join(',');
  const navigatorKey = isIOS26Plus ? `tab-nav-${routeKey}` : `tab-nav-${isDark ? 'dark' : 'light'}-${routeKey}`;

  return (
    <OverflowRoutesContext.Provider value={overflowRoutes}>
      <ThemeProvider value={navigationTheme}>
        <Tab.Navigator
          key={navigatorKey}
          initialRouteName={initialRoute ?? visibleRoutes[0]?.name}
          // Report genuine tab changes to the host (e.g. to clear the Apollo cache per feature). Fires on
          // the incoming tab's focus; the ref skips the very first focus so cold-launch boot isn't treated
          // as a change.
          screenListeners={({ route }) => ({
            focus: () => {
              const prev = activeRouteRef.current;
              if (prev === route.name) return;
              activeRouteRef.current = route.name;
              if (prev !== null) onActiveTabChange?.(route.name, prev);
            },
          })}
          // Hide the tab bar when the focused tab has pushed past its initial route (same detection as
          // BottomNavigation.android). We hide via tabBarStyle.display:'none' — NOT a custom `tabBar` — so the
          // *native* tab bar (and its iOS-26 tabBarBlurEffect liquid glass) is what renders when visible; a
          // custom tabBar would replace the native bar and lose the glass. screenOptions is a function so it
          // re-evaluates when the focused tab's nested stack depth changes; display:'none' removes the bar so
          // the pushed screen reflows to fill, and the glass bar reappears when the tab pops back to its root.
          screenOptions={({ route, navigation }) => {
            // route.state is stripped by React Navigation's useRouteCache (stashed on a private symbol), so
            // it's always undefined here — read the LIVE nested stack depth from the navigator's own (uncached)
            // state instead. navigation.getState() returns this tab navigator's state, whose routes each carry
            // their nested .state. Re-runs on every nav-state change → reactive (the equivalent of the full
            // props.state a custom tabBar would receive, without replacing the native glass bar).
            const nested = navigation.getState().routes.find((r) => r.key === route.key)?.state as
              | { index?: number }
              | undefined;
            const onPushed = (nested?.index ?? 0) > 0;
            return {
              headerShown: false,
              // iOS 26+: 'systemDefault' tabBarBlurEffect lets UIKit apply liquid glass instead of overriding it.
              ...(isIOS26Plus
                ? {
                    tabBarBlurEffect: 'systemDefault',
                    tabBarStyle: onPushed ? { display: 'none' as const } : { backgroundColor: 'transparent' as const },
                  }
                : {
                    tabBarActiveBackgroundColor: 'transparent',
                    tabBarStyle: onPushed ? { display: 'none' as const } : tabBarStyle,
                  }),
              sceneStyle: { backgroundColor: sceneBackground },
              ...screenOptions,
            };
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
              options={{
                tabBarLabel: 'More',
                tabBarIcon: { type: 'sfSymbol', name: 'ellipsis' },
              }}
            />
          )}
        </Tab.Navigator>
      </ThemeProvider>
    </OverflowRoutesContext.Provider>
  );
}
