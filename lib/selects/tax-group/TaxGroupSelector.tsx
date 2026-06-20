import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type TaxGroupSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `taxGroupsOptions` resolver,
// which reuses the existing tax-group `select`.
const TAX_GROUPS_OPTIONS = gql`
  query TaxGroupsOptions($input: SelectOptionsInput) {
    taxGroupsOptions(input: $input) {
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

// Pre-configured Select for tax-group selection with async search.
export const TaxGroupSelector = forwardRef<View, TaxGroupSelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Tax group"
    placeholder="Select tax group"
    searchable
    optionsQuery={TAX_GROUPS_OPTIONS}
    optionsDataKey="taxGroupsOptions"
    fieldKeys={{ valueKey: 'id', labelKey: 'name' }}
    {...props}
  />
));
TaxGroupSelector.displayName = 'TaxGroupSelector';
// Lets quantum <Form> bind this by `name` (value/onChange) like any field.
Object.assign(TaxGroupSelector, { fieldBinding: { valueProp: 'value', changeProp: 'onChange' } });
