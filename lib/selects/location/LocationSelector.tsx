import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type LocationSelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

const DEFAULT_FIELD_KEYS = {
  valueKey: 'id',
  labelKey: 'name',
  descriptionKey: 'path',
  groupIdKey: 'locationRole',
} as const;

// Renders the parent breadcrumb from an ltree path: main.sales.sales_rack_a.bin_1 → "Main › Sales › Sales Rack A".
// Drops the leaf segment because it's already shown as the option label.
export const formatLocationPath = (path: string): string =>
  path
    .split('.')
    .slice(0, -1)
    .map((segment) => segment.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' › ');

// Pre-configured Select for location selection — server returns full ltree path as description.
// Hits GET /commerce-api/locations/select.
export const LocationSelector = forwardRef<View, LocationSelectorProps>(({ fieldKeys, ...props }, ref) => (
  <Select
    ref={ref}
    label="Location"
    placeholder="Select location"
    searchable
    optionsEndpoint="commerce-api/locations/select"
    transformDescription={formatLocationPath}
    {...props}
    fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
  />
));
LocationSelector.displayName = 'LocationSelector';
