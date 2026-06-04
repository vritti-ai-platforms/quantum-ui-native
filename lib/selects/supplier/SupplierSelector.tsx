import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type SupplierSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

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

// Pre-configured Select for supplier selection with async search. Hits GET /commerce-api/suppliers/select.
// Default `additionalKeys` expose currencyCode + paymentTerms; description defaults to the currency code.
export const SupplierSelector = forwardRef<View, SupplierSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Supplier"
    placeholder="Select supplier"
    searchable
    optionsEndpoint="commerce-api/suppliers/select"
    transformDescription={defaultTransformDescription}
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
SupplierSelector.displayName = 'SupplierSelector';
