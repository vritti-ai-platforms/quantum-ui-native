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
}

// Prepend a new entity's edge into EVERY cached variant of `connectionField` (relayStylePagination
// keys connections by filter/search/sort, so there may be several). Dedupes by id. No refetch — the
// mutation already returned the full entity, which Apollo normalized by id.
export function prependEdgeToConnection({ cache, connectionField, entity, edgeTypename, cursor = '' }: PrependEdgeOptions): void {
  cache.modify({
    fields: {
      [connectionField]: (existing: ConnectionShape | undefined, { toReference, readField }: ModifyDetails) => {
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
