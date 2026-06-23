import { CombinedGraphQLErrors } from '@apollo/client';
import { evictEntity, removeEdgeFromConnection, type SurgeryCache } from '../cache-surgery';
import { requireApolloCache, requireApolloClient } from '../client';
import { getConnectivityProvider } from './connectivity';
import { getOfflineMutation, type OfflineRegistryEntry } from './registry';
import { getOfflineRuntime } from './runtime';
import type { OfflineQueueEntry, OfflineSyncEvent } from './types';

export interface OfflineSyncEngine {
  /** Begin watching connectivity + drain a restored queue. Host calls once, after `apolloReady`. */
  start(): void;
  /** Request a drain (connectivity tick, or a remote just registered its mutations). Idempotent while draining. */
  kick(): void;
  subscribe(cb: (event: OfflineSyncEvent) => void): () => void;
  /** Wipe the queue (logout). */
  clear(): Promise<void>;
  dispose(): void;
}

let _engine: OfflineSyncEngine | null = null;
export function getOfflineSyncEngine(): OfflineSyncEngine | null {
  return _engine;
}
export function setOfflineSyncEngine(engine: OfflineSyncEngine): void {
  _engine = engine;
}
export function startOfflineSyncEngine(): void {
  _engine?.start();
}

const MAX_BACKOFF_MS = 30_000;

export function createOfflineSyncEngine(): OfflineSyncEngine {
  const listeners = new Set<(event: OfflineSyncEvent) => void>();
  let draining = false;
  let started = false;
  let unsubscribe: (() => void) | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const emit = (event: OfflineSyncEvent): void => {
    for (const listener of listeners) listener(event);
  };

  const isTerminal = (error: unknown): boolean => CombinedGraphQLErrors.is(error);
  const messageOf = (error: unknown): string => (error instanceof Error ? error.message : 'Mutation rejected by server');

  // Remove the optimistic temp create artifacts after the real create returns (the real `update` already
  // added the real edge, so the row is replaced in place).
  function reconcileCreate(cache: SurgeryCache, reg: OfflineRegistryEntry, entry: OfflineQueueEntry): void {
    if (entry.tempId && reg.connectionField && reg.typename) {
      removeEdgeFromConnection({ cache, connectionField: reg.connectionField, id: entry.tempId });
      evictEntity({ cache, typename: reg.typename, id: entry.tempId });
    }
  }

  function rollback(cache: SurgeryCache, reg: OfflineRegistryEntry, entry: OfflineQueueEntry): void {
    if (reg.kind === 'create') {
      if (entry.tempId && reg.connectionField && reg.typename) {
        removeEdgeFromConnection({ cache, connectionField: reg.connectionField, id: entry.tempId });
        evictEntity({ cache, typename: reg.typename, id: entry.tempId });
      }
      return;
    }
    if (reg.kind === 'update' && reg.typename) {
      const id = (entry.variables as { id?: string }).id;
      if (id) evictEntity({ cache, typename: reg.typename, id });
    }
    // update + delete: re-sync the affected views from the server (we are online during replay).
    void requireApolloClient().refetchQueries({ include: 'active' });
  }

  function scheduleRetry(attempts: number): void {
    if (retryTimer) clearTimeout(retryTimer);
    const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempts) + Math.random() * 1000;
    retryTimer = setTimeout(() => {
      void drain();
    }, delay);
  }

  async function drain(): Promise<void> {
    if (draining) return;
    const runtime = getOfflineRuntime();
    if (!runtime) return;
    draining = true;
    emit({ type: 'drain-start' });
    try {
      const client = requireApolloClient();
      const cache = requireApolloCache() as unknown as SurgeryCache;
      const provider = getConnectivityProvider();
      while (true) {
        if (provider && !provider.getSnapshot()) break; // went offline again
        const head = runtime.store.peek();
        if (!head) break;
        const reg = getOfflineMutation(head.operationName);
        if (!reg) break; // registry code not loaded yet (remote not navigated) — preserve queue + FIFO order
        try {
          await client.mutate({
            mutation: reg.document,
            variables: head.variables,
            // biome-ignore lint/suspicious/noExplicitAny: reg.update is structural-cache typed; Apollo's updater type differs
            update: reg.update as any,
            context: { headers: head.headers },
          });
          runtime.store.dequeue(head.mutationId);
          if (reg.kind === 'create') reconcileCreate(cache, reg, head);
          emit({ type: 'entry-success', mutationId: head.mutationId, operationName: head.operationName });
        } catch (error) {
          if (isTerminal(error)) {
            runtime.store.dequeue(head.mutationId);
            rollback(cache, reg, head);
            emit({ type: 'entry-failed-terminal', mutationId: head.mutationId, operationName: head.operationName, message: messageOf(error) });
            continue; // later entries may still be valid
          }
          // network error — keep the entry, back off, and stop the drain (preserves FIFO order)
          runtime.store.update({ ...head, attempts: head.attempts + 1 });
          scheduleRetry(head.attempts + 1);
          break;
        }
      }
    } finally {
      draining = false;
      emit({ type: 'drain-end', remaining: getOfflineRuntime()?.store.all().length ?? 0 });
    }
  }

  return {
    start() {
      if (started) return;
      started = true;
      const provider = getConnectivityProvider();
      if (provider) {
        unsubscribe = provider.subscribe((online) => {
          if (online) void drain();
        });
      }
      void drain();
    },
    kick() {
      void drain();
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    async clear() {
      getOfflineRuntime()?.store.clear();
    },
    dispose() {
      unsubscribe?.();
      if (retryTimer) clearTimeout(retryTimer);
      listeners.clear();
      started = false;
    },
  };
}
