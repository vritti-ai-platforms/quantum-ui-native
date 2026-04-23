import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons, type MaterialIconsIconName } from '@react-native-vector-icons/material-icons';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { useMemo } from 'react';
import { Platform, type ColorValue } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { useTheme } from '../../hooks/useTheme';
import { NAV_THEME } from '../../theme/colors';
import type { BottomNavigationProps, RouteConfig } from './types';

const Tab = createBottomTabNavigator();
const isIOS = Platform.OS === 'ios';

type TabImplementation = 'native' | 'custom';

function getImplementation(routes: RouteConfig[]): TabImplementation {
  if (isIOS) {
    return routes.every((route) => route.icon.sfSymbol) ? 'native' : 'custom';
  }

  return routes.every((route) => route.icon.materialSymbol) ? 'native' : 'custom';
}

function resolveIcon(route: RouteConfig, implementation: TabImplementation) {
  if (implementation === 'native' && isIOS && route.icon.sfSymbol) {
    return { type: 'sfSymbol' as const, name: route.icon.sfSymbol } as any;
  }

  if (implementation === 'native' && !isIOS && route.icon.materialSymbol) {
    return { type: 'materialSymbol' as const, name: route.icon.materialSymbol } as any;
  }

  const IconComponent = route.icon.component;

  return ({ color, size }: { focused: boolean; color: ColorValue; size: number }) => {
    if (IconComponent) {
      return <IconComponent color={color as string} size={size} />;
    }

    if (isIOS && route.icon.sfSymbol) {
      return <SFSymbol color={color as string} name={route.icon.sfSymbol} size={size} />;
    }

    if (route.icon.materialSymbol) {
      return (
        <MaterialIcons
          color={color as string}
          name={route.icon.materialSymbol as MaterialIconsIconName}
          size={size}
        />
      );
    }

    return null;
  };
}

/**
 * Full-fledged bottom navigation component using platform-aware tabs.
 *
 * - iOS: native tabs with SF Symbols when the route set supports it
 * - Android: native tabs with Material Symbols when available, custom JS tabs otherwise
 *
 * The navigation theme is the single source of truth for navigator colors.
 */
export function BottomNavigation({
  routes,
  initialRoute,
  screenOptions,
  standalone = true,
}: BottomNavigationProps) {
  const { isDark } = useTheme();
  const colors = NAV_THEME[isDark ? 'dark' : 'light'];
  const implementation = getImplementation(routes);

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

  const defaultScreenOptions =
    implementation === 'native'
      ? {
          headerShown: false,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarStyle: { backgroundColor: 'transparent' },
          sceneStyle: { backgroundColor: navTheme.colors.background },
        }
      : {
          headerShown: false,
          sceneStyle: { backgroundColor: navTheme.colors.background },
          tabBarActiveTintColor: navTheme.colors.primary,
          tabBarInactiveTintColor: navTheme.colors.text,
          tabBarStyle: {
            backgroundColor: navTheme.colors.card,
            borderTopColor: navTheme.colors.border,
          },
        };

  const navigator = (
    <Tab.Navigator
      initialRouteName={initialRoute}
      implementation={implementation}
      screenOptions={{
        ...defaultScreenOptions,
        ...screenOptions,
      }}
    >
      {routes.map((route) =>
        'render' in route ? (
          <Tab.Screen
            key={route.name}
            name={route.name}
            options={{
              tabBarLabel: route.label ?? route.name,
              tabBarIcon: resolveIcon(route, implementation),
              tabBarBadge: route.badge,
              ...route.options,
            }}
          >
            {() => route.render!()}
          </Tab.Screen>
        ) : (
          <Tab.Screen
            key={route.name}
            name={route.name}
            component={route.component}
            options={{
              tabBarLabel: route.label ?? route.name,
              tabBarIcon: resolveIcon(route, implementation),
              tabBarBadge: route.badge,
              ...route.options,
            }}
          />
        ),
      )}
    </Tab.Navigator>
  );

  if (!standalone) return navigator;

  return <NavigationContainer theme={navTheme}>{navigator}</NavigationContainer>;
}
