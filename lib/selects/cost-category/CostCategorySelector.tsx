import { forwardRef } from 'react';
import type { View } from 'react-native';
import { Select, type SelectOption, type SelectProps } from '@vritti/quantum-ui-native/Select';

export type CostCategorySelectorProps = Omit<SelectProps, 'optionsEndpoint'>;

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
// (item / freight / duty / insurance / service / other). NOTE: this endpoint
// (commerce-api/cost-categories/select) has no core-server gateway route yet — ported for web parity;
// it will not load until that route is added.
export const CostCategorySelector = forwardRef<View, CostCategorySelectorProps>(
  ({ fieldKeys, ...props }, ref) => (
    <Select
      ref={ref}
      label="Cost Category"
      placeholder="Select cost category"
      searchable
      optionsEndpoint="commerce-api/cost-categories/select"
      transformDescription={defaultTransformDescription}
      {...props}
      fieldKeys={{ ...DEFAULT_FIELD_KEYS, ...fieldKeys }}
    />
  ),
);
CostCategorySelector.displayName = 'CostCategorySelector';
