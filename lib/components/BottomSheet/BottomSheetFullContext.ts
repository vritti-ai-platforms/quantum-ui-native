import { createContext, createElement, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

// Shared state between BottomSheetHeader (sticky top) and BottomSheetScrollView
// (scrollable body). `scrollY` is a Reanimated SharedValue so the header's
// backdrop opacity worklet can read it on the UI thread. `headerHeight` is a
// React state because the scroll view uses it for content-container padding,
// which is a layout-time value, not animated frame-by-frame.
export interface BottomSheetFullContextValue {
  scrollY: SharedValue<number>;
  headerHeight: number;
  setHeaderHeight: (height: number) => void;
}

export const BottomSheetFullContext = createContext<BottomSheetFullContextValue | null>(null);

export function useBottomSheetFullContext(): BottomSheetFullContextValue | null {
  return useContext(BottomSheetFullContext);
}

/**
 * Wraps the BottomSheet content in a context that lets `BottomSheetHeader` and
 * `BottomSheetScrollView` communicate. Mounted by `BottomSheet` itself; consumers
 * don't have to think about it. Harmless when those compound children aren't used.
 */
export const BottomSheetFullProvider = ({ children }: { children: ReactNode }) => {
  const scrollY = useSharedValue(0);
  const [headerHeight, setHeaderHeightState] = useState(0);
  // Only commit when height actually changes (onLayout fires on every layout
  // pass; setState short-circuits a no-op but the equality is free).
  const setHeaderHeight = useCallback((next: number) => {
    setHeaderHeightState((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
  }, []);
  const value = useMemo<BottomSheetFullContextValue>(
    () => ({ scrollY, headerHeight, setHeaderHeight }),
    [scrollY, headerHeight, setHeaderHeight],
  );
  return createElement(BottomSheetFullContext.Provider, { value }, children);
};
