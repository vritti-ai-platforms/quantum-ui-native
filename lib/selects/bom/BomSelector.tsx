import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type BomSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for BOM selection with async search. Hits GET /commerce-api/bom/select.
export const BomSelector = forwardRef<View, BomSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Bill of Materials"
    placeholder="Select BOM"
    searchable
    optionsEndpoint="commerce-api/bom/select"
    fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
    {...props}
  />
));
BomSelector.displayName = 'BomSelector';
