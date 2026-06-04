import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type SerialSelectorParams = { quantId?: string };

export type SerialSelectorProps = Omit<SelectProps, 'optionsEndpoint' | 'params'> & {
  params?: SerialSelectorParams;
};

// Pre-configured Select for picking specific physical serials within a quant. Returns only
// AVAILABLE serials, scoped to the given quant. Hits GET /commerce-api/inventory-item-serials/select.
export const SerialSelector = forwardRef<View, SerialSelectorProps>(({ params, ...props }, ref) => (
  <Select
    ref={ref}
    label="Serial"
    placeholder="Select serial number"
    searchable
    optionsEndpoint="commerce-api/inventory-item-serials/select"
    params={params}
    fieldKeys={{ valueKey: 'id', labelKey: 'serialNumber' }}
    {...props}
  />
));
SerialSelector.displayName = 'SerialSelector';
