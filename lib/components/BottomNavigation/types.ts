import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { MaterialSymbolProps } from '@react-navigation/native';
import type React from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

/** Platform-aware icon: SF Symbol on iOS, Material Symbol on Android tab bar,
 *  Material Icon (hyphenated) for list/DynamicIcon rendering on Android. */
export interface TabIcon {
  sfSymbol: SFSymbol;
  materialSymbol?: MaterialSymbolProps['name'];
  materialIcon?: string;
}

interface RouteConfigBase {
  name: string;
  icon: TabIcon;
  label?: string;
  badge?: string | number;
  options?: BottomTabNavigationOptions;
  params?: object;
}

/** Single route definition */
export interface RouteConfig extends RouteConfigBase {
  component: React.ComponentType<any>;
}

/** Props for `<BottomNavigation>` */
export interface BottomNavigationProps {
  /**
   * Tab routes to render. iOS: first 4 visible, overflow in a custom More tab.
   * Android: first 3 visible, overflow in a custom More tab.
   */
  routes: RouteConfig[];
  initialRoute?: string;
  screenOptions?: BottomTabNavigationOptions;
}
