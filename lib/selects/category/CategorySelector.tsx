import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type CategorySelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

// Renders the parent breadcrumb from an ltree path: medicines.prescription.antibiotics → "Medicines › Prescription".
// Drops the leaf segment because it's already shown as the option label.
export const formatCategoryPath = (path: string): string =>
  path
    .split('.')
    .slice(0, -1)
    .map((segment) => segment.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' › ');

// Pre-configured Select for category selection — server returns leaves only with full ltree path as description.
// Hits GET /commerce-api/categories/select.
export const CategorySelector = forwardRef<View, CategorySelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Category"
    placeholder="Select category"
    searchable
    optionsEndpoint="commerce-api/categories/select"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'path' }}
    transformDescription={formatCategoryPath}
    {...props}
  />
));
CategorySelector.displayName = 'CategorySelector';
