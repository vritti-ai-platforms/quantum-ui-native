import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { SelectGroup, SelectOption, SelectValue } from '../types';

interface UseSingleSelectStateProps {
  options: SelectOption[];
  groups?: SelectGroup[];
  value?: SelectValue;
  onChange?: (value: SelectValue) => void;
  onOptionSelect?: (option: SelectOption | null) => void;
  defaultValue?: SelectValue;
  remoteSearch?: boolean;
}

// Manages controlled/uncontrolled single-select state, search filtering, and grouping
// No ref needed here — selectOption receives the value as an argument rather than reading current state
export function useSingleSelect({
  options,
  groups,
  value: controlledValue,
  onChange,
  onOptionSelect,
  defaultValue,
  remoteSearch,
}: UseSingleSelectStateProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<SelectValue>(defaultValue ?? '');
  const selectedValue = isControlled ? controlledValue : internalValue;

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const listboxId = useId();

  const optionMap = useMemo(() => {
    const map = new Map<SelectValue, SelectOption>();
    for (const option of options) {
      map.set(option.value, option);
    }
    return map;
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (remoteSearch || !searchQuery) return options;
    const lower = searchQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(lower));
  }, [options, searchQuery, remoteSearch]);

  const updateSelection = useCallback(
    (nextValue: SelectValue) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [isControlled, onChange],
  );

  // Select an option and close the popover
  const selectOption = useCallback(
    (optionValue: SelectValue) => {
      const option = optionMap.get(optionValue);
      if (option?.disabled) return;
      onOptionSelect?.(option ?? null);
      updateSelection(optionValue);
      setOpen(false);
    },
    [optionMap, updateSelection, onOptionSelect],
  );

  // Clear the selection and close the popover
  const clearSelection = useCallback(() => {
    onOptionSelect?.(null);
    updateSelection('');
    setOpen(false);
  }, [updateSelection, onOptionSelect]);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const selectedOption = selectedValue ? optionMap.get(selectedValue) : undefined;

  // Fire onOptionSelect once when the initial value resolves from the async option map.
  // Tracks whether we've already notified so re-renders don't re-fire it.
  const notifiedInitialRef = useRef<SelectValue | null>(null);
  useEffect(() => {
    if (selectedOption && notifiedInitialRef.current !== selectedValue) {
      notifiedInitialRef.current = selectedValue ?? null;
      onOptionSelect?.(selectedOption);
    }
  }, [selectedOption, selectedValue, onOptionSelect]);

  // O(n + g) grouping — one pass over groups, one pass over options
  const grouped = useMemo(() => {
    if (!groups || groups.length === 0) return null;

    const buckets = new Map<string | number, SelectOption[]>();
    for (const g of groups) {
      buckets.set(g.id, []);
    }

    const ungrouped: SelectOption[] = [];
    for (const option of filteredOptions) {
      const bucket = option.groupId != null ? buckets.get(option.groupId) : undefined;
      if (bucket) {
        bucket.push(option);
      } else {
        ungrouped.push(option);
      }
    }

    const entries: Array<{ name: string; options: SelectOption[] }> = [];
    for (const g of groups) {
      const bucket = buckets.get(g.id);
      if (!bucket || bucket.length === 0) continue;
      entries.push({ name: g.name, options: bucket });
    }

    return { ungrouped, entries };
  }, [filteredOptions, groups]);

  return {
    selectedValue,
    selectedOption,
    open,
    setOpen,
    searchQuery,
    setSearchQuery,
    listboxId,
    filteredOptions,
    grouped,
    selectOption,
    clearSelection,
  };
}
