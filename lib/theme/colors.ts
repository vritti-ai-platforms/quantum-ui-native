// Design tokens — HSL values matching the @vritti/quantum-ui (web) theme.
// Converted from OKLCH source values in quantum-ui/lib/index.css.
// Used by ThemeProvider via NativeWind's VariableContextProvider to inject CSS variables at runtime.

export const lightColors = {
  // ── Core palette ──────────────────────────────────────────────────────
  '--background': '0 0% 100%',
  '--foreground': '222 47% 11%',

  '--card': '0 0% 100%',
  '--card-foreground': '222 47% 11%',

  '--popover': '0 0% 100%',
  '--popover-foreground': '222 47% 11%',

  '--primary': '221 83% 53%',
  '--primary-foreground': '100% 0% 0%',

  '--secondary': '214 95% 93%',
  '--secondary-foreground': '221 83% 53%',

  '--muted': '214 32% 96%',
  '--muted-foreground': '215 16% 47%',

  '--accent': '214 60% 92%',
  '--accent-foreground': '221 83% 53%',

  '--destructive': '0 72% 51%',
  '--destructive-foreground': '0 0% 100%',

  '--warning': '45 93% 47%',
  '--warning-foreground': '222 47% 11%',

  '--success': '142 71% 45%',
  '--success-foreground': '0 0% 100%',

  '--info': '199 89% 48%',
  '--info-foreground': '0 0% 100%',

  '--border': '214 32% 91%',
  '--input': '214 32% 91%',
  '--ring': '221 83% 53%',

  // ── Chart colors ──────────────────────────────────────────────────────
  '--chart-1': '221 83% 53%',   // blue (primary)
  '--chart-2': '210 68% 60%',   // lighter blue
  '--chart-3': '162 47% 55%',   // teal-green
  '--chart-4': '43 90% 60%',    // amber
  '--chart-5': '22 78% 57%',    // orange

  // ── Sidebar ───────────────────────────────────────────────────────────
  '--sidebar': '210 40% 98%',
  '--sidebar-foreground': '222 47% 11%',
  '--sidebar-primary': '222 47% 11%',
  '--sidebar-primary-foreground': '0 0% 100%',
  '--sidebar-accent': '214 60% 92%',
  '--sidebar-accent-foreground': '222 47% 11%',
  '--sidebar-border': '214 32% 91%',
  '--sidebar-ring': '221 83% 53%',
} as const;

export const darkColors = {
  // ── Core palette ──────────────────────────────────────────────────────
  '--background': '224 71% 4%',
  '--foreground': '213 31% 91%',

  '--card': '224 71% 8%',
  '--card-foreground': '213 31% 91%',

  '--popover': '224 71% 4%',
  '--popover-foreground': '213 31% 91%',

  '--primary': '217 91% 60%',
  '--primary-foreground': '0 0% 100%',

  '--secondary': '222 47% 11%',
  '--secondary-foreground': '213 31% 91%',

  '--muted': '223 47% 11%',
  '--muted-foreground': '215 20% 65%',

  '--accent': '222 47% 11%',
  '--accent-foreground': '213 31% 91%',

  '--destructive': '0 63% 31%',
  '--destructive-foreground': '0 85% 97%',

  '--warning': '48 96% 53%',
  '--warning-foreground': '224 71% 4%',

  '--success': '142 76% 36%',
  '--success-foreground': '224 71% 4%',

  '--info': '199 89% 48%',
  '--info-foreground': '224 71% 4%',

  '--border': '216 34% 17%',
  '--input': '216 34% 17%',
  '--ring': '217 91% 60%',

  // ── Chart colors ──────────────────────────────────────────────────────
  '--chart-1': '217 91% 60%',   // blue (primary)
  '--chart-2': '210 65% 65%',   // lighter blue
  '--chart-3': '144 55% 54%',   // teal-green
  '--chart-4': '43 80% 65%',    // amber
  '--chart-5': '22 75% 57%',    // orange

  // ── Sidebar ───────────────────────────────────────────────────────────
  '--sidebar': '224 71% 4%',
  '--sidebar-foreground': '213 31% 91%',
  '--sidebar-primary': '217 91% 60%',
  '--sidebar-primary-foreground': '0 0% 100%',
  '--sidebar-accent': '222 47% 11%',
  '--sidebar-accent-foreground': '213 31% 91%',
  '--sidebar-border': '216 34% 17%',
  '--sidebar-ring': '217 91% 60%',
} as const;

// Navigation-safe theme colors (resolved HSL strings for StatusBar, NavigationBar, etc.)
export const NAV_THEME = {
  light: {
    background: 'hsl(0, 0%, 100%)',
    foreground: 'hsl(222, 47%, 11%)',
    primary: 'hsl(221, 83%, 53%)',
    card: 'hsl(0, 0%, 100%)',
    border: 'hsl(214, 32%, 91%)',
    notification: 'hsl(221, 83%, 53%)',
    muted: 'hsl(214, 32%, 96%)',
    sidebar: 'hsl(210, 40%, 98%)',
  },
  dark: {
    background: 'hsl(224, 71%, 4%)',
    foreground: 'hsl(213, 31%, 91%)',
    primary: 'hsl(217, 91%, 60%)',
    card: 'hsl(224, 71%, 8%)',
    border: 'hsl(216, 34%, 17%)',
    notification: 'hsl(217, 91%, 60%)',
    muted: 'hsl(223, 47%, 11%)',
    sidebar: 'hsl(224, 71%, 4%)',
  },
} as const;
