import { NavigationRouteContext } from '@react-navigation/native';
import { type ReactNode, useCallback, useContext, useLayoutEffect, useSyncExternalStore } from 'react';
import type { ScreenHeaderTabConfig } from './types';

interface TabsEntry {
  tabs: ScreenHeaderTabConfig[];
  activeTabId: string;
}

const registry = new Map<string, TabsEntry>();
const listeners = new Map<string, Set<() => void>>();

function notify(routeKey: string): void {
  const set = listeners.get(routeKey);
  if (set) {
    for (const cb of set) cb();
  }
}

function subscribeFor(routeKey: string, onChange: () => void): () => void {
  let set = listeners.get(routeKey);
  if (!set) {
    set = new Set();
    listeners.set(routeKey, set);
  }
  set.add(onChange);
  return () => {
    set.delete(onChange);
  };
}

function getRouteKey(route: { key: string } | undefined): string {
  return route?.key ?? '__no_route__';
}

// Called from ScreenHeader's render (via a layout-effect hook) so the registry
// always reflects the currently-mounted tabs. Preserves the user's selection
// across re-renders when the active id is still in the array.
export function useRegisterScreenHeaderTabs(tabs: ScreenHeaderTabConfig[] | undefined): void {
  const route = useContext(NavigationRouteContext);
  const key = getRouteKey(route);
  useLayoutEffect(() => {
    if (!tabs || tabs.length === 0) {
      if (registry.delete(key)) notify(key);
      return;
    }
    const existing = registry.get(key);
    const stillValid = existing && tabs.some((t) => t.id === existing.activeTabId);
    const activeTabId = stillValid ? existing.activeTabId : tabs[0]!.id;
    registry.set(key, { tabs, activeTabId });
    notify(key);
  }, [key, tabs]);
}

export function setScreenHeaderActiveTabId(routeKey: string, id: string): void {
  const entry = registry.get(routeKey);
  if (!entry || entry.activeTabId === id) return;
  registry.set(routeKey, { tabs: entry.tabs, activeTabId: id });
  notify(routeKey);
}

export function useScreenHeaderRouteKey(): string {
  const route = useContext(NavigationRouteContext);
  return getRouteKey(route);
}

export function useScreenHeaderActiveTabId(): string | undefined {
  const route = useContext(NavigationRouteContext);
  const key = getRouteKey(route);
  const subscribe = useCallback((onChange: () => void) => subscribeFor(key, onChange), [key]);
  return useSyncExternalStore(subscribe, () => registry.get(key)?.activeTabId);
}

// Public hook the screen body uses to render the active tab's content.
export function useScreenHeaderTabContent(): ReactNode {
  const route = useContext(NavigationRouteContext);
  const key = getRouteKey(route);
  const subscribe = useCallback((onChange: () => void) => subscribeFor(key, onChange), [key]);
  return useSyncExternalStore(subscribe, () => {
    const entry = registry.get(key);
    if (!entry) return null;
    return entry.tabs.find((t) => t.id === entry.activeTabId)?.content ?? null;
  });
}
