import type React from 'react';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

/** Platform-aware icon: SF Symbol on iOS, Material Symbol on Android, React component as fallback */
export interface TabIcon {
  sfSymbol?: string;
  materialSymbol?: string;
  component?: React.ComponentType<{ color: string; size: number }>;
}

/** Single route definition */
export interface RouteConfig {
  name: string;
  component: React.ComponentType<any>;
  icon: TabIcon;
  label?: string;
  badge?: string | number;
  options?: BottomTabNavigationOptions;
}

/** Props for `<BottomNavigation>` */
export interface BottomNavigationProps {
  routes: RouteConfig[];
  initialRoute?: string;
  screenOptions?: BottomTabNavigationOptions;
}
