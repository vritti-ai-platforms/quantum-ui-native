import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { type ComponentType, createContext, useContext, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { usePushNavigator } from '../../hooks/usePushNavigator';
import { useTheme } from '../../hooks/useTheme';
import { DynamicIcon } from '../DynamicIcon';
import { PushNavigator, type PushScreenConfig } from '../PushNavigator';
import { ScreenContainer } from '../ScreenContainer';
import { Text } from '../Text';
import { hasNestedPush, type NestedNavState } from './hasNestedPush';
import type { BottomNavigationProps, RouteConfig } from './types';

// The bridge's TypedNavigator resolves to the STATIC branch under @react-navigation/native@8-alpha
// (its signature defaults the navigator Config to StaticConfig, a v7-vs-v8 compile artifact), which
// hides `.Navigator`/`.Screen`. Both exist at runtime (createNavigatorFactory). Cast to the usable shape.
const Tab = createNativeBottomTabNavigator() as unknown as {
  Navigator: ComponentType<Record<string, unknown>>;
  Screen: ComponentType<Record<string, unknown>>;
};

// Action routes (onPress, no scene of their own) still need a Screen component for the navigator.
const NullScreen: ComponentType = () => null;

// UIKit's UITabBar auto-collapses into its OWN "More" above 5 tabs and sweeps the trailing tabs (including
// the detached workspace) into it. To stay in control we cap total tabs at 5 ourselves — the last feature
// slot becomes a custom "More" tab that owns the overflow — so UIKit never builds its own and the detached
// workspace stays a standalone trailing (search-role) capsule.
const MORE_ROUTE_NAME = '__more__';
const MAX_TOTAL_TABS = 5;

// Overflow routes flow to the More screens via context (not route params) so the More list stays reactive
// when the host's route set changes — initialParams are applied only once.
const OverflowRoutesContext = createContext<RouteConfig[]>([]);

// The custom More list: one row per overflow feature; tapping pushes that feature within the More tab's
// own nested stack (see MoreTabContent), which renders it with its native header + back.
function MoreListScreen() {
  const overflowRoutes = useContext(OverflowRoutesContext);
  const { push } = usePushNavigator();
  return (
    <ScreenContainer scrollable>
      {overflowRoutes.map((route) => (
        <Pressable
          key={route.name}
          onPress={() => push(route.name)}
          accessibilityRole="button"
          accessibilityLabel={route.label ?? route.name}
          className="flex-row items-center gap-3 border-b border-border px-4 py-3.5"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <DynamicIcon
              icon={{ sfSymbol: route.icon.sfSymbol, materialSymbol: route.icon.materialSymbol ?? route.icon.sfSymbol }}
              size={22}
              className="text-foreground"
            />
          </View>
          <Text className="min-w-0 flex-1 text-base text-foreground" numberOfLines={1}>
            {route.label ?? route.name}
          </Text>
          <DynamicIcon icon={{ sfSymbol: 'chevron.right', materialSymbol: 'chevron_right' }} size={18} className="text-muted-foreground" />
        </Pressable>
      ))}
    </ScreenContainer>
  );
}

// The More tab body: a nested native-stack whose root is the list and whose siblings are the overflow
// features (so `push(name)` from the list slides the feature in with its header). Mirrors Android.
function MoreTabContent() {
  const overflowRoutes = useContext(OverflowRoutesContext);
  const screens = useMemo<PushScreenConfig[]>(
    () => [
      { name: '__more_list__', component: MoreListScreen, title: 'More' },
      ...overflowRoutes.map((r) => {
        const header = r.header;
        return {
          name: r.name,
          component: r.component ?? NullScreen,
          initialParams: r.params,
          ...(header ? { header } : { headerShown: false }),
        };
      }),
    ],
    [overflowRoutes],
  );
  return <PushNavigator initialRoute="__more_list__" screens={screens} />;
}

// Native (SwiftUI) tabs have no header slot of their own. A route that supplies a header — the host's
// per-tab `header` (e.g. RemoteHeader) — is wrapped in a one-screen nested native-stack so the header
// renders and pushing a detail slides over it. The stack also carries the route's params.
function makeScreen(route: RouteConfig): ComponentType {
  const Comp = route.component ?? NullScreen;
  const header = route.header;
  if (!header) return Comp;
  // Name the nested stack's root distinctly from the tab (route.name) so react-navigation doesn't warn
  // about same-name nesting (HomeTabs > /uom > /uom). It's an internal root; detail pushes use their own names.
  const rootName = `${route.name}::view`;
  const screens: ReadonlyArray<PushScreenConfig> = [
    { name: rootName, component: Comp, initialParams: route.params, header },
  ];
  return function TabStack() {
    return <PushNavigator initialRoute={rootName} screens={screens} />;
  };
}

export function BottomNavigation({ routes, initialRoute, onActiveTabChange }: BottomNavigationProps) {
  const { palette } = useTheme();
  // Skips the cold-launch focus so only genuine tab CHANGES reach the host.
  const activeRouteRef = useRef<string | null>(null);
  // Hide the native tab bar when the focused tab's nested stack has pushed past its root — mirrors the
  // Android FloatingTabBar's isOnPushedScreen. Driven by the navigator's `tabBarHidden` prop below.
  const [tabBarHidden, setTabBarHidden] = useState(false);

  // Cap total tabs at 5. The detached (search-role) workspace consumes a slot, so features get
  // (5 - detachedCount) slots; beyond that the last slot becomes the custom "More" tab holding the rest.
  // ≤4 features → all shown + workspace; >4 → 3 features + More + workspace (exactly 5). Detached routes
  // are always pinned trailing and never enter overflow.
  const { orderedTabs, overflowRoutes } = useMemo(() => {
    const detached = routes.filter((r) => r.detached);
    const main = routes.filter((r) => !r.detached);
    const featureBudget = Math.max(1, MAX_TOTAL_TABS - detached.length);
    const overflow = main.length > featureBudget;
    const visibleMain = overflow ? main.slice(0, featureBudget - 1) : main;
    const overflowMain = overflow ? main.slice(featureBudget - 1) : [];
    const moreTab: RouteConfig[] = overflow
      ? [{ name: MORE_ROUTE_NAME, icon: { sfSymbol: 'ellipsis', materialSymbol: 'more_horiz' }, label: 'More', component: MoreTabContent }]
      : [];
    return { orderedTabs: [...visibleMain, ...moreTab, ...detached], overflowRoutes: overflowMain };
  }, [routes]);

  // Stable component per route (nested-stack wrapper when a header is present; the More tab's own body).
  const screens = useMemo(
    () => orderedTabs.map((route) => ({ route, Component: makeScreen(route) })),
    [orderedTabs],
  );

  // Force a clean remount when the route SET changes (a workspace switch changes the feature set).
  const navigatorKey = `tab-nav-${routes.map((r) => r.name).join(',')}`;

  return (
    <OverflowRoutesContext.Provider value={overflowRoutes}>
      <Tab.Navigator
        key={navigatorKey}
        initialRouteName={initialRoute ?? orderedTabs.find((r) => !r.detached && r.name !== MORE_ROUTE_NAME)?.name}
        hapticFeedbackEnabled
        // iOS 26 applies Liquid Glass to the bar automatically and the OS draws the selection background;
        // we set only the icon/label tints — neutral foreground when selected, muted grey when not.
        tabBarActiveTintColor={palette.foreground}
        tabBarInactiveTintColor={palette.mutedForeground}
        tabBarHidden={tabBarHidden}
        screenListeners={({
          navigation,
          route,
        }: {
          navigation: { getState: () => NestedNavState };
          route: { name: string };
        }) => ({
          focus: () => {
            const prev = activeRouteRef.current;
            if (prev === route.name) return;
            activeRouteRef.current = route.name;
            if (prev !== null) onActiveTabChange?.(route.name, prev);
          },
          // A nested push/pop mutates the tab navigator's state, so read the focused tab's nested depth
          // here and hide the bar past any root. navigation.getState() is the only reliable source — the
          // per-screen `route.state` is stripped from options/screenOptions by the route cache. The walk
          // covers feature tabs' double nesting AND a feature pushed from the More tab's nested stack.
          state: () => {
            const pushed = hasNestedPush(navigation.getState());
            setTabBarHidden((prev) => (prev === pushed ? prev : pushed));
          },
          // Action routes (e.g. the detached workspace button) run their onPress on tap; preventsDefault
          // (set in options below) stops the tab from being selected, so it never becomes the active tab.
          tabPress: () => {
            routes.find((r) => r.name === route.name)?.onPress?.();
          },
        })}
      >
        {screens.map(({ route, Component }) => (
          <Tab.Screen
            key={route.name}
            name={route.name}
            component={Component}
            initialParams={route.params}
            options={{
              title: route.label ?? route.name,
              tabBarIcon: () => ({ sfSymbol: route.icon.sfSymbol }),
              // The ONLY role iOS detaches into its own trailing capsule (iOS 26+).
              ...(route.detached ? { role: 'search' } : {}),
              // Action route: tapping runs onPress (via tabPress) instead of selecting this tab.
              ...(route.onPress ? { preventsDefault: true } : {}),
            }}
          />
        ))}
      </Tab.Navigator>
    </OverflowRoutesContext.Provider>
  );
}
