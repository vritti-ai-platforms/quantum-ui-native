import { platformRadii } from './radii';
import { darkShadows, lightShadows } from './shadows';

export const lightColors = {
  '--background': '0 0% 100%',
  '--foreground': '214.09 68.81% 12.55%',
  '--card': '0 0% 100%',
  '--card-foreground': '214.09 68.81% 12.55%',
  '--popover': '0 0% 100%',
  '--popover-foreground': '214.09 68.81% 12.55%',
  '--primary': '212.56 78.04% 50%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '211.93 100% 97.06%',
  '--secondary-foreground': '212.56 78.04% 50%',
  '--muted': '210 66.2% 97.64%',
  '--muted-foreground': '211.76 22.1% 45.3%',
  '--accent': '212.73 78.65% 94.52%',
  '--accent-foreground': '212.56 78.04% 50%',
  '--destructive': '359.99 72.24% 50.58%',
  '--destructive-foreground': '0 0% 100%',
  '--warning': '44.06 82.77% 46.59%',
  '--warning-foreground': '214.09 68.81% 12.55%',
  '--success': '124.51 38.16% 47.2%',
  '--success-foreground': '0 0% 100%',
  '--info': '183.46 100% 35.09%',
  '--info-foreground': '0 0% 100%',
  '--border': '210 75.13% 93.73%',
  '--input': '210 75.13% 93.73%',
  '--ring': '212.56 78.04% 50%',
  '--chart-1': '212.56 78.04% 50%',
  '--chart-2': '214.69 83.02% 65.29%',
  '--chart-3': '158.12 64.37% 51.56%',
  '--chart-4': '43.25 96.42% 56.29%',
  '--chart-5': '0 84.21% 60.19%',
  '--sidebar': '210.06 78.57% 98.25%',
  '--sidebar-foreground': '214.09 68.81% 12.55%',
  '--sidebar-primary': '214.09 68.81% 12.55%',
  '--sidebar-primary-foreground': '0 0% 100%',
  '--sidebar-accent': '209.87 98.75% 91.5%',
  '--sidebar-accent-foreground': '214.09 68.81% 12.55%',
  '--sidebar-border': '210 75.13% 93.73%',
  '--sidebar-ring': '212.56 78.04% 50%',
} as const;

export const darkColors = {
  '--background': '222.43 26.93% 3.12%',
  '--foreground': '210 39.97% 98.05%',

  '--card': '220.97 11.22% 9.71%',
  '--card-foreground': '210 39.97% 98.05%',

  '--popover': '222.43 26.93% 3.12%',
  '--popover-foreground': '210 39.97% 98.05%',

  '--primary': '215.85 88.56% 41.62%',
  '--primary-foreground': '0 0% 100%',

  '--secondary': '217.06 9.46% 16.41%',
  '--secondary-foreground': '210 39.97% 98.05%',

  '--muted': '220.97 11.22% 9.71%',
  '--muted-foreground': '215.04 8.43% 64.13%',

  '--accent': '217.06 9.46% 16.41%',
  '--accent-foreground': '210 39.97% 98.05%',

  '--destructive': '0 84.21% 60.19%',
  '--destructive-foreground': '0 0% 100%',

  '--warning': '46.74 82.86% 49.24%',
  '--warning-foreground': '222.43 26.93% 3.12%',

  '--success': '138.03 47.16% 49.36%',
  '--success-foreground': '222.43 26.93% 3.12%',

  '--info': '183.03 100% 39.48%',
  '--info-foreground': '222.43 26.93% 3.12%',

  '--border': '217.06 9.46% 16.41%',
  '--input': '217.06 9.46% 16.41%',
  '--ring': '215.85 88.56% 41.62%',

  '--chart-1': '215.85 88.56% 41.62%',
  '--chart-2': '213.12 93.9% 67.84%',
  '--chart-3': '122.42 39.42% 49.22%',
  '--chart-4': '45.02 100% 51.32%',
  '--chart-5': '1.36 77.2% 55.3%',

  '--sidebar': '222.43 26.93% 3.12%',
  '--sidebar-foreground': '210 39.97% 98.05%',
  '--sidebar-primary': '215.85 88.56% 41.62%',
  '--sidebar-primary-foreground': '0 0% 100%',
  '--sidebar-accent': '217.06 9.46% 16.41%',
  '--sidebar-accent-foreground': '210 39.97% 98.05%',
  '--sidebar-border': '217.06 9.46% 16.41%',
  '--sidebar-ring': '215.85 88.56% 41.62%',
} as const;

type ThemeTokens = Record<keyof typeof lightColors, string>;

export type ThemePalette = {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  card: string;
  border: string;
  notification: string;
  muted: string;
  sidebar: string;
  destructive: string;
};

function toHsl(value: string) {
  return `hsl(${value})`;
}

function createThemePalette(tokens: ThemeTokens): ThemePalette {
  return {
    background: toHsl(tokens['--background']),
    foreground: toHsl(tokens['--foreground']),
    primary: toHsl(tokens['--primary']),
    primaryForeground: toHsl(tokens['--primary-foreground']),
    secondary: toHsl(tokens['--secondary']),
    secondaryForeground: toHsl(tokens['--secondary-foreground']),
    accent: toHsl(tokens['--accent']),
    accentForeground: toHsl(tokens['--accent-foreground']),
    card: toHsl(tokens['--card']),
    border: toHsl(tokens['--border']),
    notification: toHsl(tokens['--ring']),
    muted: toHsl(tokens['--muted']),
    sidebar: toHsl(tokens['--sidebar']),
    destructive: toHsl(tokens['--destructive']),
  };
}

export const THEME = {
  light: createThemePalette(lightColors),
  dark: createThemePalette(darkColors),
} as const;

export const THEME_TOKENS = {
  light: {
    palette: THEME.light,
    variables: { ...lightColors, ...platformRadii, ...lightShadows },
  },
  dark: {
    palette: THEME.dark,
    variables: { ...darkColors, ...platformRadii, ...darkShadows },
  },
} as const;

export type ThemeScheme = keyof typeof THEME_TOKENS;
