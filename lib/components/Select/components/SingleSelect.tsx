import * as React from 'react';
import { useCallback } from 'react';
import type { View } from 'react-native';
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../reusables/field';
import {
  SelectContent,
  SelectList,
  type SelectListItem,
  SelectListRoot,
  SelectLoading,
  SelectSearch,
  SelectTrigger,
  SingleSelectClear,
  SingleSelectRow,
} from '../../../reusables/single-select';
import { cn } from '../../../utils/index';
import { Text } from '../../Text';
import { useSingleSelect } from '../hooks/useSingleSelect';
import type { AsyncSelectState, SelectGroup, SelectOption, SelectValue } from '../types';

export type SingleSelectLabelTransformContext = 'trigger' | 'option';

export interface SingleSelectOptionRenderProps {
  option: SelectOption;
  selected: boolean;
  onSelect: () => void;
}

export interface SingleSelectProps {
  label?: string;
  description?: React.ReactNode;
  error?: string;
  placeholder?: string;
  options?: SelectOption[];
  groups?: SelectGroup[];
  value?: SelectValue;
  onChange?: (value: SelectValue) => void;
  onOptionSelect?: (option: SelectOption | null) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  defaultValue?: SelectValue;
  searchable?: boolean;
  searchPlaceholder?: string;
  clearable?: boolean;
  asyncState?: AsyncSelectState;
  // Custom option row renderer — replaces the default SingleSelectRow
  renderOption?: (props: SingleSelectOptionRenderProps) => React.ReactElement;
  // Transforms how labels are displayed in trigger and option rows
  transformLabel?: (label: string, option: SelectOption, context: SingleSelectLabelTransformContext) => string;
  // Transforms how description is displayed in option rows
  transformDescription?: (description: string, option: SelectOption) => string;
  // Content rendered below the option list
  footer?: React.ReactNode;
  // Custom className for the popover content panel
  contentClassName?: string;
  // Called when the popover open state changes
  onOpenChange?: (open: boolean) => void;
}

// Flattens grouped/ungrouped options into a single list model for the virtualized list
function buildListData(
  filteredOptions: SelectOption[],
  grouped: ReturnType<typeof useSingleSelect>['grouped'],
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

// Single-value form field built on Popover primitives
export const SingleSelect = React.forwardRef<View, SingleSelectProps>(
  (
    {
      label,
      description,
      error,
      placeholder = 'Select an option',
      options,
      groups,
      value: controlledValue,
      onChange,
      onOptionSelect,
      name: _name,
      disabled = false,
      required: _required,
      className,
      id,
      defaultValue,
      searchable = false,
      searchPlaceholder = 'Search...',
      clearable = false,
      asyncState,
      renderOption,
      transformLabel,
      transformDescription,
      footer,
      contentClassName: _contentClassName,
      onOpenChange,
    },
    ref,
  ) => {
    const state = useSingleSelect({
      options: options ?? [],
      groups,
      value: controlledValue,
      onChange,
      onOptionSelect,
      defaultValue,
      remoteSearch: !!asyncState,
    });

    // Notifies parent (Select.tsx) of open state changes to gate async queries; clears async search on close
    function handleOpenChange(o: boolean) {
      state.setOpen(o);
      onOpenChange?.(o);
      if (!o) asyncState?.setSearchQuery('');
    }

    function handleSelectOption(value: SelectValue) {
      state.selectOption(value);
      handleOpenChange(false);
    }

    function handleClearSelection() {
      state.clearSelection();
      handleOpenChange(false);
    }

    // Resolve search binding — async delegates to parent, static uses local state
    const searchValue = asyncState ? asyncState.searchQuery : state.searchQuery;
    const setSearchValue = asyncState ? asyncState.setSearchQuery : state.setSearchQuery;
    const showSearch = !!asyncState || searchable;

    // Renders a single option row
    // biome-ignore lint/correctness/useExhaustiveDependencies: <>
    const renderRow = useCallback(
      (option: SelectOption): React.ReactElement => {
        if (renderOption) {
          return renderOption({
            option,
            selected: state.selectedValue === option.value,
            onSelect: () => handleSelectOption(option.value),
          });
        }
        return (
          <SingleSelectRow
            name={transformLabel ? transformLabel(option.label, option, 'option') : option.label}
            description={
              option.description
                ? transformDescription
                  ? transformDescription(option.description, option)
                  : option.description
                : undefined
            }
            selected={state.selectedValue === option.value}
            onSelect={() => handleSelectOption(option.value)}
            disabled={option.disabled}
          />
        );
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [state.selectedValue, renderOption, transformLabel, transformDescription],
    );

    const listData = React.useMemo(
      () => buildListData(state.filteredOptions, state.grouped),
      [state.filteredOptions, state.grouped],
    );

    const triggerLabel = state.selectedOption
      ? transformLabel
        ? transformLabel(state.selectedOption.label, state.selectedOption, 'trigger')
        : state.selectedOption.label
      : undefined;

    return (
      <Field ref={ref}>
        {label ? <FieldLabel nativeID={id}>{label}</FieldLabel> : null}

        <SelectListRoot open={state.open} onOpenChange={handleOpenChange} disabled={disabled} title={label}>
          <SelectTrigger disabled={disabled} invalid={!!error} className={cn('w-full', className)}>
            {triggerLabel ? (
              <Text className="text-foreground text-sm" numberOfLines={1}>
                {triggerLabel}
              </Text>
            ) : (
              <Text className="text-muted-foreground text-sm" numberOfLines={1}>
                {placeholder}
              </Text>
            )}
          </SelectTrigger>

          <SelectContent
            search={
              showSearch ? (
                <SelectSearch value={searchValue} onValueChange={setSearchValue} placeholder={searchPlaceholder} />
              ) : undefined
            }
            footer={
              clearable || footer ? (
                <>
                  {clearable ? (
                    <SingleSelectClear onClear={handleClearSelection} disabled={!state.selectedValue} />
                  ) : null}
                  {footer}
                </>
              ) : undefined
            }
          >
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
          </SelectContent>
        </SelectListRoot>

        {error ? <FieldError>{error}</FieldError> : null}
        {!error && description ? (
          typeof description === 'string' ? (
            <FieldDescription>{description}</FieldDescription>
          ) : (
            description
          )
        ) : null}
      </Field>
    );
  },
);

SingleSelect.displayName = 'SingleSelect';
