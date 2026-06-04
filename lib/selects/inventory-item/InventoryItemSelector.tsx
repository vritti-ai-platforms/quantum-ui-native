import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type InventoryItemSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = { valueKey: 'id', labelKey: 'name', groupIdKey: 'categoryId' } as const;

// Pre-configured Select for inventory item selection with async search, grouped by category.
// Hits GET /commerce-api/inventory-items/select.
export const InventoryItemSelector = forwardRef<View, InventoryItemSelectorProps>(
  ({ fieldKeys, ...props }, ref) => (
    <Select
      ref={ref}
      label="Inventory Item"
      placeholder="Select inventory item"
      searchable
      optionsEndpoint="commerce-api/inventory-items/select"
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
InventoryItemSelector.displayName = 'InventoryItemSelector';
