import { type BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { getTheme } from '../../theme/colors';
import type { BottomNavigationProps, RouteConfig } from './types';

const Tab = createBottomTabNavigator();

function resolveIcon(route: RouteConfig): BottomTabNavigationOptions['tabBarIcon'] {
  return { type: 'materialSymbol', name: route.icon.materialSymbol };
}

export function BottomNavigation({ routes, initialRoute, screenOptions }: BottomNavigationProps) {
  const { isDark } = useTheme();
  const systemScheme = useColorScheme();
  const isNavDark = systemScheme === 'dark';

  const background = useMemo(() => {
    const theme = getTheme(isDark ? 'dark' : 'light');
    return theme.background;
  }, [isDark]);

  const navigationTheme = useMemo(() => {
    const base = isNavDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isNavDark,
      colors: {
        ...base.colors,
        background,
        card: 'transparent',
      },
    };
  }, [isNavDark, background]);

  return (
    <ThemeProvider value={navigationTheme}>
      <Tab.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarStyle: { backgroundColor: background },
          sceneStyle: { backgroundColor: background },
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
