import * as React from 'react';
import { useCallback } from 'react';
import { Pressable, type View } from 'react-native';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../reusables/field';
import {
  MultiSelectActions,
  MultiSelectRow,
  SelectContent,
  SelectList,
  type SelectListItem,
  SelectListRoot,
  SelectLoading,
  SelectSearch,
  SelectTrigger,
} from '../../../reusables/multi-select';
import { Badge } from '../../Badge';
import { COMMON_ICONS, DynamicIcon } from '../../DynamicIcon';
import { Text } from '../../Typography';
import { useMultiSelect } from '../hooks/useMultiSelect';
import type { AsyncSelectState, SelectGroup, SelectOption, SelectValue } from '../types';

export interface MultiSelectProps {
  label?: string;
  description?: React.ReactNode;
  error?: string;
  placeholder?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  value?: SelectValue[];
  onChange?: (values: SelectValue[]) => void;
  onOptionsSelect?: (options: SelectOption[]) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  defaultValue?: SelectValue[];
  maxDisplayedItems?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  asyncState?: AsyncSelectState;
  // Transforms how label is displayed in option rows and selected trigger chips
  transformLabel?: (label: string, option: SelectOption, context: 'option' | 'trigger') => string;
  // Transforms how description is displayed in option rows
  transformDescription?: (description: string, option: SelectOption) => string;
  // Custom className for the popover content panel
  contentClassName?: string;
  // Called when the popover open state changes
  onOpenChange?: (open: boolean) => void;
}

// Flattens grouped/ungrouped options into a single list model for the virtualized list
function buildListData(
  filteredOptions: SelectOption[],
  grouped: ReturnType<typeof useMultiSelect>['grouped'],
): SelectListItem[] {
  if (!grouped) {
    return filteredOptions.map((option) => ({ type: 'option', key: String(option.value), option }));
  }

  const items: SelectListItem[] = [];
  for (const option of grouped.ungrouped) {
    items.push({ type: 'option', key: String(option.value), option });
  }
  for (const entry of grouped.entries) {
    items.push({ type: 'group', key: `group:${entry.name}`, name: entry.name });
    for (const option of entry.options) {
      items.push({ type: 'option', key: String(option.value), option });
    }
  }
  return items;
}

// Multi-value select with checkbox options, search, and badge chips
export const MultiSelect = React.forwardRef<View, MultiSelectProps>(
  (
    {
      label,
      description,
      error,
      placeholder = 'Select options',
      options,
      groups,
      value: controlledValue,
      onChange,
      onOptionsSelect,
      name: _name,
      disabled = false,
      required: _required,
      className,
      id,
      defaultValue,
      maxDisplayedItems = 3,
      searchable = false,
      searchPlaceholder = 'Search...',
      clearable: _clearable,
      asyncState,
      transformLabel,
      transformDescription,
      contentClassName,
      onOpenChange,
    },
    ref,
  ) => {
    const state = useMultiSelect({
      options: options ?? [],
      groups,
      value: controlledValue,
      onChange,
      onOptionsSelect,
      defaultValue,
      remoteSearch: !!asyncState,
    });

    // Notifies parent (Select.tsx) of open state changes to gate async queries; clears async search on close
    function handleOpenChange(o: boolean) {
      state.setOpen(o);
      onOpenChange?.(o);
      if (!o) asyncState?.setSearchQuery('');
    }

    // Resolve search binding — async delegates to parent, static uses local state
    const searchValue = asyncState ? asyncState.searchQuery : state.searchQuery;
    const setSearchValue = asyncState ? asyncState.setSearchQuery : state.setSearchQuery;
    const showSearch = !!asyncState || searchable;

    // Renders a single option row
    const renderRow = useCallback(
      (option: SelectOption): React.ReactElement => {
        const optionLabel = transformLabel ? transformLabel(option.label, option, 'option') : option.label;
        const optionDescription = option.description
          ? transformDescription
            ? transformDescription(option.description, option)
            : option.description
          : undefined;

        return (
          <MultiSelectRow
            name={optionLabel}
            description={optionDescription}
            checked={state.selectedSet.has(option.value)}
            onToggle={() => state.toggleOption(option.value)}
            disabled={option.disabled}
          />
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [state.selectedSet, transformLabel, transformDescription, state.toggleOption],
    );

    const listData = React.useMemo(
      () => buildListData(state.filteredOptions, state.grouped),
      [state.filteredOptions, state.grouped],
    );

    // Renders badge chips, count summary, or placeholder inside the trigger
    function renderTriggerContent() {
      if (state.selectedOptions.length === 0) {
        return (
          <Text className="text-muted-foreground text-sm" numberOfLines={1}>
            {placeholder}
          </Text>
        );
      }

      if (state.selectedOptions.length > maxDisplayedItems) {
        return <Text className="text-foreground text-sm">{state.selectedOptions.length} items selected</Text>;
      }

      return state.selectedOptions.map((option) => (
        <Badge key={String(option.value)} className="gap-2 px-3">
          <Text className="text-muted-foreground text-xs font-medium">
            {transformLabel ? transformLabel(option.label, option, 'trigger') : option.label}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${option.label}`}
            hitSlop={6}
            onPress={() => state.toggleOption(option.value)}
          >
            <DynamicIcon icon={COMMON_ICONS.close} className="text-muted-foreground" size={12} />
          </Pressable>
        </Badge>
      ));
    }

    return (
      <Field ref={ref}>
        {label ? <FieldLabel nativeID={id}>{label}</FieldLabel> : null}

        <SelectListRoot open={state.open} onOpenChange={handleOpenChange} disabled={disabled}>
          <SelectTrigger disabled={disabled} invalid={!!error} minHeight className={className}>
            {renderTriggerContent()}
          </SelectTrigger>

          <SelectContent className={contentClassName}>
            {showSearch ? (
              <SelectSearch value={searchValue} onValueChange={setSearchValue} placeholder={searchPlaceholder} />
            ) : null}

            {asyncState?.loading ? (
              <SelectLoading />
            ) : (
              <SelectList
                data={listData}
                renderRow={renderRow}
                onEndReached={asyncState?.onEndReached}
                loadingMore={asyncState?.loadingMore}
              />
            )}

            <MultiSelectActions onSelectAll={state.selectAll} onClear={state.clearAll} disabled={disabled} />
          </SelectContent>
        </SelectListRoot>

        {error ? <FieldError>{error}</FieldError> : null}
        {!error && description ? (
          typeof description === 'string' ? (
            <FieldDescription>{description}</FieldDescription>
          ) : (
            <>{description}</>
          )
        ) : null}
      </Field>
    );
  },
);

MultiSelect.displayName = 'MultiSelect';
