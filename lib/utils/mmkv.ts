import { createMMKV, type MMKV } from 'react-native-mmkv';
import type { MobileStorageAdapter } from './storage';

// Wraps any MMKV instance into the async MobileStorageAdapter contract used by
// configureMobileAxios / ThemeProvider. MMKV is synchronous, so the promises resolve
// immediately (no I/O latency). NON-SECRET data only — keep auth tokens and other
// secrets in a Keychain-backed adapter, never MMKV.
export function createMmkvStorageAdapter(instance: MMKV): MobileStorageAdapter {
  return {
    async getItem(key) {
      return instance.getString(key) ?? null;
    },
    async setItem(key, value) {
      instance.set(key, value);
    },
    async deleteItem(key) {
      instance.remove(key);
    },
  };
}

// Convenience: a namespaced non-secret MMKV store plus its storage adapter. The host
// chooses the `id` (its own namespace) and owns what keys go in it, e.g.
// `const { instance, storage } = createPreferences('myapp.preferences')`.
export function createPreferences(id: string): { instance: MMKV; storage: MobileStorageAdapter } {
  const instance = createMMKV({ id });
  return { instance, storage: createMmkvStorageAdapter(instance) };
}

export type { MMKV };
