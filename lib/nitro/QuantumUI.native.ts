import { NitroModules } from 'react-native-nitro-modules';
import type { QuantumUI } from './specs/QuantumUI.nitro';

const QuantumUIModule =
  NitroModules.createHybridObject<QuantumUI>('QuantumUI');

export function multiply(a: number, b: number): number {
  return QuantumUIModule.multiply(a, b);
}
