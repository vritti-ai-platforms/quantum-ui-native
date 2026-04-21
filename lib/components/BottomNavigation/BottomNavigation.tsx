import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useMemo } from 'react';
import { Platform, type ColorValue } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getTheme } from '../../theme/colors';
import type { BottomNavigationProps, RouteConfig } from './types';
import { SafeAreaView } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const isIOS = Platform.OS === 'ios';

function resolveIcon(route: RouteConfig) {
  if (isIOS && route.icon.sfSymbol) {
    return { type: 'sfSymbol' as const, name: route.icon.sfSymbol } as any;
  }
  if (!isIOS && route.icon.materialSymbol) {
    return { type: 'materialSymbol' as const, name: route.icon.materialSymbol } as any;
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
  standalone = true,
}: BottomNavigationProps) {
  const { isDark } = useTheme();
  const colors = useMemo(() => getTheme(isDark ? 'dark' : 'light'), [isDark]);

  // Android native tab bar doesn't support React element icons — use JS implementation
  // when routes don't have materialSymbol native icons
  const needsCustomImpl = !isIOS && routes.some((r) => !r.icon.materialSymbol);

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

  const navigator = (
    <Tab.Navigator
      initialRouteName={initialRoute}
      // @ts-ignore — `implementation` is typed in v8 alpha but may not be in d.ts yet
      implementation={needsCustomImpl ? 'custom' : undefined}
      screenOptions={{
        headerShown: false,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarStyle: { backgroundColor: 'transparent' },
        sceneStyle: { backgroundColor: navTheme.colors.background },
        ...screenOptions,
      }}
    >
      {routes.map((route) => (
        'render' in route ? (
          <Tab.Screen
            key={route.name}
            name={route.name}
            options={{
              tabBarLabel: route.label ?? route.name,
              tabBarIcon: resolveIcon(route),
              tabBarBadge: route.badge,
              ...route.options,
            }}
          >
            {() => <SafeAreaView style={{ flex: 1 }}>{route.render!()}</SafeAreaView>}
          </Tab.Screen>
        ) : (
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
        )
      ))}
    </Tab.Navigator>
  );

  if (!standalone) return navigator;

  return (
    <NavigationContainer theme={navTheme}>
      {navigator}
    </NavigationContainer>
  );
}
