import type { WatchQueryFetchPolicy } from '@apollo/client';
import { useEffect, useState } from 'react';

// Query keys already revalidated over the network in THIS app session. Module-level, so it survives
// component unmount/remount but resets on a JS bundle reload (app restart / Fast Refresh) — and on an
// explicit clearRevalidatedSession() (logout / BU switch).
const revalidatedThisSession = new Set<string>();

/** Initial fetch policy for a revalidate-once key: revalidate on first sight this session, else cache. */
export function pickInitialRevalidateFetchPolicy(key: string): WatchQueryFetchPolicy {
  return revalidatedThisSession.has(key) ? 'cache-first' : 'cache-and-network';
}

/** Mark a key as revalidated. Call ONLY after a network fetch actually succeeds (not merely on mount). */
export function markRevalidated(key: string): void {
  revalidatedThisSession.add(key);
}

/**
 * Forget every revalidate-once key. Call on logout AND on a BU/tenant switch, so the next mount of a feed
 * revalidates against the new tenant instead of being served the previous tenant's persisted connection
 * from cache. Without this, a key already seen this session stays `cache-first` across a BU switch.
 */
export function clearRevalidatedSession(): void {
  revalidatedThisSession.clear();
}

/**
 * DEPRECATED — prefer `useApolloInfiniteQuery({ revalidateKey })`, which marks the key only after the
 * network fetch actually succeeds. This standalone hook marks on mount, so an offline/errored first mount
 * still flips to `cache-first` until the next bundle reload.
 *
 * Picks an Apollo fetch policy that revalidates a query over the network the FIRST time it is shown in an
 * app session, then serves it from cache on every later mount. `key` must be stable for a given mount.
 */
export function useRevalidateOnceFetchPolicy(key: string): WatchQueryFetchPolicy {
  const [fetchPolicy] = useState<WatchQueryFetchPolicy>(() => pickInitialRevalidateFetchPolicy(key));
  useEffect(() => {
    markRevalidated(key);
  }, [key]);
  return fetchPolicy;
}
