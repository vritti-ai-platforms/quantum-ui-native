import type { HybridObject } from 'react-native-nitro-modules';

// Run `pnpm nitrogen` after any change to regenerate Swift/Kotlin/C++ bridge code.
export interface QuantumUI
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  multiply(a: number, b: number): number;
}
