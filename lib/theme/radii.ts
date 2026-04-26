// Platform-aware border-radius tokens.
//
// These are injected at runtime by ThemeProvider via NativeWind's
// VariableContextProvider, mirroring how lightColors / darkColors are wired up.
// `lib/index.css` declares the Tailwind utilities (--radius-sm … --radius-3xl)
// as `var(--rad-*)` so they resolve to whichever scale we inject here.
//
// Why platform-aware: Apple HIG (and the iOS 26 superellipse) prefers chunkier,
// more pillowy radii than Material 3 for the same semantic role. Encoding that
// at the token layer means a single Tailwind class (`rounded-xl`) renders
// natively-correct on each platform without component-level branching.

import { Platform } from 'react-native';

// iOS HIG / iOS 26 superellipse — chunkier, more pillowy.
const iosRadii = {
  '--rad-sm': '10px',
  '--rad-md': '12px',
  '--rad-lg': '14px',
  '--rad-xl': '16px',
  '--rad-2xl': '20px',
  '--rad-3xl': '24px',
} as const;

// Material Design 3 shape scale — tighter, more geometric.
const androidRadii = {
  '--rad-sm': '4px',
  '--rad-md': '6px',
  '--rad-lg': '8px',
  '--rad-xl': '10px',
  '--rad-2xl': '12px',
  '--rad-3xl': '14px',
} as const;

// Resolved once at module load — Platform.OS is constant for the app lifetime.
// Web / unknown platforms fall through to the iOS scale.
export const platformRadii = Platform.OS === 'android' ? androidRadii : iosRadii;
