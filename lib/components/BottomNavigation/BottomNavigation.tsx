import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import type { ColorValue } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
 * The navigation theme is the **single source of truth** for all native view colors.
 * JS props like tabBarStyle/sceneStyle are ignored by the native implementation.
 */
export function BottomNavigation({
  routes,
  initialRoute,
  screenOptions,
}: BottomNavigationProps) {
  const { isDark } = useTheme();
  const theme = isDark ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer theme={theme} >
      <Tab.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          tabBarActiveBackgroundColor:'transparent',
          tabBarStyle: { backgroundColor: 'transparent' },
          sceneStyle: { backgroundColor: theme.colors.background, },
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
