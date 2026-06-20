import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type LotSelectorParams = { inventoryItemId?: string };

export type LotSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint' | 'params'> & {
  params?: LotSelectorParams;
};

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `inventoryItemLotsOptions`
// resolver (scoped to a single inventory item via the top-level `inventoryItemId` variable).
const INVENTORY_ITEM_LOTS_OPTIONS = gql`
  query InventoryItemLotsOptions($input: SelectOptionsInput, $inventoryItemId: ID) {
    inventoryItemLotsOptions(input: $input, inventoryItemId: $inventoryItemId) {
      options {
        value
        label
        description
        groupId
        additionals
      }
      groups {
        id
        name
      }
      hasMore
    }
  }
`;

// Pre-configured Select for inventory item lot selection (scoped to a single item).
export const LotSelector = forwardRef<View, LotSelectorProps>(({ params, ...props }, ref) => (
  <Select
    ref={ref}
    label="Lot"
    placeholder="Select or type a lot number"
    searchable
    optionsQuery={INVENTORY_ITEM_LOTS_OPTIONS}
    optionsDataKey="inventoryItemLotsOptions"
    params={{ inventoryItemId: params?.inventoryItemId }}
    fieldKeys={{ valueKey: 'id', labelKey: 'lotNumber' }}
    {...props}
  />
));
LotSelector.displayName = 'LotSelector';
