import { gql } from '@apollo/client';
import { forwardRef } from 'react';
import { Pressable, View } from 'react-native';
import { COMMON_ICONS, DynamicIcon } from '../../components/DynamicIcon';
import { Select, type SelectProps, type SingleSelectOptionRenderProps } from '@vritti/quantum-ui-native/Select';
import { Text } from '../../components/Text';

export type QuantSelectorParams = { inventoryItemId?: string };

export type QuantSelectorProps = Omit<SelectProps, 'optionsQuery' | 'optionsDataKey' | 'optionsEndpoint' | 'params'> & {
  params?: QuantSelectorParams;
};

// GraphQL options query — forwards the shared SelectOptionsInput to the server's `inventoryItemQuantsOptions`
// resolver, scoped to a single inventory item via the top-level `inventoryItemId` variable. `additionalKeys`
// requests quantity/symbol so the custom row can render the on-hand amount + UOM.
const INVENTORY_ITEM_QUANTS_OPTIONS = gql`
  query InventoryItemQuantsOptions($input: SelectOptionsInput, $inventoryItemId: ID) {
    inventoryItemQuantsOptions(input: $input, inventoryItemId: $inventoryItemId) {
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

// Custom option row: label (lotNumber / item name) + description on the left, quantity + UOM symbol on
// the right, a check when selected. Mirrors the web QuantSelector row. Tapping selects + closes the sheet
// (onSelect → SingleSelect.handleSelectOption, which dismisses the sheet).
function QuantOptionRow({ option, selected, onSelect }: SingleSelectOptionRenderProps) {
  const qty = option.additionals?.quantity;
  const symbol = typeof option.additionals?.symbol === 'string' ? option.additionals.symbol : null;

  return (
    <Pressable
      accessibilityRole="menuitem"
      accessibilityState={{ selected }}
      onPress={onSelect}
      className="active:bg-accent relative min-h-11 flex-row items-center gap-2 rounded-sm py-1.5 pl-2 pr-8"
    >
      <View className="min-w-0 flex-1">
        <Text className="text-foreground text-sm" numberOfLines={1}>
          {option.label || '—'}
        </Text>
        {option.description ? (
          <Text className="text-muted-foreground mt-0.5 text-xs" numberOfLines={1}>
            {option.description}
          </Text>
        ) : null}
      </View>
      {qty != null ? (
        <Text className="text-muted-foreground shrink-0 text-xs">
          {String(qty)}
          {symbol ? ` ${symbol}` : ''}
        </Text>
      ) : null}
      <View className="absolute right-2 size-3.5 items-center justify-center">
        {selected ? <DynamicIcon icon={COMMON_ICONS.check} className="text-foreground size-4" /> : null}
      </View>
    </Pressable>
  );
}

// Pre-configured Select for quant selection; pass params={{ inventoryItemId }} to scope to one item.
export const QuantSelector = forwardRef<View, QuantSelectorProps>(({ params, ...props }, ref) => (
  <Select
    ref={ref}
    label="Quant"
    placeholder="Select quant"
    searchable
    optionsQuery={INVENTORY_ITEM_QUANTS_OPTIONS}
    optionsDataKey="inventoryItemQuantsOptions"
    params={{ inventoryItemId: params?.inventoryItemId }}
    fieldKeys={{ additionalKeys: 'quantity,symbol' }}
    renderOption={(p) => <QuantOptionRow {...p} />}
    {...props}
  />
));
QuantSelector.displayName = 'QuantSelector';
