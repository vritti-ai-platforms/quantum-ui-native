// Inject as --shadow-* directly — NativeWind's box-shadow resolver only unwraps one var() level, so --shadow-sm → var(--shd-sm) → value fails.

const lightShadows = {
  '--shadow-2xs': '0 1px 2px 0 hsl(214 68.75% 12.55% / 0.03)',
  '--shadow-xs': '0 1px 3px 0 hsl(214 68.75% 12.55% / 0.04)',
  '--shadow-sm': '0 1px 2px 0 hsl(214 68.75% 12.55% / 0.04), 0 1px 3px 0 hsl(214 68.75% 12.55% / 0.03)',
  '--shadow': '0 1px 3px 0 hsl(214 68.75% 12.55% / 0.05), 0 1px 2px -1px hsl(214 68.75% 12.55% / 0.04)',
  '--shadow-md': '0 4px 6px -1px hsl(214 68.75% 12.55% / 0.05), 0 2px 4px -2px hsl(214 68.75% 12.55% / 0.04)',
  '--shadow-lg': '0 10px 15px -3px hsl(214 68.75% 12.55% / 0.05), 0 4px 6px -4px hsl(214 68.75% 12.55% / 0.04)',
  '--shadow-xl': '0 20px 25px -5px hsl(214 68.75% 12.55% / 0.05), 0 8px 10px -6px hsl(214 68.75% 12.55% / 0.04)',
  '--shadow-2xl': '0 25px 50px -12px hsl(214 68.75% 12.55% / 0.15)',
} as const;

const darkShadows = {
  '--shadow-2xs': '0 0.5rem 1.25rem 0.25rem hsl(0 0% 0% / 0.17)',
  '--shadow-xs': '0 0.5rem 1.25rem 0.25rem hsl(0 0% 0% / 0.17)',
  '--shadow-sm': '0 1px 3px 0 hsl(0 0% 0% / 0.15), 0 1px 2px -1px hsl(0 0% 0% / 0.15)',
  '--shadow': '0 0.5rem 1.25rem 0.25rem hsl(0 0% 0% / 0.35), 0 1px 2px -0.75px hsl(0 0% 0% / 0.35)',
  '--shadow-md': '0 0.5rem 1.25rem 0.25rem hsl(0 0% 0% / 0.35), 0 2px 4px -0.75px hsl(0 0% 0% / 0.35)',
  '--shadow-lg': '0 0.5rem 1.25rem 0.25rem hsl(0 0% 0% / 0.35), 0 4px 6px -0.75px hsl(0 0% 0% / 0.35)',
  '--shadow-xl': '0 0.5rem 1.25rem 0.25rem hsl(0 0% 0% / 0.35), 0 8px 10px -0.75px hsl(0 0% 0% / 0.35)',
  '--shadow-2xl': '0 0.5rem 1.25rem 0.25rem hsl(0 0% 0% / 0.88)',
} as const;

export { lightShadows, darkShadows };
