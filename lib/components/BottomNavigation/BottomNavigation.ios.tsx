import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { type ComponentType, useMemo, useRef } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { PushNavigator, type PushScreenConfig } from '../PushNavigator';
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

// Native (SwiftUI) tabs have no header slot of their own. A route that supplies a header — the host's
// per-tab `header` (e.g. RemoteHeader) — is wrapped in a one-screen nested native-stack so the header
// renders and pushing a detail slides over it. The stack also carries the route's params.
function makeScreen(route: RouteConfig): ComponentType {
  const Comp = route.component ?? NullScreen;
  const header = route.header;
  if (!header) return Comp;
  const screens: ReadonlyArray<PushScreenConfig> = [
    { name: route.name, component: Comp, initialParams: route.params, header },
  ];
  return function TabStack() {
    return <PushNavigator initialRoute={route.name} screens={screens} />;
  };
}

export function BottomNavigation({ routes, initialRoute, onActiveTabChange }: BottomNavigationProps) {
  const { palette } = useTheme();
  // Skips the cold-launch focus so only genuine tab CHANGES reach the host.
  const activeRouteRef = useRef<string | null>(null);

  // Detached (iOS 26 search-role) tabs are pinned trailing by the OS; declare them last for clarity.
  const orderedRoutes = useMemo(
    () => [...routes.filter((r) => !r.detached), ...routes.filter((r) => r.detached)],
    [routes],
  );

  // Stable component per route (nested-stack wrapper when a header is present). Rebuilds when the route
  // set changes, so the navigator remounts as the host's feature set changes — same as the old key.
  const screens = useMemo(
    () => orderedRoutes.map((route) => ({ route, Component: makeScreen(route) })),
    [orderedRoutes],
  );

  // Force a clean remount when the route SET changes (a workspace switch changes the feature set).
  const navigatorKey = `tab-nav-${routes.map((r) => r.name).join(',')}`;

  return (
    <Tab.Navigator
      key={navigatorKey}
      initialRouteName={initialRoute ?? orderedRoutes.find((r) => !r.detached)?.name}
      hapticFeedbackEnabled
      // iOS 26 applies Liquid Glass to the bar automatically; only the active/selection tint is ours.
      tabBarActiveTintColor={palette.primary}
      screenListeners={({ route }: { route: { name: string } }) => ({
        focus: () => {
          const prev = activeRouteRef.current;
          if (prev === route.name) return;
          activeRouteRef.current = route.name;
          if (prev !== null) onActiveTabChange?.(route.name, prev);
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
            tabBarBadge: route.badge != null ? String(route.badge) : undefined,
            // The ONLY role iOS detaches into its own trailing capsule (iOS 26+).
            ...(route.detached ? { role: 'search' } : {}),
            // Action route: tapping runs onPress (via tabPress) instead of selecting this tab.
            ...(route.onPress ? { preventsDefault: true } : {}),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
