import type { OfflineStore } from './store';

// The store + context-capture the host wired through createApolloClient's `offline` config. The hook and
// engine read it here so they never need a client/host reference (MF-singleton shared).
interface OfflineRuntime {
  store: OfflineStore;
  captureContext: () => Record<string, string>;
}

let _runtime: OfflineRuntime | null = null;

export function setOfflineRuntime(runtime: OfflineRuntime): void {
  _runtime = runtime;
}

export function getOfflineRuntime(): OfflineRuntime | null {
  return _runtime;
}
