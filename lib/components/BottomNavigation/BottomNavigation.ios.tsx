import { type BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useMemo } from 'react';
import { DynamicColorIOS, useColorScheme } from 'react-native';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { useTheme } from '../../hooks/useTheme';
import { getTheme } from '../../theme/colors';
import type { BottomNavigationProps, RouteConfig } from './types';

const Tab = createBottomTabNavigator();

function resolveIcon(route: RouteConfig): BottomTabNavigationOptions['tabBarIcon'] {
  return { type: 'sfSymbol', name: route.icon.sfSymbol };
}

export function BottomNavigation({ routes, initialRoute, screenOptions }: BottomNavigationProps) {
  const { isDark } = useTheme();
  const { version } = usePlatformInfo();
  const systemScheme = useColorScheme();

  // Liquid Glass tab bar lands in iOS 26
  const isIOS26Plus = version >= 26;

  const isNavDark = systemScheme === 'dark';

  const lightThemeColors = useMemo(() => getTheme('light'), []);
  const darkThemeColors = useMemo(() => getTheme('dark'), []);
  const currentBackground = isDark ? darkThemeColors.background : lightThemeColors.background;

  // iOS 26+: DynamicColorIOS is baked into UIKit — zero JS latency on scheme change
  // iOS 18-: plain string that updates when isDark flips
  const sceneBackground = useMemo(
    () =>
      isIOS26Plus
        ? DynamicColorIOS({
            light: lightThemeColors.background,
            dark: darkThemeColors.background,
          })
        : currentBackground,
    [isIOS26Plus, currentBackground, lightThemeColors.background, darkThemeColors.background],
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

  // iOS 26+: backgroundColor has no effect (Liquid Glass owns it) — transparent
  // iOS 18-: must be set explicitly so UITabBar renders correctly
  const tabBarStyle = useMemo(
    () => (isIOS26Plus ? { backgroundColor: 'transparent' as const } : { backgroundColor: currentBackground }),
    [isIOS26Plus, currentBackground],
  );

  // iOS 18- fix: changing key forces a full remount of UITabBarController when
  // the theme flips. The native tab bar silently ignores tabBarStyle prop updates
  // mid-life. Remounting guarantees the correct color from the start.
  // iOS 26+: key stays constant — DynamicColorIOS handles it.
  const navigatorKey = isIOS26Plus ? 'tab-nav' : `tab-nav-${isDark ? 'dark' : 'light'}`;

  return (
    <ThemeProvider value={navigationTheme}>
      <Tab.Navigator
        key={navigatorKey}
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarStyle,
          sceneStyle: { backgroundColor: sceneBackground },
          ...screenOptions,
        }}
      >
        {routes.map((route) => (
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
      </Tab.Navigator>
    </ThemeProvider>
  );
}
