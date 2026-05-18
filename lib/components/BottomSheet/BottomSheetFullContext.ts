import { createContext, createElement, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

export interface BottomSheetFullContextValue {
  scrollY: SharedValue<number>;
  headerHeight: number;
  setHeaderHeight: (height: number) => void;
}

export const BottomSheetFullContext = createContext<BottomSheetFullContextValue | null>(null);

export function useBottomSheetFullContext(): BottomSheetFullContextValue | null {
  return useContext(BottomSheetFullContext);
}

export const BottomSheetFullProvider = ({ children }: { children: ReactNode }) => {
  const scrollY = useSharedValue(0);
  const [headerHeight, setHeaderHeightState] = useState(0);
  const setHeaderHeight = useCallback((next: number) => {
    setHeaderHeightState((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
  }, []);
  const value = useMemo<BottomSheetFullContextValue>(
    () => ({ scrollY, headerHeight, setHeaderHeight }),
    [scrollY, headerHeight, setHeaderHeight],
  );
  return createElement(BottomSheetFullContext.Provider, { value }, children);
};
