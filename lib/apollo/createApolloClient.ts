import { ApolloClient, CombinedGraphQLErrors, from, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
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
    if (!CombinedGraphQLErrors.is(error)) return;
    for (const graphQLError of error.errors) {
      if (graphQLError.extensions?.code === unauthenticatedCode) {
        onUnauthenticated?.();
        return;
      }
    }
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
  // everything else forwards through auth → http.
  const links = offline ? [errorLink, createOfflineLink(), authLink, httpLink] : [errorLink, authLink, httpLink];

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

  return { client, cache, ready, purge, purgePersisted };
}
