/**
 * React Navigation v8 bottom tabs integration.
 *
 * WARNING: Requires a development build (EAS Build or local).
 * Will NOT work in Expo Go.
 *
 * Exports:
 * - createNativeTabs(config): static config → use with createStaticNavigation() at app root
 * - createBottomTabNavigator: re-export for dynamic (JSX) usage or advanced config
 */
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';

type ScreenConfig = {
  screen: React.ComponentType<any>;
  options?:
    | BottomTabNavigationOptions
    | ((props: any) => BottomTabNavigationOptions);
};

export interface TabsConfig {
  /** Map of screen name → screen component + options */
  screens: Record<string, ScreenConfig | React.ComponentType<any>>;
  /** Default screen options applied to all tabs */
  screenOptions?:
    | BottomTabNavigationOptions
    | ((props: any) => BottomTabNavigationOptions);
  /** Initial route name */
  initialRouteName?: string;
}

/**
 * Creates a native platform bottom tab navigator using v8 static config.
 * Returns a StaticNavigation object — pass to createStaticNavigation() at app root.
 *
 * - iOS: UITabBarController (Liquid Glass on iOS 26+)
 * - Android: Material 3 BottomNavigationView
 *
 * For nested usage inside an existing NavigationContainer, use the dynamic
 * pattern with createBottomTabNavigator() instead.
 */
export function createNativeTabs(config: TabsConfig) {
  return createBottomTabNavigator({
    initialRouteName: config.initialRouteName,
    screenOptions: config.screenOptions,
    screens: config.screens,
  });
}

export { createBottomTabNavigator };
export type { BottomTabNavigationOptions, BottomTabBarProps };
