import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type InventoryItemSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = { valueKey: 'id', labelKey: 'name', groupIdKey: 'categoryId' } as const;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `inventoryItemsOptions`
// resolver, which reuses the existing inventory item `.select()`, grouped by category. The
// `excludeOnSupplierId` entity param is declared as a query variable and passed by the consumer via
// `params={{ excludeOnSupplierId }}`.
const INVENTORY_ITEMS_OPTIONS = gql`
  query InventoryItemsOptions($input: SelectOptionsInput, $excludeOnSupplierId: ID) {
    inventoryItemsOptions(input: $input, excludeOnSupplierId: $excludeOnSupplierId) {
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

// Pre-configured Select for inventory item selection with async search, grouped by category.
export const InventoryItemSelector = forwardRef<View, InventoryItemSelectorProps>(
  ({ fieldKeys, ...props }, ref) => (
    <Select
      ref={ref}
      label="Inventory Item"
      placeholder="Select inventory item"
      searchable
      optionsQuery={INVENTORY_ITEMS_OPTIONS}
      optionsDataKey="inventoryItemsOptions"
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
InventoryItemSelector.displayName = 'InventoryItemSelector';
