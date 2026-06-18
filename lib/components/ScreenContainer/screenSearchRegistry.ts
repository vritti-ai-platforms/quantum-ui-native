import { NavigationRouteContext } from '@react-navigation/native';
import { useCallback, useContext, useSyncExternalStore } from 'react';

// Per-route search query, keyed by route.key — mirrors screenScrollRegistry. Lets the ScreenHeader's
// search field (rendered in the navigator header slot) and the screen body (the list/feed) share one
// value without prop-drilling or an app-level context. A new route entry (e.g. a feature remount) starts
// empty, so search clears on feature switch — consistent with the feed's fresh-p1-on-return behavior.
interface SearchEntry {
  query: string;
}

const registry = new Map<string, SearchEntry>();
const listeners = new Map<string, Set<() => void>>();

function getEntry(routeKey: string): SearchEntry {
  let entry = registry.get(routeKey);
  if (!entry) {
    entry = { query: '' };
    registry.set(routeKey, entry);
  }
  return entry;
}

export function setScreenSearch(routeKey: string, query: string): void {
  const entry = getEntry(routeKey);
  if (entry.query === query) return;
  entry.query = query;
  const set = listeners.get(routeKey);
  if (set) {
    for (const cb of set) cb();
  }
}

export interface ScreenSearch {
  query: string;
  setQuery: (query: string) => void;
}

export function useScreenSearch(): ScreenSearch {
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
  const query = useSyncExternalStore(subscribe, () => getEntry(key).query);
  const setQuery = useCallback((q: string) => setScreenSearch(key, q), [key]);
  return { query, setQuery };
}
