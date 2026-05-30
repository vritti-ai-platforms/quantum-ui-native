import { VariableContextProvider } from 'nativewind';
import type React from 'react';
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, AppState, Platform, useColorScheme as useSystemColorScheme, View } from 'react-native';
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

// Compute a sensible default so useTheme() never throws when called outside a
// ThemeProvider (e.g. in an MF remote). ThemeProvider still overrides this
// entirely when mounted — the default only matters in the no-provider case.
function makeDefaultContextValue(): ThemeContextValue {
  const scheme = Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  return {
    colorScheme: scheme,
    isDark: scheme === 'dark',
    palette: THEME[scheme],
    themePreference: 'system',
    setThemePreference: async () => {},
    isHydrated: true,
  };
}

export const ThemeContext = createContext<ThemeContextValue>(makeDefaultContextValue());

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
    // Release any override so the OS scheme drives 'system'. iOS: null. Android: 'unspecified'
    // (= AppCompat MODE_NIGHT_FOLLOW_SYSTEM) — null throws on Android (@NonNull), and only
    // 'unspecified' lets useColorScheme() read the real device again.
    (Appearance.setColorScheme as (s: 'light' | 'dark' | 'unspecified' | null) => void)(
      Platform.OS === 'ios' ? null : 'unspecified',
    );
    return;
  }
  // Explicit light/dark: iOS applies the native override. Android is driven by React state only
  // (no native override → no AppCompat activity recreation on theme switches).
  if (Platform.OS === 'ios') {
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
  const [transition, setTransition] = useState<{ fromBg: string } | null>(null);
  // Preference awaiting the cover-first swap — applied by the overlay's onCovered, behind the opaque cover.
  const pendingRef = useRef<ThemePreference | null>(null);

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

  useEffect(() => {
    // Android invariant: AppCompat night mode must stay FOLLOW_SYSTEM, because the app themes
    // itself via React state. Clears any stale override left by a prior version/session so
    // useColorScheme() reflects the real device. 'unspecified' = MODE_NIGHT_FOLLOW_SYSTEM
    // (no-op / no recreation when already following the system).
    if (Platform.OS !== 'android') return;
    (Appearance.setColorScheme as (s: 'unspecified') => void)('unspecified');
  }, []);

  const resolvedScheme = resolveScheme(themePreference, liveSystemScheme, lastKnownSystemScheme);
  const isDark = resolvedScheme === 'dark';

  useEffect(() => {
    if (!storage) return;

    let isMounted = true;

    async function hydrateThemePreference() {
      try {
        // biome-ignore lint/style/noNonNullAssertion: <>
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

      // Decide whether the resolved scheme will actually change. Appearance is NOT
      // touched here — the real swap is deferred to applyPendingSwap (behind the cover),
      // so getColorScheme() is never transiently poisoned at decision time.
      let willChange = false;
      if (preference === 'system' && Platform.OS === 'ios') {
        // While an iOS override is active the true device scheme isn't readable; assume a change if currently overriding.
        willChange = themePreference !== 'system';
      } else {
        const rawScheme = preference === 'system' ? Appearance.getColorScheme() : preference;
        const nextScheme: 'light' | 'dark' = rawScheme === 'dark' ? 'dark' : 'light';
        willChange = nextScheme !== resolvedScheme;
      }

      if (animated && willChange && pendingRef.current == null) {
        // PHASE 1: raise the opaque cover over the CURRENT theme; defer the real swap.
        pendingRef.current = preference;
        setTransition({ fromBg: THEME[resolvedScheme].background });
      } else {
        // No new cover (no visible change / animated:false / a cover already mid-flight): swap now.
        // If a cover IS mid-flight, point its deferred swap at this latest preference too.
        if (pendingRef.current != null) pendingRef.current = preference;
        applyAppearanceScheme(preference);
        setThemePreferenceState(preference);
      }

      if (storage) {
        await storage.setItem(storageKey, preference);
      }
    },
    [storage, storageKey, resolvedScheme, themePreference],
  );

  // PHASE 2: invoked by the overlay once the opaque cover has painted — the swap
  // (iOS native Appearance re-theme + the Android surface remount via colorScheme) happens behind it.
  const applyPendingSwap = useCallback(() => {
    const preference = pendingRef.current;
    if (preference == null) return;
    applyAppearanceScheme(preference);
    setThemePreferenceState(preference);
  }, []);

  const finishTransition = useCallback(() => {
    pendingRef.current = null;
    setTransition(null);
  }, []);

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
              onCovered={applyPendingSwap}
              onComplete={finishTransition}
            />
          )}
        </View>
      </VariableContextProvider>
    </ThemeContext.Provider>
  );
};
