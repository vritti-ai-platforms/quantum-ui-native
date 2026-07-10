import { NavigationRouteContext } from '@react-navigation/native';
import { useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';

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

const SEARCH_DEBOUNCE_MS = 300;

// Debounced + trimmed screen-search query for list/feed screens: the debounce that every list screen used to
// hand-roll (useState + a setTimeout useEffect) now lives here. Composes useScreenSearch (same per-route
// registry), so the ScreenHeader search field drives it with no extra wiring — a screen just reads the result
// and passes it to its data hook. Debounces every change including clearing; `debounceMs` overrides 300 ms.
export function useDebouncedScreenSearch(debounceMs: number = SEARCH_DEBOUNCE_MS): string {
  const { query } = useScreenSearch();
  const [debounced, setDebounced] = useState(() => query.trim());
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), debounceMs);
    return () => clearTimeout(handle);
  }, [query, debounceMs]);
  return debounced;
}
