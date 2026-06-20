import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui-native/Select';
import { formatCurrency } from '../_shared/money';

export type SupplierItemSelectorParams = {
  supplierId?: string;
  // Excludes supplier items whose (inventoryItemId, uomId) is already on this PO.
  excludeOnPurchaseOrderId?: string;
  // Excludes supplier items whose (inventoryItemId, uomId) is already on this goods receipt.
  excludeOnGoodsReceiptId?: string;
};

export type SupplierItemSelectorProps = Omit<
  SelectProps,
  'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint' | 'params'
> & {
  params?: SupplierItemSelectorParams;
};

// GraphQL options query — forwards the shared SelectOptionsInput plus the supplier item params (supplierId,
// excludeOnPurchaseOrderId, excludeOnGoodsReceiptId) to the server's `supplierItemsOptions` resolver, which
// reuses the existing supplier-items gateway `.select()`.
const SUPPLIER_ITEMS_OPTIONS = gql`
  query SupplierItemsOptions(
    $input: SelectOptionsInput
    $supplierId: String
    $excludeOnPurchaseOrderId: String
    $excludeOnGoodsReceiptId: String
  ) {
    supplierItemsOptions(
      input: $input
      supplierId: $supplierId
      excludeOnPurchaseOrderId: $excludeOnPurchaseOrderId
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
  additionalKeys: 'symbol,unitPrice,currencyCode,allowDecimal,inventoryItemId,uomId',
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

// Pre-configured Select for inventory items offered by suppliers. Pass supplierId via `params` to scope
// to a single supplier; the option `additionals` carry (symbol, unitPrice, currencyCode, allowDecimal,
// inventoryItemId, uomId).
export const SupplierItemSelector = forwardRef<View, SupplierItemSelectorProps>(
  ({ fieldKeys, params, ...props }, ref) => (
    <Select
      ref={ref}
      label="Supplier Item"
      placeholder="Select supplier item"
      searchable
      optionsQuery={SUPPLIER_ITEMS_OPTIONS}
      optionsDataKey="supplierItemsOptions"
      params={{
        ...(params?.supplierId ? { supplierId: params.supplierId } : {}),
        ...(params?.excludeOnPurchaseOrderId ? { excludeOnPurchaseOrderId: params.excludeOnPurchaseOrderId } : {}),
        ...(params?.excludeOnGoodsReceiptId ? { excludeOnGoodsReceiptId: params.excludeOnGoodsReceiptId } : {}),
      }}
      transformLabel={defaultTransformLabel}
      transformDescription={defaultTransformDescription}
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
SupplierItemSelector.displayName = 'SupplierItemSelector';
