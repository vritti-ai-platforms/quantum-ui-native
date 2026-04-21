import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { MaterialSymbolProps } from '@react-navigation/native';
import type React from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

/** Platform-aware icon: SF Symbol on iOS, Material Symbol on Android, React component as fallback */
export interface TabIcon {
  sfSymbol?: SFSymbol;
  materialSymbol?: MaterialSymbolProps['name'];
  component?: React.ComponentType<{ color: string; size: number }>;
}

interface RouteConfigBase {
  name: string;
  icon: TabIcon;
  label?: string;
  badge?: string | number;
  options?: BottomTabNavigationOptions;
}

/** Single route definition */
export type RouteConfig =
  | (RouteConfigBase & {
      component: React.ComponentType<object>;
      render?: never;
    })
  | (RouteConfigBase & {
      component?: never;
      render: () => React.ReactNode;
    });

/** Props for `<BottomNavigation>` */
export interface BottomNavigationProps {
  routes: RouteConfig[];
  initialRoute?: string;
  screenOptions?: BottomTabNavigationOptions;
  /** When false, skips NavigationContainer wrapper (for embedding in existing navigation tree). Default: true */
  standalone?: boolean;
}
