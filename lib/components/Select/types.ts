export type SelectValue = string | number | boolean;

export interface SelectOption {
  value: SelectValue;
  label: string;
  description?: string;
  additionals?: Record<string, string | number | boolean | null>;
  disabled?: boolean;
  groupId?: string | number;
}

export interface SelectGroup {
  id: string | number;
  name: string;
}

export interface SelectOptionsResponse {
  options: SelectOption[];
  groups?: SelectGroup[];
  hasMore: boolean;
}

export interface AsyncSelectState {
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // FlashList-driven pagination — called when the list reaches its end (replaces the web IntersectionObserver sentinel)
  onEndReached: () => void;
}

export interface SelectFieldKeys {
  valueKey?: string;
  labelKey?: string;
  descriptionKey?: string;
  additionalKeys?: string;
  groupIdKey?: string;
}
