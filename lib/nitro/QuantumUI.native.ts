import { NitroModules } from 'react-native-nitro-modules';
import type { QuantumUI } from './specs/QuantumUI.nitro';

const QuantumUIModule =
  NitroModules.createHybridObject<QuantumUI>('QuantumUI');

export function multiply(a: number, b: number): number {
  return QuantumUIModule.multiply(a, b);
}

// Native SF Symbol → PNG data URI (see spec). Used by DynamicIcon on iOS via a Fabric-native <Image>.
export function renderSFSymbol(
  name: string,
  size: number,
  color: number,
  weight: string,
  multicolor: boolean,
): string {
  return QuantumUIModule.renderSFSymbol(name, size, color, weight, multicolor);
}
