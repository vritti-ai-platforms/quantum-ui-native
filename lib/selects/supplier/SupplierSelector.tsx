import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type SupplierSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `suppliersOptions` resolver,
// which reuses the existing supplier `select`. additionalKeys expose currencyCode + paymentTerms.
const SUPPLIERS_OPTIONS = gql`
  query SuppliersOptions($input: SelectOptionsInput) {
    suppliersOptions(input: $input) {
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

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  descriptionKey: 'currencyCode',
  additionalKeys: 'currencyCode,paymentTerms',
} as const;

function defaultTransformDescription(value: string, option: SelectOption): string {
  const currencyCode =
    typeof option.additionals?.currencyCode === 'string' ? option.additionals.currencyCode.trim() : '';
  const paymentTerms =
    typeof option.additionals?.paymentTerms === 'string' ? option.additionals.paymentTerms.trim() : '';
  const parts = [currencyCode, paymentTerms].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : value;
}

// Pre-configured Select for supplier selection with async search.
// Default `additionalKeys` expose currencyCode + paymentTerms; description defaults to the currency code.
export const SupplierSelector = forwardRef<View, SupplierSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Supplier"
    placeholder="Select supplier"
    searchable
    optionsQuery={SUPPLIERS_OPTIONS}
    optionsDataKey="suppliersOptions"
    transformDescription={defaultTransformDescription}
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
SupplierSelector.displayName = 'SupplierSelector';
