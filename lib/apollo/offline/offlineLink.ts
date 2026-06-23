import { ApolloLink } from '@apollo/client';
import { OperationTypeNode } from 'graphql';
import { of } from 'rxjs';
import { isOnline } from './connectivity';

// When offline, short-circuit an opted-in mutation (it carries an `offlineOptimistic` context, set by
// useOfflineMutation) by emitting the optimistic result as a synthetic success — no network. client.mutate
// then normalizes that result + runs the mutation's `update` exactly as it would for a real response, so
// the optimistic write is a real, durable cache write (snapshotted by the cache persistor). Online — or any
// operation without the opt-in context — forwards untouched, so non-opted-in mutations behave as before.
export function createOfflineLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    const { offlineOptimistic } = operation.getContext() as { offlineOptimistic?: Record<string, unknown> };
    if (operation.operationType === OperationTypeNode.MUTATION && offlineOptimistic && !isOnline()) {
      return of({ data: offlineOptimistic } as ApolloLink.Result);
    }
    return forward(operation);
  });
}
