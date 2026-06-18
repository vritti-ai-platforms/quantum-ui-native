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

// Cursor/keyset-paginated page shape returned by infinite-feed endpoints — the contract `useInfiniteList`
// consumes. `nextCursor` is an opaque continuation token; `hasMore` is false on the last page.
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
