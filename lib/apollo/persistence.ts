import type { InMemoryCache } from '@apollo/client';
import { CachePersistor, type PersistentStorage } from 'apollo3-cache-persist';
import type { MMKV } from '../utils/mmkv';
import type { PersistenceConfig } from './types';

// apollo3-cache-persist's bundled MMKVWrapper calls `instance.delete(key)`, which was renamed to
// `remove` in react-native-mmkv v4 — so we adapt the v4 instance directly. MMKV is synchronous,
// so restore/persist read & write a single string with no I/O latency.
function createMmkvPersistAdapter(mmkv: MMKV): PersistentStorage<string> {
  return {
    getItem: (key) => mmkv.getString(key) ?? null,
    setItem: (key, value) => {
      mmkv.set(key, value);
    },
    removeItem: (key) => {
      mmkv.remove(key);
    },
  };
}

export function createCachePersistor(cache: InMemoryCache, cfg: PersistenceConfig): CachePersistor<string> {
  return new CachePersistor({
    cache,
    storage: createMmkvPersistAdapter(cfg.mmkv),
    key: cfg.key ?? 'vritti.apollo-cache',
    debounce: cfg.debounce ?? 1000,
    maxSize: cfg.maxSize ?? 1_048_576,
    trigger: 'write',
  });
}
