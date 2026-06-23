import type { ConnectivityProvider } from '../types';

// Module-level connectivity provider, injected by the host (e.g. a NetInfo adapter) via createApolloClient.
// Shared across host + remotes through the MF-singleton `@vritti/quantum-ui-native/apollo` module.
let _provider: ConnectivityProvider | null = null;

export function setConnectivityProvider(provider: ConnectivityProvider | undefined): void {
  _provider = provider ?? null;
}

export function getConnectivityProvider(): ConnectivityProvider | null {
  return _provider;
}

// No provider wired (tests / web) → treat as online so nothing ever queues.
export function isOnline(): boolean {
  return _provider ? _provider.getSnapshot() : true;
}
