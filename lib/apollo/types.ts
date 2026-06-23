import type { ApolloClient, InMemoryCache, InMemoryCacheConfig, TypePolicies } from '@apollo/client';
import type { MMKV } from '../utils/mmkv';

// Resolved per-request values handed to `buildHeaders` so an app-specific header can depend on them.
export interface ApolloHeaderContext {
  /** Per-request bearer token, or null when unauthenticated. */
  token: string | null;
  /** Resolved tenant base URL (no `/graphql` suffix), or null before a deployment is selected. */
  baseURL: string | null;
}

// MMKV-backed Apollo cache persistence. Omit `persistence` entirely to disable.
export interface PersistenceConfig {
  /** A NON-SECRET MMKV instance (from `createPreferences`). Never store tokens here. */
  mmkv: MMKV;
  /** Key under which the serialized cache snapshot is stored. Default `vritti.apollo-cache`. */
  key?: string;
  /** Debounce window (ms) for write-triggered persists. Default 1000. */
  debounce?: number;
  /** Max serialized snapshot size in bytes before persistence self-disables for the session. Default 1 MiB. `false` removes the cap. */
  maxSize?: number | false;
}

// Host-injected connectivity source (e.g. @react-native-community/netinfo). Keeps the package free of
// any native dependency — the host owns the native module and adapts it to this interface.
export interface ConnectivityProvider {
  /** Subscribe to online/offline transitions. Returns an unsubscribe fn. */
  subscribe(cb: (online: boolean) => void): () => void;
  /** Current connectivity, read synchronously at enqueue time. */
  getSnapshot(): boolean;
}

// Enables the persisted offline mutation queue. Requires `persistence` (the optimistic writes ride the
// cache snapshot) and a `connectivity` provider (to trigger replay on reconnect).
export interface OfflineQueueConfig {
  /** NON-SECRET MMKV instance dedicated to the queue (e.g. `createPreferences('vritti.offline-queue')`). */
  mmkv: MMKV;
  /** Key under which the serialized queue is stored. Default `offline-queue`. */
  key?: string;
  /** Snapshots request context to replay each entry under (e.g. its `x-bu-id`). Captured at enqueue. */
  captureContext?: () => Record<string, string>;
}

export interface CreateApolloClientConfig {
  /** Static fallback endpoint when no tenant baseURL resolves yet (pre-login). Default `/graphql`. */
  httpEndpoint?: string;
  /** Returns the per-request bearer token. Host wires `getToken`. */
  getToken: () => string | null | Promise<string | null>;
  /** Returns the tenant base URL (no `/graphql` suffix). Host wires `getStoredMobileBaseURL`. */
  resolveBaseURL: () => string | null | Promise<string | null>;
  /** Extra per-request headers (e.g. `X-Platform`, `x-bu-id`). `Authorization` is added by the factory from the token. */
  buildHeaders?: (ctx: ApolloHeaderContext) => Record<string, string> | Promise<Record<string, string>>;
  /** Called once when a GraphQL error carries `unauthenticatedCode`. Host clears tokens + notifies the session controller. */
  onUnauthenticated?: () => void;
  /** `extensions.code` value meaning "unauthenticated". Kept generic so the package never imports the host enum. Default `UNAUTHENTICATED`. */
  unauthenticatedCode?: string;
  /** Extra base `InMemoryCache` config merged with runtime-registered policies (e.g. `possibleTypes`). */
  cacheConfig?: InMemoryCacheConfig;
  /** Type policies known at construction time. Usually empty — micro-apps register their own at runtime. */
  initialTypePolicies?: TypePolicies;
  /** Default watch-query fetch policy. Defaults to `cache-and-network` (then `cache-first`) when persistence is enabled, else Apollo's default. */
  watchQueryFetchPolicy?: 'cache-first' | 'cache-and-network' | 'network-only' | 'cache-only' | 'no-cache' | 'standby';
  /** Optional MMKV-backed cache persistence. */
  persistence?: PersistenceConfig;
  /** Host-injected connectivity source. Required for the offline queue; omit → always-online. */
  connectivity?: ConnectivityProvider;
  /** Enables the persisted offline mutation queue (opt-in per mutation via `registerOfflineMutation`). */
  offline?: OfflineQueueConfig;
}

export interface CreatedApolloClient {
  client: ApolloClient;
  cache: InMemoryCache;
  /** Resolves once a persisted snapshot (if any) has been restored. `use()` / await this before first render. */
  ready: Promise<void>;
  /** Empties the live cache AND the persisted snapshot. Use on logout / session-expiry. */
  purge: () => Promise<void>;
  /** Empties ONLY the persisted snapshot, leaving the live cache intact. Use on BU/tenant switch (keeps the no-flash refetch UX). */
  purgePersisted: () => Promise<void>;
}
