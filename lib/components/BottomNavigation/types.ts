import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import type { MaterialSymbolProps } from '@react-navigation/native';
import type React from 'react';
import type { SFSymbol } from 'sf-symbols-typescript';

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

export interface RouteConfig extends RouteConfigBase {
  component: React.ComponentType<any>;
}

export interface BottomNavigationProps {
  routes: RouteConfig[];
  initialRoute?: string;
  screenOptions?: BottomTabNavigationOptions;
}
