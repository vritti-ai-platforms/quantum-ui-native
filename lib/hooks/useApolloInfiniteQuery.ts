import { type DocumentNode, NetworkStatus, type TypedDocumentNode, type WatchQueryFetchPolicy } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { UseInfiniteListReturn } from '../types';
import { markRevalidated, pickInitialRevalidateFetchPolicy } from './useRevalidateOnceFetchPolicy';

interface Connection<T> {
  edges: { node: T }[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

export interface UseApolloInfiniteQueryParams<T> {
  query: DocumentNode | TypedDocumentNode<Record<string, Connection<T>>, Record<string, unknown>>;
  /**
   * Builds the full query variables for a page. `after` is `undefined` for page 1; the caller
   * passes it plus the page size and any filters — e.g.
   * `(after) => ({ first: 20, after, filters, search, sort })`.
   */
  getVariables: (after: string | undefined) => Record<string, unknown>;
  /** The top-level query field holding the Relay connection — e.g. `'inventoryItems'`. */
  dataKey: string;
  enabled?: boolean;
  /**
   * Apollo fetch policy for the page-1 watch query. Omit to inherit the client default
   * (`cache-and-network` when the cache is persisted). Pass `'cache-first'` for a feed that should be
   * served from cache without a network round-trip on remount — e.g. a detail-screen tab that unmounts on
   * tab switch — while pull-to-refresh (`refresh()`) still forces a network reload.
   */
  fetchPolicy?: WatchQueryFetchPolicy;
  /**
   * Revalidate-once behavior for a feed that unmounts/remounts (e.g. a detail-screen tab). When set, the
   * FIRST mount of this key in the session uses `cache-and-network` (so freshly added rows appear over a
   * stale/empty persisted connection) and later mounts use `cache-first` (instant, no request) — but the
   * key is marked revalidated ONLY after the network fetch actually succeeds, so an offline/errored first
   * mount still revalidates next time. Mutually exclusive with `fetchPolicy` (revalidateKey wins).
   * Reset across logout / BU switch via `clearRevalidatedSession()`.
   */
  revalidateKey?: string;
}

// Apollo-backed Relay-connection list driver. Same UseInfiniteListReturn contract as the old TanStack hook,
// so a feed can move to GraphQL without touching the consuming screen. Pagination is merged in the Apollo
// cache by a `relayStylePagination` field policy (configured on the host InMemoryCache), so fetchMore needs
// NO updateQuery here. Flattened nodes are de-duped by `id` (cursor windows can briefly overlap on inserts).
// Pull-to-refresh refetches page 1 (relayStylePagination resets the connection), with previousData keeping
// content on screen.
export function useApolloInfiniteQuery<T extends { id: string }>({
  query,
  getVariables,
  dataKey,
  enabled = true,
  fetchPolicy,
  revalidateKey,
}: UseApolloInfiniteQueryParams<T>): UseInfiniteListReturn<T> {
  // Freeze the revalidate-once decision at mount (so it can't flip mid-mount). When revalidateKey is set
  // it drives the fetch policy; otherwise the caller's explicit fetchPolicy is used unchanged.
  const [frozenRevalidatePolicy] = useState<WatchQueryFetchPolicy | undefined>(() =>
    revalidateKey ? pickInitialRevalidateFetchPolicy(revalidateKey) : undefined,
  );
  const effectiveFetchPolicy = revalidateKey ? frozenRevalidatePolicy : fetchPolicy;

  const { data, previousData, error, fetchMore, refetch, networkStatus } = useQuery(query, {
    variables: getVariables(undefined),
    skip: !enabled,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: effectiveFetchPolicy,
  });

  // Mark the key revalidated only once a network fetch has actually completed WITHOUT error, so an
  // offline/errored first mount stays eligible to revalidate on its next mount.
  useEffect(() => {
    if (revalidateKey && !error && networkStatus === NetworkStatus.ready) {
      markRevalidated(revalidateKey);
    }
  }, [revalidateKey, error, networkStatus]);

  // Keep the last good connection visible while new variables / a refetch are in flight.
  const effective = (data ?? previousData) as Record<string, Connection<T>> | undefined;
  const connection = effective?.[dataKey];

  const items = useMemo(() => {
    const edges = connection?.edges ?? [];
    const byId = new Map<string, T>();
    for (const edge of edges) {
      const node = edge?.node;
      if (node && !byId.has(node.id)) byId.set(node.id, node);
    }
    return [...byId.values()];
  }, [connection]);

  // A rejected fetchMore (transient network error paging forward) would otherwise be an unhandled promise
  // rejection; capture it so the list surfaces an error state instead. Cleared on refresh.
  const [fetchMoreError, setFetchMoreError] = useState<unknown>(null);

  const fetchNextPage = useCallback(() => {
    const pageInfo = connection?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) return;
    fetchMore({ variables: getVariables(pageInfo.endCursor) }).catch((e: unknown) => setFetchMoreError(e));
  }, [fetchMore, connection, getVariables]);

  const refresh = useCallback(() => {
    setFetchMoreError(null);
    void refetch();
  }, [refetch]);

  return {
    items,
    isLoading: networkStatus === NetworkStatus.loading,
    isFetchingNextPage: networkStatus === NetworkStatus.fetchMore,
    fetchNextPage,
    hasNextPage: !!connection?.pageInfo?.hasNextPage,
    refetch: refresh,
    refresh,
    isRefetching: networkStatus === NetworkStatus.refetch,
    isError: !!error || !!fetchMoreError,
  };
}
