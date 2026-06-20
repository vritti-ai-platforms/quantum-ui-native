import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type SerialSelectorParams = { quantId?: string };

export type SerialSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint' | 'params'> & {
  params?: SerialSelectorParams;
};

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `inventoryItemSerialsOptions`
// resolver. Returns only AVAILABLE serials, scoped to the given quant via the top-level `quantId` variable.
const INVENTORY_ITEM_SERIALS_OPTIONS = gql`
  query InventoryItemSerialsOptions($input: SelectOptionsInput, $quantId: ID) {
    inventoryItemSerialsOptions(input: $input, quantId: $quantId) {
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

// Pre-configured Select for picking specific physical serials within a quant. Returns only
// AVAILABLE serials, scoped to the given quant.
export const SerialSelector = forwardRef<View, SerialSelectorProps>(({ params, ...props }, ref) => (
  <Select
    ref={ref}
    label="Serial"
    placeholder="Select serial number"
    searchable
    optionsQuery={INVENTORY_ITEM_SERIALS_OPTIONS}
    optionsDataKey="inventoryItemSerialsOptions"
    params={{ quantId: params?.quantId }}
    fieldKeys={{ valueKey: 'id', labelKey: 'serialNumber' }}
    {...props}
  />
));
SerialSelector.displayName = 'SerialSelector';
