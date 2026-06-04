import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type UomSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  additionalKeys: 'allowDecimal',
  groupIdKey: 'dimensionId',
} as const;

// Pre-configured Select for unit of measure selection, grouped by dimension. Hits GET /commerce-api/uom/select.
export const UomSelector = forwardRef<View, UomSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Unit of Measure"
    placeholder="Select unit"
    searchable
    optionsEndpoint="commerce-api/uom/select"
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
UomSelector.displayName = 'UomSelector';
