import type { DocumentNode } from '@apollo/client';
import * as React from 'react';
import type { View } from 'react-native';
import { MultiSelect, type MultiSelectProps } from './components/MultiSelect';
import { SingleSelect, type SingleSelectProps } from './components/SingleSelect';
import { useApolloSelect } from './hooks/useApolloSelect';
import type { AsyncSelectState, SelectFieldKeys } from './types';

interface SelectBaseProps {
  /** Apollo document for the entity's `<entity>Options(...)` query (the async option source). */
  optionsQuery?: DocumentNode;
  /** Top-level field on `optionsQuery` holding the SelectOptions result (e.g. 'categoriesOptions'). */
  optionsDataKey?: string;
  searchDebounceMs?: number;
  limit?: number;
  fieldKeys?: SelectFieldKeys;
  // Entity-specific query params (e.g. inventoryItemId). `undefined` values are simply omitted from the query.
  params?: Record<string, string | number | boolean | undefined>;
}

export interface SelectProps extends Omit<SingleSelectProps & MultiSelectProps, 'value' | 'onChange'>, SelectBaseProps {
  multiple?: boolean;
  value?: SingleSelectProps['value'] | MultiSelectProps['value'];
  onChange?: SingleSelectProps['onChange'] | MultiSelectProps['onChange'];
}

// Unified select field supporting single/multi selection with optional async option loading
export const Select = React.forwardRef<View, SelectProps>((props, ref) => {
  const { multiple, optionsQuery, optionsDataKey, searchDebounceMs, limit, fieldKeys, params, onOpenChange, ...rest } = props;
  const [open, setOpen] = React.useState(false);

  const selectData = useApolloSelect({
    options: rest.options,
    groups: rest.groups,
    optionsQuery,
    dataKey: optionsDataKey,
    searchDebounceMs,
    limit,
    fieldKeys,
    params,
    selectedValues: rest.value != null ? (Array.isArray(rest.value) ? rest.value : [rest.value]) : undefined,
    enabled: open,
  });

  const isAsync = !!optionsQuery;

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
