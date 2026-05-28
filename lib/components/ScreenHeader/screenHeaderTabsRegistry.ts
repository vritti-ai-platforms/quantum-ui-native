import { NavigationRouteContext } from '@react-navigation/native';
import { useCallback, useContext, useLayoutEffect, useSyncExternalStore } from 'react';
import type { ScreenHeaderTabConfig } from './types';

interface TabsEntry {
  tabs: ScreenHeaderTabConfig[];
  byId: Map<string, ScreenHeaderTabConfig>;
  indexById: Map<string, number>;
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
// across re-renders when the active id is still in the array. Pre-builds the
// id → tab and id → index maps once so the read-side hooks below stay O(1).
export function useRegisterScreenHeaderTabs(tabs: ScreenHeaderTabConfig[] | undefined): void {
  const route = useContext(NavigationRouteContext);
  const key = getRouteKey(route);
  useLayoutEffect(() => {
    if (!tabs || tabs.length === 0) {
      if (registry.delete(key)) notify(key);
      return;
    }
    const byId = new Map<string, ScreenHeaderTabConfig>();
    const indexById = new Map<string, number>();
    for (let i = 0; i < tabs.length; i++) {
      const t = tabs[i]!;
      byId.set(t.id, t);
      indexById.set(t.id, i);
    }
    const existing = registry.get(key);
    const stillValid = existing && byId.has(existing.activeTabId);
    const activeTabId = stillValid ? existing.activeTabId : tabs[0]!.id;
    registry.set(key, { tabs, byId, indexById, activeTabId });
    notify(key);
  }, [key, tabs]);
}

export function setScreenHeaderActiveTabId(routeKey: string, id: string): void {
  const entry = registry.get(routeKey);
  if (!entry || entry.activeTabId === id) return;
  // byId/indexById are stable until the tabs array changes, so carry the same
  // refs forward — no rebuild on every tab tap.
  registry.set(routeKey, {
    tabs: entry.tabs,
    byId: entry.byId,
    indexById: entry.indexById,
    activeTabId: id,
  });
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

export function useScreenHeaderActiveIndex(): number {
  const route = useContext(NavigationRouteContext);
  const key = getRouteKey(route);
  const subscribe = useCallback((onChange: () => void) => subscribeFor(key, onChange), [key]);
  return useSyncExternalStore(subscribe, () => {
    const entry = registry.get(key);
    if (!entry) return 0;
    return entry.indexById.get(entry.activeTabId) ?? 0;
  });
}

const EMPTY_TABS_SNAPSHOT: { tabs: ScreenHeaderTabConfig[]; activeIndex: number } = { tabs: [], activeIndex: 0 };

// Returns the registered tabs array + the active tab's index (O(1) via indexById).
// getSnapshot returns the raw entry reference (stable until the registry's set()
// replaces it) so useSyncExternalStore can dedupe; the derived snapshot is built
// in the hook body. Used by the content fade-transition component.
export function useScreenHeaderTabsEntry(): { tabs: ScreenHeaderTabConfig[]; activeIndex: number } {
  const route = useContext(NavigationRouteContext);
  const key = getRouteKey(route);
  const subscribe = useCallback((onChange: () => void) => subscribeFor(key, onChange), [key]);
  const entry = useSyncExternalStore(subscribe, () => registry.get(key) ?? null);
  if (!entry) return EMPTY_TABS_SNAPSHOT;
  return { tabs: entry.tabs, activeIndex: entry.indexById.get(entry.activeTabId) ?? 0 };
}
