import type { HybridObject } from 'react-native-nitro-modules';

// Run `pnpm nitrogen` after any change to regenerate Swift/Kotlin/C++ bridge code.
export interface QuantumUI
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  multiply(a: number, b: number): number;

  // Renders an SF Symbol (iOS) to a `data:image/png;base64,…` URI for display via RN's Fabric-native
  // <Image>, replacing the legacy react-native-sfsymbols Paper view manager (which crashed under Fabric on
  // unmount). `color` is a processColor()-style ARGB int; `weight` is an SF symbol weight string. Returns ''
  // if the symbol is unavailable (unknown name / iOS < 13) or on non-iOS platforms.
  renderSFSymbol(name: string, size: number, color: number, weight: string, multicolor: boolean): string;
}
