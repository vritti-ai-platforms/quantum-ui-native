import { Platform } from 'react-native';

// Apple HIG / iOS 26 superellipse — chunkier, more pillowy than Material 3.
const iosRadii = {
  '--rad-sm': '10px',
  '--rad-md': '12px',
  '--rad-lg': '14px',
  '--rad-xl': '16px',
  '--rad-2xl': '20px',
  '--rad-3xl': '24px',
} as const;

const androidRadii = {
  '--rad-sm': '4px',
  '--rad-md': '6px',
  '--rad-lg': '8px',
  '--rad-xl': '10px',
  '--rad-2xl': '12px',
  '--rad-3xl': '14px',
} as const;

export const platformRadii = Platform.OS === 'android' ? androidRadii : iosRadii;
