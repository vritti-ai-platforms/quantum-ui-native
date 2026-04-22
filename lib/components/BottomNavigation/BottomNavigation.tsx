import { type BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getTheme } from '../../theme/colors';
import type { BottomNavigationProps, RouteConfig } from './types';

const Tab = createBottomTabNavigator();
const isIOS = Platform.OS === 'ios';

function resolveIcon(route: RouteConfig): BottomTabNavigationOptions['tabBarIcon'] {
  if (isIOS) {
    return { type: 'sfSymbol', name: route.icon.sfSymbol };
  }
  return { type: 'materialSymbol', name: route.icon.materialSymbol };
}

/**
 * Full-fledged bottom navigation component using native platform tabs.
 *
 * - **iOS**: UITabBarController with SF Symbols (Liquid Glass on iOS 26+)
 * - **Android**: Material 3 BottomNavigationView
 *
 * Expects to be rendered inside an app-owned NavigationContainer.
 * JS props like tabBarStyle/sceneStyle are ignored by the native implementation.
 */
export function BottomNavigation({ routes, initialRoute, screenOptions }: BottomNavigationProps) {
  const { isDark } = useTheme();
  const colors = useMemo(() => getTheme(isDark ? 'dark' : 'light'), [isDark]);

  return (
    <Tab.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarStyle: { backgroundColor: 'transparent' },
        sceneStyle: { backgroundColor: colors.background },
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
  );
}
