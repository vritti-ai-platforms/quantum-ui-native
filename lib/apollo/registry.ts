import type { FieldFunctionOptions, FieldPolicy, FieldReadFunction, Reference, TypePolicies } from '@apollo/client';
import { relayStylePagination } from '@apollo/client/utilities';
import { requireApolloCache } from './client';

// Merge raw type policies into the live cache. Idempotent across re-imports (module eval runs once
// per bundle), so a micro-app can register at feature-module top-level eval without dedupe logic.
//
// ORDERING: `addTypePolicies` only affects fields that have NOT been read yet — a policy added after
// a field's first read is silently ignored for that field. Call this at the TOP-LEVEL of the remote
// feature module the host lazily imports (it runs synchronously, before any component mounts / any
// `useQuery` fires). NEVER call it from a hook/effect — that runs after the first render, by which
// time the relay merge on page 1 is already missed.
export function registerTypePolicies(policies: TypePolicies): void {
  requireApolloCache().policies.addTypePolicies(policies);
}

export interface RegisterConnectionOptions {
  /** Relay-connection list field on `Query`, e.g. `inventoryItems`. */
  field: string;
  /** keyArgs for `relayStylePagination` — the filter/search/sort args that define a distinct cached connection. */
  keyArgs?: string[] | false;
  /** Optional single-item query field that should read-redirect to the normalized entity, e.g. `inventoryItem`. */
  singleField?: string;
  /** Entity `__typename` the `singleField` resolves to, e.g. `InventoryItem`. Required when `singleField` is set. */
  typename?: string;
  /** Single-item argument name carrying the id. Default `id`. */
  idArg?: string;
}

// One call that registers (a) `relayStylePagination` on `Query.<field>` and (b) a by-id read redirect
// on `Query.<singleField>` — exactly the two policies previously hardcoded in the host cache.
export function registerConnection(options: RegisterConnectionOptions): void {
  const { field, keyArgs = false, singleField, typename, idArg = 'id' } = options;

  // Matches Apollo's own `FieldPolicies` shape (`FieldPolicy<any> | FieldReadFunction<any>`), which
  // relayStylePagination's `RelayFieldPolicy` and our read redirect both satisfy.
  // biome-ignore lint/suspicious/noExplicitAny: mirrors Apollo's FieldPolicies index-signature type
  const fields: Record<string, FieldPolicy<any> | FieldReadFunction<any>> = {
    [field]: relayStylePagination(keyArgs),
  };

  if (singleField && typename) {
    const read: FieldReadFunction<Reference | undefined> = (_existing, { args, toReference }: FieldFunctionOptions) => {
      const id = args?.[idArg];
      return id ? toReference({ __typename: typename, id }) : undefined;
    };
    fields[singleField] = { read };
  }

  registerTypePolicies({ Query: { fields } });
}
