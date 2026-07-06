// Generic Apollo cache layer for RN host shells + micro-apps.
// Host: `createApolloClient(...)` once at startup. Micro-apps: `registerConnection(...)` at feature
// top-level eval, then `prependEdgeToConnection`/`removeEdgeFromConnection`/`evictEntity` in mutations.
export { createApolloClient } from './createApolloClient';
export { getApolloClient, requireApolloCache, requireApolloClient, setApolloClient } from './client';
export {
  evictRegisteredConnections,
  getRegisteredConnectionFields,
  registerConnection,
  type RegisterConnectionOptions,
  registerTypePolicies,
} from './registry';
export {
  evictEntity,
  type EvictEntityOptions,
  prependEdgeToConnection,
  type PrependEdgeOptions,
  removeEdgeFromConnection,
  type RemoveEdgeOptions,
  type SurgeryCache,
} from './cache-surgery';
export type {
  ApolloHeaderContext,
  ConnectivityProvider,
  CreateApolloClientConfig,
  CreatedApolloClient,
  OfflineQueueConfig,
  PersistenceConfig,
} from './types';
// Offline mutation queue (opt-in per mutation). Host: startOfflineSyncEngine() after apolloReady.
// Micro-apps: registerOfflineMutation(...) at feature top-level eval + useOfflineMutation(DOC) in hooks.
export {
  getOfflineSyncEngine,
  isTempId,
  type OfflineQueueEntry,
  type OfflineSyncEvent,
  registerOfflineMutation,
  type RegisterOfflineMutationOptions,
  startOfflineSyncEngine,
  useOfflineMutation,
  type UseOfflineMutationResult,
} from './offline';
