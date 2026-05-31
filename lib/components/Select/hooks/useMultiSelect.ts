import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { SelectGroup, SelectOption, SelectValue } from '../types';

interface UseMultiSelectStateProps {
  options: SelectOption[];
  groups?: SelectGroup[];
  value?: SelectValue[];
  onChange?: (values: SelectValue[]) => void;
  onOptionsSelect?: (options: SelectOption[]) => void;
  defaultValue?: SelectValue[];
  remoteSearch?: boolean;
}

// Manages controlled/uncontrolled multi-select state, search filtering, and grouping
export function useMultiSelect({
  options,
  groups,
  value: controlledValue,
  onChange,
  onOptionsSelect,
  defaultValue,
  remoteSearch,
}: UseMultiSelectStateProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<SelectValue[]>(defaultValue ?? []);
  const selectedValues = isControlled ? controlledValue : internalValue;
  const selectedSet = useMemo(() => new Set<SelectValue>(selectedValues), [selectedValues]);

  // Ref to latest selectedValues so callbacks stay reference-stable
  const selectedValuesRef = useRef(selectedValues);
  selectedValuesRef.current = selectedValues;

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
    return options.filter((option) => option.label.toLowerCase().includes(lower));
  }, [options, searchQuery, remoteSearch]);

  const updateSelection = useCallback(
    (nextValues: SelectValue[]) => {
      if (!isControlled) {
        setInternalValue(nextValues);
      }
      onChange?.(nextValues);
    },
    [isControlled, onChange],
  );

  // Toggle a single option on or off
  const toggleOption = useCallback(
    (optionValue: SelectValue) => {
      const option = optionMap.get(optionValue);
      if (option?.disabled) return;
      const current = selectedValuesRef.current;
      const nextValues = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      const nextOptions = nextValues.map((v) => optionMap.get(v)).filter(Boolean) as SelectOption[];
      onOptionsSelect?.(nextOptions);
      updateSelection(nextValues);
    },
    [optionMap, updateSelection, onOptionsSelect],
  );

  // Preserve already-selected disabled options when selecting all
  const selectAll = useCallback(() => {
    const enabledValues = options.filter((o) => !o.disabled).map((o) => o.value);
    const currentDisabledValues = selectedValuesRef.current.filter((v) => optionMap.get(v)?.disabled);
    const nextValues = [...new Set([...currentDisabledValues, ...enabledValues])];
    const nextOptions = nextValues.map((v) => optionMap.get(v)).filter(Boolean) as SelectOption[];
    onOptionsSelect?.(nextOptions);
    updateSelection(nextValues);
  }, [options, optionMap, updateSelection, onOptionsSelect]);

  // Retain disabled options that are currently selected when clearing
  const clearAll = useCallback(() => {
    const currentDisabledValues = selectedValuesRef.current.filter((v) => optionMap.get(v)?.disabled);
    const remainingOptions = currentDisabledValues.map((v) => optionMap.get(v)).filter(Boolean) as SelectOption[];
    onOptionsSelect?.(remainingOptions);
    updateSelection(currentDisabledValues);
  }, [optionMap, updateSelection, onOptionsSelect]);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  // Map selected values to their option objects for display
  const selectedOptions = useMemo(
    () => selectedValues.map((v) => optionMap.get(v)).filter(Boolean) as SelectOption[],
    [selectedValues, optionMap],
  );

  // Fire onOptionsSelect once when all initial values resolve from the async option map.
  const notifiedInitialRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedValues.length === 0) return;
    const allResolved = selectedValues.every((v) => optionMap.has(v));
    if (!allResolved) return;
    const key = [...selectedValues].sort().join(',');
    if (notifiedInitialRef.current === key) return;
    notifiedInitialRef.current = key;
    onOptionsSelect?.(selectedOptions);
  }, [selectedOptions, selectedValues, optionMap, onOptionsSelect]);

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
    selectedValues,
    selectedSet,
    selectedOptions,
    open,
    setOpen,
    searchQuery,
    setSearchQuery,
    listboxId,
    filteredOptions,
    grouped,
    toggleOption,
    selectAll,
    clearAll,
  };
}
