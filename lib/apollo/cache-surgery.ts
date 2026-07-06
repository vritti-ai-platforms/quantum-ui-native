import type { Reference, StoreObject } from '@apollo/client';

// Minimal shapes for the Relay connection we patch. Nodes are stored as normalized references.
interface EdgeShape {
  node: Reference;
}
interface ConnectionShape {
  edges?: EdgeShape[];
  pageInfo?: unknown;
}

interface ModifyDetails {
  readField(fieldName: string, from?: Reference): unknown;
  toReference(object: StoreObject): Reference | undefined;
  /** The normalized field key including serialized keyArgs, e.g. `inventoryItems({"filters":[…]})`. */
  storeFieldName: string;
}

// Extracts the serialized keyArgs object from a store field name (`field({...})`). Returns null when the
// variant carries no args (the unfiltered connection) or the args can't be parsed.
function parseVariantArgs(storeFieldName: string): Record<string, unknown> | null {
  const open = storeFieldName.indexOf('(');
  const close = storeFieldName.lastIndexOf(')');
  if (open === -1 || close <= open) return null;
  try {
    const parsed = JSON.parse(storeFieldName.slice(open + 1, close));
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// Structural subset of Apollo's InMemoryCache. We intentionally do NOT import `ApolloCache`: the
// package and each consuming app resolve `@apollo/client` to SEPARATE installs, and v4's cache types
// use unique symbols that don't unify across copies (at runtime they ARE one Module-Federation
// singleton). The plain `Reference`/`StoreObject` structural types unify across installs, so a
// consumer's real cache is assignable to this.
export interface SurgeryCache {
  // biome-ignore lint/suspicious/noExplicitAny: modify's generic options shape differs per @apollo/client install; `any` lets a consumer's cache pass structurally.
  modify(options: any): boolean;
  evict(options: { id?: string }): boolean;
  identify(object: StoreObject | Reference): string | undefined;
  gc(): string[];
}

export interface PrependEdgeOptions {
  cache: SurgeryCache;
  /** Query connection field name, e.g. `inventoryItems`. */
  connectionField: string;
  /** The newly created entity (the mutation result object) — must carry `__typename` + `id`. */
  entity: StoreObject;
  /** Edge `__typename`, e.g. `InventoryItemEdge`. */
  edgeTypename: string;
  /** Cursor for the new edge. Default `''`. */
  cursor?: string;
  /**
   * Optional per-variant guard. relayStylePagination keys a connection by its filter/search/sort args, so
   * one connectionField may have several cached variants. Called with each variant's parsed args (null for
   * the unfiltered variant); return false to SKIP inserting into that variant (e.g. the new entity doesn't
   * match its filters). Omit to prepend into every variant (previous behavior).
   */
  matchesVariant?: (args: Record<string, unknown> | null) => boolean;
}

// Prepend a new entity's edge into cached variants of `connectionField` (relayStylePagination keys
// connections by filter/search/sort, so there may be several). Dedupes by id. With `matchesVariant`,
// only variants the entity belongs to are touched — a filtered list it doesn't match is left for its
// next revalidation instead of showing a row that doesn't satisfy the filter. No refetch — the mutation
// already returned the full entity, which Apollo normalized by id.
export function prependEdgeToConnection({
  cache,
  connectionField,
  entity,
  edgeTypename,
  cursor = '',
  matchesVariant,
}: PrependEdgeOptions): void {
  cache.modify({
    fields: {
      [connectionField]: (existing: ConnectionShape | undefined, { toReference, readField, storeFieldName }: ModifyDetails) => {
        if (matchesVariant && !matchesVariant(parseVariantArgs(storeFieldName))) return existing;
        const conn = existing ?? {};
        const edges = conn.edges ?? [];
        const newId = (entity as { id?: string | number }).id;
        if (edges.some((edge) => readField('id', edge.node) === newId)) return existing;
        const node = toReference(entity);
        if (!node) return existing;
        return { ...conn, edges: [{ __typename: edgeTypename, cursor, node }, ...edges] };
      },
    },
  });
}

export interface RemoveEdgeOptions {
  cache: SurgeryCache;
  connectionField: string;
  /** Id of the entity whose edge should be dropped (Apollo ids are string | number). */
  id: string | number;
}

// Drop the matching edge from every cached variant of `connectionField`.
export function removeEdgeFromConnection({ cache, connectionField, id }: RemoveEdgeOptions): void {
  cache.modify({
    fields: {
      [connectionField]: (existing: ConnectionShape | undefined, { readField }: ModifyDetails) => {
        const conn = existing ?? {};
        if (!conn.edges) return existing;
        return { ...conn, edges: conn.edges.filter((edge) => readField('id', edge.node) !== id) };
      },
    },
  });
}

export interface EvictEntityOptions {
  cache: SurgeryCache;
  typename: string;
  id: string | number;
  /** Run `cache.gc()` after evicting to prune dangling refs. Default true. */
  gc?: boolean;
}

// Evict a normalized entity and (by default) garbage-collect dangling references.
export function evictEntity({ cache, typename, id, gc = true }: EvictEntityOptions): void {
  cache.evict({ id: cache.identify({ __typename: typename, id }) });
  if (gc) cache.gc();
}
