import * as React from 'react';
import type { View } from 'react-native';
import { MultiSelect, type MultiSelectProps } from './components/MultiSelect';
import { SingleSelect, type SingleSelectProps } from './components/SingleSelect';
import { useSelect } from './hooks/useSelect';
import type { AsyncSelectState, SelectFieldKeys } from './types';

interface SelectBaseProps {
  optionsEndpoint?: string;
  searchDebounceMs?: number;
  limit?: number;
  fieldKeys?: SelectFieldKeys;
  params?: Record<string, string | number | boolean>;
}

export interface SelectProps extends Omit<SingleSelectProps & MultiSelectProps, 'value' | 'onChange'>, SelectBaseProps {
  multiple?: boolean;
  value?: SingleSelectProps['value'] | MultiSelectProps['value'];
  onChange?: SingleSelectProps['onChange'] | MultiSelectProps['onChange'];
}

// Unified select field supporting single/multi selection with optional async option loading
export const Select = React.forwardRef<View, SelectProps>((props, ref) => {
  const { multiple, optionsEndpoint, searchDebounceMs, limit, fieldKeys, params, onOpenChange, ...rest } = props;
  const [open, setOpen] = React.useState(false);

  const selectData = useSelect({
    options: rest.options,
    groups: rest.groups,
    optionsEndpoint,
    searchDebounceMs,
    limit,
    fieldKeys,
    params,
    selectedValues: rest.value != null ? (Array.isArray(rest.value) ? rest.value : [rest.value]) : undefined,
    enabled: open,
  });

  const isAsync = !!optionsEndpoint;

  const asyncState: AsyncSelectState | undefined = isAsync
    ? {
        loading: selectData.loading,
        loadingMore: selectData.loadingMore,
        hasMore: selectData.hasMore,
        searchQuery: selectData.searchQuery,
        setSearchQuery: selectData.setSearchQuery,
        onEndReached: selectData.onEndReached,
      }
    : undefined;

  const childProps = {
    ...rest,
    options: selectData.options,
    groups: selectData.groups,
    asyncState,
  };

  // Scope async queries to the open popover lifecycle so reopening reuses cached data and refetches in the background.
  function handleOpenChange(o: boolean) {
    setOpen(o);
    onOpenChange?.(o);
  }

  if (multiple) {
    return <MultiSelect ref={ref} {...(childProps as MultiSelectProps)} onOpenChange={handleOpenChange} />;
  }
  return <SingleSelect ref={ref} {...(childProps as SingleSelectProps)} onOpenChange={handleOpenChange} />;
});

Select.displayName = 'Select';
