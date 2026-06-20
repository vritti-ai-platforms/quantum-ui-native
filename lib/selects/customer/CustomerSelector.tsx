import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type CustomerSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `customersOptions` resolver,
// which reuses the existing customer `select` (search by name, phone, or email).
const CUSTOMERS_OPTIONS = gql`
  query CustomersOptions($input: SelectOptionsInput) {
    customersOptions(input: $input) {
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

// Pre-configured Select for customer selection with async search.
export const CustomerSelector = forwardRef<View, CustomerSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Customer"
    placeholder="Search by name, phone, or email"
    searchable
    optionsQuery={CUSTOMERS_OPTIONS}
    optionsDataKey="customersOptions"
    fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
    {...props}
  />
));
CustomerSelector.displayName = 'CustomerSelector';
