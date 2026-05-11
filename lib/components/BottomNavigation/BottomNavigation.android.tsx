import { MaterialIcons, type MaterialIconsIconName } from '@react-native-vector-icons/material-icons';
import { type BottomTabNavigationOptions, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { usePushNavigator } from '../../hooks/usePushNavigator';
import { getTheme } from '../../theme/colors';
import { PushNavigator } from '../PushNavigator';
import { ScreenContainer } from '../ScreenContainer';
import type { BottomNavigationProps, RouteConfig, TabIcon } from './types';

const Tab = createBottomTabNavigator();

// Android's BottomNavigationView / Material NavigationBar enforces a hard 5-tab
// maximum at the native layer. We use MAX_VISIBLE=3 so the bar is always
// 3 content tabs + "More" = 4 total tabs, keeping the bar uncluttered.
const MAX_VISIBLE = 3;

function resolveIcon(route: RouteConfig): BottomTabNavigationOptions['tabBarIcon'] {
  return { type: 'materialSymbol', name: route.icon.materialSymbol ?? 'apps' };
}

type MoreListItem = Pick<RouteConfig, 'name' | 'label'> & { icon: TabIcon };

// List screen rendered as the initial route inside the More PushNavigator.
// Reads its items from route.params (set via initialParams on Stack.Screen) so
// that React Context propagation issues with NativeStack on Android are avoided.
function MoreListScreen({ route }: { route: { params?: { items?: MoreListItem[] } } }) {
  const items = route.params?.items ?? [];
  const { push } = usePushNavigator();
  const theme = getTheme();

  return (
    <ScreenContainer scrollable>
      {items.map((item) => (
        <Pressable
          key={item.name}
          style={[styles.row, { borderBottomColor: theme.border }]}
          onPress={() => push(item.name)}
          android_ripple={{ color: theme.border }}
        >
          <View style={[styles.iconWrap, { backgroundColor: theme.muted }]}>
            <MaterialIcons
              name={(item.icon.materialIcon ?? 'apps') as MaterialIconsIconName}
              size={22}
              color={theme.foreground}
            />
          </View>
          <Text style={[styles.rowLabel, { color: theme.foreground }]}>{item.label ?? item.name}</Text>
          <MaterialIcons name={'chevron-right' as MaterialIconsIconName} size={20} color={theme.border} />
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

// Defined at module level for a stable Tab.Screen component reference.
// Overflow routes arrive via initialParams. Renders a PushNavigator so each
// selected screen gets the native stack back gesture/button for free.
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 16 },
});

export function BottomNavigation({ routes: allRoutes, initialRoute, screenOptions }: BottomNavigationProps) {
  const visibleRoutes = allRoutes.length > MAX_VISIBLE ? allRoutes.slice(0, MAX_VISIBLE) : allRoutes;
  const overflowRoutes = allRoutes.length > MAX_VISIBLE ? allRoutes.slice(MAX_VISIBLE) : [];
  const hasMore = overflowRoutes.length > 0;
  const systemScheme = useColorScheme();
  const isNavDark = systemScheme === 'dark';

  const background = getTheme().background;

  const navigationTheme = useMemo(() => {
    const base = isNavDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isNavDark,
      colors: { ...base.colors, background, card: 'transparent' },
    };
  }, [isNavDark, background]);

  // Remount the navigator when the route list changes (e.g. features load after
  // initial render). Without this, React Navigation retains the old tab set in
  // its persisted state — e.g. Account appearing as a ghost tab after More loads.
  const navigatorKey = `tab-nav-${allRoutes.map((r) => r.name).join(',')}`;

  return (
    <ThemeProvider value={navigationTheme}>
      <Tab.Navigator
        key={navigatorKey}
        initialRouteName={initialRoute ?? visibleRoutes[0]?.name}
        screenOptions={{
          headerShown: false,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarStyle: { backgroundColor: background },
          sceneStyle: { backgroundColor: background },
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
              tabBarIcon: { type: 'materialSymbol', name: 'more_horiz' },
            }}
          />
        )}
      </Tab.Navigator>
    </ThemeProvider>
  );
}
