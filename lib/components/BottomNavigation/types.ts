import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type React from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

export interface TabIcon {
  sfSymbol: SFSymbol;
  materialSymbol?: string;
}

interface RouteConfigBase {
  name: string;
  icon: TabIcon;
  label?: string;
  badge?: string | number;
  options?: BottomTabNavigationOptions;
  params?: object;
}

export interface RouteConfig extends RouteConfigBase {
  // biome-ignore lint/suspicious/noExplicitAny: <>
  component: React.ComponentType<any>;
}

export interface BottomNavigationProps {
  routes: RouteConfig[];
  initialRoute?: string;
  screenOptions?: BottomTabNavigationOptions;
  /** Fired when the active tab changes (NOT on the initial focus). Host wires cache reset here. */
  onActiveTabChange?: (currentRouteName: string, previousRouteName: string) => void;
}
