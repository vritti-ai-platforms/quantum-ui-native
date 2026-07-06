import type { InMemoryCache } from '@apollo/client';
import { CachePersistor, type PersistentStorage } from 'apollo3-cache-persist';
import type { MMKV } from '../utils/mmkv';
import type { PersistenceConfig } from './types';

// apollo3-cache-persist's bundled MMKVWrapper calls `instance.delete(key)`, which was renamed to
// `remove` in react-native-mmkv v4 — so we adapt the v4 instance directly. When a `namespace` is
// provided, the physical MMKV key is suffixed with it (e.g. per business unit), so each namespace keeps
// its OWN snapshot; switching namespaces swaps snapshots instead of overwriting one. The namespace is
// read fresh on each access, so it tracks the active tenant. MMKV is synchronous (no I/O latency).
function createMmkvPersistAdapter(mmkv: MMKV, namespace?: () => string | null | undefined): PersistentStorage<string> {
  const physical = (key: string): string => {
    const ns = namespace?.();
    return ns ? `${key}.${ns}` : key;
  };
  return {
    getItem: (key) => mmkv.getString(physical(key)) ?? null,
    setItem: (key, value) => {
      mmkv.set(physical(key), value);
    },
    removeItem: (key) => {
      mmkv.remove(physical(key));
    },
  };
}

export function createCachePersistor(cache: InMemoryCache, cfg: PersistenceConfig): CachePersistor<string> {
  return new CachePersistor({
    cache,
    storage: createMmkvPersistAdapter(cfg.mmkv, cfg.namespace),
    key: cfg.key ?? 'vritti.apollo-cache',
    debounce: cfg.debounce ?? 1000,
    maxSize: cfg.maxSize ?? 5_242_880,
    trigger: 'write',
  });
}
