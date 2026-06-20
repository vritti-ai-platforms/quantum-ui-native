import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type CostCategorySelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint'>;

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `costCategoriesOptions`
// resolver, which reuses the existing cost-category `select`. additionalKeys expose kind + code.
const COST_CATEGORIES_OPTIONS = gql`
  query CostCategoriesOptions($input: SelectOptionsInput) {
    costCategoriesOptions(input: $input) {
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
  descriptionKey: 'kind',
  additionalKeys: 'kind,code',
} as const;

function defaultTransformDescription(value: string, option: SelectOption): string {
  const kind = typeof option.additionals?.kind === 'string' ? option.additionals.kind : value;
  return kind || '';
}

// Pre-configured Select for cost-category selection. Description = the category's `kind` enum value
// (item / freight / duty / insurance / service / other).
export const CostCategorySelector = forwardRef<View, CostCategorySelectorProps>(
  ({ fieldKeys, ...props }, ref) => (
    <Select
      ref={ref}
      label="Cost Category"
      placeholder="Select cost category"
      searchable
      optionsQuery={COST_CATEGORIES_OPTIONS}
      optionsDataKey="costCategoriesOptions"
      transformDescription={defaultTransformDescription}
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
CostCategorySelector.displayName = 'CostCategorySelector';
