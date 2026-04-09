import { NitroModules } from 'react-native-nitro-modules';
import type { QuantumUI } from './QuantumUI.nitro';

const QuantumUIHybridObject =
  NitroModules.createHybridObject<QuantumUI>('QuantumUI');

export function multiply(a: number, b: number): number {
  return QuantumUIHybridObject.multiply(a, b);
}
