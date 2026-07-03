import { type DocumentNode, NetworkStatus, type TypedDocumentNode, type WatchQueryFetchPolicy } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useCallback, useMemo } from 'react';
import type { UseInfiniteListReturn } from '../types';

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
}: UseApolloInfiniteQueryParams<T>): UseInfiniteListReturn<T> {
  const { data, previousData, error, fetchMore, refetch, networkStatus } = useQuery(query, {
    variables: getVariables(undefined),
    skip: !enabled,
    notifyOnNetworkStatusChange: true,
    fetchPolicy,
  });

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

  const fetchNextPage = useCallback(() => {
    const pageInfo = connection?.pageInfo;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) return;
    void fetchMore({ variables: getVariables(pageInfo.endCursor) });
  }, [fetchMore, connection, getVariables]);

  const refresh = useCallback(() => {
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
    isError: !!error,
  };
}
