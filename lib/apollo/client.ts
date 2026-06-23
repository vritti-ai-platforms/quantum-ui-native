import type { ApolloClient, InMemoryCache } from '@apollo/client';

// Module-level reference to the one Apollo client + cache the host creates. This module is shared
// as an MF singleton (`@vritti/quantum-ui-native/apollo`), so the host populates the ref once at
// startup and every micro-app reads the SAME instance here — that's how a remote registers its
// type policies and runs cache surgery without ever importing the host. Mirrors the singleton
// pattern in `lib/config/index.ts` (`let _config`).
let _client: ApolloClient | null = null;
let _cache: InMemoryCache | null = null;

export function setApolloClient(client: ApolloClient, cache: InMemoryCache): void {
  _client = client;
  _cache = cache;
}

export function getApolloClient(): ApolloClient | null {
  return _client;
}

export function requireApolloClient(): ApolloClient {
  if (!_client) {
    throw new Error('Apollo client not created. Call createApolloClient in the host before any remote loads.');
  }
  return _client;
}

export function requireApolloCache(): InMemoryCache {
  if (!_cache) {
    throw new Error('Apollo cache not created. Call createApolloClient in the host before any remote loads.');
  }
  return _cache;
}
