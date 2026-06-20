import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui-native/Select';
import { formatCurrency } from '../_shared/money';

export type PurchaseOrderItemSelectorParams = {
  // The PO whose lines drive the select. Required.
  purchaseOrderId: string;
  // Excludes PO lines whose (inventoryItemId, uomId) is already on this goods receipt.
  excludeOnGoodsReceiptId?: string;
};

export type PurchaseOrderItemSelectorProps = Omit<
  SelectProps,
  'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint' | 'params'
> & {
  params: PurchaseOrderItemSelectorParams;
};

// GraphQL options query — forwards the shared SelectOptionsInput plus the PO line params (purchaseOrderId,
// excludeOnGoodsReceiptId) to the server's `purchaseOrderItemsOptions` resolver, which reuses the existing
// purchase-order-items gateway `.select()`.
const PURCHASE_ORDER_ITEMS_OPTIONS = gql`
  query PurchaseOrderItemsOptions(
    $input: SelectOptionsInput
    $purchaseOrderId: String!
    $excludeOnGoodsReceiptId: String
  ) {
    purchaseOrderItemsOptions(
      input: $input
      purchaseOrderId: $purchaseOrderId
      excludeOnGoodsReceiptId: $excludeOnGoodsReceiptId
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

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  descriptionKey: 'tracking',
  groupIdKey: 'categoryId',
  additionalKeys:
    'symbol,inventoryItemId,uomId,unitPrice,currencyCode,allowDecimal,orderedQuantity,receivedQuantity',
} as const;

function defaultTransformLabel(label: string, option: SelectOption): string {
  const baseLabel = label.replace(/\s-\s[^-]+$/, '');
  const uom = typeof option.additionals?.symbol === 'string' ? option.additionals.symbol.trim() : '';
  const rawPrice = option.additionals?.unitPrice;
  const currencyCode =
    typeof option.additionals?.currencyCode === 'string' ? option.additionals.currencyCode : null;
  const unitPrice =
    rawPrice != null && currencyCode != null ? formatCurrency(String(rawPrice), currencyCode) : null;
  if (unitPrice && uom) return `${baseLabel} - ${unitPrice}/${uom}`;
  if (unitPrice) return `${baseLabel} - ${unitPrice}`;
  if (uom) return `${baseLabel} (${uom})`;
  return baseLabel;
}

// Humanises the `inventory_items.tracking` enum the backend serves as the option description.
function defaultTransformDescription(value: string): string {
  switch (value) {
    case 'quantity':
      return 'Quantity';
    case 'lot':
      return 'Lot';
    case 'serial':
      return 'Serial';
    case 'lot_serial':
      return 'Lot + Serial';
    default:
      return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

// Pre-configured Select for purchase-order line items. The option `additionals` carry
// (inventoryItemId, uomId, unitPrice, currencyCode, allowDecimal, symbol, orderedQuantity, receivedQuantity).
export const PurchaseOrderItemSelector = forwardRef<View, PurchaseOrderItemSelectorProps>(
  ({ fieldKeys, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Purchase Order Item"
      placeholder="Select item from purchase order"
      searchable
      optionsQuery={PURCHASE_ORDER_ITEMS_OPTIONS}
      optionsDataKey="purchaseOrderItemsOptions"
      params={{
        purchaseOrderId: params.purchaseOrderId,
        ...(params.excludeOnGoodsReceiptId ? { excludeOnGoodsReceiptId: params.excludeOnGoodsReceiptId } : {}),
      }}
      transformLabel={defaultTransformLabel}
      transformDescription={defaultTransformDescription}
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
PurchaseOrderItemSelector.displayName = 'PurchaseOrderItemSelector';
