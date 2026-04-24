import { VariableContextProvider } from 'nativewind';
import type React from 'react';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, useColorScheme as useSystemColorScheme, View } from 'react-native';
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

function resolveScheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
  fallback: 'light' | 'dark',
): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  const raw = systemScheme ?? Appearance.getColorScheme();
  if (raw === 'dark') return 'dark';
  if (raw === 'light') return 'light';
  return fallback;
}

// Applies the correct native appearance override.
// - 'light' / 'dark' → forces the scheme regardless of system on both platforms
// - 'system'         → on iOS passes null to release the override; on Android
//                      no-op because AppearanceModule.setColorScheme is @NonNull
//                      and throws on null — useColorScheme() tracks the live
//                      system scheme on Android so no explicit call is needed.
function applyAppearanceScheme(preference: ThemePreference): void {
  if (preference === 'system') {
    if (Platform.OS === 'ios') {
      (Appearance.setColorScheme as (s: 'light' | 'dark' | null) => void)(null);
    }
  } else {
    Appearance.setColorScheme(preference);
  }
}

export const ThemeProvider = ({
  children,
  storage,
  storageKey = DEFAULT_THEME_STORAGE_KEY,
  defaultPreference = 'system',
}: ThemeProviderProps) => {
  const liveSystemScheme = useSystemColorScheme();

  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(defaultPreference);
  const [isHydrated, setIsHydrated] = useState(!storage);

  const [lastKnownSystemScheme, setLastKnownSystemScheme] = useState<'light' | 'dark'>(() => {
    const initial = Appearance.getColorScheme();
    return initial === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    if (liveSystemScheme === 'dark' || liveSystemScheme === 'light') {
      setLastKnownSystemScheme(liveSystemScheme);
    }
  }, [liveSystemScheme]);

  const resolvedScheme = resolveScheme(themePreference, liveSystemScheme, lastKnownSystemScheme);
  const isDark = resolvedScheme === 'dark';

  useEffect(() => {
    if (!storage) return;

    let isMounted = true;

    async function hydrateThemePreference() {
      try {
        const storedPreference = await storage!.getItem(storageKey);
        if (!isMounted) return;

        const resolved = isThemePreference(storedPreference) ? storedPreference : defaultPreference;

        setThemePreferenceState(resolved);

        // On iOS 26, calling setColorScheme(null) at cold boot transiently
        // poisons Appearance.getColorScheme(), causing the first render to
        // fall back to 'light'. Skip the call when preference is 'system' —
        // iOS is already in follow-system mode and needs no intervention.
        // The runtime setter below still calls this to release active overrides.
        if (resolved !== 'system') {
          applyAppearanceScheme(resolved);
        }
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }

    hydrateThemePreference();

    return () => {
      isMounted = false;
    };
  }, [defaultPreference, storage, storageKey]);

  const setThemePreference = useCallback(
    async (preference: ThemePreference) => {
      // Native layer first — before setState — so the tab bar never sees
      // a stale scheme during the transition. 'system' releases the override.
      applyAppearanceScheme(preference);
      setThemePreferenceState(preference);
      if (storage) {
        await storage.setItem(storageKey, preference);
      }
    },
    [storage, storageKey],
  );

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

  if (!isHydrated) return null;

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
