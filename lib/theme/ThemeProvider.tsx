import { VariableContextProvider } from 'nativewind';
import type React from 'react';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance, AppState, Dimensions, Platform, useColorScheme as useSystemColorScheme, View } from 'react-native';
import { THEME, THEME_TOKENS, type ThemePalette } from './colors';
import { ThemeTransitionOverlay } from './ThemeTransitionOverlay';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem?: (key: string) => Promise<void>;
}

export interface SetThemePreferenceOptions {
  origin?: { x: number; y: number };
  animated?: boolean;
}

export interface ThemeContextValue {
  colorScheme: 'light' | 'dark';
  isDark: boolean;
  palette: ThemePalette;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference, options?: SetThemePreferenceOptions) => Promise<void>;
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
  const [transition, setTransition] = useState<{ fromBg: string; origin: { x: number; y: number } } | null>(null);

  const [lastKnownSystemScheme, setLastKnownSystemScheme] = useState<'light' | 'dark'>(() => {
    const initial = Appearance.getColorScheme();
    return initial === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    // Skip when an override is active — liveSystemScheme then reflects our override, not the device.
    if (themePreference !== 'system') return;
    if (liveSystemScheme === 'dark' || liveSystemScheme === 'light') {
      setLastKnownSystemScheme(liveSystemScheme);
    }
  }, [liveSystemScheme, themePreference]);

  useEffect(() => {
    // Android bridgeless useColorScheme misses device toggles that happen while backgrounded; resync on foreground.
    if (Platform.OS !== 'android') return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      const current = Appearance.getColorScheme();
      if (current === 'dark' || current === 'light') {
        setLastKnownSystemScheme(current);
      }
    });
    return () => subscription.remove();
  }, []);

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

        if (resolved !== 'system' && Platform.OS === 'ios') {
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
    async (preference: ThemePreference, options?: SetThemePreferenceOptions) => {
      const animated = options?.animated !== false;

      // iOS only — Android setColorScheme is one-way (no setColorScheme(null) — @NonNull bridge) and masks device events.
      if (Platform.OS === 'ios') {
        if (preference === 'system') {
          (Appearance.setColorScheme as (s: 'light' | 'dark' | null) => void)(null);
        } else {
          Appearance.setColorScheme(preference);
        }
      }

      let shouldAnimate = false;
      if (animated) {
        if (preference === 'system' && Platform.OS === 'ios') {
          // setColorScheme(null) transiently poisons getColorScheme() to null; animate optimistically.
          shouldAnimate = themePreference !== 'system';
        } else {
          const rawScheme = preference === 'system' ? Appearance.getColorScheme() : preference;
          const nextScheme: 'light' | 'dark' = rawScheme === 'dark' ? 'dark' : 'light';
          shouldAnimate = nextScheme !== resolvedScheme;
        }
      }

      if (shouldAnimate) {
        const { width, height } = Dimensions.get('window');
        setTransition({
          fromBg: THEME[resolvedScheme].background,
          origin: options?.origin ?? { x: width / 2, y: height },
        });
      }

      setThemePreferenceState(preference);
      if (storage) {
        await storage.setItem(storageKey, preference);
      }
    },
    [storage, storageKey, resolvedScheme, themePreference],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme: resolvedScheme,
      isDark,
      palette: THEME[resolvedScheme],
      themePreference,
      setThemePreference,
      isHydrated,
    }),
    [resolvedScheme, isDark, themePreference, setThemePreference, isHydrated],
  );

  const themeValues = THEME_TOKENS[resolvedScheme].variables;

  if (!isHydrated) return null;

  return (
    <ThemeContext.Provider value={value}>
      <VariableContextProvider value={themeValues}>
        <View style={{ flex: 1 }} className={isDark ? 'dark' : ''}>
          {children}
          {transition && (
            <ThemeTransitionOverlay
              fromBg={transition.fromBg}
              origin={transition.origin}
              onComplete={() => setTransition(null)}
            />
          )}
        </View>
      </VariableContextProvider>
    </ThemeContext.Provider>
  );
};
