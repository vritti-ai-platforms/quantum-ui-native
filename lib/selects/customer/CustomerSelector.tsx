import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type CustomerSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Pre-configured Select for customer selection with async search. Hits GET /commerce-api/customers/select.
export const CustomerSelector = forwardRef<View, CustomerSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Customer"
    placeholder="Search by name, phone, or email"
    searchable
    optionsEndpoint="commerce-api/customers/select"
    fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
    {...props}
  />
));
CustomerSelector.displayName = 'CustomerSelector';
