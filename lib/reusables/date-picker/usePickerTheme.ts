import { useUnstableNativeVariable } from 'nativewind';

const useVar = useUnstableNativeVariable as unknown as (name: string) => string | undefined;

// Resolve the native picker's theme from the MF-shared NativeWind variable context — NOT ThemeContext,
// which isn't reliably connected inside a micro-app remote (same reason Input/ScreenContainer resolve
// colors this way). Derives light/dark from the active `--background` lightness and accent from `--primary`.
export function usePickerTheme(): { themeVariant: 'light' | 'dark'; accentColor: string | undefined } {
  const background = useVar('--background');
  const primary = useVar('--primary');
  const lightness = background ? Number(background.trim().split(/\s+/)[2]?.replace('%', '')) : Number.NaN;
  const themeVariant = Number.isFinite(lightness) && lightness < 50 ? 'dark' : 'light';
  return { themeVariant, accentColor: primary ? `hsl(${primary})` : undefined };
}
