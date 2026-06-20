import { type DocumentNode, gql, NetworkStatus, type TypedDocumentNode } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SelectFieldKeys, SelectGroup, SelectOption, SelectValue, UseSelectReturn } from '../types';

// The `<entity>Options(...)` query result shape (mirrors core-server's shared SelectOptions type).
interface SelectOptionsResult {
  options: SelectOption[];
  groups?: SelectGroup[] | null;
  hasMore: boolean;
  totalCount?: number | null;
}

export interface UseApolloSelectProps {
  options?: SelectOption[];
  groups?: SelectGroup[];
  /** Apollo document for the entity's `<entity>Options(...)` query. Omit for static mode. */
  optionsQuery?: DocumentNode | TypedDocumentNode<Record<string, SelectOptionsResult>, Record<string, unknown>>;
  /** Top-level field on the query holding the SelectOptions result (e.g. 'categoriesOptions'). */
  dataKey?: string;
  searchDebounceMs?: number;
  limit?: number;
  fieldKeys?: SelectFieldKeys;
  params?: Record<string, string | number | boolean | undefined>;
  selectedValues?: SelectValue[];
  enabled?: boolean;
}

const NOOP = () => {};
// Keeps the two useQuery calls valid (rules of hooks) in static mode — always skipped.
const NOOP_QUERY = gql`
  query QuantumSelectNoop {
    __typename
  }
`;

// Apollo replacement for the TanStack-backed useSelect. Same UseSelectReturn contract so <Select> is unchanged.
// Pagination uses a GROWING limit (offset stays 0, limit += page) instead of fetchMore — so no cache merge
// function / field policy is needed; Apollo simply replaces the cached page. previousData keeps the list on
// screen during the grow-fetch. Two queries: resolve-selected (by `values`) + paginated search.
export function useApolloSelect({
  options: staticOptions,
  groups: staticGroups,
  optionsQuery,
  dataKey,
  searchDebounceMs = 300,
  limit = 20,
  fieldKeys,
  params,
  selectedValues,
  enabled,
}: UseApolloSelectProps): UseSelectReturn {
  const isAsync = !!optionsQuery && !!dataKey;
  const query = optionsQuery ?? NOOP_QUERY;
  const key = dataKey ?? '__noop';

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pageSize, setPageSize] = useState(limit);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input.
  useEffect(() => {
    if (!isAsync) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery === '') {
      setDebouncedSearch('');
      return;
    }
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), searchDebounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, searchDebounceMs, isAsync]);

  // A new search / selection resets the window back to the first page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when the query identity changes
  useEffect(() => {
    setPageSize(limit);
  }, [debouncedSearch, limit, JSON.stringify(selectedValues)]);

  const serializedValues = useMemo(
    () =>
      selectedValues && selectedValues.length > 0
        ? selectedValues.filter((v): v is string | number => typeof v !== 'boolean').join(',')
        : undefined,
    [selectedValues],
  );

  // fieldKeys go in the shared `input` arg; entity-specific `params` (e.g. inventoryItemId) are top-level vars.
  const inputBase = useMemo(() => ({ ...fieldKeys }), [fieldKeys]);

  // Resolve selected values → full option objects (so chips/labels render before searching).
  const { data: resolvedData } = useQuery(query, {
    variables: { input: { values: serializedValues, ...inputBase }, ...params },
    skip: !isAsync || !serializedValues,
    fetchPolicy: 'cache-first',
  });

  // Paginated search (offset 0, growing limit), excluding already-selected ids.
  const { data, previousData, networkStatus } = useQuery(query, {
    variables: {
      input: { search: debouncedSearch || undefined, limit: pageSize, offset: 0, excludeIds: serializedValues, ...inputBase },
      ...params,
    },
    skip: !isAsync || enabled === false,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  });

  const effective = (data ?? previousData) as Record<string, SelectOptionsResult> | undefined;
  const searchResult = effective?.[key];
  const resolvedResult = (resolvedData as Record<string, SelectOptionsResult> | undefined)?.[key];
  const searchResults = searchResult?.options ?? [];
  const hasMore = !!searchResult?.hasMore;

  // Merge resolved-selected + search results, de-duped by value. During active search, show only live
  // results (don't prepend previously-selected options).
  const options = useMemo(() => {
    const selected = resolvedResult?.options ?? [];
    const byKey = new Map<string, SelectOption>();
    const makeKey = (value: SelectValue) => `${typeof value}:${String(value)}`;
    if (debouncedSearch.trim().length === 0) {
      for (const opt of selected) {
        if (selectedValues?.includes(opt.value)) byKey.set(makeKey(opt.value), opt);
      }
    }
    for (const opt of searchResults) {
      const k = makeKey(opt.value);
      if (!byKey.has(k)) byKey.set(k, opt);
    }
    return Array.from(byKey.values());
  }, [resolvedResult, searchResults, debouncedSearch, selectedValues]);

  const onEndReached = useCallback(() => {
    if (hasMore && networkStatus !== NetworkStatus.setVariables && networkStatus !== NetworkStatus.loading) {
      setPageSize((p) => p + limit);
    }
  }, [hasMore, networkStatus, limit]);

  if (!isAsync) {
    return {
      options: staticOptions ?? [],
      groups: staticGroups ?? [],
      loading: false,
      loadingMore: false,
      hasMore: false,
      searchQuery,
      setSearchQuery,
      onEndReached: NOOP,
    };
  }

  return {
    options,
    groups: searchResult?.groups ?? staticGroups ?? [],
    loading: networkStatus === NetworkStatus.loading && !effective,
    loadingMore: networkStatus === NetworkStatus.setVariables,
    hasMore,
    searchQuery,
    setSearchQuery,
    onEndReached,
  };
}
