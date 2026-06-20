import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type UomSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  additionalKeys: 'allowDecimal',
  groupIdKey: 'dimensionId',
} as const;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `uomOptions` resolver,
// which reuses the existing UOM `.select()`. Entity params (dimensionId / baseOnly / derivedOnly) are
// declared as query variables and passed through by the consumer via `params={{ ... }}`.
const UOM_OPTIONS = gql`
  query UomOptions(
    $input: SelectOptionsInput
    $dimensionId: ID
    $baseOnly: Boolean
    $derivedOnly: Boolean
  ) {
    uomOptions(
      input: $input
      dimensionId: $dimensionId
      baseOnly: $baseOnly
      derivedOnly: $derivedOnly
    ) {
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

// Pre-configured Select for unit of measure selection, grouped by dimension.
export const UomSelector = forwardRef<View, UomSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Unit of Measure"
    placeholder="Select unit"
    searchable
    optionsQuery={UOM_OPTIONS}
    optionsDataKey="uomOptions"
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
UomSelector.displayName = 'UomSelector';
// Lets quantum <Form> bind this by `name` (value/onChange) like any field.
Object.assign(UomSelector, { fieldBinding: { valueProp: 'value', changeProp: 'onChange' } });
