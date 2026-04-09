import React, { createContext, useCallback, useMemo, useState } from 'react';
import { useColorScheme as useSystemColorScheme, View } from 'react-native';
import { VariableContextProvider } from 'nativewind';
import { darkColors, lightColors } from './colors';

type ColorScheme = 'light' | 'dark' | 'system';

export interface ThemeContextValue {
  colorScheme: 'light' | 'dark';
  preference: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  toggleColorScheme: () => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultScheme?: ColorScheme;
}

// Provides color scheme management and injects CSS variables via NativeWind VariableContextProvider
export const ThemeProvider = ({ children, defaultScheme = 'system' }: ThemeProviderProps) => {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreference] = useState<ColorScheme>(defaultScheme);

  const resolvedScheme: 'light' | 'dark' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const isDark = resolvedScheme === 'dark';

  const toggleColorScheme = useCallback(() => {
    setPreference((prev: ColorScheme) => {
      const current = prev === 'system' ? (systemScheme ?? 'light') : prev;
      return current === 'light' ? 'dark' : 'light';
    });
  }, [systemScheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: resolvedScheme,
      preference,
      setColorScheme: setPreference,
      toggleColorScheme,
      isDark,
    }),
    [resolvedScheme, preference, toggleColorScheme, isDark],
  );

  const colorValues = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  return (
    <ThemeContext.Provider value={value}>
      <VariableContextProvider value={colorValues}>
        <View style={{ flex: 1 }} className={isDark ? 'dark' : ''}>
          {children}
        </View>
      </VariableContextProvider>
    </ThemeContext.Provider>
  );
};
