import type React from 'react';
import type { ReactNode } from 'react';
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
  /**
   * Custom header for the tab's content. Native tab bars have no header slot of their own, so when set
   * the tab's screen is hosted in a one-screen nested native-stack that renders this header.
   */
  header?: () => ReactNode;
  params?: object;
  /**
   * iOS 26+: render this tab detached in its own capsule beside the main tab bar, via the native
   * search-role slot — the only slot iOS detaches, and it is always pinned trailing (right). On
   * iOS < 26 and Android there is no detached slot, so it renders as a normal inline tab.
   */
  detached?: boolean;
  /**
   * Turns the tab into an ACTION button: tapping runs this instead of selecting the tab (so it never
   * becomes the active tab). Use it to push a screen on the parent stack (e.g. the workspace picker). On
   * iOS it sets the native tab's `preventsDefault`; on Android the custom bar calls it directly. When set,
   * `component` is optional (the tab has no scene of its own).
   */
  onPress?: () => void;
  /**
   * Marks the tab's feature as permission-locked. On iOS it surfaces as a native top-trailing badge (🔒);
   * the badge bubble color is system-controlled there (iOS can't tint it — that prop is Android-only). The
   * Android custom bar does not render it yet.
   */
  locked?: boolean;
}

export interface RouteConfig extends RouteConfigBase {
  // biome-ignore lint/suspicious/noExplicitAny: <>
  component?: React.ComponentType<any>;
}

export interface BottomNavigationProps {
  routes: RouteConfig[];
  initialRoute?: string;
  /** Fired when the active tab changes (NOT on the initial focus). Host wires cache reset here. */
  onActiveTabChange?: (currentRouteName: string, previousRouteName: string) => void;
}
