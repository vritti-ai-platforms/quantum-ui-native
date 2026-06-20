import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type CategorySelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `categoriesOptions` resolver,
// which reuses the existing category `findForSelect` (leaves only, full ltree path as description).
const CATEGORIES_OPTIONS = gql`
  query CategoriesOptions($input: SelectOptionsInput) {
    categoriesOptions(input: $input) {
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

// Renders the parent breadcrumb from an ltree path: medicines.prescription.antibiotics → "Medicines › Prescription".
// Drops the leaf segment because it's already shown as the option label.
export const formatCategoryPath = (path: string): string =>
  path
    .split('.')
    .slice(0, -1)
    .map((segment) => segment.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(' › ');

// Pre-configured Select for category selection — server returns leaves only with full ltree path as description.
export const CategorySelector = forwardRef<View, CategorySelectorProps>((props, ref) => (
  <Select
    ref={ref}
    label="Category"
    placeholder="Select category"
    searchable
    optionsQuery={CATEGORIES_OPTIONS}
    optionsDataKey="categoriesOptions"
    fieldKeys={{ valueKey: 'id', labelKey: 'name', descriptionKey: 'path' }}
    transformDescription={formatCategoryPath}
    {...props}
  />
));
CategorySelector.displayName = 'CategorySelector';
// Lets quantum <Form> bind this by `name` (value/onChange) like any field.
Object.assign(CategorySelector, { fieldBinding: { valueProp: 'value', changeProp: 'onChange' } });
