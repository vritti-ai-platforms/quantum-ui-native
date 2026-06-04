import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type LotSelectorParams = { inventoryItemId?: string };

export type LotSelectorProps = Omit<SelectProps, 'optionsEndpoint' | 'params'> & {
  params?: LotSelectorParams;
};

// Pre-configured Select for inventory item lot selection (scoped to a single item).
// Hits GET /commerce-api/inventory-item-lots/select.
export const LotSelector = forwardRef<View, LotSelectorProps>(({ params, ...props }, ref) => (
  <Select
    ref={ref}
    label="Lot"
    placeholder="Select or type a lot number"
    searchable
    optionsEndpoint="commerce-api/inventory-item-lots/select"
    params={params}
    fieldKeys={{ valueKey: 'id', labelKey: 'lotNumber' }}
    {...props}
  />
));
LotSelector.displayName = 'LotSelector';
