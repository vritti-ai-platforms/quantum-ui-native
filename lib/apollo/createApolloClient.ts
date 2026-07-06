import { ApolloClient, CombinedGraphQLErrors, from, HttpLink, InMemoryCache } from '@apollo/client';
import { ServerError } from '@apollo/client/errors';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { getMainDefinition } from '@apollo/client/utilities';
import { setApolloClient } from './client';
import { setConnectivityProvider } from './offline/connectivity';
import { createOfflineSyncEngine, getOfflineSyncEngine, setOfflineSyncEngine } from './offline/engine';
import { createOfflineLink } from './offline/offlineLink';
import { setOfflineRuntime } from './offline/runtime';
import { createOfflineStore } from './offline/store';
import { createCachePersistor } from './persistence';
import type { CreateApolloClientConfig, CreatedApolloClient } from './types';

// Generic Apollo client factory for the RN host shell. The host injects its behavior (token getter,
// tenant baseURL resolver, extra headers, unauthenticated handling); the package owns the link chain,
// the cache, and optional MMKV persistence. No micro-app schema lives here — entities register their
// own type policies at runtime via `registerConnection`/`registerTypePolicies`.
export function createApolloClient(config: CreateApolloClientConfig): CreatedApolloClient {
  const {
    httpEndpoint = '/graphql',
    getToken,
    resolveBaseURL,
    buildHeaders,
    onUnauthenticated,
    unauthenticatedCode = 'UNAUTHENTICATED',
    cacheConfig,
    initialTypePolicies,
    watchQueryFetchPolicy,
    persistence,
    connectivity,
    offline,
  } = config;

  // Host-injected connectivity (e.g. NetInfo) drives the offline queue's replay-on-reconnect.
  setConnectivityProvider(connectivity);

  // Resolves headers + the per-request endpoint. The tenant base URL is read async (Keychain), so it
  // rides on the context as `uri` (HttpLink honours a per-operation context uri). `Authorization` is
  // built here from the token so every app shares one bearer convention; app-specific headers
  // (X-Platform, x-bu-id, …) come from `buildHeaders`.
  const authLink = new SetContextLink(async (prevContext) => {
    const baseURL = await resolveBaseURL();
    const token = await getToken();
    const extra = buildHeaders ? await buildHeaders({ token, baseURL }) : {};
    const headers: Record<string, string> = {
      ...prevContext.headers,
      ...extra,
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return {
      headers,
      ...(baseURL ? { uri: `${baseURL}/graphql` } : {}),
    };
  });

  // On the configured unauthenticated code, notify the host (it clears the session). All other errors
  // pass through untouched for callers to surface.
  const errorLink = new ErrorLink(({ error }) => {
    const isGraphQLUnauth =
      CombinedGraphQLErrors.is(error) && error.errors.some((e) => e.extensions?.code === unauthenticatedCode);
    // A transport-level 401 (non-GraphQL error body, e.g. an auth proxy or an expired token rejected before
    // the resolver) surfaces as a ServerError, not CombinedGraphQLErrors — handle it here too so the
    // session-expiry path fires for both shapes (previously only GraphQL-shaped 401s triggered it).
    const isTransportUnauth = ServerError.is(error) && error.statusCode === 401;
    if (isGraphQLUnauth || isTransportUnauth) onUnauthenticated?.();
  });

  // Retry transient network failures (flaky mobile connectivity) on READ operations only — never
  // mutations (which may not be idempotent). A GraphQL error (HTTP 200 with an `errors` array) is NOT a
  // network error, so it is not retried here; those flow to errorLink / the caller.
  const retryLink = new RetryLink({
    delay: { initial: 300, max: 5000, jitter: true },
    attempts: {
      max: 3,
      retryIf: (error, operation) => {
        if (!error) return false;
        const def = getMainDefinition(operation.query);
        return def.kind === 'OperationDefinition' && def.operation === 'query';
      },
    },
  });

  // Static fallback used until a tenant base URL is stored; authLink overrides it per request.
  const httpLink = new HttpLink({ uri: httpEndpoint });

  // Offline mutation queue (opt-in per mutation). Built before the client so the offlineLink + engine
  // exist; the host calls startOfflineSyncEngine() after the cache has rehydrated (apolloReady).
  if (offline) {
    const store = createOfflineStore(offline.mmkv, offline.key);
    setOfflineRuntime({ store, captureContext: offline.captureContext ?? (() => ({})) });
    setOfflineSyncEngine(createOfflineSyncEngine());
  }

  // offlineLink sits before authLink: offline opted-in mutations short-circuit here (no wasted auth work);
  // everything else forwards through auth → http. retryLink sits after the offline short-circuit so only
  // real network reads (not offline-optimistic writes) are retried.
  const links = offline
    ? [errorLink, createOfflineLink(), retryLink, authLink, httpLink]
    : [errorLink, retryLink, authLink, httpLink];

  const cache = new InMemoryCache({
    ...cacheConfig,
    typePolicies: { ...cacheConfig?.typePolicies, ...initialTypePolicies },
  });

  // With persistence on, default watch queries to cache-and-network so a restored snapshot renders
  // instantly on cold start and then revalidates against the server.
  const fetchPolicy = watchQueryFetchPolicy ?? (persistence ? 'cache-and-network' : undefined);

  const client = new ApolloClient({
    cache,
    link: from(links),
    ...(fetchPolicy ? { defaultOptions: { watchQuery: { fetchPolicy, nextFetchPolicy: 'cache-first' } } } : {}),
  });

  setApolloClient(client, cache);

  const persistor = persistence ? createCachePersistor(cache, persistence) : null;
  const ready = persistor ? persistor.restore() : Promise.resolve();

  const purge = async (): Promise<void> => {
    await client.clearStore();
    if (persistor) await persistor.purge();
    // Logout must also drop any queued offline writes so they never replay under the next session.
    await getOfflineSyncEngine()?.clear();
  };

  const purgePersisted = async (): Promise<void> => {
    if (persistor) await persistor.purge();
  };

  // Re-restore the snapshot for the CURRENT persistence.namespace (e.g. after a BU switch, the adapter
  // now points at the new tenant's slot). No-op without persistence.
  const restore = async (): Promise<void> => {
    if (persistor) await persistor.restore();
  };

  // Current serialized snapshot size for the active namespace — lets the host monitor how close it is to
  // the maxSize self-disable cliff.
  const getCacheSize = async (): Promise<number | null> => (persistor ? persistor.getSize() : null);

  return { client, cache, ready, purge, purgePersisted, restore, getCacheSize };
}
