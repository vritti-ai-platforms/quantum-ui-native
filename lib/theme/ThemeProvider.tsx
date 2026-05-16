import { VariableContextProvider } from 'nativewind';
import type React from 'react';
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance, Dimensions, Platform, useColorScheme as useSystemColorScheme, View } from 'react-native';
import { THEME, THEME_TOKENS } from './colors';
import { ThemeTransitionOverlay } from './ThemeTransitionOverlay';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ThemeStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  deleteItem?: (key: string) => Promise<void>;
}

export interface SetThemePreferenceOptions {
  /** Tap origin (screen-space px) for the reveal circle. Defaults to bottom-center. */
  origin?: { x: number; y: number };
  /** Skip the reveal animation (e.g. during hydration). Defaults to true. */
  animated?: boolean;
}

export interface ThemeContextValue {
  colorScheme: 'light' | 'dark';
  isDark: boolean;
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

// Applies the correct native appearance override.
// - 'light' / 'dark' → forces the scheme regardless of system on both platforms
// - 'system'         → passes null to release the override. Both iOS and modern
//                      Android (RN 0.74+) accept null and revert to the actual
//                      device scheme. The try/catch is a safety net for older
//                      Android builds where AppearanceModule.setColorScheme was
//                      @NonNull — there we degrade gracefully (the previous
//                      override stays for the session).
function applyAppearanceScheme(preference: ThemePreference): void {
  if (preference === 'system') {
    try {
      (Appearance.setColorScheme as (s: 'light' | 'dark' | null) => void)(null);
    } catch {
      // older Android: cannot release the override
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
    async (preference: ThemePreference, options?: SetThemePreferenceOptions) => {
      const animated = options?.animated !== false;

      // Apply the native appearance change FIRST. For 'system' this releases
      // any active override; for 'light' / 'dark' it sets the override. After
      // this synchronous call returns, `Appearance.getColorScheme()` reflects
      // the trait that's now in effect — not the stale override from before.
      applyAppearanceScheme(preference);

      // Compute the scheme that will actually be visible.
      // - For 'light' / 'dark', it's the preference itself.
      // - For 'system', it's whatever the device's real scheme is now that
      //   the override has been released. Reading via getColorScheme() here
      //   instead of the `liveSystemScheme` hook avoids a stale-value bug:
      //   the hook only updates on the next React tick after the Appearance
      //   change listener fires, but we need the new value *right now* to
      //   correctly decide whether to play the ripple. Without this, picking
      //   'system' from a forced theme silently skips the animation.
      const rawScheme = preference === 'system' ? Appearance.getColorScheme() : preference;
      const nextScheme: 'light' | 'dark' = rawScheme === 'dark' ? 'dark' : 'light';

      // Only animate when the resolved scheme actually changes — picking
      // 'system' on a device that already matches the current scheme has
      // no visible effect, so skipping the ripple is correct.
      if (animated && nextScheme !== resolvedScheme) {
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
    [storage, storageKey, resolvedScheme],
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
