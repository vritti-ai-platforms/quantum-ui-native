import { type BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useMemo } from 'react';
import { DynamicColorIOS, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { usePlatformInfo } from '../../hooks/usePlatformInfo';
import { usePushNavigator } from '../../hooks/usePushNavigator';
import { useTheme } from '../../hooks/useTheme';
import { THEME } from '../../theme/colors';
import { PushNavigator } from '../PushNavigator';
import { ScreenContainer } from '../ScreenContainer';
import type { BottomNavigationProps, RouteConfig, TabIcon } from './types';

const Tab = createBottomTabNavigator();

const MAX_VISIBLE = 3;

function resolveIcon(route: RouteConfig): BottomTabNavigationOptions['tabBarIcon'] {
  return { type: 'sfSymbol', name: route.icon.sfSymbol };
}

type MoreListItem = Pick<RouteConfig, 'name' | 'label'> & { icon: TabIcon };

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
    <ThemeProvider value={navigationTheme}>
      <Tab.Navigator
        key={navigatorKey}
        initialRouteName={initialRoute ?? visibleRoutes[0]?.name}
        screenOptions={{
          headerShown: false,
          // iOS 26+: 'systemDefault' tabBarBlurEffect lets UIKit apply liquid glass instead of overriding it.
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
