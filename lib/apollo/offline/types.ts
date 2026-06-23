import type { DocumentNode, TypedDocumentNode } from '@apollo/client';
import type { SurgeryCache } from '../cache-surgery';

export type OfflineMutationKind = 'create' | 'update' | 'delete';

// One queued mutation. Persisted to MMKV verbatim; the `operationName` is the key back to the in-code
// registry entry (document + update + optimistic builder) at replay time.
export interface OfflineQueueEntry {
  mutationId: string;
  operationName: string;
  variables: Record<string, unknown>;
  /** Present for `create` — the temp entity id materialized offline, reconciled/rolled back on replay. */
  tempId?: string;
  /** Request context (e.g. `x-bu-id`) captured at enqueue, replayed verbatim regardless of current selection. */
  headers: Record<string, string>;
  createdAt: number;
  attempts: number;
}

export type OfflineSyncEvent =
  | { type: 'drain-start' }
  | { type: 'drain-end'; remaining: number }
  | { type: 'entry-success'; mutationId: string; operationName: string }
  | { type: 'entry-failed-terminal'; mutationId: string; operationName: string; message: string };

// biome-ignore lint/suspicious/noExplicitAny: generic over arbitrary mutation data/variable shapes
export interface RegisterOfflineMutationOptions<TData = any, TVars = Record<string, unknown>> {
  /** Operation name = persistence key. Defaults to the document's operation name. */
  name?: string;
  document: DocumentNode | TypedDocumentNode<TData, TVars>;
  kind: OfflineMutationKind;
  /** Builds the optimistic mutation-result shape from variables. `create` uses `ctx.tempId` as the entity id. */
  buildOptimisticResponse: (variables: TVars, ctx: { tempId: string }) => TData;
  /** The SAME `update` used online (structural cache). Runs against the cache offline AND on replay. */
  update: (cache: SurgeryCache, result: { data: TData }, options: { variables: TVars }) => void;
  /** Entity `__typename` — needed to reconcile/rollback `create` temp entities and to roll back `update`. */
  typename?: string;
  /** Relay connection field the `create`/`delete` patches — for temp-edge reconcile/rollback. */
  connectionField?: string;
}

export interface UseOfflineMutationResult<TData, TVars> {
  /** Online → real mutate. Offline → durable optimistic write + enqueue. Returns `queued:true` when enqueued. */
  mutate: (variables: TVars) => Promise<{ data?: TData; queued: boolean; tempId?: string }>;
  loading: boolean;
}
