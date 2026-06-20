// Shared response types — mirrors lib/types/ from @vritti/quantum-ui (web)

export type MutationResponse = {
  success: boolean;
  message: string;
};

export interface SuccessResponse {
  success: boolean;
  message: string;
}

export interface CreateResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ListResponse<T> {
  result: T[];
  count: number;
}

// Cursor/keyset-paginated page shape returned by infinite-feed endpoints. `nextCursor` is an opaque
// continuation token; `hasMore` is false on the last page.
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// The return contract for an infinite-list driver — implemented by `useApolloInfiniteQuery`, consumed by
// screens (so the data source can change without touching the screen). Lives here so it survives the
// removal of the old TanStack `useInfiniteList`.
export interface UseInfiniteListReturn<T> {
  items: T[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  /** Refetch all currently-loaded pages (consistency refresh). */
  refetch: () => void;
  /** Pull-to-refresh: reset to page 1 (keeps content on screen, no skeleton flash). */
  refresh: () => void;
  isRefetching: boolean;
  isError: boolean;
}
