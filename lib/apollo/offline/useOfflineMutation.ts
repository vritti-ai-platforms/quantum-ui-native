import type { DocumentNode, OperationVariables, TypedDocumentNode } from '@apollo/client';
import { useCallback, useState } from 'react';
import { requireApolloClient } from '../client';
import { isOnline } from './connectivity';
import { newMutationId, newTempId } from './ids';
import { getOfflineMutation, operationNameOf } from './registry';
import { getOfflineRuntime } from './runtime';
import type { UseOfflineMutationResult } from './types';

// Opt-in offline mutation hook. ONLINE: a normal mutate (identical to today). OFFLINE: writes the
// optimistic result durably (the offlineLink short-circuits the network so client.mutate normalizes it +
// runs `update`), then persists a queue entry the sync engine replays on reconnect. The mutation MUST be
// registered via registerOfflineMutation (its `update` + optimistic builder live in the registry).
export function useOfflineMutation<
  // biome-ignore lint/suspicious/noExplicitAny: generic over the mutation's data shape
  TData = any,
  TVars extends OperationVariables = OperationVariables,
>(document: DocumentNode | TypedDocumentNode<TData, TVars>, options?: { name?: string }): UseOfflineMutationResult<TData, TVars> {
  const [loading, setLoading] = useState(false);
  const name = options?.name;

  const mutate = useCallback(
    async (variables: TVars) => {
      const opName = name ?? operationNameOf(document as DocumentNode);
      const reg = getOfflineMutation(opName);
      if (!reg) {
        throw new Error(`useOfflineMutation: "${opName}" is not registered. Call registerOfflineMutation at module load.`);
      }
      const client = requireApolloClient();
      setLoading(true);
      try {
        if (isOnline()) {
          const res = await client.mutate({
            mutation: document,
            variables,
            // biome-ignore lint/suspicious/noExplicitAny: reg.update is structural-cache typed; Apollo's updater type differs
            update: reg.update as any,
          });
          return { data: (res.data ?? undefined) as TData | undefined, queued: false };
        }

        const tempId = reg.kind === 'create' && reg.typename ? newTempId(reg.typename) : undefined;
        const optimisticData = reg.buildOptimisticResponse(variables, { tempId: tempId ?? '' }) as TData;
        await client.mutate({
          mutation: document,
          variables,
          // biome-ignore lint/suspicious/noExplicitAny: reg.update is structural-cache typed; Apollo's updater type differs
          update: reg.update as any,
          context: { offlineOptimistic: optimisticData },
        });
        const runtime = getOfflineRuntime();
        runtime?.store.enqueue({
          mutationId: newMutationId(),
          operationName: opName,
          variables: variables as Record<string, unknown>,
          tempId,
          headers: runtime.captureContext(),
          createdAt: Date.now(),
          attempts: 0,
        });
        return { data: optimisticData, queued: true, tempId };
      } finally {
        setLoading(false);
      }
    },
    [document, name],
  );

  return { mutate, loading };
}
