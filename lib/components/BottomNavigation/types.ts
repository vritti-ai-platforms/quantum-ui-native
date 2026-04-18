import type React from 'react';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

/** Platform-aware icon: SF Symbol on iOS, Material Symbol on Android, React component as fallback */
export interface TabIcon {
  sfSymbol?: string;
  materialSymbol?: string;
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
      component: React.ComponentType<any>;
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
