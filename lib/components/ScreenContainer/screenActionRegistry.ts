import { NavigationRouteContext } from '@react-navigation/native';
import { useCallback, useContext, useLayoutEffect, useSyncExternalStore } from 'react';

// Per-route "create action", keyed by route.key — mirrors screenSearchRegistry. Bridges the ScreenHeader's
// create (+) button (rendered in the navigator header slot) and the screen body that owns the create handler
// (opening a sheet, navigating to a create screen, …) WITHOUT a per-feature React context. The body registers
// its handler; the header reads + fires it. A new route entry (feature remount / re-push) starts empty.
interface ActionEntry {
  onCreate: (() => void) | null;
}

const registry = new Map<string, ActionEntry>();
const listeners = new Map<string, Set<() => void>>();

function getEntry(routeKey: string): ActionEntry {
  let entry = registry.get(routeKey);
  if (!entry) {
    entry = { onCreate: null };
    registry.set(routeKey, entry);
  }
  return entry;
}

function setScreenCreateAction(routeKey: string, onCreate: (() => void) | null): void {
  const entry = getEntry(routeKey);
  if (entry.onCreate === onCreate) return;
  entry.onCreate = onCreate;
  const set = listeners.get(routeKey);
  if (set) {
    for (const cb of set) cb();
  }
}

// Body-side: register (or clear) this route's create handler. Layout-effect so it lands before paint, keyed by
// route.key, cleared on unmount — mirrors useRegisterScreenHeaderTabs / useRegisterScreenHeaderInset. Pass null
// to opt out (e.g. a Fab-triggered sheet that has no header + button).
export function useRegisterScreenCreateAction(onCreate: (() => void) | null): void {
  const route = useContext(NavigationRouteContext);
  const key = route?.key ?? '__no_route__';
  useLayoutEffect(() => {
    setScreenCreateAction(key, onCreate);
    return () => setScreenCreateAction(key, null);
  }, [key, onCreate]);
}

// Header-side: the current route's registered create handler (undefined until the body registers one).
export function useScreenCreateAction(): (() => void) | undefined {
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
  return useSyncExternalStore(subscribe, () => getEntry(key).onCreate ?? undefined);
}
