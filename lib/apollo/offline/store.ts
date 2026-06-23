import type { MMKV } from '../../utils/mmkv';
import type { OfflineQueueEntry } from './types';

export interface OfflineStore {
  all(): OfflineQueueEntry[];
  peek(): OfflineQueueEntry | undefined;
  enqueue(entry: OfflineQueueEntry): void;
  dequeue(mutationId: string): void;
  update(entry: OfflineQueueEntry): void;
  clear(): void;
}

// The whole FIFO queue is persisted as a single JSON array under one key in the dedicated MMKV instance.
// MMKV is synchronous, so reads/writes have no I/O latency.
export function createOfflineStore(mmkv: MMKV, key = 'offline-queue'): OfflineStore {
  const read = (): OfflineQueueEntry[] => {
    const raw = mmkv.getString(key);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as OfflineQueueEntry[];
    } catch {
      return [];
    }
  };
  const write = (list: OfflineQueueEntry[]): void => {
    mmkv.set(key, JSON.stringify(list));
  };
  return {
    all: read,
    peek: () => read()[0],
    enqueue: (entry) => write([...read(), entry]),
    dequeue: (mutationId) => write(read().filter((e) => e.mutationId !== mutationId)),
    update: (entry) => write(read().map((e) => (e.mutationId === entry.mutationId ? entry : e))),
    clear: () => mmkv.remove(key),
  };
}
