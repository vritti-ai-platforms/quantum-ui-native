import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type LocationSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  descriptionKey: 'path',
  groupIdKey: 'locationRole',
} as const;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `locationsOptions` resolver,
// which reuses the existing location `.select()` (full ltree path as description). Entity params
// (locationRoles / inventoryItemId / goods-receipt exclusion scope) are declared as query variables and
// passed through by the consumer via `params={{ ... }}`.
const LOCATIONS_OPTIONS = gql`
  query LocationsOptions(
    $input: SelectOptionsInput
    $locationRoles: String
    $inventoryItemId: ID
    $excludeUsedOnGoodsReceiptItemId: ID
    $goodsReceiptLotId: ID
  ) {
    locationsOptions(
      input: $input
      locationRoles: $locationRoles
      inventoryItemId: $inventoryItemId
      excludeUsedOnGoodsReceiptItemId: $excludeUsedOnGoodsReceiptItemId
      goodsReceiptLotId: $goodsReceiptLotId
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

// Renders the parent breadcrumb from an ltree path: main.sales.sales_rack_a.bin_1 → "Main › Sales › Sales Rack A".
// Drops the leaf segment because it's already shown as the option label.
export const formatLocationPath = (path: string): string =>
  path
    .split('.')
    .slice(0, -1)
    .map((segment) => segment.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' › ');

// Pre-configured Select for location selection — server returns full ltree path as description.
export const LocationSelector = forwardRef<View, LocationSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Location"
    placeholder="Select location"
    searchable
    optionsQuery={LOCATIONS_OPTIONS}
    optionsDataKey="locationsOptions"
    transformDescription={formatLocationPath}
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
LocationSelector.displayName = 'LocationSelector';
