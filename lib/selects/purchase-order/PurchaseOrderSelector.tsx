import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type PurchaseOrderSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

// Default `additionalKeys` expose the PO's currency + locked-rate fields so consumers (e.g. a goods-receipt
// flow) can decide whether to ask for an exchange rate.
const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'poNumber',
  additionalKeys: 'currencyCode,exchangeRate,exchangeRateType',
} as const;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `purchaseOrdersOptions`
// resolver, which reuses the existing purchase order `.select()`. Entity params (status / supplierId) are
// declared as query variables and passed through by the consumer via `params={{ ... }}`.
const PURCHASE_ORDERS_OPTIONS = gql`
  query PurchaseOrdersOptions($input: SelectOptionsInput, $status: String, $supplierId: ID) {
    purchaseOrdersOptions(input: $input, status: $status, supplierId: $supplierId) {
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

export const PurchaseOrderSelector = forwardRef<View, PurchaseOrderSelectorProps>(
  ({ fieldKeys, ...props }, ref) => (
    <Select
      ref={ref}
      label="Purchase Order"
      placeholder="Select purchase order"
      searchable
      clearable
      optionsQuery={PURCHASE_ORDERS_OPTIONS}
      optionsDataKey="purchaseOrdersOptions"
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
PurchaseOrderSelector.displayName = 'PurchaseOrderSelector';
