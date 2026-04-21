import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useSystemColorScheme, View } from 'react-native';
import { VariableContextProvider } from 'nativewind';
import { darkColors, lightColors } from './colors';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem?: (key: string) => Promise<void>;
}

export interface ThemeContextValue {
  colorScheme: 'light' | 'dark';
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  isHydrated: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  storage?: ThemeStorageAdapter;
  storageKey?: string;
  defaultPreference?: ThemePreference;
}

const DEFAULT_THEME_STORAGE_KEY = 'vritti_theme_preference';

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

// Resolves the active color scheme from the OS and injects theme tokens via NativeWind.
export const ThemeProvider = ({
  children,
  storage,
  storageKey = DEFAULT_THEME_STORAGE_KEY,
  defaultPreference = 'system',
}: ThemeProviderProps) => {
  const systemScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(defaultPreference);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateThemePreference() {
      if (!storage) {
        if (isMounted) {
          setThemePreferenceState(defaultPreference);
          setIsHydrated(true);
        }
        return;
      }

      try {
        const storedPreference = await storage.getItem(storageKey);
        if (isMounted) {
          setThemePreferenceState(isThemePreference(storedPreference) ? storedPreference : defaultPreference);
        }
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    hydrateThemePreference();

    return () => {
      isMounted = false;
    };
  }, [defaultPreference, storage, storageKey]);

  const setThemePreference = useCallback(
    async (preference: ThemePreference) => {
      setThemePreferenceState(preference);
      if (storage) {
        await storage.setItem(storageKey, preference);
      }
    },
    [storage, storageKey],
  );

  const resolvedScheme: 'light' | 'dark' =
    themePreference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePreference;
  const isDark = resolvedScheme === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: resolvedScheme,
      isDark,
      themePreference,
      setThemePreference,
      isHydrated,
    }),
    [resolvedScheme, isDark, themePreference, setThemePreference, isHydrated],
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
