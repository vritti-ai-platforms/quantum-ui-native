import { NavigationRouteContext } from '@react-navigation/native';
import { useCallback, useContext, useLayoutEffect, useSyncExternalStore } from 'react';
import { makeMutable, type SharedValue } from 'react-native-reanimated';

interface ScreenEntry {
  scrollY: SharedValue<number>;
  headerInset: number;
  restoreY: number;
  // The header's actual PAINTED height (full, incl. safe area), measured via onLayout at its expanded state.
  // The single source of truth for content offsets — consumers prefer it over the constants+safe-area
  // formula (which can drift from what actually paints; the collapsible-header standard is measure-first).
  measuredHeaderHeight: number;
}

const registry = new Map<string, ScreenEntry>();
const listeners = new Map<string, Set<() => void>>();

function getEntry(routeKey: string): ScreenEntry {
  let entry = registry.get(routeKey);
  if (!entry) {
    entry = { scrollY: makeMutable(0), headerInset: 0, restoreY: 0, measuredHeaderHeight: 0 };
    registry.set(routeKey, entry);
  }
  return entry;
}

export function getScreenScrollY(routeKey: string): SharedValue<number> {
  return getEntry(routeKey).scrollY;
}

export function useScreenScrollY(): SharedValue<number> {
  const route = useContext(NavigationRouteContext);
  return getScreenScrollY(route?.key ?? '__no_route__');
}

export function useScreenRouteKey(): string {
  const route = useContext(NavigationRouteContext);
  return route?.key ?? '__no_route__';
}

// A scrollable ScreenContainer saves its scroll offset here before navigating
// away and restores it on return — react-native-screens re-pins the native
// scroll view to the top on the pop relayout. A plain number (not a SharedValue)
// so the UI-thread onScroll worklet cannot overwrite it.
export function getScreenRestoreY(routeKey: string): number {
  return getEntry(routeKey).restoreY;
}

export function setScreenRestoreY(routeKey: string, y: number): void {
  getEntry(routeKey).restoreY = y;
}

// A transparent overlay header (iOS 26) registers how far it overlays the screen
// body so a scrollable ScreenContainer can offset its content by that much.
// Set-only: a route.key is unique per navigation entry and its header config is
// static, so the inset stays correct once written — no unmount reset, which also
// avoids a header-remount 96->0->96 flash.
function setScreenHeaderInset(routeKey: string, inset: number): void {
  const entry = getEntry(routeKey);
  if (entry.headerInset === inset) return;
  entry.headerInset = inset;
  const set = listeners.get(routeKey);
  if (set) {
    for (const cb of set) cb();
  }
}

export function useRegisterScreenHeaderInset(inset: number): void {
  const route = useContext(NavigationRouteContext);
  const key = route?.key ?? '__no_route__';
  useLayoutEffect(() => {
    if (inset > 0) setScreenHeaderInset(key, inset);
  }, [key, inset]);
}

export function useScreenHeaderInset(): number {
  const route = useContext(NavigationRouteContext);
  const key = route?.key ?? '__no_route__';
  const subscribe = useCallback(
    (onChange: () => void) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(onChange);
      return () => {
        set.delete(onChange);
      };
    },
    [key],
  );
  return useSyncExternalStore(subscribe, () => getEntry(key).headerInset);
}

// Records the header's measured painted height (see ScreenEntry.measuredHeaderHeight). First layout wins:
// the header's height ANIMATES during collapse, so only the initial expanded measurement (scrollY 0 at
// mount) is the content-offset truth — later collapse-driven layouts must not shrink it.
export function setMeasuredScreenHeaderHeight(routeKey: string, height: number): void {
  const entry = getEntry(routeKey);
  if (entry.measuredHeaderHeight > 0 || height <= 0) return;
  entry.measuredHeaderHeight = height;
  const set = listeners.get(routeKey);
  if (set) {
    for (const cb of set) cb();
  }
}

export function useMeasuredScreenHeaderHeight(): number {
  const route = useContext(NavigationRouteContext);
  const key = route?.key ?? '__no_route__';
  const subscribe = useCallback(
    (onChange: () => void) => {
      let set = listeners.get(key);
      if (!set) {
        set = new Set();
        listeners.set(key, set);
      }
      set.add(onChange);
      return () => {
        set.delete(onChange);
      };
    },
    [key],
  );
  return useSyncExternalStore(subscribe, () => getEntry(key).measuredHeaderHeight);
}
