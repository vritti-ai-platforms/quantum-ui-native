import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import type { ColorValue } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useTheme } from '../../hooks/useTheme';
import { NAV_THEME } from '../../theme/colors';
import type { BottomNavigationProps, RouteConfig } from './types';

const Tab = createBottomTabNavigator();
const isIOS = Platform.OS === 'ios';

function resolveIcon(route: RouteConfig) {
  if (isIOS && route.icon.sfSymbol) {
    return { type: 'sfSymbol' as const, name: route.icon.sfSymbol } as any;
  }
  const IconComponent = route.icon.component;
  if (!IconComponent) return undefined;
  return ({ color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <IconComponent color={color as string} size={size} />
  );
}

/**
 * Full-fledged bottom navigation component using native platform tabs.
 *
 * - **iOS**: UITabBarController with SF Symbols (Liquid Glass on iOS 26+)
 * - **Android**: Material 3 BottomNavigationView
 *
 * Pass a `routes` array and the component handles everything:
 * NavigationContainer, theming, icons, badges, safe area.
 *
 * ```tsx
 * <BottomNavigation
 *   routes={[
 *     { name: 'Home', component: HomeScreen, icon: { sfSymbol: 'house', component: HomeIcon } },
 *     { name: 'Settings', component: SettingsScreen, icon: { sfSymbol: 'gear', component: GearIcon }, badge: 3 },
 *   ]}
 * />
 * ```
 */
export function BottomNavigation({
  routes,
  initialRoute,
  showLabels = true,
  screenOptions,
}: BottomNavigationProps) {
  const { isDark } = useTheme();
  const colors = NAV_THEME[isDark ? 'dark' : 'light'];

  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme : DefaultTheme).colors,
        ...colors,
      },
    }),
    [isDark, colors],
  );

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          lazy: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.border,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
          sceneStyle: { backgroundColor: colors.background },
          ...screenOptions,
        }}
      >
        {routes.map((route) => (
          <Tab.Screen
            key={route.name}
            name={route.name}
            component={route.component}
            options={{
              tabBarLabel: route.label ?? route.name,
              tabBarIcon: resolveIcon(route),
              tabBarBadge: route.badge,
              ...route.options,
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
