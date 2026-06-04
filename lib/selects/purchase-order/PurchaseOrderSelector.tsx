import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type PurchaseOrderSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Default `additionalKeys` expose the PO's currency + locked-rate fields so consumers (e.g. a goods-receipt
// flow) can decide whether to ask for an exchange rate. Hits GET /commerce-api/purchase-orders/select.
const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'poNumber',
  additionalKeys: 'currencyCode,exchangeRate,exchangeRateType',
} as const;

export const PurchaseOrderSelector = forwardRef<View, PurchaseOrderSelectorProps>(
  ({ fieldKeys, ...props }, ref) => (
    <Select
      ref={ref}
      label="Purchase Order"
      placeholder="Select purchase order"
      searchable
      clearable
      optionsEndpoint="commerce-api/purchase-orders/select"
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
PurchaseOrderSelector.displayName = 'PurchaseOrderSelector';
