import type { WatchQueryFetchPolicy } from '@apollo/client';
import { useEffect, useState } from 'react';

// Query keys already revalidated over the network in THIS app session. Module-level, so it survives
// component unmount/remount but resets on a JS bundle reload (app restart / Fast Refresh).
const revalidatedThisSession = new Set<string>();

/**
 * Picks an Apollo fetch policy that revalidates a query over the network the FIRST time it is shown in an
 * app session, then serves it from cache on every later mount — without re-hitting the network.
 *
 * Use for content that fully unmounts and remounts (e.g. a detail-screen tab whose body is swapped on tab
 * change): plain `cache-and-network` re-fetches on every revisit, while `cache-first` is satisfied by a
 * stale/empty persisted connection and never revalidates. Keyed per logical query
 * (e.g. `` `inventoryItemLedger:${id}` ``), the first mount returns `cache-and-network` (so freshly added
 * rows appear even against a persisted empty connection) and later mounts return `cache-first` (instant, no
 * request). Pull-to-refresh still forces a reload via the query's own refetch.
 *
 * `key` must be stable for a given mount (include the entity id). The network decision is frozen at mount,
 * so changing `key` without remounting won't re-pick the policy.
 */
export function useRevalidateOnceFetchPolicy(key: string): WatchQueryFetchPolicy {
  // Decide once per mount. StrictMode-safe: the initializer only READS the set, never mutates it.
  const [fetchPolicy] = useState<WatchQueryFetchPolicy>(() =>
    revalidatedThisSession.has(key) ? 'cache-first' : 'cache-and-network',
  );
  // Mark revalidated after the first mount so subsequent mounts read from cache.
  useEffect(() => {
    revalidatedThisSession.add(key);
  }, [key]);
  return fetchPolicy;
}
