import type { DocumentNode, OperationVariables } from '@apollo/client';
import { getOfflineSyncEngine } from './engine';
import type { RegisterOfflineMutationOptions } from './types';

export type OfflineRegistryEntry = RegisterOfflineMutationOptions & { name: string };

const _registry = new Map<string, OfflineRegistryEntry>();

export function operationNameOf(document: DocumentNode): string {
  for (const def of document.definitions) {
    if (def.kind === 'OperationDefinition' && def.name) return def.name.value;
  }
  throw new Error('registerOfflineMutation: the document has no named operation.');
}

// Call at the micro-app feature module's TOP-LEVEL eval (next to registerConnection) — it runs once on
// the host's lazy import, before any screen here mutates. The operation name bridges a persisted queue
// entry to this live code, so a write queued before an app-kill can still replay after a cold start.
export function registerOfflineMutation<TData = unknown, TVars extends OperationVariables = OperationVariables>(
  options: RegisterOfflineMutationOptions<TData, TVars>,
): void {
  const name = options.name ?? operationNameOf(options.document as DocumentNode);
  _registry.set(name, { ...options, name } as unknown as OfflineRegistryEntry);
  // This remote may have entries queued in a prior session; drain them now if we're online.
  getOfflineSyncEngine()?.kick();
}

export function getOfflineMutation(name: string): OfflineRegistryEntry | undefined {
  return _registry.get(name);
}
