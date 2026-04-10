import type { HybridObject } from 'react-native-nitro-modules';

/**
 * QuantumUI Nitro HybridObject spec.
 *
 * Declare all native methods here. Run `pnpm nitrogen` after any change to
 * regenerate the Swift / Kotlin / C++ bridge code in nitrogen/generated/.
 */
export interface QuantumUI
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  multiply(a: number, b: number): number;
}
