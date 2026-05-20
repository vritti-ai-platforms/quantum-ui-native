import type { ComponentType, ReactNode } from 'react';

export interface PushScreenConfig<RouteName extends string = string> {
  name: RouteName;
  // biome-ignore lint/suspicious/noExplicitAny: <>
  component: ComponentType<any>;
  title?: string;
  headerShown?: boolean;
  initialParams?: object;
  header?: () => ReactNode;
}

export interface PushNavigatorHeaderProps<RouteName extends string = string> {
  canPop: boolean;
  currentRoute: PushScreenConfig<RouteName>;
  pop: () => void;
}

export interface PushNavigatorContextValue<RouteName extends string = string> {
  canPop: boolean;
  currentRoute: RouteName;
  pop: () => void;
  popToRoot: () => void;
  push: (route: RouteName) => void;
}

export interface PushNavigatorProps<RouteName extends string = string> {
  initialRoute: RouteName;
  renderHeader?: (props: PushNavigatorHeaderProps<RouteName>) => ReactNode;
  screens: ReadonlyArray<PushScreenConfig<RouteName>>;
}
