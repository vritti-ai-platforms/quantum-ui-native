import { type InfiniteData, type QueryKey, keepPreviousData, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { useCallback, useMemo } from 'react';
import type { CursorPage } from '../types';

export interface UseInfiniteListParams<T> {
  queryKey: QueryKey;
  fetchPage: (cursor: string | undefined) => Promise<CursorPage<T>>;
  enabled?: boolean;
  /** ms the cache survives once observer-less. `0` → drops on unmount (e.g. a tab feature unmount → fresh p1 on return). */
  gcTime?: number;
  /** ms results stay "fresh" — within this window remount/focus won't refetch. */
  staleTime?: number;
}

export interface UseInfiniteListReturn<T> {
  items: T[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  /** Refetch all currently-loaded pages (consistency refresh). */
  refetch: () => void;
  /** Pull-to-refresh: drop to page 1 and refetch only p1 (keeps content on screen, no skeleton flash). */
  refresh: () => void;
  isRefetching: boolean;
  isError: boolean;
}

// Generic cursor-paginated list driver. Wraps useInfiniteQuery and flattens + de-dupes pages by `id`
// (cursor windows can briefly overlap on inserts). Reusable across any feed endpoint that returns the
// CursorPage<T> shape. Lives here (not in an app) so every micro-app shares one implementation.
export function useInfiniteList<T extends { id: string }>({
  queryKey,
  fetchPage,
  enabled,
  gcTime,
  staleTime,
}: UseInfiniteListParams<T>): UseInfiniteListReturn<T> {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<CursorPage<T>, AxiosError, CursorPage<T>[], QueryKey, string | undefined>({
    queryKey,
    enabled,
    gcTime,
    staleTime,
    initialPageParam: undefined,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    getNextPageParam: (last) => (last.hasMore ? (last.nextCursor ?? undefined) : undefined),
    placeholderData: keepPreviousData,
    select: (data) => data.pages,
  });

  const items = useMemo(() => {
    const pages = query.data ?? [];
    const byId = new Map<string, T>();
    for (const page of pages) {
      for (const item of page.items) {
        if (!byId.has(item.id)) byId.set(item.id, item);
      }
    }
    return [...byId.values()];
  }, [query.data]);

  const { refetch } = query;
  // Truncate the cached pages to just page 1, then refetch — which now re-fetches a single page (p1).
  // Old p1 stays visible during the fetch (refresh spinner, no skeleton flash); p2..pN are dropped.
  const refresh = useCallback(() => {
    queryClient.setQueryData<InfiniteData<CursorPage<T>, string | undefined>>(queryKey, (old) =>
      old ? { ...old, pages: old.pages.slice(0, 1), pageParams: old.pageParams.slice(0, 1) } : old,
    );
    refetch();
  }, [queryClient, queryKey, refetch]);

  return {
    items,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    refetch: query.refetch,
    refresh,
    isRefetching: query.isRefetching,
    isError: query.isError,
  };
}
